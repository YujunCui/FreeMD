import { contextBridge, ipcRenderer, webUtils } from 'electron'
import { CH } from './channels'

type Listener = (...args: unknown[]) => void

/**
 * 注册一次性 IPC 监听器，返回取消订阅函数，避免重复注册导致的回调累积。
 */
function on(channel: string, cb: Listener): () => void {
  const wrapped = (_e: unknown, ...args: unknown[]) => cb(...args)
  ipcRenderer.on(channel, wrapped)
  return () => ipcRenderer.removeListener(channel, wrapped)
}

const electronAPI = {
  // File operations
  openFile: () => ipcRenderer.invoke(CH.fileOpen),
  readFile: (filePath: string) => ipcRenderer.invoke(CH.fileRead, filePath),
  saveFile: (filePath: string, content: string) =>
    ipcRenderer.invoke(CH.fileSave, filePath, content),
  saveFileAs: (content: string, suggestedName: string) =>
    ipcRenderer.invoke(CH.fileSaveAs, content, suggestedName),
  saveHtml: (content: string, defaultPath: string) =>
    ipcRenderer.invoke(CH.dialogSave, { content, defaultPath }),
  exportPdf: (htmlContent: string, cssContent: string) =>
    ipcRenderer.invoke(CH.exportPdf, htmlContent, cssContent),

  // Unsaved-changes flow
  confirmDiscard: () => ipcRenderer.invoke(CH.appConfirmDiscard) as Promise<{ discard: boolean }>,
  doClose: () => ipcRenderer.invoke(CH.appDoClose),

  // DevTools (dev only)
  toggleDevTools: () => ipcRenderer.invoke(CH.devtoolsToggle),

  // Window zoom (Ctrl+wheel)
  setZoom: (factor: number) => ipcRenderer.invoke(CH.winSetZoom, factor),
  getZoom: () => ipcRenderer.invoke(CH.winGetZoom) as Promise<number>,

  // Menu events (listen) — each returns an unsubscribe function
  onMenuNew: (cb: () => void) => on(CH.menuNew, cb as Listener),
  onMenuOpen: (cb: () => void) => on(CH.menuOpen, cb as Listener),
  onMenuSave: (cb: () => void) => on(CH.menuSave, cb as Listener),
  onMenuSaveAs: (cb: () => void) => on(CH.menuSaveAs, cb as Listener),
  onMenuExportPdf: (cb: () => void) => on(CH.menuExportPdf, cb as Listener),
  onMenuExportHtml: (cb: () => void) => on(CH.menuExportHtml, cb as Listener),
  onMenuFontSize: (cb: (action: 'increase' | 'decrease' | 'reset') => void) =>
    on(CH.menuFontSize, cb as Listener),
  onThemeChange: (cb: (theme: 'light' | 'dark' | 'auto') => void) =>
    on(CH.themeChange, cb as Listener),
  onSetMode: (cb: (mode: 'source' | 'split' | 'preview') => void) =>
    on(CH.menuSetMode, cb as Listener),
  onCloseRequested: (cb: () => void) => on(CH.appCloseRequested, cb as Listener),
  // 主进程要求打开指定路径（命令行 / 双击文件 / 拖拽）
  onOpenFile: (cb: (filePath: string) => void) =>
    on(CH.menuOpenFile, cb as Listener),
  // 主进程要求显示“支持作者”打赏弹窗
  onMenuSupportAuthor: (cb: () => void) => on(CH.menuSupportAuthor, cb as Listener),

  // Drag & drop: get real file path from a dropped File object
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  // Platform info
  platform: process.platform
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
