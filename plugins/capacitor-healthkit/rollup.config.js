import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'dist/esm/index.js',
  output: {
    file: 'dist/plugin.js',
    format: 'cjs',
    sourcemap: true,
    inlineDynamicImports: true,
  },
  external: ['@capacitor/core'],
  plugins: [
    nodeResolve(),
  ],
};