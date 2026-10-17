import * as vscode from 'vscode';
import { calloutPlugin } from './plugins/callout';
import { katexPlugin } from './plugins/katexPlugin';
import { mermaidPlugin } from './plugins/mermaidPlugin';
import { inlineTagsPlugin } from './plugins/inlineTags';
import { mediaPlugin } from './plugins/mediaPlugin';
import { insertOrUpdateTOCCommand } from './features/toc';
import { formatTableCommand } from './features/tableFormatter';
import { formatPanguCommand, formatMarkdownTypography } from './features/typography';
import { exportHTMLCommand, exportWeChatCommand, toggleTaskCommand } from './features/exporter';
import { CraftPreviewPanel } from './features/previewPanel';
import { pasteImageCommand } from './features/pasteImage';

export function activate(context: vscode.ExtensionContext) {
  // 0. Dedicated Live Preview Panel
  context.subscriptions.push(
    vscode.commands.registerCommand('markdown-craft.openPreview', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.document.languageId === 'markdown') {
        CraftPreviewPanel.createOrShow(context.extensionUri, editor.document);
      } else {
        vscode.window.showWarningMessage('Markdown Craft: Please open a Markdown file to preview.');
      }
    })
  );

  // 1. Insert / Update Table of Contents
  context.subscriptions.push(
    vscode.commands.registerCommand('markdown-craft.insertTOC', () => {
      insertOrUpdateTOCCommand();
    })
  );

  // 2. Format Table with visual CJK alignment
  context.subscriptions.push(
    vscode.commands.registerCommand('markdown-craft.formatTable', () => {
      formatTableCommand();
    })
  );

  // 3. Typography & Pangu CJK spacing
  context.subscriptions.push(
    vscode.commands.registerCommand('markdown-craft.formatPangu', () => {
      formatPanguCommand();
    })
  );

  // 4. Interactive Callout snippet insertion
  context.subscriptions.push(
    vscode.commands.registerCommand('markdown-craft.insertCallout', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const items: (vscode.QuickPickItem & { type: string })[] = [
        { label: '$(info) Note', description: 'Useful information that users should know', type: 'NOTE' },
        { label: '$(lightbulb) Tip', description: 'Helpful advice for doing things better or easily', type: 'TIP' },
        { label: '$(star) Important', description: 'Crucial information needed for user success', type: 'IMPORTANT' },
        { label: '$(warning) Warning', description: 'Critical content demanding immediate attention', type: 'WARNING' },
        { label: '$(error) Caution', description: 'Negative potential consequences of an action', type: 'CAUTION' },
        { label: '$(check) Success', description: 'Positive milestone or completed status', type: 'SUCCESS' },
        { label: '$(question) Question', description: 'FAQs or open questions to discuss', type: 'QUESTION' },
        { label: '$(bug) Bug', description: 'Known issues or bug reports', type: 'BUG' },
        { label: '$(file-code) Example', description: 'Code demonstration or illustrative case', type: 'EXAMPLE' }
      ];

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select a Callout / Alert Type to insert'
      });

      if (!selected) return;

      const titleInput = await vscode.window.showInputBox({
        placeHolder: 'Optional custom title (leave empty for default)',
        prompt: `Enter title for [!${selected.type}]`
      });

      const isCollapsible = await vscode.window.showQuickPick(
        [
          { label: 'Normal Callout', value: '' },
          { label: 'Collapsible (Default Open)', value: '+' },
          { label: 'Collapsible (Default Folded)', value: '-' }
        ],
        { placeHolder: 'Should this callout be collapsible?' }
      );

      const mod = isCollapsible?.value || '';
      const titleSuffix = titleInput && titleInput.trim().length > 0 ? ' ' + titleInput.trim() : '';

      const snippet = new vscode.SnippetString(`> [!${selected.type}]${mod}${titleSuffix}\n> \${1:Content goes here...}\n\n$0`);
      editor.insertSnippet(snippet);
    })
  );

  // 5. Paste Image from Clipboard
  context.subscriptions.push(
    vscode.commands.registerCommand('markdown-craft.pasteImage', () => {
      pasteImageCommand();
    })
  );

  // 6. Standalone HTML Export
  context.subscriptions.push(
    vscode.commands.registerCommand('markdown-craft.exportHTML', () => {
      exportHTMLCommand(context);
    })
  );

  // 7. Copy for WeChat Official Account
  context.subscriptions.push(
    vscode.commands.registerCommand('markdown-craft.exportWeChat', () => {
      exportWeChatCommand();
    })
  );

  // 8. Toggle Task List Item
  context.subscriptions.push(
    vscode.commands.registerCommand('markdown-craft.toggleTask', () => {
      toggleTaskCommand();
    })
  );

  // 9. Auto-format on save if enabled (Pangu CJK spacing)
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument(event => {
      if (event.document.languageId !== 'markdown') return;
      const config = vscode.workspace.getConfiguration('markdownCraft');
      if (config.get<boolean>('pangu.autoFormatOnSave', true)) {
        const fullText = event.document.getText();
        const formatted = formatMarkdownTypography(fullText);
        if (fullText !== formatted) {
          const fullRange = new vscode.Range(
            event.document.positionAt(0),
            event.document.positionAt(fullText.length)
          );
          event.waitUntil(Promise.resolve([vscode.TextEdit.replace(fullRange, formatted)]));
        }
      }
    })
  );

  // 10. Document Formatting Provider
  context.subscriptions.push(
    vscode.languages.registerDocumentFormattingEditProvider('markdown', {
      provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
        const fullText = document.getText();
        const formatted = formatMarkdownTypography(fullText);
        if (fullText === formatted) return [];
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(fullText.length)
        );
        return [vscode.TextEdit.replace(fullRange, formatted)];
      }
    })
  );


  // 11. Toggle Mermaid Diagram Direction in Editor (TD <-> LR)
  context.subscriptions.push(
    vscode.commands.registerCommand('markdown-craft.toggleMermaidDirection', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'markdown') return;

      const doc = editor.document;
      const curPos = editor.selection.active;
      const text = doc.getText();

      const mermaidRegex = /(^```mermaid\s*\n)([\s\S]*?)(^```)/gm;
      let match: RegExpExecArray | null;
      let targetRange: vscode.Range | null = null;
      let newBlockText = '';

      while ((match = mermaidRegex.exec(text)) !== null) {
        const startIdx = match.index;
        const endIdx = startIdx + match[0].length;
        const startPos = doc.positionAt(startIdx);
        const endPos = doc.positionAt(endIdx);

        if (curPos.isAfterOrEqual(startPos) && curPos.isBeforeOrEqual(endPos)) {
          targetRange = new vscode.Range(startPos, endPos);
          const header = match[1];
          let code = match[2];
          const closer = match[3];

          let toggled = false;
          if (/^(\s*(?:flowchart|graph)\s+)(TD|TB|BT)(\b)/m.test(code)) {
            code = code.replace(/^(\s*(?:flowchart|graph)\s+)(TD|TB|BT)(\b)/m, '$1LR$3');
            toggled = true;
          } else if (/^(\s*(?:flowchart|graph)\s+)(LR|RL)(\b)/m.test(code)) {
            code = code.replace(/^(\s*(?:flowchart|graph)\s+)(LR|RL)(\b)/m, '$1TD$3');
            toggled = true;
          } else if (/(\bdirection\s+)(LR|RL)(\b)/m.test(code)) {
            code = code.replace(/(\bdirection\s+)(LR|RL)(\b)/m, '$1TB$3');
            toggled = true;
          } else if (/(\bdirection\s+)(TB|TD|BT)(\b)/m.test(code)) {
            code = code.replace(/(\bdirection\s+)(TB|TD|BT)(\b)/m, '$1LR$3');
            toggled = true;
          } else if (/^\s*stateDiagram(?:-v2)?\b/m.test(code)) {
            code = code.replace(/^(\s*stateDiagram(?:-v2)?\b.*)/m, '$1\n    direction LR');
            toggled = true;
          }

          if (toggled) {
            newBlockText = `${header}${code}${closer}`;
          }
          break;
        }
      }

      if (targetRange && newBlockText) {
        await editor.edit(editBuilder => {
          editBuilder.replace(targetRange!, newBlockText);
        });
        vscode.window.showInformationMessage('Markdown Craft: Mermaid 图表方向已切换 (TD ↔ LR)');
      } else {
        vscode.window.showWarningMessage('Markdown Craft: 请将光标置于 ```mermaid 代码块内执行方向切换');
      }
    })
  );

  // Return extension interface for VS Code Markdown preview
  return {
    extendMarkdownIt(md: any) {
      md.use(calloutPlugin);
      md.use(katexPlugin);
      md.use(mermaidPlugin);
      md.use(inlineTagsPlugin);
      md.use(mediaPlugin);
      return md;
    }
  };
}

export function deactivate() {}
