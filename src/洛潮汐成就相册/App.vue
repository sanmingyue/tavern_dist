<template>
  <div class="album-root">
    <!-- 折叠态:悬浮按钮（可拖动） -->
    <Transition name="fab">
      <button
        v-if="!store.isOpen"
        ref="fabRef"
        class="fab"
        :class="{ 'is-dragging': isDragging }"
        :style="fabStyle"
        @pointerdown="onFabPointerDown"
      >
        <ProgressRing
          :size="52"
          :stroke-width="3"
          :percent="store.progressPercent"
          :unlocked="store.totalUnlocked"
          :total="TOTAL_ACHIEVEMENTS"
        />
      </button>
    </Transition>

    <!-- 展开态: 相册面板 -->
    <Transition name="panel">
      <div v-if="store.isOpen" class="album-panel" :class="{ 'is-mobile': isMobile }" :style="panelStyle">
        <!--顶栏（可拖动，手机端不可拖动） -->
        <div
          class="album-topbar"
          :class="{ 'is-dragging': isPanelDragging }"
          @pointerdown="!isMobile && onPanelPointerDown($event)"
        >
          <span class="album-title">成就图鉴</span>
          <span class="album-total">{{ store.totalUnlocked }} / {{ TOTAL_ACHIEVEMENTS }}</span>
          <button class="album-close-btn" @click="store.isOpen = false" @pointerdown.stop>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- 主体: 手机端纵向布局（顶部章节条+ 网格）;桌面端左右布局 -->
        <div class="album-body">
          <Sidebar
            v-if="!isMobile"
            :active-chapter="store.activeChapter"
            :progress="store.chapterProgress"
            @select="store.activeChapter = $event"
          />
          <!-- 手机端: 水平滚动章节选择条 -->
          <div v-if="isMobile" class="mobile-chapter-bar">
            <button
              v-for="chapter in CHAPTERS"
              :key="chapter.prefix"
              class="mobile-chapter-item"
              :class="{ active: store.activeChapter === chapter.prefix }"
              @click="store.activeChapter = chapter.prefix"
            >
              <span class="mobile-chapter-label">{{ chapter.label }}</span>
              <span class="mobile-chapter-count">
                {{ store.chapterProgress[chapter.prefix]?.unlocked || 0 }}/{{ store.chapterProgress[chapter.prefix]?.total || 0 }}
              </span>
            </button>
          </div>
          <AchievementGrid
            :active-chapter="store.activeChapter"
            :progress="store.chapterProgress[store.activeChapter]"
            :is-unlocked="store.isUnlocked"
            :is-mobile="isMobile"
            @view="openLightbox"
          />
        </div>
      </div>
    </Transition>

    <!-- 灯箱 -->
    <Lightbox
      :entry="viewingEntry"
      :has-prev="hasPrevEntry"
      :has-next="hasNextEntry"
      @close="store.viewingId = null"
      @prev="navigateEntry(-1)"
      @next="navigateEntry(1)"
    />
  </div>
</template>

<script setup lang="ts">
import { TOTAL_ACHIEVEMENTS, ACHIEVEMENT_MAP, CHAPTERS, getAchievementById } from './achievements';
import { useAchievementStore } from './store';
import ProgressRing from './components/ProgressRing.vue';
import Sidebar from './components/Sidebar.vue';
import AchievementGrid from './components/AchievementGrid.vue';
import Lightbox from './components/Lightbox.vue';

const store = useAchievementStore();
const fabRef = ref<HTMLButtonElement | null>(null);

//─── 响应式尺寸检测 ───
const hostWindow = window.parent;
const windowWidth = ref(hostWindow.innerWidth);
const windowHeight = ref(hostWindow.innerHeight);
const MOBILE_BREAKPOINT = 500;
const isMobile = computed(() => windowWidth.value <= MOBILE_BREAKPOINT);

// ─── 拖动逻辑 ───
const DRAG_THRESHOLD = 3;
const FAB_SIZE = 56;
const EDGE_GAP = 12;

//面板尺寸：桌面端固定，手机端全屏
const panelWidth = computed(() => isMobile.value ? windowWidth.value : 620);
const panelHeight = computed(() => isMobile.value ? windowHeight.value : 480);

const isDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let dragBaseX = 0;
let dragBaseY = 0;
let hasMoved = false;

//─── 面板拖动逻辑 ───
const isPanelDragging = ref(false);
const panelOffset = ref<{ x: number; y: number } | null>(null);
let panelDragStartX = 0;
let panelDragStartY = 0;
let panelDragBaseX = 0;
let panelDragBaseY = 0;
let panelHasMoved = false;

//悬浮按钮样式（用left/top 定位）
const fabStyle = computed(() => ({
  left: `${store.fabPosition.x}px`,
  top: `${store.fabPosition.y}px`,
}));

// 面板初始位置：基于悬浮按钮位置计算
function calcPanelInitialPos() {
  if (isMobile.value) {
    return { x: 0, y: 0 };
  }
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
  left = Math.min(Math.max(EDGE_GAP, left), Math.max(EDGE_GAP, vw - pw - EDGE_GAP));

  let top: number;
  const above = fabY - ph -12;
  const below = fabY + FAB_SIZE + 12;
  if (above >= EDGE_GAP) {
    top = above;
  } else if (below + ph <= vh - EDGE_GAP) {
    top = below;
  } else {
    top = Math.min(Math.max(EDGE_GAP, above), Math.max(EDGE_GAP, vh - ph - EDGE_GAP));
  }

  return { x: left, y: top };
}

// 面板位置样式：手机端全屏；桌面端支持拖动
const panelStyle = computed(() => {
  if (isMobile.value) {
    return {
      left: '0px',
      top: '0px',
      width: '100vw',
      height: '100vh',
    };
  }
  const pos = panelOffset.value ?? calcPanelInitialPos();
  return {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${panelWidth.value}px`,
    height: `${panelHeight.value}px`,
  };
});

// 面板打开/关闭时重置偏移
watch(() => store.isOpen, (open) => {
  if (open) {
    panelOffset.value = null; // 每次打开重新根据 fab 位置计算
  }
});

function onFabPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  e.preventDefault();

  isDragging.value = false;
  hasMoved = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  dragBaseX = store.fabPosition.x;
  dragBaseY = store.fabPosition.y;

  // 在酒馆页面 window 上监听 move/up
  hostWindow.addEventListener('pointermove', onFabPointerMove);
  hostWindow.addEventListener('pointerup', onFabPointerUp);
}

function onFabPointerMove(e: PointerEvent) {
  const dx = e.clientX - dragStartX;
  const dy = e.clientY - dragStartY;

  if (!hasMoved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) {
    return; // 还没超过阈值，不算拖动
  }

  hasMoved = true;
  isDragging.value = true;
  store.updateFabPosition(dragBaseX + dx, dragBaseY + dy);
}

function onFabPointerUp() {
  hostWindow.removeEventListener('pointermove', onFabPointerMove);
  hostWindow.removeEventListener('pointerup', onFabPointerUp);

  isDragging.value = false;

  if (!hasMoved) {
    // 未拖动 → 视为点击，打开相册
    store.isOpen = true;
  }
}

// ─── 面板拖动处理 ───
function onPanelPointerDown(e: PointerEvent) {
  if (e.button !== 0|| isMobile.value) return;
  e.preventDefault();

  isPanelDragging.value = false;
  panelHasMoved = false;
  panelDragStartX = e.clientX;
  panelDragStartY = e.clientY;

  // 获取面板当前实际位置
  const currentPos = panelOffset.value ?? calcPanelInitialPos();
  panelDragBaseX = currentPos.x;
  panelDragBaseY = currentPos.y;

  hostWindow.addEventListener('pointermove', onPanelPointerMove);
  hostWindow.addEventListener('pointerup', onPanelPointerUp);
}

function onPanelPointerMove(e: PointerEvent) {
  const dx = e.clientX - panelDragStartX;
  const dy = e.clientY - panelDragStartY;

  if (!panelHasMoved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) {
    return;
  }

  panelHasMoved = true;
  isPanelDragging.value = true;

  //钳制面板位置到视口内
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const pw = panelWidth.value;
  const ph = panelHeight.value;
  const newX = _.clamp(panelDragBaseX + dx, EDGE_GAP, Math.max(EDGE_GAP, vw - pw - EDGE_GAP));
  const newY = _.clamp(panelDragBaseY + dy, EDGE_GAP, Math.max(EDGE_GAP, vh - ph - EDGE_GAP));

  panelOffset.value = { x: newX, y: newY };
}

function onPanelPointerUp() {
  hostWindow.removeEventListener('pointermove', onPanelPointerMove);
  hostWindow.removeEventListener('pointerup', onPanelPointerUp);
  isPanelDragging.value = false;
}

// 窗口 resize 时重新钳制位置 & 更新尺寸
const onResize = () => {
  windowWidth.value = hostWindow.innerWidth;
  windowHeight.value = hostWindow.innerHeight;
  store.updateFabPosition(store.fabPosition.x, store.fabPosition.y);
  // 如果面板有手动偏移，也需要钳制
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

// ─── 灯箱相关 ───
const viewingEntry = computed(() =>
  store.viewingId ? getAchievementById(store.viewingId) ?? null : null,
);

const unlockedInChapter = computed(() => {
  const entries = ACHIEVEMENT_MAP[store.activeChapter] || [];
  return entries.filter(e => store.isUnlocked(e.id));
});

const currentViewIndex = computed(() => {
  if (!store.viewingId) return -1;
  return unlockedInChapter.value.findIndex(e => e.id === store.viewingId);
});

const hasPrevEntry = computed(() => currentViewIndex.value > 0);
const hasNextEntry = computed(() =>
  currentViewIndex.value >= 0 && currentViewIndex.value < unlockedInChapter.value.length - 1,
);

function openLightbox(id: string) {
  store.viewingId = id;
}

function navigateEntry(delta: number) {
  const idx = currentViewIndex.value + delta;
  if (idx >= 0 && idx < unlockedInChapter.value.length) {
    store.viewingId = unlockedInChapter.value[idx].id;
  }
}
</script>

<style scoped>
.album-root {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
}

/*悬浮按钮 — 改用 left/top 绝对定位，支持拖动 */
.fab {
  position: fixed;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(10, 18, 30, 0.92);
  backdrop-filter: blur(8px);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  transition: box-shadow 0.2s;
  padding: 2px;
  z-index: 9998;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
}

.fab:hover {
  box-shadow: 0 6px 28px rgba(0, 0, 0, 0.5);
}

.fab:active,
.fab.is-dragging {
  cursor: grabbing;
}

.fab.is-dragging {
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
}

/* 相册面板 — 桌面端定位 */
.album-panel {
  position: fixed;
  width: 620px;
  height: 480px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(to bottom, rgba(8, 14, 25, 0.6) 0%, rgba(8, 14, 25, 0.7) 100%),
    url('https://i.postimg.cc/NF9q1Rh2/X.png') center / cover no-repeat;
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9998;
  pointer-events: auto;
}

/* 手机端面板: 全屏无圆角 */
.album-panel.is-mobile {
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0;
  border: none;
  box-shadow: none;
  left: 0 !important;
  top: 0 !important;
}

/* 顶栏（可拖动） */
.album-topbar {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(10, 18, 30, 0.5);
  backdrop-filter: blur(8px);
  gap: 8px;
  cursor: grab;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}

.is-mobile .album-topbar {
  cursor: default;
  padding: 12px 16px;
}

.album-topbar.is-dragging {
  cursor: grabbing;
}

.album-title {
  font-size: 13px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 1px;
}

.album-total {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  flex: 1;
}

.album-close-btn {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.album-close-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.8);
}

/* 主体 */
.album-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* 手机端: 主体纵向布局 */
.is-mobile .album-body {
  flex-direction: column;
}

/* ─── 手机端水平章节选择条 ─── */
.mobile-chapter-bar {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  flex-shrink: 0;
  padding: 6px 8px;
  gap: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(10, 18, 30, 0.4);
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.mobile-chapter-bar::-webkit-scrollbar {
  display: none;
}

.mobile-chapter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: background0.2s;
  white-space: nowrap;
}

.mobile-chapter-item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.mobile-chapter-item.active {
  background: rgba(90, 155, 181, 0.15);
}

.mobile-chapter-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.3;
}

.mobile-chapter-item.active .mobile-chapter-label {
  color: rgba(255, 255, 255, 0.95);
}

.mobile-chapter-count {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.3);
  line-height: 1.3;
}

/* 过渡动画 */
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

/* 手机端面板过渡：从底部滑入 */
.is-mobile.panel-enter-from {
  opacity: 0;
  transform: translateY(100%);
}

.is-mobile.panel-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
