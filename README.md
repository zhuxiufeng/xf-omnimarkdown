# Markdown Craft (VS Code 增强套件)

> 一款全能、丝滑且轻量的 Markdown 生产力与视觉增强扩展，深度集成 VS Code 原生 Markdown 预览环境。

---

## ✨ 核心亮点

- 🛡️ **Obsidian & GitHub 风格 Callout 告警框**：支持 `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`, `[!SUCCESS]`, `[!QUESTION]`, `[!BUG]`, `[!EXAMPLE]`，并原生支持折叠展开 `[!TIP]+` 与 `[!NOTE]-`。
- 📐 **离线高保真 KaTeX 数学公式**：支持行内公式 `$E=mc^2$` 与多行公式块 `$$\int f(x)dx$$`，内置全套字体样式，纯离线秒级渲染。
- 📊 **Mermaid 矢量图表引擎**：流程图、时序图、状态图、甘特图、类图全支持，智能跟随 VS Code 浅色/深色主题。
- 📑 **智能目录 (TOC) 生成器**：一键生成/更新层级目录与锚点跳转，支持序号列表与圆点列表切换。
- 📏 **中英文混排表格自动对齐 (CJK Aware)**：解决中文与半角英文字符排版参差不齐的痛点，一键自动按列宽精准美化对齐。
- ✍️ **盘古中英文规范排版 (Pangu Spacing)**：在中英文、数字、链接之间优雅插入标准空格，可配置保存时自动格式化。
- 📋 **微信公众号 1-Click 一键排版**：自动内联样式，转为微信公众号后台兼容格式，一键粘贴即可发布，无需第三方排版编辑器。
- 🌐 **离线独立 HTML 导出**：导出完全自包含的单文件 HTML，公式与图表样式全内嵌，随时分享与离线浏览。
- 🎯 **行内语法增强**：==高亮文本==、++下划线插入++、^上标^、~下标~、[[快捷键胶囊]] 样式。

---

## 🚀 快捷指令速览

在 Markdown 文件中通过 `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`) 或右键菜单触发：

| 命令名称 | 命令 ID | 描述 |
| :--- | :--- | :--- |
| **Insert Callout Block** | `markdown-craft.insertCallout` | 交互式选择类型并插入告警框代码片段 |
| **Insert / Update Table of Contents** | `markdown-craft.insertTOC` | 插入或在现有 `<!-- TOC -->` 标记处更新目录 |
| **Auto Format Table** | `markdown-craft.formatTable` | 对齐中英文表格列宽与分隔线 |
| **Format Typography (CJK Pangu)** | `markdown-craft.formatPangu` | 中英文/数字规范化空格排版 |
| **Copy for WeChat Official Account** | `markdown-craft.exportWeChat` | 格式化并复制适合微信编辑器的富文本 |
| **Export Standalone HTML** | `markdown-craft.exportHTML` | 导出包含所有样式的自包含离线 HTML 文件 |
| **Toggle Task List Item** | `markdown-craft.toggleTask` | 快捷键 `Alt+Enter` 切换 `[ ]` 与 `[x]` |

---

## 🛠️ 安装与构建

```bash
# 1. 编译打包
npm run compile

# 2. 生成 VSIX 插件安装包
npm run package
```
