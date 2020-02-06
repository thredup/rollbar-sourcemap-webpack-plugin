import expect, { isSpy, spyOn, createSpy } from 'expect';
import nock from 'nock';
import RollbarSourceMapPlugin from '../src/RollbarSourceMapPlugin';
import { ROLLBAR_ENDPOINT } from '../src/constants';

describe('RollbarSourceMapPlugin', function () {
  let compiler;
  let plugin;
  beforeEach(function () {
    compiler = {
      options: {},
      plugin: createSpy(),
      hooks: {
        afterEmit: {
          tapAsync: createSpy()
        },
      },
      resolvers: {
        loader: {
          plugin: createSpy(),
          resolve: createSpy(),
        },
        normal: {
          plugin: createSpy(),
          resolve: createSpy(),
        },
      },
    };

    const options = {
      accessToken: 'aaaabbbbccccddddeeeeffff00001111',
      version: 'master-latest-sha',
      publicPath: 'https://my.cdn.net/assets'
    };

    plugin = new RollbarSourceMapPlugin(options);
  });

  describe('constructor', function () {
    it('returns an instance', function () {
      expect(plugin).toBeA(RollbarSourceMapPlugin);
    });

    it('sets options', function () {
      const options = Object.assign({}, this.options, {
        includeChunks: ['foo', 'bar'],
        silent: true
      });
      plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).toInclude(options);
    });

    it('defaults silent to false', function () {
      expect(plugin).toInclude({ silent: false });
    });

    it('defaults includeChunks to []', function () {
      expect(plugin).toInclude({ includeChunks: [] });
    });

    it('accepts string value for includeChunks', function () {
      const options = Object.assign({}, this.options, { includeChunks: 'foo' });
      plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).toInclude({ includeChunks: ['foo'] });
    });

    it('accepts array value for includeChunks', function () {
      const options = Object.assign({}, this.options, {
        includeChunks: ['foo', 'bar']
      });
      plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).toInclude({ includeChunks: ['foo', 'bar'] });
    });

    it('defaults rollbarEndpoint to ROLLBAR_ENDPOINT constant', function () {
      expect(plugin).toInclude({ rollbarEndpoint: ROLLBAR_ENDPOINT });
    });

    it('access string value for rollbarEndpoint', function () {
      const customEndpoint = 'https://api.rollbar.custom.com/api/1/sourcemap';
      const options = Object.assign({}, this.options, { rollbarEndpoint: customEndpoint });
      plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).toInclude({ rollbarEndpoint: customEndpoint });
    });
  });

  describe('apply', function () {
    it('hooks into "after-emit"', function () {
      plugin.apply(compiler);
      expect(compiler.hooks.afterEmit.tapAsync.calls.length).toBe(1);
      expect(compiler.hooks.afterEmit.tapAsync.calls[0].arguments).toEqual([
        'after-emit',
        plugin.afterEmit.bind(plugin)
      ]);
    });

    it('plugs into `after-emit" when "hooks" is undefined', function () {
      delete compiler.hooks;
      plugin.apply(compiler);
      expect(compiler.plugin.calls.length).toBe(1);
      expect(compiler.plugin.calls[0].arguments).toEqual([
        'after-emit',
        plugin.afterEmit.bind(plugin)
      ]);
    });
  });

  describe('afterEmit', function () {
    let uploadSourceMaps;
    beforeEach(function () {
      uploadSourceMaps = spyOn(plugin, 'uploadSourceMaps')
        .andCall((compilation, callback) => callback());
    });

    afterEach(function () {
      if (isSpy(this.uploadSourceMaps)) {
        this.uploadSourceMaps.restore();
      }
    });

    it('calls uploadSourceMaps', function (done) {
      const compilation = {
        errors: [],
        warnings: []
      };

      plugin.afterEmit(compilation, () => {
        expect(uploadSourceMaps.calls.length).toBe(1);
        expect(compilation.errors.length).toBe(0);
        expect(compilation.warnings.length).toBe(0);
        done();
      });
    });

    it('adds upload warnings to compilation warnings, ' +
      'if ignoreErrors is true and silent is false', function (done) {
      const compilation = {
        errors: [],
        warnings: []
      };
      plugin.ignoreErrors = true;
      plugin.silent = false;
      uploadSourceMaps = spyOn(plugin, 'uploadSourceMaps')
        .andCall((comp, callback) => callback(new Error()));
      plugin.afterEmit(compilation, () => {
        expect(uploadSourceMaps.calls.length).toBe(1);
        expect(compilation.errors.length).toBe(0);
        expect(compilation.warnings.length).toBe(1);
        expect(compilation.warnings[0]).toBeA(Error);
        done();
      });
    });

    it('does not add upload errors to compilation warnings if silent is true', function (done) {
      const compilation = {
        errors: [],
        warnings: []
      };
      plugin.ignoreErrors = true;
      plugin.silent = true;
      uploadSourceMaps = spyOn(plugin, 'uploadSourceMaps')
        .andCall((comp, callback) => callback(new Error()));
      plugin.afterEmit(compilation, () => {
        expect(uploadSourceMaps.calls.length).toBe(1);
        expect(compilation.errors.length).toBe(0);
        expect(compilation.warnings.length).toBe(0);
        done();
      });
    });

    it('adds upload errors to compilation errors', function (done) {
      const compilation = {
        errors: [],
        warnings: []
      };
      plugin.ignoreErrors = false;
      uploadSourceMaps = spyOn(plugin, 'uploadSourceMaps')
        .andCall((comp, callback) => callback(new Error()));
      plugin.afterEmit(compilation, () => {
        expect(uploadSourceMaps.calls.length).toBe(1);
        expect(compilation.warnings.length).toBe(0);
        expect(compilation.errors.length).toBe(1);
        expect(compilation.errors[0]).toBeA(Error);
        done();
      });
    });

    it('adds validation errors to compilation', function (done) {
      const compilation = {
        errors: [],
        warnings: []
      };

      plugin = new RollbarSourceMapPlugin({
        version: 'master-latest-sha',
        publicPath: 'https://my.cdn.net/assets'
      });

      plugin.afterEmit(compilation, () => {
        expect(uploadSourceMaps.calls.length).toBe(0);
        expect(compilation.errors.length).toBe(1);
        done();
      });
    });
  });

  describe('getPublicPath', function() {
    let defaultOptions;
    let sourceFile;

    beforeEach(function() {
      defaultOptions = {
        accessToken: 'aaaabbbbccccddddeeeeffff00001111',
        version: 'master-latest-sha',
        publicPath: 'https://my.cdn.net/assets/'
      };
      sourceFile = 'vendor.5190.js';
    });

    it('returns \'publicPath\' value if it\'s a string', function() {
      plugin = new RollbarSourceMapPlugin(defaultOptions);
      const result = plugin.getPublicPath(sourceFile);
      expect(result).toBe('https://my.cdn.net/assets/vendor.5190.js');
    });

    it('handles \'publicPath\' string without trailing /', function() {
      const options = Object.assign({}, defaultOptions, {
        publicPath: 'https://my.cdn.net/assets'
      });
      plugin = new RollbarSourceMapPlugin(options);
      const result = plugin.getPublicPath(sourceFile);
      expect(result).toBe('https://my.cdn.net/assets/vendor.5190.js');
    });

    it('returns whatever is returned by publicPath argument when it\'s a function', function () {
      const options = Object.assign({}, defaultOptions, {
        publicPath: srcFile => `https://my.function.proxy.cdn/assets/${srcFile}`
      });
      plugin = new RollbarSourceMapPlugin(options);
      const result = plugin.getPublicPath(sourceFile);
      expect(result).toBe('https://my.function.proxy.cdn/assets/vendor.5190.js');
    });

    it('returns whatever is returned by publicPath argument when it\'s a function', function () {
      const options = Object.assign({}, defaultOptions, {
        publicPath: srcFile => `https://my.function.proxy.cdn/assets/${srcFile}`
      });
      plugin = new RollbarSourceMapPlugin(options);
      const result = plugin.getPublicPath(sourceFile);
      expect(result).toBe('https://my.function.proxy.cdn/assets/vendor.5190.js');
    });
  });

  describe('getAssets', function () {
    let chunks;
    let compilation;
    beforeEach(function () {
      chunks = [
        {
          id: 0,
          names: ['vendor'],
          files: ['vendor.5190.js', 'vendor.5190.js.map']
        }, {
          id: 1,
          names: ['app'],
          files: ['app.81c1.js', 'app.81c1.js.map']
        }
      ];

      compilation = {
        getStats: () => ({
          toJson: () => ({ chunks })
        })
      };
    });

    it('returns an array of js, sourcemap tuples', function () {
      const assets = plugin.getAssets(compilation);
      expect(assets).toEqual([
        { sourceFile: 'vendor.5190.js', sourceMap: 'vendor.5190.js.map' },
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ]);
    });

    it('ignores chunks that do not have a sourcemap asset', function () {
      chunks = [
        {
          id: 0,
          names: ['vendor'],
          files: ['vendor.5190.js']
        }, {
          id: 1,
          names: ['app'],
          files: ['app.81c1.js', 'app.81c1.js.map']
        }
      ];
      const assets = plugin.getAssets(compilation);
      expect(assets).toEqual([
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ]);
    });

    it('includes unnamed chunks when includeChunks is not specified', function () {
      chunks = [
        {
          id: 0,
          names: ['vendor'],
          files: ['vendor.5190.js', 'vendor.5190.js.map']
        }, {
          id: 1,
          names: [],
          files: ['1.cfea.js', '1.cfea.js.map']
        }, {
          id: 2,
          names: [],
          files: ['2-a364.js', '2-a364.js.map']
        }, {
          id: 3,
          names: ['app'],
          files: ['app.81c1.js', 'app.81c1.js.map']
        }
      ];
      const assets = plugin.getAssets(compilation);
      expect(assets).toEqual([
        { sourceFile: 'vendor.5190.js', sourceMap: 'vendor.5190.js.map' },
        { sourceFile: '1.cfea.js', sourceMap: '1.cfea.js.map' },
        { sourceFile: '2-a364.js', sourceMap: '2-a364.js.map' },
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ]);
    });

    it('filters out chunks that are not in includeChunks', function () {
      plugin.includeChunks = ['app'];
      const assets = plugin.getAssets(compilation);
      expect(assets).toEqual([
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ]);
    });
  });

  describe('uploadSourceMaps', function () {
    let compilation;
    let assets;
    let getAssets;
    let uploadSourceMap;

    beforeEach(function () {
      compilation = { name: 'test', errors: [] };
      assets = [
        { sourceFile: 'vendor.5190.js', sourceMap: 'vendor.5190.js.map' },
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ];
      getAssets = spyOn(plugin, 'getAssets').andReturn(assets);
      uploadSourceMap = spyOn(plugin, 'uploadSourceMap')
        .andCall((comp, chunk, callback) => callback());
    });

    afterEach(function () {
      [getAssets, uploadSourceMap].forEach((func) => {
        if (isSpy(func)) {
          func.restore();
        }
      });
    });

    it('calls uploadSourceMap for each chunk', function (done) {
      plugin.uploadSourceMaps(compilation, (err) => {
        if (err) {
          return done(err);
        }
        expect(getAssets.calls.length).toBe(1);
        expect(compilation.errors.length).toBe(0);
        expect(uploadSourceMap.calls.length).toBe(2);

        expect(uploadSourceMap.calls[0].arguments[0])
          .toEqual({ name: 'test', errors: [] });
        expect(uploadSourceMap.calls[0].arguments[1])
          .toEqual({ sourceFile: 'vendor.5190.js', sourceMap: 'vendor.5190.js.map' });

        expect(uploadSourceMap.calls[1].arguments[0])
          .toEqual({ name: 'test', errors: [] });
        expect(uploadSourceMap.calls[1].arguments[1])
          .toEqual({ sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' });
        done();
      });
    });

    it('calls err-back if uploadSourceMap errors', function (done) {
      uploadSourceMap = spyOn(plugin, 'uploadSourceMap')
        .andCall((comp, chunk, callback) => callback(new Error()));
      plugin.uploadSourceMaps(compilation, (err, result) => {
        expect(err).toExist();
        expect(err).toBeA(Error);
        expect(result).toBe(undefined);
        done();
      });
    });
  });

  describe('uploadSourceMap', function () {
    const info = spyOn(console, 'info');
    let compilation;
    let chunk;
    beforeEach(function () {
      compilation = {
        assets: {
          'vendor.5190.js.map': { source: () => '{"version":3,"sources":[]' },
          'app.81c1.js.map': { source: () => '{"version":3,"sources":[]' }
        },
        errors: []
      };

      chunk = {
        sourceFile: 'vendor.5190.js',
        sourceMap: 'vendor.5190.js.map'
      };
    });

    afterEach(function () {
      info.reset();
    });

    it('callback without err param if upload is success', function (done) {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(200, JSON.stringify({ err: 0, result: 'master-latest-sha' }));

      plugin.uploadSourceMap(compilation, chunk, (err) => {
        if (err) {
          return done(err);
        }
        expect(info).toHaveBeenCalledWith('Uploaded vendor.5190.js.map to Rollbar');
        done();
      });
    });

    it('does not log upload to console if silent option is true', function (done) {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(200, JSON.stringify({ err: 0, result: 'master-latest-sha' }));

      plugin.silent = true;
      plugin.uploadSourceMap(compilation, chunk, (err) => {
        if (err) {
          return done(err);
        }
        expect(info).toNotHaveBeenCalled();
        done();
      });
    });

    it('logs upload to console if silent option is false', function (done) {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(200, JSON.stringify({ err: 0, result: 'master-latest-sha' }));

      plugin.silent = false;
      plugin.uploadSourceMap(compilation, chunk, (err) => {
        if (err) {
          return done(err);
        }
        expect(info).toHaveBeenCalledWith('Uploaded vendor.5190.js.map to Rollbar');
        done();
      });
    });

    it('returns error message if failure response includes message', function (done) {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(422, JSON.stringify({ err: 1, message: 'missing source_map file upload' }));

      plugin.uploadSourceMap(compilation, chunk, (err) => {
        expect(err).toExist();
        expect(err).toInclude({
          message: 'failed to upload vendor.5190.js.map to Rollbar: missing source_map file upload'
        });
        done();
      });
    });

    it('handles error response with empty body', function (done) {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(422, null);

      plugin.uploadSourceMap(compilation, chunk, (err) => {
        expect(err).toExist();
        expect(err.message).toMatch(/failed to upload vendor\.5190.js\.map to Rollbar: [\w\s]+/);
        done();
      });
    });

    it('handles HTTP request error', function (done) {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .replyWithError('something awful happened');

      plugin.uploadSourceMap(compilation, chunk, (err) => {
        expect(err).toExist();
        expect(err).toInclude({
          message: 'failed to upload vendor.5190.js.map to Rollbar: something awful happened'
        });
        done();
      });
    });
  });
});
