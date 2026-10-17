(function() {
  let vscode = null;
  try {
    if (typeof acquireVsCodeApi === "function") {
      vscode = acquireVsCodeApi();
    }
  } catch(e) {}

  // Theme state: 'auto' | 'forest' | 'neutral' | 'default' | 'dark'
  const themeOrder = ['auto', 'forest', 'neutral', 'default', 'dark'];
  let userSelectedTheme = 'auto';
  try {
    userSelectedTheme = localStorage.getItem('markdown-craft-mermaid-theme') || 'auto';
  } catch(e) {}

  let gridEnabled = false;
  try {
    gridEnabled = localStorage.getItem('markdown-craft-grid') === 'true';
  } catch(e) {}

  let traceEnabled = true;
  try {
    const savedTrace = localStorage.getItem('markdown-craft-trace');
    if (savedTrace !== null) traceEnabled = savedTrace === 'true';
  } catch(e) {}

  const themeDisplayNames = {
    'auto': '自动跟随 (Auto)',
    'forest': '清新森林 (Forest)',
    'neutral': '极简工业 (Neutral)',
    'default': '经典浅色 (Default)',
    'dark': '暗黑科技 (Dark)'
  };

  function isDarkTheme() {
    const body = document.body;
    const doc = document.documentElement;

    if (body && (body.classList.contains("vscode-light") || body.classList.contains("vscode-high-contrast-light"))) {
      return false;
    }
    if (doc && (doc.classList.contains("vscode-light") || doc.classList.contains("vscode-high-contrast-light"))) {
      return false;
    }
    const themeKind = (body && body.getAttribute("data-vscode-theme-kind")) ||
                      (doc && doc.getAttribute("data-vscode-theme-kind"));
    if (themeKind && themeKind.includes("light")) {
      return false;
    }
    return true;
  }

  function getEffectiveTheme() {
    if (userSelectedTheme && userSelectedTheme !== 'auto') {
      return userSelectedTheme;
    }
    return isDarkTheme() ? 'dark' : 'default';
  }

  function getThemeVariables(themeName) {
    const isDark = isDarkTheme();

    if (isDark) {
      switch (themeName) {
        case 'forest':
          return {
            lineColor: '#68d391',
            arrowheadColor: '#68d391',
            defaultLinkColor: '#68d391',
            edgeLabelBackground: '#16291d',
            textColor: '#dcfce7',
            tertiaryTextColor: '#dcfce7',
            nodeBorder: '#48bb78',
            mainBkg: '#1c3826',
            clusterBkg: '#14261a',
            clusterBorder: '#2f855a'
          };
        case 'neutral':
          return {
            lineColor: '#e2e8f0',
            arrowheadColor: '#e2e8f0',
            defaultLinkColor: '#e2e8f0',
            edgeLabelBackground: '#262626',
            textColor: '#f8fafc',
            tertiaryTextColor: '#f8fafc',
            nodeBorder: '#94a3b8',
            mainBkg: '#2d333b',
            clusterBkg: '#1e2124',
            clusterBorder: '#4b5563'
          };
        case 'default':
          return {
            lineColor: '#c4b5fd',
            arrowheadColor: '#c4b5fd',
            defaultLinkColor: '#c4b5fd',
            edgeLabelBackground: '#241e3d',
            textColor: '#f5f3ff',
            tertiaryTextColor: '#f5f3ff',
            nodeBorder: '#a78bfa',
            mainBkg: '#292147',
            clusterBkg: '#1c1733',
            clusterBorder: '#7c3aed'
          };
        case 'dark':
        default:
          return {
            lineColor: '#38bdf8',
            arrowheadColor: '#38bdf8',
            defaultLinkColor: '#38bdf8',
            edgeLabelBackground: '#1e293b',
            textColor: '#f1f5f9',
            tertiaryTextColor: '#f1f5f9',
            nodeBorder: '#38bdf8',
            mainBkg: '#1e293b',
            clusterBkg: '#0f172a',
            clusterBorder: '#0284c7'
          };
      }
    } else {
      switch (themeName) {
        case 'forest':
          return {
            lineColor: '#276749',
            arrowheadColor: '#276749',
            defaultLinkColor: '#276749',
            edgeLabelBackground: '#f0fdf4',
            textColor: '#14532d',
            tertiaryTextColor: '#14532d'
          };
        case 'neutral':
          return {
            lineColor: '#334155',
            arrowheadColor: '#334155',
            defaultLinkColor: '#334155',
            edgeLabelBackground: '#f8fafc',
            textColor: '#0f172a',
            tertiaryTextColor: '#0f172a'
          };
        case 'default':
          return {
            lineColor: '#6d28d9',
            arrowheadColor: '#6d28d9',
            defaultLinkColor: '#6d28d9',
            edgeLabelBackground: '#faf5ff',
            textColor: '#4c1d95',
            tertiaryTextColor: '#4c1d95'
          };
        case 'dark':
          return {
            lineColor: '#0284c7',
            arrowheadColor: '#0284c7',
            defaultLinkColor: '#0284c7',
            edgeLabelBackground: '#f0f9ff',
            textColor: '#0c4a6e',
            tertiaryTextColor: '#0c4a6e'
          };
        default:
          return {};
      }
    }
  }

  if (typeof mermaid !== "undefined") {
    try {
      const eff = getEffectiveTheme();
      mermaid.initialize({
        startOnLoad: false,
        theme: eff,
        themeVariables: getThemeVariables(eff),
        securityLevel: "loose"
      });
    } catch(e) {}
  }

  const MAX_CACHE_SIZE = 120;
  const svgCache = new Map();

  function getCachedSvg(key) {
    if (!svgCache.has(key)) return null;
    const val = svgCache.get(key);
    svgCache.delete(key);
    svgCache.set(key, val);
    return val;
  }

  function setCachedSvg(key, svg) {
    if (svgCache.size >= MAX_CACHE_SIZE) {
      const firstKey = svgCache.keys().next().value;
      svgCache.delete(firstKey);
    }
    svgCache.set(key, svg);
  }

  let mermaidInitialized = false;
  let lastTheme = null;

  function ensureMermaidInitialized() {
    if (typeof mermaid === "undefined") {
      return false;
    }
    const currentTheme = getEffectiveTheme();

    if (!mermaidInitialized || lastTheme !== currentTheme) {
      try {
        if (typeof mermaid.mermaidAPI !== "undefined" && typeof mermaid.mermaidAPI.reset === "function") {
          mermaid.mermaidAPI.reset();
        }

        mermaid.initialize({
          startOnLoad: false,
          theme: currentTheme,
          themeVariables: getThemeVariables(currentTheme),
          securityLevel: "loose",
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          flowchart: {
            htmlLabels: true,
            curve: 'basis',
            useMaxWidth: true
          },
          sequence: {
            useMaxWidth: true
          },
          gantt: {
            useMaxWidth: true
          }
        });
        mermaidInitialized = true;
        lastTheme = currentTheme;
      } catch (e) {
        console.error("[Markdown Craft] mermaid.initialize error:", e);
      }
    }
    return true;
  }

  async function renderSingleElement(el, index, forceRerender) {
    if (!forceRerender && el.getAttribute("data-processed") === "true") return;
    el.setAttribute("data-processed", "true");

    const b64 = el.getAttribute("data-source-b64");
    let code = "";
    if (b64) {
      try {
        code = decodeURIComponent(escape(atob(b64)));
      } catch (e) {
        code = el.textContent || "";
      }
    } else {
      code = el.textContent || "";
    }

    const currentTheme = getEffectiveTheme();
    const cacheKey = currentTheme + ":" + (b64 || code);

    if (!forceRerender) {
      const cached = getCachedSvg(cacheKey);
      if (cached) {
        el.innerHTML = cached;
        el.style.minHeight = "";
        return;
      }
    }

    if (!ensureMermaidInitialized()) {
      el.removeAttribute("data-processed");
      return;
    }

    const id = "mermaid-svg-" + Date.now() + "-" + index + "-" + Math.random().toString(36).substr(2, 6);
    try {
      await mermaid.parse(code);
      const { svg } = await mermaid.render(id, code);
      setCachedSvg(cacheKey, svg);
      el.innerHTML = svg;
      el.style.minHeight = "";
    } catch (err) {
      console.error("[Markdown Craft] Mermaid render failed:", err);
      const errMsg = (err && err.message ? err.message : String(err)).replace(/</g, "&lt;").replace(/>/g, "&gt;");
      el.innerHTML = '<div class="mc-mermaid-error">' +
        '<div class="mc-mermaid-error-header"><span class="mc-error-badge">语法错误</span> <span>Mermaid 图表解析失败</span></div>' +
        '<pre class="mc-mermaid-error-msg">' + errMsg + '</pre>' +
        '</div>';
    }
  }

  let intersectionObserver = null;
  if (typeof IntersectionObserver !== "undefined") {
    intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const el = entry.target;
        if (entry.isIntersecting) {
          intersectionObserver.unobserve(el);
          renderSingleElement(el, 0).then(() => {
            const wrapper = el.closest('.markdown-craft-mermaid-wrapper');
            if (wrapper && typeof wrapper._initTransform === "function") {
              wrapper._initTransform(false);
            }
          });
        }
      });
    }, {
      rootMargin: "400px 0px 400px 0px",
      threshold: 0.01
    });
  }

  function renderMermaidBlocks() {
    const unrendered = document.querySelectorAll('.markdown-craft-mermaid-content:not([data-processed="true"])');
    if (!unrendered || unrendered.length === 0) return;

    unrendered.forEach((el, index) => {
      if (intersectionObserver && !el.getAttribute("data-observing")) {
        el.setAttribute("data-observing", "true");
        intersectionObserver.observe(el);
      } else if (!intersectionObserver) {
        renderSingleElement(el, index).then(() => {
          const wrapper = el.closest('.markdown-craft-mermaid-wrapper');
          if (wrapper && typeof wrapper._initTransform === "function") {
            wrapper._initTransform();
          }
        });
      }
    });
  }

  // True natural 1:1 original size of SVG from its viewBox
  function getSvgBaseSize(svg) {
    let vbW = 0;
    let vbH = 0;
    if (svg.viewBox && svg.viewBox.baseVal && svg.viewBox.baseVal.width > 0) {
      vbW = svg.viewBox.baseVal.width;
      vbH = svg.viewBox.baseVal.height;
    } else {
      const vb = svg.getAttribute("viewBox");
      if (vb) {
        const parts = vb.trim().split(/[\s,]+/);
        if (parts.length >= 4) {
          vbW = parseFloat(parts[2]);
          vbH = parseFloat(parts[3]);
        }
      }
    }
    if (!vbW || !vbH) {
      vbW = parseFloat(svg.getAttribute("width")) || 800;
      vbH = parseFloat(svg.getAttribute("height")) || 600;
    }

    return {
      width: Math.max(80, Math.round(vbW)),
      height: Math.max(40, Math.round(vbH))
    };
  }

  function toggleMermaidCodeDirection(code) {
    if (/^(\s*(?:flowchart|graph)\s+)(TD|TB|BT)(\b)/m.test(code)) {
      return code.replace(/^(\s*(?:flowchart|graph)\s+)(TD|TB|BT)(\b)/m, "$1LR$3");
    } else if (/^(\s*(?:flowchart|graph)\s+)(LR|RL)(\b)/m.test(code)) {
      return code.replace(/^(\s*(?:flowchart|graph)\s+)(LR|RL)(\b)/m, "$1TD$3");
    } else if (/(\bdirection\s+)(LR|RL)(\b)/m.test(code)) {
      return code.replace(/(\bdirection\s+)(LR|RL)(\b)/m, "$1TB$3");
    } else if (/(\bdirection\s+)(TB|TD|BT)(\b)/m.test(code)) {
      return code.replace(/(\bdirection\s+)(TB|TD|BT)(\b)/m, "$1LR$3");
    } else if (/^\s*stateDiagram(?:-v2)?\b/m.test(code)) {
      return code.replace(/^(\s*stateDiagram(?:-v2)?\b.*)/m, "$1\n    direction LR");
    }
    return code;
  }

  function showThemeToast(wrapper, msg) {
    const toast = wrapper.querySelector('.mc-theme-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    if (wrapper._toastTimer) clearTimeout(wrapper._toastTimer);
    wrapper._toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      wrapper._toastTimer = null;
    }, 1600);
  }

  async function applyGlobalTheme(newTheme, clickedWrapper) {
    userSelectedTheme = newTheme;
    try {
      localStorage.setItem('markdown-craft-mermaid-theme', userSelectedTheme);
    } catch(err) {}

    const displayName = themeDisplayNames[userSelectedTheme] || userSelectedTheme;

    svgCache.clear();
    mermaidInitialized = false;
    lastTheme = null;
    ensureMermaidInitialized();

    const wrappers = document.querySelectorAll('.markdown-craft-mermaid-wrapper');
    for (let i = 0; i < wrappers.length; i++) {
      const wrap = wrappers[i];
      const content = wrap.querySelector('.markdown-craft-mermaid-content');
      const btnTheme = wrap.querySelector('.mc-zoom-theme');
      if (btnTheme) {
        btnTheme.title = "切换图表主题 (当前: " + displayName + ")";
      }
      if (content) {
        await renderSingleElement(content, i, true);
        if (typeof wrap._applyTransform === "function") {
          wrap._applyTransform();
        }
        if (typeof wrap._updateMinimap === "function") {
          wrap._updateMinimap();
        }
      }
    }

    if (clickedWrapper) {
      showThemeToast(clickedWrapper, "🎨 主题: " + displayName);
      const btnTheme = clickedWrapper.querySelector('.mc-zoom-theme');
      if (btnTheme) {
        btnTheme.style.color = '#1a7f37';
        setTimeout(() => { btnTheme.style.color = ''; }, 700);
      }
    }
  }

  // PNG Ultra-Crisp Export & Clipboard Copy (2.5x Retina Canvas)
  async function exportPng(wrapper) {
    const svg = wrapper.querySelector('.markdown-craft-mermaid-content svg');
    if (!svg) return;
    const base = getSvgBaseSize(svg);
    const scaleFactor = 2.5;
    const width = Math.round(base.width * scaleFactor);
    const height = Math.round(base.height * scaleFactor);

    const clone = svg.cloneNode(true);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(height));
    clone.style.maxWidth = "none";

    const svgStr = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const URLObj = window.URL || window.webkitURL || window;
    const blobUrl = URLObj.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.fillStyle = isDarkTheme() ? '#1e1e1e' : '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URLObj.revokeObjectURL(blobUrl);

      canvas.toBlob((blob) => {
        if (!blob) return;

        // Try Copy to Clipboard
        let copied = false;
        try {
          if (navigator.clipboard && navigator.clipboard.write) {
            navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(() => {
              copied = true;
            }).catch(() => {});
          }
        } catch(e) {}

        // Download PNG file
        const pngUrl = URLObj.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = pngUrl;
        a.download = "mermaid-diagram-" + Date.now() + ".png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URLObj.revokeObjectURL(pngUrl);

        showThemeToast(wrapper, "📷 超清 PNG 已导出并复制到剪贴板！");
      }, "image/png");
    };
    img.onerror = () => {
      URLObj.revokeObjectURL(blobUrl);
      showThemeToast(wrapper, "PNG 导出失败，请尝试导出 SVG");
    };
    img.src = blobUrl;
  }

  // Parse flowchart connections from code to build node neighbor map for Trace Path
  function buildFlowchartGraph(code) {
    const adj = new Map(); // nodeId -> Set of connected nodeIds
    if (!code) return adj;

    const lines = code.split('\n');
    lines.forEach(line => {
      const clean = line.replace(/\|[^\|]+\|/g, '').trim(); // Remove edge labels |label|
      const parts = clean.split(/-->|---|==>|-\.->/);
      if (parts.length >= 2) {
        for (let i = 0; i < parts.length - 1; i++) {
          const uMatch = parts[i].trim().match(/^([a-zA-Z0-9_\-]+)/);
          const vMatch = parts[i+1].trim().match(/^([a-zA-Z0-9_\-]+)/);
          if (uMatch && vMatch) {
            const u = uMatch[1];
            const v = vMatch[1];
            if (!adj.has(u)) adj.set(u, new Set());
            if (!adj.has(v)) adj.set(v, new Set());
            adj.get(u).add(v);
            adj.get(v).add(u);
          }
        }
      }
    });
    return adj;
  }

  function bindMermaidControls() {
    const wrappers = document.querySelectorAll('.markdown-craft-mermaid-wrapper:not([data-controls-bound="true"])');
    wrappers.forEach(wrapper => {
      wrapper.setAttribute('data-controls-bound', 'true');

      const viewport = wrapper.querySelector('.markdown-craft-mermaid-viewport');
      const content = wrapper.querySelector('.markdown-craft-mermaid-content');
      const zoomInput = wrapper.querySelector('.mc-zoom-input');
      const btnIn = wrapper.querySelector('.mc-zoom-in');
      const btnOut = wrapper.querySelector('.mc-zoom-out');
      const btnReset = wrapper.querySelector('.mc-zoom-reset');
      const btnCopy = wrapper.querySelector('.mc-zoom-copy');
      const btnDirection = wrapper.querySelector('.mc-zoom-direction');
      const btnTheme = wrapper.querySelector('.mc-zoom-theme');
      const btnGrid = wrapper.querySelector('.mc-zoom-grid');
      const btnTrace = wrapper.querySelector('.mc-zoom-trace');
      const btnMinimap = wrapper.querySelector('.mc-zoom-minimap');
      const btnSearch = wrapper.querySelector('.mc-zoom-search');
      const btnDownload = wrapper.querySelector('.mc-zoom-download');
      const btnFullscreen = wrapper.querySelector('.mc-zoom-fullscreen');

      const searchBox = wrapper.querySelector('.mc-search-box');
      const searchInput = wrapper.querySelector('.mc-search-input');
      const searchCount = wrapper.querySelector('.mc-search-count');
      const searchPrev = wrapper.querySelector('.mc-search-prev');
      const searchNext = wrapper.querySelector('.mc-search-next');
      const searchClose = wrapper.querySelector('.mc-search-close');

      const minimap = wrapper.querySelector('.mc-minimap');
      const minimapPreview = wrapper.querySelector('.mc-minimap-preview');
      const minimapRect = wrapper.querySelector('.mc-minimap-rect');

      if (!viewport || !content) return;

      let scale = 1.0;
      let translateX = 0;
      let translateY = 0;
      const minScale = 0.15;
      const maxScale = 5.0;

      let minimapVisible = false;

      // Apply initial grid preference
      if (gridEnabled) {
        viewport.classList.add('mc-grid-active');
        if (btnGrid) btnGrid.style.color = '#38bdf8';
      }
      if (btnTrace) {
        btnTrace.style.color = traceEnabled ? '#38bdf8' : '';
      }

      function updateMinimap() {
        if (!minimapVisible || !minimap || !minimapPreview || !minimapRect) return;
        const svg = content.querySelector('svg');
        if (!svg) return;

        const base = getSvgBaseSize(svg);
        const curW = base.width * scale;
        const curH = base.height * scale;
        const vpW = viewport.clientWidth;
        const vpH = viewport.clientHeight;

        // Clone SVG to preview if not done or out of sync
        if (!minimapPreview.querySelector('svg')) {
          const clone = svg.cloneNode(true);
          clone.style.width = "100%";
          clone.style.height = "100%";
          clone.style.maxWidth = "100%";
          clone.style.maxHeight = "100%";
          minimapPreview.innerHTML = "";
          minimapPreview.appendChild(clone);
        }

        const mapW = minimap.clientWidth;
        const mapH = minimap.clientHeight;

        // Ratio of map box to full content
        const rw = mapW / Math.max(curW, vpW);
        const rh = mapH / Math.max(curH, vpH);
        const r = Math.min(rw, rh);

        const rectW = Math.max(12, Math.min(mapW, Math.round(vpW * r)));
        const rectH = Math.max(10, Math.min(mapH, Math.round(vpH * r)));

        // Position of rect
        const offsetX = (mapW - curW * r) / 2;
        const offsetY = (mapH - curH * r) / 2;
        const rectX = Math.max(0, Math.min(mapW - rectW, Math.round(offsetX + (-translateX) * r)));
        const rectY = Math.max(0, Math.min(mapH - rectH, Math.round(offsetY + (-translateY) * r)));

        minimapRect.style.width = rectW + "px";
        minimapRect.style.height = rectH + "px";
        minimapRect.style.left = rectX + "px";
        minimapRect.style.top = rectY + "px";
      }

      wrapper._updateMinimap = updateMinimap;

      function updateTransform(updateInput) {
        const svg = content.querySelector('svg');
        if (svg) {
          const base = getSvgBaseSize(svg);
          svg.style.maxWidth = "none";
          svg.style.width = Math.round(base.width * scale) + "px";
          svg.style.height = Math.round(base.height * scale) + "px";
        }
        content.style.transform = "translate(" + translateX + "px, " + translateY + "px)";

        if (updateInput !== false && zoomInput && document.activeElement !== zoomInput) {
          zoomInput.value = Math.round(scale * 100) + "%";
        }

        updateMinimap();
      }

      wrapper._applyTransform = updateTransform;

      // Intelligent Initial/Reset Layout: Never shrink below readable scale!
      function resetLayout(toNatural100, force) {
        if (!force && wrapper.hasAttribute('data-user-transformed')) {
          return;
        }
        const svg = content.querySelector('svg');
        const isFullscreen = wrapper.classList.contains("fullscreen");
        const pad = isFullscreen ? 80 : 36;
        const vpWidth = viewport ? Math.max(100, viewport.clientWidth - pad) : 800;
        const vpHeight = viewport ? Math.max(100, (isFullscreen ? viewport.clientHeight - 80 : 540)) : 500;

        if (!svg) {
          scale = 1.0;
          translateX = 0;
          translateY = 0;
          updateTransform(true);
          return;
        }

        const base = getSvgBaseSize(svg);

        if (isFullscreen) {
          const fit = Math.min(vpWidth / base.width, vpHeight / base.height);
          scale = Math.min(1.0, Math.max(0.15, Math.round(fit * 100) / 100));
          translateX = 0;
          translateY = 0;
        } else if (toNatural100 || base.width <= vpWidth) {
          scale = 1.0;
          translateX = 0;
          translateY = 0;
        } else {
          const ratio = vpWidth / base.width;
          if (ratio >= 0.8) {
            scale = Math.round(ratio * 100) / 100;
            translateX = 0;
            translateY = 0;
          } else {
            scale = 1.0;
            translateX = Math.round((base.width - vpWidth) / 2) + 24;
            translateY = (base.height > vpHeight) ? (Math.round((base.height - vpHeight) / 2) + 20) : 0;
          }
        }

        updateTransform(true);
        setupTraceAndClickBindings();
      }

      wrapper._initTransform = resetLayout;

      if (content.querySelector('svg')) {
        resetLayout(false);
      }

      function zoom(delta, clientX, clientY) {
        wrapper.setAttribute('data-user-transformed', 'true');
        const oldScale = scale;
        const newScale = Math.min(maxScale, Math.max(minScale, Math.round((scale + delta) * 100) / 100));
        if (newScale === oldScale) return;

        if (typeof clientX === "number" && typeof clientY === "number") {
          const rect = viewport.getBoundingClientRect();
          const mx = clientX - (rect.left + rect.width / 2);
          const my = clientY - (rect.top + rect.height / 2);

          const ratio = newScale / oldScale;
          translateX = Math.round(mx - (mx - translateX) * ratio);
          translateY = Math.round(my - (my - translateY) * ratio);
        } else {
          const ratio = newScale / oldScale;
          translateX = Math.round(translateX * ratio);
          translateY = Math.round(translateY * ratio);
        }

        scale = newScale;
        updateTransform(true);
      }

      // Feature 2: Engineering Dot Grid Toggle
      if (btnGrid) {
        btnGrid.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          gridEnabled = !gridEnabled;
          try {
            localStorage.setItem('markdown-craft-grid', String(gridEnabled));
          } catch(err) {}

          document.querySelectorAll('.markdown-craft-mermaid-viewport').forEach(vp => {
            if (gridEnabled) {
              vp.classList.add('mc-grid-active');
            } else {
              vp.classList.remove('mc-grid-active');
            }
          });
          document.querySelectorAll('.mc-zoom-grid').forEach(btn => {
            btn.style.color = gridEnabled ? '#38bdf8' : '';
          });
          showThemeToast(wrapper, gridEnabled ? "📐 工程网格背景已开启" : "📐 工程网格背景已关闭");
        });
      }

      // Feature 3: Trace Path Highlight Toggle
      if (btnTrace) {
        btnTrace.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          traceEnabled = !traceEnabled;
          try {
            localStorage.setItem('markdown-craft-trace', String(traceEnabled));
          } catch(err) {}
          btnTrace.style.color = traceEnabled ? '#38bdf8' : '';
          showThemeToast(wrapper, traceEnabled ? "💡 链路高亮溯源已开启" : "💡 链路高亮溯源已关闭");
        });
      }

      // Setup Node Hover Trace & Click-to-Source Bindings
      function setupTraceAndClickBindings() {
        const svg = content.querySelector('svg');
        if (!svg || svg._traceBound) return;
        svg._traceBound = true;

        const b64 = content.getAttribute("data-source-b64");
        let code = "";
        try {
          code = decodeURIComponent(escape(atob(b64)));
        } catch(e) {}
        const graph = buildFlowchartGraph(code);

        const nodes = svg.querySelectorAll('.node');
        nodes.forEach(node => {
          const text = (node.textContent || "").trim();
          let nodeId = node.id || "";
          const idMatch = nodeId.match(/flowchart-([^-]+)-/);
          if (idMatch) nodeId = idMatch[1];

          // 1. Hover Trace Highlight
          node.addEventListener("mouseenter", () => {
            if (!traceEnabled) return;
            svg.classList.add("mc-trace-active");
            const neighbors = graph.get(nodeId) || new Set();

            nodes.forEach(otherNode => {
              let otherId = otherNode.id || "";
              const m = otherId.match(/flowchart-([^-]+)-/);
              if (m) otherId = m[1];

              if (otherNode === node || neighbors.has(otherId)) {
                otherNode.classList.add("mc-node-highlight");
                otherNode.classList.remove("mc-dimmed");
              } else {
                otherNode.classList.remove("mc-node-highlight");
                otherNode.classList.add("mc-dimmed");
              }
            });

            svg.querySelectorAll('.edgePath, .edgeLabel').forEach(edge => {
              edge.classList.add("mc-dimmed");
            });
          });

          node.addEventListener("mouseleave", () => {
            svg.classList.remove("mc-trace-active");
            nodes.forEach(n => {
              n.classList.remove("mc-node-highlight", "mc-dimmed");
            });
            svg.querySelectorAll('.edgePath, .edgeLabel').forEach(edge => {
              edge.classList.remove("mc-edge-highlight", "mc-dimmed");
            });
          });

          // 2. Click-to-Source Double linkage
          node.addEventListener("click", (e) => {
            e.stopPropagation();
            node.classList.remove("mc-node-clicked");
            void node.offsetWidth; // Trigger reflow for animation
            node.classList.add("mc-node-clicked");

            const labelClean = text.split('\n')[0].slice(0, 30);
            if (vscode && labelClean) {
              try {
                vscode.postMessage({ command: 'revealNodeText', text: labelClean });
              } catch(err) {}
            }
          });
        });
      }

      // Feature 4: Minimap Navigation
      if (btnMinimap) {
        btnMinimap.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          minimapVisible = !minimapVisible;
          minimap.style.display = minimapVisible ? "block" : "none";
          btnMinimap.style.color = minimapVisible ? '#38bdf8' : '';
          if (minimapVisible) {
            minimapPreview.innerHTML = "";
            updateMinimap();
          }
        });

        // Click / Drag on Minimap to pan
        if (minimap) {
          minimap.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            e.preventDefault();
            const svg = content.querySelector('svg');
            if (!svg) return;

            const base = getSvgBaseSize(svg);
            const curW = base.width * scale;
            const curH = base.height * scale;
            const rect = minimap.getBoundingClientRect();

            function onMapMove(ev) {
              const mx = Math.max(0, Math.min(rect.width, ev.clientX - rect.left));
              const my = Math.max(0, Math.min(rect.height, ev.clientY - rect.top));
              const rx = mx / rect.width;
              const ry = my / rect.height;

              translateX = Math.round((0.5 - rx) * curW);
              translateY = Math.round((0.5 - ry) * curH);
              updateTransform(false);
            }

            onMapMove(e);
            function onMapUp() {
              window.removeEventListener("mousemove", onMapMove);
              window.removeEventListener("mouseup", onMapUp);
            }
            window.addEventListener("mousemove", onMapMove);
            window.addEventListener("mouseup", onMapUp);
          });
        }
      }

      // Feature 5: In-Diagram Search & Jump
      let searchMatches = [];
      let currentMatchIndex = -1;

      function performSearch(query) {
        const svg = content.querySelector('svg');
        if (!svg) return;

        svg.querySelectorAll('.node').forEach(n => {
          n.classList.remove('mc-search-matched', 'mc-search-current');
        });
        searchMatches = [];
        currentMatchIndex = -1;

        const q = query.trim().toLowerCase();
        if (!q) {
          searchCount.textContent = "0/0";
          return;
        }

        const nodes = svg.querySelectorAll('.node');
        nodes.forEach(node => {
          const txt = (node.textContent || "").toLowerCase();
          if (txt.includes(q)) {
            node.classList.add('mc-search-matched');
            searchMatches.push(node);
          }
        });

        if (searchMatches.length > 0) {
          goToMatch(0);
        } else {
          searchCount.textContent = "0/0";
        }
      }

      function goToMatch(index) {
        if (searchMatches.length === 0) return;
        currentMatchIndex = (index + searchMatches.length) % searchMatches.length;
        searchCount.textContent = (currentMatchIndex + 1) + "/" + searchMatches.length;

        searchMatches.forEach(n => n.classList.remove('mc-search-current'));
        const targetNode = searchMatches[currentMatchIndex];
        targetNode.classList.add('mc-search-current');

        // Smoothly center target node in viewport
        const svg = content.querySelector('svg');
        if (svg) {
          const base = getSvgBaseSize(svg);
          const bbox = targetNode.getBBox();
          const nodeCenterX = bbox.x + bbox.width / 2;
          const nodeCenterY = bbox.y + bbox.height / 2;

          translateX = Math.round((base.width / 2 - nodeCenterX) * scale);
          translateY = Math.round((base.height / 2 - nodeCenterY) * scale);
          updateTransform(false);
        }
      }

      if (btnSearch && searchBox) {
        btnSearch.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const isShown = searchBox.style.display !== "none";
          searchBox.style.display = isShown ? "none" : "inline-flex";
          btnSearch.style.color = isShown ? "" : "#38bdf8";
          if (!isShown && searchInput) {
            searchInput.focus();
            if (searchInput.value) performSearch(searchInput.value);
          } else {
            performSearch("");
          }
        });

        if (searchInput) {
          searchInput.addEventListener("input", () => {
            performSearch(searchInput.value);
          });
          searchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (e.shiftKey) {
                goToMatch(currentMatchIndex - 1);
              } else {
                goToMatch(currentMatchIndex + 1);
              }
            } else if (e.key === "Escape") {
              searchBox.style.display = "none";
              btnSearch.style.color = "";
              performSearch("");
            }
          });
        }

        if (searchNext) {
          searchNext.addEventListener("click", () => goToMatch(currentMatchIndex + 1));
        }
        if (searchPrev) {
          searchPrev.addEventListener("click", () => goToMatch(currentMatchIndex - 1));
        }
        if (searchClose) {
          searchClose.addEventListener("click", () => {
            searchBox.style.display = "none";
            btnSearch.style.color = "";
            performSearch("");
          });
        }
      }

      if (btnCopy) {
        btnCopy.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const b64 = content.getAttribute("data-source-b64");
          let code = "";
          if (b64) {
            try {
              code = decodeURIComponent(escape(atob(b64)));
            } catch (err) {
              code = content.textContent || "";
            }
          } else {
            code = content.textContent || "";
          }

          navigator.clipboard.writeText(code).then(() => {
            const origHtml = btnCopy.innerHTML;
            btnCopy.innerHTML = '<span style="color:#1a7f37; font-weight:bold; font-size:12px;">✓</span>';
            setTimeout(() => {
              btnCopy.innerHTML = origHtml;
            }, 1800);
          }).catch(err => {
            console.error("[Markdown Craft] Copy failed:", err);
          });
        });
      }

      if (btnTheme) {
        btnTheme.title = "切换图表主题 (当前: " + (themeDisplayNames[userSelectedTheme] || '自动') + ")";

        btnTheme.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const curIdx = themeOrder.indexOf(userSelectedTheme);
          const nextTheme = themeOrder[(curIdx + 1) % themeOrder.length];
          await applyGlobalTheme(nextTheme, wrapper);
        });
      }

      if (btnDirection) {
        btnDirection.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const b64 = content.getAttribute("data-source-b64");
          let code = "";
          if (b64) {
            try {
              code = decodeURIComponent(escape(atob(b64)));
            } catch (err) {
              code = content.textContent || "";
            }
          } else {
            code = content.textContent || "";
          }

          const toggledCode = toggleMermaidCodeDirection(code);
          if (toggledCode !== code) {
            const newB64 = btoa(unescape(encodeURIComponent(toggledCode)));
            content.setAttribute("data-source-b64", newB64);
            await renderSingleElement(content, 0, true);
            resetLayout(false);

            btnDirection.style.color = "#1a7f37";
            setTimeout(() => { btnDirection.style.color = ""; }, 800);
          }
        });
      }

      if (btnDownload) {
        btnDownload.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          const svg = content.querySelector('svg');
          if (!svg) return;

          const clone = svg.cloneNode(true);
          clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          clone.style.maxWidth = "none";

          const base = getSvgBaseSize(svg);
          clone.setAttribute("width", String(base.width));
          clone.setAttribute("height", String(base.height));

          const svgStr = '<?xml version="1.0" encoding="UTF-8"?>\n' + new XMLSerializer().serializeToString(clone);
          const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "mermaid-diagram-" + Date.now() + ".svg";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
      }

      if (btnFullscreen) {
        function toggleFullscreen() {
          const isFull = wrapper.classList.toggle("fullscreen");
          if (isFull) {
            document.body.style.overflow = "hidden";
            btnFullscreen.title = "退出全屏 (Esc)";
            btnFullscreen.innerHTML = '<span style="font-weight:bold; font-size:13px;">✕</span>';
          } else {
            document.body.style.overflow = "";
            btnFullscreen.title = "全屏查看图表 (Esc 退出)";
            btnFullscreen.innerHTML = '<svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor"><path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 0 1 0v-3.5h3.5a.5.5 0 0 0 0-1h-4zm9 0a.5.5 0 0 0 0 1h3.5v3.5a.5.5 0 0 0 1 0v-4a.5.5 0 0 0-.5-.5h-4zm4 9.5a.5.5 0 0 0-1 0v3.5h-3.5a.5.5 0 0 0 0 1h4a.5.5 0 0 0 .5-.5v-4zm-13.5 0a.5.5 0 0 0-1 0v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 0-1h-3.5v-3.5z"/></svg>';
          }

          requestAnimationFrame(() => {
            resetLayout(false);
          });
        }

        btnFullscreen.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFullscreen();
        });

        window.addEventListener("keydown", (e) => {
          if (e.key === "Escape" && wrapper.classList.contains("fullscreen")) {
            toggleFullscreen();
          }
        });
      }

      if (zoomInput) {
        function applyInputValue() {
          wrapper.setAttribute('data-user-transformed', 'true');
          const raw = zoomInput.value.replace(/%/g, "").trim();
          const val = parseFloat(raw);
          if (!isNaN(val) && val > 0) {
            const targetScale = Math.min(maxScale, Math.max(minScale, Math.round(val) / 100));
            zoom(targetScale - scale);
          } else {
            zoomInput.value = Math.round(scale * 100) + "%";
          }
        }

        zoomInput.addEventListener("focus", () => {
          zoomInput.select();
        });

        zoomInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            applyInputValue();
            zoomInput.blur();
          } else if (e.key === "Escape") {
            zoomInput.value = Math.round(scale * 100) + "%";
            zoomInput.blur();
          }
        });

        zoomInput.addEventListener("blur", () => {
          applyInputValue();
        });

        zoomInput.addEventListener("mousedown", (e) => {
          e.stopPropagation();
        });
      }

      if (btnIn) {
        btnIn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          zoom(0.2);
        });
      }

      if (btnOut) {
        btnOut.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          zoom(-0.2);
        });
      }

      if (btnReset) {
        btnReset.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          wrapper.removeAttribute('data-user-transformed');
          resetLayout(true, true);
        });
      }

      viewport.addEventListener("dblclick", (e) => {
        if (e.target.closest(".markdown-craft-mermaid-toolbar") || e.target.closest(".mc-minimap")) return;
        wrapper.removeAttribute('data-user-transformed');
        if (scale === 1.0) {
          resetLayout(false, true);
        } else {
          resetLayout(true, true);
        }
      });

      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let initTx = 0;
      let initTy = 0;
      let rafId = null;

      function onMouseMove(e) {
        if (!isDragging) return;
        wrapper.setAttribute('data-user-transformed', 'true');
        e.preventDefault();
        const curX = e.clientX;
        const curY = e.clientY;
        if (!rafId) {
          rafId = requestAnimationFrame(() => {
            translateX = initTx + (curX - startX);
            translateY = initTy + (curY - startY);
            updateTransform(false);
            rafId = null;
          });
        }
      }

      function onMouseUp() {
        if (!isDragging) return;
        isDragging = false;
        viewport.classList.remove("grabbing");
        if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      }

      viewport.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        if (e.target.closest(".markdown-craft-mermaid-toolbar") || e.target.closest(".mc-minimap")) return;
        isDragging = true;
        viewport.classList.add("grabbing");
        startX = e.clientX;
        startY = e.clientY;
        initTx = translateX;
        initTy = translateY;

        window.addEventListener("mousemove", onMouseMove, { passive: false });
        window.addEventListener("mouseup", onMouseUp);
      });

      viewport.addEventListener("wheel", (e) => {
        if (e.ctrlKey || e.metaKey || wrapper.classList.contains("fullscreen")) {
          e.preventDefault();
          const delta = e.deltaY < 0 ? 0.15 : -0.15;
          zoom(delta, e.clientX, e.clientY);
        }
      }, { passive: false });
    });
  }

  function bindCopyButtons() {
    document.querySelectorAll(".markdown-craft-copy-btn:not([data-bound])").forEach(btn => {
      btn.setAttribute("data-bound", "true");
      btn.addEventListener("click", () => {
        const b64 = btn.getAttribute("data-code-b64");
        if (!b64) return;

        try {
          const code = decodeURIComponent(escape(atob(b64)));
          navigator.clipboard.writeText(code).then(() => {
            const span = btn.querySelector(".copy-text");
            if (span) {
              const original = span.textContent;
              span.textContent = "Copied!";
              btn.style.borderColor = "#1a7f37";
              btn.style.color = "#1a7f37";
              setTimeout(() => {
                span.textContent = original;
                btn.style.borderColor = "";
                btn.style.color = "";
              }, 2000);
            }
          });
        } catch (err) {
          console.error("[Markdown Craft] Copy failed:", err);
        }
      });
    });
  }

  function runAll() {
    renderMermaidBlocks();
    bindMermaidControls();
    bindCopyButtons();
  }

  let debounceTimer = null;
  function scheduleRunAll() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      requestAnimationFrame(runAll);
    }, 50);
  }

  let currentThemeState = isDarkTheme();
  function checkAndHandleThemeChange() {
    const newThemeState = isDarkTheme();
    if (newThemeState !== currentThemeState) {
      currentThemeState = newThemeState;
      if (userSelectedTheme === 'auto') {
        applyGlobalTheme('auto', null);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      checkAndHandleThemeChange();
      scheduleRunAll();
    });
  } else {
    checkAndHandleThemeChange();
    runAll();
  }
  window.addEventListener("load", () => {
    checkAndHandleThemeChange();
    scheduleRunAll();
  });

  setTimeout(checkAndHandleThemeChange, 80);
  setTimeout(checkAndHandleThemeChange, 250);
  setTimeout(checkAndHandleThemeChange, 600);

  const observer = new MutationObserver(() => {
    scheduleRunAll();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const themeObserver = new MutationObserver(() => {
    checkAndHandleThemeChange();
  });
  if (document.body) {
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ["class", "data-vscode-theme-kind"] });
  }
  if (document.documentElement) {
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-vscode-theme-kind"] });
  }

  window.addEventListener("resize", () => {
    document.querySelectorAll(".markdown-craft-mermaid-wrapper.fullscreen").forEach(wrapper => {
      if (typeof wrapper._initTransform === "function") {
        wrapper._initTransform(false);
      }
    });
  });
})();
