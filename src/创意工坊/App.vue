<template>
  <div class="ws-root">
    <!-- 折叠态: 悬浮按钮 -->
    <Transition name="ws-fab">
      <button
        v-if="!isPanelOpen"
        ref="fabRef"
        class="ws-fab"
        :class="{ 'is-dragging': isDragging }"
        :style="fabStyle"
        @pointerdown="onFabPointerDown"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </button>
    </Transition>

    <!-- 展开态: 面板 -->
    <Transition name="ws-panel">
      <div v-if="isPanelOpen" class="ws-panel" :class="{ mobile: isMobile }" :style="panelStyle">
        <!-- 手机下拉关闭指示条 -->
        <div v-if="isMobile" class="ws-swipe-hint" @pointerdown="onSwipeDown" @click="isPanelOpen = false">
          <div class="ws-swipe-bar" />
        </div>
        <!-- 顶栏 -->
        <div
          class="ws-panel-top"
          :class="{ dragging: isPanelDragging }"
          @pointerdown="!isMobile && onPanelPointerDown($event)"
        >
          <span class="ws-panel-title">创意工坊</span>
          <span class="ws-panel-thanks">致谢安安提供服务器 -- 让我们有了家</span>
          <!-- 搜索框（PC在顶栏） -->
          <div v-if="!isMobile" class="ws-topbar-search">
            <svg class="ws-search-icon-sm" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              class="ws-topbar-search-input"
              v-model="searchQuery"
              placeholder="搜索作品..."
              spellcheck="false"
              @pointerdown.stop
            />
            <button v-if="searchQuery" class="ws-search-clear-sm" @click="searchQuery = ''" @pointerdown.stop>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
          <button v-if="!isMobile" class="ws-btn-icon" @click="isPanelOpen = false" @pointerdown.stop>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- 手机搜索框 -->
        <div v-if="isMobile" class="ws-search-bar-mobile">
          <svg class="ws-search-icon-sm" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input class="ws-topbar-search-input" v-model="searchQuery" placeholder="搜索作品..." spellcheck="false" />
          <button v-if="searchQuery" class="ws-search-clear-sm" @click="searchQuery = ''">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <!-- 页面切换 -->
        <div class="ws-page-switch">
          <button
            v-for="page in pages"
            :key="page.key"
            class="ws-page-btn"
            :class="{ active: currentPage === page.key }"
            @click="currentPage = page.key"
          >{{ page.label }}</button>
        </div>

        <!-- 页面内容 -->
        <div class="ws-panel-content">
          <WorkshopView
            v-if="currentPage === 'workshop'"
            :search-query="searchQuery"
            :is-mobile="isMobile"
            :auth="auth"
          />
          <UploadView
            v-if="currentPage === 'upload'"
            :is-mobile="isMobile"
            :auth="auth"
            :edit-work="editTarget"
            @uploaded="onUploaded"
            @edit-done="editTarget = null"
          />
          <MyWorksView
            v-if="currentPage === 'myworks'"
            :is-mobile="isMobile"
            :auth="auth"
            @edit-work="onEditWork"
          />
          <ProfileView
            v-if="currentPage === 'profile'"
            :is-mobile="isMobile"
            :auth="auth"
          />
        </div>


        <!-- PC 可调整大小的手柄 -->
        <div
          v-if="!isMobile"
          class="ws-resize-handle"
          @pointerdown="onResizePointerDown"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {
  STORAGE_KEY,
  EDGE_GAP,
  FAB_SIZE,
  DRAG_THRESHOLD,
  MIN_PANEL_W,
  MIN_PANEL_H,
  readPanelSize,
  savePanelSize,
} from './types';
import { useAuth } from './useAuth';
import WorkshopView from './views/WorkshopView.vue';
import UploadView from './views/UploadView.vue';
import MyWorksView from './views/MyWorksView.vue';
import ProfileView from './views/ProfileView.vue';

// ─── 认证 ───
const auth = useAuth();
auth.tryRestore();

// ─── 宿主窗口 ───
const hostWindow = window.parent;
const windowWidth = ref(hostWindow.innerWidth);
const windowHeight = ref(hostWindow.innerHeight);
const safeViewHeight = ref(hostWindow.innerHeight);
const isMobile = computed(() => windowWidth.value <= 768);

// ─── 面板状态 ───
const isPanelOpen = ref(false);
type PageKey = 'workshop' | 'upload' | 'myworks' | 'profile';
const currentPage = ref<PageKey>('workshop');
const searchQuery = ref('');
const editTarget = ref<any>(null);

const pages = [
  { key: 'workshop' as PageKey, label: '广场' },
  { key: 'upload' as PageKey, label: '上传' },
  { key: 'myworks' as PageKey, label: '我的' },
  { key: 'profile' as PageKey, label: '账号' },
];

function onUploaded() {
  editTarget.value = null;
  currentPage.value = 'myworks';
}

/** MyWorksView 点击修改 → 切到上传页并传入作品数据 */
function onEditWork(work: any) {
  editTarget.value = work;
  currentPage.value = 'upload';
}

// ─── 面板尺寸 ───
const panelSize = reactive(readPanelSize());

// ─── FAB 位置 ───
function defaultFabPos() {
  return { x: hostWindow.innerWidth - FAB_SIZE - 16, y: hostWindow.innerHeight * 0.55 };
}

function readFabPos(): { x: number; y: number } {
  try {
    const raw = hostWindow.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultFabPos();
}

function saveFabPos(pos: { x: number; y: number }) {
  try { hostWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
}

function clampPos(x: number, y: number) {
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  return {
    x: _.clamp(x, EDGE_GAP, Math.max(EDGE_GAP, vw - FAB_SIZE - EDGE_GAP)),
    y: _.clamp(y, EDGE_GAP, Math.max(EDGE_GAP, vh - FAB_SIZE - EDGE_GAP)),
  };
}

const fabPos = reactive(clampPos(readFabPos().x, readFabPos().y));
const fabStyle = computed(() => ({ left: `${fabPos.x}px`, top: `${fabPos.y}px` }));

function setFabPos(x: number, y: number) {
  const c = clampPos(x, y);
  fabPos.x = c.x;
  fabPos.y = c.y;
  saveFabPos(c);
}

// ─── FAB 拖动 ───
const isDragging = ref(false);
const fabRef = ref<HTMLButtonElement | null>(null);
let dragStart = { x: 0, y: 0 };
let dragBase = { x: 0, y: 0 };
let hasMoved = false;

function onFabPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  isDragging.value = false;
  hasMoved = false;
  dragStart = { x: e.clientX, y: e.clientY };
  dragBase = { x: fabPos.x, y: fabPos.y };
  hostWindow.addEventListener('pointermove', onFabPointerMove);
  hostWindow.addEventListener('pointerup', onFabPointerUp);
}

function onFabPointerMove(e: PointerEvent) {
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  if (!hasMoved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
  hasMoved = true;
  isDragging.value = true;
  setFabPos(dragBase.x + dx, dragBase.y + dy);
}

function onFabPointerUp() {
  hostWindow.removeEventListener('pointermove', onFabPointerMove);
  hostWindow.removeEventListener('pointerup', onFabPointerUp);
  isDragging.value = false;
  if (!hasMoved) {
    isPanelOpen.value = true;
  }
}

// ─── 面板位置 ───
const isPanelDragging = ref(false);
const panelOffset = ref<{ x: number; y: number } | null>(null);
let panelDragStart = { x: 0, y: 0 };
let panelDragBase = { x: 0, y: 0 };
let panelHasMoved = false;

function calcPanelInitPos() {
  if (isMobile.value) return { x: 0, y: 0 };
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  const left = Math.max(EDGE_GAP, (vw - panelSize.w) / 2);
  const top = Math.max(EDGE_GAP, (vh - panelSize.h) / 2);
  return { x: left, y: top };
}

const panelStyle = computed(() => {
  if (isMobile.value) {
    const vh = safeViewHeight.value || hostWindow.innerHeight;
    const h = Math.floor(vh * 0.92);
    const topPos = vh - h;
    return { left: '0', top: topPos + 'px', width: '100vw', height: h + 'px' };
  }
  const pos = panelOffset.value ?? calcPanelInitPos();
  const vh = hostWindow.innerHeight;
  const clampedH = Math.min(panelSize.h, Math.floor(vh * 0.9));
  return {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${panelSize.w}px`,
    height: `${clampedH}px`,
  };
});

watch(isPanelOpen, open => { if (open) panelOffset.value = null; });

function onPanelPointerDown(e: PointerEvent) {
  if (e.button !== 0 || isMobile.value) return;
  e.preventDefault();
  isPanelDragging.value = false;
  panelHasMoved = false;
  panelDragStart = { x: e.clientX, y: e.clientY };
  const cur = panelOffset.value ?? calcPanelInitPos();
  panelDragBase = { x: cur.x, y: cur.y };
  hostWindow.addEventListener('pointermove', onPanelPointerMove);
  hostWindow.addEventListener('pointerup', onPanelPointerUp);
}

function onPanelPointerMove(e: PointerEvent) {
  const dx = e.clientX - panelDragStart.x;
  const dy = e.clientY - panelDragStart.y;
  if (!panelHasMoved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
  panelHasMoved = true;
  isPanelDragging.value = true;
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  panelOffset.value = {
    x: _.clamp(panelDragBase.x + dx, EDGE_GAP, Math.max(EDGE_GAP, vw - panelSize.w - EDGE_GAP)),
    y: _.clamp(panelDragBase.y + dy, EDGE_GAP, Math.max(EDGE_GAP, vh - panelSize.h - EDGE_GAP)),
  };
}

function onPanelPointerUp() {
  hostWindow.removeEventListener('pointermove', onPanelPointerMove);
  hostWindow.removeEventListener('pointerup', onPanelPointerUp);
  isPanelDragging.value = false;
}

// ─── 面板可调整大小 ───
let resizeStart = { x: 0, y: 0 };
let resizeBaseW = 0;
let resizeBaseH = 0;

function onResizePointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();
  resizeStart = { x: e.clientX, y: e.clientY };
  resizeBaseW = panelSize.w;
  resizeBaseH = panelSize.h;
  hostWindow.addEventListener('pointermove', onResizePointerMove);
  hostWindow.addEventListener('pointerup', onResizePointerUp);
}

function onResizePointerMove(e: PointerEvent) {
  const dw = e.clientX - resizeStart.x;
  // 4:3 比例锁定：以宽度为主轴，高度自动跟随
  const newW = Math.max(MIN_PANEL_W, resizeBaseW + dw);
  panelSize.w = newW;
  panelSize.h = Math.round(newW * 3 / 4);
}

function onResizePointerUp() {
  hostWindow.removeEventListener('pointermove', onResizePointerMove);
  hostWindow.removeEventListener('pointerup', onResizePointerUp);
  savePanelSize({ w: panelSize.w, h: panelSize.h });
}

// ─── 手机下拉关闭手势 ───
let swipeStartY = 0;
let swipeStartTime = 0;

function onSwipeDown(e: PointerEvent) {
  if (!isMobile.value) return;
  e.preventDefault();
  swipeStartY = e.clientY;
  swipeStartTime = Date.now();
  hostWindow.addEventListener('pointerup', onSwipeUp);
}

function onSwipeUp(e: PointerEvent) {
  hostWindow.removeEventListener('pointerup', onSwipeUp);
  const dy = e.clientY - swipeStartY;
  const dt = Date.now() - swipeStartTime;
  if (dy > 60 || (dy > 30 && dt < 200)) {
    isPanelOpen.value = false;
  }
}

// ─── 安全高度 ───
function updateSafeViewHeight() {
  const vv = (hostWindow as any).visualViewport;
  safeViewHeight.value = vv ? vv.height : hostWindow.innerHeight;
}

// ─── resize ───
const onResize = () => {
  windowWidth.value = hostWindow.innerWidth;
  windowHeight.value = hostWindow.innerHeight;
  updateSafeViewHeight();
  setFabPos(fabPos.x, fabPos.y);
};
onMounted(() => {
  hostWindow.addEventListener('resize', onResize);
  updateSafeViewHeight();
  const vv = (hostWindow as any).visualViewport;
  if (vv) vv.addEventListener('resize', updateSafeViewHeight);
});
onUnmounted(() => {
  hostWindow.removeEventListener('resize', onResize);
  const vv = (hostWindow as any).visualViewport;
  if (vv) vv.removeEventListener('resize', updateSafeViewHeight);
});
</script>

<style scoped>
/* === 变量 === */
.ws-root {
  --ws-bg: #06060e;
  --ws-bg-section: #0c0c18;
  --ws-primary: #e51400;
  --ws-primary-dim: rgba(229, 20, 0, 0.15);
  --ws-primary-glow: rgba(229, 20, 0, 0.4);
  --ws-text: #ffffff;
  --ws-text-dim: #c0c0d4;
  --ws-border: rgba(255, 255, 255, 0.08);
  --ws-glass: rgba(255, 255, 255, 0.03);
  --ws-glass-border: rgba(255, 255, 255, 0.1);
  --ws-success: #34d399;
  --ws-danger: #f87171;
  --ws-warning: #fbbf24;
  font-family: "Noto Sans SC", "Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  line-height: 1.5;
}

/* === FAB === */
.ws-fab {
  position: fixed; width: 44px; height: 44px; border-radius: 50%;
  border: 1px solid var(--ws-primary); background: rgba(6,6,14,0.8); backdrop-filter: blur(8px);
  cursor: grab; display: flex; align-items: center; justify-content: center;
  box-shadow: 0 0 10px var(--ws-primary-glow), 0 3px 14px rgba(0,0,0,0.4);
  color: var(--ws-primary); z-index: 9999; user-select: none; touch-action: none; padding: 0;
  transition: box-shadow .2s, transform .15s, background .2s;
  animation: ws-pulse 3s ease-in-out infinite;
}
.ws-fab:hover { background: var(--ws-primary); color: #fff; box-shadow: 0 0 20px var(--ws-primary-glow), 0 0 30px var(--ws-primary-glow); transform: scale(1.08); animation: none; }
.ws-fab:active, .ws-fab.is-dragging { cursor: grabbing; transform: scale(1); animation: none; }

@keyframes ws-pulse {
  0%, 100% { box-shadow: 0 0 10px var(--ws-primary-glow); }
  50% { box-shadow: 0 0 20px rgba(229, 20, 0, 0.7); }
}

/* === Panel === */
.ws-panel {
  position: fixed; border-radius: 12px; border: 1px solid var(--ws-glass-border);
  background: rgba(6, 6, 14, 0.85); backdrop-filter: blur(12px); box-shadow: 0 0 30px rgba(229, 20, 0, 0.1), 0 10px 40px rgba(0,0,0,.5);
  display: flex; flex-direction: column; overflow: hidden; z-index: 9999; color: var(--ws-text);
}
.ws-panel.mobile { border-radius: 16px 16px 0 0; border: none; border-top: 1px solid var(--ws-primary); box-shadow: 0 -4px 24px rgba(229, 20, 0, 0.2); background: rgba(6, 6, 14, 0.95); }

/* === 顶栏 === */
.ws-panel-top {
  display: flex; align-items: center; padding: 8px 12px;
  border-bottom: 1px solid var(--ws-border); background: rgba(0,0,0,0.3);
  gap: 8px; cursor: grab; user-select: none; touch-action: none; flex-shrink: 0;
}
.mobile .ws-panel-top { cursor: default; padding: 12px 14px; }
.ws-panel-top.dragging { cursor: grabbing; }
.ws-panel-title { font-size: 13px; font-weight: 700; white-space: nowrap; color: var(--ws-text); letter-spacing: 2px; text-shadow: 0 0 5px rgba(255,255,255,0.3); }
.ws-panel-thanks { font-size: 9px; color: var(--ws-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; font-style: italic; opacity: 0.8; letter-spacing: 1px; }

/* === 顶栏搜索 === */
.ws-topbar-search { flex: 1; display: flex; align-items: center; gap: 6px; background: #000; border: 1px solid transparent; border-radius: 8px; padding: 5px 12px; min-width: 0; transition: border-color .2s, box-shadow .2s; }
.ws-topbar-search:hover { border-color: rgba(229, 20, 0, 0.3); }
.ws-topbar-search:focus-within { border-color: var(--ws-primary); box-shadow: 0 0 12px var(--ws-primary-glow); }
.ws-search-icon-sm { flex-shrink: 0; color: var(--ws-primary); opacity: 0.8; transition: all .2s; }
.ws-topbar-search:focus-within .ws-search-icon-sm, .ws-search-bar-mobile:focus-within .ws-search-icon-sm { opacity: 1; filter: drop-shadow(0 0 5px var(--ws-primary)); }
.ws-topbar-search-input { -webkit-appearance: none !important; appearance: none !important; flex: 1; background: transparent !important; border: none !important; outline: none !important; box-shadow: none !important; color: var(--ws-text) !important; font-size: 13px; padding: 2px 0; min-width: 0; letter-spacing: 0.5px; }
.ws-topbar-search-input::placeholder { color: rgba(255, 255, 255, 0.25); }
.ws-search-clear-sm { width: 18px; height: 18px; border-radius: 50%; border: none; background: rgba(255,255,255,0.05); color: var(--ws-text-dim); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; transition: all .2s; padding: 0; }
.ws-search-clear-sm:hover { background: rgba(229, 20, 0, 0.15); color: var(--ws-primary); }

/* === 手机搜索框 === */
.ws-search-bar-mobile { display: flex; align-items: center; gap: 8px; padding: 8px 14px; border-bottom: 1px solid var(--ws-border); background: #000000; flex-shrink: 0; transition: all .2s; }
.ws-search-bar-mobile:focus-within { border-bottom-color: var(--ws-primary); background: rgba(229, 20, 0, 0.03); box-shadow: 0 2px 10px rgba(229, 20, 0, 0.1); }
.ws-search-bar-mobile .ws-topbar-search-input { font-size: 14px; padding: 6px 0; }

.ws-btn-icon { width: 28px; height: 28px; border-radius: 6px; border: 1px solid transparent; background: transparent; color: var(--ws-text-dim); display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: all .15s; }
.ws-btn-icon:hover { background: var(--ws-primary-dim); color: var(--ws-primary); border-color: var(--ws-primary); box-shadow: 0 0 10px var(--ws-primary-glow); }

/* === 页面切换 === */
.ws-page-switch { display: flex; gap: 0; flex-shrink: 0; border-bottom: 1px solid var(--ws-border); background: rgba(0,0,0,.2); overflow-x: auto; }
.ws-page-switch::-webkit-scrollbar { height: 0; }
.ws-page-btn { position: relative; flex: 1; padding: 10px 0; font-size: 12px; font-weight: 500; color: var(--ws-text-dim); background: transparent; border: none; cursor: pointer; transition: all .3s; text-align: center; white-space: nowrap; min-width: 0; letter-spacing: 1px; }
.ws-page-btn:hover { color: var(--ws-text); text-shadow: 0 0 8px rgba(255,255,255,0.3); }
.ws-page-btn.active { color: var(--ws-text); font-weight: 700; text-shadow: 0 0 8px rgba(255,255,255,0.5); }
.ws-page-btn::after { content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); width: 0; height: 2px; background: var(--ws-primary); transition: width .3s, box-shadow .3s; border-radius: 2px; }
.ws-page-btn.active::after { width: 60%; box-shadow: 0 0 8px var(--ws-primary); }
.ws-page-btn:hover:not(.active)::after { width: 30%; background: rgba(229, 20, 0, 0.5); }

/* === 面板内容 === */
.ws-panel-content { flex: 1; display: flex; flex-direction: column; min-height: 0; overflow: hidden; position: relative; background: var(--ws-glass); }

/* === 调整大小手柄 === */
.ws-resize-handle { position: absolute; right: 0; bottom: 0; width: 16px; height: 16px; cursor: nwse-resize; z-index: 5; }
.ws-resize-handle::after { content: ''; position: absolute; right: 3px; bottom: 3px; width: 8px; height: 8px; border-right: 2px solid var(--ws-primary-glow); border-bottom: 2px solid var(--ws-primary-glow); transition: border-color .2s; }
.ws-resize-handle:hover::after { border-color: var(--ws-primary); }

/* === 手机适配 === */
.mobile .ws-page-btn { padding: 12px 0; font-size: 13px; }

/* === 手机下拉关闭指示条 === */
.ws-swipe-hint { display: flex; justify-content: center; padding: 6px 0 2px; cursor: pointer; flex-shrink: 0; background: rgba(0,0,0,.3); touch-action: none; }
.ws-swipe-bar { width: 36px; height: 4px; border-radius: 2px; background: rgba(255,255,255,.2); transition: background .15s; }
.ws-swipe-hint:active .ws-swipe-bar { background: var(--ws-primary); box-shadow: 0 0 8px var(--ws-primary-glow); }

/* === 手机底部关闭栏 === */
.ws-mobile-close-bar { flex-shrink: 0; padding: 8px 12px; padding-bottom: max(12px, env(safe-area-inset-bottom, 12px)); border-top: 1px solid var(--ws-border); background: rgba(0,0,0,.5); display: flex; justify-content: center; }
.ws-mobile-close-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 24px; border-radius: 8px; border: 1px solid var(--ws-primary-dim); background: rgba(229,20,0,.06); color: var(--ws-primary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; width: 100%; justify-content: center; letter-spacing: 1px; }
.ws-mobile-close-btn:hover, .ws-mobile-close-btn:active { background: var(--ws-primary); color: #fff; box-shadow: 0 0 15px var(--ws-primary-glow); }

/* === 过渡动画 === */
.ws-fab-enter-active, .ws-fab-leave-active { transition: opacity .2s ease; }
.ws-fab-enter-from, .ws-fab-leave-to { opacity: 0; }

.ws-panel-enter-active, .ws-panel-leave-active { transition: all .25s ease; }
.ws-panel-enter-from { opacity: 0; transform: translateY(12px) scale(0.97); }
.ws-panel-leave-to { opacity: 0; transform: translateY(12px) scale(0.97); }
.mobile.ws-panel-enter-from { transform: translateY(100%); }
.mobile.ws-panel-leave-to { transform: translateY(100%); }
</style>
