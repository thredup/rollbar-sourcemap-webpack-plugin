const RollbarSourcemapPlugin = require('rollbar-sourcemap-webpack-plugin');

const nextConfig = {
  webpack: (config, { dev, webpack }) => {
    if (!dev) {
      // generate sourcemaps
      config.output.futureEmitAssets = false;
      config.devtool = 'nosources-source-map';

      for (const plugin of config.plugins) {
        if (plugin.constructor.name === 'UglifyJsPlugin') {
          plugin.options.sourceMap = true;
          break;
        }
      }

      if (config.optimization && config.optimization.minimizer) {
        for (const plugin of config.optimization.minimizer) {
          if (plugin.constructor.name === 'TerserPlugin') {
            plugin.options.sourceMap = true;
            break;
          }
        }
      }

      // Generate a common `id` to be used when initializing Rollbar & when uploading the sourcemaps.
      // This could be any common value, as long as it is used in `_document.js` when initializing Rollbar.
      const gitRev = require('child_process')
        .execSync('git rev-parse --short HEAD')
        .toString()
        .trim();
      const codeVersion = JSON.stringify(gitRev);
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.GIT_REVISION': codeVersion
        })
      );

      config.plugins.push(
        new RollbarSourcemapPlugin({
          accessToken: '<ROLLBAR_ACCESS_TOKEN>',
          version: codeVersion,
          publicPath: 'https://domain.com/_next/'
        })
      );
    }

    return config;
  }
};

module.exports = nextConfig;
