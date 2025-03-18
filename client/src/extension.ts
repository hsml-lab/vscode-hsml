import type { ExtensionContext } from 'vscode';
import { workspace } from 'vscode';
import type {
  Executable,
  LanguageClientOptions,
  ServerOptions,
} from 'vscode-languageclient/node';
import { LanguageClient } from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext) {
  console.debug('[@hsml/lsp-client:activate]', context);

  const run: Executable = {
    command: '/Users/shinigami/OpenSource/Shinigami92/hsml/target/debug/hsml',
    args: ['lsp'],
  };

  const serverOptions: ServerOptions = {
    run,
    debug: {
      ...run,
    },
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
    clientOptions
  );

  console.debug('[@hsml/lsp-client:activate]', 'starting client');
  client.start();
}

export function deactivate(): Promise<void> | undefined {
  console.debug('[@hsml/lsp-client:deactivate]');
  if (!client) {
    return undefined;
  }

  console.debug('[@hsml/lsp-client:deactivate]', 'stopping client');
  return client.stop();
}
