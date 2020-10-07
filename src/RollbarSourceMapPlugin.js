import fetch from 'node-fetch';
import FormData from 'form-data';
import find from 'lodash.find';
import isString from 'lodash.isstring';
import reduce from 'lodash.reduce';
import VError from 'verror';
import { handleError, validateOptions } from './helpers';
import { ROLLBAR_ENDPOINT } from './constants';

class RollbarSourceMapPlugin {
  constructor({
    accessToken,
    version,
    publicPath,
    includeChunks = [],
    silent = false,
    ignoreErrors = false,
    rollbarEndpoint = ROLLBAR_ENDPOINT,
    encodeFilename = false
  }) {
    this.accessToken = accessToken;
    this.version = version;
    this.publicPath = publicPath;
    this.includeChunks = [].concat(includeChunks);
    this.silent = silent;
    this.ignoreErrors = ignoreErrors;
    this.rollbarEndpoint = rollbarEndpoint;
    this.encodeFilename = encodeFilename;
  }

  async afterEmit(compilation) {
    const errors = validateOptions(this);

    if (errors) {
      compilation.errors.push(...handleError(errors));
      return;
    }

    try {
      await this.uploadSourceMaps(compilation);
    } catch (err) {
      if (!this.ignoreErrors) {
        compilation.errors.push(...handleError(err));
      } else if (!this.silent) {
        compilation.warnings.push(...handleError(err));
      }
    }
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise(
      'after-emit',
      this.afterEmit.bind(this)
    );
  }

  getAssets(compilation) {
    const { includeChunks, encodeFilename } = this;
    const { chunks } = compilation.getStats().toJson();

    return reduce(
      chunks,
      (result, chunk) => {
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
          {
            sourceFile: encodeFilename ? encodeURI(sourceFile) : sourceFile,
            sourceMap
          }
        ];
      },
      []
    );
  }

  getPublicPath(sourceFile) {
    if (isString(this.publicPath)) {
      const sep = this.publicPath.endsWith('/') ? '' : '/';
      return `${this.publicPath}${sep}${sourceFile}`;
    }
    return this.publicPath(sourceFile);
  }

  async uploadSourceMap(compilation, { sourceFile, sourceMap }) {
    const form = new FormData();

    form.append('access_token', this.accessToken);
    form.append('version', this.version);
    form.append('minified_url', this.getPublicPath(sourceFile));
    form.append('source_map', compilation.assets[sourceMap].source(), {
      filename: sourceMap,
      contentType: 'application/json'
    });

    try {
      const res = await fetch(this.rollbarEndpoint, {
        method: 'POST',
        body: form
      });
      if (res.ok) {
        if (!this.silent) {
          // eslint-disable-next-line no-console
          console.info(`Uploaded ${sourceMap} to Rollbar`);
        }
        return;
      }

      let message;
      try {
        const text = await res.text();
        ({ message } = JSON.parse(text));
      } catch (_parseErr) {
        // Error parsing response
      }
      throw new Error(message);
    } catch (err) {
      throw new VError(err, `failed to upload ${sourceMap} to Rollbar`);
    }
  }

  uploadSourceMaps(compilation) {
    const assets = this.getAssets(compilation);

    /* istanbul ignore if */
    if (assets.length > 0) {
      process.stdout.write('\n');
    }
    return Promise.all(
      assets.map(asset => this.uploadSourceMap(compilation, asset))
    );
  }
}

module.exports = RollbarSourceMapPlugin;
