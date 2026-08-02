<template>
  <div class="editor-wrapper" :class="`mode-${store.mode}`" ref="wrapperRef">
    <!-- 预览模式或分屏模式时显示预览面板 -->
    <div
      v-show="store.mode === 'preview' || store.mode === 'split'"
      class="editor-pane preview-pane"
      ref="previewPaneRef"
      :style="store.mode === 'split' ? { flex: `0 0 ${splitRatio}%` } : {}"
    >
      <div class="preview-content markdown-body" v-html="renderedHtml"></div>
    </div>

    <!-- 可拖拽分隔条 -->
    <div
      v-show="store.mode === 'split'"
      class="editor-divider"
      :class="{ dragging: isDragging }"
      role="separator"
      aria-orientation="vertical"
      aria-label="拖动以调整分屏比例"
      @mousedown="startDrag"
    >
      <div class="divider-handle"></div>
    </div>

    <!-- 源码模式或分屏模式时显示编辑器面板 -->
    <div
      v-show="store.mode === 'source' || store.mode === 'split'"
      class="editor-pane source-pane"
      ref="sourcePaneRef"
      :style="store.mode === 'split' ? { flex: `0 0 ${100 - splitRatio}%` } : {}"
    >
      <div ref="cmHostRef" class="cm-host"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { EditorState } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import { createEditorExtensions, createThemeExtension } from '@/editor/codemirror-setup'
import { renderMarkdown } from '@/editor/renderer'

const store = useEditorStore()
const { content: storeContent, resolvedTheme, fontSize } = storeToRefs(store)

const wrapperRef = ref<HTMLElement>()
const cmHostRef = ref<HTMLElement>()
const sourcePaneRef = ref<HTMLElement>()
const previewPaneRef = ref<HTMLElement>()
let editorView: EditorView | null = null
let bundle = createEditorExtensions(store.resolvedTheme, store.fontSize)

// 分屏拖拽状态
const splitRatio = ref<number>(50)
const isDragging = ref<boolean>(false)

// 渲染防抖：避免大文档每次击键全量渲染造成卡顿
const debouncedContent = ref<string>(storeContent.value)
let renderTimer: ReturnType<typeof setTimeout> | undefined
watch(storeContent, (v) => {
  if (renderTimer) clearTimeout(renderTimer)
  renderTimer = setTimeout(() => { debouncedContent.value = v }, 120)
})

const renderedHtml = computed(() => renderMarkdown(debouncedContent.value))

// ===== 创建 CodeMirror 编辑器 =====
function createEditor(): void {
  if (!cmHostRef.value) return

  const extensions = [
    ...bundle.extensions,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        // 编辑器内部输入标记为 'editor'，使内容回写 watch 跳过 O(n) 比较
        store.setContent(update.state.doc.toString(), 'editor')
      }
    })
  ]

  editorView = new EditorView({
    state: EditorState.create({
      doc: storeContent.value || '',
      extensions
    }),
    parent: cmHostRef.value
  })

  // CodeMirror 滚动监听一次性绑定，使用具名函数避免重复注册
  editorView.scrollDOM.addEventListener('scroll', onCmScroll)
}

// ===== 分屏模式：拖拽分隔条（rAF 节流，避免高频重排） =====
let dragStartX = 0
let dragStartRatio = 50
let pendingX = 0
let dragRaf: number | undefined

function startDrag(e: MouseEvent): void {
  isDragging.value = true
  dragStartX = e.clientX
  dragStartRatio = splitRatio.value
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', stopDrag)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  e.preventDefault()
}

function onDragMove(e: MouseEvent): void {
  if (!isDragging.value) return
  pendingX = e.clientX
  if (dragRaf !== undefined) return
  dragRaf = requestAnimationFrame(() => {
    dragRaf = undefined
    const wrapperWidth = wrapperRef.value?.clientWidth ?? 0
    if (wrapperWidth === 0) return
    const deltaRatio = ((pendingX - dragStartX) / wrapperWidth) * 100
    splitRatio.value = Math.max(20, Math.min(80, dragStartRatio + deltaRatio))
  })
}

function stopDrag(): void {
  isDragging.value = false
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', stopDrag)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  if (dragRaf !== undefined) {
    cancelAnimationFrame(dragRaf)
    dragRaf = undefined
  }
  // 分屏比例变化导致预览布局重排，重建锚点
  nextTick(rebuildAnchors)
}

// ===== 分屏模式：基于源码行号锚点的联动滚动 =====
// 渲染时为块级元素标注 data-source-line（见 renderer.ts），据此建立
// 源码行 ↔ 预览元素的双向映射，避免比例同步在表格/代码块等高度不均处错位。
let suppressScrollUntil = 0
let scrollRaf: number | undefined
interface Anchor { line: number; el: HTMLElement; top: number }
let previewAnchors: Anchor[] = []

/** 重建预览锚点缓存（渲染/布局变化后调用） */
function rebuildAnchors(): void {
  const pane = previewPaneRef.value
  if (!pane) { previewAnchors = []; return }
  const paneRect = pane.getBoundingClientRect()
  const st = pane.scrollTop
  previewAnchors = Array.from(pane.querySelectorAll<HTMLElement>('[data-source-line]'))
    .map(el => ({
      line: Number(el.getAttribute('data-source-line')) || 0,
      el,
      top: el.getBoundingClientRect().top - paneRect.top + st
    }))
    .sort((a, b) => a.top - b.top)
}

/** 二分查找顶部可见锚点及其后继 */
function findAnchorAt(scrollTop: number): { target?: Anchor; next?: Anchor } {
  const arr = previewAnchors
  if (arr.length === 0) return {}
  let lo = 0
  let hi = arr.length - 1
  let idx = 0
  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid].top <= scrollTop) { idx = mid; lo = mid + 1 }
    else hi = mid - 1
  }
  return { target: arr[idx], next: arr[idx + 1] }
}

function onPreviewScroll(): void {
  if (store.mode !== 'split') return
  if (performance.now() < suppressScrollUntil) return
  if (!editorView || previewAnchors.length === 0) return
  if (scrollRaf !== undefined) return
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = undefined
    syncCmFromPreview()
  })
}

function syncCmFromPreview(): void {
  if (!editorView) return
  const pane = previewPaneRef.value
  if (!pane) return
  const { target, next } = findAnchorAt(pane.scrollTop)
  if (!target) return

  // 在 [target, next] 区间按像素比例插值出源码行号
  let line: number
  if (next && next.top > target.top) {
    const ratio = Math.min(1, Math.max(0, (pane.scrollTop - target.top) / (next.top - target.top)))
    line = target.line + ratio * (next.line - target.line)
  } else {
    line = target.line
  }

  const doc = editorView.state.doc
  const lineNum = Math.max(1, Math.min(doc.lines, Math.round(line)))
  const blockTop = editorView.lineBlockAt(doc.line(lineNum).from).top
  suppressScrollUntil = performance.now() + 80
  editorView.scrollDOM.scrollTop = blockTop
}

function onCmScroll(): void {
  if (store.mode !== 'split') return
  if (performance.now() < suppressScrollUntil) return
  if (!editorView || previewAnchors.length === 0) return
  if (scrollRaf !== undefined) return
  scrollRaf = requestAnimationFrame(() => {
    scrollRaf = undefined
    syncPreviewFromCm()
  })
}

function syncPreviewFromCm(): void {
  if (!editorView) return
  const pane = previewPaneRef.value
  if (!pane) return
  const cmScroller = editorView.scrollDOM
  // 顶部可见行的文档位置 → 行号（1-based）
  const topPos = editorView.lineBlockAtHeight(cmScroller.scrollTop).from
  const topLine = editorView.state.doc.lineAt(topPos).number

  // 找源码行 <= topLine 的最后一个锚点及其后继
  let target: Anchor | undefined
  let next: Anchor | undefined
  for (const a of previewAnchors) {
    if (a.line <= topLine) { target = a; next = undefined }
    else { next = a; break }
  }
  if (!target) target = previewAnchors[0]
  if (!target) return

  // 按行号比例插值预览 scrollTop
  let scrollTop: number
  if (next && next.line > target.line) {
    const ratio = (topLine - target.line) / (next.line - target.line)
    scrollTop = target.top + ratio * (next.top - target.top)
  } else {
    scrollTop = target.top
  }

  const paneMax = pane.scrollHeight - pane.clientHeight
  suppressScrollUntil = performance.now() + 80
  pane.scrollTop = Math.max(0, Math.min(paneMax, scrollTop))
}

// ===== Watch =====

// 监听外部内容变化（如打开文件）；编辑器自身输入触发的变更跳过，避免 O(n) 比较
watch(storeContent, async (newContent) => {
  if (store.contentOrigin === 'editor') return
  await nextTick()
  if (editorView && newContent !== editorView.state.doc.toString()) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: editorView.state.doc.length,
        insert: newContent
      }
    })
  }
})

// 监听主题变化：整体替换主题隔离舱（语法高亮 + 基础外观）
watch(resolvedTheme, (newTheme) => {
  if (editorView) {
    editorView.dispatch({
      effects: bundle.themeCompartment.reconfigure(createThemeExtension(newTheme))
    })
  }
})

// 监听字号变化
watch(fontSize, (newSize) => {
  if (editorView) {
    editorView.dispatch({
      effects: bundle.fontSizeCompartment.reconfigure(
        EditorView.theme({ '&': { fontSize: `${newSize}px` } })
      )
    })
  }
})

// 预览内容变化后重建锚点
watch(renderedHtml, () => { nextTick(rebuildAnchors) })

// 分屏模式下绑定/解绑预览滚动事件（具名函数，可正确移除）
watch(() => store.mode, async (newMode) => {
  await nextTick()
  if (newMode === 'split') {
    rebuildAnchors()
    previewPaneRef.value?.addEventListener('scroll', onPreviewScroll)
  } else {
    previewPaneRef.value?.removeEventListener('scroll', onPreviewScroll)
  }
})

// ===== 生命周期 =====
function handleClick(e: MouseEvent): void {
  const target = e.target as HTMLElement
  if (target.classList.contains('copy-code-btn')) {
    const codeEl = target.parentElement?.querySelector('code')
    if (codeEl) {
      navigator.clipboard.writeText(codeEl.textContent || '')
      target.textContent = '已复制'
      setTimeout(() => { target.textContent = '复制' }, 2000)
    }
  }
}

function onWinResize(): void {
  if (store.mode === 'split') nextTick(rebuildAnchors)
}

onMounted(() => {
  createEditor()
  document.addEventListener('click', handleClick, true)
  window.addEventListener('resize', onWinResize)
  if (store.mode === 'split') {
    nextTick(() => {
      rebuildAnchors()
      previewPaneRef.value?.addEventListener('scroll', onPreviewScroll)
    })
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClick, true)
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('resize', onWinResize)
  previewPaneRef.value?.removeEventListener('scroll', onPreviewScroll)
  if (scrollRaf !== undefined) cancelAnimationFrame(scrollRaf)
  if (editorView) {
    editorView.scrollDOM.removeEventListener('scroll', onCmScroll)
  }
  if (renderTimer) clearTimeout(renderTimer)
  editorView?.destroy()
})
</script>

<style scoped>
.editor-wrapper {
  display: flex;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.editor-wrapper.mode-source .source-pane {
  flex: 1;
}

.editor-wrapper.mode-preview .preview-pane {
  flex: 1;
}

.editor-pane {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
}

.source-pane {
  position: relative;
}

.cm-host {
  height: 100%;
}

.cm-host :deep(.cm-editor) {
  height: 100%;
}

.cm-host :deep(.cm-scroller) {
  overflow: auto;
  height: 100%;
}

.preview-pane {
  background: var(--bg-primary, #ffffff);
}

.preview-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 40px 40px 80px;
}

.editor-divider {
  width: 6px;
  background: transparent;
  cursor: col-resize;
  flex-shrink: 0;
  position: relative;
  transition: background 0.15s ease;
  z-index: 10;
}

/* 扩大命中区域，视觉保持纤细 */
.editor-divider::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -5px;
  right: -5px;
}

.editor-divider:hover,
.editor-divider.dragging {
  background: var(--accent-soft-bg);
}

.editor-divider .divider-handle {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 100%;
  background: var(--border-color, #e1e4e8);
  transition: all 0.15s ease;
}

/* 居中抓手圆点，提示可拖拽 */
.editor-divider .divider-handle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--text-tertiary, #959da5);
  transition: all 0.15s ease;
}

.editor-divider:hover .divider-handle,
.editor-divider.dragging .divider-handle {
  background: var(--accent-color, #2563eb);
  width: 4px;
}

.editor-divider:hover .divider-handle::after,
.editor-divider.dragging .divider-handle::after {
  background: var(--accent-color, #2563eb);
  transform: translate(-50%, -50%) scale(1.4);
}
</style>