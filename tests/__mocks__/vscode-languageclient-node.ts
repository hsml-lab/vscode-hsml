import { vi } from 'vitest';

export const mockStart = vi.fn();
export const mockStop = vi.fn(() => Promise.resolve());
export const mockRestart = vi.fn(() => Promise.resolve());

export class LanguageClient {
  start = mockStart;
  stop = mockStop;
  restart = mockRestart;
}
