'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

exports.handleError = handleError;
exports.validateOptions = validateOptions;

var _verror = require('verror');

var _verror2 = _interopRequireDefault(_verror);

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Take a single Error or array of Errors and return an array of errors that
// have message prefixed.
function handleError(err) {
  var prefix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'RollbarSourceMapPlugin';

  if (!err) {
    return [];
  }

  var errors = [].concat(err);
  return errors.map(function (e) {
    return new _verror2.default(e, prefix);
  });
}

// Validate required options and return an array of errors or null if there
// are no errors.
function validateOptions(ref) {
  var errors = _constants.ROLLBAR_REQ_FIELDS.reduce(function (result, field) {
    if (ref && ref[field]) {
      return result;
    }

    return [].concat((0, _toConsumableArray3.default)(result), [new Error('required field, \'' + field + '\', is missing.')]);
  }, []);

  return errors.length ? errors : null;
}