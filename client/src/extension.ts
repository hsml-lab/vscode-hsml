import type { ExtensionContext } from 'vscode';
import { workspace } from 'vscode';
import type { Executable, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';
import { LanguageClient } from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export function activate(_context: ExtensionContext) {
  const config = workspace.getConfiguration('hsml');
  const serverPath = config.get<string>('server.path', 'hsml');

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
