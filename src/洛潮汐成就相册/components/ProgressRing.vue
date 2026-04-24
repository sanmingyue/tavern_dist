<template>
  <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" class="progress-ring">
    <!-- 背景圈 -->
    <circle
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke="trackColor"
      :stroke-width="strokeWidth"
    />
    <!-- 进度圈 -->
    <circle
      :cx="center"
      :cy="center"
      :r="radius"
      fill="none"
      :stroke="progressColor"
      :stroke-width="strokeWidth"
      stroke-linecap="round"
      :stroke-dasharray="circumference"
      :stroke-dashoffset="dashOffset"
      :style="{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease' }"
      transform-origin="center"
      :transform="`rotate(-90 ${center} ${center})`"
    />
    <!-- 中间文字 -->
    <text
      :x="center"
      :y="center - 4"
      text-anchor="middle"
      dominant-baseline="central"
      :fill="textColor"
      :font-size="fontSize"
      font-weight="600"
      font-family="'Segoe UI', system-ui, sans-serif"
    >
      {{ unlocked }}
    </text>
    <text
      :x="center"
      :y="center + 10"
      text-anchor="middle"
      dominant-baseline="central"
      :fill="subTextColor"
      :font-size="subFontSize"
      font-family="'Segoe UI', system-ui, sans-serif"
    >
      / {{ total }}
    </text>
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: number;
  strokeWidth?: number;
  percent: number;
  unlocked: number;
  total: number;
}>(), {
  size: 52,
  strokeWidth: 3,
});

const center = computed(() => props.size / 2);
const radius = computed(() => (props.size - props.strokeWidth * 2) / 2);
const circumference = computed(() => 2 * Math.PI * radius.value);
const dashOffset = computed(() => circumference.value * (1 - props.percent / 100));

const trackColor = 'rgba(255, 255, 255, 0.12)';
const subTextColor = 'rgba(255, 255, 255, 0.45)';
const textColor = 'rgba(255, 255, 255, 0.9)';
const fontSize = computed(() => props.size > 48 ? 13 : 10);
const subFontSize = computed(() => props.size > 48 ? 9 : 7);

const progressColor = computed(() => {
  const p = props.percent;
  if (p >= 100) return '#e8c56d';
  if (p >= 75) return '#c4a35a';
  if (p >= 50) return '#7eb8c9';
  if (p >= 25) return '#5a9bb5';
  return '#4a7d91';
});
</script>

<style scoped>
.progress-ring {
  display: block;
}
</style>
