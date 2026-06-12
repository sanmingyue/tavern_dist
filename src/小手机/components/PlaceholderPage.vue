<template>
  <div class="placeholder-page">
    <!-- 顶部导航栏 -->
    <div class="page-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <h1 class="page-title">{{ title }}</h1>
      <div class="header-actions">
        <slot name="actions"></slot>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="page-content">
      <div class="placeholder-content">
        <div class="placeholder-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
        </div>
        <h2 class="placeholder-title">{{ title }}</h2>
        <p class="placeholder-subtitle">{{ subtitle }}</p>
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../stores/phone-store';

const props = withDefaults(defineProps<{
  title: string;
  subtitle?: string;
}>(), {
  subtitle: '功能开发中，敬请期待',
});

defineSlots<{
  default(): any;
  actions(): any;
}>();

const store = usePhoneStore();

function goBack() {
  store.goBack();
}
</script>

<style scoped>
.placeholder-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #111318);
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-primary, #0b0e14);
  border-bottom: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.06));
}

.back-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.06));
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.back-btn:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
}

.back-btn:active {
  transform: scale(0.95);
}

.page-title {
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.page-content {
  flex: 1;
  overflow-y: auto;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 40px 20px;
  text-align: center;
}

.placeholder-icon {
  width: 100px;
  height: 100px;
  border-radius: 24px;
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.06));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.35));
}

.placeholder-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  margin: 0 0 8px 0;
}

.placeholder-subtitle {
  font-size: 14px;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
  margin: 0;
}
</style>
