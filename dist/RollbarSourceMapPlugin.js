'use strict';

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _request = require('request');

var _request2 = _interopRequireDefault(_request);

var _verror = require('verror');

var _verror2 = _interopRequireDefault(_verror);

var _lodash = require('lodash.find');

var _lodash2 = _interopRequireDefault(_lodash);

var _lodash3 = require('lodash.reduce');

var _lodash4 = _interopRequireDefault(_lodash3);

var _helpers = require('./helpers');

var _constants = require('./constants');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var RollbarSourceMapPlugin = function () {
  function RollbarSourceMapPlugin(_ref) {
    var accessToken = _ref.accessToken,
        version = _ref.version,
        publicPath = _ref.publicPath,
        _ref$includeChunks = _ref.includeChunks,
        includeChunks = _ref$includeChunks === undefined ? [] : _ref$includeChunks,
        _ref$retries = _ref.retries,
        retries = _ref$retries === undefined ? 1 : _ref$retries,
        _ref$silent = _ref.silent,
        silent = _ref$silent === undefined ? false : _ref$silent,
        _ref$ignoreErrors = _ref.ignoreErrors,
        ignoreErrors = _ref$ignoreErrors === undefined ? false : _ref$ignoreErrors;
    (0, _classCallCheck3.default)(this, RollbarSourceMapPlugin);

    this.accessToken = accessToken;
    this.version = version;
    this.publicPath = publicPath;
    this.includeChunks = [].concat(includeChunks);
    this.retries = retries;
    this.silent = silent;
    this.ignoreErrors = ignoreErrors;
  }

  (0, _createClass3.default)(RollbarSourceMapPlugin, [{
    key: 'afterEmit',
    value: function afterEmit(compilation, cb) {
      var _this = this;

      var errors = (0, _helpers.validateOptions)(this);

      if (errors) {
        var _compilation$errors;

        (_compilation$errors = compilation.errors).push.apply(_compilation$errors, (0, _toConsumableArray3.default)((0, _helpers.handleError)(errors)));
        return cb();
      }

      this.uploadSourceMaps(compilation, function (err) {
        if (err) {
          if (!_this.ignoreErrors) {
            var _compilation$errors2;

            (_compilation$errors2 = compilation.errors).push.apply(_compilation$errors2, (0, _toConsumableArray3.default)((0, _helpers.handleError)(err)));
          } else if (!_this.silent) {
            var _compilation$warnings;

            (_compilation$warnings = compilation.warnings).push.apply(_compilation$warnings, (0, _toConsumableArray3.default)((0, _helpers.handleError)(err)));
          }
        }
        cb();
      });
    }
  }, {
    key: 'apply',
    value: function apply(compiler) {
      compiler.plugin('after-emit', this.afterEmit.bind(this));
    }
  }, {
    key: 'getAssets',
    value: function getAssets(compilation) {
      var includeChunks = this.includeChunks;

      var _compilation$getStats = compilation.getStats().toJson(),
          chunks = _compilation$getStats.chunks;

      return (0, _lodash4.default)(chunks, function (result, chunk) {
        var chunkName = chunk.names[0];
        if (includeChunks.length && includeChunks.indexOf(chunkName) === -1) {
          return result;
        }

        var sourceFile = (0, _lodash2.default)(chunk.files, function (file) {
          return (/\.js$/.test(file)
          );
        });
        var sourceMap = (0, _lodash2.default)(chunk.files, function (file) {
          return (/\.js\.map$/.test(file)
          );
        });

        if (!sourceFile || !sourceMap) {
          return result;
        }

        return [].concat((0, _toConsumableArray3.default)(result), [{ sourceFile: sourceFile, sourceMap: sourceMap }]);
      }, {});
    }
  }, {
    key: 'uploadSourceMap',
    value: function uploadSourceMap(compilation, _ref2, cb) {
      var sourceFile = _ref2.sourceFile,
          sourceMap = _ref2.sourceMap;

      _async2.default.retry({ times: this.retries, interval: 100 }, function (callback) {
        var req = _request2.default.post(_constants.ROLLBAR_ENDPOINT, function (err, res, body) {
          if (!err && res.statusCode !== 200) {
            callback(new Error(''), res, body);
            return;
          }

          callback(err, res, body);
        });

        var form = req.form();
        form.append('access_token', this.accessToken);
        form.append('version', this.version);
        form.append('minified_url', this.publicPath + '/' + sourceFile);
        form.append('source_map', compilation.assets[sourceMap].source(), {
          filename: sourceMap,
          contentType: 'application/json'
        });
      }.bind(this), function (err, res, body) {
        if (res && res.statusCode === 200) {
          if (!this.silent) {
            console.info('Uploaded ' + sourceMap + ' to Rollbar'); // eslint-disable-line no-console
          }
          return cb();
        }

        var errMessage = 'failed to upload ' + sourceMap + ' to Rollbar';
        if (err && err.message) {
          return cb(new _verror2.default(err, errMessage));
        }

        try {
          var _JSON$parse = JSON.parse(body),
              message = _JSON$parse.message;

          return cb(new Error(message ? errMessage + ': ' + message : errMessage));
        } catch (parseErr) {
          return cb(new _verror2.default(parseErr, errMessage));
        }
      }.bind(this));
    }
  }, {
    key: 'uploadSourceMaps',
    value: function uploadSourceMaps(compilation, cb) {
      var assets = this.getAssets(compilation);
      var upload = this.uploadSourceMap.bind(this, compilation);

      _async2.default.each(assets, upload, function (err, results) {
        if (err) {
          return cb(err);
        }
        return cb(null, results);
      });
    }
  }]);
  return RollbarSourceMapPlugin;
}();

module.exports = RollbarSourceMapPlugin;