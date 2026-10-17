import MarkdownIt from 'markdown-it';

export interface CalloutMeta {
  type: string;
  title: string;
  icon: string;
  color: string;
  collapsible: boolean;
  defaultFolded: boolean;
}

const CALLOUT_CONFIG: Record<string, { title: string; icon: string; color: string }> = {
  note: {
    title: 'Note',
    icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75zM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>',
    color: '#0969da'
  },
  tip: {
    title: 'Tip',
    icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.677.933.208.38.375.856.375 1.51h3.5c0-.654.167-1.13.375-1.51.207-.377.454-.669.677-.933l.214-.253c.56-.679.984-1.32.984-2.304 0-2.06-1.637-3.75-4-3.75zM5.5 12h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1 0-1.5zm1 2.5h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1 0-1.5z"/></svg>',
    color: '#1a7f37'
  },
  important: {
    title: 'Important',
    icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H9.06l-2.573 2.573A1.458 1.458 0 0 1 4 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25v-9.5zM7.25 3.5v4a.75.75 0 0 0 1.5 0v-4a.75.75 0 0 0-1.5 0zm1.75 6.75a1 1 0 1 0-2 0 1 1 0 0 0 2 0z"/></svg>',
    color: '#8250df'
  },
  warning: {
    title: 'Warning',
    icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047zM8 5a.75.75 0 0 0-.75.75v3.5a.75.75 0 0 0 1.5 0v-3.5A.75.75 0 0 0 8 5zm1 7a1 1 0 1 0-2 0 1 1 0 0 0 2 0z"/></svg>',
    color: '#9a6700'
  },
  caution: {
    title: 'Caution',
    icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M2.343 13.657A8 8 0 1 1 13.657 2.343 8 8 0 0 1 2.343 13.657zM6.03 4.97a.75.75 0 0 0-1.06 1.06L6.94 8 4.97 9.97a.75.75 0 1 0 1.06 1.06L8 9.06l1.97 1.97a.75.75 0 0 0 1.06-1.06L9.06 8l1.97-1.97a.75.75 0 1 0-1.06-1.06L8 6.94 6.03 4.97z"/></svg>',
    color: '#cf222e'
  },
  info: {
    title: 'Info',
    icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm6.5-.25A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v3.25a.75.75 0 0 1-1.5 0V8.5h-.25a.75.75 0 0 1-.75-.75zM8 6a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>',
    color: '#0969da'
  },
  success: {
    title: 'Success',
    icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm3.78-9.72a.75.75 0 0 0-1.06-1.06L6.75 9.19 5.28 7.72a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0l4.5-4.5z"/></svg>',
    color: '#1a7f37'
  },
  question: {
    title: 'Question',
    icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm0-3.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm.83-4.32a.75.75 0 0 1-.83.72.75.75 0 0 1-.75-.75c0-1.12.72-1.92 1.48-2.43.74-.5 1.27-.93 1.27-1.72 0-1.1-.9-2-2-2s-2 .9-2 2a.75.75 0 0 1-1.5 0c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5c0 1.34-.84 2.05-1.63 2.58-.69.46-1.04.75-1.04 1.1z"/></svg>',
    color: '#8250df'
  },
  bug: {
    title: 'Bug',
    icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M4.72 3.22a.75.75 0 0 1 1.06 1.06L4.81 5.25h6.38l-.97-.97a.75.75 0 1 1 1.06-1.06l2.25 2.25a.75.75 0 0 1 0 1.06l-1.03 1.03c.3.56.49 1.19.5 1.86v.08h1.25a.75.75 0 0 1 0 1.5H13v.5a5.5 5.5 0 0 1-1.16 3.37l1.44 1.45a.75.75 0 1 1-1.06 1.06l-1.72-1.72A5.47 5.47 0 0 1 8 16a5.47 5.47 0 0 1-2.5-.6l-1.72 1.72a.75.75 0 0 1-1.06-1.06l1.44-1.45A5.5 5.5 0 0 1 3 14.08v-.5H1.75a.75.75 0 0 1 0-1.5H3v-.08c.01-.67.2-1.3.5-1.86L2.47 9.11a.75.75 0 0 1 0-1.06l2.25-2.25z"/></svg>',
    color: '#cf222e'
  },
  example: {
    title: 'Example',
    icon: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M0 2.75C0 1.784.784 1 1.75 1h12.5c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 14.25 15H1.75A1.75 1.75 0 0 1 0 13.25V2.75zm1.75-.25a.25.25 0 0 0-.25.25v10.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V2.75a.25.25 0 0 0-.25-.25H1.75zM4 4.5h8a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1 0-1.5zm0 3h8a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1 0-1.5zm0 3h5a.75.75 0 0 1 0 1.5H4a.75.75 0 0 1 0-1.5z"/></svg>',
    color: '#6e7781'
  }
};

export function calloutPlugin(md: any): void {
  md.core.ruler.after('block', 'markdown_craft_callout', (state) => {
    const tokens = state.tokens;

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type !== 'blockquote_open') {
        continue;
      }

      // Find the first inline token inside this blockquote
      let inlineTokenIdx = -1;
      let blockquoteCloseIdx = -1;
      let nesting = 1;

      for (let j = i + 1; j < tokens.length; j++) {
        if (tokens[j].type === 'blockquote_open') {
          nesting++;
        } else if (tokens[j].type === 'blockquote_close') {
          nesting--;
          if (nesting === 0) {
            blockquoteCloseIdx = j;
            break;
          }
        } else if (tokens[j].type === 'inline' && inlineTokenIdx === -1 && nesting === 1) {
          inlineTokenIdx = j;
        }
      }

      if (inlineTokenIdx === -1 || blockquoteCloseIdx === -1) {
        continue;
      }

      const inlineToken = tokens[inlineTokenIdx];
      const text = inlineToken.content || '';

      // Pattern: [!NOTE], [!TIP]+, [!WARNING]- Custom Title
      const match = text.match(/^\[!([a-zA-Z0-9_-]+)\]([+-]?)(?:[ \t]*(.*))?$/m);
      if (!match) {
        continue;
      }

      const rawType = match[1].toLowerCase();
      const foldModifier = match[2]; // '+' = default open, '-' = default folded
      const customTitle = (match[3] || '').trim();

      const config = CALLOUT_CONFIG[rawType] || {
        title: rawType.charAt(0).toUpperCase() + rawType.slice(1),
        icon: CALLOUT_CONFIG.note.icon,
        color: '#0969da'
      };

      const titleText = customTitle || config.title;
      const isCollapsible = foldModifier === '+' || foldModifier === '-';
      const isDefaultFolded = foldModifier === '-';

      // Remove the [!TYPE] line from inline token content
      const lines = text.split('\n');
      lines.shift();
      inlineToken.content = lines.join('\n').trimStart();

      // Transform blockquote_open into callout container
      const openToken = tokens[i];
      const closeToken = tokens[blockquoteCloseIdx];

      if (isCollapsible) {
        openToken.type = 'callout_details_open';
        openToken.tag = 'details';
        openToken.attrs = [
          ['class', `markdown-craft-callout markdown-craft-callout-${rawType} markdown-craft-collapsible`],
          ['data-callout-type', rawType]
        ];
        if (!isDefaultFolded) {
          openToken.attrs.push(['open', '']);
        }

        closeToken.type = 'callout_details_close';
        closeToken.tag = 'details';

        // Insert summary token right after blockquote_open / paragraph_open
        // We render summary directly in open token renderer or via custom token
        openToken.info = JSON.stringify({
          title: titleText,
          icon: config.icon,
          color: config.color,
          isCollapsible: true
        });
      } else {
        openToken.type = 'callout_open';
        openToken.tag = 'div';
        openToken.attrs = [
          ['class', `markdown-craft-callout markdown-craft-callout-${rawType}`],
          ['data-callout-type', rawType]
        ];
        openToken.info = JSON.stringify({
          title: titleText,
          icon: config.icon,
          color: config.color,
          isCollapsible: false
        });

        closeToken.type = 'callout_close';
        closeToken.tag = 'div';
      }
    }
    return true;
  });

  md.renderer.rules['callout_open'] = (tokens, idx) => {
    const token = tokens[idx];
    const info = JSON.parse(token.info || '{}');
    const titleEscaped = md.utils.escapeHtml(info.title || '');
    return `<div class="markdown-craft-callout markdown-craft-callout-${tokens[idx].attrs?.find(a => a[0] === 'data-callout-type')?.[1] || 'note'}">
  <div class="markdown-craft-callout-header">
    <span class="markdown-craft-callout-icon">${info.icon || ''}</span>
    <span class="markdown-craft-callout-title">${titleEscaped}</span>
  </div>
  <div class="markdown-craft-callout-content">\n`;
  };

  md.renderer.rules['callout_close'] = () => {
    return '  </div>\n</div>\n';
  };

  md.renderer.rules['callout_details_open'] = (tokens, idx) => {
    const token = tokens[idx];
    const info = JSON.parse(token.info || '{}');
    const titleEscaped = md.utils.escapeHtml(info.title || '');
    const isOpen = token.attrs?.some(a => a[0] === 'open');
    const openAttr = isOpen ? ' open' : '';
    const type = token.attrs?.find(a => a[0] === 'data-callout-type')?.[1] || 'note';

    return `<details class="markdown-craft-callout markdown-craft-callout-${type} markdown-craft-collapsible"${openAttr}>
  <summary class="markdown-craft-callout-header">
    <span class="markdown-craft-callout-icon">${info.icon || ''}</span>
    <span class="markdown-craft-callout-title">${titleEscaped}</span>
    <span class="markdown-craft-callout-chevron">
      <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor"><path d="M4.427 6.427l3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 6H4.604a.25.25 0 0 0-.177.427z"/></svg>
    </span>
  </summary>
  <div class="markdown-craft-callout-content">\n`;
  };

  md.renderer.rules['callout_details_close'] = () => {
    return '  </div>\n</details>\n';
  };
}
