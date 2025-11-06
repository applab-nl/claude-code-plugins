import { defineConfig } from 'tsup';
import fs from 'fs/promises';
import path from 'path';

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
  async onSuccess() {
    // Copy scripts directory to dist/ and ensure they're executable
    const scriptsSource = 'scripts';
    const scriptsDest = 'dist/scripts';

    console.log('Copying scripts directory to dist/...');
    await fs.cp(scriptsSource, scriptsDest, { recursive: true });

    // Make all shell scripts executable
    const scripts = await fs.readdir(scriptsDest);
    for (const script of scripts) {
      if (script.endsWith('.sh')) {
        const scriptPath = path.join(scriptsDest, script);
        await fs.chmod(scriptPath, 0o755);
        console.log(`Made executable: ${scriptPath}`);
      }
    }

    console.log('Scripts copied and made executable');
  },
});
