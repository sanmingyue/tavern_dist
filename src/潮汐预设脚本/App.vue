<template>
  <div class="chaoxi-root" :class="[`theme-${themeMode}`, `font-scale-${fontScale}`]">
    <!-- 折叠态: 悬浮按钮 -->
    <Transition name="chaoxi-fab">
      <button
        v-if="!isPanelOpen"
        ref="fabRef"
        class="chaoxi-fab"
        :class="{ 'is-dragging': isDragging }"
        :style="fabStyle"
        @pointerdown="onFabPointerDown"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          <path d="M8 12c0-2 1-4 4-4s4 2 4 4-1 4-4 4-4-2-4-4z" opacity="0.5" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      </button>
    </Transition>

    <!-- 展开态: 面板 -->
    <Transition name="chaoxi-panel">
      <div v-if="isPanelOpen" class="chaoxi-panel" :class="{ mobile: isMobile }" :style="panelStyle">
        <!-- 手机下拉关闭指示条 -->
        <div
          v-if="isMobile"
          class="chaoxi-swipe-hint"
          @pointerdown="onSwipeDown"
        >
          <div class="chaoxi-swipe-bar" />
        </div>
        <!-- 顶栏 -->
        <div
          class="chaoxi-panel-top"
          :class="{ dragging: isPanelDragging }"
          @pointerdown="!isMobile && onPanelPointerDown($event)"
        >
          <span class="chaoxi-panel-title" @click.stop="onTitleClick">潮去汐来，她一直在</span>
          <span class="chaoxi-panel-preset">{{ currentPresetName }}</span>
          <!-- 搜索框（PC在顶栏） -->
          <div v-if="!isMobile" class="chaoxi-topbar-search">
            <svg class="chaoxi-search-icon-sm" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              class="chaoxi-topbar-search-input"
              v-model="searchQuery"
              placeholder="搜索…"
              spellcheck="false"
              @pointerdown.stop
            />
            <button v-if="searchQuery" class="chaoxi-search-clear-sm" @click="searchQuery = ''" @pointerdown.stop>×</button>
          </div>
          <div v-if="!isMobile" class="chaoxi-topbar-controls" @pointerdown.stop>
            <div class="chaoxi-font-control" aria-label="字体大小">
              <span class="chaoxi-control-label">字体大小</span>
              <button
                v-for="size in FONT_SIZES"
                :key="size"
                class="chaoxi-control-chip"
                :class="{ active: fontScale === size }"
                @click="setFontScale(size)"
              >{{ size }}</button>
            </div>
            <button
              class="chaoxi-theme-toggle"
              :class="{ active: themeMode === 'light' }"
              @click="toggleThemeMode"
            >亮色</button>
          </div>
          <button class="chaoxi-btn-icon" @click="isPanelOpen = false" @pointerdown.stop>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <!-- 手机搜索框 -->
        <div v-if="isMobile" class="chaoxi-search-bar-mobile">
          <svg class="chaoxi-search-icon-sm" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input class="chaoxi-topbar-search-input" v-model="searchQuery" placeholder="搜索条目…" spellcheck="false" />
          <button v-if="searchQuery" class="chaoxi-search-clear-sm" @click="searchQuery = ''">×</button>
          <div class="chaoxi-topbar-controls mobile-controls">
            <div class="chaoxi-font-control" aria-label="字体大小">
              <span class="chaoxi-control-label">字体大小</span>
              <button
                v-for="size in FONT_SIZES"
                :key="size"
                class="chaoxi-control-chip"
                :class="{ active: fontScale === size }"
                @click="setFontScale(size)"
              >{{ size }}</button>
            </div>
            <button
              class="chaoxi-theme-toggle"
              :class="{ active: themeMode === 'light' }"
              @click="toggleThemeMode"
            >亮色</button>
          </div>
        </div>

        <!-- 页面切换 -->
        <div class="chaoxi-page-switch">
          <button
            class="chaoxi-page-btn"
            :class="{ active: currentPage === 'preset' }"
            @click="currentPage = 'preset'"
          >预设视图</button>
          <button
            class="chaoxi-page-btn"
            :class="{ active: currentPage === 'custom' }"
            @click="currentPage = 'custom'"
          >自定义视图</button>
          <button
            class="chaoxi-page-btn"
            :class="{ active: currentPage === 'manager' }"
            @click="currentPage = 'manager'"
          >预设管理</button>
          <button
            class="chaoxi-page-btn"
            :class="{ active: currentPage === 'store' }"
            @click="currentPage = 'store'"
          >预设仓库</button>
        </div>

        <!-- 页面内容 -->
        <div class="chaoxi-panel-content">
          <PresetView
            v-if="currentPage === 'preset'"
            ref="presetViewRef"
            :search-query="searchQuery"
            :groups="customGroups"
            :on-refresh="onRefresh"
            :on-add-to-group="onAddToGroup"
          />
          <CustomView
            v-if="currentPage === 'custom'"
            ref="customViewRef"
            :search-query="searchQuery"
            :is-mobile="isMobile"
          />
          <PresetManagerView
            v-if="currentPage === 'manager'"
            ref="managerViewRef"
            :is-mobile="isMobile"
            @preset-switched="onPresetSwitched"
          />
          <PresetStoreView
            v-if="currentPage === 'store'"
          />
          <CreditsView
            v-if="currentPage === 'credits'"
            @back="currentPage = previousPage"
          />
        </div>

        <!-- 手机底部关闭栏 -->
        <div v-if="isMobile" class="chaoxi-mobile-close-bar">
          <button class="chaoxi-mobile-close-btn" @click="isPanelOpen = false">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="4 14 10 14 10 20" />
              <polyline points="20 10 14 10 14 4" />
              <line x1="14" y1="10" x2="21" y2="3" />
              <line x1="3" y1="21" x2="10" y2="14" />
            </svg>
            收起面板
          </button>
        </div>

        <!-- PC 可调整大小的手柄 -->
        <div
          v-if="!isMobile"
          class="chaoxi-resize-handle"
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
  DEFAULT_PANEL_W,
  DEFAULT_PANEL_H,
  MIN_PANEL_W,
  MIN_PANEL_H,
  readPanelSize,
  savePanelSize,
  readConfig,
  type CustomGroup,
} from './types';
import PresetView from './PresetView.vue';
import CustomView from './CustomView.vue';
import PresetManagerView from './PresetManagerView.vue';
import PresetStoreView from './PresetStoreView.vue';
import CreditsView from './CreditsView.vue';

// ─── 宿主窗口 ───
const hostWindow = window.parent;
const windowWidth = ref(hostWindow.innerWidth);
const windowHeight = ref(hostWindow.innerHeight);
const safeViewHeight = ref(hostWindow.innerHeight);
const isMobile = computed(() => windowWidth.value <= 768);
const THEME_KEY = 'chaoxi-preset-theme';
const FONT_SCALE_KEY = 'chaoxi-preset-font-scale';
type ThemeMode = 'dark' | 'light';
type FontScale = 1 | 2 | 3;
const FONT_SIZES: FontScale[] = [1, 2, 3];

function readThemeMode(): ThemeMode {
  try {
    return hostWindow.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function readFontScale(): FontScale {
  try {
    const value = Number(hostWindow.localStorage.getItem(FONT_SCALE_KEY));
    return FONT_SIZES.includes(value as FontScale) ? (value as FontScale) : 1;
  } catch {
    return 1;
  }
}

const themeMode = ref<ThemeMode>(readThemeMode());
const fontScale = ref<FontScale>(readFontScale());

function setThemeMode(mode: ThemeMode) {
  themeMode.value = mode;
  try { hostWindow.localStorage.setItem(THEME_KEY, mode); } catch { /* ignore */ }
}

function toggleThemeMode() {
  setThemeMode(themeMode.value === 'light' ? 'dark' : 'light');
}

function setFontScale(size: FontScale) {
  fontScale.value = size;
  try { hostWindow.localStorage.setItem(FONT_SCALE_KEY, String(size)); } catch { /* ignore */ }
}

// ─── 面板状态 ───
const isPanelOpen = ref(false);
const currentPage = ref<'preset' | 'custom' | 'manager' | 'store' | 'credits'>('preset');
const previousPage = ref<'preset' | 'custom' | 'manager' | 'store'>('preset');
const searchQuery = ref('');
const currentPresetName = ref('');
const customGroups = ref<CustomGroup[]>([]);

// ─── 子组件引用 ───
const presetViewRef = ref<InstanceType<typeof PresetView> | null>(null);
const customViewRef = ref<InstanceType<typeof CustomView> | null>(null);
const managerViewRef = ref<InstanceType<typeof PresetManagerView> | null>(null);

// ─── 面板尺寸 ───
const panelSize = reactive(readPanelSize());

// ─── 刷新 ───
function onRefresh() {
  try {
    currentPresetName.value = getLoadedPresetName();
    const config = readConfig();
    customGroups.value = config.groups;
  } catch (e) {
    console.warn('[潮汐预设脚本] 刷新配置失败:', e);
  }
}

function refreshAll() {
  onRefresh();
  presetViewRef.value?.refresh();
  customViewRef.value?.refresh();
  managerViewRef.value?.refresh();
}

function onPresetSwitched() {
  onRefresh();
  presetViewRef.value?.refresh();
  customViewRef.value?.refresh();
}

// 初始刷新
onRefresh();
const refreshTimer = setInterval(onRefresh, 5000);
onUnmounted(() => clearInterval(refreshTimer));

// ─── 标题点击进入致谢页面 ───
function onTitleClick() {
  if (currentPage.value !== 'credits') {
    previousPage.value = currentPage.value as 'preset' | 'custom' | 'manager' | 'store';
    currentPage.value = 'credits';
  }
}

function onAddToGroup(groupId: string, names: string[]) {
  customViewRef.value?.addToGroup(groupId, names);
  onRefresh();
}

// ─── FAB 位置 ───
function defaultFabPos() {
  return { x: hostWindow.innerWidth - FAB_SIZE - 16, y: hostWindow.innerHeight * 0.35 };
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
    refreshAll();
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
  // 居中显示
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
  // 面板高度不超过屏幕 90%
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
  const dh = e.clientY - resizeStart.y;
  panelSize.w = Math.max(MIN_PANEL_W, resizeBaseW + dw);
  panelSize.h = Math.max(MIN_PANEL_H, resizeBaseH + dh);
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
  hostWindow.addEventListener('pointermove', onSwipeMove);
  hostWindow.addEventListener('pointerup', onSwipeUp);
}

function onSwipeMove(e: PointerEvent) {
  const dy = e.clientY - swipeStartY;
  // 只响应向下滑动
  if (dy < 0) return;
}

function onSwipeUp(e: PointerEvent) {
  hostWindow.removeEventListener('pointermove', onSwipeMove);
  hostWindow.removeEventListener('pointerup', onSwipeUp);
  const dy = e.clientY - swipeStartY;
  const dt = Date.now() - swipeStartTime;
  // 下滑超过 60px 或快速下滑（200ms 内 30px）即关闭
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
/* ═══ 变量 ═══ */
.chaoxi-root {
  --cx-bg: #050810;
  --cx-bg-soft: rgba(5, 8, 16, 0.8);
  --cx-bg-panel: rgba(5, 8, 16, 0.4);
  --cx-surface: rgba(255, 255, 255, 0.04);
  --cx-surface-hover: rgba(77, 201, 246, 0.08);
  --cx-primary: #4dc9f6;
  --cx-primary-dim: rgba(77, 201, 246, 0.15);
  --cx-text: rgba(255, 255, 255, 0.88);
  --cx-text-dim: rgba(255, 255, 255, 0.4);
  --cx-text-muted: rgba(255, 255, 255, 0.25);
  --cx-border: rgba(77, 201, 246, 0.15);
  --cx-border-soft: rgba(77, 201, 246, 0.08);
  --cx-font-step: 0px;
  --cx-shadow: 0 0 30px rgba(77, 201, 246, 0.08), 0 10px 40px rgba(0, 0, 0, 0.5);
  --cx-overlay: rgba(0, 0, 0, 0.55);

  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  line-height: 1.5;
}
.chaoxi-root.theme-light {
  --cx-bg: #f8fbff;
  --cx-bg-soft: rgba(255, 255, 255, 0.92);
  --cx-bg-panel: rgba(236, 246, 255, 0.78);
  --cx-surface: rgba(12, 76, 112, 0.06);
  --cx-surface-hover: rgba(14, 116, 144, 0.1);
  --cx-primary: #087ea4;
  --cx-primary-dim: rgba(8, 126, 164, 0.13);
  --cx-text: rgba(15, 23, 42, 0.9);
  --cx-text-dim: rgba(15, 23, 42, 0.56);
  --cx-text-muted: rgba(15, 23, 42, 0.35);
  --cx-border: rgba(8, 126, 164, 0.2);
  --cx-border-soft: rgba(8, 126, 164, 0.11);
  --cx-shadow: 0 12px 36px rgba(15, 23, 42, 0.16), 0 0 0 1px rgba(8, 126, 164, 0.05);
  --cx-overlay: rgba(15, 23, 42, 0.22);
}
.chaoxi-root.font-scale-2 {
  --cx-font-step: 1px;
}
.chaoxi-root.font-scale-3 {
  --cx-font-step: 2px;
}

/* ═══ FAB ═══ */
.chaoxi-fab {
  position: fixed;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--cx-border);
  background: var(--cx-bg);
  backdrop-filter: blur(8px);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 16px rgba(77, 201, 246, 0.15), 0 3px 14px rgba(0, 0, 0, 0.4);
  color: var(--cx-primary);
  z-index: 9999;
  user-select: none;
  touch-action: none;
  padding: 0;
  transition: box-shadow 0.2s, transform 0.15s;
}
.chaoxi-fab:hover {
  box-shadow: 0 0 24px rgba(77, 201, 246, 0.25), 0 5px 20px rgba(0, 0, 0, 0.5);
  transform: scale(1.08);
}
.chaoxi-fab:active,
.chaoxi-fab.is-dragging {
  cursor: grabbing;
  transform: scale(1);
}

/* ═══ Panel ═══ */
.chaoxi-panel {
  position: fixed;
  border-radius: 12px;
  border: 1px solid var(--cx-border);
  background: var(--cx-bg);
  box-shadow: var(--cx-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  color: var(--cx-text);
}
.chaoxi-panel.mobile {
  border-radius: 16px 16px 0 0;
  border: none;
  border-top: 1px solid var(--cx-border);
  box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.3);
}

/* ═══ 顶栏 ═══ */
.chaoxi-panel-top {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--cx-border);
  background: var(--cx-bg-soft);
  gap: 8px;
  cursor: grab;
  user-select: none;
  touch-action: none;
  flex-shrink: 0;
}
.mobile .chaoxi-panel-top {
  cursor: default;
  padding: 12px 14px;
}
.chaoxi-panel-top.dragging {
  cursor: grabbing;
}
.chaoxi-panel-title {
  font-size: calc(13px + var(--cx-font-step));
  font-weight: 600;
  white-space: nowrap;
  color: var(--cx-primary);
}
.chaoxi-panel-preset {
  font-size: calc(11px + var(--cx-font-step));
  color: var(--cx-text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

/* ═══ 顶栏搜索 ═══ */
.chaoxi-topbar-search {
  flex: 0 1 220px;
  display: flex;
  align-items: center;
  gap: 4px;
  background: var(--cx-surface);
  border: 1px solid var(--cx-border-soft);
  border-radius: 6px;
  padding: 3px 8px;
  min-width: 0;
}
.chaoxi-search-icon-sm {
  flex-shrink: 0;
  color: var(--cx-text-dim);
}
.chaoxi-topbar-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--cx-text);
  font-size: calc(12px + var(--cx-font-step));
  padding: 0;
  min-width: 0;
}
.chaoxi-topbar-search-input::placeholder {
  color: var(--cx-text-muted);
}
.chaoxi-search-clear-sm {
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: var(--cx-text-dim);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.chaoxi-search-clear-sm:hover {
  color: var(--cx-text);
}
.chaoxi-topbar-controls {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.chaoxi-font-control {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 4px;
  border: 1px solid var(--cx-border-soft);
  border-radius: 6px;
  background: var(--cx-surface);
  color: var(--cx-text-dim);
  white-space: nowrap;
}
.chaoxi-control-label {
  padding: 0 4px;
  font-size: calc(11px + var(--cx-font-step));
}
.chaoxi-control-chip,
.chaoxi-theme-toggle {
  min-width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--cx-text-dim);
  font-size: calc(11px + var(--cx-font-step));
  line-height: 1;
  cursor: pointer;
  transition: all 0.15s;
}
.chaoxi-control-chip:hover,
.chaoxi-theme-toggle:hover {
  color: var(--cx-primary);
  background: var(--cx-primary-dim);
}
.chaoxi-control-chip.active,
.chaoxi-theme-toggle.active {
  color: var(--cx-primary);
  background: var(--cx-primary-dim);
  font-weight: 700;
}
.chaoxi-theme-toggle {
  padding: 0 8px;
  border: 1px solid var(--cx-border-soft);
  background: var(--cx-surface);
  white-space: nowrap;
}

/* ═══ 手机搜索框 ═══ */
.chaoxi-search-bar-mobile {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--cx-border);
  background: var(--cx-bg-panel);
  flex-shrink: 0;
  flex-wrap: wrap;
}
.chaoxi-search-bar-mobile .chaoxi-topbar-search-input {
  font-size: calc(13px + var(--cx-font-step));
  padding: 4px 0;
  min-width: 90px;
}
.mobile-controls {
  width: 100%;
  justify-content: flex-end;
}

.chaoxi-btn-icon {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--cx-text-dim);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s;
}
.chaoxi-btn-icon:hover {
  background: var(--cx-primary-dim);
  color: var(--cx-primary);
}

/* ═══ 页面切换 ═══ */
.chaoxi-page-switch {
  display: flex;
  gap: 0;
  flex-shrink: 0;
  border-bottom: 1px solid var(--cx-border);
  background: var(--cx-bg-panel);
}
.chaoxi-page-btn {
  flex: 1;
  padding: 7px 0;
  font-size: calc(12px + var(--cx-font-step));
  font-weight: 600;
  color: var(--cx-text-dim);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  text-align: center;
}
.chaoxi-page-btn:hover {
  color: var(--cx-text);
  background: var(--cx-surface-hover);
}
.chaoxi-page-btn.active {
  color: var(--cx-primary);
  border-bottom-color: var(--cx-primary);
  background: var(--cx-primary-dim);
}

/* ═══ 面板内容 ═══ */
.chaoxi-panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

/* ═══ 调整大小手柄 ═══ */
.chaoxi-resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
  z-index: 5;
}
.chaoxi-resize-handle::after {
  content: '';
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 8px;
  height: 8px;
  border-right: 2px solid rgba(77, 201, 246, 0.25);
  border-bottom: 2px solid rgba(77, 201, 246, 0.25);
}
.chaoxi-resize-handle:hover::after {
  border-color: rgba(77, 201, 246, 0.5);
}

/* ═══ 手机适配 ═══ */
.mobile .chaoxi-page-btn {
  padding: 10px 0;
  font-size: calc(13px + var(--cx-font-step));
}

/* ═══ 手机下拉关闭指示条 ═══ */
.chaoxi-swipe-hint {
  display: flex;
  justify-content: center;
  padding: 6px 0 2px;
  cursor: pointer;
  flex-shrink: 0;
  background: var(--cx-bg-soft);
  touch-action: none;
}
.chaoxi-swipe-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--cx-text-muted);
  transition: background 0.15s;
}
.chaoxi-swipe-hint:active .chaoxi-swipe-bar {
  background: rgba(77, 201, 246, 0.5);
}

/* ═══ 手机底部关闭栏 ═══ */
.chaoxi-mobile-close-bar {
  flex-shrink: 0;
  padding: 8px 12px;
  padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
  border-top: 1px solid var(--cx-border);
  background: var(--cx-bg-soft);
  display: flex;
  justify-content: center;
}
.chaoxi-mobile-close-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 24px;
  border-radius: 8px;
  border: 1px solid rgba(77, 201, 246, 0.2);
  background: rgba(77, 201, 246, 0.06);
  color: var(--cx-primary);
  font-size: calc(13px + var(--cx-font-step));
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  width: 100%;
  justify-content: center;
}
.chaoxi-mobile-close-btn:hover,
.chaoxi-mobile-close-btn:active {
  background: rgba(77, 201, 246, 0.15);
  border-color: rgba(77, 201, 246, 0.4);
}

/* ═══ 子页面主题与字号适配 ═══ */
.chaoxi-panel :deep(.chaoxi-store-title),
.chaoxi-panel :deep(.chaoxi-store-card-name),
.chaoxi-panel :deep(.chaoxi-item-name),
.chaoxi-panel :deep(.chaoxi-dialog-header),
.chaoxi-panel :deep(.chaoxi-modal-title),
.chaoxi-panel :deep(.chaoxi-copy-dialog-header),
.chaoxi-panel :deep(.chaoxi-detail-title),
.chaoxi-panel :deep(.chaoxi-preset-card-name) {
  color: var(--cx-text);
}
.chaoxi-panel :deep(.chaoxi-store-subtitle),
.chaoxi-panel :deep(.chaoxi-store-card-author),
.chaoxi-panel :deep(.chaoxi-store-card-desc),
.chaoxi-panel :deep(.chaoxi-empty),
.chaoxi-panel :deep(.chaoxi-batch-total),
.chaoxi-panel :deep(.chaoxi-manager-label),
.chaoxi-panel :deep(.chaoxi-manager-count),
.chaoxi-panel :deep(.chaoxi-side-nav-title),
.chaoxi-panel :deep(.chaoxi-side-nav-item),
.chaoxi-panel :deep(.chaoxi-group-tab-m),
.chaoxi-panel :deep(.chaoxi-group-tab),
.chaoxi-panel :deep(.chaoxi-btn-tool),
.chaoxi-panel :deep(.chaoxi-btn-add),
.chaoxi-panel :deep(.chaoxi-detail-item-name),
.chaoxi-panel :deep(.chaoxi-regex-name),
.chaoxi-panel :deep(.chaoxi-param-label),
.chaoxi-panel :deep(.chaoxi-modal-message),
.chaoxi-panel :deep(.chaoxi-dialog-item),
.chaoxi-panel :deep(.chaoxi-copy-dialog-item),
.chaoxi-panel :deep(.chaoxi-group-assign-item) {
  color: var(--cx-text-dim);
}
.chaoxi-panel :deep(.chaoxi-store-header),
.chaoxi-panel :deep(.chaoxi-manager-toolbar),
.chaoxi-panel :deep(.chaoxi-batch-toolbar),
.chaoxi-panel :deep(.chaoxi-side-nav),
.chaoxi-panel :deep(.chaoxi-detail-header),
.chaoxi-panel :deep(.chaoxi-group-tabs) {
  background: var(--cx-bg-panel);
  border-color: var(--cx-border-soft);
}
.chaoxi-panel :deep(.chaoxi-store-card),
.chaoxi-panel :deep(.chaoxi-preset-card),
.chaoxi-panel :deep(.chaoxi-item-group),
.chaoxi-panel :deep(.chaoxi-detail-item),
.chaoxi-panel :deep(.chaoxi-regex-item) {
  border-color: var(--cx-border-soft);
}
.chaoxi-panel :deep(.chaoxi-store-card:hover),
.chaoxi-panel :deep(.chaoxi-preset-card:hover),
.chaoxi-panel :deep(.chaoxi-side-nav-item:hover),
.chaoxi-panel :deep(.chaoxi-group-tab:hover),
.chaoxi-panel :deep(.chaoxi-group-tab-m:hover),
.chaoxi-panel :deep(.chaoxi-detail-item:hover),
.chaoxi-panel :deep(.chaoxi-regex-row:hover),
.chaoxi-panel :deep(.chaoxi-dialog-item:hover),
.chaoxi-panel :deep(.chaoxi-copy-dialog-item:hover),
.chaoxi-panel :deep(.chaoxi-menu-item:hover) {
  background: var(--cx-surface-hover);
  color: var(--cx-text);
}
.chaoxi-panel :deep(.chaoxi-group-selector),
.chaoxi-panel :deep(.chaoxi-dialog),
.chaoxi-panel :deep(.chaoxi-copy-dialog),
.chaoxi-panel :deep(.chaoxi-modal) {
  background: var(--cx-bg);
  border-color: var(--cx-border);
  color: var(--cx-text);
  box-shadow: var(--cx-shadow);
}
.chaoxi-panel :deep(.chaoxi-dialog-overlay),
.chaoxi-panel :deep(.chaoxi-modal-overlay) {
  background: var(--cx-overlay);
}
.chaoxi-panel :deep(input),
.chaoxi-panel :deep(textarea),
.chaoxi-panel :deep(select) {
  color: var(--cx-text);
}
.chaoxi-panel :deep(.chaoxi-rename-input),
.chaoxi-panel :deep(.chaoxi-textarea),
.chaoxi-panel :deep(.chaoxi-note-input),
.chaoxi-panel :deep(.chaoxi-regex-code),
.chaoxi-panel :deep(.chaoxi-param-input),
.chaoxi-panel :deep(.chaoxi-param-select),
.chaoxi-panel :deep(.chaoxi-modal-input),
.chaoxi-panel :deep(.chaoxi-dialog-search-input) {
  background: var(--cx-surface);
  border-color: var(--cx-border);
  color: var(--cx-text);
}
.chaoxi-panel :deep(.chaoxi-batch-count),
.chaoxi-panel :deep(.chaoxi-store-tag),
.chaoxi-panel :deep(.chaoxi-side-nav-item.active),
.chaoxi-panel :deep(.chaoxi-group-tab.active),
.chaoxi-panel :deep(.chaoxi-group-tab-m.active),
.chaoxi-panel :deep(.chaoxi-detail-tab.active) {
  color: var(--cx-primary);
}
.chaoxi-panel :deep(.chaoxi-store-title),
.chaoxi-panel :deep(.chaoxi-store-card-name),
.chaoxi-panel :deep(.chaoxi-detail-title),
.chaoxi-panel :deep(.chaoxi-modal-title),
.chaoxi-panel :deep(.chaoxi-dialog-header) {
  font-size: calc(13px + var(--cx-font-step));
}
.chaoxi-panel :deep(.chaoxi-item-name),
.chaoxi-panel :deep(.chaoxi-store-card-desc),
.chaoxi-panel :deep(.chaoxi-group-selector-item),
.chaoxi-panel :deep(.chaoxi-dialog-item),
.chaoxi-panel :deep(.chaoxi-modal-message),
.chaoxi-panel :deep(.chaoxi-preset-card-name),
.chaoxi-panel :deep(.chaoxi-detail-item-name),
.chaoxi-panel :deep(.chaoxi-regex-name),
.chaoxi-panel :deep(.chaoxi-param-label) {
  font-size: calc(12px + var(--cx-font-step));
}
.chaoxi-panel :deep(.chaoxi-btn-tool),
.chaoxi-panel :deep(.chaoxi-btn-add),
.chaoxi-panel :deep(.chaoxi-batch-btn),
.chaoxi-panel :deep(.chaoxi-store-import-btn),
.chaoxi-panel :deep(.chaoxi-manager-btn),
.chaoxi-panel :deep(.chaoxi-modal-btn) {
  font-size: calc(11px + var(--cx-font-step));
}
.chaoxi-panel :deep(.chaoxi-textarea),
.chaoxi-panel :deep(.chaoxi-regex-code) {
  font-size: calc(12px + var(--cx-font-step));
}

/* ═══ 过渡动画 ═══ */
.chaoxi-fab-enter-active,
.chaoxi-fab-leave-active {
  transition: opacity 0.2s ease;
}
.chaoxi-fab-enter-from,
.chaoxi-fab-leave-to {
  opacity: 0;
}

.chaoxi-panel-enter-active,
.chaoxi-panel-leave-active {
  transition: all 0.25s ease;
}
.chaoxi-panel-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
.chaoxi-panel-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.97);
}
.mobile.chaoxi-panel-enter-from {
  transform: translateY(100%);
}
.mobile.chaoxi-panel-leave-to {
  transform: translateY(100%);
}
</style>
