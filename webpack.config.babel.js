import path from 'path';
import fs from 'fs';
import { DefinePlugin } from 'webpack';

const { NODE_ENV } = process.env;
const SRC_PATH = path.resolve(__dirname, 'src');
const DIST_PATH = path.resolve(__dirname, 'dist');
const TEST_PATH = path.resolve(__dirname, 'test');
const NODE_MODULES = path.resolve(__dirname, 'node_modules');

const externals = fs.readdirSync('node_modules')
  .filter(mod => ['.bin'].indexOf(mod) === -1)
  .reduce((result, mod) => ({
    ...result,
    [mod]: `commonjs${mod}`
  }));

const config = {
  context: __dirname,
  entry: './src/RollbarSourceMapPlugin.js',
  target: 'node',
  output: {
    path: DIST_PATH,
    library: 'rollbar-sourcemap-webpack-plugin',
    libraryTarget: 'umd',
    filename: 'RollbarSourceMapPlugin.js'
  },
  plugins: [
    new DefinePlugin({
      __DEV__: NODE_ENV === 'development' || NODE_ENV === 'test'
    })
  ],
  module: {
    preLoaders: [{
      test: /\.js/,
      loader: 'eslint',
      include: [SRC_PATH],
      exclude: [NODE_MODULES]
    }],
    loaders: [{
      test: /\.js/,
      loader: 'babel',
      include: [SRC_PATH, TEST_PATH],
      exclude: [NODE_MODULES]
    }]
  },
  externals,
  resolve: {
    extensions: ['.js', '']
  }
};

export default config;
