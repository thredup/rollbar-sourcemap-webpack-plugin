import { ROLLBAR_REQ_FIELDS } from '../src/constants';
import * as helpers from '../src/helpers';

describe('helpers', () => {
  describe('handleError', () => {
    test('should return an array of length 1 given a single error', () => {
      const result = helpers.handleError(new Error('required field missing'));
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toEqual(1);
    });

    test(
      'should return an array of length 2 given an array of length 2',
      () => {
        const result = helpers.handleError([
          new Error('required field missing'),
          new Error('request failed')
        ]);
        expect(result).toBeInstanceOf(Array);
        expect(result.length).toEqual(2);
      }
    );

    test('should prefix message of single error', () => {
      const result = helpers.handleError(new Error('required field missing'), 'Plugin');
      expect(result.length).toEqual(1);
      expect(result[0]).toMatchObject({ message: 'Plugin: required field missing' });
    });

    test('should prefix message of an array of errors', () => {
      const result = helpers.handleError([
        new Error('required field missing'),
        new Error('request failed')
      ], 'Plugin');
      expect(result.length).toEqual(2);
      expect(result[0]).toMatchObject({ message: 'Plugin: required field missing' });
    });

    test('should default prefix to "RollbarSourceMapPlugin"', () => {
      const result = helpers.handleError(new Error('required field missing'));
      expect(result.length).toEqual(1);
      expect(result[0]).toMatchObject({
        message: 'RollbarSourceMapPlugin: required field missing'
      });
    });

    test('should handle null', () => {
      const err = null;
      expect(helpers.handleError(err)).toEqual([]);
    });

    test('should handle empty []', () => {
      expect(helpers.handleError([])).toEqual([]);
    });
  });

  describe('validateOptions', () => {
    test('should return null if all required options are supplied', () => {
      const options = {
        accessToken: 'aaabbbccc000111',
        version: 'latest',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBe(null); // eslint-disable-line no-unused-expressions
    });

    test('should return an error if accessToken is not supplied', () => {
      const options = {
        version: 'latest',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(Error);
      expect(result[0]).toMatchObject({
        message: 'required field, \'accessToken\', is missing.'
      });
    });

    test('should return an error if version is not supplied', () => {
      const options = {
        accessToken: 'aaabbbccc000111',
        publicPath: 'https://my.cdn.net/assets'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(Error);
      expect(result[0]).toMatchObject({
        message: 'required field, \'version\', is missing.'
      });
    });

    test('should return an error if publicPath is not supplied', () => {
      const options = {
        accessToken: 'aaabbbccc000111',
        version: 'latest'
      };
      const result = helpers.validateOptions(options);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(Error);
      expect(result[0]).toMatchObject({
        message: 'required field, \'publicPath\', is missing.'
      });
    });

    test('should handle multiple missing required options', () => {
      const options = {};
      const result = helpers.validateOptions(options);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(ROLLBAR_REQ_FIELDS.length);
    });

    test('should handle null for options', () => {
      const result = helpers.validateOptions(null);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(ROLLBAR_REQ_FIELDS.length);
    });

    test('should handle no options passed', () => {
      const result = helpers.validateOptions();
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(ROLLBAR_REQ_FIELDS.length);
    });
  });
});
