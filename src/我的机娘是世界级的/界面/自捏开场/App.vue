<template>
  <div class="creation-app">
    <!-- 自捏模式进度条 -->
    <div v-if="store.creationMode === 'custom' && store.step > 0 && store.step < store.totalSteps - 1" class="progress-bar">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent }"></div>
      </div>
      <div class="progress-dots">
        <button
          v-for="(label, i) in customStepLabels"
          :key="i"
          class="dot"
          :class="{ active: store.step >= i + 1, current: store.step === i + 1 }"
          @click="store.goToStep(i + 1)"
        >
          <span class="dot-num">{{ i + 1 }}</span>
        </button>
      </div>
      <div class="step-labels">
        <span v-for="(label, i) in customStepLabels" :key="i" class="step-label" :class="{ active: store.step === i + 1 }">
          {{ label }}
        </span>
      </div>
    </div>

    <!-- 选择模式进度条 -->
    <div v-if="store.creationMode === 'preset' && store.step > 0 && store.step < store.totalSteps - 1" class="progress-bar">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPercent }"></div>
      </div>
      <div class="progress-dots">
        <button
          v-for="(label, i) in presetStepLabels"
          :key="i"
          class="dot"
          :class="{ active: store.step >= i + 1, current: store.step === i + 1 }"
          @click="store.goToStep(i + 1)"
        >
          <span class="dot-num">{{ i + 1 }}</span>
        </button>
      </div>
      <div class="step-labels">
        <span v-for="(label, i) in presetStepLabels" :key="i" class="step-label" :class="{ active: store.step === i + 1 }">
          {{ label }}
        </span>
      </div>
    </div>

    <!-- 步骤内容 -->
    <transition name="slide" mode="out-in">
      <component :is="currentComponent" :key="currentKey" />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCreationStore } from './store';
import StepWelcome from './components/StepWelcome.vue';
import StepDriver from './components/StepDriver.vue';
import StepMechBasic from './components/StepMechBasic.vue';
import StepMechPalette from './components/StepMechPalette.vue';
import StepMechStats from './components/StepMechStats.vue';
import StepConfirm from './components/StepConfirm.vue';
import StepSelectMech from './components/StepSelectMech.vue';
import StepSelectConfirm from './components/StepSelectConfirm.vue';

const store = useCreationStore();
const customStepLabels = ['车手', '机娘', '人格', '五维', '确认'];
const presetStepLabels = ['车手', '选择机娘', '确认'];

const progressPercent = computed(() => {
  return `${(store.step / (store.totalSteps - 1)) * 100}%`;
});

const currentComponent = computed(() => {
  if (store.step === 0) return StepWelcome;
  if (store.step === 1) return StepDriver;

  if (store.creationMode === 'custom') {
    switch (store.step) {
      case 2: return StepMechBasic;
      case 3: return StepMechPalette;
      case 4: return StepMechStats;
      case 5: return StepConfirm;
    }
  }

  if (store.creationMode === 'preset') {
    switch (store.step) {
      case 2: return StepSelectMech;
      case 3: return StepSelectConfirm;
    }
  }

  return StepWelcome;
});

const currentKey = computed(() => {
  return `${store.creationMode || 'init'}-${store.step}`;
});
</script>

<style scoped>
.creation-app {
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 20px 24px;
  font-family: 'Segoe UI', 'Noto Sans SC', system-ui, sans-serif;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 480px) {
  .creation-app {
    padding: 12px 12px;
    border-radius: 10px;
  }

  .progress-dots {
    padding: 0 2px;
  }

  .dot {
    width: 22px;
    height: 22px;
  }

  .dot-num {
    font-size: 10px;
  }

  .step-label {
    font-size: 9px;
    width: 32px;
  }
}

/* 进度条 */
.progress-bar {
  margin-bottom: 24px;
}

.progress-track {
  width: 100%;
  height: 4px;
  background: #e8ecf1;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6);
  border-radius: 2px;
  transition: width 0.45s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-dots {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  padding: 0 8px;
}

.dot {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px solid #d1d5db;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  padding: 0;
}

.dot.active {
  border-color: #6366f1;
  background: #6366f1;
}

.dot.current {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.dot-num {
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
}

.dot.active .dot-num {
  color: #fff;
}

.step-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  padding: 0 2px;
}

.step-label {
  font-size: 10px;
  color: #cbd5e1;
  text-align: center;
  width: 40px;
  transition: color 0.3s;
}

.step-label.active {
  color: #6366f1;
  font-weight: 600;
}

/* 页面切换动画 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.35s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>
