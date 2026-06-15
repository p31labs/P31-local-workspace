import * as vscode from 'vscode';
import * as path from 'path';

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri): string {
  const scriptPath = vscode.Uri.joinPath(extensionUri, 'dist', 'webview.js');
  const stylePath = vscode.Uri.joinPath(extensionUri, 'dist', 'webview.css');
  const scriptUri = webview.asWebviewUri(scriptPath);
  const styleUri = webview.asWebviewUri(stylePath);
  const nonce = getNonce();

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
      <title>P31 Copilot</title>
    </head>
    <body>
      <div id="root"></div>
      <script nonce="${nonce}" src="${scriptUri}"></script>
    </body>
    </html>`;
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

class P31CopilotProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._extensionUri, 'dist')]
    };
    webviewView.webview.html = getWebviewContent(webviewView.webview, this._extensionUri);

    const sendActiveEditor = () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && this._view) {
        const document = editor.document;
        const fileName = path.basename(document.fileName);
        const content = document.getText();
        this._view.webview.postMessage({
          type: 'activeEditorChange',
          payload: { fileName, content }
        });
      }
    };
    sendActiveEditor();
    vscode.window.onDidChangeActiveTextEditor(() => sendActiveEditor());
    vscode.workspace.onDidChangeTextDocument(() => sendActiveEditor());
  }
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new P31CopilotProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('p31CopilotSidebar', provider)
  );
}

export function deactivate() {}
