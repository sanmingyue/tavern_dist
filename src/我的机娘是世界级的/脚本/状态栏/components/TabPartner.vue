<template>
  <div class="tab-partner">
    <div v-if="store.partnerMechName && store.partnerMech" class="partner-full">
      <MechCard :name="store.partnerMechName" :mech="store.partnerMech" />
    </div>
    <div v-else class="empty-state">
      <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#cbd5e1" stroke-width="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span>未指定搭档机娘</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useStatusStore } from '../store';
import MechCard from './MechCard.vue';
const store = useStatusStore();
</script>

<style scoped>
.tab-partner {
  padding: 12px;
  overflow-y: auto;
  height: 100%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 40px 20px;
  color: #cbd5e1;
  font-size: 13px;
}
</style>
