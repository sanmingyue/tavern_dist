<template>
  <div class="fruit-status" :style="containerStyle">
    <div class="fruit-panel">
      <!-- 第一层：时间栏（始终显示） -->
      <TimeBar :expanded="layer >= 2" @toggle="toggleLayer" />

      <!-- 第二层：角色列表 -->
      <Transition name="fruit-slide">
        <div v-if="layer >= 2 && !selectedCharacter" class="fruit-content">
          <CharacterGrid @select="onSelectCharacter" />
        </div>
      </Transition>

      <!-- 手机端：角色详情（内联展开，含内心剧场） -->
      <Transition name="fruit-slide">
        <div v-if="selectedCharacter && isMobileView" class="fruit-content">
          <CharacterDetail :name="selectedCharacter" @back="selectedCharacter = null" />
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue';
import TimeBar from './components/TimeBar.vue';
import CharacterGrid from './components/CharacterGrid.vue';
import CharacterDetail from './components/CharacterDetail.vue';
import { useStatusStore } from './store';
import { enterImmersive, cleanupImmersive } from './immersive';

const store = useStatusStore();
store.init();

const layer = ref(1);
const selectedCharacter = ref<string | null>(null);
const isMobileView = computed(() => window.parent.innerWidth <= 768);

function toggleLayer() {
  if (layer.value >= 2) {
    layer.value = 1;
    selectedCharacter.value = null;
  } else {
    layer.value = 2;
  }
}

/** 点击角色卡片 */
function onSelectCharacter(name: string) {
  if (isMobileView.value) {
    // 手机端：内联展开角色详情
    selectedCharacter.value = name;
  } else {
    // PC 端：进入沉浸模式
    const charData = store.getCharacter(name);
    enterImmersive(name, charData, () => {});
  }
}


const containerStyle = computed(() => {
  const width = layer.value === 1 ? '280px' : '320px';
  return { width, maxWidth: '100%', transition: 'width 0.3s ease', marginLeft: 'auto' };
});

onUnmounted(() => {
  cleanupImmersive();
});
</script>

<style scoped>
.fruit-status {
  font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, -apple-system, sans-serif;
  padding: 8px 0 4px;
}

.fruit-panel {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(17, 24, 39, 0.8);
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.fruit-content {
  max-height: 320px;
  overflow-y: auto;
  /* 隐藏滚动条 */
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.fruit-content::-webkit-scrollbar {
  width: 0;
  height: 0;
}

/* 展开动画 */
.fruit-slide-enter-active,
.fruit-slide-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease;
  overflow: hidden;
}

.fruit-slide-enter-from,
.fruit-slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.fruit-slide-enter-to,
.fruit-slide-leave-from {
  max-height: 320px;
  opacity: 1;
}
</style>
