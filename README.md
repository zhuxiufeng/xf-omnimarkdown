# XF OmniMarkdown

<p align="center">
  <img src="./resources/icon.png" alt="XF OmniMarkdown Logo" width="128" height="128" />
</p>

<p align="center">
  <strong>An All-in-One Professional Markdown & Interactive Diagram Suite for VS Code</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/VS_Code-1.75.0+-007ACC?style=flat&logo=visual-studio-code" alt="VS Code" />
  <img src="https://img.shields.io/badge/Version-1.0.0-emerald?style=flat" alt="Version" />
  <img src="https://img.shields.io/badge/Built%20with-AI%20Pair%20Programming-blueviolet?style=flat&logo=openai" alt="Built with AI" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat" alt="License" />
</p>

---

## 🤖 Built with AI

> **Proudly engineered in collaboration with AI**:
> **XF OmniMarkdown** was conceived, architected, and iteratively developed using state-of-the-art **Agentic AI Coding Assistant** technology. From complex vector SVG geometry rendering, high-contrast dark theme mathematical algorithms, and custom typography engines to interactive Minimap DOM manipulation and CSP security hardening — the entire codebase showcases the capabilities of human-AI pair programming.

---

## 🌟 Overview

**XF OmniMarkdown** is part of the **XF Omni Developer Suite** (alongside *XF OmniNav* and *XF OmniJump*). It transforms VS Code's Markdown environment into an Obsidian-grade, publication-ready workspace with zero configuration needed.

Whether you are authoring engineering design documents, architectural diagrams, academic math papers, or daily technical notes, **XF OmniMarkdown** provides seamless previewing, smart formatting, and interactive exploration.

---

## ✨ Key Features

### 📊 1. Next-Gen Interactive Mermaid Diagrams
Go beyond static images — turn your architecture and flow diagrams into interactive workbenches:
- **High-Contrast Dark Theme Engine**: Automatically calculates WCAG-compliant line contrast, preventing dark-on-dark edge invisibility.
- **🎨 Multi-Theme Switcher**: Instant 1-click theme switching (**Auto / Forest / Neutral / Default / Dark**) with force-rerender caching.
- **🔄 Flow Direction Toggle**: Switch between **Top-Down (TD)** and **Left-to-Right (LR)** layouts on the fly without editing source code.
- **🔍 In-Diagram Node Search (`Ctrl+F`)**: Fuzzy search text across all diagram nodes with step-by-step navigation (`Enter` / `Shift+Enter`) and glowing focus highlights.
- **💡 Smart Trace Path Highlighting**: Hover over any node to illuminate its complete upstream and downstream dependency chain while dimming irrelevant paths.
- **📐 Engineering Blueprint Grid**: Toggle background dot grids for clean CAD/architecture diagram aesthetics.
- **🗺️ Interactive Minimap**: Bird's-eye overview of large architectural diagrams with real-time viewport panning.
- **🔍 Fluid Zoom & Pan**: Smooth zoom from 15% to 500%, true natural 1:1 scale preservation on page scroll, and double-click reset.
- **⛶ Immersive Fullscreen Mode**: Expand complex diagrams to full window for distraction-free analysis and presentations (`Esc` to exit).
- **⤓ Vector SVG Export**: 1-click download crisp, lossless `.svg` files for high-DPI documentation.

### 🛡️ 2. Obsidian & GitHub Style Callouts (Alerts)
- Supports full standard types: `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`, `[!SUCCESS]`, `[!QUESTION]`, `[!BUG]`, `[!EXAMPLE]`.
- **Collapsible Callouts**: Use `[!TIP]+` for expanded-by-default and `[!NOTE]-` for collapsed-by-default foldouts.
- High-aesthetic icons and colored accents matched to your current VS Code theme.

### 📐 3. Ultra-Fast Offline KaTeX Math
- Render inline math `$E = mc^2$` and multi-line equations `$$\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$$`.
- **100% Offline**: Bundles complete font assets (`KaTeX_AMS`, `KaTeX_Math`, etc.), with zero external CDN dependencies.

### 📏 4. CJK-Aware Smart Table Formatter
- Solves the longstanding issue where Chinese, Japanese, and Korean double-width characters misalign Markdown table columns.
- Automatically computes visual character widths and formats table columns with pixel-perfect alignment.

### ✍️ 5. Pangu Typography Auto-Spacing
- Automatically inserts correct typographic spacing between CJK characters, English words, and numbers.
- Configurable **Auto-Format on Save** for effortless consistency across team repositories.

### 📋 6. Clipboard Image Paste
- Press `Ctrl+Alt+V` (`Cmd+Alt+V` on macOS) to save clipboard screenshots directly to a workspace image asset folder and insert clean relative Markdown image links.

### 📑 7. Smart Table of Contents (TOC)
- Automatically parse heading hierarchies (`#` through `######`) and generate or refresh nested TOC anchors at the `<!-- TOC -->` placeholder.

### 🌐 8. Standalone Offline HTML Export
- Export complete self-contained `.html` documents with all styles, fonts, and rendered SVG graphics baked in — ready for offline sharing and email delivery.

---

## ⌨️ Command Palette & Shortcuts

| Action | Shortcut (Windows/Linux) | Shortcut (macOS) | Command ID |
| :--- | :--- | :--- | :--- |
| **Open Preview to Side** | `Ctrl + K V` | `Cmd + K V` | `markdown-craft.openPreview` |
| **Toggle Task List Item** | `Alt + Enter` | `Alt + Enter` | `markdown-craft.toggleTask` |
| **Paste Image from Clipboard** | `Ctrl + Alt + V` | `Cmd + Alt + V` | `markdown-craft.pasteImage` |
| **Insert Callout Block** | `Ctrl + Shift + P` | `Cmd + Shift + P` | `markdown-craft.insertCallout` |
| **Insert / Update TOC** | `Ctrl + Shift + P` | `Cmd + Shift + P` | `markdown-craft.insertTOC` |
| **Auto Format Table** | `Ctrl + Shift + P` | `Cmd + Shift + P` | `markdown-craft.formatTable` |
| **Format Typography (Pangu)** | `Ctrl + Shift + P` | `Cmd + Shift + P` | `markdown-craft.formatPangu` |
| **Export Standalone HTML** | `Ctrl + Shift + P` | `Cmd + Shift + P` | `markdown-craft.exportHTML` |
| **Toggle Diagram Direction** | `Ctrl + Shift + P` | `Cmd + Shift + P` | `markdown-craft.toggleMermaidDirection` |

---

## ⚙️ Configuration Settings

Configure in VS Code Settings (`Ctrl+,` or `Cmd+,`) or `.vscode/settings.json`:

```jsonc
{
  // Automatically format CJK typography spacing on save
  "markdownCraft.pangu.autoFormatOnSave": true
}
```

---

## 🚀 Building & Packaging from Source

```bash
# Clone the repository
git clone https://github.com/zhuxiufeng/xf-omnimarkdown.git
cd xf-omnimarkdown

# Install dependencies
npm install

# Compile TypeScript and bundle assets
npm run compile

# Package into a VSIX extension file
npm run package

# Install the extension into VS Code
code --install-extension xf-omnimarkdown-1.0.0.vsix --force
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

Developed with ❤️ and 🤖 AI Pair Programming by **zhuxiufeng**.  
Part of the **XF Omni Developer Suite**.
