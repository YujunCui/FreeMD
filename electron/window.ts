import { BrowserWindow, shell } from 'electron'
import * as path from 'path'
import { CH } from './channels'
import { clearAllowedPaths } from './file-service'

let mainWindow: BrowserWindow | null = null
let allowClose = false

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}

export function setAllowClose(value: boolean): void {
  allowClose = value
}

/** 创建主窗口并装配外链拦截、关闭确认等安全策略。 */
export function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    title: 'FreeMD',
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  // 拦截 window.open / target=_blank：外部链接交给系统浏览器
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  // 关闭前交由渲染进程判断未保存修改
  mainWindow.on('close', (e) => {
    if (allowClose) return
    e.preventDefault()
    mainWindow?.webContents.send(CH.appCloseRequested)
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    allowClose = false
    clearAllowedPaths()
  })
}
