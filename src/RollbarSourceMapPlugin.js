import fetch from 'node-fetch';
import FormData from 'form-data';
import isString from 'lodash.isstring';
import VError from 'verror';
import { handleError, validateOptions } from './helpers';
import { PLUGIN_NAME, ROLLBAR_ENDPOINT } from './constants';

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
    this.emittedAssets = new Map();
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

  assetEmitted(file, content) {
    this.emittedAssets.set(file, content);
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tapPromise(PLUGIN_NAME, this.afterEmit.bind(this));

    // Support older versions of webpack 4
    if (compiler.hooks.assetEmitted) {
      compiler.hooks.assetEmitted.tap(
        PLUGIN_NAME,
        this.assetEmitted.bind(this)
      );
    }
  }

  getAssets(compilation) {
    const { includeChunks, encodeFilename } = this;
    const { chunks } = compilation.getStats().toJson();

    return chunks.reduce((result, chunk) => {
      const chunkName = chunk.names[0];
      if (includeChunks.length && includeChunks.indexOf(chunkName) === -1) {
        return result;
      }

      const sourceFile = chunk.files.find(file => /\.js$/.test(file));
      const sourceMap = chunk.files.find(file => /\.js\.map$/.test(file));

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
    }, []);
  }

  getPublicPath(sourceFile) {
    if (isString(this.publicPath)) {
      const sep = this.publicPath.endsWith('/') ? '' : '/';
      return `${this.publicPath}${sep}${sourceFile}`;
    }
    return this.publicPath(sourceFile);
  }

  async uploadSourceMap(compilation, asset) {
    const { sourceFile, sourceMap } = asset;
    const content =
      this.emittedAssets.get(sourceMap) ||
      compilation.assets[sourceMap].source();
    const errMessage = `failed to upload ${sourceMap} to Rollbar`;
    const form = new FormData();

    form.append('access_token', this.accessToken);
    form.append('version', this.version);
    form.append('minified_url', this.getPublicPath(sourceFile));
    form.append('source_map', content, {
      filename: sourceMap,
      contentType: 'application/json'
    });

    let res;
    try {
      res = await fetch(this.rollbarEndpoint, {
        method: 'POST',
        body: form
      });
    } catch (err) {
      // Network or operational errors
      throw new VError(err, errMessage);
    }

    // 4xx or 5xx response
    if (!res.ok) {
      // Attempt to parse error details from response
      let details;
      try {
        const body = await res.json();
        details = body?.message ?? `${res.status} - ${res.statusText}`;
      } catch (parseErr) {
        details = `${res.status} - ${res.statusText}`;
      }

      throw new Error(`${errMessage}: ${details}`);
    }

    // Success
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
    return Promise.all(
      assets.map(asset => this.uploadSourceMap(compilation, asset))
    );
  }
}

module.exports = RollbarSourceMapPlugin;
