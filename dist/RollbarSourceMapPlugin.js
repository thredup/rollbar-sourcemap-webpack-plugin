"use strict";

var _fs = require("fs");

var _path = require("path");

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

var _formData = _interopRequireDefault(require("form-data"));

var _lodash = _interopRequireDefault(require("lodash.isstring"));

var _verror = _interopRequireDefault(require("verror"));

var _helpers = require("./helpers");

var _constants = require("./constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class RollbarSourceMapPlugin {
  constructor({
    accessToken,
    version,
    publicPath,
    includeChunks = [],
    silent = false,
    ignoreErrors = false,
    rollbarEndpoint = _constants.ROLLBAR_ENDPOINT,
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
    const errors = (0, _helpers.validateOptions)(this);

    if (errors) {
      compilation.errors.push(...(0, _helpers.handleError)(errors));
      return;
    }

    try {
      await this.uploadSourceMaps(compilation);
    } catch (err) {
      if (!this.ignoreErrors) {
        compilation.errors.push(...(0, _helpers.handleError)(err));
      } else if (!this.silent) {
        compilation.warnings.push(...(0, _helpers.handleError)(err));
      }
    }
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise(_constants.PLUGIN_NAME, this.afterEmit.bind(this));
  } // eslint-disable-next-line class-methods-use-this


  getAssetPath(compilation, name) {
    return (0, _path.join)(compilation.getPath(compilation.compiler.outputPath), name.split('?')[0]);
  }

  getSource(compilation, name) {
    const path = this.getAssetPath(compilation, name);
    return _fs.promises.readFile(path, {
      encoding: 'utf-8'
    });
  }

  getAssets(compilation) {
    const {
      includeChunks,
      encodeFilename
    } = this;
    const {
      chunks
    } = compilation.getStats().toJson();
    return chunks.reduce((result, chunk) => {
      const chunkName = chunk.names[0];

      if (includeChunks.length && includeChunks.indexOf(chunkName) === -1) {
        return result;
      }

      const sourceFile = chunk.files.concat(chunk.auxiliaryFiles || []).find(file => /\.js$/.test(file));
      const sourceMap = chunk.files.concat(chunk.auxiliaryFiles || []).find(file => /\.js\.map$/.test(file));

      if (!sourceFile || !sourceMap) {
        return result;
      }

      return [...result, {
        sourceFile: encodeFilename ? encodeURI(sourceFile) : sourceFile,
        sourceMap
      }];
    }, []);
  }

  getPublicPath(sourceFile) {
    if ((0, _lodash.default)(this.publicPath)) {
      const sep = this.publicPath.endsWith('/') ? '' : '/';
      return `${this.publicPath}${sep}${sourceFile}`;
    }

    return this.publicPath(sourceFile);
  }

  async uploadSourceMap(compilation, {
    sourceFile,
    sourceMap
  }) {
    const errMessage = `failed to upload ${sourceMap} to Rollbar`;
    let sourceMapSource;

    try {
      sourceMapSource = await this.getSource(compilation, sourceMap);
    } catch (err) {
      throw new _verror.default(err, errMessage);
    }

    const form = new _formData.default();
    form.append('access_token', this.accessToken);
    form.append('version', this.version);
    form.append('minified_url', this.getPublicPath(sourceFile));
    form.append('source_map', sourceMapSource, {
      filename: sourceMap,
      contentType: 'application/json'
    });
    let res;

    try {
      res = await (0, _nodeFetch.default)(this.rollbarEndpoint, {
        method: 'POST',
        body: form
      });
    } catch (err) {
      // Network or operational errors
      throw new _verror.default(err, errMessage);
    } // 4xx or 5xx response


    if (!res.ok) {
      // Attempt to parse error details from response
      let details;

      try {
        var _body$message;

        const body = await res.json();
        details = (_body$message = body === null || body === void 0 ? void 0 : body.message) !== null && _body$message !== void 0 ? _body$message : `${res.status} - ${res.statusText}`;
      } catch (parseErr) {
        details = `${res.status} - ${res.statusText}`;
      }

      throw new Error(`${errMessage}: ${details}`);
    } // Success


    if (!this.silent) {
      // eslint-disable-next-line no-console
      console.info(`Uploaded ${sourceMap} to Rollbar`);
    }
  }

  uploadSourceMaps(compilation) {
    const assets = this.getAssets(compilation);
    /* istanbul ignore next */

    if (assets.length > 0) {
      process.stdout.write('\n');
    }

    return Promise.all(assets.map(asset => this.uploadSourceMap(compilation, asset)));
  }

}

module.exports = RollbarSourceMapPlugin;