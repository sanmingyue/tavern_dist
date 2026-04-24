<template>
  <div class="items-root">
    <!-- 折叠态：悬浮按钮（可拖动） -->
    <Transition name="fab">
      <button
        v-if="!store.isOpen"
        ref="fabRef"
        class="fab"
        :class="{ 'is-dragging': isDragging }"
        :style="fabStyle"
        @pointerdown="onFabPointerDown"
      >
        <span class="fab-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="rgba(200,170,110,0.85)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
            <line x1="12" y1="22.08" x2="12" y2="12"/>
          </svg>
        </span>
        <span v-if="store.totalItems > 0" class="fab-count">{{ store.totalItems }}</span>
      </button>
    </Transition>

    <!-- 展开态：物品面板 -->
    <Transition name="panel">
      <div v-if="store.isOpen" class="items-panel" :class="{ 'is-mobile': isMobile }" :style="panelStyle">
        <!-- 顶栏（可拖动） -->
        <div
          class="panel-topbar"
          :class="{ 'is-dragging': isPanelDragging }"
          @pointerdown="!isMobile && onPanelPointerDown($event)"
        >
          <div class="topbar-left">
            <span class="topbar-room-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" :style="{ stroke: store.roomInfo.color }">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <div class="topbar-info">
              <span class="topbar-title">物品一览</span>
              <span class="topbar-room" :style="{ color: store.roomInfo.color }">
                {{ store.roomInfo.name }}
              </span>
            </div>
          </div>
          <button class="panel-close-btn" @click="store.isOpen = false" @pointerdown.stop>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- 标签切换 -->
        <div class="tab-bar">
          <button
            class="tab-item"
            :class="{ active: store.activeTab === 'scene' }"
            @click="store.activeTab = 'scene'"
          >
            <span class="tab-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <span class="tab-label">场景物品</span>
            <span class="tab-count">{{ store.totalSceneItems }}</span>
          </button>
          <button
            class="tab-item"
            :class="{ active: store.activeTab === 'inventory' }"
            @click="store.activeTab = 'inventory'"
          >
            <span class="tab-icon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="4" y="8" width="16" height="14" rx="2"/>
                <path d="M8 8V5a4 4 0 0 1 8 0v3"/>
                <line x1="12" y1="12" x2="12" y2="16"/>
              </svg>
            </span>
            <span class="tab-label">持有物品</span>
            <span class="tab-count">{{ store.totalPlayerItems }}</span>
          </button>
        </div>

        <!-- 物品网格 -->
        <ItemGrid
          :items="store.currentItems"
          :is-mobile="isMobile"
          :empty-text="store.activeTab === 'scene' ? '当前场景没有物品' : '背包里空空如也'"
          @select="store.viewingItem = $event"
        />
      </div>
    </Transition>

    <!-- 物品详情灯箱 -->
    <ItemDetail
      :item="store.viewingItem"
      @close="store.viewingItem = null"
    />
  </div>
</template>

<script setup lang="ts">
import { useItemStore } from './store';
import ItemGrid from './components/ItemGrid.vue';
import ItemDetail from './components/ItemDetail.vue';

const store = useItemStore();
const fabRef = ref<HTMLButtonElement | null>(null);

// ─── 响应式尺寸检测 ───
const hostWindow = window.parent;
const windowWidth = ref(hostWindow.innerWidth);
const windowHeight = ref(hostWindow.innerHeight);
const MOBILE_BREAKPOINT = 500;
const isMobile = computed(() => windowWidth.value <= MOBILE_BREAKPOINT);

// ─── 拖动逻辑 ───
const DRAG_THRESHOLD = 3;
const FAB_SIZE = 48;
const EDGE_GAP = 12;

const panelWidth = computed(() => isMobile.value ? windowWidth.value : 540);
const panelHeight = computed(() => isMobile.value ? windowHeight.value : 580);

const isDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let dragBaseX = 0;
let dragBaseY = 0;
let hasMoved = false;

// ─── 面板拖动 ───
const isPanelDragging = ref(false);
const panelOffset = ref<{ x: number; y: number } | null>(null);
let panelDragStartX = 0;
let panelDragStartY = 0;
let panelDragBaseX = 0;
let panelDragBaseY = 0;
let panelHasMoved = false;

// FAB 样式
const fabStyle = computed(() => ({
  left: `${store.fabPosition.x}px`,
  top: `${store.fabPosition.y}px`,
}));

// 面板初始位置
function calcPanelInitialPos() {
  if (isMobile.value) return { x: 0, y: 0 };
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const fabX = store.fabPosition.x;
  const fabY = store.fabPosition.y;
  const pw = panelWidth.value;
  const ph = panelHeight.value;

  let left: number;
  if (fabX > vw * 0.5) {
    left = fabX + FAB_SIZE - pw;
  } else {
    left = fabX;
  }
  left = _.clamp(left, EDGE_GAP, Math.max(EDGE_GAP, vw - pw - EDGE_GAP));

  let top: number;
  const above = fabY - ph - 12;
  const below = fabY + FAB_SIZE + 12;
  if (above >= EDGE_GAP) {
    top = above;
  } else if (below + ph <= vh - EDGE_GAP) {
    top = below;
  } else {
    top = _.clamp(above, EDGE_GAP, Math.max(EDGE_GAP, vh - ph - EDGE_GAP));
  }
  return { x: left, y: top };
}

const panelStyle = computed(() => {
  if (isMobile.value) {
    return { left: '0px', top: '0px', width: '100vw', height: '100vh' };
  }
  const pos = panelOffset.value ?? calcPanelInitialPos();
  return {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${panelWidth.value}px`,
    height: `${panelHeight.value}px`,
  };
});

watch(() => store.isOpen, (open) => {
  if (open) panelOffset.value = null;
});

// ─── FAB 拖动 ───
function onFabPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  isDragging.value = false;
  hasMoved = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragBaseX = store.fabPosition.x;
  dragBaseY = store.fabPosition.y;
  hostWindow.addEventListener('pointermove', onFabPointerMove);
  hostWindow.addEventListener('pointerup', onFabPointerUp);
}

function onFabPointerMove(e: PointerEvent) {
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;
  if (!hasMoved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
  hasMoved = true;
  isDragging.value = true;
  store.updateFabPosition(dragBaseX + dx, dragBaseY + dy);
}

function onFabPointerUp() {
  hostWindow.removeEventListener('pointermove', onFabPointerMove);
  hostWindow.removeEventListener('pointerup', onFabPointerUp);
  isDragging.value = false;
  if (!hasMoved) store.isOpen = true;
}

// ─── 面板拖动 ───
function onPanelPointerDown(e: PointerEvent) {
  if (e.button !== 0 || isMobile.value) return;
  e.preventDefault();
  isPanelDragging.value = false;
  panelHasMoved = false;
  panelDragStartX = e.clientX;
  panelDragStartY = e.clientY;
  const currentPos = panelOffset.value ?? calcPanelInitialPos();
  panelDragBaseX = currentPos.x;
  panelDragBaseY = currentPos.y;
  hostWindow.addEventListener('pointermove', onPanelPointerMove);
  hostWindow.addEventListener('pointerup', onPanelPointerUp);
}

function onPanelPointerMove(e: PointerEvent) {
  const dx = e.clientX - panelDragStartX;
  const dy = e.clientY - panelDragStartY;
  if (!panelHasMoved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
  panelHasMoved = true;
  isPanelDragging.value = true;
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const pw = panelWidth.value;
  const ph = panelHeight.value;
  panelOffset.value = {
    x: _.clamp(panelDragBaseX + dx, EDGE_GAP, Math.max(EDGE_GAP, vw - pw - EDGE_GAP)),
    y: _.clamp(panelDragBaseY + dy, EDGE_GAP, Math.max(EDGE_GAP, vh - ph - EDGE_GAP)),
  };
}

function onPanelPointerUp() {
  hostWindow.removeEventListener('pointermove', onPanelPointerMove);
  hostWindow.removeEventListener('pointerup', onPanelPointerUp);
  isPanelDragging.value = false;
}

// 窗口 resize
const onResize = () => {
  windowWidth.value = hostWindow.innerWidth;
  windowHeight.value = hostWindow.innerHeight;
  store.updateFabPosition(store.fabPosition.x, store.fabPosition.y);
  if (panelOffset.value && !isMobile.value) {
    const vw = hostWindow.innerWidth;
    const vh = hostWindow.innerHeight;
    const pw = panelWidth.value;
    const ph = panelHeight.value;
    panelOffset.value = {
      x: _.clamp(panelOffset.value.x, EDGE_GAP, Math.max(EDGE_GAP, vw - pw - EDGE_GAP)),
      y: _.clamp(panelOffset.value.y, EDGE_GAP, Math.max(EDGE_GAP, vh - ph - EDGE_GAP)),
    };
  }
};
onMounted(() => hostWindow.addEventListener('resize', onResize));
onUnmounted(() => hostWindow.removeEventListener('resize', onResize));
</script>

<style scoped>
.items-root {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* ─── 悬浮按钮 ─── */
.fab {
  position: fixed;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(200, 170, 110, 0.2);
  background: linear-gradient(135deg, rgba(18, 22, 35, 0.95), rgba(25, 30, 45, 0.95));
  backdrop-filter: blur(8px);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.4),
    0 0 20px rgba(200, 170, 110, 0.06);
  transition: box-shadow 0.2s, border-color 0.2s;
  z-index: 9998;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
}

.fab:hover {
  border-color: rgba(200, 170, 110, 0.35);
  box-shadow:
    0 6px 24px rgba(0, 0, 0, 0.5),
    0 0 24px rgba(200, 170, 110, 0.1);
}

.fab:active, .fab.is-dragging {
  cursor: grabbing;
}

.fab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.fab-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: rgba(200, 170, 110, 0.9);
  color: #1a1f2e;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

/* ─── 物品面板 ─── */
.items-panel {
  position: fixed;
  border-radius: 14px;
  border: 1px solid rgba(200, 170, 110, 0.12);
  background:
    linear-gradient(to bottom, rgba(12, 16, 28, 0.92) 0%, rgba(8, 12, 22, 0.95) 100%);
  backdrop-filter: blur(16px);
  box-shadow:
    0 12px 48px rgba(0, 0, 0, 0.6),
    0 0 40px rgba(200, 170, 110, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9998;
  pointer-events: auto;
}

.items-panel.is-mobile {
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0;
  border: none;
  box-shadow: none;
  left: 0 !important;
  top: 0 !important;
}

/* ─── 顶栏 ─── */
.panel-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(15, 20, 32, 0.5);
  backdrop-filter: blur(8px);
  cursor: grab;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}

.is-mobile .panel-topbar {
  cursor: default;
  padding: 12px 14px;
}

.panel-topbar.is-dragging {
  cursor: grabbing;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar-room-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.topbar-info {
  display: flex;
  flex-direction: column;
}

.topbar-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.5px;
  line-height: 1.2;
}

.topbar-room {
  font-size: 12px;
  line-height: 1.3;
  opacity: 0.8;
}

.panel-close-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.panel-close-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
}

/* ─── 标签栏 ─── */
.tab-bar {
  display: flex;
  padding: 8px 12px;
  gap: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  flex-shrink: 0;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.tab-item.active {
  background: rgba(200, 170, 110, 0.1);
}

.tab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
}

.tab-item.active .tab-icon {
  color: rgba(200, 170, 110, 0.8);
}

.tab-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  font-weight: 500;
}

.tab-item.active .tab-label {
  color: rgba(255, 255, 255, 0.9);
}

.tab-count {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.25);
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
}

.tab-item.active .tab-count {
  background: rgba(200, 170, 110, 0.15);
  color: rgba(200, 170, 110, 0.8);
}

/* ─── 过渡动画 ─── */
.fab-enter-active, .fab-leave-active {
  transition: opacity 0.25s ease;
}
.fab-enter-from, .fab-leave-to {
  opacity: 0;
}

.panel-enter-active, .panel-leave-active {
  transition: all 0.3s ease;
}
.panel-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}
.panel-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.96);
}

.is-mobile.panel-enter-from {
  opacity: 0;
  transform: translateY(100%);
}
.is-mobile.panel-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
