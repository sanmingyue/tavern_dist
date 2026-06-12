<template>
  <div class="clock-page">
    <!-- 内容区 -->
    <div class="clock-body">
      <!-- 世界时钟 -->
      <template v-if="activeTab === 'world'">
        <div class="clock-nav">
          <button class="nav-link" @click="store.goBack()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #ff9500)" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 class="nav-title">世界时钟</h1>
          <button class="nav-link add-btn">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #ff9500)" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <div class="world-content">
          <div class="digital-time-large">{{ currentTime }}</div>
          <div class="current-date-text">{{ currentDate }}</div>
          <div class="city-list">
            <div v-for="city in cities" :key="city.name" class="city-cell">
              <div class="city-info">
                <span class="city-diff">{{ city.diff }}</span>
                <span class="city-name">{{ city.name }}</span>
              </div>
              <span class="city-time">{{ city.time }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 闹钟 -->
      <template v-else-if="activeTab === 'alarm'">
        <div class="clock-nav">
          <button class="nav-link" @click="editing = !editing">{{ editing ? '完成' : '编辑' }}</button>
          <h1 class="nav-title">闹钟</h1>
          <button class="nav-link add-btn" @click="addAlarm">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #ff9500)" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
        <div class="alarm-content">
          <div v-if="alarms.length === 0" class="empty-state">
            <p>没有闹钟</p>
          </div>
          <div v-for="(alarm, index) in alarms" :key="index" class="alarm-cell">
            <div class="alarm-main">
              <span class="alarm-time-display">{{ alarm.time }}</span>
              <span class="alarm-label-text">{{ alarm.label || '闹钟' }}，{{ alarm.repeat }}</span>
            </div>
            <label class="ios-toggle">
              <input type="checkbox" v-model="alarm.enabled" />
              <span class="ios-toggle-track"></span>
            </label>
          </div>
        </div>
      </template>

      <!-- 秒表 -->
      <template v-else-if="activeTab === 'stopwatch'">
        <div class="clock-nav">
          <div style="width:60px"></div>
          <h1 class="nav-title">秒表</h1>
          <div style="width:60px"></div>
        </div>
        <div class="stopwatch-content">
          <div class="sw-display">
            <span class="sw-time">{{ formatStopwatch(stopwatchTime) }}</span>
            <span class="sw-ms">{{ formatMs(stopwatchMs) }}</span>
          </div>
          <div class="sw-controls">
            <button class="sw-btn secondary" @click="onLapOrReset">
              {{ stopwatchRunning ? '计次' : '重置' }}
            </button>
            <button class="sw-btn" :class="stopwatchRunning ? 'stop' : 'start'" @click="onStartStop">
              {{ stopwatchRunning ? '停止' : '开始' }}
            </button>
          </div>
          <div class="laps" v-if="laps.length > 0">
            <div v-for="lap in laps" :key="lap.num" class="lap-row">
              <span>计次 {{ lap.num }}</span>
              <span>{{ formatStopwatch(lap.time) }}</span>
            </div>
          </div>
        </div>
      </template>

      <!-- 计时器 -->
      <template v-else>
        <div class="clock-nav">
          <button class="nav-link" @click="resetTimer">取消</button>
          <h1 class="nav-title">计时器</h1>
          <div style="width:60px"></div>
        </div>
        <div class="timer-content">
          <div class="timer-presets">
            <button @click="setTimer(60)">1分钟</button>
            <button @click="setTimer(300)">5分钟</button>
            <button @click="setTimer(900)">15分钟</button>
          </div>
          <div class="timer-ring-container">
            <svg viewBox="0 0 120 120" class="timer-svg">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border-secondary)" stroke-width="5"/>
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent, #ff9500)" stroke-width="5"
                :stroke-dasharray="327"
                :stroke-dashoffset="327 * (1 - timerProgress)"
                stroke-linecap="round"
                transform="rotate(-90 60 60)"/>
            </svg>
            <div class="timer-center">
              <span class="timer-value">{{ formatTimer(timerSeconds) }}</span>
            </div>
          </div>
          <div class="timer-controls">
            <button class="sw-btn secondary" @click="resetTimer">取消</button>
            <button class="sw-btn" :class="timerRunning ? 'stop' : 'start'" @click="onTimerToggle">
              {{ timerRunning ? '暂停' : '开始' }}
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- iOS 底部 Tab 栏 -->
    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.id" class="tab-item" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="activeTab === tab.id ? 'var(--accent, #ff9500)' : 'var(--text-tertiary)'" stroke-width="1.8" v-html="tab.icon"></svg>
        <span>{{ tab.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
const store = usePhoneStore();

const tabs = [
  { id: 'world', label: '世界时钟', icon: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>' },
  { id: 'alarm', label: '闹钟', icon: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2"/><path d="M5 3L2 6"/><path d="M22 6l-3-3"/>' },
  { id: 'stopwatch', label: '秒表', icon: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4"/><path d="M10 2h4"/><path d="M12 2v3"/>' },
  { id: 'timer', label: '计时器', icon: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 3"/><path d="M10 2h4"/>' },
];

const activeTab = ref('world');
const editing = ref(false);

// ─── 世界时钟 ───
const currentTime = ref('');
const currentDate = ref('');

const cities = ref([
  { name: '纽约', diff: '今天, -12小时', time: '' },
  { name: '伦敦', diff: '今天, -7小时', time: '' },
  { name: '东京', diff: '今天, +1小时', time: '' },
]);
const triggeredAlarms = new Set<string>();

function updateClock() {
  const now = new Date();
  currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${'日一二三四五六'[now.getDay()]}`;

  const offsets = [-12, -7, 1];
  cities.value.forEach((city, i) => {
    const cityTime = new Date(now.getTime() + offsets[i] * 3600000);
    city.time = `${String(cityTime.getHours()).padStart(2, '0')}:${String(cityTime.getMinutes()).padStart(2, '0')}`;
  });

  const hhmm = currentTime.value.slice(0, 5);
  alarms.value.forEach(alarm => {
    const key = `${new Date().toDateString()}_${alarm.time}_${alarm.label}`;
    if (alarm.enabled && alarm.time === hhmm && !triggeredAlarms.has(key)) {
      triggeredAlarms.add(key);
      toastr.info(`${alarm.label || '闹钟'} 时间到了`, '时钟');
      store.reportAction({
        appId: 'clock', appName: '时钟', action: '闹钟提醒',
        summary: `闹钟「${alarm.label || '闹钟'}」在 ${alarm.time} 提醒`,
        data: alarm,
      });
    }
  });
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

// ─── 闹钟 ───
interface Alarm { time: string; label: string; repeat: string; enabled: boolean; }
const alarms = ref<Alarm[]>([
  { time: '07:00', label: '起床', repeat: '每天', enabled: true },
  { time: '08:30', label: '出门', repeat: '工作日', enabled: false },
]);

function addAlarm() {
  const now = new Date();
  alarms.value.push({
    time: `${String(now.getHours()).padStart(2, '0')}:${String((now.getMinutes() + 5) % 60).padStart(2, '0')}`,
    label: '', repeat: '仅一次', enabled: true,
  });
}

// ─── 秒表 ───
interface Lap { num: number; time: number; }
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
    stopwatchStart = Date.now() - stopwatchTime.value * 1000 - stopwatchMs.value;
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
    stopwatchTime.value = 0; stopwatchMs.value = 0; laps.value = [];
  }
}

function formatStopwatch(s: number): string {
  const m = Math.floor(s / 60); const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
function formatMs(ms: number): string { return `.${String(Math.floor(ms / 10)).padStart(2, '0')}`; }

// ─── 计时器 ───
const timerSeconds = ref(0);
const timerRunning = ref(false);
const timerProgress = ref(0);
let timerInterval: ReturnType<typeof setInterval>;
let timerTarget = 60;
let timerElapsed = 0;

function onTimerToggle() {
  if (timerRunning.value) {
    clearInterval(timerInterval);
    timerRunning.value = false;
  } else {
    timerTarget = timerSeconds.value || 60;
    timerElapsed = 0;
    timerInterval = setInterval(() => {
      timerElapsed++;
      timerSeconds.value = Math.max(timerTarget - timerElapsed, 0);
      timerProgress.value = Math.min(timerElapsed / timerTarget, 1);
      if (timerElapsed >= timerTarget) {
        clearInterval(timerInterval); timerRunning.value = false;
        toastr.success('计时结束！');
        store.reportAction({
          appId: 'clock', appName: '时钟', action: '计时器结束',
          summary: `计时器 ${formatTimer(timerTarget)} 已结束`,
          data: { seconds: timerTarget },
        });
      }
    }, 1000);
    timerRunning.value = true;
  }
}

function setTimer(seconds: number) {
  resetTimer();
  timerTarget = seconds;
  timerSeconds.value = seconds;
}

function resetTimer() {
  clearInterval(timerInterval);
  timerSeconds.value = 0; timerProgress.value = 0; timerRunning.value = false; timerElapsed = 0;
}

function formatTimer(s: number): string {
  const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
</script>

<style scoped>
.clock-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-primary);
}

.clock-body { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

/* ─── 导航栏 ─── */
.clock-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; flex-shrink: 0; min-height: 44px;
  position: relative;
}

.nav-link {
  border: none; background: transparent; cursor: pointer;
  color: var(--accent, #ff9500); font-size: 15px;
  display: flex; align-items: center; gap: 2px;
  padding: 0; min-width: 60px;
}

.add-btn { justify-content: flex-end; }

.nav-title {
  font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 0;
  position: absolute; left: 50%; transform: translateX(-50%);
}

/* ─── 底部 Tab 栏 ─── */
.tab-bar {
  display: flex; justify-content: space-around;
  padding: 6px 0 8px; background: var(--bg-primary);
  border-top: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}

.tab-item {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  border: none; background: transparent; cursor: pointer;
  color: var(--text-tertiary); font-size: 10px;
  padding: 2px 8px;
}

.tab-item.active { color: var(--accent, #ff9500); }
.tab-item span { font-weight: 500; }

/* ─── 世界时钟 ─── */
.world-content {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; align-items: center;
}

.digital-time-large {
  font-size: 52px; font-weight: 200; color: var(--text-primary);
  font-variant-numeric: tabular-nums; margin-bottom: 4px;
}

.current-date-text {
  font-size: 14px; color: var(--text-tertiary); margin-bottom: 24px;
}

.city-list { width: 100%; }

.city-cell {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0; border-bottom: 0.5px solid var(--border-secondary);
}

.city-info { display: flex; flex-direction: column; }
.city-diff { font-size: 12px; color: var(--text-tertiary); }
.city-name { font-size: 20px; font-weight: 300; color: var(--text-primary); }
.city-time { font-size: 40px; font-weight: 200; color: var(--text-primary); font-variant-numeric: tabular-nums; }

/* ─── 闹钟 ─── */
.alarm-content { flex: 1; overflow-y: auto; padding: 0 16px; }

.alarm-cell {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 0; border-bottom: 0.5px solid var(--border-secondary);
}

.alarm-main { display: flex; flex-direction: column; }
.alarm-time-display { font-size: 48px; font-weight: 200; color: var(--text-primary); line-height: 1; }
.alarm-label-text { font-size: 13px; color: var(--text-tertiary); margin-top: 2px; }

/* iOS Toggle */
.ios-toggle { position: relative; width: 51px; height: 31px; cursor: pointer; flex-shrink: 0; }
.ios-toggle input { opacity: 0; width: 0; height: 0; }
.ios-toggle-track {
  position: absolute; inset: 0; background: var(--bg-active, #e9e9eb);
  border-radius: 16px; transition: background 0.25s;
}
.ios-toggle-track::before {
  content: ''; position: absolute; width: 27px; height: 27px; border-radius: 50%;
  background: white; top: 2px; left: 2px;
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.ios-toggle input:checked + .ios-toggle-track { background: #34c759; }
.ios-toggle input:checked + .ios-toggle-track::before { transform: translateX(20px); }

/* ─── 秒表 ─── */
.stopwatch-content {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; align-items: center;
}

.sw-display { display: flex; align-items: baseline; gap: 2px; margin: 32px 0; }
.sw-time { font-size: 56px; font-weight: 200; color: var(--text-primary); font-variant-numeric: tabular-nums; }
.sw-ms { font-size: 28px; font-weight: 200; color: var(--text-tertiary); }

.sw-controls { display: flex; gap: 24px; margin-bottom: 24px; }

.sw-btn {
  width: 76px; height: 76px; border-radius: 50%;
  border: 2px solid transparent; font-size: 15px; font-weight: 500;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.sw-btn.secondary { background: var(--bg-tertiary); color: var(--text-primary); }
.sw-btn.start { background: rgba(52,199,89,0.15); color: #34c759; border-color: rgba(52,199,89,0.3); }
.sw-btn.stop { background: rgba(255,59,48,0.15); color: #ff3b30; border-color: rgba(255,59,48,0.3); }

.sw-btn:active { transform: scale(0.95); }

.laps { width: 100%; }
.lap-row {
  display: flex; justify-content: space-between;
  padding: 10px 0; border-bottom: 0.5px solid var(--border-secondary);
  font-size: 15px; color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

/* ─── 计时器 ─── */
.timer-content {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; padding: 16px;
}
.timer-presets {
  display: flex; gap: 8px; margin-bottom: 18px;
}
.timer-presets button {
  border: none; border-radius: 14px; padding: 7px 12px;
  background: var(--bg-tertiary); color: var(--text-primary); cursor: pointer;
}

.timer-ring-container {
  position: relative; width: 220px; height: 220px; margin-bottom: 32px;
}

.timer-svg { width: 100%; height: 100%; }

.timer-svg circle:last-child {
  transition: stroke-dashoffset 1s linear;
}

.timer-center {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
}

.timer-value {
  font-size: 48px; font-weight: 200; color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.timer-controls { display: flex; gap: 24px; }

.empty-state {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: var(--text-muted);
}
.empty-state p { font-size: 15px; margin: 0; }
</style>
