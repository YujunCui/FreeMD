<template>
  <footer class="status-bar">
    <div class="status-left">
      <span class="status-item">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        {{ store.wordCount.lines }} 行
      </span>
      <span class="status-item">{{ store.wordCount.words }} 字</span>
      <span class="status-item">{{ store.wordCount.chars }} 字符</span>
    </div>
    <div class="status-right">
      <span v-if="store.lastError" class="status-item status-error" :title="store.lastError">
        {{ store.lastError }}
      </span>
      <span class="status-item mode-label">{{ modeLabel }}</span>
      <span class="status-item">{{ store.fontSize }}px</span>
      <span class="status-item" :class="{ modified: store.isDirty }">
        {{ store.isDirty ? '未保存' : '已保存' }}
      </span>
      <span v-if="store.filePath" class="status-item path" :title="store.filePath">
        {{ store.filePath }}
      </span>
      <span v-else class="status-item">无文件</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()

const modeLabel = computed(() => {
  switch (store.mode) {
    case 'source': return '源码'
    case 'preview': return '预览'
    case 'split': return '分屏'
    default: return '编辑'
  }
})
</script>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 28px;
  padding: 0 16px;
  background: var(--bg-statusbar, #f0f1f3);
  border-top: 1px solid var(--border-color, #e1e4e8);
  font-size: 12px;
  color: var(--text-secondary, #6a737d);
  flex-shrink: 0;
  gap: 12px;
  /* 抵消整个窗口的缩放比例，保持状态栏视觉大小恒定 */
  zoom: calc(1 / var(--window-zoom, 1));
}

.status-left,
.status-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.status-item.path {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-item.modified {
  color: var(--warning-color, #d97706);
  font-weight: 500;
}

.mode-label {
  text-transform: uppercase;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.status-error {
  color: var(--danger-color, #dc2626);
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
