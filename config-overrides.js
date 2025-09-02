// config-overrides.js
module.exports = function override(config, env) {
  // Add fallbacks for node.js core modules
  config.resolve.fallback = {
    ...config.resolve.fallback,
    fs: false,
    path: require.resolve("path-browserify"),
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
  };

  return config;
};
