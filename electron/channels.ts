/**
 * IPC 通道名集中定义，主进程与 preload 共用，避免字面量散落导致改名漂移。
 */
export const CH = {
  // 渲染进程 → 主进程（invoke/handle）
  fileOpen: 'file:open',
  fileSave: 'file:save',
  fileSaveAs: 'file:save-as',
  fileRead: 'file:read',
  dialogSave: 'dialog:save',
  exportPdf: 'export:pdf',
  appConfirmDiscard: 'app:confirm-discard',
  appDoClose: 'app:do-close',
  devtoolsToggle: 'devtools:toggle',
  winSetZoom: 'win:set-zoom',
  winGetZoom: 'win:get-zoom',

  // 主进程 → 渲染进程（send/on）
  menuNew: 'menu:new',
  menuOpen: 'menu:open',
  menuSave: 'menu:save',
  menuSaveAs: 'menu:save-as',
  menuExportPdf: 'menu:export-pdf',
  menuExportHtml: 'menu:export-html',
  menuSetMode: 'menu:set-mode',
  menuFontSize: 'menu:font-size',
  menuOpenFile: 'menu:open-file',
  menuSupportAuthor: 'menu:support-author',
  themeChange: 'theme:change',
  appCloseRequested: 'app:close-requested'
} as const

export type Channel = (typeof CH)[keyof typeof CH]
