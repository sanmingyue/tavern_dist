<template>
  <div class="placeholder-page">
    <!-- 通用占位图标 SVG -->
    <svg class="placeholder-icon-svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </svg>
    <div class="placeholder-title">{{ title }}</div>
    <div class="placeholder-subtitle">{{ subtitle }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
}>();
</script>

<style scoped>
.placeholder-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  padding: 40px 24px;
}

.placeholder-icon-svg {
  color: var(--text-muted);
  opacity: 0.4;
}

.placeholder-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.placeholder-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.5;
}
</style>
