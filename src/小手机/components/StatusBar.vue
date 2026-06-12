<template>
  <div class="statusbar">
    <!-- 左侧：时间 -->
    <div class="statusbar-left">
      <span class="statusbar-time">{{ currentTime }}</span>
    </div>

    <!-- 中间：灵动岛 -->
    <div class="dynamic-island" :class="{ 'is-expanded': isPlaying }">
      <div class="island-inner">
        <template v-if="isPlaying">
          <div class="island-music">
            <div class="music-bars">
              <span v-for="i in 4" :key="i" class="bar" :style="{ animationDelay: `${i * 0.12}s` }"></span>
            </div>
            <span class="island-text">{{ musicTitle }}</span>
          </div>
        </template>
        <template v-else>
          <div class="island-camera"></div>
        </template>
      </div>
    </div>

    <!-- 右侧：状态图标 -->
    <div class="statusbar-right">
      <!-- 信号强度 -->
      <svg class="status-icon" width="16" height="12" viewBox="0 0 16 12">
        <rect x="0" y="9" width="3" height="3" rx="0.5" fill="currentColor" opacity="1"/>
        <rect x="4" y="6" width="3" height="6" rx="0.5" fill="currentColor" opacity="1"/>
        <rect x="8" y="3" width="3" height="9" rx="0.5" fill="currentColor" opacity="1"/>
        <rect x="12" y="0" width="3" height="12" rx="0.5" fill="currentColor" opacity="1"/>
      </svg>

      <!-- WiFi -->
      <svg class="status-icon" width="15" height="12" viewBox="0 0 15 12">
        <path d="M7.5 10.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" fill="currentColor" transform="translate(0,-1)"/>
        <path d="M4.5 9a4.2 4.2 0 0 1 6 0" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" transform="translate(0,-1)"/>
        <path d="M2 6.5a7.5 7.5 0 0 1 11 0" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" transform="translate(0,-1)"/>
        <path d="M-.2 4a10.5 10.5 0 0 1 15.4 0" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round" transform="translate(0,-1)"/>
      </svg>

      <!-- 电池 -->
      <div class="battery-container">
        <div class="battery-body">
          <div class="battery-fill" :style="{ width: batteryPercent + '%' }"></div>
        </div>
        <div class="battery-cap"></div>
      </div>

      <!-- 关闭按钮（仅非全屏模式） -->
      <button class="close-btn" @click.stop="$emit('close')" title="关闭">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isDark?: boolean;
  isPlaying?: boolean;
  musicTitle?: string;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'toggle-theme'): void;
}>();

const currentTime = ref('');
const batteryPercent = ref(85);

function updateTime() {
  const now = new Date();
  currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

let timeInterval: ReturnType<typeof setInterval>;
onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 10000);
  // 随机电量模拟
  batteryPercent.value = _.random(60, 95);
});

onUnmounted(() => {
  clearInterval(timeInterval);
});
</script>

<style scoped>
.statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px 6px;
  background: transparent;
  user-select: none;
  flex-shrink: 0;
  min-height: 44px;
  position: relative;
  z-index: 10;
}

/* ─── 左侧时间 ─── */
.statusbar-left {
  flex: 1;
  display: flex;
  align-items: center;
}

.statusbar-time {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.3px;
  font-variant-numeric: tabular-nums;
}

/* ─── 灵动岛 ─── */
.dynamic-island {
  background: #000;
  border-radius: 20px;
  min-width: 100px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
  position: relative;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.3);
}

.dynamic-island.is-expanded {
  min-width: 140px;
  height: 32px;
  border-radius: 22px;
}

.island-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 12px;
}

.island-camera {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: radial-gradient(circle at 40% 40%, #1a1a2e, #0a0a15);
  box-shadow: 0 0 0 1.5px rgba(40, 40, 60, 0.6), inset 0 0 2px rgba(255, 255, 255, 0.05);
}

.island-music {
  display: flex;
  align-items: center;
  gap: 8px;
}

.music-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 14px;
}

.music-bars .bar {
  width: 2.5px;
  background: #30d158;
  border-radius: 1.5px;
  animation: musicBounce 0.6s ease-in-out infinite alternate;
}

.music-bars .bar:nth-child(1) { height: 40%; }
.music-bars .bar:nth-child(2) { height: 70%; }
.music-bars .bar:nth-child(3) { height: 50%; }
.music-bars .bar:nth-child(4) { height: 80%; }

@keyframes musicBounce {
  0% { transform: scaleY(0.3); }
  100% { transform: scaleY(1); }
}

.island-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
  font-weight: 500;
}

/* ─── 右侧状态 ─── */
.statusbar-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
}

.status-icon {
  color: var(--text-primary);
  opacity: 0.85;
}

/* ─── 电池 ─── */
.battery-container {
  display: flex;
  align-items: center;
  gap: 1px;
}

.battery-body {
  width: 22px;
  height: 11px;
  border-radius: 2.5px;
  border: 1.5px solid var(--text-primary);
  opacity: 0.85;
  position: relative;
  overflow: hidden;
  padding: 1.5px;
}

.battery-fill {
  height: 100%;
  border-radius: 1px;
  background: var(--text-primary);
  opacity: 0.85;
  transition: width 0.3s ease;
}

.battery-cap {
  width: 2px;
  height: 5px;
  border-radius: 0 1px 1px 0;
  background: var(--text-primary);
  opacity: 0.4;
}

/* ─── 关闭按钮 ─── */
.close-btn {
  width: 20px;
  height: 20px;
  border-radius: 10px;
  border: none;
  background: rgba(128, 128, 128, 0.3);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 4px;
  flex-shrink: 0;
}

.close-btn:hover {
  background: rgba(128, 128, 128, 0.5);
  color: var(--text-primary);
}
</style>
