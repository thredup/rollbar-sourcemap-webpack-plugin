"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ROLLBAR_REQ_FIELDS = exports.ROLLBAR_ENDPOINT = exports.PLUGIN_NAME = void 0;
const PLUGIN_NAME = 'RollbarSourceMapPlugin';
exports.PLUGIN_NAME = PLUGIN_NAME;
const ROLLBAR_ENDPOINT = 'https://api.rollbar.com/api/1/sourcemap';
exports.ROLLBAR_ENDPOINT = ROLLBAR_ENDPOINT;
const ROLLBAR_REQ_FIELDS = ['accessToken', 'version', 'publicPath'];
exports.ROLLBAR_REQ_FIELDS = ROLLBAR_REQ_FIELDS;