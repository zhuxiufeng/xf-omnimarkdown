import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { createMarkdownRenderer } from './exporter';

export class CraftPreviewPanel {
  public static currentPanel: CraftPreviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _currentDocumentUri: vscode.Uri;

  public static createOrShow(extensionUri: vscode.Uri, document: vscode.TextDocument): void {
    const column = vscode.ViewColumn.Beside;

    if (CraftPreviewPanel.currentPanel) {
      CraftPreviewPanel.currentPanel._panel.reveal(column);
      CraftPreviewPanel.currentPanel._currentDocumentUri = document.uri;
      CraftPreviewPanel.currentPanel._update(document);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'markdownCraftPreview',
      `Preview: ${path.basename(document.fileName)}`,
      { viewColumn: column, preserveFocus: true },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'resources')
        ]
      }
    );

    CraftPreviewPanel.currentPanel = new CraftPreviewPanel(panel, extensionUri, document);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, document: vscode.TextDocument) {
    this._panel = panel;
    this._extensionUri = extensionUri;
    this._currentDocumentUri = document.uri;

    this._update(document);

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update preview when document is edited
    vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === this._currentDocumentUri.toString()) {
        this._update(e.document);
      }
    }, null, this._disposables);

    // Handle messages from preview webview
    this._panel.webview.onDidReceiveMessage(
      async message => {
        if (message.command === 'revealNodeText' && message.text) {
          const editor = vscode.window.visibleTextEditors.find(
            e => e.document.uri.toString() === this._currentDocumentUri.toString()
          );
          if (editor) {
            const text = editor.document.getText();
            const idx = text.indexOf(message.text);
            if (idx !== -1) {
              const pos = editor.document.positionAt(idx);
              editor.selection = new vscode.Selection(pos, editor.document.positionAt(idx + message.text.length));
              editor.revealRange(editor.selection, vscode.TextEditorRevealType.InCenter);
            }
          }
        }
      },
      null,
      this._disposables
    );

    // Update preview when switching to another markdown file
    vscode.window.onDidChangeActiveTextEditor(editor => {
      if (editor && editor.document.languageId === 'markdown') {
        this._currentDocumentUri = editor.document.uri;
        this._panel.title = `Preview: ${path.basename(editor.document.fileName)}`;
        this._update(editor.document);
      }
    }, null, this._disposables);
  }

  private _update(document: vscode.TextDocument): void {
    const md = createMarkdownRenderer();
    const renderedBody = md.render(document.getText());

    const webview = this._panel.webview;
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'styles', 'markdown-craft.css'));
    const katexCssUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'styles', 'katex.min.css'));
    const mermaidJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'scripts', 'mermaid.min.js'));
    const previewJsUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'scripts', 'markdown-craft-preview.js'));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Markdown Craft Preview</title>
  <link rel="stylesheet" href="${katexCssUri}">
  <link rel="stylesheet" href="${cssUri}">
  <style>
    body {
      font-family: var(--vscode-markdown-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      font-size: var(--vscode-markdown-font-size, 14px);
      line-height: var(--vscode-markdown-line-height, 1.6);
      color: var(--vscode-editor-foreground);
      background-color: var(--vscode-editor-background);
      padding: 20px 30px;
      max-width: 960px;
      margin: 0 auto;
      word-wrap: break-word;
    }
    h1, h2, h3, h4, h5, h6 {
      color: var(--vscode-editor-foreground);
      font-weight: 600;
      line-height: 1.25;
      margin-top: 24px;
      margin-bottom: 16px;
    }
    h1 { font-size: 2em; border-bottom: 1px solid var(--vscode-widget-border, rgba(127,127,127,0.2)); padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid var(--vscode-widget-border, rgba(127,127,127,0.2)); padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 16px 0;
    }
    th, td {
      border: 1px solid var(--vscode-widget-border, rgba(127,127,127,0.3));
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background-color: rgba(127,127,127,0.08);
      font-weight: 600;
    }
    pre, code {
      font-family: var(--vscode-editor-font-family, monospace);
    }
    code:not(pre code) {
      background-color: rgba(127,127,127,0.15);
      padding: 2px 5px;
      border-radius: 4px;
    }
    blockquote {
      border-left: 4px solid var(--vscode-textBlockQuote-border, #0969da);
      background: var(--vscode-textBlockQuote-background, rgba(127,127,127,0.05));
      margin: 16px 0;
      padding: 8px 16px;
    }
    img {
      max-width: 100%;
    }
  </style>
  <script src="${mermaidJsUri}"></script>
</head>
<body class="vscode-body">
  <article class="markdown-body">
    ${renderedBody}
  </article>
  <script src="${previewJsUri}"></script>
</body>
</html>`;

    this._panel.webview.html = html;
  }

  public dispose(): void {
    CraftPreviewPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}
