<template>
  <div class="clock-page">
    <!-- 顶部 Tab 切换 -->
    <div class="clock-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="clock-tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 时钟视图 -->
    <div v-if="activeTab === 'world'" class="clock-content">
      <div class="analog-clock">
        <svg viewBox="0 0 100 100" class="clock-svg">
          <circle cx="50" cy="50" r="48" fill="none" stroke="var(--border-primary)" stroke-width="1"/>
          <circle cx="50" cy="50" r="3" fill="var(--text-primary)"/>
          <line x1="50" y1="50" x2="50" y2="20" class="hour-hand"/>
          <line x1="50" y1="50" x2="70" y2="50" class="minute-hand"/>
        </svg>
      </div>
      <div class="digital-time">{{ currentTime }}</div>
      <div class="current-date">{{ currentDate }}</div>
    </div>

    <!-- 闹钟视图 -->
    <div v-else-if="activeTab === 'alarm'" class="alarm-content">
      <div class="alarm-list" v-if="alarms.length > 0">
        <div v-for="(alarm, index) in alarms" :key="index" class="alarm-item">
          <div class="alarm-time">{{ alarm.time }}</div>
          <div class="alarm-info">
            <span class="alarm-label">{{ alarm.label || '闹钟' }}</span>
            <span class="alarm-repeat">{{ alarm.repeat || '仅一次' }}</span>
          </div>
          <label class="alarm-toggle">
            <input type="checkbox" v-model="alarm.enabled" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
      <div v-else class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="13" r="8"/>
          <path d="M12 9v4l2 2"/>
          <path d="M5 3L2 6"/>
          <path d="M22 6l-3-3"/>
          <path d="M6 19l-2 2"/>
          <path d="M18 19l2 2"/>
        </svg>
        <p>暂无闹钟</p>
      </div>
      <button class="add-alarm-btn" @click="addAlarm">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        添加闹钟
      </button>
    </div>

    <!-- 秒表视图 -->
    <div v-else-if="activeTab === 'stopwatch'" class="stopwatch-content">
      <div class="stopwatch-display">
        <span class="stopwatch-time">{{ formatStopwatch(stopwatchTime) }}</span>
        <span class="stopwatch-ms">{{ formatMs(stopwatchMs) }}</span>
      </div>
      <div class="stopwatch-controls">
        <button class="ctrl-btn" :class="{ 'lap': stopwatchRunning }" @click="onLapOrReset">
          {{ stopwatchRunning ? '计次' : '重置' }}
        </button>
        <button class="ctrl-btn primary" @click="onStartStop">
          {{ stopwatchRunning ? '停止' : '开始' }}
        </button>
      </div>
      <div class="laps-list" v-if="laps.length > 0">
        <div v-for="(lap, index) in laps" :key="index" class="lap-item">
          <span class="lap-num">计次 {{ lap.num }}</span>
          <span class="lap-time">{{ formatLapTime(lap.time) }}</span>
        </div>
      </div>
    </div>

    <!-- 计时器视图 -->
    <div v-else-if="activeTab === 'timer'" class="timer-content">
      <div class="timer-display">
        <div class="timer-ring">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--border-primary)" stroke-width="4"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--accent)" stroke-width="4"
              :stroke-dasharray="283"
              :stroke-dashoffset="283 * (1 - timerProgress)"
              transform="rotate(-90 50 50)"/>
          </svg>
          <div class="timer-text">
            <span class="timer-value">{{ formatTimer(timerSeconds) }}</span>
          </div>
        </div>
      </div>
      <div class="timer-controls">
        <button class="timer-btn" @click="resetTimer">重置</button>
        <button class="timer-btn primary" @click="onTimerToggle">
          {{ timerRunning ? '暂停' : '开始' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const tabs = [
  { id: 'world', label: '世界时钟' },
  { id: 'alarm', label: '闹钟' },
  { id: 'stopwatch', label: '秒表' },
  { id: 'timer', label: '计时器' },
];

const activeTab = ref('world');

// 时钟
const currentTime = ref('');
const currentDate = ref('');

function updateClock() {
  const now = new Date();
  currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${['日', '一', '二', '三', '四', '五', '六'][now.getDay()]}`;
}

let clockInterval: ReturnType<typeof setInterval>;
onMounted(() => {
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
});

onUnmounted(() => {
  clearInterval(clockInterval);
  clearInterval(stopwatchInterval);
  clearInterval(timerInterval);
});

// 闹钟
interface Alarm {
  time: string;
  label: string;
  repeat: string;
  enabled: boolean;
}

const alarms = ref<Alarm[]>([]);

function addAlarm() {
  const now = new Date();
  alarms.value.push({
    time: `${String(now.getHours()).padStart(2, '0')}:${String((now.getMinutes() + 5) % 60).padStart(2, '0')}`,
    label: '',
    repeat: '仅一次',
    enabled: true,
  });
}

// 秒表
interface Lap {
  num: number;
  time: number;
}

const stopwatchRunning = ref(false);
const stopwatchTime = ref(0);
const stopwatchMs = ref(0);
const laps = ref<Lap[]>([]);
let stopwatchInterval: ReturnType<typeof setInterval>;
let stopwatchStart = 0;

function onStartStop() {
  if (stopwatchRunning.value) {
    clearInterval(stopwatchInterval);
    stopwatchRunning.value = false;
  } else {
    stopwatchStart = Date.now() - stopwatchTime.value;
    stopwatchInterval = setInterval(() => {
      const elapsed = Date.now() - stopwatchStart;
      stopwatchTime.value = Math.floor(elapsed / 1000);
      stopwatchMs.value = elapsed % 1000;
    }, 33);
    stopwatchRunning.value = true;
  }
}

function onLapOrReset() {
  if (stopwatchRunning.value) {
    laps.value.unshift({ num: laps.value.length + 1, time: stopwatchTime.value });
  } else {
    stopwatchTime.value = 0;
    stopwatchMs.value = 0;
    laps.value = [];
  }
}

function formatStopwatch(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatMs(ms: number): string {
  return `.${String(Math.floor(ms / 10)).padStart(2, '0')}`;
}

function formatLapTime(s: number): string {
  return formatStopwatch(s);
}

// 计时器
const timerSeconds = ref(0);
const timerRunning = ref(false);
const timerProgress = ref(0);
let timerInterval: ReturnType<typeof setInterval>;
let timerTarget = 60;

function onTimerToggle() {
  if (timerRunning.value) {
    clearInterval(timerInterval);
    timerRunning.value = false;
  } else {
    timerTarget = timerSeconds.value || 60;
    timerInterval = setInterval(() => {
      timerSeconds.value++;
      timerProgress.value = Math.min(timerSeconds.value / timerTarget, 1);
      if (timerSeconds.value >= timerTarget) {
        clearInterval(timerInterval);
        timerRunning.value = false;
        toastr.success('计时结束！');
      }
    }, 1000);
    timerRunning.value = true;
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  timerSeconds.value = 0;
  timerProgress.value = 0;
  timerRunning.value = false;
}

function formatTimer(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
</script>

<style scoped>
.clock-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #0b0e14);
}

.clock-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--bg-primary, #0b0e14);
  overflow-x: auto;
}

.clock-tab {
  flex-shrink: 0;
  padding: 8px 16px;
  border: none;
  border-radius: 16px;
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.06));
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.clock-tab.active {
  background: var(--accent, #579bf0);
  color: white;
}

.clock-content,
.alarm-content,
.stopwatch-content,
.timer-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* 世界时钟 */
.analog-clock {
  width: 200px;
  height: 200px;
}

.clock-svg {
  width: 100%;
  height: 100%;
}

.hour-hand {
  stroke: var(--text-primary);
  stroke-width: 2;
  stroke-linecap: round;
}

.minute-hand {
  stroke: var(--accent);
  stroke-width: 1.5;
  stroke-linecap: round;
}

.digital-time {
  font-size: 48px;
  font-weight: 200;
  color: var(--text-primary);
  margin-top: 16px;
}

.current-date {
  font-size: 14px;
  color: var(--text-tertiary);
  margin-top: 8px;
}

/* 闹钟 */
.alarm-list {
  width: 100%;
  max-width: 340px;
}

.alarm-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  margin-bottom: 8px;
}

.alarm-time {
  font-size: 32px;
  font-weight: 300;
  color: var(--text-primary);
  margin-right: 16px;
}

.alarm-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.alarm-label {
  font-size: 14px;
  color: var(--text-primary);
}

.alarm-repeat {
  font-size: 12px;
  color: var(--text-tertiary);
}

.alarm-toggle {
  position: relative;
  width: 48px;
  height: 28px;
  cursor: pointer;
}

.alarm-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--bg-tertiary);
  border-radius: 14px;
  transition: 0.3s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 24px;
  height: 24px;
  left: 2px;
  bottom: 2px;
  background: white;
  border-radius: 50%;
  transition: 0.3s;
}

.alarm-toggle input:checked + .toggle-slider {
  background: var(--accent);
}

.alarm-toggle input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--text-muted);
  gap: 12px;
}

.add-alarm-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 24px;
  padding: 12px 24px;
  border: none;
  border-radius: 24px;
  background: var(--accent);
  color: white;
  font-size: 14px;
  cursor: pointer;
}

/* 秒表 */
.stopwatch-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stopwatch-time {
  font-size: 48px;
  font-weight: 300;
  color: var(--text-primary);
}

.stopwatch-ms {
  font-size: 24px;
  font-weight: 300;
  color: var(--text-tertiary);
}

.stopwatch-controls {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

.ctrl-btn {
  width: 80px;
  height: 80px;
  border: none;
  border-radius: 50%;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.ctrl-btn.primary {
  background: var(--accent);
  color: white;
}

.ctrl-btn:active {
  transform: scale(0.95);
}

.laps-list {
  width: 100%;
  max-width: 340px;
  margin-top: 24px;
  max-height: 200px;
  overflow-y: auto;
}

.lap-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-secondary);
  color: var(--text-secondary);
  font-size: 14px;
}

/* 计时器 */
.timer-ring {
  position: relative;
  width: 240px;
  height: 240px;
}

.timer-ring svg {
  width: 100%;
  height: 100%;
}

.timer-ring circle:last-child {
  transition: stroke-dashoffset 1s linear;
}

.timer-text {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timer-value {
  font-size: 40px;
  font-weight: 300;
  color: var(--text-primary);
}

.timer-controls {
  display: flex;
  gap: 16px;
  margin-top: 32px;
}

.timer-btn {
  padding: 12px 32px;
  border: none;
  border-radius: 24px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
}

.timer-btn.primary {
  background: var(--accent);
  color: white;
}
</style>
