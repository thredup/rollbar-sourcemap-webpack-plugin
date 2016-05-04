import { expect } from 'chai';
// import path from 'path';
// import webpack from 'webpack';
import RollbarSourceMapPlugin from '../src/RollbarSourceMapPlugin';
// import rmrf from 'rimraf';

// const OUTPUT_DIR = path.join(__dirname, '../tmp');

describe('RollbarSourceMapPlugin', function() {
  describe('constructor', function() {
    it('should create an instance with properties set', function(done) {
      const options = {
        accessToken: '79cc7ed367384b4bae9d19404069ae2c',
        version: 'master-latest-sha',
        publicPath: 'https://my.cdn.net/assets',
        includeChunks: ['foo', 'bar'],
        silent: true
      };
      const plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).instanceof(RollbarSourceMapPlugin);
      expect(plugin).to.have.property('accessToken', options.accessToken);
      expect(plugin).to.have.property('version', options.version);
      expect(plugin).to.have.property('publicPath', options.publicPath);
      expect(plugin).to.have.property('includeChunks').to.eql(options.includeChunks);
      expect(plugin).to.have.property('silent', options.silent);
      done();
    });

    it('should default silent to false', function(done) {
      const options = {
        accessToken: '79cc7ed367384b4bae9d19404069ae2c',
        version: 'master-latest-sha',
        publicPath: 'https://my.cdn.net/assets'
      };
      const plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).to.have.property('silent', false);
      done();
    });

    it('should default includeChunks to []', function(done) {
      const options = {
        accessToken: '79cc7ed367384b4bae9d19404069ae2c',
        version: 'master-latest-sha',
        publicPath: 'https://my.cdn.net/assets'
      };
      const plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).to.have.property('includeChunks').to.eql([]);
      done();
    });

    it('should accept string value for includeChunks', function(done) {
      const options = {
        includeChunks: 'foo',
        accessToken: '79cc7ed367384b4bae9d19404069ae2c',
        version: 'master-latest-sha',
        publicPath: 'https://my.cdn.net/assets'
      };
      const plugin = new RollbarSourceMapPlugin(options);
      expect(plugin).to.have.property('includeChunks').to.eql(['foo']);
      done();
    });
  });
});
