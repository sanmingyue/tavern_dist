<template>
  <div class="tab-garage">
    <div v-if="store.mechCount === 0" class="empty-state">
      <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#cbd5e1" stroke-width="1.5">
        <rect x="2" y="12" width="20" height="6" rx="2" />
        <path d="M5 12l2-5h10l2 5" stroke-linecap="round" />
        <circle cx="7" cy="18" r="1.5" />
        <circle cx="17" cy="18" r="1.5" />
      </svg>
      <span>尚未拥有机娘</span>
    </div>

    <template v-else>
      <!-- 翻页头部 -->
      <div class="page-nav">
        <button class="page-btn" :disabled="store.currentMechIndex <= 0" @click="store.prevMech()">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
            <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
          </svg>
        </button>
        <span class="page-indicator">
          <span class="page-current">{{ store.currentMechIndex + 1 }}</span>
          <span class="page-sep">/</span>
          <span class="page-total">{{ store.mechCount }}</span>
        </span>
        <button class="page-btn" :disabled="store.currentMechIndex >= store.mechCount - 1" @click="store.nextMech()">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
            <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
          </svg>
        </button>
      </div>

      <!-- 机娘角色卡 -->
      <div class="card-container">
        <MechCard
          v-if="store.currentMechName && store.currentMech"
          :name="store.currentMechName"
          :mech="store.currentMech"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useStatusStore } from '../store';
import MechCard from './MechCard.vue';

const store = useStatusStore();
</script>

<style scoped>
.tab-garage {
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

/* 翻页 */
.page-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 12px;
}

.page-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #eef2ff;
  border-color: #6366f1;
}

.page-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-indicator {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.page-current {
  font-size: 20px;
  font-weight: 900;
  color: #6366f1;
  font-family: 'Rajdhani', monospace;
}

.page-sep {
  font-size: 14px;
  color: #d1d5db;
}

.page-total {
  font-size: 14px;
  font-weight: 600;
  color: #94a3b8;
  font-family: 'Rajdhani', monospace;
}

.card-container {
  animation: fadeSlide 0.25s ease;
}

@keyframes fadeSlide {
  from {
    opacity: 0;
    transform: translateX(10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
</style>
