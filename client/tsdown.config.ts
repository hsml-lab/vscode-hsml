import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/extension.ts'],
  deps: {
    neverBundle: ['vscode'],
  },
  outDir: 'out',
  clean: true,
  format: 'esm',
  target: 'node22',
  platform: 'node',
  minify: false,
  unbundle: false,
  fixedExtension: false,
});
