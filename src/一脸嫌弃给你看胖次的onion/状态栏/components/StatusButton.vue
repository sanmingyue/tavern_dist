<template>
  <div class="onion-status-btn" @click="$emit('toggle')">
    <div class="onion-btn-left">
      <svg class="onion-btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2C8 2 4 6 4 12c0 4 2 7 4 8.5C9.5 21.5 11 22 12 22s2.5-.5 4-1.5c2-1.5 4-4.5 4-8.5 0-6-4-10-8-10z"/>
        <path d="M12 2c-1 2-2 4-2 6s1 4 2 6c1-2 2-4 2-6s-1-4-2-6z" opacity="0.5"/>
      </svg>
      <span class="onion-btn-label">Onion</span>
    </div>
    <div class="onion-btn-right">
      <span class="onion-btn-scene">{{ store.data.当前场景 }}</span>
      <svg class="onion-btn-arrow" :class="{ expanded }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatusStore } from '../store';

defineProps<{ expanded: boolean }>();
defineEmits<{ toggle: [] }>();

const store = useStatusStore();
</script>

<style scoped>
.onion-status-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;
}

.onion-status-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.onion-btn-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.onion-btn-icon {
  color: rgba(255, 150, 0, 0.8);
  flex-shrink: 0;
}

.onion-btn-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.onion-btn-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.onion-btn-scene {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.onion-btn-arrow {
  color: rgba(255, 255, 255, 0.4);
  transition: transform 0.3s;
}

.onion-btn-arrow.expanded {
  transform: rotate(180deg);
}
</style>
