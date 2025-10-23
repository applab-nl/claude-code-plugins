import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'], // Use CommonJS for better Node.js compatibility with dynamic requires
  target: 'node18',
  bundle: true,
  minify: false,
  sourcemap: true,
  clean: true,
  dts: true,
  // Bundle ALL dependencies - critical for plugin distribution
  noExternal: [/.*/],
  platform: 'node',
  shims: true,
  treeshake: true,
  splitting: false,
  outExtension: ({ format }) => ({
    js: format === 'cjs' ? '.cjs' : '.js',
  }),
  // Note: shebang is already in src/index.ts, no need for banner
});
