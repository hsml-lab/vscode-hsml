import { vi } from 'vitest';

export const workspace = {
  getConfiguration: vi.fn(() => ({
    get: vi.fn((_key: string, defaultValue: string) => defaultValue),
  })),
  createFileSystemWatcher: vi.fn(),
};

export const window = {
  showInformationMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  withProgress: vi.fn((_options: unknown, task: (progress: unknown) => Promise<unknown>) =>
    task({ report: vi.fn() }),
  ),
};

export const ProgressLocation = {
  Notification: 15,
};

export const Uri = {
  file: vi.fn((path: string) => ({ fsPath: path, scheme: 'file' })),
  joinPath: vi.fn((base: { fsPath: string }, ...segments: string[]) => ({
    fsPath: [base.fsPath, ...segments].join('/'),
  })),
};

export const commands = {
  executeCommand: vi.fn(),
  registerCommand: vi.fn((_command: string, _callback: (...args: unknown[]) => unknown) => ({
    dispose: vi.fn(),
  })),
};
