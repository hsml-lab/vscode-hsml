import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExtensionContext } from 'vscode';

vi.mock('../client/src/binary.js', () => ({
  resolveServerPath: vi.fn(() => Promise.resolve('hsml')),
}));

const mockContext = {
  globalStorageUri: { fsPath: '/tmp/test-storage' },
} as unknown as ExtensionContext;

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('activate', () => {
  it('should watch hsml files', async () => {
    const { workspace } = await import('vscode');
    const { activate } = await import('../client/src/extension.js');
    await activate(mockContext);

    expect(workspace.createFileSystemWatcher).toHaveBeenCalledWith('**/*.hsml');
  });

  it('should start the language client', async () => {
    const { mockStart } = await import('./__mocks__/vscode-languageclient-node.js');
    const { activate } = await import('../client/src/extension.js');
    await activate(mockContext);

    expect(mockStart).toHaveBeenCalled();
  });
});

describe('deactivate', () => {
  it('should return undefined when no client', async () => {
    const { deactivate } = await import('../client/src/extension.js');
    const result = deactivate();
    expect(result).toBeUndefined();
  });

  it('should stop the client when active', async () => {
    const { mockStop } = await import('./__mocks__/vscode-languageclient-node.js');
    const { activate, deactivate } = await import('../client/src/extension.js');
    await activate(mockContext);

    deactivate();
    expect(mockStop).toHaveBeenCalled();
  });
});
