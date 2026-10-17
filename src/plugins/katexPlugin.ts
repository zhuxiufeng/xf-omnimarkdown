import MarkdownIt from 'markdown-it';
import katex from 'katex';

function isValidInlineMath(str: string, matchIndex: number): boolean {
  // Check that opening $ is not followed by whitespace or digit (avoid $100)
  if (matchIndex + 1 < str.length && /\s/.test(str[matchIndex + 1])) {
    return false;
  }
  return true;
}

export function katexPlugin(md: any): void {
  // Inline math: $...$
  md.inline.ruler.after('escape', 'markdown_craft_math_inline', (state, silent) => {
    const src = state.src;
    const pos = state.pos;

    if (src.charCodeAt(pos) !== 0x24 /* $ */) {
      return false;
    }

    // Check if it's double $$ (handled by block math or inline block)
    if (src.charCodeAt(pos + 1) === 0x24) {
      return false;
    }

    if (!isValidInlineMath(src, pos)) {
      return false;
    }

    // Look for matching unescaped $
    let end = -1;
    for (let i = pos + 1; i < src.length; i++) {
      if (src.charCodeAt(i) === 0x24 && src.charCodeAt(i - 1) !== 0x5c /* \ */) {
        // Closing $ cannot be preceded by whitespace
        if (!/\s/.test(src[i - 1])) {
          end = i;
          break;
        }
      } else if (src.charCodeAt(i) === 0x0a /* newline */) {
        // Inline math cannot span multiple lines
        break;
      }
    }

    if (end === -1) {
      return false;
    }

    if (!silent) {
      const content = src.slice(pos + 1, end);
      const token = state.push('math_inline', 'math', 0);
      token.markup = '$';
      token.content = content;
    }

    state.pos = end + 1;
    return true;
  });

  // Block math: $$ ... $$
  md.block.ruler.after('blockquote', 'markdown_craft_math_block', (state, startLine, endLine, silent) => {
    let start = state.bMarks[startLine] + state.tShift[startLine];
    let max = state.eMarks[startLine];

    if (start + 2 > max) {
      return false;
    }

    if (state.src.slice(start, start + 2) !== '$$') {
      return false;
    }

    // Check if it closes on the same line
    let firstLine = state.src.slice(start + 2, max).trim();
    let haveEndMarker = false;

    if (firstLine.endsWith('$$') && firstLine.length >= 2) {
      if (!silent) {
        const content = firstLine.slice(0, -2).trim();
        const token = state.push('math_block', 'math', 0);
        token.block = true;
        token.content = content;
        token.map = [startLine, startLine + 1];
        token.markup = '$$';
      }
      state.line = startLine + 1;
      return true;
    }

    // Search for end marker in subsequent lines
    let nextLine = startLine;
    let contentLines: string[] = [];
    if (firstLine.length > 0) {
      contentLines.push(firstLine);
    }

    while (true) {
      nextLine++;
      if (nextLine >= endLine) {
        break;
      }

      start = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (start < max && state.tShift[nextLine] < state.blkIndent) {
        // Non-empty line with negative indent should stop
        break;
      }

      const lineText = state.src.slice(start, max).trim();
      if (lineText === '$$' || lineText.endsWith('$$')) {
        haveEndMarker = true;
        if (lineText !== '$$') {
          contentLines.push(lineText.replace(/\$\$$/, ''));
        }
        break;
      }
      contentLines.push(state.src.slice(start, max));
    }

    if (!haveEndMarker) {
      return false;
    }

    if (!silent) {
      const token = state.push('math_block', 'math', 0);
      token.block = true;
      token.content = contentLines.join('\n');
      token.map = [startLine, nextLine + 1];
      token.markup = '$$';
    }

    state.line = nextLine + 1;
    return true;
  });

  md.renderer.rules['math_inline'] = (tokens, idx) => {
    const math = tokens[idx].content;
    try {
      return katex.renderToString(math, {
        displayMode: false,
        throwOnError: false
      });
    } catch (err: any) {
      return `<span class="katex-error" title="${md.utils.escapeHtml(err.message)}">${md.utils.escapeHtml(math)}</span>`;
    }
  };

  md.renderer.rules['math_block'] = (tokens, idx) => {
    const math = tokens[idx].content;
    try {
      return `<div class="markdown-craft-math-block">${katex.renderToString(math, {
        displayMode: true,
        throwOnError: false
      })}</div>\n`;
    } catch (err: any) {
      return `<div class="katex-error" title="${md.utils.escapeHtml(err.message)}">${md.utils.escapeHtml(math)}</div>\n`;
    }
  };
}
