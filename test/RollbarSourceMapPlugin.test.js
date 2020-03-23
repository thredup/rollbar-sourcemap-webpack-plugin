import nock from 'nock';
import RollbarSourceMapPlugin from '../src/RollbarSourceMapPlugin';
import { ROLLBAR_ENDPOINT } from '../src/constants';

describe('RollbarSourceMapPlugin', () => {
  let compiler;
  let defaultOptions;
  let plugin;

  beforeEach(() => {
    compiler = {
      options: {},
      plugin: jest.fn(),
      hooks: {
        afterEmit: {
          tapAsync: jest.fn()
        }
      },
      resolvers: {
        loader: {
          plugin: jest.fn(),
          resolve: jest.fn()
        },
        normal: {
          plugin: jest.fn(),
          resolve: jest.fn()
        }
      }
    };

    defaultOptions = {
      accessToken: 'aaaabbbbccccddddeeeeffff00001111',
      version: 'master-latest-sha',
      publicPath: 'https://my.cdn.net/assets'
    };

    plugin = new RollbarSourceMapPlugin(defaultOptions);
  });

  describe('constructor', () => {
    it('returns an instance', () => {
      expect(plugin).toBeInstanceOf(RollbarSourceMapPlugin);
    });

    it('sets options', () => {
      const options = {
        ...defaultOptions,
        includeChunks: ['foo', 'bar'],
        silent: true
      };
      plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).toMatchObject(options);
    });

    it('defaults silent to false', () => {
      expect(plugin.silent).toBe(false);
    });

    it('defaults includeChunks to []', () => {
      expect(plugin.includeChunks).toEqual([]);
    });

    it('accepts string value for includeChunks', () => {
      const options = { ...defaultOptions, includeChunks: 'foo' };
      plugin = new RollbarSourceMapPlugin(options);
      expect(plugin.includeChunks).toEqual(['foo']);
    });

    it('accepts array value for includeChunks', () => {
      const options = { ...defaultOptions, includeChunks: ['foo', 'bar'] };
      plugin = new RollbarSourceMapPlugin(options);
      expect(plugin.includeChunks).toEqual(['foo', 'bar']);
    });

    it('defaults rollbarEndpoint to ROLLBAR_ENDPOINT constant', () => {
      expect(plugin.rollbarEndpoint).toEqual(ROLLBAR_ENDPOINT);
    });

    it('access string value for rollbarEndpoint', () => {
      const customEndpoint = 'https://api.rollbar.custom.com/api/1/sourcemap';
      const options = { ...defaultOptions, rollbarEndpoint: customEndpoint };
      plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).toMatchObject({ rollbarEndpoint: customEndpoint });
    });
  });

  describe('apply', () => {
    it('hooks into "after-emit"', () => {
      plugin.apply(compiler);
      expect(compiler.hooks.afterEmit.tapAsync).toHaveBeenCalledWith(
        'after-emit',
        expect.any(Function)
      );
    });

    it('plugs into `after-emit" when "hooks" is undefined', () => {
      delete compiler.hooks;
      plugin.apply(compiler);
      expect(compiler.plugin).toHaveBeenCalledTimes(1);
      expect(compiler.plugin).toHaveBeenCalledWith(
        'after-emit',
        expect.any(Function)
      );
    });
  });

  describe('afterEmit', () => {
    let uploadSourceMaps;

    beforeEach(() => {
      uploadSourceMaps = jest
        .spyOn(plugin, 'uploadSourceMaps')
        .mockImplementation((_compilation, callback) => callback());
    });

    it('calls uploadSourceMaps', done => {
      const compilation = {
        errors: [],
        warnings: []
      };

      plugin.afterEmit(compilation, () => {
        expect(uploadSourceMaps).toHaveBeenCalledTimes(1);
        expect(compilation.errors.length).toBe(0);
        expect(compilation.warnings.length).toBe(0);
        done();
      });
    });

    it(
      'adds upload warnings to compilation warnings, ' +
        'if ignoreErrors is true and silent is false',
      done => {
        const compilation = {
          errors: [],
          warnings: []
        };
        const err = new Error();
        plugin.ignoreErrors = true;
        plugin.silent = false;
        uploadSourceMaps = jest
          .spyOn(plugin, 'uploadSourceMaps')
          .mockImplementation((_compilation, callback) => callback(err));
        plugin.afterEmit(compilation, () => {
          expect(uploadSourceMaps).toHaveBeenCalledTimes(1);
          expect(compilation.errors.length).toBe(0);
          expect(compilation.warnings.length).toBe(1);
          expect(compilation.warnings[0].cause()).toBe(err);
          done();
        });
      }
    );

    it('does not add upload errors to compilation warnings if silent is true', done => {
      const compilation = {
        errors: [],
        warnings: []
      };
      const err = new Error();
      plugin.ignoreErrors = true;
      plugin.silent = true;
      uploadSourceMaps = jest
        .spyOn(plugin, 'uploadSourceMaps')
        .mockImplementation((_comp, callback) => callback(err));
      plugin.afterEmit(compilation, () => {
        expect(uploadSourceMaps).toHaveBeenCalledTimes(1);
        expect(compilation.errors.length).toBe(0);
        expect(compilation.warnings.length).toBe(0);
        done();
      });
    });

    it('adds upload errors to compilation errors', done => {
      const compilation = {
        errors: [],
        warnings: []
      };
      const err = new Error();
      plugin.ignoreErrors = false;
      uploadSourceMaps = jest
        .spyOn(plugin, 'uploadSourceMaps')
        .mockImplementationOnce((_comp, callback) => callback(err));
      plugin.afterEmit(compilation, () => {
        expect(uploadSourceMaps).toHaveBeenCalledTimes(1);
        expect(compilation.warnings.length).toBe(0);
        expect(compilation.errors.length).toBe(1);
        expect(compilation.errors[0].cause()).toBe(err);
        done();
      });
    });

    it('adds validation errors to compilation', done => {
      const compilation = {
        errors: [],
        warnings: []
      };

      plugin = new RollbarSourceMapPlugin({
        version: 'master-latest-sha',
        publicPath: 'https://my.cdn.net/assets'
      });

      plugin.afterEmit(compilation, () => {
        expect(uploadSourceMaps).not.toHaveBeenCalled();
        expect(compilation.errors.length).toBe(1);
        done();
      });
    });
  });

  describe('getPublicPath', () => {
    let sourceFile;

    beforeEach(() => {
      defaultOptions = {
        accessToken: 'aaaabbbbccccddddeeeeffff00001111',
        version: 'master-latest-sha',
        publicPath: 'https://my.cdn.net/assets/'
      };
      sourceFile = 'vendor.5190.js';
    });

    it("returns 'publicPath' value if it's a string", () => {
      plugin = new RollbarSourceMapPlugin(defaultOptions);
      const result = plugin.getPublicPath(sourceFile);
      expect(result).toBe('https://my.cdn.net/assets/vendor.5190.js');
    });

    it("handles 'publicPath' string without trailing /", () => {
      const options = {
        ...defaultOptions,
        publicPath: 'https://my.cdn.net/assets'
      };
      plugin = new RollbarSourceMapPlugin(options);
      const result = plugin.getPublicPath(sourceFile);
      expect(result).toBe('https://my.cdn.net/assets/vendor.5190.js');
    });

    it("returns whatever is returned by publicPath argument when it's a function", () => {
      const options = {
        ...defaultOptions,
        publicPath: srcFile => `https://my.function.proxy.cdn/assets/${srcFile}`
      };
      plugin = new RollbarSourceMapPlugin(options);
      const result = plugin.getPublicPath(sourceFile);
      expect(result).toBe(
        'https://my.function.proxy.cdn/assets/vendor.5190.js'
      );
    });

    it("returns whatever is returned by publicPath argument when it's a function", () => {
      const options = {
        ...defaultOptions,
        publicPath: srcFile => `https://my.function.proxy.cdn/assets/${srcFile}`
      };
      plugin = new RollbarSourceMapPlugin(options);
      const result = plugin.getPublicPath(sourceFile);
      expect(result).toBe(
        'https://my.function.proxy.cdn/assets/vendor.5190.js'
      );
    });
  });

  describe('getAssets', () => {
    let chunks;
    let compilation;
    beforeEach(() => {
      chunks = [
        {
          id: 0,
          names: ['vendor'],
          files: ['vendor.5190.js', 'vendor.5190.js.map']
        },
        {
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

    it('returns an array of js, sourcemap tuples', () => {
      const assets = plugin.getAssets(compilation);
      expect(assets).toEqual([
        { sourceFile: 'vendor.5190.js', sourceMap: 'vendor.5190.js.map' },
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ]);
    });

    it('ignores chunks that do not have a sourcemap asset', () => {
      chunks = [
        {
          id: 0,
          names: ['vendor'],
          files: ['vendor.5190.js']
        },
        {
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

    it('includes unnamed chunks when includeChunks is not specified', () => {
      chunks = [
        {
          id: 0,
          names: ['vendor'],
          files: ['vendor.5190.js', 'vendor.5190.js.map']
        },
        {
          id: 1,
          names: [],
          files: ['1.cfea.js', '1.cfea.js.map']
        },
        {
          id: 2,
          names: [],
          files: ['2-a364.js', '2-a364.js.map']
        },
        {
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

    it('filters out chunks that are not in includeChunks', () => {
      plugin.includeChunks = ['app'];
      const assets = plugin.getAssets(compilation);
      expect(assets).toEqual([
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ]);
    });
  });

  describe('uploadSourceMaps', () => {
    let compilation;
    let assets;
    let getAssets;
    let uploadSourceMap;

    beforeEach(() => {
      compilation = { name: 'test', errors: [] };
      assets = [
        { sourceFile: 'vendor.5190.js', sourceMap: 'vendor.5190.js.map' },
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ];
      getAssets = jest.spyOn(plugin, 'getAssets').mockReturnValueOnce(assets);
      uploadSourceMap = jest
        .spyOn(plugin, 'uploadSourceMap')
        .mockImplementation((_comp, _chunk, callback) => callback());
    });

    it('calls uploadSourceMap for each chunk', done => {
      plugin.uploadSourceMaps(compilation, err => {
        if (err) {
          return done(err);
        }
        expect(getAssets).toHaveBeenCalledTimes(1);
        expect(compilation.errors.length).toBe(0);
        expect(uploadSourceMap).toHaveBeenCalledTimes(2);

        expect(uploadSourceMap).toHaveBeenNthCalledWith(
          1,
          { name: 'test', errors: [] },
          { sourceFile: 'vendor.5190.js', sourceMap: 'vendor.5190.js.map' },
          expect.any(Function)
        );

        expect(uploadSourceMap).toHaveBeenNthCalledWith(
          2,
          { name: 'test', errors: [] },
          { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' },
          expect.any(Function)
        );
        done();
      });
    });

    it('calls err-back if uploadSourceMap errors', done => {
      const error = new Error();
      uploadSourceMap = jest
        .spyOn(plugin, 'uploadSourceMap')
        .mockImplementationOnce((_comp, _chunk, callback) => callback(error));
      plugin.uploadSourceMaps(compilation, (err, result) => {
        expect(err).toBe(error);
        expect(result).toBe(undefined);
        done();
      });
    });
  });

  describe('uploadSourceMap', () => {
    let info;
    let compilation;
    let chunk;

    beforeEach(() => {
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

    it('callback without err param if upload is success', done => {
      info = jest.spyOn(console, 'info').mockImplementation();
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(200, JSON.stringify({ err: 0, result: 'master-latest-sha' }));

      plugin.uploadSourceMap(compilation, chunk, err => {
        if (err) {
          return done(err);
        }
        expect(info).toHaveBeenCalledWith(
          'Uploaded vendor.5190.js.map to Rollbar'
        );
        done();
      });
    });

    it('does not log upload to console if silent option is true', done => {
      info = jest.spyOn(console, 'info').mockImplementation();
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(200, JSON.stringify({ err: 0, result: 'master-latest-sha' }));

      plugin.silent = true;
      plugin.uploadSourceMap(compilation, chunk, err => {
        if (err) {
          return done(err);
        }
        expect(info).not.toHaveBeenCalled();
        done();
      });
    });

    it('logs upload to console if silent option is false', done => {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(200, JSON.stringify({ err: 0, result: 'master-latest-sha' }));

      plugin.silent = false;
      plugin.uploadSourceMap(compilation, chunk, err => {
        if (err) {
          return done(err);
        }
        expect(info).toHaveBeenCalledWith(
          'Uploaded vendor.5190.js.map to Rollbar'
        );
        done();
      });
    });

    it('returns error message if failure response includes message', done => {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(
          422,
          JSON.stringify({ err: 1, message: 'missing source_map file upload' })
        );

      plugin.uploadSourceMap(compilation, chunk, err => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe(
          'failed to upload vendor.5190.js.map to Rollbar: missing source_map file upload'
        );
        done();
      });
    });

    it('returns generic error message if response body does not have message', done => {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(422, JSON.stringify({ err: 1 }));

      plugin.uploadSourceMap(compilation, chunk, err => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe(
          'failed to upload vendor.5190.js.map to Rollbar'
        );
        done();
      });
    });

    it('handles error response with empty body', done => {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(422, null);

      plugin.uploadSourceMap(compilation, chunk, err => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe(
          'failed to upload vendor.5190.js.map to Rollbar'
        );
        done();
      });
    });

    it('handles HTTP request error', done => {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .replyWithError('something awful happened');

      plugin.uploadSourceMap(compilation, chunk, err => {
        expect(err).toBeInstanceOf(Error);
        expect(err.message).toBe(
          'failed to upload vendor.5190.js.map to Rollbar: something awful happened'
        );
        done();
      });
    });
  });
});
