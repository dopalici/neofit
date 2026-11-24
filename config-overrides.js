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

  // Silence missing source map warning shipped by @mediapipe/tasks-vision (transitive dep of @react-three/drei)
  config.ignoreWarnings = [
    ...(config.ignoreWarnings || []),
    {
      module: /@mediapipe\/tasks-vision/,
      message: /Failed to parse source map/,
    },
  ];

  return config;
};
