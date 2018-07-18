Next.js + RollbarSourceMapPlugin
========================
[![Dependency Status](https://img.shields.io/david/thredup/rollbar-sourcemap-webpack-plugin.svg?style=flat-square)](https://david-dm.org/thredup/rollbar-sourcemap-webpack-plugin)
[![devDependency Status](https://img.shields.io/david/dev/thredup/rollbar-sourcemap-webpack-plugin.svg?maxAge=2592000?style=flat-square)](https://david-dm.org/thredup/rollbar-sourcemap-webpack-plugin#info=devDependencies)
[![Build Status](https://img.shields.io/travis/thredup/rollbar-sourcemap-webpack-plugin.svg?style=flat-square)](https://travis-ci.org/thredup/rollbar-sourcemap-webpack-plugin)
[![Coverage](https://img.shields.io/codecov/c/github/thredup/rollbar-sourcemap-webpack-plugin/master.svg?style=flat-square)](https://codecov.io/gh/thredup/rollbar-sourcemap-webpack-plugin)
[![Downloads](https://img.shields.io/npm/dm/rollbar-sourcemap-webpack-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rollbar-sourcemap-webpack-plugin)

This is a [Webpack](https://webpack.github.io) plugin that simplifies uploading the sourcemaps,
generated from a webpack build, to [Rollbar](https://rollbar.com).

Production JavaScript bundles are typically minified before deploying,
making Rollbar stacktraces pretty useless unless you take steps to upload the sourcemaps.
You may be doing this now in a shell script, triggered during your deploy process,
that makes curl posts to the Rollbar API. This can be finicky and error prone to setup.
RollbarSourceMapPlugin aims to remove that burden and automatically upload the sourcemaps when they are emitted by webpack.

## Installation
Install the plugin with npm:
```shell
$ npm install rollbar-sourcemap-webpack-plugin --save-dev
```

## Basic Usage without Next.js
An example webpack.config.js:
```javascript
const RollbarSourceMapPlugin = require('rollbar-sourcemap-webpack-plugin')
const PUBLIC_PATH = 'https://my.cdn.net/assets'
const webpackConfig = {
  entry: 'index',
  publicPath: PUBLIC_PATH,
  output: {
    path: 'dist',
    filename: 'index-[hash].js'
  },
  plugins: [new RollbarSourceMapPlugin({
    accessToken: 'aaaabbbbccccddddeeeeffff00001111',
    version: 'version_string_here',
    publicPath: PUBLIC_PATH,
    buildId: '34348sdfsfdsg385353',
  })]
}
```
Or use for Next.js: (>=5.x.x)
```javascript
const { withRollbar } = require('rollbar-sourcemap-webpack-plugin');
const PUBLIC_PATH = 'https://my.cdn.net/assets';

module.exports = withRollbar({
    accessToken: 'aaaabbbbccccddddeeeeffff00001111',
    version: 'version_string_here',
    publicPath: PUBLIC_PATH,
    buildId: '34348sdfsfdsg385353',
});
````

## Plugin Configuration
You can pass a hash of configuration options to `RollbarSourceMapPlugin`.
Allowed values are as follows:

#### `accessToken: string` **(required)**
Your rollbar `post_server_item` access token.

#### `version: string` **(required)**
A string identifying the version of your code this source map package is for. Typically this will be the full git sha.

#### `publicPath: string` **(required)**
The base url for the cdn where your production bundles are hosted.

#### `buildId: string` **(required)**
Unique BuildId from Next.js (name of directory on dist/_next).

#### `includeChunks: string | [string]` **(optional)**
An array of chunks for which sourcemaps should be uploaded. This should correspond to the names in the webpack config `entry` field. If there's only one chunk, it can be a string rather than an array. If not supplied, all sourcemaps emitted by webpack will be uploaded, including those for unnamed chunks.

#### `silent: boolean` **(default: `false`)**
If `false`, success and warning messages will be logged to the console for each upload. Note: if you also do not want to see errors, set the `ignoreErrors` option to `true`.

#### `ignoreErrors: boolean` **(default: `false`)**
Set to `true` to bypass adding upload errors to the webpack compilation. Do this if you do not want to fail the build when sourcemap uploads fail. If you do not want to fail the build but you do want to see the failures as warnings, make sure `silent` option is set to `false`.

#### `rollbarEndpoint: string` **(default: `https://api.rollbar.com/api/1/sourcemap`)**
A string defining the Rollbar API endpoint to upload the sourcemaps to. It can be used for self-hosted Rollbar instances.

## App Configuration
- The web app should have [rollbar-browser](https://github.com/rollbar/rollbar.js) installed and configured for webpack as described [here](https://github.com/rollbar/rollbar.js/tree/master/examples/webpack#using-rollbar-with-webpack).
- See the [Rollbar source map](https://rollbar.com/docs/source-maps/) documentation
  for how to configure the client side for sourcemap support.
  The `code_version` parameter must match the `version` parameter used for the plugin.
- More general info on the using [Rollbar for browser JS](https://rollbar.com/docs/notifier/rollbar.js/).

## Examples
### React [(source)](https://github.com/thredup/rollbar-sourcemap-webpack-plugin/tree/master/examples/react)
A minimal single page app with webpack build. The app includes a local Express server that
serves an index.html. The build is meant to mimic a production build in that js bundles and sourcemaps are uploaded
to AWS S3. You will need AWS and Rollbar accounts. To run the example:

  - Set your aws and rollbar options in `examples/react/webpack.config.babel.js`
  - `$ cd examples/react`
  - `$ npm run build`
  - `$ npm start`
  - open [http://localhost:8000](http://localhost:8000/)
  
  When the example app is loaded in a browser,
  the app will throw an error, which will be sent to Rollbar.
  You should be able to log in to Rollbar and see the error with stacktrace
  with line numbers that map to the original source.

## Contributing
See the [Contributors Guide](/CONTRIBUTING.md)

# License
[MIT](/LICENSE.md)
