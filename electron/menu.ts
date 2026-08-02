import { Menu, dialog, shell, type MenuItemConstructorOptions } from 'electron'
import { CH } from './channels'
import { getMainWindow } from './window'

/** 向主窗口渲染进程发送事件的小工具，消除重复的 click 模板。 */
function send(channel: string, ...args: unknown[]): () => void {
  return () => getMainWindow()?.webContents.send(channel, ...args)
}

/** 构建应用菜单。 */
export function createMenu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: '文件',
      submenu: [
        { label: '新建', accelerator: 'CmdOrCtrl+N', click: send(CH.menuNew) },
        { label: '打开...', accelerator: 'CmdOrCtrl+O', click: send(CH.menuOpen) },
        { type: 'separator' },
        { label: '保存', accelerator: 'CmdOrCtrl+S', click: send(CH.menuSave) },
        { label: '另存为...', accelerator: 'CmdOrCtrl+Shift+S', click: send(CH.menuSaveAs) },
        { type: 'separator' },
        { label: '导出为 PDF', accelerator: 'CmdOrCtrl+Shift+P', click: send(CH.menuExportPdf) },
        { label: '导出为 HTML', accelerator: 'CmdOrCtrl+Shift+H', click: send(CH.menuExportHtml) },
        { type: 'separator' },
        { label: '退出', accelerator: 'CmdOrCtrl+Q', role: 'quit' }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo' },
        { label: '重做', role: 'redo' },
        { type: 'separator' },
        { label: '剪切', role: 'cut' },
        { label: '复制', role: 'copy' },
        { label: '粘贴', role: 'paste' },
        { label: '全选', role: 'selectAll' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '增大字号', accelerator: 'CmdOrCtrl+Plus', click: send(CH.menuFontSize, 'increase') },
        { label: '减小字号', accelerator: 'CmdOrCtrl+-', click: send(CH.menuFontSize, 'decrease') },
        {
          label: '重置缩放与字号',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            const win = getMainWindow()
            if (!win) return
            // 重置窗口缩放比例（配合 Ctrl+滚轮使用）
            win.webContents.setZoomFactor(1)
            // 重置编辑器字号
            win.webContents.send(CH.menuFontSize, 'reset')
          }
        },
        { type: 'separator' },
        { label: '全屏', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: '预览模式', accelerator: 'CmdOrCtrl+1', click: send(CH.menuSetMode, 'preview') },
        { label: '分屏模式', accelerator: 'CmdOrCtrl+2', click: send(CH.menuSetMode, 'split') },
        { label: '源码模式', accelerator: 'CmdOrCtrl+3', click: send(CH.menuSetMode, 'source') },
        { type: 'separator' },
        {
          label: '切换主题',
          submenu: [
            { label: '浅色', type: 'radio', click: send(CH.themeChange, 'light') },
            { label: '深色', type: 'radio', click: send(CH.themeChange, 'dark') },
            { label: '跟随系统', type: 'radio', checked: true, click: send(CH.themeChange, 'auto') }
          ]
        }
      ]
    },
    {
      label: '支持作者',
      submenu: [
        {
          label: '打赏作者',
          click: send(CH.menuSupportAuthor)
        },
        { type: 'separator' },
        {
          label: '关于 FreeMD',
          click: () => {
            const win = getMainWindow()
            if (!win) return
            dialog.showMessageBox(win, {
              type: 'info',
              title: '关于 FreeMD',
              message: 'FreeMD v1.0.0',
              detail: '一款由崔玉君开发并开源的 Markdown 编辑器\n\nMIT License\n\n'
            })
          }
        },
        { label: 'GitHub 仓库', click: () => shell.openExternal('https://github.com/YujunCui/FreeMD') }
      ]
    }
  ]

  return Menu.buildFromTemplate(template)
}
