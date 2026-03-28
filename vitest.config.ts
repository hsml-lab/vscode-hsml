import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      exclude: ['tests/__mocks__/**'],
    },
  },
  resolve: {
    alias: {
      vscode: join(import.meta.dirname, 'tests/__mocks__/vscode.ts'),
      'vscode-languageclient/node': join(
        import.meta.dirname,
        'tests/__mocks__/vscode-languageclient-node.ts',
      ),
      './binary.js': join(import.meta.dirname, 'tests/__mocks__/binary.ts'),
    },
  },
});
