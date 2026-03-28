import { describe, expect, it } from 'vitest';
import {
  getArchiveExtension,
  getAssetName,
  getBinaryName,
  getChecksumUrl,
  getDownloadUrl,
  getLatestReleaseApiUrl,
} from '../client/src/platform.js';

describe('platform', () => {
  it('should return correct archive extension for current platform', () => {
    const ext = getArchiveExtension();
    if (process.platform === 'win32') {
      expect(ext).toBe('.zip');
    } else {
      expect(ext).toBe('.tar.gz');
    }
  });

  it('should return correct binary name for current platform', () => {
    const name = getBinaryName();
    if (process.platform === 'win32') {
      expect(name).toBe('hsml.exe');
    } else {
      expect(name).toBe('hsml');
    }
  });

  it('should construct asset name with version', () => {
    const name = getAssetName('0.4.1');
    expect(name).toMatch(
      /^hsml-(x86_64|aarch64)-(apple-darwin|unknown-linux-gnu|pc-windows-msvc)\.(tar\.gz|zip)$/,
    );
  });

  it('should construct download URL', () => {
    const url = getDownloadUrl('0.4.1');
    expect(url).toMatch(
      /^https:\/\/github\.com\/hsml-lab\/hsml\/releases\/download\/v0\.4\.1\/hsml-/,
    );
  });

  it('should construct checksum URL', () => {
    const url = getChecksumUrl('0.4.1');
    expect(url).toBe('https://github.com/hsml-lab/hsml/releases/download/v0.4.1/SHA256SUMS.txt');
  });

  it('should return the latest release API URL', () => {
    const url = getLatestReleaseApiUrl();
    expect(url).toBe('https://api.github.com/repos/hsml-lab/hsml/releases/latest');
  });
});
