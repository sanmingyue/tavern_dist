<template>
  <div class="gxmy-root">
    <Transition name="gxmy-fab">
      <button
        class="gxmy-fab"
        :class="{ 'is-dragging': isDragging, 'is-open': isPanelOpen }"
        :style="[fabStyle, { transform: `scale(${uiScale})`, transformOrigin: 'center' }]"
        title="高悬明月"
        @pointerdown="onFabPointerDown"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M18.5 15.2A8.2 8.2 0 0 1 8.8 4.1a8.8 8.8 0 1 0 10.9 10.9c-.4.1-.8.2-1.2.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
          <path d="M15.8 3.8h3.2M17.4 2.2v3.2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </Transition>

    <Transition name="gxmy-panel">
      <div
        v-if="isPanelOpen"
        id="gxmy-panel"
        class="gxmy-panel"
        :class="{ mobile: isMobile }"
        :style="[panelStyle, { transform: `scale(${uiScale})`, transformOrigin: 'center center' }]"
      >
        <div v-if="isMobile" class="gxmy-swipe-hint" @pointerdown="onSwipeDown">
          <div class="gxmy-swipe-bar" />
        </div>

        <div class="gxmy-panel-top" :class="{ dragging: isPanelDragging }" @pointerdown="!isMobile && onPanelPointerDown($event)">
          <div class="gxmy-title-mark" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18.4 15A7.7 7.7 0 0 1 9.1 4.2 8.3 8.3 0 1 0 19.8 14c-.5.4-1 .7-1.4 1Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
            </svg>
          </div>
          <span class="gxmy-panel-title">高悬明月</span>
          <span class="gxmy-panel-subtitle">{{ statusLine }}</span>
          <button class="gxmy-icon-btn" title="收起" @click="isPanelOpen = false" @pointerdown.stop>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div class="gxmy-tab-switch">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="gxmy-tab-btn"
            :class="{ active: currentTab === tab.key }"
            @click="currentTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="gxmy-panel-content">
          <section v-if="currentTab === 'overview'" class="gxmy-section">
            <div class="gxmy-status-grid">
              <div class="gxmy-status-item">
                <span>运行</span>
                <strong>{{ store.settings.enabled ? '已启用' : '已停用' }}</strong>
              </div>
              <div class="gxmy-status-item">
                <span>镜像源</span>
                <strong>{{ mirrorSourceText }}</strong>
              </div>
              <div class="gxmy-status-item">
                <span>楼层</span>
                <strong>{{ store.status.totalFloors }}</strong>
              </div>
              <div class="gxmy-status-item">
                <span>视图</span>
                <strong>{{ store.status.manualReveal ? '真实楼层' : '视觉0层' }}</strong>
              </div>
            </div>

            <div class="gxmy-control-list">
              <label class="gxmy-toggle-row">
                <span>启用0层锁定</span>
                <input type="checkbox" :checked="store.settings.enabled" @change="setBoolean('enabled', $event)" />
              </label>
              <label class="gxmy-toggle-row">
                <span>隐藏0层以外楼层</span>
                <input type="checkbox" :checked="store.settings.hideNonZero" @change="setBoolean('hideNonZero', $event)" />
              </label>
              <label class="gxmy-toggle-row">
                <span>流式输出同步到0层</span>
                <input type="checkbox" :checked="store.settings.streamPreview" @change="setBoolean('streamPreview', $event)" />
              </label>
              <label class="gxmy-toggle-row">
                <span>发送后预览用户输入</span>
                <input type="checkbox" :checked="store.settings.previewUserInput" @change="setBoolean('previewUserInput', $event)" />
              </label>
            </div>

            <div class="gxmy-actions">
              <button class="gxmy-action primary" @click="controller.mirrorNow('手动同步')">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.7-5.6M20 12a8 8 0 0 1-13.7 5.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M18 3v4h-4M6 21v-4h4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                立即同步
              </button>
              <button class="gxmy-action" @click="controller.toggleRevealLatest()">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.8"/></svg>
                {{ store.status.manualReveal ? '回到0层' : '查看最新楼层' }}
              </button>
              <button class="gxmy-action" @click="controller.hideAgain()">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4l16 16M9.9 5.2A9.8 9.8 0 0 1 12 5c5.9 0 9.5 7 9.5 7a14.6 14.6 0 0 1-3 3.8M6.2 6.8A15.7 15.7 0 0 0 2.5 12S6.1 19 12 19a9.7 9.7 0 0 0 4-.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
                恢复锁定
              </button>
            </div>

            <p v-if="store.status.lastError" class="gxmy-error">{{ store.status.lastError }}</p>
          </section>

          <section v-else-if="currentTab === 'style'" class="gxmy-section">
            <div class="gxmy-editor-head">
              <span>0层美化 CSS</span>
              <div class="gxmy-mini-actions">
                <button @click="copyCss">导出复制</button>
                <button @click="saveCss">保存导入</button>
                <button @click="resetCss">恢复默认</button>
              </div>
            </div>
            <textarea v-model="cssDraft" class="gxmy-css-editor" spellcheck="false" />
            <div class="gxmy-hint">建议选择器锁定为 #chat.gxmy-zero-lock[data-gxmy-hide="true"] &gt; .mes[data-gxmy-visual-zero="true"]。</div>
          </section>

          <section v-else class="gxmy-section">
            <div class="gxmy-field">
              <span>镜像来源</span>
              <div class="gxmy-segmented">
                <button :class="{ active: store.settings.mirrorMode === 'latest_assistant' }" @click="store.patchSettings({ mirrorMode: 'latest_assistant' })">最新AI</button>
                <button :class="{ active: store.settings.mirrorMode === 'latest_message' }" @click="store.patchSettings({ mirrorMode: 'latest_message' })">最新消息</button>
              </div>
            </div>

            <label class="gxmy-field">
              <span>同步延迟</span>
              <input class="gxmy-number" type="number" min="0" max="5000" step="50" :value="store.settings.mirrorDelayMs" @change="setNumber('mirrorDelayMs', $event)" />
            </label>

            <label class="gxmy-toggle-row">
              <span>调试显示隐藏楼层</span>
              <input type="checkbox" :checked="store.settings.debugShowHidden" @change="setBoolean('debugShowHidden', $event)" />
            </label>

            <div class="gxmy-actions">
              <button class="gxmy-action" @click="controller.mirrorNow('高级同步')">刷新视觉0层</button>
              <button class="gxmy-action" @click="controller.toggleRevealLatest()">
                {{ store.status.manualReveal ? '回到视觉0层' : '查看真实楼层' }}
              </button>
            </div>
          </section>
        </div>

        <div v-if="isMobile" class="gxmy-mobile-close-bar">
          <button class="gxmy-mobile-close-btn" @click="isPanelOpen = false">收起面板</button>
        </div>

        <div v-if="!isMobile" class="gxmy-resize-handle" @pointerdown="onResizePointerDown" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue';
import { DEFAULT_CUSTOM_CSS, type ZeroSettings, useZeroStore } from './stores/zeroStore';
import type { ZeroLockController } from './core/zeroLock';

const store = useZeroStore();
const controller = inject<ZeroLockController>('gxmy_controller')!;

const uiScale = computed(() => {
  const scales: Record<number, number> = { 1: 1, 2: 1.12, 3: 1.22 };
  return scales[store.settings.fontSize] ?? 1;
});

const FAB_SIZE = 44;
const EDGE_GAP = 8;
const DRAG_THRESHOLD = 4;
const MIN_PANEL_W = 400;
const MIN_PANEL_H = 430;
const DEFAULT_PANEL_W = 500;
const DEFAULT_PANEL_H = 580;
const STORAGE_KEY = 'gxmy_fab_pos';
const PANEL_SIZE_KEY = 'gxmy_panel_size';

const hostWindow = window.parent;
const windowWidth = ref(hostWindow.innerWidth);
const windowHeight = ref(hostWindow.innerHeight);
const safeViewHeight = ref(hostWindow.innerHeight);
const isMobile = computed(() => windowWidth.value <= 768);

const tabs = [
  { key: 'overview' as const, label: '总览' },
  { key: 'style' as const, label: '美化' },
  { key: 'advanced' as const, label: '高级' },
];
const currentTab = ref<'overview' | 'style' | 'advanced'>('overview');
const isPanelOpen = ref(false);
const cssDraft = ref(store.settings.customCss || DEFAULT_CUSTOM_CSS);

watch(
  () => store.settings.customCss,
  css => {
    cssDraft.value = css;
  },
);

const statusLine = computed(() => {
  if (!store.settings.enabled) return '已停用';
  if (store.status.isGenerating) return '生成中';
  return store.status.lastReason || '待机';
});

const mirrorSourceText = computed(() => {
  if (store.status.lastMirroredId === null) return '等待同步';
  if (store.status.lastMirroredId === 0) return '原始0层';
  return `#${store.status.lastMirroredId}`;
});

function setBoolean(key: keyof ZeroSettings, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  store.patchSettings({ [key]: checked } as Partial<ZeroSettings>);
}

function setNumber(key: keyof ZeroSettings, event: Event) {
  const value = Number((event.target as HTMLInputElement).value);
  store.patchSettings({ [key]: value } as Partial<ZeroSettings>);
}

function copyCss() {
  builtin.copyText(cssDraft.value);
  toastr.success('CSS 已复制');
}

function saveCss() {
  store.patchSettings({ customCss: cssDraft.value });
  toastr.success('CSS 已保存');
}

function resetCss() {
  cssDraft.value = DEFAULT_CUSTOM_CSS;
  store.resetCustomCss();
}

function readPanelSize() {
  try {
    const raw = hostWindow.localStorage.getItem(PANEL_SIZE_KEY);
    if (raw) return JSON.parse(raw) as { w: number; h: number };
  } catch {
    // ignore
  }
  return { w: DEFAULT_PANEL_W, h: DEFAULT_PANEL_H };
}

function savePanelSize(size: { w: number; h: number }) {
  try {
    hostWindow.localStorage.setItem(PANEL_SIZE_KEY, JSON.stringify(size));
  } catch {
    // ignore
  }
}

const panelSize = reactive(readPanelSize());

function defaultFabPos() {
  return { x: hostWindow.innerWidth - FAB_SIZE - 16, y: hostWindow.innerHeight * 0.36 };
}

function readFabPos() {
  try {
    const raw = hostWindow.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { x: number; y: number };
  } catch {
    // ignore
  }
  return defaultFabPos();
}

function saveFabPos(pos: { x: number; y: number }) {
  try {
    hostWindow.localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
  } catch {
    // ignore
  }
}

function clampPos(x: number, y: number) {
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  return {
    x: _.clamp(x, EDGE_GAP, Math.max(EDGE_GAP, vw - FAB_SIZE - EDGE_GAP)),
    y: _.clamp(y, EDGE_GAP, Math.max(EDGE_GAP, vh - FAB_SIZE - EDGE_GAP)),
  };
}

const initialFabPos = readFabPos();
const fabPos = reactive(clampPos(initialFabPos.x, initialFabPos.y));
const fabStyle = computed(() => ({ left: `${fabPos.x}px`, top: `${fabPos.y}px` }));

function setFabPos(x: number, y: number) {
  const clamped = clampPos(x, y);
  fabPos.x = clamped.x;
  fabPos.y = clamped.y;
  saveFabPos(clamped);
}

const isDragging = ref(false);
let dragStart = { x: 0, y: 0 };
let dragBase = { x: 0, y: 0 };
let hasMoved = false;

function onFabPointerDown(event: PointerEvent) {
  if (event.button !== 0) return;
  event.preventDefault();
  isDragging.value = false;
  hasMoved = false;
  dragStart = { x: event.screenX, y: event.screenY };
  dragBase = { x: fabPos.x, y: fabPos.y };
  hostWindow.addEventListener('pointermove', onFabPointerMove);
  hostWindow.addEventListener('pointerup', onFabPointerUp);
}

function onFabPointerMove(event: PointerEvent) {
  const dx = event.screenX - dragStart.x;
  const dy = event.screenY - dragStart.y;
  if (!hasMoved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
  hasMoved = true;
  isDragging.value = true;
  setFabPos(dragBase.x + dx, dragBase.y + dy);
}

function onFabPointerUp() {
  hostWindow.removeEventListener('pointermove', onFabPointerMove);
  hostWindow.removeEventListener('pointerup', onFabPointerUp);
  isDragging.value = false;
  if (!hasMoved) isPanelOpen.value = !isPanelOpen.value;
}

const isPanelDragging = ref(false);
const panelOffset = ref<{ x: number; y: number } | null>(null);
let panelDragStart = { x: 0, y: 0 };
let panelDragBase = { x: 0, y: 0 };
let panelHasMoved = false;

function calcPanelInitPos() {
  if (isMobile.value) return { x: 0, y: 0 };
  const vw = hostWindow.innerWidth;
  const vh = hostWindow.innerHeight;
  return {
    x: Math.max(EDGE_GAP, (vw - panelSize.w) / 2),
    y: Math.max(EDGE_GAP, (vh - panelSize.h) / 2),
  };
}

const panelStyle = computed(() => {
  if (isMobile.value) {
    const vh = safeViewHeight.value || hostWindow.innerHeight;
    const h = Math.floor(vh * 0.92);
    return { left: '0', top: `${vh - h}px`, width: '100vw', height: `${h}px` };
  }
  const pos = panelOffset.value ?? calcPanelInitPos();
  const clampedH = Math.min(panelSize.h, Math.floor(hostWindow.innerHeight * 0.9));
  return {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    width: `${panelSize.w}px`,
    height: `${clampedH}px`,
  };
});

watch(isPanelOpen, open => {
  if (open) panelOffset.value = null;
});

function onPanelPointerDown(event: PointerEvent) {
  if (event.button !== 0 || isMobile.value) return;
  event.preventDefault();
  isPanelDragging.value = false;
  panelHasMoved = false;
  panelDragStart = { x: event.screenX, y: event.screenY };
  const current = panelOffset.value ?? calcPanelInitPos();
  panelDragBase = { x: current.x, y: current.y };
  hostWindow.addEventListener('pointermove', onPanelPointerMove);
  hostWindow.addEventListener('pointerup', onPanelPointerUp);
}

function onPanelPointerMove(event: PointerEvent) {
  const dx = event.screenX - panelDragStart.x;
  const dy = event.screenY - panelDragStart.y;
  if (!panelHasMoved && Math.abs(dx) <= DRAG_THRESHOLD && Math.abs(dy) <= DRAG_THRESHOLD) return;
  panelHasMoved = true;
  isPanelDragging.value = true;
  panelOffset.value = {
    x: _.clamp(panelDragBase.x + dx, EDGE_GAP, Math.max(EDGE_GAP, hostWindow.innerWidth - panelSize.w - EDGE_GAP)),
    y: _.clamp(panelDragBase.y + dy, EDGE_GAP, Math.max(EDGE_GAP, hostWindow.innerHeight - panelSize.h - EDGE_GAP)),
  };
}

function onPanelPointerUp() {
  hostWindow.removeEventListener('pointermove', onPanelPointerMove);
  hostWindow.removeEventListener('pointerup', onPanelPointerUp);
  isPanelDragging.value = false;
}

let resizeStart = { x: 0, y: 0 };
let resizeBaseW = 0;
let resizeBaseH = 0;

function onResizePointerDown(event: PointerEvent) {
  if (event.button !== 0) return;
  event.preventDefault();
  event.stopPropagation();
  resizeStart = { x: event.screenX, y: event.screenY };
  resizeBaseW = panelSize.w;
  resizeBaseH = panelSize.h;
  hostWindow.addEventListener('pointermove', onResizePointerMove);
  hostWindow.addEventListener('pointerup', onResizePointerUp);
}

function onResizePointerMove(event: PointerEvent) {
  panelSize.w = Math.max(MIN_PANEL_W, resizeBaseW + (event.screenX - resizeStart.x));
  panelSize.h = Math.max(MIN_PANEL_H, resizeBaseH + (event.screenY - resizeStart.y));
}

function onResizePointerUp() {
  hostWindow.removeEventListener('pointermove', onResizePointerMove);
  hostWindow.removeEventListener('pointerup', onResizePointerUp);
  savePanelSize({ w: panelSize.w, h: panelSize.h });
}

let swipeStartY = 0;
let swipeStartTime = 0;

function onSwipeDown(event: PointerEvent) {
  if (!isMobile.value) return;
  event.preventDefault();
  swipeStartY = event.clientY;
  swipeStartTime = Date.now();
  hostWindow.addEventListener('pointermove', onSwipeMove);
  hostWindow.addEventListener('pointerup', onSwipeUp);
}

function onSwipeMove() {
  // only pointerup decides.
}

function onSwipeUp(event: PointerEvent) {
  hostWindow.removeEventListener('pointermove', onSwipeMove);
  hostWindow.removeEventListener('pointerup', onSwipeUp);
  const dy = event.clientY - swipeStartY;
  const dt = Date.now() - swipeStartTime;
  if (dy > 60 || (dy > 30 && dt < 200)) isPanelOpen.value = false;
}

function updateSafeViewHeight() {
  const vv = (hostWindow as any).visualViewport;
  safeViewHeight.value = vv ? vv.height : hostWindow.innerHeight;
}

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
.gxmy-root {
  --gx-bg: #080b0d;
  --gx-panel: rgba(8, 11, 13, 0.96);
  --gx-soft: rgba(245, 242, 232, 0.08);
  --gx-line: rgba(232, 213, 154, 0.18);
  --gx-line-strong: rgba(232, 213, 154, 0.34);
  --gx-primary: #e8d59a;
  --gx-accent: #67c9bd;
  --gx-text: rgba(245, 242, 232, 0.9);
  --gx-muted: rgba(245, 242, 232, 0.48);
  --gx-danger: #f08f8f;

  position: relative;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  line-height: 1.5;
  pointer-events: none;
}

.gxmy-fab {
  position: fixed;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  color: var(--gx-primary);
  cursor: grab;
  background: radial-gradient(circle at 34% 28%, rgba(232, 213, 154, 0.18), rgba(8, 11, 13, 0.94) 58%);
  border: 1px solid var(--gx-line);
  border-radius: 50%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.42), 0 0 22px rgba(232, 213, 154, 0.12);
  transition: box-shadow 0.18s, filter 0.18s;
  touch-action: none;
  user-select: none;
  pointer-events: auto;
}

.gxmy-fab:hover {
  filter: brightness(1.12);
  box-shadow: 0 12px 34px rgba(0, 0, 0, 0.48), 0 0 28px rgba(232, 213, 154, 0.2);
}

.gxmy-fab.is-dragging,
.gxmy-fab.is-open,
.gxmy-fab:active {
  cursor: grabbing;
  filter: brightness(1);
}

.gxmy-panel {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  color: var(--gx-text);
  background: var(--gx-panel);
  border: 1px solid var(--gx-line);
  border-radius: 12px;
  box-shadow: 0 20px 56px rgba(0, 0, 0, 0.5), 0 0 30px rgba(232, 213, 154, 0.08);
  pointer-events: auto;
}

.gxmy-panel.mobile {
  border: none;
  border-top: 1px solid var(--gx-line);
  border-radius: 16px 16px 0 0;
}

.gxmy-panel-top {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  padding: 9px 12px;
  cursor: grab;
  background: rgba(8, 11, 13, 0.84);
  border-bottom: 1px solid var(--gx-line);
  touch-action: none;
  user-select: none;
}

.mobile .gxmy-panel-top {
  padding: 12px 14px;
  cursor: default;
}

.gxmy-panel-top.dragging {
  cursor: grabbing;
}

.gxmy-title-mark {
  display: flex;
  flex-shrink: 0;
  color: var(--gx-primary);
}

.gxmy-panel-title {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--gx-primary);
  white-space: nowrap;
}

.gxmy-panel-subtitle {
  flex: 1;
  overflow: hidden;
  font-size: 11px;
  color: var(--gx-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gxmy-icon-btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: var(--gx-muted);
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition: all 0.15s;
}

.gxmy-icon-btn:hover {
  color: var(--gx-primary);
  background: rgba(232, 213, 154, 0.1);
}

.gxmy-tab-switch {
  display: flex;
  flex-shrink: 0;
  background: rgba(245, 242, 232, 0.03);
  border-bottom: 1px solid var(--gx-line);
}

.gxmy-tab-btn {
  flex: 1;
  padding: 8px 0;
  font-size: 12px;
  font-weight: 650;
  color: var(--gx-muted);
  text-align: center;
  cursor: pointer;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
}

.gxmy-tab-btn:hover {
  color: var(--gx-text);
  background: rgba(232, 213, 154, 0.05);
}

.gxmy-tab-btn.active {
  color: var(--gx-primary);
  background: rgba(232, 213, 154, 0.1);
  border-bottom-color: var(--gx-primary);
}

.gxmy-panel-content {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 12px;
  overflow: hidden;
}

.gxmy-section {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: auto;
}

.gxmy-section::-webkit-scrollbar,
.gxmy-css-editor::-webkit-scrollbar {
  width: 4px;
}

.gxmy-section::-webkit-scrollbar-thumb,
.gxmy-css-editor::-webkit-scrollbar-thumb {
  background: rgba(232, 213, 154, 0.18);
  border-radius: 4px;
}

.gxmy-status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.gxmy-status-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 58px;
  padding: 9px 10px;
  background: rgba(245, 242, 232, 0.04);
  border: 1px solid rgba(245, 242, 232, 0.08);
  border-radius: 8px;
}

.gxmy-status-item span {
  font-size: 11px;
  color: var(--gx-muted);
}

.gxmy-status-item strong {
  overflow: hidden;
  font-size: 14px;
  font-weight: 700;
  color: var(--gx-text);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.gxmy-control-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.gxmy-toggle-row,
.gxmy-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 38px;
  padding: 8px 10px;
  color: var(--gx-text);
  background: rgba(245, 242, 232, 0.035);
  border: 1px solid rgba(245, 242, 232, 0.07);
  border-radius: 8px;
}

.gxmy-toggle-row span,
.gxmy-field span {
  min-width: 0;
  overflow-wrap: anywhere;
  font-size: 12px;
}

.gxmy-toggle-row input[type='checkbox'] {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  accent-color: var(--gx-primary);
}

.gxmy-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gxmy-action {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 650;
  color: var(--gx-text);
  cursor: pointer;
  background: rgba(245, 242, 232, 0.05);
  border: 1px solid rgba(245, 242, 232, 0.09);
  border-radius: 7px;
  transition: all 0.15s;
}

.gxmy-action svg {
  width: 15px;
  height: 15px;
}

.gxmy-action:hover,
.gxmy-action.primary {
  color: #101111;
  background: var(--gx-primary);
  border-color: var(--gx-primary);
}

.gxmy-editor-head {
  display: flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.gxmy-editor-head > span {
  font-size: 12px;
  font-weight: 700;
  color: var(--gx-primary);
}

.gxmy-mini-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.gxmy-mini-actions button,
.gxmy-segmented button {
  min-height: 28px;
  padding: 5px 9px;
  font-size: 11px;
  color: var(--gx-muted);
  cursor: pointer;
  background: rgba(245, 242, 232, 0.04);
  border: 1px solid rgba(245, 242, 232, 0.08);
  border-radius: 6px;
}

.gxmy-mini-actions button:hover,
.gxmy-segmented button.active {
  color: #101111;
  background: var(--gx-primary);
  border-color: var(--gx-primary);
}

.gxmy-css-editor {
  flex: 1;
  min-height: 240px;
  padding: 10px;
  font-family: Consolas, 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.55;
  color: var(--gx-text);
  resize: none;
  background: #050607;
  border: 1px solid var(--gx-line);
  border-radius: 8px;
  outline: none;
}

.gxmy-css-editor:focus {
  border-color: var(--gx-line-strong);
  box-shadow: 0 0 0 2px rgba(232, 213, 154, 0.08);
}

.gxmy-hint {
  font-size: 11px;
  color: var(--gx-muted);
}

.gxmy-segmented {
  display: inline-flex;
  flex-shrink: 0;
  gap: 4px;
}

.gxmy-number {
  width: 96px;
  padding: 5px 8px;
  color: var(--gx-text);
  background: rgba(5, 6, 7, 0.9);
  border: 1px solid rgba(245, 242, 232, 0.12);
  border-radius: 6px;
}

.gxmy-error {
  padding: 8px 10px;
  margin: 0;
  font-size: 12px;
  color: var(--gx-danger);
  background: rgba(240, 143, 143, 0.08);
  border: 1px solid rgba(240, 143, 143, 0.2);
  border-radius: 8px;
}

.gxmy-resize-handle {
  position: absolute;
  right: 0;
  bottom: 0;
  z-index: 5;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
}

.gxmy-resize-handle::after {
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 8px;
  height: 8px;
  content: '';
  border-right: 2px solid rgba(232, 213, 154, 0.28);
  border-bottom: 2px solid rgba(232, 213, 154, 0.28);
}

.gxmy-swipe-hint {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  padding: 7px 0 3px;
  cursor: pointer;
  background: rgba(8, 11, 13, 0.9);
  touch-action: none;
}

.gxmy-swipe-bar {
  width: 36px;
  height: 4px;
  background: rgba(245, 242, 232, 0.22);
  border-radius: 2px;
}

.gxmy-mobile-close-bar {
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  padding: 8px 12px;
  padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
  background: rgba(8, 11, 13, 0.92);
  border-top: 1px solid var(--gx-line);
}

.gxmy-mobile-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 36px;
  color: var(--gx-primary);
  cursor: pointer;
  background: rgba(232, 213, 154, 0.07);
  border: 1px solid rgba(232, 213, 154, 0.22);
  border-radius: 8px;
}

.gxmy-fab-enter-active,
.gxmy-fab-leave-active,
.gxmy-panel-enter-active,
.gxmy-panel-leave-active {
  transition: opacity 0.2s ease;
}

.gxmy-fab-enter-from,
.gxmy-fab-leave-to,
.gxmy-panel-enter-from,
.gxmy-panel-leave-to {
  opacity: 0;
}

@media (max-width: 520px) {
  .gxmy-status-grid {
    grid-template-columns: 1fr;
  }

  .gxmy-actions,
  .gxmy-editor-head {
    flex-direction: column;
    align-items: stretch;
  }

  .gxmy-mini-actions {
    justify-content: flex-start;
  }
}
</style>
