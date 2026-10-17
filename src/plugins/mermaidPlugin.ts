import MarkdownIt from 'markdown-it';

export function mermaidPlugin(md: any): void {
  const defaultFence = md.renderer.rules['fence'] || function(tokens, idx, options, env, self) {
    return self.renderToken(tokens, idx, options);
  };

  md.renderer.rules['fence'] = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = token.info ? token.info.trim() : '';
    const lang = info.split(/\s+/)[0].toLowerCase();

    if (lang === 'mermaid') {
      const code = token.content.trim();
      const encoded = Buffer.from(code, 'utf-8').toString('base64');
      return '<div class="markdown-craft-mermaid-wrapper">\n' +
        '  <div class="mc-theme-toast"></div>\n' +
        '  <div class="markdown-craft-mermaid-toolbar">\n' +
        '    <button class="mc-zoom-btn mc-zoom-copy" title="复制 Mermaid 源码">\n' +
        '      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25v-7.5zM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25v-7.5zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25h-7.5z"/></svg>\n' +
        '    </button>\n' +
        '    <button class="mc-zoom-btn mc-zoom-download" title="另存为矢量 SVG 文件">\n' +
        '      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>\n' +
        '    </button>\n' +
        '    <span class="mc-toolbar-divider"></span>\n' +
        '    <button class="mc-zoom-btn mc-zoom-direction" title="切换图表方向 (TD 纵向 ↔ LR 横向)">\n' +
        '      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path fill-rule="evenodd" d="M1 11.5a.5.5 0 0 0 .5.5h11.793l-3.147 3.146a.5.5 0 0 0 .708.708l4-4a.5.5 0 0 0 0-.708l-4-4a.5.5 0 0 0-.708.708L13.293 11H1.5a.5.5 0 0 0-.5.5zm14-7a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 1 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 4H14.5a.5.5 0 0 1 .5.5z"/></svg>\n' +
        '    </button>\n' +
        '    <button class="mc-zoom-btn mc-zoom-theme" title="切换图表主题 (自动/森林/极简/经典/暗黑)">\n' +
        '      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm.5 1.054a7 7 0 0 1 4.542 2.502L8.5 7.414V1.054zM7.5 1.054v6.36L2.958 3.556A7 7 0 0 1 7.5 1.054zm-5.042 3.25 4.542 4.542H1.054A7 7 0 0 1 2.458 4.304zm0 7.392A7 7 0 0 1 1.054 8.5H7v5.946a7 7 0 0 1-4.542-2.75zm6.042 3.25V8.5h5.946a7 7 0 0 1-2.75 4.542L8.5 14.946zm5.042-3.25L9.042 7.154l3.856-3.856a7 7 0 0 1 1.644 4.402H8.5v4.246z"/></svg>\n' +
        '    </button>\n' +
        '    <button class="mc-zoom-btn mc-zoom-grid" title="切换工程点阵背景网格">\n' +
        '      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h11A1.5 1.5 0 0 1 15 2.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 13.5v-11zM2.5 2a.5.5 0 0 0-.5.5V5h3V2H2.5zM6 2v3h4V2H6zm5 0v3h3V2.5a.5.5 0 0 0-.5-.5H11zm3 4h-3v4h3V6zm0 5h-3v3h2.5a.5.5 0 0 0 .5-.5V11zm-4 3v-3H6v3h4zm-5 0v-3H2v2.5a.5.5 0 0 0 .5.5H5zm-3-4h3V6H2v4zm4-4v4h4V6H6z"/></svg>\n' +
        '    </button>\n' +
        '    <button class="mc-zoom-btn mc-zoom-trace" title="链路悬停高亮溯源开关">\n' +
        '      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a1.964 1.964 0 0 0-.453-.618A5.984 5.984 0 0 1 2 6zm6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1z"/></svg>\n' +
        '    </button>\n' +
        '    <button class="mc-zoom-btn mc-zoom-minimap" title="显示 / 隐藏小地图导航 (Minimap)">\n' +
        '      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path fill-rule="evenodd" d="M0 2a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V2zm1 0v12h14V2H1zm8 7.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v3a.5.5 0 0 1-.5.5h-4a.5.5 0 0 1-.5-.5v-3z"/></svg>\n' +
        '    </button>\n' +
        '    <button class="mc-zoom-btn mc-zoom-search" title="搜索图表节点文字 (Ctrl+F)">\n' +
        '      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/></svg>\n' +
        '    </button>\n' +
        '    <button class="mc-zoom-btn mc-zoom-fullscreen" title="全屏查看图表 (Esc 退出)">\n' +
        '      <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 1 0v-3.5h3.5a.5.5 0 0 0 0-1h-4zm9 0a.5.5 0 0 0 0 1h3.5v3.5a.5.5 0 0 0 1 0v-4a.5.5 0 0 0-.5-.5h-4zm4 9.5a.5.5 0 0 0-1 0v3.5h-3.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 .5-.5v-4zm-13.5 0a.5.5 0 0 0-1 0v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1h-3.5v-3.5z"/></svg>\n' +
        '    </button>\n' +
        '    <span class="mc-toolbar-divider"></span>\n' +
        '    <button class="mc-zoom-btn mc-zoom-out" title="缩小">\u2212</button>\n' +
        '    <input class="mc-zoom-input" type="text" value="100%" title="输入缩放比例并按回车" />\n' +
        '    <button class="mc-zoom-btn mc-zoom-in" title="放大">+</button>\n' +
        '    <button class="mc-zoom-btn mc-zoom-reset" title="复位到 1:1 真实尺寸 (100%)">\u21ba</button>\n' +
        '    <div class="mc-search-box" style="display:none;">\n' +
        '      <input class="mc-search-input" type="text" placeholder="搜索图表节点..." />\n' +
        '      <span class="mc-search-count">0/0</span>\n' +
        '      <button class="mc-search-nav mc-search-prev" title="上一个 (Shift+Enter)">▲</button>\n' +
        '      <button class="mc-search-nav mc-search-next" title="下一个 (Enter)">▼</button>\n' +
        '      <button class="mc-search-nav mc-search-close" title="关闭搜索 (Esc)">✕</button>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '  <div class="markdown-craft-mermaid-viewport">\n' +
        '    <div class="markdown-craft-mermaid-content" data-source-b64="' + encoded + '">\n' +
        '      <pre class="mc-mermaid-raw" style="display:none;">' + md.utils.escapeHtml(code) + '</pre>\n' +
        '    </div>\n' +
        '    <div class="mc-minimap" style="display:none;">\n' +
        '      <div class="mc-minimap-preview"></div>\n' +
        '      <div class="mc-minimap-rect"></div>\n' +
        '    </div>\n' +
        '  </div>\n' +
        '</div>\n\n';
    }

    const rawHtml = defaultFence(tokens, idx, options, env, self);
    const code = token.content;
    const encoded = Buffer.from(code, 'utf-8').toString('base64');
    const displayLang = lang || 'text';

    return '<div class="markdown-craft-code-block" data-lang="' + displayLang + '">\n' +
      '  <div class="markdown-craft-code-header">\n' +
      '    <span class="markdown-craft-code-lang">' + displayLang + '</span>\n' +
      '    <button class="markdown-craft-copy-btn" data-code-b64="' + encoded + '" title="Copy code">\n' +
      '      <svg class="copy-icon" viewBox="0 0 16 16" width="13" height="13" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25v-7.5zM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25v-7.5zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25h-7.5z"/></svg>\n' +
      '      <span class="copy-text">Copy</span>\n' +
      '    </button>\n' +
      '  </div>\n' +
      '  ' + rawHtml + '\n' +
      '</div>\n\n';
  };
}
