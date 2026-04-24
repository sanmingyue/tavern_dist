<template>
  <Teleport to="body">
    <Transition name="portrait-overlay">
      <div v-if="visible" class="portrait-overlay" @click="close">
        <Transition name="portrait-content" appear>
          <div v-if="visible" class="portrait-container" @click.stop>
            <!-- 关闭按钮 -->
            <button class="portrait-close" @click="close">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <!-- 立绘图片 -->
            <div class="portrait-image-wrapper">
              <img
                :src="url"
                :alt="name"
                class="portrait-image"
                @load="onImageLoad"
                @error="onImageError"
              />
              <div v-if="loading" class="portrait-loading">
                <div class="loading-spinner"></div>
                <span>加载中...</span>
              </div>
            </div>

            <!-- 角色信息条 -->
            <div class="portrait-info">
              <span class="portrait-name">{{ name }}</span>
              <span v-if="attitude" class="portrait-attitude" :class="attitudeClass">
                {{ attitude }}
              </span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = defineProps<{
  visible: boolean;
  url: string;
  name: string;
  attitude?: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const loading = ref(true);

function close() {
  emit('close');
}

function onImageLoad() {
  loading.value = false;
}

function onImageError() {
  loading.value = false;
}

// 每次打开时重置 loading
const _watch = computed(() => props.visible);
watch(_watch, (val) => {
  if (val) loading.value = true;
});

const attitudeClass = computed(() => {
  const map: Record<string, string> = {
    '陌生': 'neutral',
    '警惕': 'wary',
    '敌对': 'hostile',
    '中立': 'neutral',
    '好感': 'friendly',
    '信任': 'trust',
    '敬畏': 'awe',
    '仇恨': 'hate',
    '挚友': 'close',
    '师徒': 'master',
    '道侣': 'lover',
  };
  return map[props.attitude || ''] || 'neutral';
});
</script>

<style scoped>
.portrait-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.portrait-container {
  position: relative;
  max-width: 480px;
  max-height: 85vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.portrait-close {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(139, 92, 246, 0.4);
  background: rgba(20, 20, 40, 0.9);
  color: #c4b5fd;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}

.portrait-close:hover {
  background: rgba(139, 92, 246, 0.3);
  border-color: #8b5cf6;
  color: #fff;
  transform: scale(1.1);
}

.portrait-image-wrapper {
  position: relative;
  width: 100%;
  border-radius: 16px;
  overflow: hidden;
  border: 2px solid rgba(139, 92, 246, 0.3);
  box-shadow:
    0 0 30px rgba(139, 92, 246, 0.2),
    0 20px 60px rgba(0, 0, 0, 0.5);
  background: rgba(15, 15, 35, 0.9);
}

.portrait-image {
  display: block;
  width: 100%;
  height: auto;
  max-height: 70vh;
  object-fit: contain;
}

.portrait-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(15, 15, 35, 0.9);
  color: #8b5cf6;
  font-size: 13px;
  min-height: 200px;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(139, 92, 246, 0.2);
  border-top-color: #8b5cf6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.portrait-info {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background: rgba(20, 20, 40, 0.9);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 20px;
  backdrop-filter: blur(8px);
}

.portrait-name {
  font-size: 15px;
  font-weight: 700;
  color: #e8e0f0;
  letter-spacing: 1px;
}

.portrait-attitude {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  background: #f3f4f6;
  color: #6b7280;
}

.portrait-attitude.friendly,
.portrait-attitude.trust,
.portrait-attitude.close {
  background: rgba(5, 150, 105, 0.2);
  color: #34d399;
}

.portrait-attitude.lover {
  background: rgba(219, 39, 119, 0.2);
  color: #f472b6;
}

.portrait-attitude.hostile,
.portrait-attitude.hate {
  background: rgba(220, 38, 38, 0.2);
  color: #f87171;
}

.portrait-attitude.awe {
  background: rgba(217, 119, 6, 0.2);
  color: #fbbf24;
}

.portrait-attitude.wary {
  background: rgba(234, 88, 12, 0.2);
  color: #fb923c;
}

.portrait-attitude.master {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.portrait-attitude.neutral {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

/* ─── 过渡动画 ─── */
.portrait-overlay-enter-active,
.portrait-overlay-leave-active {
  transition: opacity 0.25s ease;
}

.portrait-overlay-enter-from,
.portrait-overlay-leave-to {
  opacity: 0;
}

.portrait-content-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.portrait-content-leave-active {
  transition: all 0.2s ease;
}

.portrait-content-enter-from {
  opacity: 0;
  transform: scale(0.85) translateY(20px);
}

.portrait-content-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

/* 手机端适配 */
@media (max-width: 500px) {
  .portrait-overlay {
    padding: 12px;
  }

  .portrait-container {
    max-width: 100%;
    max-height: 75vh;
  }

  .portrait-image {
    max-height: 60vh;
  }

  .portrait-close {
    top: -4px;
    right: -4px;
    width: 32px;
    height: 32px;
  }

  .portrait-info {
    padding: 6px 12px;
  }

  .portrait-name {
    font-size: 14px;
  }
}
</style>
