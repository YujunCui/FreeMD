import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import deflist from 'markdown-it-deflist'
import footnote from 'markdown-it-footnote'
import taskLists from 'markdown-it-task-lists'
import toc from 'markdown-it-toc-done-right'
// 使用 common 子集（~40 常用语言）替代全量（~190 语言），大幅减小 bundle
import hljs from 'highlight.js/lib/common'
import katex from 'katex'
import DOMPurify from 'dompurify'

/**
 * Create a configured markdown-it instance with all plugins and features.
 * Supports: code highlighting, math formulas (KaTeX), task lists,
 * footnotes, definition lists, anchors, table of contents.
 */
export function createMarkdownRenderer(): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: false,
    highlight(code: string, lang: string): string {
      const language = lang && hljs.getLanguage(lang) ? lang : ''
      let highlighted: string
      if (language) {
        try {
          highlighted = hljs.highlight(code, { language, ignoreIllegals: true }).value
        } catch {
          highlighted = md.utils.escapeHtml(code)
        }
      } else {
        highlighted = md.utils.escapeHtml(code)
      }
      // Add data-label for styling and copy button support
      const label = lang || 'text'
      return `<pre class="code-block" data-lang="${label}"><button class="copy-code-btn" title="复制代码">复制</button><code class="hljs language-${label}">${highlighted}</code></pre>`
    }
  })

  // Math rendering: $...$ for inline, $$...$$ for block
  md.inline.ruler.before('escape', 'math_inline', (state, silent) => {
    const src = state.src
    const start = state.pos
    if (src[start] !== '$') return false
    // Require $$ for display math or single $ for inline
    let isDisplay = false
    let matchStart = start + 1
    if (src[start + 1] === '$') {
      isDisplay = true
      matchStart = start + 2
    }
    const closeChar = isDisplay ? '$$' : '$'
    const closeIdx = src.indexOf(closeChar, matchStart)
    if (closeIdx === -1) return false
    const mathContent = src.slice(matchStart, closeIdx).trim()
    if (!mathContent) return false

    if (!silent) {
      const token = state.push('math', 'math', 0)
      token.content = mathContent
      token.meta = { display: isDisplay }
    }
    state.pos = closeIdx + closeChar.length
    return true
  })

  // Render math tokens with KaTeX
  md.renderer.rules.math = (tokens, idx) => {
    const token = tokens[idx]
    const { display } = token.meta || {}
    try {
      const html = katex.renderToString(token.content, {
        displayMode: display,
        throwOnError: false,
        strict: false,
        trust: false,
        macros: {
          '\\RR': '\\mathbb{R}',
          '\\NN': '\\mathbb{N}',
          '\\ZZ': '\\mathbb{Z}',
          '\\QQ': '\\mathbb{Q}',
          '\\CC': '\\mathbb{C}'
        }
      })
      return html
    } catch {
      return `<span class="math-error">${md.utils.escapeHtml(token.content)}</span>`
    }
  }

  // Plugins
  md.use(anchor, {
    permalink: anchor.permalink.ariaHidden({
      class: 'header-anchor',
      symbol: '#',
      space: false,
      placement: 'before'
    })
  })
  md.use(deflist)
  md.use(footnote)
  md.use(taskLists, { enabled: true, label: true })
  md.use(toc, {
    level: [1, 2, 3, 4, 5, 6],
    slugify: (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-').replace(/^-+|-+$/g, '')
  })

  // 为块级元素标注源码行号，供分屏滚动按行映射（见 Editor.vue）
  md.core.ruler.push('source_line', (state) => {
    for (const token of state.tokens) {
      if (token.map && token.nesting >= 0) {
        token.attrSet('data-source-line', String(token.map[0] + 1))
      }
    }
    return true
  })

  // Open external links in new tab
  const defaultLinkOpen = md.renderer.rules.link_open || function (tokens, idx, options, _env, self) {
    return self.renderToken(tokens, idx, options)
  }
  md.renderer.rules.link_open = function (tokens, idx, options, env, self) {
    const hrefIndex = tokens[idx].attrIndex('href')
    if (hrefIndex >= 0) {
      const href = tokens[idx].attrs![hrefIndex][1]
      if (/^https?:\/\//.test(href)) {
        tokens[idx].attrSet('target', '_blank')
        tokens[idx].attrSet('rel', 'noopener noreferrer')
      }
    }
    return defaultLinkOpen(tokens, idx, options, env, self)
  }

  return md
}

export const md = createMarkdownRenderer()

/**
 * Render markdown string to HTML.
 * 输出统一经 DOMPurify 消毒，阻断恶意 <script>/onerror/危险 KaTeX 指令等 XSS 向量。
 */
export function renderMarkdown(content: string): string {
  const raw = md.render(content)
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    // 保留代码块复制按钮与 data-lang 标签等业务属性
    ADD_ATTR: ['target', 'rel', 'data-source-line']
  })
}
