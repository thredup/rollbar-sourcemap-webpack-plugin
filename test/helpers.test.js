import { ROLLBAR_REQ_FIELDS } from '../src/constants';
import * as helpers from '../src/helpers';

describe('helpers', () => {
  describe('handleError', () => {
    it('returns an array of length 1 given a single error', () => {
      const result = helpers.handleError(new Error('required field missing'));
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toEqual(1);
    });

    it('returns an array of length 2 given an array of length 2', () => {
      const result = helpers.handleError([
        new Error('required field missing'),
        new Error('request failed')
      ]);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toEqual(2);
    });

    it('prefixes message of single error', () => {
      const result = helpers.handleError(new Error('required field missing'), 'Plugin');
      expect(result.length).toEqual(1);
      expect(result[0].message).toBe('Plugin: required field missing');
    });

    it('prefixes message of an array of errors', () => {
      const result = helpers.handleError([
        new Error('required field missing'),
        new Error('request failed')
      ], 'Plugin');
      expect(result.length).toEqual(2);
      expect(result[0].message).toBe('Plugin: required field missing');
    });

    it('defaults prefix to "RollbarSourceMapPlugin"', () => {
      const result = helpers.handleError(new Error('required field missing'));
      expect(result.length).toEqual(1);
      expect(result[0].message).toBe('RollbarSourceMapPlugin: required field missing');
    });

    it('handles null', () => {
      const result = helpers.handleError(null);
      expect(result).toEqual([]);
    });

    it('handles empty []', () => {
      const result = helpers.handleError([]);
      expect(result).toEqual([]);
    });
  });

  describe('validateOptions', () => {
    it('returns null if all required options are supplied', () => {
      const options = {
        accessToken: 'aaabbbccc000111',
        version: 'latest',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBe(null); // eslint-disable-line no-unused-expressions
    });

    it('returns an error if accessToken is not supplied', () => {
      const options = {
        version: 'latest',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(Error);
      expect(result[0].message).toBe('required field, \'accessToken\', is missing.');
    });

    it('returns an error if version is not supplied', () => {
      const options = {
        accessToken: 'aaabbbccc000111',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(Error);
      expect(result[0].message).toBe('required field, \'version\', is missing.');
    });

    it('returns an error if publicPath is not supplied', () => {
      const options = {
        accessToken: 'aaabbbccc000111',
        version: 'latest'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(Error);
      expect(result[0].message).toBe('required field, \'publicPath\', is missing.');
    });

    it('handles multiple missing required options', () => {
      const options = {};
      const result = helpers.validateOptions(options);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(ROLLBAR_REQ_FIELDS.length);
    });

    it('handles null for options', () => {
      const result = helpers.validateOptions(null);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(ROLLBAR_REQ_FIELDS.length);
    });

    it('handles no options passed', () => {
      const result = helpers.validateOptions();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(ROLLBAR_REQ_FIELDS.length);
    });

    it('returns an error if publicPath is not a string nor a function', () => {
      const options = {
        accessToken: 'aaabbbccc000111',
        version: 'latest',
        publicPath: 3
      };
      const result = helpers.validateOptions(options);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(TypeError);
      expect(result[0].message).toBe('invalid type. \'publicPath\' expected to be string or function.');
    });

    it('returns null if all required arguments are provided and accept a function as the publicPath argument', () => {
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
