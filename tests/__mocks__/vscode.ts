import { vi } from 'vitest';

export const workspace = {
  getConfiguration: vi.fn(() => ({
    get: vi.fn((_key: string, defaultValue: string) => defaultValue),
  })),
  createFileSystemWatcher: vi.fn(),
};
