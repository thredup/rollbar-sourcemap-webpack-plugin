import path from 'path';
import cp from 'child_process';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import S3Plugin from 'webpack-s3-plugin';
import RollbarSourcemapPlugin from 'rollbar-sourcemap-webpack-plugin';

const rollbarClientAccessToken = 'aaaabbbbccccddddeeeeffff00001111';
const rollbarServerAccessToken = '11112222gggghhhhiiiijjjjkkkkllll';
const bucket = 'BUCKET_HERE';
const s3Options = {
  accessKeyId: 'ACCESS_KEY_HERE',
  secretAccessKey: 'SECRECT_KEY_HERE',
  region: 'REGION_HERE'
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

export default {
  devtool: 'source-map',
  entry: {
    app: './src/index',
    vendor: ['react', 'react-dom']
  },
  output: {
    path: path.join(__dirname, 'dist'),
    publicPath,
    filename: '[name]-[chunkhash].js',
    chunkFilename: '[name]-[chunkhash].js'
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.OccurenceOrderPlugin(true),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      minChunks: Infinity
    }),
    new webpack.DefinePlugin({
      /* eslint-disable quote-props */
      'process.env': {
        'NODE_ENV': JSON.stringify(process.env.NODE_ENV)
      },
      /* eslint-enable quote-props */
      __ROLLBAR_ACCESS_TOKEN__: JSON.stringify(rollbarClientAccessToken),
      __GIT_REVISION__: JSON.stringify(version)
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      },
      mangle: false
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
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        exclude: /node_modules/,
        include: path.join(__dirname, 'src')
      }
    ]
  }
};
