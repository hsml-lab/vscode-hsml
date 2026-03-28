const ARCH_MAP: Record<string, string> = {
  x64: 'x86_64',
  arm64: 'aarch64',
};

const PLATFORM_MAP: Record<string, string> = {
  darwin: 'apple-darwin',
  linux: 'unknown-linux-gnu',
  win32: 'pc-windows-msvc',
};

const REPO = 'hsml-lab/hsml';

export function getReleaseArch(): string {
  const arch = ARCH_MAP[process.arch];
  if (!arch) {
    throw new Error(`Unsupported architecture: ${process.arch}`);
  }
  return arch;
}

export function getReleasePlatform(): string {
  const platform = PLATFORM_MAP[process.platform];
  if (!platform) {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
  return platform;
}

export function getArchiveExtension(): string {
  return process.platform === 'win32' ? '.zip' : '.tar.gz';
}

export function getBinaryName(): string {
  return process.platform === 'win32' ? 'hsml.exe' : 'hsml';
}

export function getAssetName(_version: string): string {
  return `hsml-${getReleaseArch()}-${getReleasePlatform()}${getArchiveExtension()}`;
}

export function getDownloadUrl(version: string): string {
  return `https://github.com/${REPO}/releases/download/v${version}/${getAssetName(version)}`;
}

export function getChecksumUrl(version: string): string {
  return `https://github.com/${REPO}/releases/download/v${version}/SHA256SUMS.txt`;
}

export function getLatestReleaseApiUrl(): string {
  return `https://api.github.com/repos/${REPO}/releases/latest`;
}
