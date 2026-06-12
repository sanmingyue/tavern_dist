<template>
  <div class="error-block">
    <div class="error-icon">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <p class="error-title">{{ title || '生成失败' }}</p>
    <p class="error-message" v-if="message">{{ message }}</p>
    <button v-if="retryFn" class="retry-btn" @click="retryFn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="23 4 23 10 17 10"/><path d="M20.49 15A9 9 0 1 1 21 12"/>
      </svg>
      重试
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title?: string;
  message?: string;
  retryFn?: () => void;
}>();
</script>

<style scoped>
.error-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  gap: 8px;
  text-align: center;
}

.error-icon {
  color: var(--danger, #ff3b30);
  opacity: 0.7;
}

.error-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.error-message {
  margin: 0;
  font-size: 12px;
  color: var(--text-tertiary);
  max-width: 240px;
  line-height: 1.4;
  word-break: break-all;
}

.retry-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 6px 16px;
  border: 1px solid var(--accent, #007aff);
  border-radius: 16px;
  background: transparent;
  color: var(--accent, #007aff);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.retry-btn:hover {
  background: var(--accent, #007aff);
  color: white;
}
</style>
