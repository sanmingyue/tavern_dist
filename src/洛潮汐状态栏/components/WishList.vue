<template>
  <div class="wish-note">
    <!-- 便签纸顶部胶带 -->
    <div class="tape"></div>

    <!-- 便签标题 -->
    <div class="note-header">
      <span class="note-title">愿望清单</span>
      <span class="note-subtitle">{{ completedCount }} / {{ totalCount }}</span>
    </div>

    <!-- 便签内容 -->
    <div class="note-body">
      <div
        v-for="i in 10"
        :key="i"
        class="wish-line"
        :class="{
          'is-done': getStatus(String(i)) === '已完成',
          'is-active': getStatus(String(i)) === '进行中',
          'is-empty': !hasWish(String(i)),
        }"
      >
        <!-- 手绘风复选框 -->
        <div class="wish-checkbox">
          <svg viewBox="0 0 24 24" width="18" height="18">
            <!-- 手绘方框 -->
            <path
              d="M4 3.5 C4 3.5 3.8 4 4 4 L4 20 C4 20.2 4.3 20.5 4.5 20.5 L20 20.5 C20.3 20.5 20.5 20 20.5 19.8 L20.5 4.2 C20.5 3.8 20 3.5 19.8 3.5 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
              class="checkbox-box"
            />
            <!-- 已完成：手绘勾 -->
            <path
              v-if="getStatus(String(i)) === '已完成'"
              d="M6 12.5 L10 17 L18 7"
              fill="none"
              stroke="var(--sunset-warm)"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="checkbox-check"
            />
            <!-- 进行中：手绘小圆点 -->
            <circle
              v-if="getStatus(String(i)) === '进行中'"
              cx="12" cy="12" r="4"
              fill="var(--tide-mid)"
              class="checkbox-dot"
            />
          </svg>
        </div>

        <!-- 愿望内容 -->
        <div class="wish-text">
          <template v-if="hasWish(String(i))">
            <span class="wish-name">
              {{ getName(String(i)) }}
            </span>
            <!-- 已完成：手绘划线覆盖层 -->
            <svg
              v-if="getStatus(String(i)) === '已完成'"
              class="strike-line"
              preserveAspectRatio="none"
            >
              <line
                x1="0" y1="50%"
                x2="100%" y2="50%"
                stroke="var(--sunset-warm)"
                stroke-width="2"
                stroke-linecap="round"
                :stroke-dasharray="strikeDash"
              />
            </svg>
          </template>
          <template v-else>
            <span class="wish-placeholder">· · · · · ·</span>
          </template>
        </div>

        <!-- 完成日期小标注 -->
        <span v-if="getDate(String(i))" class="wish-date">{{ getDate(String(i)) }}</span>
      </div>
    </div>

    <!-- 便签底部小装饰 -->
    <div class="note-footer">
      <svg viewBox="0 0 120 8" class="footer-wave" preserveAspectRatio="none">
        <path
          d="M0 4 Q5 1 10 4 Q15 7 20 4 Q25 1 30 4 Q35 7 40 4 Q45 1 50 4 Q55 7 60 4 Q65 1 70 4 Q75 7 80 4 Q85 1 90 4 Q95 7 100 4 Q105 1 110 4 Q115 7 120 4"
          fill="none" stroke="var(--tide-light)" stroke-width="0.8" opacity="0.4"
        />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();

// 手绘划线的 dash 效果，模拟笔触不均匀
const strikeDash = '8 3 12 3 6 3';

function hasWish(key: string): boolean {
  return _.has(store.data.愿望清单, key);
}

function getName(key: string): string {
  return _.get(store.data.愿望清单, [key, '_名称'], '') as string;
}

function getStatus(key: string): string {
  return _.get(store.data.愿望清单, [key, '状态'], '未开始') as string;
}

function getDate(key: string): string {
  return _.get(store.data.愿望清单, [key, '完成日期'], '') as string;
}

const totalCount = computed(() => {
  return Object.keys(store.data.愿望清单).length;
});

const completedCount = computed(() => {
  return Object.values(store.data.愿望清单).filter(w => w.状态 === '已完成').length;
});
</script>

<style lang="scss" scoped>
/* ====== 便签整体 ====== */
.wish-note {
  margin: 0 0 12px;
  position: relative;
  background:
    linear-gradient(
      to bottom,
      var(--sand-cream) 0%,
      #faf6ed 40%,
      #f8f3e8 100%
    );
  border-radius: 3px;
  padding: 20px 16px 12px;
  box-shadow:
    0 2px 8px rgba(139, 126, 106, 0.12),
    0 1px 3px rgba(139, 126, 106, 0.08),
    inset 0 0 0 1px rgba(196, 184, 154, 0.2);

  /* 便签纸微微倾斜 */
  transform: rotate(-0.5deg);
}

/* ====== 胶带 ====== */
.tape {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%) rotate(1deg);
  width: 60px;
  height: 16px;
  background: rgba(168, 212, 230, 0.35);
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

  &::after {
    content: '';
    position: absolute;
    inset: 1px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.3) 0%,
      transparent 50%
    );
    border-radius: 1px;
  }
}

/* ====== 标题 ====== */
.note-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed var(--sand-light);
}

.note-title {
  font-family: var(--font-handwrite);
  font-size: 20px;
  color: var(--tide-deep);
  letter-spacing: 2px;
  line-height: 1.2;
}

.note-subtitle {
  font-family: var(--font-handwrite);
  font-size: 14px;
  color: var(--sand-dark);
  opacity: 0.7;
}

/* ====== 愿望行 ====== */
.note-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wish-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 2px;
  position: relative;
  transition: opacity 0.3s ease;

  /* 手写横线底纹 */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 26px;
    right: 0;
    height: 1px;
    background: repeating-linear-gradient(
      90deg,
      var(--sand-light) 0px,
      var(--sand-light) 4px,
      transparent 4px,
      transparent 8px
    );
    opacity: 0.3;
  }

  &.is-empty {
    opacity: 0.3;
  }

  &.is-done {
    opacity: 0.55;
  }

  &.is-active {
    .wish-name {
      color: var(--tide-deep);
    }
  }
}

/* ====== 复选框 ====== */
.wish-checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sand-dark);

  .is-done & {
    color: var(--sunset-warm);
  }

  .is-active & {
    color: var(--tide-mid);
  }

  .is-empty & {
    color: var(--sand-light);
  }
}

.checkbox-check {
  animation: drawCheck 0.4s ease forwards;
}

@keyframes drawCheck {
  from {
    stroke-dasharray: 30;
    stroke-dashoffset: 30;
  }
  to {
    stroke-dasharray: 30;
    stroke-dashoffset: 0;
  }
}

.checkbox-dot {
  animation: dotPulse 2s ease-in-out infinite;
}

@keyframes dotPulse {
  0%, 100% { opacity: 0.5; r: 3.5; }
  50% { opacity: 1; r: 4.5; }
}

/* ====== 愿望文字 ====== */
.wish-text {
  flex: 1;
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
}

.wish-name {
  font-family: var(--font-handwrite);
  font-size: 16px;
  color: var(--text-primary);
  line-height: 1.6;
  letter-spacing: 1px;
  position: relative;
  z-index: 1;

  .is-done & {
    color: var(--sand-dark);
  }
}

/* 手绘划线 */
.strike-line {
  position: absolute;
  left: -2px;
  right: -2px;
  top: 0;
  bottom: 0;
  width: calc(100% + 4px);
  height: 100%;
  z-index: 2;
  pointer-events: none;
}

.wish-placeholder {
  font-family: var(--font-handwrite);
  font-size: 14px;
  color: var(--sand-light);
  letter-spacing: 6px;
}

/* ====== 日期 ====== */
.wish-date {
  flex-shrink: 0;
  font-family: var(--font-handwrite);
  font-size: 12px;
  color: var(--sand-dark);
  opacity: 0.6;
}

/* ====== 底部装饰 ====== */
.note-footer {
  margin-top: 8px;
  display: flex;
  justify-content: center;
}

.footer-wave {
  width: 80%;
  height: 6px;
}
</style>
