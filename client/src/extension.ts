import type { ExtensionContext } from 'vscode';
import { commands, workspace } from 'vscode';
import type { Executable, LanguageClientOptions, ServerOptions } from 'vscode-languageclient/node';
import { LanguageClient } from 'vscode-languageclient/node';
import { resolveServerPath } from './binary.js';

let client: LanguageClient | undefined;

async function startClient(context: ExtensionContext): Promise<void> {
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

  await client.start();
}

export async function activate(context: ExtensionContext) {
  context.subscriptions.push(
    commands.registerCommand('hsml.restartLanguageServer', async () => {
      if (client) {
        await client.restart();
      } else {
        await startClient(context);
      }
    }),
  );

  await startClient(context);
}

export function deactivate(): Promise<void> | undefined {
  if (!client) {
    return undefined;
  }

  return client.stop();
}
