require('dotenv').config();

const path = require('path');
const cp = require('child_process');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const S3Plugin = require('webpack-s3-plugin');
const RollbarSourcemapPlugin = require('../../dist/RollbarSourceMapPlugin');

const rollbarClientAccessToken = process.env.ROLLBAR_CLIENT_TOKEN;
const rollbarServerAccessToken = process.env.ROLLBAR_SERVER_TOKEN;
const bucket = process.env.AWS_S3_BUCKET;
const s3Options = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
};
const basePath = 'assets';
const publicPath = `https://s3-${s3Options.region}.amazonaws.com/${bucket}/${basePath}`;
let version;

try {
  version = cp.execSync('git rev-parse HEAD', {
    cwd: __dirname,
    encoding: 'utf8'
  });
} catch (err) {
  console.log('Error getting revision', err); // eslint-disable-line no-console
  process.exit(1);
}

module.exports = {
  mode: 'production',
  devtool: 'hidden-source-map',
  entry: {
    app: './src/index'
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath,
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js'
  },
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'initial'
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      /* eslint-disable quote-props */
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV)
      },
      /* eslint-enable quote-props */
      __ROLLBAR_ACCESS_TOKEN__: JSON.stringify(rollbarClientAccessToken),
      __GIT_REVISION__: JSON.stringify(version)
    }),
    new HtmlWebpackPlugin({ template: 'src/index.html' }),
    // Publish minified source
    new S3Plugin({
      include: /\.js$/,
      basePath,
      s3Options,
      s3UploadOptions: {
        Bucket: bucket,
        ACL: 'public-read',
        ContentType: 'application/javascript'
      }
    }),
    // Publish sourcemap, but keep it private
    new S3Plugin({
      include: /\.map$/,
      basePath: `${basePath}`,
      s3Options,
      s3UploadOptions: {
        Bucket: bucket,
        ACL: 'private',
        ContentType: 'application/json'
      }
    }),
    // Upload emitted sourcemaps to rollbar
    new RollbarSourcemapPlugin({
      accessToken: rollbarServerAccessToken,
      version,
      publicPath
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        include: path.join(__dirname, 'src'),
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [
                '@babel/preset-react',
                [
                  '@babel/preset-env',
                  { targets: { browsers: ['last 2 versions'] } }
                ]
              ]
            }
          }
        ]
      }
    ]
  }
};
