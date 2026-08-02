<template>
  <header class="toolbar">
    <div class="toolbar-left">
      <!-- Logo -->
      <div class="logo">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="9" y1="13" x2="15" y2="13" />
          <line x1="9" y1="17" x2="13" y2="17" />
        </svg>
        <span class="logo-text">FreeMD</span>
      </div>
    </div>

    <div class="toolbar-spacer"></div>

    <div class="toolbar-right">
      <!-- Mode toggle -->
      <div class="mode-switch">
        <button
          :class="['mode-btn', { active: store.mode === 'source' }]"
          aria-label="源码模式"
          title="源码模式"
          @click="store.setMode('source')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
        </button>
        <button
          :class="['mode-btn', { active: store.mode === 'split' }]"
          aria-label="分屏模式"
          title="分屏模式"
          @click="store.setMode('split')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="12" y1="3" x2="12" y2="21" />
          </svg>
        </button>
        <button
          :class="['mode-btn', { active: store.mode === 'preview' }]"
          aria-label="预览模式"
          title="预览模式"
          @click="store.setMode('preview')"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <!-- Font size -->
      <button class="icon-btn" aria-label="减小字体" title="减小字体" @click="store.setFontSize(store.fontSize - 1)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <span class="font-size-label">{{ store.fontSize }}px</span>
      <button class="icon-btn" aria-label="增大字体" title="增大字体" @click="store.setFontSize(store.fontSize + 1)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <div class="toolbar-divider"></div>

      <!-- Theme toggle -->
      <button class="icon-btn" aria-label="切换主题" title="切换主题" @click="store.toggleTheme()">
        <svg v-if="store.resolvedTheme === 'light'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </button>

      <!-- Save button -->
      <button class="icon-btn primary" aria-label="保存" title="保存 (Ctrl+S)" @click="handleSave">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
          <polyline points="17 21 17 13 7 13 7 21" />
          <polyline points="7 3 7 8 15 8" />
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()

async function handleSave(): Promise<void> {
  await store.save()
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 12px;
  background: var(--bg-toolbar, #f7f8fa);
  border-bottom: 1px solid var(--border-color, #e1e4e8);
  -webkit-app-region: drag;
  flex-shrink: 0;
  gap: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.toolbar-spacer {
  flex: 1;
  -webkit-app-region: drag;
}

.logo {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-primary, #1a1a2e);
  font-weight: 700;
  padding-left: 4px;
}

.logo-text {
  font-size: 14px;
  letter-spacing: 0.5px;
}

.mode-switch {
  display: flex;
  align-items: center;
  background: var(--bg-button, #e8eaed);
  border-radius: 8px;
  padding: 2px;
  gap: 2px;
}

.mode-btn,
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-secondary, #6a737d);
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-btn:hover,
.icon-btn:hover {
  background: var(--bg-hover, rgba(0,0,0,0.08));
  color: var(--text-primary, #1a1a2e);
}

.mode-btn.active {
  background: var(--bg-active, #ffffff);
  color: var(--accent-color, #2563eb);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.icon-btn.primary {
  color: var(--accent-color, #2563eb);
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color, #e1e4e8);
}

.font-size-label {
  font-size: 12px;
  color: var(--text-secondary, #6a737d);
  min-width: 36px;
  text-align: center;
}

/* 防止按钮组在窄窗口被压缩变形 */
.toolbar-left,
.toolbar-right {
  flex-shrink: 0;
}

/* 键盘聚焦反馈（仅键盘导航时显示） */
.mode-btn:focus-visible,
.icon-btn:focus-visible {
  outline: 2px solid var(--accent-color, #2563eb);
  outline-offset: 2px;
}

/* 响应式：窄窗口逐步收敛，保证按钮始终可操作 */
@media (max-width: 720px) {
  .toolbar {
    padding: 0 8px;
    gap: 8px;
  }
  .logo-text {
    display: none;
  }
}

@media (max-width: 540px) {
  .toolbar {
    gap: 6px;
  }
  .font-size-label,
  .toolbar-divider {
    display: none;
  }
}
</style>
