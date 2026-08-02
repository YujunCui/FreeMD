import { app, ipcMain, dialog, BrowserWindow } from 'electron'
import { CH } from './channels'
import { getMainWindow, setAllowClose } from './window'
import { isPathAllowed, allowPath, readTextFile, writeTextFile, writeBinaryFile } from './file-service'

/** 设置主窗口的缩放比例，限制在 0.25 ~ 5 之间。 */
function setWindowZoom(factor: number): void {
  const win = getMainWindow()
  if (!win) return
  const clamped = Math.min(5, Math.max(0.25, factor))
  console.log('[zoom] setZoomFactor:', clamped)
  win.webContents.setZoomFactor(clamped)
}

/** 注册全部 IPC handler。 */
export function registerIpcHandlers(): void {
  // 设置窗口缩放比例（Ctrl+滚轮缩放）
  ipcMain.handle(CH.winSetZoom, (_event, factor: number) => {
    setWindowZoom(factor)
  })

  // 获取当前窗口缩放比例
  ipcMain.handle(CH.winGetZoom, () => {
    const win = getMainWindow()
    return win ? win.webContents.getZoomFactor() : 1
  })
  ipcMain.handle(CH.fileSave, async (_event, filePath: string, content: string) => {
    if (!isPathAllowed(filePath)) {
      return { success: false, error: '目标路径未授权' }
    }
    try {
      await writeTextFile(filePath, content)
      return { success: true }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(CH.fileSaveAs, async (_event, content: string, suggestedName: string) => {
    const win = getMainWindow()
    if (!win) return { success: false, error: '窗口未初始化' }
    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'Markdown', extensions: ['md'] }],
      defaultPath: suggestedName || 'untitled.md'
    })
    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true }
    }
    try {
      await writeTextFile(result.filePath, content)
      allowPath(result.filePath)
      return { success: true, filePath: result.filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(CH.fileOpen, async () => {
    const win = getMainWindow()
    if (!win) return { success: false, error: '窗口未初始化' }
    const result = await dialog.showOpenDialog(win, {
      title: '打开 Markdown 文件',
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown', 'txt'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true }
    }
    const filePath = result.filePaths[0]
    try {
      const content = await readTextFile(filePath)
      allowPath(filePath)
      return { success: true, filePath, content }
    } catch (err) {
      console.error('[FreeMD] Read file error:', err)
      return { success: false, error: String(err) }
    }
  })

  /**
   * 读取指定路径文件（用于命令行/双击/拖拽等非对话框入口）。
   * 与对话框流程一致：成功读取后将其加入白名单以便后续保存。
   */
  ipcMain.handle(CH.fileRead, async (_event, filePath: string) => {
    if (!filePath) return { success: false, error: '路径为空' }
    try {
      const content = await readTextFile(filePath)
      allowPath(filePath)
      return { success: true, filePath, content }
    } catch (err) {
      console.error('[FreeMD] Read file error:', err)
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(CH.dialogSave, async (_event, options: { defaultPath?: string; content: string }) => {
    const win = getMainWindow()
    if (!win) return { success: false, error: '窗口未初始化' }
    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'HTML', extensions: ['html'] }],
      defaultPath: options.defaultPath || 'export.html'
    })
    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true }
    }
    try {
      await writeTextFile(result.filePath, options.content)
      return { success: true, filePath: result.filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    }
  })

  ipcMain.handle(CH.exportPdf, async (_event, htmlContent: string, cssContent: string) => {
    const win = getMainWindow()
    if (!win) return { success: false, error: '窗口未初始化' }
    const result = await dialog.showSaveDialog(win, {
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
      defaultPath: 'export.pdf'
    })
    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true }
    }
    let pdfWindow: BrowserWindow | null = null
    try {
      pdfWindow = new BrowserWindow({
        show: false,
        webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
      })
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${cssContent}</style></head><body class="export-pdf">${htmlContent}</body></html>`
      await pdfWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(fullHtml))
      // 等待页面与字体就绪，替代固定延时
      await new Promise<void>((resolve) => {
        pdfWindow!.webContents.once('did-finish-load', () => {
          pdfWindow!.webContents.executeJavaScript('document.fonts && document.fonts.ready')
            .catch(() => undefined)
            .finally(() => resolve())
        })
        setTimeout(resolve, 3000) // 兜底超时
      })
      const pdfData = await pdfWindow.webContents.printToPDF({
        pageSize: 'A4',
        printBackground: true,
        margins: { marginType: 'custom', top: 0.6, bottom: 0.6, left: 0.6, right: 0.6 }
      })
      await writeBinaryFile(result.filePath, pdfData)
      return { success: true, filePath: result.filePath }
    } catch (err) {
      return { success: false, error: String(err) }
    } finally {
      pdfWindow?.close()
    }
  })

  ipcMain.handle(CH.appConfirmDiscard, async () => {
    const win = getMainWindow()
    if (!win) return { discard: true }
    const choice = await dialog.showMessageBox(win, {
      type: 'warning',
      buttons: ['放弃更改', '取消'],
      defaultId: 1,
      cancelId: 1,
      title: '未保存的更改',
      message: '当前文档有未保存的更改，是否放弃？'
    })
    return { discard: choice.response === 0 }
  })

  ipcMain.handle(CH.appDoClose, async () => {
    const win = getMainWindow()
    if (!win) return
    setAllowClose(true)
    win.close()
  })

  ipcMain.handle(CH.devtoolsToggle, async () => {
    if (app.isPackaged) return { success: false }
    const win = getMainWindow()
    if (win && win.webContents) {
      win.webContents.toggleDevTools()
    }
    return { success: true }
  })
}
