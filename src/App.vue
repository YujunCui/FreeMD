<template>
  <div class="app-container" :data-theme="store.resolvedTheme">
    <main class="editor-main">
      <Editor />
    </main>
    <StatusBar />
    <DonateModal v-model="showDonateModal" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useEditorStore, type EditorMode } from '@/stores/editor'
import Editor from '@/components/Editor.vue'
import StatusBar from '@/components/StatusBar.vue'
import DonateModal from '@/components/DonateModal.vue'
import { generateExportHtml } from '@/utils/export'

const store = useEditorStore()
const showDonateModal = ref(false)

// 数字键 → 模式映射，便于扩展
const MODE_KEYS: Record<string, EditorMode> = {
  '1': 'preview',
  '2': 'split',
  '3': 'source'
}
const MODE_CYCLE: EditorMode[] = ['preview', 'split', 'source']

// 收集所有 IPC 监听的取消订阅函数，卸载时统一调用，避免 HMR/重挂载时重复注册
const unsubscribers: Array<() => void> = []

// 导出为 PDF
async function exportPdf(): Promise<void> {
  const api = window.electronAPI
  if (!api) return
  const { getExportBody, getExportCss } = await import('@/utils/export')
  await api.exportPdf(getExportBody(store.content), getExportCss())
}

// 未保存修改确认：返回 true 表示可以继续（无修改或用户选择放弃）
async function confirmDiscardIfDirty(): Promise<boolean> {
  if (!store.isDirty) return true
  const api = window.electronAPI
  if (!api) return true
  const { discard } = await api.confirmDiscard()
  return discard
}

function handleKeyDown(e: KeyboardEvent): void {
  const mod = e.ctrlKey || e.metaKey
  if (!mod) return
  // Ctrl+S / Cmd+S 保存
  if (e.key === 's' || e.key === 'S') {
    e.preventDefault()
    void store.save()
    return
  }
  // Ctrl+1/2/3 切换模式
  if (e.key in MODE_KEYS) {
    e.preventDefault()
    store.setMode(MODE_KEYS[e.key])
    return
  }
  // Ctrl+/ 循环切换模式
  if (e.key === '/') {
    e.preventDefault()
    store.setMode(MODE_CYCLE[(MODE_CYCLE.indexOf(store.mode) + 1) % MODE_CYCLE.length])
    return
  }
  // Ctrl++ / Ctrl+= 放大字号（+ 与 = 共键，且 Shift++ 也归为放大）
  if (e.key === '+' || e.key === '=' || (e.shiftKey && e.key === '+')) {
    e.preventDefault()
    store.setFontSize(store.fontSize + 1)
    return
  }
  // Ctrl+- 缩小字号
  if (e.key === '-' || e.key === '_') {
    e.preventDefault()
    store.setFontSize(store.fontSize - 1)
    return
  }
  // Ctrl+0 还原默认字号与窗口缩放
  if (e.key === '0' || e.key === 'Numpad0') {
    e.preventDefault()
    store.setFontSize(15)
    void window.electronAPI?.setZoom(1)
    syncWindowZoomCss(1)
    return
  }
  // Ctrl+Shift+I / F12 切换 DevTools（仅开发环境）
  if ((e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) || e.key === 'F12') {
    e.preventDefault()
    window.electronAPI?.toggleDevTools()
  }
}

async function openFileByPath(filePath: string): Promise<void> {
  if (!filePath) return
  if (!(await confirmDiscardIfDirty())) return
  const result = await window.electronAPI!.readFile(filePath)
  if (result.success && result.filePath && result.content !== undefined) {
    store.openFile(result.filePath, result.content)
  } else if (result.error) {
    store.setLastError(`打开失败：${result.error}`)
  }
}

/** 同步窗口缩放到 CSS 变量，供状态栏等需要抵消缩放的元素使用。 */
function syncWindowZoomCss(factor: number): void {
  document.documentElement.style.setProperty('--window-zoom', String(factor))
}

onMounted(() => {
  store.updateResolvedTheme()
  syncWindowZoomCss(1)

  // 监听系统主题变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  const onMediaChange = (): void => {
    if (store.theme === 'auto') store.updateResolvedTheme()
  }
  mediaQuery.addEventListener('change', onMediaChange)
  unsubscribers.push(() => mediaQuery.removeEventListener('change', onMediaChange))

  // Electron 菜单事件
  const api = window.electronAPI
  if (!api) return

  unsubscribers.push(
    api.onMenuNew(async () => {
      if (await confirmDiscardIfDirty()) store.newFile()
    }),
    api.onMenuOpen(async () => {
      if (!(await confirmDiscardIfDirty())) return
      const result = await api.openFile()
      if (result.success && result.filePath && result.content !== undefined) {
        store.openFile(result.filePath, result.content)
      } else if (result.error) {
        store.setLastError(`打开失败：${result.error}`)
      }
    }),
    api.onMenuSave(() => { void store.save() }),
    api.onMenuSaveAs(() => { void store.saveAs() }),
    api.onMenuExportPdf(() => { void exportPdf() }),
    api.onMenuExportHtml(async () => {
      const html = generateExportHtml(store.content, { title: store.fileTitle })
      const defaultPath = store.fileTitle.replace(/\.md$/i, '') + '.html'
      await api.saveHtml(html, defaultPath)
    }),
    api.onMenuFontSize((action) => {
      if (action === 'increase') store.setFontSize(store.fontSize + 1)
      else if (action === 'decrease') store.setFontSize(store.fontSize - 1)
      else store.setFontSize(15)
    }),
    api.onThemeChange((theme) => store.setTheme(theme)),
    api.onSetMode((mode) => store.setMode(mode)),
    api.onCloseRequested(async () => {
      if (await confirmDiscardIfDirty()) await api.doClose()
    }),
    // 处理命令行/双击/拖拽到图标打开文件的请求
    api.onOpenFile((filePath: string) => { void openFileByPath(filePath) }),
    // 显示“支持作者”打赏弹窗
    api.onMenuSupportAuthor(() => { showDonateModal.value = true })
  )

  // Ctrl+滚轮缩放整个应用窗口（绕过 CodeMirror 对 wheel 事件的拦截）
  const onWheel = (e: WheelEvent): void => {
    if (!e.ctrlKey) return
    e.preventDefault()
    void api.getZoom().then((zoom) => {
      const next = e.deltaY < 0 ? zoom + 0.1 : zoom - 0.1
      void api.setZoom(next)
      syncWindowZoomCss(next)
    })
  }
  window.addEventListener('wheel', onWheel, { passive: false })
  unsubscribers.push(() => window.removeEventListener('wheel', onWheel))

  // 拖拽文件到窗口内部打开
  const onDragOver = (e: DragEvent): void => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'copy'
  }
  const onDrop = (e: DragEvent): void => {
    e.preventDefault()
    const files = e.dataTransfer?.files
    if (!files || files.length === 0) return
    const file = files[0]
    // 只处理 Markdown / 文本文件
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['md', 'markdown', 'txt'].includes(ext)) {
      store.setLastError(`不支持的文件类型：.${ext ?? ''}`)
      return
    }
    // Electron 通过 webUtils 获取真实路径
    const filePath = api.getPathForFile(file)
    if (filePath) void openFileByPath(filePath)
  }
  document.body.addEventListener('dragover', onDragOver)
  document.body.addEventListener('drop', onDrop)
  unsubscribers.push(() => {
    document.body.removeEventListener('dragover', onDragOver)
    document.body.removeEventListener('drop', onDrop)
  })

  // 键盘快捷键（捕获阶段）
  document.addEventListener('keydown', handleKeyDown, true)
})

onBeforeUnmount(() => {
  unsubscribers.forEach((fn) => fn())
  unsubscribers.length = 0
  document.removeEventListener('keydown', handleKeyDown, true)
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.editor-main {
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
