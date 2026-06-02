<template>
  <div
    class="fruit-timebar"
    :class="{ 'fruit-timebar--collapsed': !expanded }"
    @click="$emit('toggle')"
  >
    <!-- 日历图标 SVG -->
    <svg class="fruit-timebar__icon fruit-timebar__icon--date" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>

    <span class="fruit-timebar__date">
      {{ store.data.当前日期 }}
    </span>

    <span v-if="store.weekday" class="fruit-timebar__weekday">
      {{ store.weekday }}
    </span>

    <!-- 分隔线 -->
    <div class="fruit-timebar__divider"></div>

    <!-- 倒计时 -->
    <div class="fruit-timebar__countdown">
      <svg class="fruit-timebar__icon fruit-timebar__icon--clock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </svg>
      <span class="fruit-timebar__countdown-text">
        <template v-if="store.countdown !== null">
          距高考 <span class="fruit-timebar__countdown-num">{{ store.countdown }}</span> 天
        </template>
        <template v-else>
          {{ store.data.当前时段 }}
        </template>
      </span>
    </div>

    <!-- 展开/收起箭头 -->
    <svg
      class="fruit-timebar__arrow"
      :class="{ 'fruit-timebar__arrow--up': expanded }"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="6,9 12,15 18,9" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { useStatusStore } from '../store';

defineProps<{ expanded: boolean }>();
defineEmits<{ toggle: [] }>();

const store = useStatusStore();
</script>

<style scoped>
.fruit-timebar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
  border-radius: 8px;
}

.fruit-timebar:hover {
  background: rgba(255, 255, 255, 0.1);
}

.fruit-timebar--collapsed {
  background: rgba(255, 255, 255, 0.05);
}

.fruit-timebar__icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.fruit-timebar__icon--date {
  color: rgba(147, 197, 253, 0.9);
}

.fruit-timebar__icon--clock {
  width: 14px;
  height: 14px;
  color: rgba(249, 168, 212, 0.9);
}

.fruit-timebar__date {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.9);
}

.fruit-timebar__weekday {
  font-size: 12px;
  white-space: nowrap;
  color: rgba(255, 255, 255, 0.6);
}

.fruit-timebar__divider {
  width: 1px;
  height: 12px;
  margin: 0 4px;
  background: rgba(255, 255, 255, 0.2);
}

.fruit-timebar__countdown {
  display: flex;
  align-items: center;
  gap: 4px;
}

.fruit-timebar__countdown-text {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: rgba(251, 207, 232, 0.9);
}

.fruit-timebar__countdown-num {
  font-weight: 700;
  color: rgba(252, 231, 243, 1);
}

.fruit-timebar__arrow {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  margin-left: auto;
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.3s;
}

.fruit-timebar__arrow--up {
  transform: rotate(180deg);
}
</style>
