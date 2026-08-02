import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import { resolve } from 'path'

const isDev = process.env.NODE_ENV !== 'production'

export default defineConfig({
  plugins: [
    vue(),
    // Only use electron plugin in dev mode for auto-restart.
    // In production, electron files are compiled separately via tsc.
    ...(isDev ? [
      electron([
        {
          entry: 'electron/main.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron']
              }
            }
          }
        },
        {
          entry: 'electron/preload.ts',
          vite: {
            build: {
              outDir: 'dist-electron',
              rollupOptions: {
                external: ['electron']
              }
            }
          }
        }
      ]),
      renderer()
    ] : [])
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  base: './',
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // 拆分大型第三方依赖为独立 chunk，利于并行加载与长期缓存
        manualChunks: {
          codemirror: [
            '@codemirror/state',
            '@codemirror/view',
            '@codemirror/commands',
            '@codemirror/language',
            '@codemirror/lang-markdown',
            '@codemirror/language-data',
            '@codemirror/search',
            '@lezer/highlight'
          ],
          markdown: ['markdown-it', 'markdown-it-anchor', 'markdown-it-deflist', 'markdown-it-footnote', 'markdown-it-task-lists', 'markdown-it-toc-done-right'],
          highlight: ['highlight.js'],
          katex: ['katex'],
          vendor: ['vue', 'pinia', 'dompurify']
        }
      }
    }
  }
})
