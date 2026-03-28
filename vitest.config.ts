import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      vscode: join(import.meta.dirname, 'tests/__mocks__/vscode.ts'),
      'vscode-languageclient/node': join(
        import.meta.dirname,
        'tests/__mocks__/vscode-languageclient-node.ts',
      ),
    },
  },
});
