<template>
  <div class="calculator-page">
    <div class="display">
      <span class="display-expression">{{ expression }}</span>
      <span class="display-result">{{ result || '0' }}</span>
    </div>
    <div class="keypad">
      <button v-for="key in keys" :key="key.label"
        class="key"
        :class="[key.type, { 'is-active': activeKey === key.label }]"
        @click="onKeyClick(key)"
        @mousedown="activeKey = key.label"
        @mouseup="activeKey = ''"
        @mouseleave="activeKey = ''"
      >
        {{ key.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });

const expression = ref('');
const result = ref('');
const activeKey = ref('');

interface KeyItem {
  label: string;
  type: string;
  action: () => void;
}

function inputDigit(digit: string) {
  if (result.value === '0' && digit !== '.') {
    result.value = digit;
  } else {
    result.value += digit;
  }
}

function inputOperator(op: string) {
  expression.value = result.value + ' ' + op;
  result.value = '';
}

function calculate() {
  try {
    const expr = expression.value + ' ' + result.value;
    const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
    result.value = String(eval(sanitized));
    expression.value = '';
  } catch {
    result.value = 'Error';
  }
}

function clear() {
  expression.value = '';
  result.value = '';
}

function backspace() {
  result.value = result.value.slice(0, -1) || '';
}

const keys: KeyItem[] = [
  { label: 'AC', type: 'function', action: clear },
  { label: '±', type: 'function', action: () => { result.value = result.value.startsWith('-') ? result.value.slice(1) : '-' + result.value; } },
  { label: '%', type: 'function', action: () => { result.value = String(parseFloat(result.value || '0') / 100); } },
  { label: '÷', type: 'operator', action: () => inputOperator('÷') },
  { label: '7', type: 'digit', action: () => inputDigit('7') },
  { label: '8', type: 'digit', action: () => inputDigit('8') },
  { label: '9', type: 'digit', action: () => inputDigit('9') },
  { label: '×', type: 'operator', action: () => inputOperator('×') },
  { label: '4', type: 'digit', action: () => inputDigit('4') },
  { label: '5', type: 'digit', action: () => inputDigit('5') },
  { label: '6', type: 'digit', action: () => inputDigit('6') },
  { label: '-', type: 'operator', action: () => inputOperator('-') },
  { label: '1', type: 'digit', action: () => inputDigit('1') },
  { label: '2', type: 'digit', action: () => inputDigit('2') },
  { label: '3', type: 'digit', action: () => inputDigit('3') },
  { label: '+', type: 'operator', action: () => inputOperator('+') },
  { label: '0', type: 'digit', action: () => inputDigit('0') },
  { label: '.', type: 'digit', action: () => inputDigit('.') },
  { label: '⌫', type: 'function', action: backspace },
  { label: '=', type: 'equals', action: calculate },
];

function onKeyClick(key: KeyItem) {
  key.action();
}
</script>

<style scoped>
.calculator-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary, #0b0e14);
}

.display {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-end;
  padding: 20px 24px;
  min-height: 120px;
}

.display-expression {
  font-size: 16px;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
  margin-bottom: 4px;
}

.display-result {
  font-size: 48px;
  font-weight: 300;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  line-height: 1;
}

.keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1px;
  background: var(--bg-secondary, #111318);
  padding: 1px;
}

.key {
  height: 60px;
  border: none;
  background: var(--bg-primary, #0b0e14);
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  font-size: 22px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.1s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.key:active,
.key.is-active {
  opacity: 0.7;
}

.key.function {
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.06));
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
}

.key.operator {
  background: var(--accent, #579bf0);
  color: white;
}

.key.equals {
  background: var(--accent, #579bf0);
  color: white;
}

.key.digit:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.08));
}
</style>
