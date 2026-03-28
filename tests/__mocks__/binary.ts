import { vi } from 'vitest';

export const resolveServerPath = vi.fn(() => Promise.resolve('hsml' as string | undefined));
