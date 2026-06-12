<template>
  <div class="phone-page">
    <!-- 拨号盘 -->
    <div class="dialer-display">
      <input
        type="text"
        v-model="phoneNumber"
        class="dialer-input"
        placeholder="输入号码"
        readonly
      />
      <button v-if="phoneNumber" class="backspace-btn" @click="backspace">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
          <line x1="18" y1="9" x2="12" y2="15"/>
          <line x1="12" y1="9" x2="18" y2="15"/>
        </svg>
      </button>
    </div>

    <div class="dialpad">
      <button v-for="(key, index) in dialpadKeys" :key="index"
        class="dialpad-key"
        :class="{ 'wide': key.label === '0' }"
        @click="onKeyPress(key)"
      >
        <span class="key-digits">{{ key.label }}</span>
        <span class="key-letters">{{ key.letters }}</span>
      </button>
    </div>

    <!-- 呼叫按钮 -->
    <div class="call-actions">
      <button class="call-btn" @click="makeCall" :disabled="!phoneNumber">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      </button>
    </div>

    <!-- 通话记录 -->
    <div class="call-log" v-if="recentCalls.length > 0">
      <h3 class="section-title">最近通话</h3>
      <div v-for="(call, index) in recentCalls" :key="index" class="call-item">
        <div class="call-info">
          <span class="call-name">{{ call.name }}</span>
          <span class="call-number">{{ call.number }}</span>
        </div>
        <div class="call-meta">
          <span class="call-time">{{ call.time }}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const phoneNumber = ref('');

const dialpadKeys = [
  { label: '1', letters: '', action: () => inputDigit('1') },
  { label: '2', letters: 'ABC', action: () => inputDigit('2') },
  { label: '3', letters: 'DEF', action: () => inputDigit('3') },
  { label: '4', letters: 'GHI', action: () => inputDigit('4') },
  { label: '5', letters: 'JKL', action: () => inputDigit('5') },
  { label: '6', letters: 'MNO', action: () => inputDigit('6') },
  { label: '7', letters: 'PQRS', action: () => inputDigit('7') },
  { label: '8', letters: 'TUV', action: () => inputDigit('8') },
  { label: '9', letters: 'WXYZ', action: () => inputDigit('9') },
  { label: '*', letters: '', action: () => inputDigit('*') },
  { label: '0', letters: '+', action: () => inputDigit('0') },
  { label: '#', letters: '', action: () => inputDigit('#') },
];

const recentCalls = ref([
  { name: '张三', number: '138****1234', time: '今天 14:30' },
  { name: '李四', number: '139****5678', time: '今天 10:15' },
]);

function inputDigit(digit: string) {
  phoneNumber.value += digit;
}

function backspace() {
  phoneNumber.value = phoneNumber.value.slice(0, -1);
}

function onKeyPress(key: typeof dialpadKeys[0]) {
  key.action();
}

function makeCall() {
  if (phoneNumber.value) {
    toastr.success(`正在拨打 ${phoneNumber.value}...`);
  }
}
</script>

<style scoped>
.phone-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #0b0e14);
}

.dialer-display {
  display: flex;
  align-items: center;
  padding: 24px 32px 16px;
}

.dialer-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  font-size: 28px;
  font-weight: 300;
  text-align: center;
  outline: none;
}

.dialer-input::placeholder {
  color: var(--text-tertiary, rgba(255, 255, 255, 0.35));
}

.backspace-btn {
  width: 44px;
  height: 44px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px 24px;
}

.dialpad-key {
  height: 60px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.dialpad-key:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.06));
}

.dialpad-key:active {
  background: var(--bg-active, rgba(255, 255, 255, 0.1));
}

.dialpad-key.wide {
  grid-column: span 1;
}

.key-digits {
  font-size: 24px;
  font-weight: 400;
}

.key-letters {
  font-size: 10px;
  color: var(--text-tertiary);
  letter-spacing: 1px;
  margin-top: 2px;
}

.call-actions {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.call-btn {
  width: 64px;
  height: 64px;
  border: none;
  border-radius: 50%;
  background: var(--accent, #579bf0);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.call-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.call-btn:hover:not(:disabled) {
  transform: scale(1.05);
}

.call-log {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}

.call-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary);
  border-radius: 12px;
  margin-bottom: 8px;
}

.call-info {
  display: flex;
  flex-direction: column;
}

.call-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.call-number {
  font-size: 13px;
  color: var(--text-tertiary);
}

.call-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent);
}

.call-time {
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>
