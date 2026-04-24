<template>
  <div class="status-root">
    <!-- 折叠态：悬浮按钮 -->
    <Transition name="fab">
      <button
        v-if="!store.isOpen"
        ref="fabRef"
        class="fab"
        :class="{ 'is-dragging': isDragging, 'is-snapped': isMobile && !isDragging && !justOpened }"
        :style="fabStyle"
        @pointerdown="onFabPointerDown"
      >
        <!-- 迷你仪表盘 SVG -->
        <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
          <!-- 外圈 -->
          <circle cx="24" cy="24" r="20" stroke="#6366f1" stroke-width="2.5" opacity="0.3" />
          <!-- 速度弧线 -->
          <path
            d="M8 30 A18 18 0 0 1 40 30"
            stroke="#6366f1"
            stroke-width="3"
            stroke-linecap="round"
            fill="none"
          />
          <!-- 指针 -->
          <line x1="24" y1="24" x2="32" y2="14" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" />
          <circle cx="24" cy="24" r="3" fill="#6366f1" />
          <!-- 状态色点 -->
          <circle cx="24" cy="40" r="3" :fill="stateColor" />
        </svg>
      </button>
    </Transition>

    <!-- 展开态：面板 -->
    <Transition name="panel">
      <div v-if="store.isOpen" class="status-panel" :class="{ 'is-mobile': isMobile }" :style="panelStyle">
        <!-- 顶栏 -->
        <div
          class="panel-topbar"
          :class="{ 'is-dragging': isPanelDragging }"
          @pointerdown="!isMobile && onPanelPointerDown($event)"
        >
          <div class="topbar-left">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#6366f1" stroke-width="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" stroke-linecap="round" />
            </svg>
            <span class="topbar-title">STATUS</span>
          </div>
          <span class="topbar-state" :class="'state-' + store.gameState">{{ store.gameState }}</span>
          <button class="close-btn" @click="store.isOpen = false" @pointerdown.stop>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- TAB 栏 -->
        <div class="tab-bar">
          <button
            v-for="(tab, index) in store.tabs"
            :key="tab"
            class="tab-btn"
            :class="{ active: store.activeTab === index }"
            @click="store.setActiveTab(index)"
          >
            {{ tab }}
          </button>
        </div>

        <!-- 内容区域 -->
        <div class="panel-body">
          <!-- 日常 -->
          <template v-if="store.gameState === '日常'">
            <TabDashboard v-if="store.activeTab === 0" />
            <TabMechGarage v-else-if="store.activeTab === 1" />
            <TabModification v-else-if="store.activeTab === 2" />
            <TabDriver v-else />
          </template>
          <!-- 赛前准备 -->
          <template v-else-if="store.gameState === '赛前准备'">
            <TabPreBattle v-if="store.activeTab === 0" />
            <TabPartner v-else-if="store.activeTab === 1" />
            <TabModification v-else />
          </template>
          <!-- 比赛中 -->
          <template v-else>
            <TabRaceStatus v-if="store.activeTab === 0" />
            <TabPartner v-else-if="store.activeTab === 1" />
            <TabOpponents v-else />
          </template>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useStatusStore } from './store';
import TabDashboard from './components/TabDashboard.vue';
import TabMechGarage from './components/TabMechGarage.vue';
import TabDriver from './components/TabDriver.vue';
import TabPreBattle from './components/TabPreBattle.vue';
import TabPartner from './components/TabPartner.vue';
import TabModification from './components/TabModification.vue';
import TabRaceStatus from './components/TabRaceStatus.vue';
import TabOpponents from './components/TabOpponents.vue';

const store = useStatusStore();
const fabRef = ref<HTMLButtonElement | null>(null);

// ─── 响应式尺寸 ───
const hostWindow = window.parent;
const windowWidth = ref(hostWindow.innerWidth);
const windowHeight = ref(hostWindow.innerHeight);
const MOBILE_BREAKPOINT = 500;
const isMobile = computed(() => windowWidth.value <= MOBILE_BREAKPOINT);

// ─── 常量 ───
const DRAG_THRESHOLD = 3;
const FAB_SIZE = 52;
const EDGE_GAP = 12;
const SNAP_OFFSET = FAB_SIZE * 0.45; // 吸附时露出的部分

// ─── 状态颜色 ───
const stateColor = computed(() => {
  if (store.gameState === '日常') return '#10b981';
  if (store.gameState === '赛前准备') return '#f59e0b';
  return '#ef4444';
});

// 面板尺寸
const panelWidth = computed(() => isMobile.value ? windowWidth.value : 580);
const panelHeight = computed(() => isMobile.value ? windowHeight.value : 500);

// ─── FAB 拖动 ───
const isDragging = ref(false);
const justOpened = ref(false);
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

// ─── 手机端吸附 ───
function snapToEdge(x: number, y: number): { x: number; y: number } {
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const clampedY = _.clamp(y, EDGE_GAP, vh - FAB_SIZE - EDGE_GAP);

  if (x + FAB_SIZE / 2 < vw / 2) {
    // 吸附到左边缘
    return { x: -SNAP_OFFSET, y: clampedY };
  } else {
    // 吸附到右边缘
    return { x: vw - FAB_SIZE + SNAP_OFFSET, y: clampedY };
  }
}

// FAB 样式
const fabStyle = computed(() => {
  const pos = store.fabPosition;
  return {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
  };
});

// ─── 面板位置 ───
function calcPanelInitialPos() {
  if (isMobile.value) return { x: 0, y: 0 };
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const fabX = store.fabPosition.x;
  const fabY = store.fabPosition.y;
  const pw = panelWidth.value;
  const ph = panelHeight.value;

  let left = fabX > vw * 0.5 ? fabX + FAB_SIZE - pw : fabX;
  left = _.clamp(left, EDGE_GAP, Math.max(EDGE_GAP, vw - pw - EDGE_GAP));

  const above = fabY - ph - 12;
  const below = fabY + FAB_SIZE + 12;
  let top: number;
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
  if (open) {
    panelOffset.value = null;
    justOpened.value = true;
    setTimeout(() => { justOpened.value = false; }, 300);
  }
});

// ─── FAB 事件处理 ───
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

  // 拖动时暂时用真实坐标（不吸附）
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const x = _.clamp(dragBaseX + dx, -SNAP_OFFSET, vw - FAB_SIZE + SNAP_OFFSET);
  const y = _.clamp(dragBaseY + dy, EDGE_GAP, vh - FAB_SIZE - EDGE_GAP);
  store.updateFabPosition(x, y);
}

function onFabPointerUp() {
  hostWindow.removeEventListener('pointermove', onFabPointerMove);
  hostWindow.removeEventListener('pointerup', onFabPointerUp);

  isDragging.value = false;

  if (!hasMoved) {
    store.isOpen = true;
  } else if (isMobile.value) {
    // 手机端松手后吸附到最近边缘
    const snapped = snapToEdge(store.fabPosition.x, store.fabPosition.y);
    store.updateFabPosition(snapped.x, snapped.y);
  }
}

// ─── 面板拖动处理 ───
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

// ─── 窗口 resize ───
const onResize = () => {
  windowWidth.value = hostWindow.innerWidth;
  windowHeight.value = hostWindow.innerHeight;

  if (isMobile.value && !store.isOpen) {
    const snapped = snapToEdge(store.fabPosition.x, store.fabPosition.y);
    store.updateFabPosition(snapped.x, snapped.y);
  } else {
    store.updateFabPosition(store.fabPosition.x, store.fabPosition.y);
  }

  if (panelOffset.value && !isMobile.value) {
    const vw = hostWindow.innerWidth;
    const vh = hostWindow.innerHeight;
    panelOffset.value = {
      x: _.clamp(panelOffset.value.x, EDGE_GAP, Math.max(EDGE_GAP, vw - panelWidth.value - EDGE_GAP)),
      y: _.clamp(panelOffset.value.y, EDGE_GAP, Math.max(EDGE_GAP, vh - panelHeight.value - EDGE_GAP)),
    };
  }
};

onMounted(() => {
  hostWindow.addEventListener('resize', onResize);
  // 手机端初始吸附
  if (isMobile.value) {
    const snapped = snapToEdge(store.fabPosition.x, store.fabPosition.y);
    store.updateFabPosition(snapped.x, snapped.y);
  }
});
onUnmounted(() => hostWindow.removeEventListener('resize', onResize));
</script>

<style scoped>
.status-root {
  font-family: 'Rajdhani', 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/* ─── FAB 悬浮按钮 ─── */
.fab {
  position: fixed;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid rgba(99, 102, 241, 0.3);
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.2), 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s, opacity 0.3s, transform 0.3s;
  padding: 0;
  z-index: 9998;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
}

.fab:hover {
  box-shadow: 0 6px 24px rgba(99, 102, 241, 0.3);
}

.fab:active,
.fab.is-dragging {
  cursor: grabbing;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.35);
}

/* 手机端吸附态 */
.fab.is-snapped {
  opacity: 0.5;
  transition: left 0.3s ease, top 0.3s ease, opacity 0.3s ease;
}

.fab.is-snapped:hover,
.fab.is-snapped:active {
  opacity: 1;
}

/* ─── 面板 ─── */
.status-panel {
  position: fixed;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  box-shadow: 0 12px 48px rgba(99, 102, 241, 0.12), 0 4px 16px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9998;
  pointer-events: auto;
}

.status-panel.is-mobile {
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0;
  border: none;
  left: 0 !important;
  top: 0 !important;
}

/* ─── 顶栏 ─── */
.panel-topbar {
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 2px solid #6366f1;
  background: #fafbfe;
  gap: 8px;
  cursor: grab;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}

.is-mobile .panel-topbar {
  cursor: default;
}

.panel-topbar.is-dragging {
  cursor: grabbing;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.topbar-title {
  font-size: 14px;
  font-weight: 900;
  color: #1e1b4b;
  letter-spacing: 2px;
  font-family: 'Rajdhani', monospace;
}

.topbar-state {
  font-size: 10px;
  font-weight: 800;
  padding: 2px 8px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  margin-left: auto;
}

.topbar-state.state-日常 {
  background: #ecfdf5;
  color: #059669;
}

.topbar-state.state-赛前准备 {
  background: #fef3c7;
  color: #d97706;
}

.topbar-state.state-比赛中 {
  background: #fef2f2;
  color: #dc2626;
}

.close-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: #94a3b8;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: #f1f5f9;
  color: #64748b;
}

/* ─── TAB 栏 ─── */
.tab-bar {
  display: flex;
  padding: 0;
  border-bottom: 1px solid #e8ecf1;
  background: #fff;
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 10px 0;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  letter-spacing: 0.5px;
}

.tab-btn:hover {
  color: #6366f1;
  background: #fafbfe;
}

.tab-btn.active {
  color: #6366f1;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: #6366f1;
  border-radius: 1px;
}

/* ─── 内容区域 ─── */
.panel-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-body > * {
  flex: 1;
}

/* ─── 过渡 ─── */
.fab-enter-active,
.fab-leave-active {
  transition: opacity 0.25s ease;
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
}

.panel-enter-active,
.panel-leave-active {
  transition: all 0.3s ease;
}

.panel-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.panel-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* 手机适配 */
@media (max-width: 500px) {
  .topbar-title {
    font-size: 12px;
  }

  .tab-btn {
    font-size: 11px;
    padding: 8px 0;
  }
}
</style>
