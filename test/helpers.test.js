import { expect } from 'chai';
import { ROLLBAR_REQ_FIELDS } from '../src/constants';
import * as helpers from '../src/helpers';

describe('helpers', function() {
  describe('handleError', function() {
    it('should return an array of length 1 given a single error', function() {
      const result = helpers.handleError(new Error('required field missing'));
      expect(result).to.be.an('array').with.lengthOf(1);
    });

    it('should return an array of length 2 given an array of length 2', function() {
      const result = helpers.handleError([
        new Error('required field missing'),
        new Error('request failed')
      ]);
      expect(result)
        .to.be.an('array')
        .and.to.have.lengthOf(2);
    });

    it('should prefix message of single error', function() {
      const result = helpers.handleError(new Error('required field missing'), 'Plugin');
      expect(result[0]).to.have.property('message',
        'Plugin: required field missing'
      );
    });

    it('should prefix message of an array of errors', function() {
      const result = helpers.handleError([
        new Error('required field missing'),
        new Error('request failed')
      ], 'Plugin');
      expect(result[0]).to.have.property('message',
        'Plugin: required field missing'
      );
      expect(result[1]).to.have.property('message',
        'Plugin: request failed'
      );
    });

    it('should default prefix to "RollbarSourceMapPlugin"', function() {
      const result = helpers.handleError(new Error('required field missing'));
      expect(result[0]).to.have.property('message',
        'RollbarSourceMapPlugin: required field missing'
      );
    });

    it('should handle null', function() {
      const result = helpers.handleError(null);
      expect(result).to.eql([]);
    });

    it('should handle empty []', function() {
      const result = helpers.handleError([]);
      expect(result).to.eql([]);
    });
  });

  describe('validateOptions', function() {
    it('should return null if all required options are supplied', function() {
      const options = {
        accessToken: 'aaabbbccc000111',
        version: 'latest',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).to.be.null; // eslint-disable-line no-unused-expressions
    });

    it('should return an error if accessToken is not supplied', function() {
      const options = {
        version: 'latest',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0])
        .to.be.an('error')
        .with.property('message', 'required field, \'accessToken\', is missing.');
    });

    it('should return an error if version is not supplied', function() {
      const options = {
        accessToken: 'aaabbbccc000111',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).to.be.an('array').with.lengthOf(1);
      expect(result[0])
        .to.be.an('error')
        .with.property('message', 'required field, \'version\', is missing.');
    });

    it('should handle multiple missing required options', function() {
      const options = {};
      const result = helpers.validateOptions(options);
      expect(result).to.be.an('array').with.lengthOf(ROLLBAR_REQ_FIELDS.length);
    });

    it('should handle null for options', function() {
      const result = helpers.validateOptions(null);
      expect(result).to.be.an('array').with.lengthOf(ROLLBAR_REQ_FIELDS.length);
    });

    it('should handle no options passed', function() {
      const result = helpers.validateOptions();
      expect(result).to.be.an('array').with.lengthOf(ROLLBAR_REQ_FIELDS.length);
    });
  });
});
