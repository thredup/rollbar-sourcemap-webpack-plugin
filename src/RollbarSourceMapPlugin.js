import async from 'async';
// import request from 'request';
import find from 'lodash.find';
import reduce from 'lodash.reduce';
import { /* ROLLBAR_ENDPOINT, */ ROLLBAR_REQ_FIELDS } from './helpers';

class RollbarSourceMapPlugin {
  constructor({ accessToken, version, publicPath, includeChunks = [] }) {
    this.accessToken = accessToken;
    this.version = version;
    this.publicPath = publicPath;
    this.includeChunks = [].concat(includeChunks);
  }

  apply(compiler) {
    compiler.plugin('after-emit', (compilation, cb) => {
      ROLLBAR_REQ_FIELDS.forEach(field => {
        if (!this[field]) {
          compilation.errors.push(
            new Error(`RollbarSourceMapPlugin: required field '${field}' is missing.`)
          );
        }
      });

      this.uploadSourceMaps(compilation, (err) => {
        if (err) {
          console.log('error in uploadSourceMaps', err);
        } else {
          console.log('upload success');
        }
        cb();
      });
    });
  }

  getAssets(compilation) {
    const { includeChunks } = this;
    const { assetsByChunkName } = compilation.getStats().toJson();

    return reduce(assetsByChunkName, (result, assets, chunkName) => {
      if (includeChunks.length && includeChunks.indexOf(chunkName) === -1) {
        return result;
      }

      const sourceFile = find(assets, asset => /\.js$/.test(asset));
      const sourceMap = find(assets, asset => /\.js\.map$/.test(asset));

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
    const formData = {
      access_token: this.accessToken,
      version: this.version,
      minified_url: `${this.publicPath}/${sourceFile}`,
      // source_map: compilation.assets[sourceMap].source()
    };

    console.log({ formData });

    // request.post({
    //   url: ROLLBAR_ENDPOINT,
    //   formData
    // }, cb);
    setTimeout(() => cb(null), 200);
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
