# FreeMD

> 一款开源、简洁优雅的所见即所得 Markdown 编辑器。基于 Electron + Vue 3 + CodeMirror 6 构建，支持 Windows、macOS、Linux。

---

## 目录

- [核心功能](#核心功能)
- [安装与配置](#安装与配置)
- [运行命令](#运行命令)
- [目录结构](#目录结构)
- [Markdown 语法支持](#markdown-语法支持)
- [常见使用场景](#常见使用场景)
- [开发指南](#开发指南)
- [技术栈](#技术栈)
- [许可证](#许可证)
- [致谢](#致谢)

---

## 核心功能

### 1. 三种编辑视图

FreeMD 提供三种工作模式，通过工具栏按钮、菜单栏或快捷键即可自由切换：

| 模式 | 说明 | 快捷键 |
|------|------|--------|
| **预览模式** (Preview) | 仅显示渲染后的富文本效果，适合阅读和审阅 | `Ctrl/Cmd + 1` |
| **分屏模式** (Split) | 左侧编辑源码，右侧实时预览，适合写作和排版 | `Ctrl/Cmd + 2` |
| **源码模式** (Source) | 仅显示 Markdown 纯文本，适合纯键盘编辑 | `Ctrl/Cmd + 3` |

> 此外，按 `Ctrl/Cmd + /` 可以在三种模式之间循环切换。

**分屏联动滚动**：在分屏模式下，源码区和预览区会基于行号锚点实现双向联动滚动，滚动任意一侧，另一侧自动跟随定位到对应位置。

**分屏比例调节**：分屏模式下，中间的分隔条支持鼠标拖拽，可自由调整左右两侧的宽度比例（20%~80%）。

### 2. 实时预览

在编辑区输入内容后，右侧预览面板会**实时渲染**（120ms 防抖），支持所有 Markdown 语法和扩展语法的即时呈现。预览内容通过 DOMPurify 消毒处理，确保 XSS 安全。

### 3. 数学公式渲染（KaTeX）

支持使用 KaTeX 渲染数学公式，覆盖绝大部分 LaTeX 数学语法：

- **行内公式**：使用 `$...$` 包裹，例如 `$E = mc^2$` 渲染为 $E=mc^2$
- **块级公式**：使用 `$$...$$` 包裹，例如 `$$\sum_{i=1}^{n} x_i$$` 显示为独立居中公式

内置宏命令：
- `\RR` → $\mathbb{R}$（实数集）
- `\NN` → $\mathbb{N}$（自然数集）
- `\ZZ` → $\mathbb{Z}$（整数集）
- `\QQ` → $\mathbb{Q}$（有理数集）
- `\CC` → $\mathbb{C}$（复数集）

若公式语法有误，会以红色背景高亮显示错误内容，不会导致编辑器崩溃。

### 4. 代码语法高亮（highlight.js）

支持 **180+ 编程语言**的代码块语法高亮。使用标准 Markdown 围栏代码块语法：

````markdown
```python
def hello():
    print("Hello, FreeMD!")
```

```javascript
const greet = (name) => `Hello, ${name}!`;
```
````

代码块带有**一键复制按钮**：鼠标悬停在代码块上时，右上角出现"复制"按钮，点击即可将代码内容复制到剪贴板。

### 5. 深色 / 浅色主题

支持三种主题模式，可通过工具栏按钮或菜单栏切换：

| 模式 | 说明 | 菜单路径 |
|------|------|----------|
| **跟随系统** (Auto) | 自动跟随操作系统的明暗主题设置（默认） | 视图 → 切换主题 → 跟随系统 |
| **浅色** (Light) | 浅色背景，适合日间使用 | 视图 → 切换主题 → 浅色 |
| **深色** (Dark) | 深色背景，护眼舒适，适合夜间或编程 | 视图 → 切换主题 → 深色 |

工具栏右侧的主题按钮也可以快速切换当前主题（浅色 ↔ 深色）。

### 6. 文件操作

支持完整的文件管理功能：

| 操作 | 说明 | 快捷键 |
|------|------|--------|
| **新建** | 清空编辑器，创建空白文档 | `Ctrl/Cmd + N` |
| **打开** | 通过系统文件对话框打开 .md / .markdown / .txt 文件 | `Ctrl/Cmd + O` |
| **保存** | 保存当前文档（未保存过则自动弹出另存为对话框） | `Ctrl/Cmd + S` |
| **另存为** | 将文档保存到指定路径 | `Ctrl/Cmd + Shift + S` |
| **拖拽打开** | 直接将 .md/.markdown/.txt 文件拖入窗口即可打开 | — |
| **双击打开** | 在文件管理器中双击 .md 文件，可直接用 FreeMD 打开 | — |
| **命令行打开** | 在终端中执行 `freemd file.md` 直接打开文件 | — |

**安全机制**：
- 编辑器跟踪文档修改状态，若关闭时存在未保存更改，会弹出确认对话框
- 文件读写使用路径白名单机制，仅允许保存到已授权路径
- 读取文件大小限制为 50 MB，防止内存溢出
- 自动处理 BOM 头（UTF-8 with BOM）

### 7. 导出功能

| 导出格式 | 说明 | 快捷键 |
|----------|------|--------|
| **PDF** | 将 Markdown 内容渲染后导出为 A4 大小的 PDF 文件 | `Ctrl/Cmd + Shift + P` |
| **HTML** | 导出为包含完整样式和数学公式渲染的自包含 HTML 文件 | `Ctrl/Cmd + Shift + H` |

两种导出均保留完整的排版样式、代码高亮、数学公式和表格。HTML 导出的 KaTeX 字体通过 CDN 加载，可独立在任何浏览器中正常显示。PDF 导出使用 Chromium 原生打印引擎，支持自定义页边距和背景色。

### 8. 字号调节

编辑区字号可在 **10px ~ 30px** 范围内调节：

| 操作 | 方式 |
|------|------|
| **增大字号** | 工具栏 `+` 按钮 / `Ctrl/Cmd + +` / 菜单"视图 → 增大字号" |
| **减小字号** | 工具栏 `-` 按钮 / `Ctrl/Cmd + -` / 菜单"视图 → 减小字号" |
| **重置** | `Ctrl/Cmd + 0`（同时重置窗口缩放比例） |

当前字号显示在工具栏和底部状态栏中。

### 9. 窗口缩放

按住 `Ctrl` 键并滚动鼠标滚轮，可缩放整个应用窗口（缩放范围 25% ~ 500%）。状态栏会自动适配，保持恒定视觉大小。

### 10. 字数统计

底部状态栏实时显示当前文档的统计信息：

- **行数**：文档总行数
- **字数**：中文字符 + 英文单词总数（CJK 字符按单字计数，英文按空格分词）
- **字符数**：含空格的字符总数

字数统计采用 200ms 防抖更新，避免频繁计算影响性能。

### 11. 任务列表

支持交互式任务列表复选框：

```markdown
- [x] 已完成的任务
- [ ] 待办任务
- [ ] 另一个待办项
```

在预览模式下，复选框可点击勾选/取消（注意：仅在预览中可交互，不会回写到源码）。

### 12. 目录自动生成

在 Markdown 中使用 `[[toc]]` 即可自动生成文档目录（Table of Contents），目录层级覆盖 H1 ~ H6。

### 13. 标题锚点链接

每个标题自动生成锚点 ID，鼠标悬停在标题上时显示 `#` 链接图标，点击可复制该标题的锚点链接，方便文档内跳转和分享。

### 14. 脚注与定义列表

- **脚注**：使用 `[^标识]` 和 `[^标识]: 内容` 语法，自动渲染为页面底部脚注，支持前后跳转
- **定义列表**：使用 `术语` + `: 定义` 语法，适合制作术语表或 FAQ

### 15. 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + N` | 新建文件 |
| `Ctrl/Cmd + O` | 打开文件 |
| `Ctrl/Cmd + S` | 保存 |
| `Ctrl/Cmd + Shift + S` | 另存为 |
| `Ctrl/Cmd + Shift + P` | 导出 PDF |
| `Ctrl/Cmd + Shift + H` | 导出 HTML |
| `Ctrl/Cmd + Q` | 退出应用 |
| `Ctrl/Cmd + 1` | 预览模式 |
| `Ctrl/Cmd + 2` | 分屏模式 |
| `Ctrl/Cmd + 3` | 源码模式 |
| `Ctrl/Cmd + /` | 循环切换模式 |
| `Ctrl/Cmd + +` | 增大字号 |
| `Ctrl/Cmd + -` | 减小字号 |
| `Ctrl/Cmd + 0` | 重置字号和窗口缩放 |
| `Ctrl + 滚轮` | 缩放整个窗口 |
| `F12` / `Ctrl+Shift+I` | 开发者工具（仅开发模式） |

### 16. 未保存更改保护

当文档存在未保存更改时：
- 点击关闭窗口 → 弹出"放弃更改 / 取消"确认对话框
- 新建文件 → 提示是否放弃当前更改
- 打开新文件 → 提示是否放弃当前更改

### 17. 拖拽打开文件

直接将本地的 `.md`、`.markdown` 或 `.txt` 文件拖入 FreeMD 窗口即可打开编辑。支持从文件管理器或桌面拖拽。

### 18. 单实例运行

同一时间仅允许一个 FreeMD 实例运行。若再次双击 .md 文件或启动应用，会自动将文件路径传递给已打开的实例并聚焦窗口。

### 19. 打赏支持

菜单栏"支持作者 → 打赏作者"可打开打赏弹窗，展示微信支付和支付宝二维码。

### 20. 跨平台支持

| 平台 | 打包格式 |
|------|----------|
| **Windows** | NSIS 安装包 / Portable 便携版 (.exe) |
| **macOS** | DMG 磁盘映像 / ZIP 压缩包 (.dmg / .zip) |
| **Linux** | AppImage / Debian 包 (.AppImage / .deb) |

---

## 安装与配置

### 环境要求

| 依赖 | 最低版本 |
|------|----------|
| Node.js | >= 18 |
| npm | >= 9（或 pnpm / yarn） |

### 从源码安装

```bash
# 1. 克隆仓库
git clone https://github.com/YujunCui/FreeMD.git
cd FreeMD

# 2. 安装依赖
npm install

# 3. 开发模式运行（见下方命令说明）
npm run dev
npm run electron:dev
```

### 从预构建包安装

前往 [GitHub Releases](https://github.com/YujunCui/FreeMD/releases) 页面下载对应平台的安装包：

- **Windows**：下载 `.exe` 安装程序或 `.exe` 便携版，双击运行
- **macOS**：下载 `.dmg` 文件，拖入 Applications 文件夹
- **Linux**：下载 `.AppImage`（赋予执行权限后运行）或 `.deb`（通过包管理器安装）

---

## 运行命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Vite 开发服务器（前端热更新） |
| `npm run electron:dev` | 编译 Electron 主进程并启动桌面应用 |
| `npm run build` | 构建前端生产版本（TypeScript 类型检查 + Vite 打包） |
| `npm run build:electron` | 编译 Electron 主进程 TypeScript |
| `npm run build:all` | 同时构建前端 + Electron 主进程 |
| `npm run electron:build` | 构建全部并打包为平台安装程序 |
| `npm run preview` | 本地预览生产构建 |
| `npm run typecheck` | 仅执行 TypeScript 类型检查 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm run format` | 使用 Prettier 格式化代码 |

### 典型开发流程

```bash
# 终端 1：启动 Vite 开发服务器
npm run dev

# 终端 2：启动 Electron 应用（会自动连接 Vite 开发服务器）
npm run electron:dev
```

修改 `src/` 下的 Vue/TS/CSS 文件后，前端会自动热更新；修改 `electron/` 下的主进程代码后，需要重新执行 `npm run electron:dev` 或在 Vite 开发模式下会自动重启。

### 构建发布版本

```bash
# 完整构建流程
npm run build:all

# 打包为当前平台的安装程序（产物输出至 release/ 目录）
npm run electron:build
```

构建产物将输出至 `release/` 目录，Windows 下生成 `.exe` NSIS 安装包和便携版。

---

## 目录结构

```
FreeMD/
├── electron/                    # Electron 主进程（Node.js 端）
│   ├── main.ts                  # 应用入口：窗口管理、菜单创建、IPC 注册、单实例锁
│   ├── preload.ts               # 预加载脚本：通过 contextBridge 安全暴露 API 给渲染进程
│   ├── menu.ts                  # 菜单栏定义：文件/编辑/视图/支持作者四个菜单
│   ├── window.ts                # 窗口创建与管理：大小、安全策略、关闭确认
│   ├── ipc-handlers.ts          # IPC 通信处理：文件读写、导出 PDF/HTML、缩放、对话框
│   ├── file-service.ts          # 文件服务：读写、路径白名单、文件大小限制
│   ├── channels.ts              # IPC 通道名常量定义
│   └── tsconfig.json            # Electron 专用 TypeScript 配置
│
├── src/                         # Vue 渲染进程（浏览器端）
│   ├── main.ts                  # Vue 应用入口：创建 Pinia、挂载根组件
│   ├── App.vue                  # 根组件：全局快捷键、IPC 事件监听、拖拽、缩放
│   ├── env.d.ts                 # TypeScript 类型声明：ElectronAPI 接口、Vue 模块声明
│   ├── components/              # UI 组件
│   │   ├── Editor.vue           # 核心编辑器：CodeMirror 源码编辑 + Markdown 预览 + 分屏
│   │   ├── Toolbar.vue          # 顶部工具栏：Logo、模式切换、字号、主题、保存按钮
│   │   ├── StatusBar.vue        # 底部状态栏：行数/字数/字符统计、模式、字号、文件路径、修改状态
│   │   └── DonateModal.vue      # 打赏弹窗：微信/支付宝二维码展示
│   ├── editor/                  # 编辑器逻辑
│   │   ├── renderer.ts          # Markdown 渲染管线：markdown-it 配置、KaTeX、highlight.js、DOMPurify
│   │   └── codemirror-setup.ts  # CodeMirror 6 配置：语法高亮、主题、字号、快捷键
│   ├── stores/                  # Pinia 状态管理
│   │   └── editor.ts            # 编辑器全局状态：内容、文件路径、模式、主题、字号、字数统计
│   ├── utils/                   # 工具函数
│   │   └── export.ts            # 导出逻辑：HTML 文档生成、PDF 导出、KaTeX 字体 CDN 重写
│   └── styles/                  # 样式
│       ├── global.css           # 全局样式：CSS 变量、浅色/深色主题令牌、滚动条、hljs 主题
│       └── markdown-base.css    # Markdown 排版样式：标题、代码块、表格、脚注、公式（应用内与导出共享）
│
├── build/                       # 构建资源
│   ├── icon.ico                 # Windows 应用图标
│   ├── icon.icns                # macOS 应用图标
│   └── icon.png                 # Linux 应用图标
│
├── dist/                        # Vite 前端构建输出
├── dist-electron/               # Electron 主进程编译输出
├── release/                     # electron-builder 打包产物
│
├── index.html                   # HTML 入口文件（含 CSP 安全策略）
├── vite.config.ts               # Vite 配置：插件、路径别名、构建分包
├── tsconfig.json                # 前端 TypeScript 配置
├── tsconfig.node.json           # Node/Vite 配置 TypeScript 配置
├── eslint.config.mjs            # ESLint 配置
├── package.json                 # 项目配置、依赖、构建脚本、electron-builder 配置
└── LICENSE                      # MIT 许可证
```

---

## Markdown 语法支持

### 基本语法

| 语法 | 写法示例 |
|------|----------|
| 标题 | `# H1` `## H2` `### H3` … `###### H6` |
| 粗体 | `**加粗文本**` |
| 斜体 | `*斜体文本*` |
| 删除线 | `~~删除文本~~` |
| 高亮 | `==高亮文本==` |
| 无序列表 | `- 项目` 或 `* 项目` |
| 有序列表 | `1. 项目` |
| 链接 | `[文本](https://example.com)` |
| 图片 | `![替代文字](image.png)` |
| 代码块 | ` ```语言 ` … ` ``` ` |
| 行内代码 | `` `code` `` |
| 表格 | `\| 列1 \| 列2 \|` + `\|------\|------\|` |
| 引用 | `> 引用内容` |
| 分割线 | `---` 或 `***` |
| 换行 | 行末两个空格或空行 |

### 扩展语法

| 语法 | 写法示例 | 说明 |
|------|----------|------|
| 数学公式（行内） | `$E=mc^2$` | KaTeX 渲染 |
| 数学公式（块级） | `$$\sum_{i=1}^{n} x_i$$` | 独立居中显示 |
| 任务列表 | `- [x] 已完成` / `- [ ] 待办` | 可交互复选框 |
| 脚注 | `文本[^1]` + `[^1]: 脚注内容` | 页面底部渲染 |
| 定义列表 | `术语\n: 定义` | 适合术语表 |
| 自动目录 | `[[toc]]` | 根据标题生成目录 |
| 锚点链接 | 标题自动生成 | 悬停显示 `#` 锚点 |
| HTML | 直接嵌入 HTML 标签 | DOMPurify 消毒 |

---

## 常见使用场景

### 场景一：撰写技术博客

1. 启动 FreeMD，切换到**分屏模式** (`Ctrl/Cmd + 2`)
2. 在左侧源码区编写 Markdown 内容，右侧实时预览效果
3. 插入代码块（使用 ` ``` ` 围栏语法），自动获得语法高亮
4. 需要数学公式时使用 `$...$` 或 `$$...$$`
5. 写完按 `Ctrl/Cmd + S` 保存为 `.md` 文件
6. 使用 `Ctrl/Cmd + Shift + H` 导出为 HTML，直接发布到博客平台

### 场景二：编写项目 README / 文档

1. 新建文件 (`Ctrl/Cmd + N`)
2. 使用 `#`、`##`、`###` 构建文档结构
3. 用 `[[toc]]` 在文档开头自动生成目录
4. 插入表格说明配置项或 API 参数
5. 使用任务列表 `- [ ]` 跟踪文档完成进度
6. 导出为 PDF 分发给团队审阅

### 场景三：学术笔记 / 数学笔记

1. 切换到**深色主题**减少眼部疲劳
2. 使用块级公式 `$$...$$` 书写数学推导
3. 利用内置宏命令 `\RR`、`\NN` 等简化数学符号输入
4. 使用脚注 `[^n]` 添加参考文献或注释
5. 导出为 PDF 打印或提交作业

### 场景四：会议纪要 / 任务清单

1. 快速新建文件
2. 用任务列表 `- [ ] 待办项` 列出行动项
3. 在预览模式下点击复选框标记完成
4. 用引用块 `>` 记录重要发言
5. 保存并导出 HTML 分享给参会者

### 场景五：从外部文件编辑

1. 直接将 `.md` 文件从文件管理器拖入 FreeMD 窗口
2. 或在终端执行 `freemd ./notes.md`（打包版）
3. 编辑后按 `Ctrl/Cmd + S` 直接保存回原文件
4. 需要另存副本时使用 `Ctrl/Cmd + Shift + S`

---

## 开发指南

### 添加新的 Markdown 插件

1. 安装对应的 `markdown-it-*` 插件包：
   ```bash
   npm install markdown-it-xxx
   ```
2. 在 `src/editor/renderer.ts` 中导入并注册：
   ```ts
   import xxx from 'markdown-it-xxx'
   md.use(xxx, { /* 选项 */ })
   ```

### 自定义主题配色

在 `src/styles/global.css` 中修改 `[data-theme="light"]` 或 `[data-theme="dark"]` 下的 CSS 变量即可全局生效。主要变量包括：

- `--bg-primary` / `--text-primary`：背景和文字主色
- `--accent-color` / `--link-color`：强调色和链接色
- `--bg-code` / `--text-code`：代码块背景和文字色
- `--border-color`：边框颜色

### 添加新的导出格式

1. 在 `electron/channels.ts` 中定义新的 IPC 通道名
2. 在 `electron/ipc-handlers.ts` 中添加对应的 `ipcMain.handle` 处理逻辑
3. 在 `electron/preload.ts` 中暴露新的 API 方法
4. 在 `src/env.d.ts` 中声明新 API 类型
5. 在 `src/utils/export.ts` 中实现导出逻辑

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 桌面框架 | Electron 30 |
| 前端框架 | Vue 3 + TypeScript (Composition API) |
| 构建工具 | Vite 5 + vite-plugin-electron |
| 编辑器引擎 | CodeMirror 6 |
| Markdown 解析 | markdown-it + 插件生态 |
| 数学公式渲染 | KaTeX 0.16 |
| 代码语法高亮 | highlight.js 11 |
| 状态管理 | Pinia |
| XSS 防护 | DOMPurify |
| 打包工具 | electron-builder |
| 代码检查 | ESLint 9 + Prettier |

### Markdown-it 插件

| 插件 | 功能 |
|------|------|
| `markdown-it-anchor` | 标题自动生成锚点 ID |
| `markdown-it-deflist` | 定义列表语法支持 |
| `markdown-it-footnote` | 脚注语法支持 |
| `markdown-it-task-lists` | 任务列表复选框支持 |
| `markdown-it-toc-done-right` | 自动目录生成 |

---

## 许可证

MIT License - 详见 [LICENSE](LICENSE)

Copyright (c) FreeMD Contributors

---

## 致谢

- 由崔玉君开发并开源
- [CodeMirror](https://codemirror.net/) - 强大可扩展的编辑器引擎
- [markdown-it](https://github.com/markdown-it/markdown-it) - 高性能 Markdown 解析器
- [KaTeX](https://katex.org/) - 最快的数学公式渲染库
- [highlight.js](https://highlightjs.org/) - 代码语法高亮库
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
