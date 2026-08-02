import { renderMarkdown, md } from '@/editor/renderer'
// 共享 Markdown 排版（与应用内预览同一来源）
import markdownBaseCss from '@/styles/markdown-base.css?inline'
// 以字符串形式内联 KaTeX 样式，使导出的 HTML/PDF 能正确渲染公式
import katexCssRaw from 'katex/dist/katex.min.css?inline'

/**
 * KaTeX 样式：将相对字体引用重写为 CDN 绝对地址，确保导出文件可加载字体。
 */
function getKatexCss(): string {
  return katexCssRaw.replace(
    /url\(\s*\.?\/?fonts\//g,
    'url(https://cdn.jsdelivr.net/npm/katex@0.16/dist/fonts/'
  )
}

/**
 * 导出用 CSS：定义统一的浅色主题令牌 + 共享排版 + hljs 主题 + KaTeX。
 */
export function getExportCss(): string {
  return `
    :root {
      --bg-primary: #ffffff;
      --bg-code: #f6f8fa;
      --bg-blockquote: #f9f9fb;
      --bg-table-hover: #f6f8fa;
      --bg-table-header: #f0f1f3;

      --text-primary: #1a1a2e;
      --text-secondary: #6a737d;
      --text-code: #c2410c;

      --border-color: #e1e4e8;
      --accent-color: #2563eb;
      --link-color: #0366d6;
      --danger-color: #dc2626;

      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif;
      font-size: 16px;
      line-height: 1.8;
      color: var(--text-primary);
      background: var(--bg-primary);
      -webkit-font-smoothing: antialiased;
    }

    .markdown-body {
      max-width: 800px;
      margin: 40px auto;
      padding: 0 24px 60px;
    }

    /* 导出隐藏复制按钮 */
    .markdown-body .copy-code-btn { display: none !important; }

    /* 共享排版（与应用内一致） */
    ${markdownBaseCss}

    /* highlight.js GitHub 主题（导出固定浅色） */
    .hljs { color: #24292e; background: transparent; }
    .hljs-comment, .hljs-quote { color: #6a737d; font-style: italic; }
    .hljs-keyword, .hljs-selector-tag, .hljs-subst { color: #d73a49; }
    .hljs-string, .hljs-doctag, .hljs-regexp { color: #032f62; }
    .hljs-number, .hljs-literal, .hljs-variable, .hljs-template-variable, .hljs-tag .hljs-attr { color: #005cc5; }
    .hljs-title, .hljs-section, .hljs-selector-id { color: #6f42c1; font-weight: 700; }
    .hljs-type, .hljs-class .hljs-title, .hljs-built_in { color: #22863a; }
    .hljs-tag, .hljs-name, .hljs-attribute { color: #22863a; }
    .hljs-symbol, .hljs-bullet, .hljs-link { color: #9333ea; }
    .hljs-emphasis { font-style: italic; }
    .hljs-strong { font-weight: 700; }

    /* KaTeX 完整样式（字体走 CDN） */
    ${getKatexCss()}
  `
}

/**
 * Generate a complete standalone HTML document from markdown content.
 */
export function generateExportHtml(
  markdownContent: string,
  options: { title?: string } = {}
): string {
  const title = options.title || 'FreeMD Export'
  const htmlBody = renderMarkdown(markdownContent)
  const css = getExportCss()

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${md.utils.escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>
  <article class="markdown-body">
${htmlBody}
  </article>
</body>
</html>`
}

/**
 * Get just the HTML body content (for PDF export).
 */
export function getExportBody(markdownContent: string): string {
  return renderMarkdown(markdownContent)
}
