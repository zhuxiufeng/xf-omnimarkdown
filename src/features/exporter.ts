import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import MarkdownIt from 'markdown-it';
import { calloutPlugin } from '../plugins/callout';
import { katexPlugin } from '../plugins/katexPlugin';
import { mermaidPlugin } from '../plugins/mermaidPlugin';
import { inlineTagsPlugin } from '../plugins/inlineTags';
import { mediaPlugin } from '../plugins/mediaPlugin';

export function createMarkdownRenderer(): any {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true
  });

  md.use(calloutPlugin);
  md.use(katexPlugin);
  md.use(mermaidPlugin);
  md.use(inlineTagsPlugin);
  md.use(mediaPlugin);

  return md;
}

export async function exportHTMLCommand(context: vscode.ExtensionContext): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showWarningMessage('Markdown Craft: Please open a Markdown file first.');
    return;
  }

  const document = editor.document;
  const content = document.getText();
  const title = path.basename(document.fileName, path.extname(document.fileName));

  const md = createMarkdownRenderer();
  const renderedBody = md.render(content);

  // Read CSS styles to inline
  const cssPath = path.join(context.extensionPath, 'resources', 'styles', 'markdown-craft.css');
  const katexCssPath = path.join(context.extensionPath, 'resources', 'styles', 'katex.min.css');
  const mermaidJsPath = path.join(context.extensionPath, 'resources', 'scripts', 'mermaid.min.js');

  let customCss = '';
  let katexCss = '';
  let mermaidJs = '';

  try {
    if (fs.existsSync(cssPath)) customCss = fs.readFileSync(cssPath, 'utf-8');
    if (fs.existsSync(katexCssPath)) katexCss = fs.readFileSync(katexCssPath, 'utf-8');
    if (fs.existsSync(mermaidJsPath)) mermaidJs = fs.readFileSync(mermaidJsPath, 'utf-8');
  } catch (err) {
    console.error('Error reading assets for export:', err);
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    :root {
      --bg-color: #ffffff;
      --text-color: #24292f;
      --border-color: #d0d7de;
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-color: #0d1117;
        --text-color: #c9d1d9;
        --border-color: #30363d;
      }
    }
    body {
      background-color: var(--bg-color);
      color: var(--text-color);
      font-family: var(--font-family);
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    ${katexCss}
    ${customCss}
  </style>
  <script>${mermaidJs}</script>
</head>
<body>
  <article class="markdown-body">
    ${renderedBody}
  </article>
  <script>
    if (typeof mermaid !== 'undefined') {
      mermaid.initialize({ startOnLoad: true, theme: 'default' });
    }
    // Code copy buttons
    document.querySelectorAll('.markdown-craft-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const b64 = btn.getAttribute('data-code-b64');
        if (b64) {
          const code = decodeURIComponent(escape(atob(b64)));
          navigator.clipboard.writeText(code).then(() => {
            const span = btn.querySelector('.copy-text');
            if (span) span.textContent = 'Copied!';
            setTimeout(() => { if (span) span.textContent = 'Copy'; }, 2000);
          });
        }
      });
    });
  </script>
</body>
</html>`;

  const defaultUri = vscode.Uri.file(document.fileName.replace(/\.md$/i, '.html'));
  const saveUri = await vscode.window.showSaveDialog({
    defaultUri: defaultUri,
    filters: { 'HTML Files': ['html'] }
  });

  if (!saveUri) {
    return;
  }

  fs.writeFileSync(saveUri.fsPath, fullHtml, 'utf-8');
  vscode.window.showInformationMessage(
    `Markdown Craft: Successfully exported to ${path.basename(saveUri.fsPath)}`,
    'Open in Browser'
  ).then(selection => {
    if (selection === 'Open in Browser') {
      vscode.env.openExternal(saveUri);
    }
  });
}

/**
 * Transforms Markdown into inline-styled HTML suitable for WeChat Official Accounts
 */
export async function exportWeChatCommand(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    vscode.window.showWarningMessage('Markdown Craft: Please open a Markdown file first.');
    return;
  }

  const document = editor.document;
  const content = document.getText();
  const md = createMarkdownRenderer();
  let html = md.render(content);

  // Inline styles for WeChat compatibility
  html = html
    // Headings
    .replace(/<h1>(.*?)<\/h1>/gi, '<h1 style="font-size: 24px; font-weight: bold; border-bottom: 2px solid #0969da; padding-bottom: 8px; margin-top: 28px; margin-bottom: 16px; color: #1f2328;">$1</h1>')
    .replace(/<h2>(.*?)<\/h2>/gi, '<h2 style="font-size: 20px; font-weight: bold; border-left: 4px solid #0969da; padding-left: 10px; margin-top: 24px; margin-bottom: 14px; color: #1f2328;">$1</h2>')
    .replace(/<h3>(.*?)<\/h3>/gi, '<h3 style="font-size: 17px; font-weight: bold; margin-top: 20px; margin-bottom: 12px; color: #1f2328;">$1</h3>')
    // Paragraphs
    .replace(/<p>(.*?)<\/p>/gi, '<p style="margin: 12px 0; line-height: 1.75; font-size: 15px; color: #333333; letter-spacing: 0.5px;">$1</p>')
    // Blockquote
    .replace(/<blockquote>([\s\S]*?)<\/blockquote>/gi, '<blockquote style="border-left: 4px solid #d0d7de; padding: 10px 16px; color: #656d76; background-color: #f6f8fa; margin: 16px 0; border-radius: 4px;">$1</blockquote>')
    // Tables
    .replace(/<table>([\s\S]*?)<\/table>/gi, '<table style="border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 14px; border: 1px solid #d0d7de;">$1</table>')
    .replace(/<th>(.*?)<\/th>/gi, '<th style="border: 1px solid #d0d7de; padding: 8px 12px; background-color: #f6f8fa; font-weight: 600; text-align: left;">$1</th>')
    .replace(/<td>(.*?)<\/td>/gi, '<td style="border: 1px solid #d0d7de; padding: 8px 12px;">$1</td>')
    // Code fences
    .replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/gi, '<pre style="background: #24292e; color: #f6f8fa; padding: 14px 18px; border-radius: 6px; overflow-x: auto; font-size: 13px; font-family: Consolas, Monaco, monospace; line-height: 1.5; margin: 16px 0;"><code$1>$2</code></pre>')
    // Inline code
    .replace(/<code>(.*?)<\/code>/gi, '<code style="background-color: rgba(175,184,193,0.2); padding: 2px 6px; border-radius: 4px; font-size: 85%; font-family: Consolas, Monaco, monospace; color: #cf222e;">$1</code>')
    // Links
    .replace(/<a ([^>]*)>(.*?)<\/a>/gi, '<a $1 style="color: #0969da; text-decoration: underline;">$2</a>');

  const wrapper = `<section style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.75; color: #333333; padding: 10px;">${html}</section>`;

  await vscode.env.clipboard.writeText(wrapper);
  vscode.window.showInformationMessage('Markdown Craft: WeChat-formatted HTML copied to clipboard! You can paste directly into WeChat editor.');
}

export function toggleTaskCommand(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    return;
  }

  const document = editor.document;
  const selection = editor.selection;
  const line = document.lineAt(selection.active.line);
  const text = line.text;

  let newText: string;
  if (/^(\s*[-*+]\s+)\[ \]/i.test(text)) {
    newText = text.replace(/^(\s*[-*+]\s+)\[ \]/i, '$1[x]');
  } else if (/^(\s*[-*+]\s+)\[x\]/i.test(text)) {
    newText = text.replace(/^(\s*[-*+]\s+)\[x\]/i, '$1[ ]');
  } else if (/^(\s*[-*+]\s+)/i.test(text)) {
    newText = text.replace(/^(\s*[-*+]\s+)/i, '$1[ ] ');
  } else {
    newText = '- [ ] ' + text;
  }

  editor.edit(editBuilder => {
    editBuilder.replace(line.range, newText);
  });
}
