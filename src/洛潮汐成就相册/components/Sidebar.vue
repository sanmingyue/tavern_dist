<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <span class="sidebar-title">图鉴</span>
    </div>
    <div class="sidebar-list">
      <button
        v-for="chapter in chapters"
        :key="chapter.prefix"
        class="chapter-item"
        :class="{ active: activeChapter === chapter.prefix }"
        @click="$emit('select', chapter.prefix)"
      >
        <span class="chapter-name">{{ chapter.label }}</span>
        <span class="chapter-count">
          {{ progress[chapter.prefix]?.unlocked || 0 }}/{{ progress[chapter.prefix]?.total || 0 }}
        </span>
        <div class="chapter-bar">
          <div
            class="chapter-bar-fill"
            :style="{ width: barPercent(chapter.prefix) + '%' }"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CHAPTERS } from '../achievements';

const props = defineProps<{
  activeChapter: string;
  progress: Record<string, { unlocked: number; total: number }>;
}>();

defineEmits<{
  select: [prefix: string];
}>();

const chapters = CHAPTERS;

function barPercent(prefix: string): number {
  const p = props.progress[prefix];
  if (!p || p.total === 0) return 0;
  return (p.unlocked / p.total) * 100;
}
</script>

<style scoped>
.sidebar {
  width: 160px;
  min-width: 160px;
  background: rgba(10, 18, 30, 0.45);
  backdrop-filter: blur(6px);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 14px 16px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-title {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 2px;
}

.sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.sidebar-list::-webkit-scrollbar {
  width: 3px;
}

.sidebar-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.chapter-item {
  display: block;
  width: 100%;
  padding: 8px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
  position: relative;
}

.chapter-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.chapter-item.active {
  background: rgba(90, 155, 181, 0.12);
}

.chapter-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 2px;
  height: 60%;
  background: #5a9bb5;
  border-radius: 0 1px 1px 0;
}

.chapter-name {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
  margin-bottom: 2px;
}

.chapter-item.active .chapter-name {
  color: rgba(255, 255, 255, 0.95);
}

.chapter-count {
  display: block;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.35);
  margin-bottom: 4px;
}

.chapter-bar {
  height: 2px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 1px;
  overflow: hidden;
}

.chapter-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #4a7d91, #7eb8c9);
  border-radius: 1px;
  transition: width 0.4s ease;
}
</style>
