<template>
  <button
    class="onion-generate-btn"
    :disabled="isGenerating"
    @click="$emit('generate')"
  >
    <svg v-if="isGenerating" class="onion-gen-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
    </svg>
    <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/>
    </svg>
    <span>{{ isGenerating ? '生成中...' : '生成IF线' }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{ isGenerating: boolean }>();
defineEmits<{ generate: [] }>();
</script>

<style scoped>
.onion-generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 10px 16px;
  border: 1px solid rgba(255, 150, 0.25);
  border-radius: 8px;
  background: rgba(255, 150, 0, 0.08);
  color: rgba(255, 200, 100, 0.9);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.onion-generate-btn:hover:not(:disabled) {
  background: rgba(255, 150, 0, 0.15);
  border-color: rgba(255, 150, 0, 0.4);
  color: #fff;
}

.onion-generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.onion-gen-spinner {
  animation: onion-btn-spin 0.8s linear infinite;
}

@keyframes onion-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
