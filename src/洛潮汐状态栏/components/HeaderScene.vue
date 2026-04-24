<template>
  <div class="scene-header">
    <!-- 左侧：日期竖排 -->
    <div class="date-block">
      <span class="date-label">{{ dateDisplay }}</span>
      <span class="date-weekday">{{ timeDisplay }}</span>
    </div>

    <!-- 中间：分隔线 + 潮汐波纹 -->
    <div class="divider-wave">
      <svg viewBox="0 0 80 24" class="wave-svg" preserveAspectRatio="none">
        <path d="M0 12 Q10 4 20 12 Q30 20 40 12 Q50 4 60 12 Q70 20 80 12"
              fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.3" />
      </svg>
    </div>

    <!-- 右侧：地点 + 天气 -->
    <div class="scene-info">
      <div class="location">
        <svg viewBox="0 0 16 16" width="12" height="12" class="icon-pin">
          <path d="M8 1C5.2 1 3 3.2 3 6c0 3.5 5 9 5 9s5-5.5 5-9c0-2.8-2.2-5-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z"
                fill="currentColor" opacity="0.5"/>
        </svg>
        <span>{{ store.data.世界.当前地点 }}</span>
      </div>
      <div class="weather">{{ weatherIcon }} {{ store.data.世界.天气 }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';

const store = useDataStore();

const dateDisplay = computed(() => store.data.世界.当前日期 || '8月1日');
const timeDisplay = computed(() => store.data.世界.当前时间 || '--:--');

const weatherIcon = computed(() => {
  const w = store.data.世界.天气;
  if (w.includes('晴')) return '☀';
  if (w.includes('云') || w.includes('阴')) return '☁';
  if (w.includes('雨')) return '☂';
  if (w.includes('雷')) return '⚡';
  if (w.includes('风')) return '🌊';
  if (w.includes('雪')) return '❄';
  if (w.includes('雾')) return '🌫';
  return '◯';
});
</script>

<style lang="scss" scoped>
.scene-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}

.date-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}

.date-label {
  font-family: var(--font-serif);
  font-size: 15px;
  font-weight: 500;
  color: var(--tide-deep);
  letter-spacing: 1px;
}

.date-weekday {
  font-size: 11px;
  color: var(--text-tertiary);
  font-family: var(--font-main);
  font-weight: 300;
}

.divider-wave {
  flex: 1;
  min-width: 40px;
  display: flex;
  align-items: center;
}

.wave-svg {
  width: 100%;
  height: 16px;
  color: var(--tide-light);
}

.scene-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.location {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: var(--text-secondary);
}

.icon-pin {
  color: var(--tide-mid);
}

.weather {
  font-size: 11px;
  color: var(--text-tertiary);
  letter-spacing: 0.5px;
}
</style>
