import MarkdownIt from 'markdown-it';

export function mediaPlugin(md: any): void {
  // Syntax: @[type](target "optional title")
  md.inline.ruler.before('link', 'markdown_craft_media', (state, silent) => {
    const src = state.src;
    const pos = state.pos;

    if (src.charCodeAt(pos) !== 0x40 /* @ */ || src.charCodeAt(pos + 1) !== 0x5b /* [ */) {
      return false;
    }

    const typeEnd = src.indexOf(']', pos + 2);
    if (typeEnd === -1) {
      return false;
    }

    if (src.charCodeAt(typeEnd + 1) !== 0x28 /* ( */) {
      return false;
    }

    const targetEnd = src.indexOf(')', typeEnd + 2);
    if (targetEnd === -1) {
      return false;
    }

    const mediaType = src.slice(pos + 2, typeEnd).trim().toLowerCase();
    const rawTarget = src.slice(typeEnd + 2, targetEnd).trim();

    // Check for title: url "title"
    let url = rawTarget;
    let title = '';
    const titleMatch = rawTarget.match(/^([^\s]+)(?:\s+["'](.*)["'])?$/);
    if (titleMatch) {
      url = titleMatch[1];
      title = titleMatch[2] || '';
    }

    const allowed = ['audio', 'video', 'bilibili', 'youtube', 'iframe'];
    if (!allowed.includes(mediaType)) {
      return false;
    }

    if (!silent) {
      const token = state.push('markdown_craft_media', 'div', 0);
      token.info = JSON.stringify({
        type: mediaType,
        url: url,
        title: title
      });
    }

    state.pos = targetEnd + 1;
    return true;
  });

  md.renderer.rules['markdown_craft_media'] = (tokens, idx) => {
    const info = JSON.parse(tokens[idx].info || '{}');
    const type = info.type;
    const url = md.utils.escapeHtml(info.url || '');
    const title = md.utils.escapeHtml(info.title || '');

    if (type === 'audio') {
      return `<div class="markdown-craft-media markdown-craft-audio">
  ${title ? `<div class="media-title">${title}</div>` : ''}
  <audio controls preload="metadata" src="${url}" style="width: 100%; outline: none;"></audio>
</div>`;
    }

    if (type === 'video') {
      return `<div class="markdown-craft-media markdown-craft-video">
  ${title ? `<div class="media-title">${title}</div>` : ''}
  <video controls preload="metadata" src="${url}" style="width: 100%; border-radius: 8px;"></video>
</div>`;
    }

    if (type === 'bilibili') {
      const bvidMatch = url.match(/(BV[a-zA-Z0-9]+)/i);
      const bvid = bvidMatch ? bvidMatch[1] : url;
      return `<div class="markdown-craft-media markdown-craft-iframe-wrapper">
  ${title ? `<div class="media-title">${title}</div>` : ''}
  <iframe src="https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" style="width: 100%; aspect-ratio: 16/9; border-radius: 8px;"></iframe>
</div>`;
    }

    if (type === 'youtube') {
      const ytMatch = url.match(/(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*)/);
      const videoId = ytMatch && ytMatch[1].length === 11 ? ytMatch[1] : url;
      return `<div class="markdown-craft-media markdown-craft-iframe-wrapper">
  ${title ? `<div class="media-title">${title}</div>` : ''}
  <iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width: 100%; aspect-ratio: 16/9; border-radius: 8px;"></iframe>
</div>`;
    }

    return `<div class="markdown-craft-media"><iframe src="${url}" style="width: 100%; border: none; border-radius: 8px;"></iframe></div>`;
  };
}
