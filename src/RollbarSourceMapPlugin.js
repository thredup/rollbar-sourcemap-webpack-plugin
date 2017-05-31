import async from 'async';
import request from 'request';
import VError from 'verror';
import find from 'lodash.find';
import reduce from 'lodash.reduce';
import { handleError, validateOptions } from './helpers';
import { ROLLBAR_ENDPOINT } from './constants';

class RollbarSourceMapPlugin {
  constructor({
    accessToken,
    version,
    publicPath,
    transform,
    includeChunks = [],
    silent = false,
    ignoreErrors = false
  }) {
    this.accessToken = accessToken;
    this.version = version;
    this.publicPath = publicPath;
    this.transform = transform;
    this.includeChunks = [].concat(includeChunks);
    this.silent = silent;
    this.ignoreErrors = ignoreErrors;
  }

  afterEmit(compilation, cb) {
    const errors = validateOptions(this);

    if (errors) {
      compilation.errors.push(...handleError(errors));
      return cb();
    }

    this.uploadSourceMaps(compilation, (err) => {
      if (err) {
        if (!this.ignoreErrors) {
          compilation.errors.push(...handleError(err));
        } else if (!this.silent) {
          compilation.warnings.push(...handleError(err));
        }
      }
      cb();
    });
  }

  apply(compiler) {
    compiler.plugin('after-emit', this.afterEmit.bind(this));
  }

  getAssets(compilation) {
    const { includeChunks } = this;
    const { chunks } = compilation.getStats().toJson();

    return reduce(chunks, (result, chunk) => {
      const chunkName = chunk.names[0];
      if (includeChunks.length && includeChunks.indexOf(chunkName) === -1) {
        return result;
      }

      const sourceFile = find(chunk.files, file => /\.js$/.test(file));
      const sourceMap = find(chunk.files, file => /\.js\.map$/.test(file));

      if (!sourceFile || !sourceMap) {
        return result;
      }

      return [
        ...result,
        { sourceFile, sourceMap }
      ];
    }, {});
  }

  uploadSourceMap(compilation, { sourceFile, sourceMap }, cb) {
    const req = request.post(ROLLBAR_ENDPOINT, (err, res, body) => {
      if (!err && res.statusCode === 200) {
        if (!this.silent) {
          console.info(`Uploaded ${sourceMap} to Rollbar`); // eslint-disable-line no-console
        }
        return cb();
      }

      const errMessage = `failed to upload ${sourceMap} to Rollbar`;
      if (err) {
        return cb(new VError(err, errMessage));
      }

      try {
        const { message } = JSON.parse(body);
        return cb(new Error(message ? `${errMessage}: ${message}` : errMessage));
      } catch (parseErr) {
        return cb(new VError(parseErr, errMessage));
      }
    });

    // transform sourceFile and sourceMap names
    let transformResults;
    if (this.transform) {
      transformResults = this.transform(
        sourceFile,
        sourceMap,
        compilation.assets[sourceFile].source()
      );
    }

    const form = req.form();
    form.append('access_token', this.accessToken);
    form.append('version', this.version);
    form.append('minified_url', `${this.publicPath}/${transformResults.sourceFile || sourceFile}`);
    form.append('source_map', compilation.assets[sourceMap].source(), {
      filename: transformResults.sourceMap || sourceMap,
      contentType: 'application/json'
    });
  }

  uploadSourceMaps(compilation, cb) {
    const assets = this.getAssets(compilation);
    const upload = this.uploadSourceMap.bind(this, compilation);

    async.each(assets, upload, (err, results) => {
      if (err) {
        return cb(err);
      }
      return cb(null, results);
    });
  }
}

module.exports = RollbarSourceMapPlugin;
