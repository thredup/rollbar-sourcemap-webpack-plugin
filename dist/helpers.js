"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.handleError = handleError;
exports.validateOptions = validateOptions;

var _verror = _interopRequireDefault(require("verror"));

var _lodash = _interopRequireDefault(require("lodash.isfunction"));

var _lodash2 = _interopRequireDefault(require("lodash.isstring"));

var _constants = require("./constants");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Take a single Error or array of Errors and return an array of errors that
// have message prefixed.
function handleError(err, prefix = _constants.PLUGIN_NAME) {
  if (!err) {
    return [];
  }

  const errors = [].concat(err);
  return errors.map(e => new _verror.default(e, prefix));
} // Validate required options and return an array of errors or null if there
// are no errors.


function validateOptions(ref) {
  const errors = _constants.ROLLBAR_REQ_FIELDS.reduce((result, field) => {
    if (field === 'publicPath' && ref !== null && ref !== void 0 && ref[field] && !(0, _lodash2.default)(ref[field]) && !(0, _lodash.default)(ref[field])) {
      return [...result, new TypeError(`invalid type. '${field}' expected to be string or function.`)];
    }

    if (ref !== null && ref !== void 0 && ref[field]) {
      return result;
    }

    return [...result, new Error(`required field, '${field}', is missing.`)];
  }, []);

  return errors.length ? errors : null;
}