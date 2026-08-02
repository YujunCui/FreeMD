/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}

interface ElectronAPI {
  // File operations
  openFile: () => Promise<{ success: boolean; filePath?: string; content?: string; error?: string; canceled?: boolean }>
  readFile: (filePath: string) => Promise<{ success: boolean; filePath?: string; content?: string; error?: string }>
  saveFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>
  saveFileAs: (content: string, suggestedName: string) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>
  saveHtml: (content: string, defaultPath: string) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>
  exportPdf: (htmlContent: string, cssContent: string) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>

  // Unsaved-changes flow
  confirmDiscard: () => Promise<{ discard: boolean }>
  doClose: () => Promise<void>

  // DevTools (dev only)
  toggleDevTools: () => Promise<{ success: boolean }>

  // Window zoom (Ctrl+wheel)
  setZoom: (factor: number) => Promise<void>
  getZoom: () => Promise<number>

  // Menu events (listen) — each returns an unsubscribe function
  onMenuNew: (cb: () => void) => () => void
  onMenuOpen: (cb: () => void) => () => void
  onMenuSave: (cb: () => void) => () => void
  onMenuSaveAs: (cb: () => void) => () => void
  onMenuExportPdf: (cb: () => void) => () => void
  onMenuExportHtml: (cb: () => void) => () => void
  onMenuFontSize: (cb: (action: 'increase' | 'decrease' | 'reset') => void) => () => void
  onThemeChange: (cb: (theme: 'light' | 'dark' | 'auto') => void) => () => void
  onSetMode: (cb: (mode: 'source' | 'split' | 'preview') => void) => () => void
  onCloseRequested: (cb: () => void) => () => void
  onOpenFile: (cb: (filePath: string) => void) => () => void
  onMenuSupportAuthor: (cb: () => void) => () => void

  // Drag & drop: get real file path from a dropped File object
  getPathForFile: (file: File) => string

  // Platform info
  platform: string
}

interface Window {
  electronAPI: ElectronAPI
}

// 第三方 markdown-it 插件未提供类型声明
declare module 'markdown-it-deflist'
declare module 'markdown-it-footnote'
declare module 'markdown-it-task-lists'
