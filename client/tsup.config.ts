import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/extension.ts'],
  external: ['vscode'],
  outDir: 'out',
  clean: true,
  format: 'cjs',
  target: ['es2022', 'node20'],
  platform: 'node',
  minify: false,
  bundle: true,
});
