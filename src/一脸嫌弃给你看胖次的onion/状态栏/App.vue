<template>
  <div class="onion-status" :style="containerStyle">
    <div class="onion-panel">
      <!-- 第一层：状态按钮（始终显示） -->
      <StatusButton :expanded="expanded" @toggle="toggleExpand" />

      <!-- 第二层：展开内容 -->
      <Transition name="onion-slide">
        <div v-if="expanded" class="onion-content">
          <!-- 状态信息 -->
          <div class="onion-info">
            <div class="onion-info-row">
              <span class="onion-info-label">交易次数</span>
              <span class="onion-info-value">{{ store.data.交易次数 }}次（{{ store.tradeProgress }}）</span>
            </div>
            <div class="onion-info-row">
              <span class="onion-info-label">时间</span>
              <span class="onion-info-value">{{ store.data.星期 }} · {{ store.data.时间段 }}</span>
            </div>
            <div v-if="store.data.特殊事件 !== '无'" class="onion-info-row">
              <span class="onion-info-label">事件</span>
              <span class="onion-info-value onion-event">{{ store.data.特殊事件 }}</span>
            </div>
          </div>

          <!-- IF线面板（始终内联显示） -->
          <IfLinePanel :state="ifLineState" :result="ifLineResult" />

          <!-- 生成按钮 -->
          <IfLineGenerator :is-generating="ifLineState === 'generating'" @generate="onGenerate" />

          <!-- PC端沉浸模式按钮 -->
          <button v-if="!isMobile" class="onion-immersive-btn" @click="onEnterImmersive">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>
            沉浸模式
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue';
import StatusButton from './components/StatusButton.vue';
import IfLinePanel from './components/IfLinePanel.vue';
import IfLineGenerator from './components/IfLineGenerator.vue';
import { useStatusStore } from './store';
import { generateIfLine } from './ifline/generator';
import { enterImmersive, cleanupImmersive } from './immersive';
import type { IfLineResult, IfLineState } from './ifline/types';

const store = useStatusStore();
store.init();

const expanded = ref(false);
const ifLineState = ref<IfLineState>('idle');
const ifLineResult = ref<IfLineResult | null>(null);
const isMobile = computed(() => window.parent.innerWidth <= 768);

function toggleExpand() {
  expanded.value = !expanded.value;
}

async function onGenerate() {
  if (ifLineState.value === 'generating') return;

  ifLineState.value = 'generating';
  try {
    const result = await generateIfLine(store.data);
    ifLineResult.value = result;
    ifLineState.value = 'done';

    // PC端：生成完成后自动进入沉浸模式
    if (!isMobile.value) {
      enterImmersive(store.data, result, () => {});
    }
  } catch (e) {
    console.error('[IF线] 生成失败:', e);
    ifLineState.value = 'error';
  }
}

function onEnterImmersive() {
  enterImmersive(store.data, ifLineResult.value, () => {});
}

const containerStyle = computed(() => {
  const width = expanded.value ? '320px' : '280px';
  return { width, maxWidth: '100%', transition: 'width 0.3s ease', marginLeft: 'auto' };
});

onUnmounted(() => {
  cleanupImmersive();
});
</script>

<style scoped>
.onion-status {
  font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, -apple-system, sans-serif;
  padding: 8px 0 4px;
}

.onion-panel {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.onion-content {
  padding: 0 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.1) transparent;
}

.onion-content::-webkit-scrollbar {
  width: 3px;
}

.onion-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
}

.onion-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.onion-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.onion-info-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.onion-info-value {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
}

.onion-event {
  color: rgba(255, 180, 0, 0.9);
}

.onion-immersive-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 100%;
  padding: 8px;
  border: 1px solid rgba(168, 85, 247, 0.2);
  border-radius: 6px;
  background: rgba(168, 85, 247, 0.06);
  color: rgba(196, 181, 253, 0.8);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.onion-immersive-btn:hover {
  background: rgba(168, 85, 247, 0.12);
  border-color: rgba(168, 85, 247, 0.35);
  color: #fff;
}

/* 展开动画 */
.onion-slide-enter-active,
.onion-slide-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}

.onion-slide-enter-from,
.onion-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.onion-slide-enter-to,
.onion-slide-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
