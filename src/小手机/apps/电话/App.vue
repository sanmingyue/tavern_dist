<template>
  <div class="phone-app">
    <!-- 号码显示 -->
    <div class="number-display">
      <span class="phone-number" :class="{ 'has-number': phoneNumber }">
        {{ phoneNumber || '电话' }}
      </span>
      <button v-if="phoneNumber" class="backspace" @click="backspace">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
          <line x1="18" y1="9" x2="12" y2="15"/>
          <line x1="12" y1="9" x2="18" y2="15"/>
        </svg>
      </button>
    </div>

    <!-- 拨号盘 -->
    <div class="dialpad">
      <button
        v-for="key in dialKeys"
        :key="key.digit"
        class="dial-key"
        @pointerdown="onKeyDown($event, key.digit)"
        @pointerup="onKeyUp"
        @pointercancel="onKeyUp"
      >
        <span class="key-digit">{{ key.digit }}</span>
        <span class="key-sub">{{ key.sub }}</span>
      </button>
    </div>

    <!-- 底部操作 -->
    <div class="bottom-actions">
      <div class="action-spacer"></div>
      <button class="call-button" @click="makeCall" :disabled="!phoneNumber">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="white" stroke="none">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      </button>
      <div class="action-spacer"></div>
    </div>

    <!-- 最近通话 -->
    <div class="recents" v-if="recentCalls.length > 0">
      <div v-for="call in recentCalls" :key="call.id" class="recent-item">
        <div class="recent-info">
          <span class="recent-name" :class="{ missed: call.type === 'missed' }">{{ call.name }}</span>
          <span class="recent-type">{{ call.type === 'missed' ? '未接' : call.type === 'incoming' ? '来电' : '去电' }}</span>
        </div>
        <span class="recent-time">{{ formatTime(call.timestamp) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';

const store = usePhoneStore();
const phoneNumber = ref('');

const dialKeys = [
  { digit: '1', sub: '' },
  { digit: '2', sub: 'ABC' },
  { digit: '3', sub: 'DEF' },
  { digit: '4', sub: 'GHI' },
  { digit: '5', sub: 'JKL' },
  { digit: '6', sub: 'MNO' },
  { digit: '7', sub: 'PQRS' },
  { digit: '8', sub: 'TUV' },
  { digit: '9', sub: 'WXYZ' },
  { digit: '✱', sub: '' },
  { digit: '0', sub: '+' },
  { digit: '#', sub: '' },
];

interface CallRecord {
  id: string;
  name: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
}

const recentCalls = ref<CallRecord[]>([]);

function onKeyDown(e: PointerEvent, digit: string) {
  const target = e.currentTarget as HTMLElement;
  target.style.background = 'var(--bg-active)';
  phoneNumber.value += digit === '✱' ? '*' : digit;
}

function onKeyUp(e: PointerEvent) {
  const target = e.currentTarget as HTMLElement;
  target.style.background = '';
}

function backspace() {
  phoneNumber.value = phoneNumber.value.slice(0, -1);
}

function makeCall() {
  if (!phoneNumber.value) return;
  store.reportAction({
    appId: 'phone',
    appName: '电话',
    action: '拨打电话',
    summary: `用户在电话 APP 拨打了号码 ${phoneNumber.value}`,
    data: { number: phoneNumber.value },
  });
  toastr.success(`正在呼叫 ${phoneNumber.value}...`, '📞');
  recentCalls.value.unshift({
    id: `call_${Date.now()}`,
    name: phoneNumber.value,
    type: 'outgoing',
    timestamp: Date.now(),
  });
  phoneNumber.value = '';
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
</script>

<style scoped>
.phone-app {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-primary);
}

/* ─── 号码显示 ─── */
.number-display {
  display: flex; align-items: center; justify-content: center;
  padding: 20px 24px 8px;
  position: relative; min-height: 56px;
}

.phone-number {
  font-size: 32px; font-weight: 300;
  color: var(--text-primary);
  text-align: center;
  letter-spacing: 1px;
  font-variant-numeric: tabular-nums;
}

.phone-number:not(.has-number) {
  font-size: 22px; font-weight: 500;
  color: var(--text-secondary);
}

.backspace {
  position: absolute; right: 24px;
  width: 40px; height: 40px; border: none;
  background: transparent; color: var(--text-secondary);
  cursor: pointer; display: flex;
  align-items: center; justify-content: center;
}

/* ─── 拨号盘 ─── */
.dialpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px 28px;
  justify-items: center;
}

.dial-key {
  width: 72px; height: 72px;
  border: none; border-radius: 50%;
  background: var(--bg-tertiary);
  color: var(--text-primary);
  cursor: pointer;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  transition: background 0.1s;
  -webkit-tap-highlight-color: transparent;
}

.key-digit {
  font-size: 28px; font-weight: 300;
  line-height: 1;
}

.key-sub {
  font-size: 9px; font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 1.5px;
  margin-top: 2px;
  min-height: 12px;
}

/* ─── 呼叫按钮 ─── */
.bottom-actions {
  display: flex; align-items: center; justify-content: center;
  padding: 12px 0;
}

.action-spacer { flex: 1; }

.call-button {
  width: 72px; height: 72px;
  border: none; border-radius: 50%;
  background: #34c759;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  box-shadow: 0 2px 12px rgba(52,199,89,0.3);
}

.call-button:disabled { opacity: 0.4; box-shadow: none; }
.call-button:active:not(:disabled) { transform: scale(0.95); }

/* ─── 最近通话 ─── */
.recents {
  flex: 1; overflow-y: auto;
  padding: 0 16px;
  border-top: 0.5px solid var(--border-secondary);
}

.recent-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 0;
  border-bottom: 0.5px solid var(--border-secondary);
}

.recent-info { display: flex; flex-direction: column; }

.recent-name {
  font-size: 16px; color: var(--text-primary); font-weight: 400;
}
.recent-name.missed { color: var(--danger); }

.recent-type {
  font-size: 12px; color: var(--text-tertiary); margin-top: 2px;
}

.recent-time {
  font-size: 14px; color: var(--text-tertiary);
}
</style>
