import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExtensionContext } from 'vscode';

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('activate', () => {
  it('should read hsml configuration', async () => {
    const { workspace } = await import('vscode');
    const { activate } = await import('../client/src/extension.js');
    activate({} as unknown as ExtensionContext);

    expect(workspace.getConfiguration).toHaveBeenCalledWith('hsml');
  });

  it('should use default server path "hsml"', async () => {
    const { workspace } = await import('vscode');
    const { activate } = await import('../client/src/extension.js');
    activate({} as unknown as ExtensionContext);

    const getConfig = workspace.getConfiguration as ReturnType<typeof vi.fn>;
    const mockConfig = getConfig.mock.results[0]?.value;
    expect(mockConfig.get).toHaveBeenCalledWith('server.path', 'hsml');
  });

  it('should watch hsml files', async () => {
    const { workspace } = await import('vscode');
    const { activate } = await import('../client/src/extension.js');
    activate({} as unknown as ExtensionContext);

    expect(workspace.createFileSystemWatcher).toHaveBeenCalledWith('**/*.hsml');
  });

  it('should start the language client', async () => {
    const { mockStart } = await import('./__mocks__/vscode-languageclient-node.js');
    const { activate } = await import('../client/src/extension.js');
    activate({} as unknown as ExtensionContext);

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
    activate({} as unknown as ExtensionContext);

    deactivate();
    expect(mockStop).toHaveBeenCalled();
  });
});
