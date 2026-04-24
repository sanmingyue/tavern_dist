<template>
  <div class="achievement-section">
    <div class="section-title" @click="expanded = !expanded">
      <svg viewBox="0 0 16 16" width="13" height="13" class="title-icon">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.2"/>
        <path d="M8 4v4l3 2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
      </svg>
      <span>成就记录</span>
      <span class="achievement-total">{{ unlockedTotal }} / 611</span>
      <svg
        viewBox="0 0 16 16" width="12" height="12"
        class="expand-arrow"
        :class="{ 'is-expanded': expanded }"
      >
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>

    <!-- 总进度条 -->
    <div class="total-progress">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: totalPercent + '%' }"></div>
      </div>
      <span class="progress-text">{{ totalPercent }}%</span>
    </div>

    <!-- 展开后的各篇章进度 -->
    <Transition name="slide">
      <div v-if="expanded" class="chapter-grid">
        <div
          v-for="(info, prefix) in chapterInfo"
          :key="prefix"
          class="chapter-item"
        >
          <div class="chapter-ring" :style="ringStyle(prefix as string)">
            <svg viewBox="0 0 36 36" class="ring-svg">
              <circle cx="18" cy="18" r="15.5" fill="none"
                      stroke="var(--tide-foam)" stroke-width="3"/>
              <circle cx="18" cy="18" r="15.5" fill="none"
                      :stroke="info.color" stroke-width="3"
                      stroke-linecap="round"
                      :stroke-dasharray="ringDash(prefix as string)"
                      transform="rotate(-90 18 18)"/>
            </svg>
            <span class="ring-count">{{ getChapterCount(prefix as string) }}</span>
          </div>
          <div class="chapter-label">{{ info.name }}</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import { CHAPTER_INFO } from '../expressions';

const store = useDataStore();
const expanded = useLocalStorage('luochaoxi_achievement:expanded', false);

const chapterInfo = CHAPTER_INFO;

const CIRCUMFERENCE = 2 * Math.PI * 15.5; // ≈ 97.39

function getChapterCount(prefix: string): number {
  return Object.keys(store.data.成就).filter(k => k.startsWith(prefix)).length;
}

const unlockedTotal = computed(() => Object.keys(store.data.成就).length);

const totalPercent = computed(() => {
  return Math.round((unlockedTotal.value / 611) * 100);
});

function ringDash(prefix: string): string {
  const info = CHAPTER_INFO[prefix];
  if (!info) return `0 ${CIRCUMFERENCE}`;
  const count = getChapterCount(prefix);
  const ratio = count / info.total;
  const filled = ratio * CIRCUMFERENCE;
  return `${filled} ${CIRCUMFERENCE - filled}`;
}

function ringStyle(prefix: string) {
  return {
    '--ring-color': CHAPTER_INFO[prefix]?.color || '#ccc',
  };
}
</script>

<style lang="scss" scoped>
.achievement-section {
  padding: 0 16px 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--tide-deep);
  margin-bottom: 6px;
  font-family: var(--font-serif);
  letter-spacing: 1px;
  cursor: pointer;
  user-select: none;

  &:hover {
    color: var(--tide-mid);
  }
}

.title-icon {
  color: var(--tide-mid);
}

.achievement-total {
  margin-left: auto;
  font-size: 11px;
  font-weight: 300;
  color: var(--text-tertiary);
  font-family: var(--font-main);
}

.expand-arrow {
  color: var(--text-tertiary);
  transition: transform 0.3s ease;
  flex-shrink: 0;

  &.is-expanded {
    transform: rotate(180deg);
  }
}

.total-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.progress-track {
  flex: 1;
  height: 4px;
  background: var(--tide-foam);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--tide-light), var(--tide-mid));
  border-radius: 2px;
  transition: width 0.6s ease;
}

.progress-text {
  font-size: 10px;
  color: var(--text-tertiary);
  min-width: 28px;
  text-align: right;
}

.chapter-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.chapter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.chapter-ring {
  position: relative;
  width: 36px;
  height: 36px;
}

.ring-svg {
  width: 100%;
  height: 100%;
}

.ring-count {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 500;
  color: var(--text-secondary);
}

.chapter-label {
  font-size: 9px;
  color: var(--text-tertiary);
  text-align: center;
  letter-spacing: 0.5px;
}

/* 展开收起动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-6px);
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 300px;
  transform: translateY(0);
}

/* 响应式：小屏幕4列 */
@media (max-width: 360px) {
  .chapter-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
