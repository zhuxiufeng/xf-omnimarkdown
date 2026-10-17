import * as vscode from 'vscode';

interface Heading {
  level: number;
  text: string;
  slug: string;
  line: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '') // Keep alphanumeric, CJK and spaces/dashes
    .replace(/\s+/g, '-');
}

export function extractHeadings(content: string, maxDepth: number = 3): Heading[] {
  const lines = content.split('\n');
  const headings: Heading[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('```') || line.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }

    if (inCodeBlock) {
      continue;
    }

    // Match ATX headings (# to ######)
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      if (level <= maxDepth) {
        const rawText = match[2].trim();
        // Remove markdown formatting like bold, links, code from heading text
        const cleanText = rawText
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/[*_~`]/g, '');

        headings.push({
          level,
          text: cleanText,
          slug: slugify(cleanText),
          line: i
        });
      }
    }
  }

  return headings;
}

export function generateTOCMarkdown(headings: Heading[], ordered: boolean = false): string {
  if (headings.length === 0) {
    return '<!-- TOC -->\n<!-- /TOC -->\n';
  }

  const minLevel = Math.min(...headings.map(h => h.level));
  const lines: string[] = ['<!-- TOC -->', ''];

  const counters: number[] = new Array(7).fill(0);

  for (const h of headings) {
    const indentLevel = h.level - minLevel;
    const indent = '  '.repeat(indentLevel);

    if (ordered) {
      counters[h.level]++;
      for (let lvl = h.level + 1; lvl <= 6; lvl++) {
        counters[lvl] = 0;
      }
      lines.push(`${indent}${counters[h.level]}. [${h.text}](#${h.slug})`);
    } else {
      lines.push(`${indent}- [${h.text}](#${h.slug})`);
    }
  }

  lines.push('', '<!-- /TOC -->');
  return lines.join('\n');
}

export function insertOrUpdateTOCCommand(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    return;
  }

  const document = editor.document;
  const config = vscode.workspace.getConfiguration('markdownCraft.toc');
  const maxDepth = config.get<number>('depth', 3);
  const ordered = config.get<boolean>('ordered', false);

  const fullText = document.getText();
  const headings = extractHeadings(fullText, maxDepth);

  if (headings.length === 0) {
    vscode.window.showWarningMessage('Markdown Craft: No headings found in the current document.');
    return;
  }

  const tocText = generateTOCMarkdown(headings, ordered);

  // Check if TOC marker exists
  const tocRegex = /<!--\s*TOC\s*-->[\s\S]*?<!--\s*\/TOC\s*-->/i;
  const match = fullText.match(tocRegex);

  editor.edit(editBuilder => {
    if (match && match.index !== undefined) {
      // Update existing TOC in place
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      editBuilder.replace(new vscode.Range(startPos, endPos), tocText);
    } else {
      // Safely insert after top document title
      let targetLine = 0;
      for (let i = 0; i < Math.min(10, document.lineCount); i++) {
        if (document.lineAt(i).text.trim().startsWith('# ')) {
          targetLine = i + 1;
          break;
        }
      }
      const targetPos = new vscode.Position(targetLine, 0);
      editBuilder.insert(targetPos, '\n' + tocText + '\n\n');
    }
  }).then(success => {
    if (success) {
      vscode.window.showInformationMessage(`Markdown Craft: Table of Contents updated (${headings.length} headings).`);
    }
  });
}
