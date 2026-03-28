import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import type { IncomingMessage } from 'node:http';
import { get as httpsGet } from 'node:https';
import { join } from 'node:path';
import { promisify } from 'node:util';
import type { ExtensionContext } from 'vscode';
import { ProgressLocation, commands, window, workspace } from 'vscode';
import {
  getAssetName,
  getBinaryName,
  getChecksumUrl,
  getDownloadUrl,
  getLatestReleaseApiUrl,
} from './platform.js';

const execFileAsync = promisify(execFile);

interface BinaryMetadata {
  version: string;
  downloadedAt: string;
}

export async function resolveServerPath(context: ExtensionContext): Promise<string | undefined> {
  const config = workspace.getConfiguration('hsml');
  const serverPath = config.get<string>('server.path', 'hsml');

  // User override — use as-is
  if (serverPath !== 'hsml') {
    return serverPath;
  }

  // Check if hsml is in PATH
  if (await isInPath()) {
    return 'hsml';
  }

  // Check for previously downloaded binary
  const storagePath = context.globalStorageUri.fsPath;
  const binaryPath = join(storagePath, getBinaryName());
  const metadataPath = join(storagePath, 'metadata.json');

  try {
    const metadata = JSON.parse(await readFile(metadataPath, 'utf-8')) as BinaryMetadata;
    if (metadata.version) {
      // Verify the binary file actually exists
      await access(binaryPath);
      // Binary exists, check for updates in the background
      checkForUpdate(context).catch(() => {});
      return binaryPath;
    }
  } catch {
    // No metadata, invalid, or binary missing — continue to download prompt
  }

  // Prompt user to download
  return promptDownload(context);
}

async function isInPath(): Promise<boolean> {
  const command = process.platform === 'win32' ? 'where' : 'which';
  try {
    await execFileAsync(command, ['hsml']);
    return true;
  } catch {
    return false;
  }
}

async function promptDownload(context: ExtensionContext): Promise<string | undefined> {
  const answer = await window.showInformationMessage(
    'The hsml binary was not found. Download it from GitHub?',
    'Download',
    'Cancel',
  );

  if (answer !== 'Download') {
    return undefined;
  }

  try {
    return await downloadBinary(context);
  } catch (error) {
    window.showErrorMessage(
      `Failed to download hsml: ${error instanceof Error ? error.message : error}`,
    );
    return undefined;
  }
}

export async function downloadBinary(context: ExtensionContext, version?: string): Promise<string> {
  const resolvedVersion = version ?? (await fetchLatestVersion());
  const storagePath = context.globalStorageUri.fsPath;

  await mkdir(storagePath, { recursive: true });

  const binaryPath = await window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: `Downloading hsml v${resolvedVersion}...`,
      cancellable: false,
    },
    async (progress) => {
      const assetName = getAssetName(resolvedVersion);
      const archivePath = join(storagePath, assetName);

      // Download archive
      progress.report({ message: 'Downloading binary...' });
      await downloadFile(getDownloadUrl(resolvedVersion), archivePath);

      // Verify checksum
      progress.report({ message: 'Verifying checksum...' });
      await verifyChecksum(archivePath, assetName, resolvedVersion);

      // Extract
      progress.report({ message: 'Extracting...' });
      await extractArchive(archivePath, storagePath);

      // Cleanup archive
      await rm(archivePath, { force: true });

      // Set executable permission on non-Windows
      const binPath = join(storagePath, getBinaryName());
      if (process.platform !== 'win32') {
        await chmod(binPath, 0o755);
      }

      // Write metadata
      const metadata: BinaryMetadata = {
        version: resolvedVersion,
        downloadedAt: new Date().toISOString(),
      };
      await writeFile(join(storagePath, 'metadata.json'), JSON.stringify(metadata, null, 2));

      return binPath;
    },
  );

  return binaryPath;
}

async function checkForUpdate(context: ExtensionContext): Promise<void> {
  const storagePath = context.globalStorageUri.fsPath;
  const metadataPath = join(storagePath, 'metadata.json');

  let currentVersion: string;
  try {
    const metadata = JSON.parse(await readFile(metadataPath, 'utf-8')) as BinaryMetadata;
    currentVersion = metadata.version;
  } catch {
    return;
  }

  let latestVersion: string;
  try {
    latestVersion = await fetchLatestVersion();
  } catch {
    return; // Silent failure — no internet or rate limited
  }

  if (latestVersion.localeCompare(currentVersion, undefined, { numeric: true }) <= 0) {
    return; // Already up to date
  }

  const answer = await window.showInformationMessage(
    `A new version of hsml (v${latestVersion}) is available. Update?`,
    'Update',
    'Dismiss',
  );

  if (answer !== 'Update') {
    return;
  }

  try {
    // Download to a staging directory to avoid overwriting the running binary
    const stagingDir = join(context.globalStorageUri.fsPath, '_staging');
    await mkdir(stagingDir, { recursive: true });

    const stagingContext = {
      ...context,
      globalStorageUri: { fsPath: stagingDir } as typeof context.globalStorageUri,
    } as ExtensionContext;

    await downloadBinary(stagingContext, latestVersion);

    // Move staged binary to the main location on reload
    const binaryName = getBinaryName();
    const stagedBinary = join(stagingDir, binaryName);
    const targetBinary = join(context.globalStorageUri.fsPath, binaryName);

    const reload = await window.showInformationMessage(
      'hsml has been updated. Reload window to apply?',
      'Reload',
    );
    if (reload === 'Reload') {
      // Replace the binary and metadata before reloading
      await rm(targetBinary, { force: true });
      const { rename } = await import('node:fs/promises');
      await rename(stagedBinary, targetBinary);
      await rename(
        join(stagingDir, 'metadata.json'),
        join(context.globalStorageUri.fsPath, 'metadata.json'),
      );
      await rm(stagingDir, { recursive: true, force: true });
      await commands.executeCommand('workbench.action.reloadWindow');
    }
  } catch (error) {
    window.showErrorMessage(
      `Failed to update hsml: ${error instanceof Error ? error.message : error}`,
    );
  }
}

async function fetchLatestVersion(): Promise<string> {
  const data = (await fetchJson(getLatestReleaseApiUrl())) as { tag_name: string };
  return data.tag_name.replace(/^v/, '');
}

async function verifyChecksum(
  archivePath: string,
  assetName: string,
  version: string,
): Promise<void> {
  const checksumText = await fetchText(getChecksumUrl(version));
  const lines = checksumText.trim().split('\n');

  let expectedHash: string | undefined;
  for (const line of lines) {
    const [hash, name] = line.trim().split(/\s+/);
    if (name === assetName && hash) {
      expectedHash = hash;
      break;
    }
  }

  if (!expectedHash) {
    throw new Error(`Checksum not found for ${assetName}`);
  }

  const actualHash = await computeSha256(archivePath);
  if (actualHash !== expectedHash) {
    await rm(archivePath, { force: true });
    throw new Error(
      `Checksum mismatch for ${assetName}: expected ${expectedHash}, got ${actualHash}`,
    );
  }
}

async function computeSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (data: string | Buffer) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

async function extractArchive(archivePath: string, destDir: string): Promise<void> {
  await execFileAsync('tar', ['-xf', archivePath, '-C', destDir]);
}

function followRedirects(url: string, options?: { timeout?: number }): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const req = httpsGet(
      url,
      { headers: { 'User-Agent': 'vscode-hsml' }, timeout: options?.timeout },
      (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          const location = res.headers.location;
          if (!location) {
            reject(new Error('Redirect without location header'));
            return;
          }
          followRedirects(location, options).then(resolve, reject);
          return;
        }

        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }

        resolve(res);
      },
    );

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timed out: ${url}`));
    });
  });
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  const res = await followRedirects(url, { timeout: 60_000 });
  const file = createWriteStream(destPath);

  try {
    await new Promise<void>((resolve, reject) => {
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
      file.on('error', (err: Error) => {
        file.close();
        reject(err);
      });
      res.on('error', reject);
    });
  } catch (error) {
    await rm(destPath, { force: true });
    throw error;
  }
}

async function fetchJson(url: string): Promise<unknown> {
  const text = await fetchText(url);
  return JSON.parse(text);
}

async function fetchText(url: string): Promise<string> {
  const res = await followRedirects(url, { timeout: 10_000 });
  return new Promise((resolve, reject) => {
    let data = '';
    res.on('data', (chunk: Buffer) => {
      data += chunk.toString();
    });
    res.on('end', () => resolve(data));
    res.on('error', reject);
  });
}
