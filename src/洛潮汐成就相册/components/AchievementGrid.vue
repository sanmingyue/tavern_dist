<template>
  <div class="grid-container">
    <div class="grid-header">
      <span class="grid-chapter-name">{{ currentChapter?.label }}</span>
      <span class="grid-chapter-progress">
        {{ progress?.unlocked || 0 }} / {{ progress?.total || 0 }}
      </span>
    </div>
    <div class="grid-content" :class="{ 'is-mobile': isMobile }">
      <div
        v-for="entry in entries"
        :key="entry.id"
        class="grid-item"
        :class="{ unlocked: isUnlocked(entry.id), locked: !isUnlocked(entry.id) }"
        @click="handleClick(entry.id)"
      >
        <div class="grid-img-wrap">
          <!-- 已解锁: 显示图片 -->
          <img
            v-if="isUnlocked(entry.id)"
            :src="entry.img"
            :alt="entry.name"
            class="grid-img"
            loading="lazy"
          />
          <!-- 未解锁: 锁定占位 -->
          <div v-else class="grid-locked">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1.5">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
        </div>
        <div class="grid-label">
          {{ isUnlocked(entry.id) ? entry.name : '???' }}
        </div></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CHAPTERS, ACHIEVEMENT_MAP, type AchievementEntry } from '../achievements';

const props = defineProps<{
  activeChapter: string;
  progress: { unlocked: number; total: number } | undefined;
  isUnlocked: (id: string) => boolean;
  isMobile?: boolean;
}>();

const emit = defineEmits<{
  view: [id: string];
}>();

const currentChapter = computed(() => CHAPTERS.find(c => c.prefix === props.activeChapter));
const entries = computed<AchievementEntry[]>(() => ACHIEVEMENT_MAP[props.activeChapter] || []);

function handleClick(id: string) {
  if (props.isUnlocked(id)) {
    emit('view', id);
  }
}
</script>

<style scoped>
.grid-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgba(8, 14, 25, 0.35);
  backdrop-filter: blur(4px);
}

.grid-header {
  padding: 14px 18px 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-shrink: 0;
}

.grid-chapter-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

.grid-chapter-progress {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
}

.grid-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 10px;
  align-content: start;
}

/* 手机端: 更小的网格 */
.grid-content.is-mobile {
  padding: 8px 8px;
  grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
  gap: 8px;
}

.grid-content::-webkit-scrollbar {
  width: 4px;
}

.grid-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.grid-item.unlocked:hover {
  transform: scale(1.05);
}

.grid-item.locked {
  cursor: default;
  opacity: 0.5;
}

.grid-img-wrap {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
}

/* 手机端: 缩小图片容器 */
.is-mobile .grid-img-wrap {
  width: 64px;
  height: 64px;
  border-radius: 5px;
}

.grid-item.unlocked .grid-img-wrap {
  border-color: rgba(90, 155, 181, 0.3);
  box-shadow: 0 0 8px rgba(90, 155, 181, 0.1);
}

.grid-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.grid-locked {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 20, 30, 0.8);
}

.is-mobile .grid-locked svg {
  width: 16px;
  height: 16px;
}

.grid-label {
  margin-top: 4px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 手机端: 标签适配 */
.is-mobile .grid-label {
  font-size: 9px;max-width: 64px;
}

.grid-item.unlocked .grid-label {
  color: rgba(255, 255, 255, 0.75);
}
</style>
