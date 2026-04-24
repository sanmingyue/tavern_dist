<template>
  <div class="xiuxian-root" :class="'theme-' + store.theme">
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
        <svg viewBox="0 0 48 48" width="36" height="36" fill="none">
          <ellipse cx="24" cy="32" rx="14" ry="10" stroke="var(--accent-gold)" stroke-width="2.5" />
          <ellipse cx="24" cy="20" rx="10" ry="6" stroke="var(--accent-gold)" stroke-width="2.5" />
          <line x1="14" y1="20" x2="14" y2="32" stroke="var(--accent-gold)" stroke-width="2.5" />
          <line x1="34" y1="20" x2="34" y2="32" stroke="var(--accent-gold)" stroke-width="2.5" />
          <path d="M20 38 Q24 32 28 38 Q24 42 20 38" fill="#f97316" opacity="0.8" />
          <circle cx="24" cy="12" r="3" :fill="spiritColor" opacity="0.6" />
        </svg>
      </button>
    </Transition>

    <!-- 手机端：半透明遮罩层 -->
    <Transition name="overlay">
      <div v-if="store.isOpen && isMobile" class="drawer-overlay" @click="store.isOpen = false"></div>
    </Transition>

    <!-- 展开态：面板 -->
    <Transition :name="isMobile ? 'drawer' : 'panel'">
      <div
        v-if="store.isOpen"
        class="status-panel"
        :style="panelStyle"
        :class="{ 'is-drawer': isMobile }"
      >
        <!-- PC端：包裹框背景层 -->
        <div v-if="!isMobile" class="panel-frame" :style="{ backgroundImage: 'url(' + PC_BG + ')' }"></div>

        <!-- 内容层 -->
        <div class="panel-inner" :style="isMobile ? { borderRadius: '16px 16px 0 0' } : {}">
          <!-- 手机端：拖拽把手 -->
          <div v-if="isMobile" class="drawer-handle" @pointerdown="onDrawerPointerDown">
            <div class="handle-bar"></div>
          </div>

          <!-- 顶栏 -->
          <div
            class="panel-topbar"
            :class="{ 'is-dragging': isPanelDragging }"
            @pointerdown="!isMobile && onPanelPointerDown($event)"
          >
            <div class="topbar-left">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--accent-gold)" stroke-width="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" stroke-linecap="round" />
              </svg>
              <span class="topbar-title">修仙世界</span>
            </div>
            <div class="topbar-actions">
              <!-- 主题切换按钮 -->
              <button class="theme-btn" @click="store.toggleTheme" @pointerdown.stop title="切换主题">
                <svg v-if="store.theme === 'dark'" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
                <svg v-else viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </button>
              <button class="close-btn" @click="store.isOpen = false" @pointerdown.stop>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
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
            <TabBasic v-if="store.activeTab === 0" />
            <TabRealm v-else-if="store.activeTab === 1" />
            <template v-else-if="store.activeTab === 2">
              <ArtPage v-if="store.artsPage" :key="store.artsPage" />
              <TabArtsList v-else />
            </template>
            <TabItems v-else-if="store.activeTab === 3" />
            <TabRelations v-else-if="store.activeTab === 4" />
            <TabMap v-else-if="store.activeTab === 5" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
import { useStatusStore } from './store';
import TabBasic from './components/TabBasic.vue';
import TabRealm from './components/TabRealm.vue';
import TabArtsList from './components/TabArtsList.vue';
import TabItems from './components/TabItems.vue';
import TabRelations from './components/TabRelations.vue';
import TabMap from './components/TabMap.vue';
import ArtPage from './components/ArtPage.vue';

const store = useStatusStore();
const fabRef = ref<HTMLButtonElement | null>(null);

// ─── 响应式尺寸 ───
const hostWindow = window.parent;
const windowWidth = ref(hostWindow.innerWidth);
const windowHeight = ref(hostWindow.innerHeight);
const safeViewHeight = ref(hostWindow.innerHeight); // 实际安全可见高度
const MOBILE_BREAKPOINT = 500;
const isMobile = computed(() => windowWidth.value <= MOBILE_BREAKPOINT);

// ─── 背景图URL（仅PC端使用） ───
const PC_BG = 'https://i.postimg.cc/Rhv0WT7s/123.png';

// ─── 常量 ───
const DRAG_THRESHOLD = 3;
const FAB_SIZE = computed(() => isMobile.value ? 52 : 60);
const EDGE_GAP = 12;
const SNAP_OFFSET = computed(() => FAB_SIZE.value * 0.45);

// ─── 灵气颜色 ───
const spiritColor = computed(() => {
  const realm = store.data.当前境界;
  if (!realm) return '#94a3b8';
  if (realm.startsWith('炼气') || realm.startsWith('筑基')) return '#10b981';
  if (realm.startsWith('金丹') || realm.startsWith('元婴')) return '#3b82f6';
  if (realm.startsWith('化神') || realm.startsWith('炼虚')) return '#8b5cf6';
  if (realm.startsWith('合体') || realm.startsWith('大乘')) return '#f59e0b';
  if (realm.startsWith('渡劫') || realm.startsWith('真仙')) return '#ef4444';
  return '#94a3b8';
});

// 面板尺寸
const panelWidth = computed(() => isMobile.value ? windowWidth.value : Math.min(780, Math.round(windowWidth.value * 0.5)));
const panelHeight = computed(() => isMobile.value ? windowHeight.value : Math.min(820, Math.round(windowHeight.value * 0.9)));

// ─── 手机端抽屉高度：使用 visualViewport 获取实际安全高度 ───
const drawerHeight = computed(() => {
  // 使用安全可见高度的 88%，留出顶部空间让用户看到酒馆页面
  return Math.floor(safeViewHeight.value * 0.88);
});

// ─── 手机端拖拽关闭 ───
const drawerTranslateY = ref(0);
let drawerStartY = 0;
let drawerHasMoved = false;

function onDrawerPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  drawerHasMoved = false;
  drawerStartY = e.clientY;
  drawerTranslateY.value = 0;
  hostWindow.addEventListener('pointermove', onDrawerPointerMove);
  hostWindow.addEventListener('pointerup', onDrawerPointerUp);
}

function onDrawerPointerMove(e: PointerEvent) {
  const dy = e.clientY - drawerStartY;
  if (!drawerHasMoved && Math.abs(dy) < DRAG_THRESHOLD) return;
  drawerHasMoved = true;
  // 只允许向下拖（dy > 0），向上拖最多回弹到 0
  drawerTranslateY.value = Math.max(0, dy);
}

function onDrawerPointerUp() {
  hostWindow.removeEventListener('pointermove', onDrawerPointerMove);
  hostWindow.removeEventListener('pointerup', onDrawerPointerUp);
  if (drawerTranslateY.value > 80) {
    // 下拉超过 80px，关闭面板
    store.isOpen = false;
  }
  drawerTranslateY.value = 0;
}

// ─── FAB 拖动 ───
const isDragging = ref(false);
const justOpened = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let dragBaseX = 0;
let dragBaseY = 0;
let hasMoved = false;

// ─── 面板拖动（仅PC） ───
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
  const fabS = FAB_SIZE.value;
  const snapOff = SNAP_OFFSET.value;
  const clampedY = _.clamp(y, EDGE_GAP, vh - fabS - EDGE_GAP);

  if (x + fabS / 2 < vw / 2) {
    return { x: -snapOff, y: clampedY };
  } else {
    return { x: vw - fabS + snapOff, y: clampedY };
  }
}

// FAB 样式
const fabStyle = computed(() => {
  const pos = store.fabPosition;
  return {
    left: pos.x + 'px',
    top: pos.y + 'px',
    width: FAB_SIZE.value + 'px',
    height: FAB_SIZE.value + 'px',
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
  const fabS = FAB_SIZE.value;

  let left = fabX > vw * 0.5 ? fabX + fabS - pw : fabX;
  left = _.clamp(left, EDGE_GAP, Math.max(EDGE_GAP, vw - pw - EDGE_GAP));

  const above = fabY - ph - 12;
  const below = fabY + fabS + 12;
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
    // 手机端：底部抽屉，通过 JS 精确计算 top 位置，避免 CSS bottom+height 的兼容性问题
    const h = drawerHeight.value;
    const vh = safeViewHeight.value || hostWindow.innerHeight;
    const topPos = vh - h;
    return {
      top: topPos + 'px',
      left: '0px',
      right: '0px',
      width: '100%',
      height: h + 'px',
      transform: drawerTranslateY.value > 0 ? `translateY(${drawerTranslateY.value}px)` : undefined,
    };
  }
  // PC端
  const pos = panelOffset.value ?? calcPanelInitialPos();
  return {
    left: pos.x + 'px',
    top: pos.y + 'px',
    width: panelWidth.value + 'px',
    height: panelHeight.value + 'px',
  };
});

watch(() => store.isOpen, (open) => {
  if (open) {
    panelOffset.value = null;
    drawerTranslateY.value = 0;
    justOpened.value = true;
    setTimeout(() => { justOpened.value = false; }, 300);
    // 开面板时刷新安全高度
    updateSafeViewHeight();
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
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const fabS = FAB_SIZE.value;
  const snapOff = SNAP_OFFSET.value;
  const x = _.clamp(dragBaseX + dx, -snapOff, vw - fabS + snapOff);
  const y = _.clamp(dragBaseY + dy, EDGE_GAP, vh - fabS - EDGE_GAP);
  store.updateFabPosition(x, y);
}

function onFabPointerUp() {
  hostWindow.removeEventListener('pointermove', onFabPointerMove);
  hostWindow.removeEventListener('pointerup', onFabPointerUp);
  isDragging.value = false;
  if (!hasMoved) {
    store.isOpen = true;
  } else if (isMobile.value) {
    const snapped = snapToEdge(store.fabPosition.x, store.fabPosition.y);
    store.updateFabPosition(snapped.x, snapped.y);
  }
}

// ─── 面板拖动处理（仅PC） ───
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

// ─── 安全高度更新 ───
function updateSafeViewHeight() {
  const vv = (hostWindow as any).visualViewport;
  if (vv) {
    safeViewHeight.value = vv.height;
  } else {
    safeViewHeight.value = hostWindow.innerHeight;
  }
}

// ─── 窗口 resize ───
const onResize = () => {
  windowWidth.value = hostWindow.innerWidth;
  windowHeight.value = hostWindow.innerHeight;
  updateSafeViewHeight();
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
  updateSafeViewHeight();

  // 监听 visualViewport resize（地址栏显示/隐藏时触发）
  const vv = (hostWindow as any).visualViewport;
  if (vv) {
    vv.addEventListener('resize', updateSafeViewHeight);
  }

  // 确保 FAB 位置在可见区域内（修正可能被持久化的坏位置）
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const fabS = FAB_SIZE.value;
  const pos = store.fabPosition;

  if (isMobile.value) {
    const snapped = snapToEdge(pos.x, pos.y);
    store.updateFabPosition(snapped.x, snapped.y);
  } else {
    // PC 模式：确保 FAB 在视窗内
    const safeX = _.clamp(pos.x, EDGE_GAP, Math.max(EDGE_GAP, vw - fabS - EDGE_GAP));
    const safeY = _.clamp(pos.y, EDGE_GAP, Math.max(EDGE_GAP, vh - fabS - EDGE_GAP));
    if (safeX !== pos.x || safeY !== pos.y) {
      store.updateFabPosition(safeX, safeY);
    }
  }
});
onUnmounted(() => {
  hostWindow.removeEventListener('resize', onResize);
  const vv = (hostWindow as any).visualViewport;
  if (vv) {
    vv.removeEventListener('resize', updateSafeViewHeight);
  }
});
</script>

<style scoped>
/* ═══ 仙侠主题CSS变量 ═══ */
.theme-light {
  --panel-bg: rgba(255, 250, 245, 0.95);
  --panel-border: rgba(180, 150, 100, 0.4);
  --content-bg: rgba(255, 252, 248, 0.92);
  --card-bg: #fffdf8;
  --card-border: rgba(180, 150, 100, 0.2);
  --text-primary: #2a1f1a;
  --text-secondary: #6b5d4e;
  --text-muted: #9a8b7a;
  --accent-gold: #b8963e;
  --accent-red: #c73c3c;
  --accent-blue: #5ba5a5;
  --accent-purple: #7c5cb8;
  --accent-green: #3d8b5e;
  --topbar-bg: linear-gradient(135deg, rgba(248, 240, 225, 0.95), rgba(240, 230, 208, 0.95));
  --topbar-border: #c8a96e;
  --topbar-text: #4a3520;
  --tab-bg: rgba(248, 240, 225, 0.95);
  --tab-active: #b8963e;
  --tab-text: #8a7e6a;
  --tab-hover-bg: rgba(200, 169, 110, 0.1);
  --fab-bg: rgba(255, 250, 240, 0.95);
  --fab-border: rgba(200, 169, 110, 0.4);
  --fab-shadow: rgba(180, 150, 100, 0.25);
  --close-color: #9a8b7a;
  --close-hover-bg: rgba(180, 150, 100, 0.15);
  --divider: rgba(200, 169, 110, 0.3);
  --scrollbar-thumb: rgba(180, 150, 100, 0.3);
}

.theme-dark {
  --panel-bg: rgba(20, 15, 10, 0.95);
  --panel-border: rgba(200, 169, 110, 0.3);
  --content-bg: rgba(25, 20, 14, 0.92);
  --card-bg: rgba(35, 28, 18, 0.85);
  --card-border: rgba(200, 169, 110, 0.15);
  --text-primary: #f0e6d0;
  --text-secondary: #c8b48c;
  --text-muted: #8a7e6a;
  --accent-gold: #c8a96e;
  --accent-red: #e05555;
  --accent-blue: #6bbfbf;
  --accent-purple: #a78bfa;
  --accent-green: #5db87a;
  --topbar-bg: linear-gradient(135deg, rgba(30, 22, 12, 0.95), rgba(40, 30, 18, 0.95));
  --topbar-border: #c8a96e;
  --topbar-text: #f0e6d0;
  --tab-bg: rgba(25, 20, 14, 0.95);
  --tab-active: #c8a96e;
  --tab-text: #8a7e6a;
  --tab-hover-bg: rgba(200, 169, 110, 0.08);
  --fab-bg: rgba(30, 25, 15, 0.95);
  --fab-border: rgba(200, 169, 110, 0.35);
  --fab-shadow: rgba(200, 169, 110, 0.2);
  --close-color: #8a7e6a;
  --close-hover-bg: rgba(200, 169, 110, 0.1);
  --divider: rgba(200, 169, 110, 0.2);
  --scrollbar-thumb: rgba(200, 169, 110, 0.25);
}

.xiuxian-root {
  font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, -apple-system, sans-serif;
}

/* ─── FAB 悬浮按钮 ─── */
.fab {
  position: fixed;
  border-radius: 50%;
  border: 2px solid var(--fab-border);
  background: var(--fab-bg);
  backdrop-filter: blur(8px);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px var(--fab-shadow), 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s, opacity 0.3s, transform 0.3s;
  padding: 0;
  z-index: 9998;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
}

.fab:hover {
  box-shadow: 0 6px 24px var(--fab-shadow);
}

.fab:active,
.fab.is-dragging {
  cursor: grabbing;
  box-shadow: 0 8px 32px var(--fab-shadow);
}

.fab.is-snapped {
  opacity: 0.7;
  transition: left 0.3s ease, top 0.3s ease, opacity 0.3s ease;
  animation: fab-breathe 3s ease-in-out infinite;
}

.fab.is-snapped:hover,
.fab.is-snapped:active {
  opacity: 1;
  animation: none;
}

@keyframes fab-breathe {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 0.85; }
}

/* ─── 手机端遮罩层 ─── */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 9997;
  pointer-events: auto;
}

/* ─── 面板 ─── */
.status-panel {
  position: fixed;
  border-radius: 14px;
  overflow: hidden;
  z-index: 9998;
  pointer-events: auto;
  display: flex;
}

/* 手机端底部抽屉模式 — 位置完全由 JS panelStyle 控制 */
.status-panel.is-drawer {
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
  will-change: transform;
}

/* 包裹框背景层（仅PC端） */
.panel-frame {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
}

/* 内容层 */
.panel-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  /* PC端留出边框装饰空间 */
  margin: 18px 14px 10px 14px;
  background: var(--content-bg);
  backdrop-filter: blur(12px);
  border-radius: 10px;
  border: 1px solid var(--panel-border);
  overflow: hidden;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.05);
}

/* 手机端：内容层无 margin，直接占满抽屉 */
.is-drawer .panel-inner {
  margin: 0;
  border-radius: 16px 16px 0 0;
  border: none;
  border-top: 1px solid var(--panel-border);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* ─── 拖拽把手（仅手机端） ─── */
.drawer-handle {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px 0 6px;
  cursor: grab;
  touch-action: none;
  user-select: none;
  flex-shrink: 0;
}

.handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--text-muted);
  opacity: 0.4;
  transition: opacity 0.2s;
}

.drawer-handle:active .handle-bar {
  opacity: 0.7;
}

/* ─── 顶栏 ─── */
.panel-topbar {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 2px solid var(--topbar-border);
  background: var(--topbar-bg);
  gap: 8px;
  cursor: grab;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}

/* 手机端顶栏不可拖动 */
.is-drawer .panel-topbar {
  cursor: default;
  padding: 8px 14px;
}

.panel-topbar.is-dragging {
  cursor: grabbing;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-title {
  font-size: 16px;
  font-weight: 900;
  color: var(--topbar-text);
  letter-spacing: 2px;
}

.topbar-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}

.theme-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--accent-gold);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.theme-btn:hover {
  background: var(--close-hover-bg);
}

.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--close-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.close-btn:hover {
  background: var(--close-hover-bg);
  color: var(--text-primary);
}

/* ─── TAB 栏 ─── */
.tab-bar {
  display: flex;
  padding: 0;
  border-bottom: 1px solid var(--divider);
  background: var(--tab-bg);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.tab-btn {
  flex: 1;
  padding: 12px 0;
  border: none;
  background: transparent;
  font-size: 13px;
  font-weight: 700;
  color: var(--tab-text);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  letter-spacing: 1px;
}

.tab-btn:hover {
  color: var(--tab-active);
  background: var(--tab-hover-bg);
}

.tab-btn.active {
  color: var(--tab-active);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: var(--tab-active);
  border-radius: 1px;
}

/* ─── 内容区域 ─── */
.panel-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: transparent;
  -webkit-overflow-scrolling: touch;
}

.panel-body::-webkit-scrollbar {
  width: 4px;
}

.panel-body::-webkit-scrollbar-track {
  background: transparent;
}

.panel-body::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 2px;
}

/* ─── 过渡动画 ─── */
.fab-enter-active,
.fab-leave-active {
  transition: opacity 0.25s ease;
}

.fab-enter-from,
.fab-leave-to {
  opacity: 0;
}

/* 遮罩层过渡 */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.3s ease;
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}

/* PC端面板过渡 */
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

/* 手机端底部抽屉过渡 */
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}

.drawer-enter-from {
  transform: translateY(100%);
}

.drawer-leave-to {
  transform: translateY(100%);
}

/* PC端字号放大 */
@media (min-width: 501px) {
  .topbar-title {
    font-size: 18px;
  }

  .tab-btn {
    font-size: 14px;
    padding: 14px 0;
  }
}

/* 手机端适配 */
@media (max-width: 500px) {
  .topbar-title {
    font-size: 14px;
    letter-spacing: 1px;
  }

  .tab-btn {
    font-size: 12px;
    padding: 10px 0;
  }
}
</style>
