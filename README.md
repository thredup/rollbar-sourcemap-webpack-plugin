RollbarSourceMapPlugin
========================
[![Dependency Status](https://david-dm.org/brandondoran/rollbar-sourcemap-webpack-plugin.svg)](https://david-dm.org/brandondoran/rollbar-sourcemap-webpack-plugin) 
[![Build Status](https://travis-ci.org/brandondoran/rollbar-sourcemap-webpack-plugin.svg?branch=master)](https://travis-ci.org/brandondoran/rollbar-sourcemap-webpack-plugin)

This is a [Webpack](https://webpack.github.io) plugin that simplifies uploading the sourcemaps,
generated from a webpack build, to [Rollbar](https://rollbar.com).

Production JavaScript bundles are typically minified before deploying,
making Rollbar stacktraces pretty useless unless you take steps to upload the sourcemaps.
You may be doing this now in a shell script, triggered during your deploy process,
that makes curl posts to the Rollbar api. This can be finicky and error prone to setup.
RollbarSourceMapPlugin aims to remove that burden and automatically upload the sourcemaps when they are emitted by webpack

Installation
------------
Install the plugin with npm:
```shell
$ npm install rollbar-sourcemap-webpack-plugin --save-dev
```

Basic Usage
-------------
An example webpack.config.js:
```javascript
const RollbarSourceMapPlugin = require('rollbar-sourcemap-webpack-plugin')
const PUBLIC_PATH = 'https://my.cdn.net/assets'
const webpackConfig = {
  entry: 'index',
  publicPath: PUBLIC_PATH
  output: {
    path: 'dist',
    filename: 'index-[hash].js'
  },
  plugins: [new RollbarSourceMapPlugin({
    accessToken: 'aaaabbbbccccddddeeeeffff00001111',
    version: 'version_string_here',
    publicPath: PUBLIC_PATH
  })]
}
```

Plugin Configuration
-------------
You can pass a hash of configuration options to `RollbarSourceMapPlugin`.
Allowed values are as follows:

- `accessToken`: *(required)* Your rollbar `post_server_item` access token.
- `version`: *(required)* A string identifying the version of your code this source map package is for.
  Typically this will be the full git sha.
- `publicPath`: *(required)* The base url for the cdn where your production bundles are hosted.
- `includeChunks`: An array of chunks for which sourcemaps should be uploaded.
  This should correspond to the names in the webpack config `entry` field.
  If there's only one chunk, it can be a string rather than an array. In not supplied,
  all sourcemaps emitted by webpack will be uploaded.
- `silent`: `true | false` If `true`, success messages will be logged to the console for each upload.
   defaults to `false`.

App Configuration
--------------------
- The web app should have [rollbar-browser](https://github.com/rollbar/rollbar.js) installed and configured for webpack as described [here](https://github.com/rollbar/rollbar.js/tree/master/examples/webpack#using-rollbar-with-webpack).
- See the [Rollbar source map](https://rollbar.com/docs/source-maps/) documentation
  for how to configure the client side for sourcemap support.
  The `code_version` parameter must match the `version` parameter used for the plugin.
- More general info on the using [Rollbar for browser JS](https://rollbar.com/doc`s/notifier/rollbar.js/).
