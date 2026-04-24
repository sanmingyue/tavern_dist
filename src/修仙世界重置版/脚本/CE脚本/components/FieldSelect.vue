<template>
  <div class="field-row">
    <label class="field-label">
      <span class="label-text">{{ label }}</span>
      <span v-if="hint" class="label-hint">{{ hint }}</span>
    </label>
    <select
      class="field-select"
      :value="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-for="opt in options" :key="opt" :value="opt">
        {{ opt || '（空）' }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  label: string;
  options: string[];
  hint?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<style scoped>
.field-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
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

.label-hint {
  font-size: 10px;
  color: #8a7e6a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.field-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid rgba(200, 169, 110, 0.2);
  border-radius: 4px;
  background: rgba(20, 16, 10, 0.8);
  color: #f0e6d0;
  font-size: 12px;
  font-family: inherit;
  transition: border-color 0.2s;
  box-sizing: border-box;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238a7e6a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  padding-right: 24px;
}

.field-select:focus {
  outline: none;
  border-color: rgba(200, 169, 110, 0.5);
}

.field-select option {
  background: #1a1510;
  color: #f0e6d0;
}
</style>
