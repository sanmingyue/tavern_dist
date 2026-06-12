<template>
  <div class="skeleton-wrapper" :class="{ 'full-page': fullPage }">
    <div v-if="type === 'list'" class="skeleton-list">
      <div v-for="i in rows" :key="i" class="skeleton-item">
        <div v-if="avatar" class="skeleton-avatar shimmer"></div>
        <div class="skeleton-content">
          <div class="skeleton-line title shimmer" :style="{ width: randomWidth(60, 80) }"></div>
          <div class="skeleton-line subtitle shimmer" :style="{ width: randomWidth(40, 70) }"></div>
        </div>
      </div>
    </div>

    <div v-else-if="type === 'card'" class="skeleton-cards">
      <div v-for="i in rows" :key="i" class="skeleton-card">
        <div class="skeleton-card-cover shimmer"></div>
        <div class="skeleton-card-body">
          <div class="skeleton-line title shimmer" style="width: 75%"></div>
          <div class="skeleton-line subtitle shimmer" style="width: 50%"></div>
        </div>
      </div>
    </div>

    <div v-else-if="type === 'chat'" class="skeleton-chat">
      <div v-for="i in rows" :key="i" class="skeleton-msg" :class="{ mine: i % 3 === 0 }">
        <div v-if="i % 3 !== 0" class="skeleton-avatar small shimmer"></div>
        <div class="skeleton-bubble shimmer" :style="{ width: randomWidth(35, 70) }"></div>
      </div>
    </div>

    <div v-else-if="type === 'detail'" class="skeleton-detail">
      <div class="skeleton-detail-header shimmer"></div>
      <div class="skeleton-detail-body">
        <div class="skeleton-line title shimmer" style="width: 60%"></div>
        <div class="skeleton-line shimmer" style="width: 90%"></div>
        <div class="skeleton-line shimmer" style="width: 80%"></div>
        <div class="skeleton-line shimmer" style="width: 45%"></div>
      </div>
    </div>

    <div v-else class="skeleton-generic">
      <div v-for="i in rows" :key="i" class="skeleton-line shimmer" :style="{ width: randomWidth(50, 95) }"></div>
    </div>

    <div v-if="text" class="skeleton-text">{{ text }}</div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  /** 骨架屏类型 */
  type?: 'list' | 'card' | 'chat' | 'detail' | 'generic';
  /** 行数 */
  rows?: number;
  /** 是否显示头像 */
  avatar?: boolean;
  /** 是否全页 */
  fullPage?: boolean;
  /** 提示文字 */
  text?: string;
}

withDefaults(defineProps<Props>(), {
  type: 'list',
  rows: 4,
  avatar: true,
  fullPage: false,
  text: '',
});

function randomWidth(min: number, max: number): string {
  return `${min + Math.floor(Math.random() * (max - min))}%`;
}
</script>

<style scoped>
.skeleton-wrapper {
  padding: 12px 16px;
}

.skeleton-wrapper.full-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

/* ─── shimmer 动画 ─── */
.shimmer {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary, rgba(255, 255, 255, 0.04)) 25%,
    var(--bg-hover, rgba(255, 255, 255, 0.08)) 50%,
    var(--bg-tertiary, rgba(255, 255, 255, 0.04)) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 6px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ─── 列表 ─── */
.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skeleton-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skeleton-avatar.small {
  width: 32px;
  height: 32px;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  height: 12px;
  border-radius: 6px;
}

.skeleton-line.title {
  height: 14px;
}

.skeleton-line.subtitle {
  height: 10px;
}

/* ─── 卡片 ─── */
.skeleton-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-card {
  background: var(--bg-primary, #0b0e14);
  border-radius: 12px;
  overflow: hidden;
}

.skeleton-card-cover {
  height: 80px;
}

.skeleton-card-body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ─── 聊天 ─── */
.skeleton-chat {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-msg {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.skeleton-msg.mine {
  flex-direction: row-reverse;
}

.skeleton-bubble {
  height: 36px;
  border-radius: 16px;
  min-width: 80px;
}

.skeleton-msg.mine .skeleton-bubble {
  border-bottom-right-radius: 4px;
}

.skeleton-msg:not(.mine) .skeleton-bubble {
  border-bottom-left-radius: 4px;
}

/* ─── 详情 ─── */
.skeleton-detail-header {
  height: 160px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.skeleton-detail-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ─── 通用 ─── */
.skeleton-generic {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ─── 提示文字 ─── */
.skeleton-text {
  text-align: center;
  font-size: 13px;
  color: var(--text-muted, rgba(255, 255, 255, 0.25));
  margin-top: 16px;
}
</style>
