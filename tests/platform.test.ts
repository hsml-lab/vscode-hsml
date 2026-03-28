import { describe, expect, it } from 'vitest';
import {
  getArchiveExtension,
  getAssetName,
  getBinaryName,
  getChecksumUrl,
  getDownloadUrl,
  getLatestReleaseApiUrl,
  getReleaseArch,
  getReleasePlatform,
} from '../client/src/platform.js';

const ARCH_MAP: Record<string, string> = {
  x64: 'x86_64',
  arm64: 'aarch64',
};

const PLATFORM_MAP: Record<string, string> = {
  darwin: 'apple-darwin',
  linux: 'unknown-linux-gnu',
  win32: 'pc-windows-msvc',
};

describe('platform', () => {
  const expectedArch = ARCH_MAP[process.arch]!;
  const expectedPlatform = PLATFORM_MAP[process.platform]!;
  const expectedExt = process.platform === 'win32' ? '.zip' : '.tar.gz';
  const expectedAsset = `hsml-${expectedArch}-${expectedPlatform}${expectedExt}`;

  it('should map process.arch to release arch', () => {
    expect(getReleaseArch()).toBe(expectedArch);
  });

  it('should map process.platform to release platform', () => {
    expect(getReleasePlatform()).toBe(expectedPlatform);
  });

  it('should return correct archive extension for current platform', () => {
    expect(getArchiveExtension()).toBe(expectedExt);
  });

  it('should return correct binary name for current platform', () => {
    expect(getBinaryName()).toBe(process.platform === 'win32' ? 'hsml.exe' : 'hsml');
  });

  it('should construct exact asset name for current platform', () => {
    expect(getAssetName('0.4.1')).toBe(expectedAsset);
  });

  it('should construct exact download URL for current platform', () => {
    expect(getDownloadUrl('0.4.1')).toBe(
      `https://github.com/hsml-lab/hsml/releases/download/v0.4.1/${expectedAsset}`,
    );
  });

  it('should construct checksum URL', () => {
    expect(getChecksumUrl('0.4.1')).toBe(
      'https://github.com/hsml-lab/hsml/releases/download/v0.4.1/SHA256SUMS.txt',
    );
  });

  it('should return the latest release API URL', () => {
    expect(getLatestReleaseApiUrl()).toBe(
      'https://api.github.com/repos/hsml-lab/hsml/releases/latest',
    );
  });
});
