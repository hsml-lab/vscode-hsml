import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExtensionContext } from 'vscode';
import { resolveServerPath } from './__mocks__/binary.js';

const mockContext = {
  globalStorageUri: { fsPath: '/tmp/test-storage' },
  subscriptions: [],
} as unknown as ExtensionContext;

beforeEach(() => {
  vi.clearAllMocks();
  resolveServerPath.mockResolvedValue('hsml');
});

describe('activate', () => {
  it('should not start client when no binary available', async () => {
    resolveServerPath.mockResolvedValue(undefined);
    const { workspace } = await import('vscode');
    const { mockStart } = await import('./__mocks__/vscode-languageclient-node.js');
    const { activate } = await import('../client/src/extension.js');
    await activate(mockContext);

    expect(workspace.createFileSystemWatcher).not.toHaveBeenCalled();
    expect(mockStart).not.toHaveBeenCalled();
  });

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

  it('should register restart command', async () => {
    const { commands } = await import('vscode');
    const { activate } = await import('../client/src/extension.js');
    await activate(mockContext);

    expect(commands.registerCommand).toHaveBeenCalledWith(
      'hsml.restartLanguageServer',
      expect.any(Function),
    );
  });
});

describe('restart command', () => {
  it('should call restart on existing client', async () => {
    const { commands } = await import('vscode');
    const { mockRestart } = await import('./__mocks__/vscode-languageclient-node.js');
    const { activate } = await import('../client/src/extension.js');
    await activate(mockContext);

    // Get the registered callback
    const registerCall = (commands.registerCommand as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[0] === 'hsml.restartLanguageServer',
    );
    const restartCallback = registerCall?.[1] as () => Promise<void>;
    await restartCallback();

    expect(mockRestart).toHaveBeenCalled();
  });
});

describe('deactivate', () => {
  it('should stop the client when active', async () => {
    const { mockStop } = await import('./__mocks__/vscode-languageclient-node.js');
    const { activate, deactivate } = await import('../client/src/extension.js');
    await activate(mockContext);
    await deactivate();
    expect(mockStop).toHaveBeenCalled();
  });
});
