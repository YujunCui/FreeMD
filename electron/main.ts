import { app, BrowserWindow, Menu } from 'electron'
import * as path from 'path'
import { createWindow } from './window'
import { createMenu } from './menu'
import { registerIpcHandlers } from './ipc-handlers'
import { CH } from './channels'
import { getMainWindow } from './window'

/**
 * 解析启动参数中的 Markdown 文件路径。
 * - Windows / Linux：双击文件时，文件路径会作为命令行参数传入
 * - macOS：通过 'open-file' 事件（见下方监听）
 * - 开发模式 `npm run dev` 下，Vite/electron 也会附带一些参数，需要跳过
 */
function parseFilePathFromArgv(argv: string[]): string | null {
  // 跳过可执行文件本身（打包后 argv[0] 是 exe）
  // 常见的辅助参数：--inspect / --remote-debugging-port / 以 - 开头的开关
  // 规则：取第一个存在的、且扩展名为 md/markdown/txt 的绝对/相对路径
  const mdExt = /\.(md|markdown|txt)$/i
  for (const arg of argv.slice(1)) {
    if (!arg || arg.startsWith('-')) continue
    if (mdExt.test(arg)) {
      return arg
    }
  }
  return null
}

/** 待打开文件路径：在 app.whenReady 之前可能就已收到（macOS），先缓存 */
let pendingFilePath: string | null = null

/** 渲染进程已就绪时，把待打开路径发过去；之后双击新文件也走同一通道。 */
function dispatchOpenFile(filePath: string): void {
  const win = getMainWindow()
  if (win && !win.isDestroyed() && win.webContents) {
    // 仅在页面已加载完成时直接发送；否则缓存到 did-finish-load 后再发
    if (win.webContents.isLoading()) {
      win.webContents.once('did-finish-load', () => {
        win.webContents.send(CH.menuOpenFile, filePath)
      })
    } else {
      win.webContents.send(CH.menuOpenFile, filePath)
    }
  } else {
    pendingFilePath = filePath
  }
}

// macOS：通过 'open-file' 事件接收双击文件（即便 app 未启动也会触发）
app.on('open-file', (event, filePath) => {
  event.preventDefault()
  if (app.isReady()) {
    dispatchOpenFile(filePath)
  } else {
    pendingFilePath = filePath
  }
})

// 单实例：避免在 Windows 上多次双击启动多个进程
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    // 第二个实例的命令行里通常就含要打开的文件
    const filePath = parseFilePathFromArgv(argv)
    const win = getMainWindow()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
    if (filePath) dispatchOpenFile(filePath)
  })
}

// 应用生命周期
app.whenReady().then(() => {
  Menu.setApplicationMenu(createMenu())
  registerIpcHandlers()
  createWindow()

  // 解析命令行中的待打开文件（Windows / Linux 双击场景）
  if (!pendingFilePath) {
    pendingFilePath = parseFilePathFromArgv(process.argv)
  }

  // 窗口加载完成后，若有待打开文件则发送给渲染进程
  const win = getMainWindow()
  if (win) {
    win.webContents.once('did-finish-load', () => {
      if (pendingFilePath) {
        win.webContents.send(CH.menuOpenFile, pendingFilePath)
        pendingFilePath = null
      }
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
