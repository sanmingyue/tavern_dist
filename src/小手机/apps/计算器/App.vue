<template>
  <div class="calc-page">
    <!-- 显示屏 -->
    <div class="calc-display">
      <span class="display-expr">{{ expression }}</span>
      <span class="display-result">{{ displayResult }}</span>
      <div v-if="history.length > 0" class="calc-history">
        <button v-for="item in history.slice(0, 3)" :key="item.id" @click="result = item.result">
          {{ item.expr }} = {{ item.result }}
        </button>
      </div>
    </div>

    <div class="scientific-row">
      <button v-for="key in sciKeys" :key="key.label" @click="key.action()">{{ key.label }}</button>
    </div>

    <!-- 按键区 -->
    <div class="calc-keypad">
      <button v-for="key in keys" :key="key.label"
        class="calc-key"
        :class="[key.type, { wide: key.label === '0' }]"
        @click="key.action()"
        @pointerdown="activeKey = key.label"
        @pointerup="activeKey = ''"
        @pointercancel="activeKey = ''"
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
const hasCalculated = ref(false);
const history = ref<{ id: string; expr: string; result: string }[]>([]);

const displayResult = computed(() => {
  const val = result.value || '0';
  if (val.length > 9) return val.slice(0, 9);
  return val;
});

interface KeyItem {
  label: string;
  type: string;
  action: () => void;
}

function inputDigit(digit: string) {
  if (hasCalculated.value) {
    result.value = digit;
    hasCalculated.value = false;
    return;
  }
  if (result.value === '0' && digit !== '.') {
    result.value = digit;
  } else if (digit === '.' && result.value.includes('.')) {
    return;
  } else {
    result.value += digit;
  }
}

function inputOperator(op: string) {
  if (expression.value && !result.value) {
    // 替换运算符
    expression.value = expression.value.slice(0, -2) + op + ' ';
    return;
  }
  expression.value = (result.value || '0') + ' ' + op + ' ';
  result.value = '';
  hasCalculated.value = false;
}

function calculate() {
  if (!expression.value || !result.value) return;
  try {
    const expr = expression.value + result.value;
    const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');
    const res = Function(`"use strict"; return (${sanitized})`)();
    const formatted = Number.isFinite(res) ? parseFloat(res.toFixed(8)).toString() : 'Error';
    history.value.unshift({ id: `h_${Date.now()}`, expr, result: formatted });
    history.value = history.value.slice(0, 20);
    expression.value = '';
    result.value = formatted;
    hasCalculated.value = true;
  } catch {
    result.value = 'Error';
    expression.value = '';
    hasCalculated.value = true;
  }
}

function applyScientific(fn: 'sin' | 'cos' | 'tan' | 'sqrt' | 'log' | 'square') {
  const value = Number(result.value || '0');
  let next = value;
  if (fn === 'sin') next = Math.sin(value);
  if (fn === 'cos') next = Math.cos(value);
  if (fn === 'tan') next = Math.tan(value);
  if (fn === 'sqrt') next = Math.sqrt(value);
  if (fn === 'log') next = Math.log10(value);
  if (fn === 'square') next = value * value;
  const formatted = Number.isFinite(next) ? parseFloat(next.toFixed(8)).toString() : 'Error';
  history.value.unshift({ id: `h_${Date.now()}`, expr: `${fn}(${value})`, result: formatted });
  result.value = formatted;
  expression.value = '';
  hasCalculated.value = true;
}

function clear() {
  expression.value = '';
  result.value = '';
  hasCalculated.value = false;
}

function toggleSign() {
  if (!result.value || result.value === '0') return;
  result.value = result.value.startsWith('-') ? result.value.slice(1) : '-' + result.value;
}

function percent() {
  if (!result.value) return;
  result.value = String(parseFloat(result.value) / 100);
}

const keys: KeyItem[] = [
  { label: 'AC', type: 'func', action: clear },
  { label: '±', type: 'func', action: toggleSign },
  { label: '%', type: 'func', action: percent },
  { label: '÷', type: 'op', action: () => inputOperator('÷') },
  { label: '7', type: 'num', action: () => inputDigit('7') },
  { label: '8', type: 'num', action: () => inputDigit('8') },
  { label: '9', type: 'num', action: () => inputDigit('9') },
  { label: '×', type: 'op', action: () => inputOperator('×') },
  { label: '4', type: 'num', action: () => inputDigit('4') },
  { label: '5', type: 'num', action: () => inputDigit('5') },
  { label: '6', type: 'num', action: () => inputDigit('6') },
  { label: '−', type: 'op', action: () => inputOperator('-') },
  { label: '1', type: 'num', action: () => inputDigit('1') },
  { label: '2', type: 'num', action: () => inputDigit('2') },
  { label: '3', type: 'num', action: () => inputDigit('3') },
  { label: '+', type: 'op', action: () => inputOperator('+') },
  { label: '0', type: 'num', action: () => inputDigit('0') },
  { label: '.', type: 'num', action: () => inputDigit('.') },
  { label: '=', type: 'op', action: calculate },
];

const sciKeys: KeyItem[] = [
  { label: 'sin', type: 'func', action: () => applyScientific('sin') },
  { label: 'cos', type: 'func', action: () => applyScientific('cos') },
  { label: 'tan', type: 'func', action: () => applyScientific('tan') },
  { label: '√', type: 'func', action: () => applyScientific('sqrt') },
  { label: 'x²', type: 'func', action: () => applyScientific('square') },
  { label: 'log', type: 'func', action: () => applyScientific('log') },
];
</script>

<style scoped>
.calc-page {
  height: 100%; display: flex; flex-direction: column;
  background: #000;
}

/* ─── 显示屏 ─── */
.calc-display {
  flex: 1; display: flex; flex-direction: column;
  justify-content: flex-end; align-items: flex-end;
  padding: 16px 24px 12px; min-height: 100px;
}

.display-expr {
  font-size: 16px; color: rgba(255,255,255,0.4);
  font-variant-numeric: tabular-nums;
  margin-bottom: 4px; min-height: 20px;
}

.display-result {
  font-size: 56px; font-weight: 300; color: #fff;
  line-height: 1; font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
}
.calc-history {
  width: 100%; display: flex; flex-direction: column; gap: 4px; margin-top: 10px;
}
.calc-history button {
  border: none; background: transparent; color: rgba(255,255,255,0.45);
  text-align: right; font-size: 12px; cursor: pointer;
}

.scientific-row {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px;
  padding: 0 14px 8px;
}
.scientific-row button {
  border: none; border-radius: 14px; padding: 8px 0;
  background: #222; color: #fff; font-size: 13px; cursor: pointer;
}

/* ─── 按键区 ─── */
.calc-keypad {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  padding: 10px 14px 20px;
}

.calc-key {
  aspect-ratio: 1; border: none; border-radius: 50%;
  font-size: 26px; font-weight: 400; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity 0.1s;
  -webkit-tap-highlight-color: transparent;
}

.calc-key:active { opacity: 0.7; }

/* 数字键：深灰 */
.calc-key.num {
  background: #333; color: #fff;
}

/* 功能键：浅灰 */
.calc-key.func {
  background: #a5a5a5; color: #000;
  font-size: 22px;
}

/* 运算键：橙色 */
.calc-key.op {
  background: #ff9f0a; color: #fff;
  font-size: 30px; font-weight: 500;
}

/* 0 键占两格 */
.calc-key.wide {
  grid-column: span 2;
  border-radius: 40px;
  aspect-ratio: auto;
  justify-content: flex-start;
  padding-left: 28px;
}
</style>
