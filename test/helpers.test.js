import expect from 'expect';
import { ROLLBAR_REQ_FIELDS } from '../src/constants';
import * as helpers from '../src/helpers';

describe('helpers', function () {
  describe('handleError', function () {
    it('returns an array of length 1 given a single error', function () {
      const result = helpers.handleError(new Error('required field missing'));
      expect(result).toBeA(Array);
      expect(result.length).toEqual(1);
    });

    it('returns an array of length 2 given an array of length 2', function () {
      const result = helpers.handleError([
        new Error('required field missing'),
        new Error('request failed')
      ]);
      expect(result).toBeA(Array);
      expect(result.length).toEqual(2);
    });

    it('prefixes message of single error', function () {
      const result = helpers.handleError(new Error('required field missing'), 'Plugin');
      expect(result.length).toEqual(1);
      expect(result[0]).toInclude({ message: 'Plugin: required field missing' });
    });

    it('prefixes message of an array of errors', function () {
      const result = helpers.handleError([
        new Error('required field missing'),
        new Error('request failed')
      ], 'Plugin');
      expect(result.length).toEqual(2);
      expect(result[0]).toInclude({ message: 'Plugin: required field missing' });
    });

    it('defaults prefix to "RollbarSourceMapPlugin"', function () {
      const result = helpers.handleError(new Error('required field missing'));
      expect(result.length).toEqual(1);
      expect(result[0]).toInclude({
        message: 'RollbarSourceMapPlugin: required field missing'
      });
    });

    it('handles null', function () {
      const result = helpers.handleError(null);
      expect(result).toEqual([]);
    });

    it('handles empty []', function () {
      const result = helpers.handleError([]);
      expect(result).toEqual([]);
    });
  });

  describe('validateOptions', function () {
    it('returns null if all required options are supplied', function () {
      const options = {
        accessToken: 'aaabbbccc000111',
        version: 'latest',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBe(null); // eslint-disable-line no-unused-expressions
    });

    it('returns an error if accessToken is not supplied', function () {
      const options = {
        version: 'latest',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBeA('array');
      expect(result.length).toBe(1);
      expect(result[0]).toBeA(Error)
        .toInclude({ message: 'required field, \'accessToken\', is missing.' });
    });

    it('returns an error if version is not supplied', function () {
      const options = {
        accessToken: 'aaabbbccc000111',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBeA(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toBeA(Error)
        .toInclude({ message: 'required field, \'version\', is missing.' });
    });

    it('returns an error if publicPath is not supplied', function () {
      const options = {
        accessToken: 'aaabbbccc000111',
        version: 'latest'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBeA(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toBeA(Error)
        .toInclude({ message: 'required field, \'publicPath\', is missing.' });
    });

    it('handles multiple missing required options', function () {
      const options = {};
      const result = helpers.validateOptions(options);
      expect(result).toBeA(Array);
      expect(result.length).toBe(ROLLBAR_REQ_FIELDS.length);
    });

    it('handles null for options', function () {
      const result = helpers.validateOptions(null);
      expect(result).toBeA(Array);
      expect(result.length).toBe(ROLLBAR_REQ_FIELDS.length);
    });

    it('handles no options passed', function () {
      const result = helpers.validateOptions();
      expect(result).toBeA(Array);
      expect(result.length).toBe(ROLLBAR_REQ_FIELDS.length);
    });

    it('returns an error if publicPath is not a string nor a function', function () {
      const options = {
        accessToken: 'aaabbbccc000111',
        version: 'latest',
        publicPath: 3
      };
      const result = helpers.validateOptions(options);
      expect(result).toBeA(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toBeA(TypeError)
        .toInclude({ message: 'invalid type. \'publicPath\' expected to be string or function.' });
    });

    it('returns null if all required arguments are provided and accept a function as the publicPath argument', function () {
      const options = {
        accessToken: 'aaabbbccc000111',
        version: 'latest',
        publicPath: () => { }
      };
      const result = helpers.validateOptions(options);
      expect(result).toBe(null);
    });
  });
});
