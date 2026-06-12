<template>
  <div class="onion-ifline-panel">
    <!-- 标题 -->
    <div class="onion-ifline-header">
      <span class="onion-ifline-tag">IF线</span>
      <span v-if="result" class="onion-ifline-title">{{ result.title }}</span>
    </div>

    <!-- 加载中 -->
    <div v-if="state === 'generating'" class="onion-ifline-loading">
      <div class="onion-ifline-spinner"></div>
      <span>平行世界线展开中...</span>
    </div>

    <!-- 内容 -->
    <div v-else-if="state === 'done' && result" class="onion-ifline-content">
      <p class="onion-ifline-text">{{ displayText }}</p>
    </div>

    <!-- 错误 -->
    <div v-else-if="state === 'error'" class="onion-ifline-error">
      <span>生成失败，请重试</span>
    </div>

    <!-- 空状态 -->
    <div v-else class="onion-ifline-empty">
      <p>点击下方按钮，窥探另一条世界线</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { IfLineResult, IfLineState } from '../ifline/types';

const props = defineProps<{
  state: IfLineState;
  result: IfLineResult | null;
}>();

// 打字机效果
const displayText = ref('');
let typewriterTimer: ReturnType<typeof setInterval> | null = null;

watch(
  () => props.result,
  (newResult) => {
    if (!newResult) return;
    if (typewriterTimer) clearInterval(typewriterTimer);

    displayText.value = '';
    let idx = 0;
    const text = newResult.content;

    typewriterTimer = setInterval(() => {
      if (idx < text.length) {
        displayText.value += text[idx];
        idx++;
      } else if (typewriterTimer) {
        clearInterval(typewriterTimer);
      }
    }, 30);
  },
);
</script>

<style scoped>
.onion-ifline-panel {
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 200, 0.12);
  background: rgba(255, 200, 0, 0.04);
}

.onion-ifline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.onion-ifline-tag {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 150, 0, 0.2);
  color: rgba(255, 180, 0, 0.9);
  font-weight: 600;
  flex-shrink: 0;
}

.onion-ifline-title {
  font-size: 13px;
  color: rgba(255, 255, 0.7);
  font-style: italic;
}

.onion-ifline-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  justify-content: center;
  color: rgba(255, 255, 0.5);
  font-size: 13px;
}

.onion-ifline-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 150, 0, 0.3);
  border-top-color: rgba(255, 150, 0, 0.8);
  border-radius: 50%;
  animation: onion-spin 0.8s linear infinite;
}

@keyframes onion-spin {
  to {
    transform: rotate(360deg);
  }
}

.onion-ifline-content {
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: none;
}

.onion-ifline-content::-webkit-scrollbar {
  width: 0;
}

.onion-ifline-text {
  font-size: 14px;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
  white-space: pre-wrap;
}

.onion-ifline-error {
  padding: 8px 0;
  color: rgba(255, 100, 0.8);
  font-size: 12px;
  text-align: center;
}

.onion-ifline-empty {
  padding: 12px 0;
  text-align: center;
}

.onion-ifline-empty p {
  margin: 0;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
  font-style: italic;
}
</style>
