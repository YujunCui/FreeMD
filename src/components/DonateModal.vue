<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="donate-overlay" @click.self="close">
        <div class="donate-card" :data-theme="theme">
          <button class="donate-close" aria-label="关闭" @click="close">×</button>
          <h2 class="donate-title">支持作者</h2>
          <p class="donate-desc">打赏作者才有动力开发出更好的软件</p>
          <div class="donate-qrcodes">
            <div class="donate-item">
              <img :src="wechatImg" alt="微信打赏二维码" />
              <span>微信支付</span>
            </div>
            <div class="donate-item">
              <img :src="alipayImg" alt="支付宝打赏二维码" />
              <span>支付宝</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/stores/editor'
import wechatImg from '@/assets/donate/wechat_donate.jpg'
import alipayImg from '@/assets/donate/alipay_donate.jpg'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const store = useEditorStore()
const theme = computed(() => store.resolvedTheme)

function close(): void {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.donate-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(2px);
}

.donate-card {
  position: relative;
  width: min(90vw, 520px);
  padding: 28px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  text-align: center;
}

.donate-card[data-theme='dark'] {
  background: #1e1e1e;
  color: #e0e0e0;
}

.donate-close {
  position: absolute;
  top: 12px;
  right: 16px;
  border: none;
  background: transparent;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.donate-close:hover {
  opacity: 1;
}

.donate-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 600;
}

.donate-desc {
  margin: 0 0 22px;
  font-size: 14px;
  opacity: 0.75;
}

.donate-qrcodes {
  display: flex;
  gap: 24px;
  justify-content: center;
  align-items: flex-start;
}

.donate-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.donate-item img {
  width: 160px;
  height: 160px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.25);
}

.donate-item span {
  font-size: 13px;
  opacity: 0.85;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .donate-qrcodes {
    flex-direction: column;
    gap: 18px;
  }

  .donate-item img {
    width: 140px;
    height: 140px;
  }
}
</style>
