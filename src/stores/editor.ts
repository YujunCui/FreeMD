import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export type EditorMode = 'source' | 'preview' | 'split'
export type ThemeMode = 'light' | 'dark' | 'auto'
export type ContentOrigin = 'editor' | 'external'

export const useEditorStore = defineStore('editor', () => {
  // State
  const filePath = ref<string>('')
  // 默认空内容：避免打开软件时展示大段示例文档
  const content = ref<string>('')
  const savedContent = ref<string>('')
  const mode = ref<EditorMode>('preview')
  const theme = ref<ThemeMode>('auto')
  const resolvedTheme = ref<'light' | 'dark'>('light')
  const fontSize = ref<number>(15)
  /** 最近一次内容变更来源，用于让编辑器跳过自身输入触发的回写比较 */
  const contentOrigin = ref<ContentOrigin>('external')
  /** 最近一次操作错误（保存/打开失败等），供状态栏提示 */
  const lastError = ref<string>('')

  // Computed
  const fileTitle = computed(() => {
    if (!filePath.value) return '未命名.md'
    const parts = filePath.value.replace(/\\/g, '/').split('/')
    return parts[parts.length - 1]
  })

  const isDirty = computed(() => content.value !== savedContent.value)

  // 字数统计基于防抖内容，避免每次击键全文本正则
  const debouncedContent = ref<string>(content.value)
  let wcTimer: ReturnType<typeof setTimeout> | undefined
  watch(content, (v) => {
    if (wcTimer) clearTimeout(wcTimer)
    wcTimer = setTimeout(() => { debouncedContent.value = v }, 200)
  })

  const wordCount = computed(() => {
    const text = debouncedContent.value
    const trimmed = text.trim()
    const cjk = (trimmed.match(/[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g) || []).length
    const words = (trimmed.match(/[a-zA-Z0-9]+/g) || []).length
    return {
      chars: text.length,
      charsNoSpaces: text.replace(/\s/g, '').length,
      words: cjk + words,
      lines: text.split('\n').length
    }
  })

  // Actions
  function setContent(text: string, origin: ContentOrigin = 'external'): void {
    contentOrigin.value = origin
    content.value = text
  }

  function setFilePath(path: string): void {
    filePath.value = path
  }

  function markSaved(): void {
    savedContent.value = content.value
  }

  function newFile(): void {
    setContent('', 'external')
    savedContent.value = ''
    filePath.value = ''
    mode.value = 'split'
  }

  function setMode(newMode: EditorMode): void {
    mode.value = newMode
  }

  function setTheme(newTheme: ThemeMode): void {
    theme.value = newTheme
    updateResolvedTheme()
  }

  function updateResolvedTheme(): void {
    if (theme.value === 'auto') {
      resolvedTheme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      resolvedTheme.value = theme.value
    }
  }

  function toggleTheme(): void {
    resolvedTheme.value = resolvedTheme.value === 'dark' ? 'light' : 'dark'
    theme.value = resolvedTheme.value
  }

  function setFontSize(size: number): void {
    fontSize.value = Math.max(10, Math.min(30, size))
  }

  /** 载入已读取的文件内容并重置编辑状态 */
  function openFile(path: string, text: string): void {
    setContent(text, 'external')
    savedContent.value = text
    filePath.value = path
    mode.value = 'preview'
  }

  let errorTimer: ReturnType<typeof setTimeout> | undefined
  function setLastError(msg: string): void {
    lastError.value = msg
    if (errorTimer) clearTimeout(errorTimer)
    errorTimer = setTimeout(() => { lastError.value = '' }, 5000)
  }

  function clearError(): void {
    lastError.value = ''
  }

  /** 另存为：弹出对话框并写入。返回是否成功 */
  async function saveAs(): Promise<boolean> {
    const api = window.electronAPI
    if (!api) return false
    const result = await api.saveFileAs(content.value, fileTitle.value)
    if (result.success && result.filePath) {
      filePath.value = result.filePath
      markSaved()
      return true
    }
    if (result.error) setLastError(`另存失败：${result.error}`)
    return false
  }

  /** 保存当前文件：有路径则直接写，无路径则走另存为。返回是否成功 */
  async function save(): Promise<boolean> {
    const api = window.electronAPI
    if (!api) return false
    if (filePath.value) {
      const result = await api.saveFile(filePath.value, content.value)
      if (result.success) {
        markSaved()
        return true
      }
      setLastError(`保存失败：${result.error}`)
      return false
    }
    return saveAs()
  }

  return {
    // State
    filePath,
    content,
    savedContent,
    mode,
    theme,
    resolvedTheme,
    fontSize,
    contentOrigin,
    lastError,
    // Computed
    fileTitle,
    isDirty,
    wordCount,
    // Actions
    setContent,
    setFilePath,
    markSaved,
    newFile,
    setMode,
    setTheme,
    updateResolvedTheme,
    toggleTheme,
    setFontSize,
    openFile,
    saveAs,
    save,
    setLastError,
    clearError
  }
})
