import { Compartment, EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine, drawSelection, dropCursor, rectangularSelection, crosshairCursor, highlightActiveLineGutter } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting, HighlightStyle } from '@codemirror/language'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { languages } from '@codemirror/language-data'
import { tags } from '@lezer/highlight'
import type { Extension } from '@codemirror/state'

export type EditorTheme = 'light' | 'dark'

export interface EditorExtensionBundle {
  extensions: Extension[]
  themeCompartment: Compartment
  fontSizeCompartment: Compartment
}

/**
 * 自定义语法高亮配色，与编辑器主题匹配。
 */
export function createHighlightStyle(theme: EditorTheme): HighlightStyle {
  const colors = theme === 'dark'
    ? {
        heading: '#7c93f5',
        heading1: '#9d7cf5',
        heading2: '#7cb5f5',
        heading3: '#7cf5d0',
        emphasis: '#f57c93',
        strong: '#f5c97c',
        link: '#7cf5b5',
        quote: '#9d9d9d',
        meta: '#6b7280',
        code: '#f5b57c'
      }
    : {
        heading: '#2563eb',
        heading1: '#7c3aed',
        heading2: '#0891b2',
        heading3: '#059669',
        emphasis: '#dc2626',
        strong: '#d97706',
        link: '#0891b2',
        quote: '#6b7280',
        meta: '#9ca3af',
        code: '#c2410c'
      }

  return HighlightStyle.define([
    { tag: tags.heading1, color: colors.heading1, fontWeight: '700', fontSize: '1.5em' },
    { tag: tags.heading2, color: colors.heading2, fontWeight: '700', fontSize: '1.3em' },
    { tag: tags.heading3, color: colors.heading3, fontWeight: '700', fontSize: '1.15em' },
    { tag: tags.heading, color: colors.heading, fontWeight: '600' },
    { tag: tags.emphasis, fontStyle: 'italic', color: colors.emphasis },
    { tag: tags.strong, fontWeight: '700', color: colors.strong },
    { tag: tags.link, color: colors.link, textDecoration: 'underline' },
    { tag: tags.quote, color: colors.quote, fontStyle: 'italic' },
    { tag: tags.meta, color: colors.meta },
    { tag: tags.string, color: theme === 'dark' ? '#9ece6a' : '#059669' },
    { tag: tags.number, color: theme === 'dark' ? '#ff9e64' : '#d97706' },
    { tag: tags.bool, color: theme === 'dark' ? '#ff9e64' : '#d97706' },
    { tag: tags.keyword, color: theme === 'dark' ? '#bb9af7' : '#7c3aed' },
    { tag: tags.atom, color: theme === 'dark' ? '#7dcfff' : '#0891b2' },
    { tag: tags.comment, color: colors.meta, fontStyle: 'italic' },
    { tag: tags.tagName, color: theme === 'dark' ? '#f7768e' : '#dc2626' },
    { tag: tags.attributeName, color: theme === 'dark' ? '#bb9af7' : '#7c3aed' },
    { tag: tags.attributeValue, color: theme === 'dark' ? '#9ece6a' : '#059669' },
    { tag: tags.url, color: colors.link, textDecoration: 'underline' },
    { tag: tags.contentSeparator, color: colors.meta },
    { tag: tags.processingInstruction, color: colors.meta }
  ])
}

/**
 * 编辑器基础主题：等宽字体、居中排版、行号、光标、选区等外观。
 */
function createEditorTheme(theme: EditorTheme): Extension {
  return EditorView.theme({
    '&': {
      height: '100%',
      backgroundColor: 'transparent'
    },
    '.cm-content': {
      fontFamily: '"Cascadia Code", "JetBrains Mono", "Fira Code", "Consolas", "Courier New", monospace',
      padding: '40px 60px',
      maxWidth: '850px',
      margin: '0 auto'
    },
    '.cm-gutters': {
      border: 'none',
      backgroundColor: 'transparent'
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 8px 0 0',
      color: theme === 'dark' ? '#4a5568' : '#b0b8c4'
    },
    '.cm-activeLine': {
      backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'transparent'
    },
    '.cm-selectionBackground, ::selection': {
      backgroundColor: theme === 'dark' ? 'rgba(124,147,245,0.25)' : 'rgba(37,99,235,0.15)'
    },
    '.cm-cursor': {
      borderLeftColor: theme === 'dark' ? '#7c93f5' : '#2563eb'
    },
    '.cm-foldPlaceholder': {
      backgroundColor: theme === 'dark' ? '#2a2e3f' : '#e8eaed',
      color: theme === 'dark' ? '#7c93f5' : '#2563eb'
    },
    '.cm-fat-cursor .cm-cursor': {
      background: theme === 'dark' ? '#7c93f5' : '#2563eb'
    }
  }, { dark: theme === 'dark' })
}

/**
 * 主题相关扩展（语法高亮 + 基础外观），可用于隔离舱初始值与热切换。
 */
export function createThemeExtension(theme: EditorTheme): Extension {
  return [
    syntaxHighlighting(createHighlightStyle(theme)),
    createEditorTheme(theme)
  ]
}

/**
 * 创建 CodeMirror 扩展集合（单一来源）。返回隔离舱以便外部热切换主题/字号。
 */
export function createEditorExtensions(theme: EditorTheme = 'light', fontSize: number = 15): EditorExtensionBundle {
  const themeCompartment = new Compartment()
  const fontSizeCompartment = new Compartment()

  const extensions: Extension[] = [
    lineNumbers(),
    foldGutter(),
    history(),
    drawSelection(),
    dropCursor(),
    indentOnInput(),
    bracketMatching(),
    rectangularSelection(),
    crosshairCursor(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    highlightSelectionMatches(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...foldKeymap,
      ...searchKeymap,
      indentWithTab
    ]),
    markdown({
      base: markdownLanguage,
      codeLanguages: languages
    }),
    // 主题相关（语法高亮 + 基础外观）统一放入隔离舱，切换主题时整体替换
    themeCompartment.of(createThemeExtension(theme)),
    fontSizeCompartment.of(EditorView.theme({
      '&': { fontSize: `${fontSize}px` }
    })),
    EditorView.lineWrapping,
    EditorState.tabSize.of(2)
  ]

  return { extensions, themeCompartment, fontSizeCompartment }
}
