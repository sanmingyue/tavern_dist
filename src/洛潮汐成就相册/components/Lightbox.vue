<template>
  <Transition name="lightbox">
    <div v-if="entry" class="lightbox-overlay" @click.self="$emit('close')">
      <div class="lightbox-card" @click.stop>
        <!-- 关闭按钮 -->
        <button class="lightbox-close" @click="$emit('close')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <!-- 图片区域：点击查看原图 -->
        <div class="lightbox-img-container" @click="openOriginal">
          <img :src="entry.img" :alt="entry.name" class="lightbox-img" />
          <div class="lightbox-img-hint">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
              <line x1="11" y1="8" x2="11" y2="14" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
            <span>查看原图</span>
          </div>
        </div>

        <!-- 信息 -->
        <div class="lightbox-info">
          <div class="lightbox-id">{{ entry.id }}</div>
          <div class="lightbox-name">{{ entry.name }}</div>
          <div class="lightbox-desc">{{ entry.desc }}</div>
        </div>

        <!-- 导航 -->
        <div class="lightbox-nav">
          <button
            class="lightbox-nav-btn"
            :disabled="!hasPrev"
            @click="$emit('prev')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            class="lightbox-nav-btn"
            :disabled="!hasNext"
            @click="$emit('next')"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import type { AchievementEntry } from '../achievements';

const props = defineProps<{
  entry: AchievementEntry | null;
  hasPrev: boolean;
  hasNext: boolean;
}>();

defineEmits<{
  close: [];
  prev: [];
  next: [];
}>();

function openOriginal() {
  if (props.entry?.img) {
    window.parent.open(props.entry.img, '_blank');
  }
}
</script>

<style scoped>
.lightbox-overlay {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  pointer-events: auto;
  padding: 16px;
  box-sizing: border-box;
}

.lightbox-card {
  position: relative;
  max-width: 420px;
  width: 100%;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  background: rgba(12, 18, 30, 0.98);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  margin: auto;
}

.lightbox-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.lightbox-close:hover {
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
}

.lightbox-img-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  cursor: zoom-in;
}

.lightbox-img-container:hover .lightbox-img-hint {
  opacity: 1;
}

.lightbox-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;
}

.lightbox-img-container:hover .lightbox-img {
  transform: scale(1.03);
}

.lightbox-img-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.8);
  font-size: 11px;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.lightbox-info {
  padding: 16px 18px;
}

.lightbox-id {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
  font-family: monospace;
  margin-bottom: 4px;
}

.lightbox-name {
  font-size: 16px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 6px;
}

.lightbox-desc {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.5;
}

.lightbox-nav {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 0 18px 16px;
}

.lightbox-nav-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.lightbox-nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.lightbox-nav-btn:disabled {
  opacity: 0.25;
  cursor: default;
}

/* 手机端适配：图片区域不使用 1:1，改为更小的比例 */
@media (max-width: 500px) {
  .lightbox-overlay {
    padding: 8px;
  }

  .lightbox-card {
    max-width: 100%;
    border-radius: 10px;
  }

  .lightbox-img-container {
    aspect-ratio: 4 / 3;
  }

  .lightbox-info {
    padding: 12px 14px;
  }

  .lightbox-name {
    font-size: 14px;
    margin-bottom: 4px;
  }

  .lightbox-desc {
    font-size: 11px;
  }

  .lightbox-nav {
    padding: 0 14px 12px;
    gap: 24px;
  }

  .lightbox-nav-btn {
    width: 36px;
    height: 36px;
  }

  /* 手机端始终显示查看原图提示 */
  .lightbox-img-hint {
    opacity: 0.7;
  }
}

/* 过渡动画 */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.25s ease;
}

.lightbox-enter-active .lightbox-card,
.lightbox-leave-active .lightbox-card {
  transition: transform 0.25s ease;
}

.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

.lightbox-enter-from .lightbox-card {
  transform: scale(0.9);
}

.lightbox-leave-to .lightbox-card {
  transform: scale(0.9);
}
</style>
