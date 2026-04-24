<template>
  <div class="field-row" :class="{ warn }">
    <label class="field-label">
      <span class="label-text">{{ label }}</span>
      <span v-if="hint" class="label-hint">{{ hint }}</span>
    </label>
    <input
      class="field-input"
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      :placeholder="hint || '请输入...'"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string;
  label: string;
  hint?: string;
  warn?: boolean;
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

.field-input {
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
}

.field-input:focus {
  outline: none;
  border-color: rgba(200, 169, 110, 0.5);
}

.field-input::placeholder {
  color: #8a7e6a;
  opacity: 0.5;
}
</style>
