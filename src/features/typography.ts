import * as vscode from 'vscode';
import pangu from 'pangu';

export function spaceText(text: string): string {
  try {
    if (typeof (pangu as any).spaceText === 'function') {
      return (pangu as any).spaceText(text);
    }
    if (typeof (pangu as any).spacing === 'function') {
      return (pangu as any).spacing(text);
    }
    if ((pangu as any).default) {
      if (typeof (pangu as any).default.spaceText === 'function') {
        return (pangu as any).default.spaceText(text);
      }
      if (typeof (pangu as any).default.spacing === 'function') {
        return (pangu as any).default.spacing(text);
      }
    }
  } catch (e) {
    console.error('Pangu spacing error:', e);
  }
  return text;
}

export function formatMarkdownTypography(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let inMathBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    if (trimmed === '$$') {
      inMathBlock = !inMathBlock;
      result.push(line);
      continue;
    }

    if (inMathBlock) {
      result.push(line);
      continue;
    }

    // Process line while protecting inline code and inline math
    const tokens: { placeholder: string; original: string }[] = [];
    let processedLine = line;

    // Protect inline code: `...`
    processedLine = processedLine.replace(/`[^`\n]+`/g, match => {
      const ph = `__INLINE_CODE_${tokens.length}__`;
      tokens.push({ placeholder: ph, original: match });
      return ph;
    });

    // Protect inline math: $...$
    processedLine = processedLine.replace(/\$[^$\n]+\$/g, match => {
      const ph = `__INLINE_MATH_${tokens.length}__`;
      tokens.push({ placeholder: ph, original: match });
      return ph;
    });

    // Protect markdown links: [text](url)
    processedLine = processedLine.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
      const formattedLinkText = spaceText(linkText);
      const ph = `__LINK_${tokens.length}__`;
      tokens.push({ placeholder: ph, original: `[${formattedLinkText}](${url})` });
      return ph;
    });

    // Run pangu spacing on the rest
    processedLine = spaceText(processedLine);

    // Restore protected tokens
    for (let k = tokens.length - 1; k >= 0; k--) {
      processedLine = processedLine.replace(tokens[k].placeholder, tokens[k].original);
    }

    result.push(processedLine);
  }

  return result.join('\n');
}

export function formatPanguCommand(): void {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'markdown') {
    return;
  }

  const document = editor.document;
  const fullText = document.getText();
  const formatted = formatMarkdownTypography(fullText);

  if (fullText === formatted) {
    vscode.window.showInformationMessage('Markdown Craft: Typography is already well-spaced.');
    return;
  }

  const fullRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(fullText.length)
  );

  editor.edit(editBuilder => {
    editBuilder.replace(fullRange, formatted);
  }).then(success => {
    if (success) {
      vscode.window.showInformationMessage('Markdown Craft: Typography formatted with CJK spacing (Pangu).');
    }
  });
}
