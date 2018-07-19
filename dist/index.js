'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withRollbar = undefined;

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-restricted-syntax,global-require */
var RollbarSourceMapPlugin = require('./RollbarSourceMapPlugin');

var withRollbar = exports.withRollbar = function withRollbar() {
  var nextConfig = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return (0, _assign2.default)({}, nextConfig, {
    webpack: function webpack(config, options) {
      if (!options.defaultLoaders) {
        throw new Error('This plugin is not compatible with Next.js versions below 5.0.0 https://err.sh/next-plugins/upgrade');
      }

      var dev = options.dev,
          buildId = options.buildId,
          isServer = options.isServer;


      if (!dev && !isServer) {
        var accessToken = nextConfig.accessToken,
            publicPath = nextConfig.publicPath;


        var rollbarPlugin = new RollbarSourceMapPlugin({
          accessToken: accessToken,
          version: buildId,
          publicPath: publicPath,
          buildId: buildId,
          nextJs: true
        });
        config.plugins.push(rollbarPlugin);
      }

      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(config, options);
      }

      return config;
    }
  });
};

exports.default = RollbarSourceMapPlugin;