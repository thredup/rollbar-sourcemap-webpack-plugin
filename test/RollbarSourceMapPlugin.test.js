import nock from 'nock';
import RollbarSourceMapPlugin from '../src/RollbarSourceMapPlugin';
import { ROLLBAR_ENDPOINT } from '../src/constants';

describe('RollbarSourceMapPlugin', () => {
  let testContext;

  beforeEach(() => {
    testContext = {};
    testContext.compiler = {
      options: {},
      plugin: jest.fn(),
      resolvers: {
        loader: {
          plugin: jest.fn(),
          resolve: jest.fn(),
        },
        normal: {
          plugin: jest.fn(),
          resolve: jest.fn(),
        },
      },
    };

    testContext.options = {
      accessToken: 'aaaabbbbccccddddeeeeffff00001111',
      version: 'master-latest-sha',
      publicPath: 'https://my.cdn.net/assets'
    };

    testContext.plugin = new RollbarSourceMapPlugin(testContext.options);

    testContext.plugin.apply(testContext.compiler);
  });

  describe('constructor', () => {
    test('should return an instance', () => {
      expect(testContext.plugin).toBeInstanceOf(RollbarSourceMapPlugin);
    });

    test('should set options', () => {
      const options = Object.assign({}, testContext.options, {
        includeChunks: ['foo', 'bar'],
        silent: true
      });
      const plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).toMatchObject(options);
    });

    test('should default silent to false', () => {
      expect(testContext.plugin).toMatchObject({ silent: false });
    });

    test('should default includeChunks to []', () => {
      expect(testContext.plugin).toMatchObject({ includeChunks: [] });
    });

    test('should accept string value for includeChunks', () => {
      const options = Object.assign({}, testContext.options, { includeChunks: 'foo' });
      const plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).toMatchObject({ includeChunks: ['foo'] });
    });

    test('should accept array value for includeChunks', () => {
      const options = Object.assign({}, testContext.options, {
        includeChunks: ['foo', 'bar']
      });
      const plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).toMatchObject({ includeChunks: ['foo', 'bar'] });
    });

    it('should default rollbarEndpoint to ROLLBAR_ENDPOINT constant', function() {
      expect(testContext.plugin).toMatchObject({ rollbarEndpoint: ROLLBAR_ENDPOINT });
    });

    it('should access string value for rollbarEndpoint', function() {
      const customEndpoint = 'https://api.rollbar.custom.com/api/1/sourcemap';
      const options = Object.assign({}, this.options, { rollbarEndpoint: customEndpoint });
      const plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).toMatchObject({ rollbarEndpoint: customEndpoint });
    });
  });

  describe('apply', () => {
    test('should hook into `after-emit"', () => {
      expect(testContext.compiler.plugin.mock.calls.length).toBe(1);
      expect(testContext.compiler.plugin).toHaveBeenCalledWith(
        'after-emit',
        expect.anything()
      );
    });
  });

  describe('afterEmit', () => {
    beforeEach(() => {
      testContext.uploadSourceMaps = jest.spyOn(testContext.plugin, 'uploadSourceMaps')
        .mockImplementation((compilation, callback) => callback());
    });

    afterEach(() => {
      testContext.uploadSourceMaps.mockRestore();
    });

    test('should call uploadSourceMaps', (done) => {
      const compilation = {
        errors: [],
        warnings: []
      };
      testContext.plugin.afterEmit(compilation, () => {
        expect(testContext.uploadSourceMaps.mock.calls.length).toBe(1);
        expect(compilation.errors.length).toBe(0);
        expect(compilation.warnings.length).toBe(0);
        done();
      });
    });

    test('should add upload warnings to compilation warnings, ' +
      'if ignoreErrors is true and silent is false', (done) => {
      const compilation = {
        errors: [],
        warnings: []
      };
      testContext.plugin.ignoreErrors = true;
      testContext.plugin.silent = false;
      testContext.uploadSourceMaps = jest.spyOn(testContext.plugin, 'uploadSourceMaps')
        .mockImplementation((comp, callback) => callback(new Error()));
      testContext.plugin.afterEmit(compilation, () => {
        expect(testContext.uploadSourceMaps.mock.calls.length).toBe(1);
        expect(compilation.errors.length).toBe(0);
        expect(compilation.warnings.length).toBe(1);
        expect(compilation.warnings[0]).toBeInstanceOf(Error);
        done();
      });
    });

    test(
      'should not add upload errors to compilation warnings if silent is true',
      (done) => {
        const compilation = {
          errors: [],
          warnings: []
        };
        testContext.plugin.ignoreErrors = true;
        testContext.plugin.silent = true;
        testContext.uploadSourceMaps = jest.spyOn(testContext.plugin, 'uploadSourceMaps')
          .mockImplementation((comp, callback) => callback(new Error()));
        testContext.plugin.afterEmit(compilation, () => {
          expect(testContext.uploadSourceMaps.mock.calls.length).toBe(1);
          expect(compilation.errors.length).toBe(0);
          expect(compilation.warnings.length).toBe(0);
          done();
        });
      }
    );

    test('should add upload errors to compilation errors', (done) => {
      const compilation = {
        errors: [],
        warnings: []
      };
      testContext.plugin.ignoreErrors = false;
      testContext.uploadSourceMaps = jest.spyOn(testContext.plugin, 'uploadSourceMaps')
        .mockImplementation((comp, callback) => callback(new Error()));
      testContext.plugin.afterEmit(compilation, () => {
        expect(testContext.uploadSourceMaps.mock.calls.length).toBe(1);
        expect(compilation.warnings.length).toBe(0);
        expect(compilation.errors.length).toBe(1);
        expect(compilation.errors[0]).toBeInstanceOf(Error);
        done();
      });
    });

    test('should add validation errors to compilation', (done) => {
      const compilation = {
        errors: [],
        warnings: []
      };

      testContext.plugin = new RollbarSourceMapPlugin({
        version: 'master-latest-sha',
        publicPath: 'https://my.cdn.net/assets'
      });
      testContext.plugin.afterEmit(compilation, () => {
        expect(testContext.uploadSourceMaps.mock.calls.length).toBe(0);
        expect(compilation.errors.length).toBe(1);
        done();
      });
    });
  });

  describe('getAssets', () => {
    beforeEach(() => {
      testContext.chunks = [
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
      testContext.compilation = {
        getStats: () => ({
          toJson: () => ({ chunks: testContext.chunks })
        })
      };
    });

    test('should return an array of js, sourcemap tuples', () => {
      const assets = testContext.plugin.getAssets(testContext.compilation);
      expect(assets).toEqual([
        { sourceFile: 'vendor.5190.js', sourceMap: 'vendor.5190.js.map' },
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ]);
    });

    test('should ignore chunks that do not have a sourcemap asset', () => {
      testContext.chunks = [
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
      const assets = testContext.plugin.getAssets(testContext.compilation);
      expect(assets).toEqual([
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ]);
    });

    test(
      'should include unnamed chunks when includeChunks is not specified',
      () => {
        testContext.chunks = [
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
        const assets = testContext.plugin.getAssets(testContext.compilation);
        expect(assets).toEqual([
          { sourceFile: 'vendor.5190.js', sourceMap: 'vendor.5190.js.map' },
          { sourceFile: '1.cfea.js', sourceMap: '1.cfea.js.map' },
          { sourceFile: '2-a364.js', sourceMap: '2-a364.js.map' },
          { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
        ]);
      }
    );

    test('should filter out chunks that are not in includeChunks', () => {
      testContext.plugin.includeChunks = ['app'];
      const assets = testContext.plugin.getAssets(testContext.compilation);
      expect(assets).toEqual([
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ]);
    });
  });

  describe('uploadSourceMaps', () => {
    beforeEach(() => {
      testContext.compilation = { name: 'test', errors: [] };
      testContext.assets = [
        { sourceFile: 'vendor.5190.js', sourceMap: 'vendor.5190.js.map' },
        { sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' }
      ];
      testContext.getAssets = jest.spyOn(testContext.plugin, 'getAssets').mockImplementation(() => testContext.assets);
      testContext.uploadSourceMap = jest.spyOn(testContext.plugin, 'uploadSourceMap')
        .mockImplementation((comp, chunk, callback) => callback());
    });

    afterEach(() => {
      [testContext.getAssets, testContext.uploadSourceMap].forEach((func) => {
        func.mockRestore();
      });
    });

    test('should call uploadSourceMap for each chunk', (done) => {
      testContext.plugin.uploadSourceMaps(testContext.compilation, (err) => {
        if (err) {
          return done(err);
        }
        expect(testContext.getAssets.mock.calls.length).toBe(1);
        expect(testContext.compilation.errors.length).toBe(0);
        expect(testContext.uploadSourceMap.mock.calls.length).toBe(2);

        expect(testContext.uploadSourceMap.mock.calls[0][0])
          .toEqual({ name: 'test', errors: [] });
        expect(testContext.uploadSourceMap.mock.calls[0][1])
          .toEqual({ sourceFile: 'vendor.5190.js', sourceMap: 'vendor.5190.js.map' });

        expect(testContext.uploadSourceMap.mock.calls[1][0])
          .toEqual({ name: 'test', errors: [] });
        expect(testContext.uploadSourceMap.mock.calls[1][1])
          .toEqual({ sourceFile: 'app.81c1.js', sourceMap: 'app.81c1.js.map' });
        done();
      });
    });

    test('should call err-back if uploadSourceMap errors', (done) => {
      testContext.uploadSourceMap = jest.spyOn(testContext.plugin, 'uploadSourceMap')
        .mockImplementation((comp, chunk, callback) => callback(new Error()));
      testContext.plugin.uploadSourceMaps(testContext.compilation, (err, result) => {
        expect(err).toBeTruthy();
        expect(err).toBeInstanceOf(Error);
        expect(result).toBe(undefined);
        done();
      });
    });
  });

  describe('uploadSourceMap', () => {
    beforeEach(() => {
      testContext.info = jest.spyOn(console, 'info')
        .mockImplementation(() => {});
      testContext.compilation = {
        assets: {
          'vendor.5190.js.map': { source: () => '{"version":3,"sources":[]' },
          'app.81c1.js.map': { source: () => '{"version":3,"sources":[]' }
        },
        errors: []
      };

      testContext.chunk = {
        sourceFile: 'vendor.5190.js',
        sourceMap: 'vendor.5190.js.map'
      };
    });

    afterEach(() => {
      testContext.info.mockRestore();
    });

    test('should callback without err param if upload is success', (done) => {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(200, JSON.stringify({ err: 0, result: 'master-latest-sha' }));

      const { compilation, chunk } = testContext;
      testContext.plugin.uploadSourceMap(compilation, chunk, (err) => {
        if (err) {
          return done(err);
        }
        expect(testContext.info).toHaveBeenCalledWith('Uploaded vendor.5190.js.map to Rollbar');
        done();
      });
    });

    test(
      'should not log upload to console if silent option is true',
      (done) => {
        const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
          .post('/api/1/sourcemap')
          .reply(200, JSON.stringify({ err: 0, result: 'master-latest-sha' }));

        const { compilation, chunk } = testContext;
        testContext.plugin.silent = true;
        testContext.plugin.uploadSourceMap(compilation, chunk, (err) => {
          if (err) {
            return done(err);
          }
          expect(testContext.info).not.toHaveBeenCalled();
          done();
        });
      }
    );

    test('should log upload to console if silent option is false', (done) => {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(200, JSON.stringify({ err: 0, result: 'master-latest-sha' }));

      const { compilation, chunk } = testContext;
      testContext.plugin.silent = false;
      testContext.plugin.uploadSourceMap(compilation, chunk, (err) => {
        if (err) {
          return done(err);
        }
        expect(testContext.info).toHaveBeenCalledWith('Uploaded vendor.5190.js.map to Rollbar');
        done();
      });
    });

    test(
      'should return error message if failure response includes message',
      (done) => {
        const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
          .post('/api/1/sourcemap')
          .reply(422, JSON.stringify({ err: 1, message: 'missing source_map file upload' }));

        const { compilation, chunk } = testContext;
        testContext.plugin.uploadSourceMap(compilation, chunk, (err) => {
          expect(err).toBeInstanceOf(Error);
          expect(err).toMatchObject({
            message: 'failed to upload vendor.5190.js.map to Rollbar: missing source_map file upload'
          });
          done();
        });
      }
    );

    test('should handle error response with empty body', (done) => {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(422, {});

      const { compilation, chunk } = testContext;
      testContext.plugin.uploadSourceMap(compilation, chunk, (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err).toMatchObject({
          message: 'failed to upload vendor.5190.js.map to Rollbar'
        });
        done();
      });
    });

    test('should handle invalid json in error response', (done) => {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .reply(422, null);

      const { compilation, chunk } = testContext;
      testContext.plugin.uploadSourceMap(compilation, chunk, (err) => {
        expect(err).toBeInstanceOf(Error);
        // expect(err.message).toMatch(/failed to upload vendor\.5190.js\.map to Rollbar: [\w\s]+/);
        expect(err).toMatchObject({
          message: 'failed to upload vendor.5190.js.map to Rollbar'
        });
        done();
      });
    });

    test('should handle HTTP request error', (done) => {
      const scope = nock('https://api.rollbar.com:443') // eslint-disable-line no-unused-vars
        .post('/api/1/sourcemap')
        .replyWithError('something awful happened');

      const { compilation, chunk } = testContext;
      testContext.plugin.uploadSourceMap(compilation, chunk, (err) => {
        expect(err).toBeInstanceOf(Error);
        expect(err).toMatchObject({
          message: 'failed to upload vendor.5190.js.map to Rollbar: something awful happened'
        });
        done();
      });
    });
  });
});
