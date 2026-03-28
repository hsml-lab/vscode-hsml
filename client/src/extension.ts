import type { ExtensionContext } from 'vscode';
import { workspace } from 'vscode';
import type { Executable, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';
import { LanguageClient } from 'vscode-languageclient/node';
import { resolveServerPath } from './binary.js';

let client: LanguageClient | undefined;

export async function activate(context: ExtensionContext) {
  const serverPath = await resolveServerPath(context);
  if (!serverPath) {
    return;
  }

  const run: Executable = {
    command: serverPath,
    args: ['lsp'],
  };

  const serverOptions: ServerOptions = {
    run,
    debug: run,
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'hsml' }],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/*.hsml'),
    },
  };

  client = new LanguageClient(
    'languageServerHsml',
    'HSML Language Server',
    serverOptions,
    clientOptions,
  );

  client.start();
}

export function deactivate(): Promise<void> | undefined {
  if (!client) {
    return undefined;
  }

  return client.stop();
}
