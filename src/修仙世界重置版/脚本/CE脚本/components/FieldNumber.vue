<template>
  <div class="field-row" :class="{ warn }">
    <label class="field-label">
      <span class="label-text">{{ label }}</span>
      <span v-if="hint" class="label-hint">{{ hint }}</span>
    </label>
    <div class="number-wrap">
      <button class="num-btn minus" @click="decrement" title="-1">−</button>
      <input
        class="field-input"
        type="number"
        :value="modelValue"
        @input="onInput(($event.target as HTMLInputElement).value)"
        :placeholder="hint || '0'"
      />
      <button class="num-btn plus" @click="increment" title="+1">+</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: number;
  label: string;
  hint?: string;
  warn?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

function onInput(val: string) {
  const num = Number(val);
  emit('update:modelValue', isNaN(num) ? 0 : num);
}

function increment() {
  emit('update:modelValue', props.modelValue + 1);
}

function decrement() {
  emit('update:modelValue', props.modelValue - 1);
}
</script>

<style scoped>
.field-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-row.warn {
  border-left: 2px solid rgba(224, 85, 85, 0.4);
  padding-left: 8px;
}

.field-label {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.label-text {
  font-size: 12px;
  font-weight: 700;
  color: #c8b48c;
  white-space: nowrap;
}

.warn .label-text {
  color: #e0a040;
}

.label-hint {
  font-size: 10px;
  color: #8a7e6a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.number-wrap {
  display: flex;
  align-items: center;
  gap: 0;
}

.field-input {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid rgba(200, 169, 110, 0.2);
  border-radius: 0;
  background: rgba(20, 16, 10, 0.8);
  color: #f0e6d0;
  font-size: 12px;
  font-family: inherit;
  transition: border-color 0.2s;
  text-align: center;
  box-sizing: border-box;
  -moz-appearance: textfield;
}

.field-input::-webkit-inner-spin-button,
.field-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.field-input:focus {
  outline: none;
  border-color: rgba(200, 169, 110, 0.5);
}

.field-input::placeholder {
  color: #8a7e6a;
  opacity: 0.5;
}

.num-btn {
  width: 28px;
  height: 30px;
  border: 1px solid rgba(200, 169, 110, 0.2);
  background: rgba(200, 169, 110, 0.08);
  color: #c8b48c;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  user-select: none;
}

.num-btn.minus {
  border-radius: 4px 0 0 4px;
  border-right: none;
}

.num-btn.plus {
  border-radius: 0 4px 4px 0;
  border-left: none;
}

.num-btn:hover {
  background: rgba(200, 169, 110, 0.2);
  color: #e0bf7a;
}

.num-btn:active {
  background: rgba(200, 169, 110, 0.3);
}
</style>
