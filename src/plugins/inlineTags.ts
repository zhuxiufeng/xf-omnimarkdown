import MarkdownIt from 'markdown-it';

export function inlineTagsPlugin(md: any): void {
  // 1. Highlight: ==text==
  md.inline.ruler.before('emphasis', 'markdown_craft_mark', (state, silent) => {
    const src = state.src;
    const pos = state.pos;
    if (src.charCodeAt(pos) !== 0x3d /* = */ || src.charCodeAt(pos + 1) !== 0x3d) {
      return false;
    }
    const end = src.indexOf('==', pos + 2);
    if (end === -1) {
      return false;
    }
    if (!silent) {
      const content = src.slice(pos + 2, end);
      const tokenOpen = state.push('mark_open', 'mark', 1);
      tokenOpen.attrs = [['class', 'markdown-craft-mark']];
      const tokenText = state.push('text', '', 0);
      tokenText.content = content;
      state.push('mark_close', 'mark', -1);
    }
    state.pos = end + 2;
    return true;
  });

  // 2. Insert/Underline: ++text++
  md.inline.ruler.before('emphasis', 'markdown_craft_ins', (state, silent) => {
    const src = state.src;
    const pos = state.pos;
    if (src.charCodeAt(pos) !== 0x2b /* + */ || src.charCodeAt(pos + 1) !== 0x2b) {
      return false;
    }
    const end = src.indexOf('++', pos + 2);
    if (end === -1) {
      return false;
    }
    if (!silent) {
      const content = src.slice(pos + 2, end);
      const tokenOpen = state.push('ins_open', 'u', 1);
      tokenOpen.attrs = [['class', 'markdown-craft-ins']];
      const tokenText = state.push('text', '', 0);
      tokenText.content = content;
      state.push('ins_close', 'u', -1);
    }
    state.pos = end + 2;
    return true;
  });

  // 3. Keyboard Capsule: [[Key]] -> <kbd>Key</kbd>
  md.inline.ruler.before('emphasis', 'markdown_craft_kbd', (state, silent) => {
    const src = state.src;
    const pos = state.pos;
    if (src.charCodeAt(pos) !== 0x5b /* [ */ || src.charCodeAt(pos + 1) !== 0x5b) {
      return false;
    }
    const end = src.indexOf(']]', pos + 2);
    if (end === -1) {
      return false;
    }
    const content = src.slice(pos + 2, end);
    // Don't match if it's multiline or too long (> 30 chars, usually a wiki link)
    if (content.includes('\n') || content.length > 30 || content.length === 0) {
      return false;
    }
    if (!silent) {
      const tokenOpen = state.push('kbd_open', 'kbd', 1);
      tokenOpen.attrs = [['class', 'markdown-craft-kbd']];
      const tokenText = state.push('text', '', 0);
      tokenText.content = content;
      state.push('kbd_close', 'kbd', -1);
    }
    state.pos = end + 2;
    return true;
  });

  // 4. Superscript: ^text^
  md.inline.ruler.after('emphasis', 'markdown_craft_sup', (state, silent) => {
    const src = state.src;
    const pos = state.pos;
    if (src.charCodeAt(pos) !== 0x5e /* ^ */) {
      return false;
    }
    const end = src.indexOf('^', pos + 1);
    if (end === -1 || end === pos + 1) {
      return false;
    }
    const content = src.slice(pos + 1, end);
    if (content.includes('\n') || content.includes(' ') || content.length > 30) {
      return false;
    }
    if (!silent) {
      state.push('sup_open', 'sup', 1);
      const tokenText = state.push('text', '', 0);
      tokenText.content = content;
      state.push('sup_close', 'sup', -1);
    }
    state.pos = end + 1;
    return true;
  });

  // 5. Subscript: ~text~ (single tilde, avoid double tilde ~~strikethrough~~)
  md.inline.ruler.after('emphasis', 'markdown_craft_sub', (state, silent) => {
    const src = state.src;
    const pos = state.pos;
    if (src.charCodeAt(pos) !== 0x7e /* ~ */ || src.charCodeAt(pos + 1) === 0x7e) {
      return false;
    }
    let end = -1;
    for (let i = pos + 1; i < src.length; i++) {
      if (src.charCodeAt(i) === 0x7e && src.charCodeAt(i + 1) !== 0x7e && src.charCodeAt(i - 1) !== 0x7e) {
        end = i;
        break;
      }
    }
    if (end === -1 || end === pos + 1) {
      return false;
    }
    const content = src.slice(pos + 1, end);
    if (content.includes('\n') || content.includes(' ') || content.length > 30) {
      return false;
    }
    if (!silent) {
      state.push('sub_open', 'sub', 1);
      const tokenText = state.push('text', '', 0);
      tokenText.content = content;
      state.push('sub_close', 'sub', -1);
    }
    state.pos = end + 1;
    return true;
  });
}
