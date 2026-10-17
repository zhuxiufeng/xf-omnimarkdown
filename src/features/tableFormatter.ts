import * as vscode from 'vscode';

/**
 * Calculates string visual width (CJK / full-width = 2, ASCII = 1)
 */
export function getVisualWidth(str: string): number {
  let width = 0;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    // CJK Unified Ideographs & Fullwidth forms
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0x20000 && code <= 0x2a6df) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xff01 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

type Alignment = 'left' | 'center' | 'right' | 'none';

interface FormattedTable {
  startLine: number;
  endLine: number;
  formattedText: string;
}

export function formatTableLines(lines: string[]): string[] {
  if (lines.length < 2) {
    return lines;
  }

  // Parse rows into cells
  const matrix: string[][] = lines.map(line => {
    // Strip leading and trailing pipe if present
    let trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      trimmed = trimmed.slice(1);
    }
    if (trimmed.endsWith('|')) {
      trimmed = trimmed.slice(0, -1);
    }
    return trimmed.split('|').map(c => c.trim());
  });

  // Second row is separator
  const separatorRow = matrix[1];
  const alignments: Alignment[] = separatorRow.map(cell => {
    const trimmed = cell.replace(/\s+/g, '');
    const starts = trimmed.startsWith(':');
    const ends = trimmed.endsWith(':');
    if (starts && ends) return 'center';
    if (ends) return 'right';
    if (starts) return 'left';
    return 'none';
  });

  const colCount = Math.max(...matrix.map(r => r.length));

  // Calculate max width for each column (minimum 3 for separator ---)
  const colWidths: number[] = new Array(colCount).fill(3);
  for (let r = 0; r < matrix.length; r++) {
    if (r === 1) continue; // Skip separator row when calculating text width
    for (let c = 0; c < colCount; c++) {
      const cell = matrix[r][c] || '';
      colWidths[c] = Math.max(colWidths[c], getVisualWidth(cell));
    }
  }

  // Format rows
  return matrix.map((row, rIdx) => {
    if (rIdx === 1) {
      // Format separator
      const sepCells = colWidths.map((w, c) => {
        const align = alignments[c] || 'none';
        if (align === 'center') {
          return ':' + '-'.repeat(Math.max(1, w - 2)) + ':';
        } else if (align === 'right') {
          return '-'.repeat(Math.max(2, w - 1)) + ':';
        } else if (align === 'left') {
          return ':' + '-'.repeat(Math.max(2, w - 1));
        }
        return '-'.repeat(w);
      });
      return '| ' + sepCells.join(' | ') + ' |';
    }

    const cells = colWidths.map((w, c) => {
      const cell = row[c] || '';
      const cellWidth = getVisualWidth(cell);
      const padding = Math.max(0, w - cellWidth);
      const align = alignments[c] || 'none';

      if (align === 'right') {
        return ' '.repeat(padding) + cell;
      } else if (align === 'center') {
        const leftPad = Math.floor(padding / 2);
        const rightPad = padding - leftPad;
        return ' '.repeat(leftPad) + cell + ' '.repeat(rightPad);
      }
      return cell + ' '.repeat(padding);
    });

    return '| ' + cells.join(' | ') + ' |';
  });
}

export function formatTableCommand(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    return;
  }

  const document = editor.document;
  const lineCount = document.lineCount;

  // Identify markdown tables (consecutive lines containing '|')
  const tables: FormattedTable[] = [];
  let inTable = false;
  let tableStart = -1;
  let currentLines: string[] = [];

  for (let i = 0; i < lineCount; i++) {
    const text = document.lineAt(i).text;
    const isTableLine = text.trim().startsWith('|') || (text.includes('|') && text.trim().length > 0);

    if (isTableLine) {
      if (!inTable) {
        inTable = true;
        tableStart = i;
        currentLines = [];
      }
      currentLines.push(text);
    } else {
      if (inTable) {
        if (currentLines.length >= 2 && currentLines[1].includes('-')) {
          tables.push({
            startLine: tableStart,
            endLine: i - 1,
            formattedText: formatTableLines(currentLines).join('\n')
          });
        }
        inTable = false;
        currentLines = [];
      }
    }
  }

  if (inTable && currentLines.length >= 2 && currentLines[1].includes('-')) {
    tables.push({
      startLine: tableStart,
      endLine: lineCount - 1,
      formattedText: formatTableLines(currentLines).join('\n')
    });
  }

  if (tables.length === 0) {
    vscode.window.showInformationMessage('Markdown Craft: No markdown table found to format.');
    return;
  }

  editor.edit(editBuilder => {
    for (const t of tables) {
      const range = new vscode.Range(
        new vscode.Position(t.startLine, 0),
        new vscode.Position(t.endLine, document.lineAt(t.endLine).text.length)
      );
      editBuilder.replace(range, t.formattedText);
    }
  }).then(success => {
    if (success) {
      vscode.window.showInformationMessage(`Markdown Craft: Successfully formatted ${tables.length} table(s).`);
    }
  });
}
