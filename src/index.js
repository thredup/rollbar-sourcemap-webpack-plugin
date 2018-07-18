/* eslint-disable no-restricted-syntax,global-require */
const RollbarSourceMapPlugin = require('./RollbarSourceMapPlugin');

export const withRollbar = (nextConfig = {}) => Object.assign({}, nextConfig, {
  webpack(config, options) {
    if (!options.defaultLoaders) {
      throw new Error('This plugin is not compatible with Next.js versions below 5.0.0 https://err.sh/next-plugins/upgrade');
    }

    const { dev, buildId, isServer } = options;

    if (!dev && !isServer) {
      const { accessToken, publicPath } = nextConfig;

      const rollbarPlugin = new RollbarSourceMapPlugin({
        accessToken,
        version: buildId,
        publicPath,
        buildId,
        nextJs: true,
      });
      config.plugins.push(rollbarPlugin);
    }

    if (typeof nextConfig.webpack === 'function') {
      return nextConfig.webpack(config, options);
    }

    return config;
  }
});

export default RollbarSourceMapPlugin;
