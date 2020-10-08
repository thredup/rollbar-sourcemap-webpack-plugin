import VError from 'verror';
import isFunction from 'lodash.isfunction';
import isString from 'lodash.isstring';
import { ROLLBAR_REQ_FIELDS } from './constants';

// Take a single Error or array of Errors and return an array of errors that
// have message prefixed.
export function handleError(err, prefix = 'RollbarSourceMapPlugin') {
  if (!err) {
    return [];
  }

  const errors = [].concat(err);
  return errors.map(e => new VError(e, prefix));
}

// Validate required options and return an array of errors or null if there
// are no errors.
export function validateOptions(ref) {
  const errors = ROLLBAR_REQ_FIELDS.reduce((result, field) => {
    if (
      field === 'publicPath' &&
      ref?.[field] &&
      !isString(ref[field]) &&
      !isFunction(ref[field])
    ) {
      return [
        ...result,
        new TypeError(
          `invalid type. '${field}' expected to be string or function.`
        )
      ];
    }

    if (ref?.[field]) {
      return result;
    }

    return [...result, new Error(`required field, '${field}', is missing.`)];
  }, []);

  return errors.length ? errors : null;
}
