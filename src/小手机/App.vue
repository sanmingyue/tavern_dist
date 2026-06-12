<template>
  <div class="phone-root" :class="themeClass">
    <!-- 悬浮按钮 -->
    <Transition name="fab">
      <button
        v-if="!store.isOpen"
        class="fab"
        :class="{ 'is-dragging': isFabDragging }"
        :style="fabStyle"
        @pointerdown="onFabPointerDown"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="5" y="2" width="14" height="20" rx="3" ry="3" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
        <span v-if="store.totalUnread > 0" class="fab-badge">
          {{ store.totalUnread > 99 ? '99+' : store.totalUnread }}
        </span>
      </button>
    </Transition>

    <!-- 手机面板 -->
    <Transition name="panel">
      <div
        v-if="store.isOpen"
        class="phone-shell"
        :class="{ 'is-fullscreen': isFullscreen }"
        :style="panelStyle"
        @wheel.stop
        @touchmove.stop
      >
        <!-- iOS 外壳边框 -->
        <div class="phone-frame">
          <!-- 拖动手柄（覆盖在状态栏上方的透明区域） -->
          <div
            v-if="!isFullscreen"
            class="drag-handle"
            :class="{ 'is-dragging': isPanelDragging }"
            @pointerdown="onPanelPointerDown"
          ></div>

          <!-- 状态栏 -->
          <StatusBar
            :is-dark="store.isDark"
            @close="store.closePhone()"
            @toggle-theme="store.toggleTheme()"
          />

          <!-- 主内容区 -->
          <div class="phone-body" :style="phoneBodyStyle">
            <!-- APP 打开时的页面 -->
            <Transition :name="appTransitionName">
              <div
                v-if="store.activeApp"
                class="app-page"
                :class="{ 'is-edge-swiping': isEdgeSwipingBack }"
                @pointerdown.capture="onAppPagePointerDown"
              >
                <component
                  v-if="currentAppComponent"
                  :is="currentAppComponent"
                  :key="store.activeApp"
                />
                <div
                  v-if="isFullscreen"
                  class="app-edge-swipe-feedback"
                  :class="{ 'is-active': isEdgeSwipingBack }"
                  aria-hidden="true"
                ></div>
              </div>
            </Transition>

            <!-- 首页 -->
            <Transition :name="homeTransitionName">
              <div v-if="!store.activeApp" class="home-page-wrapper" key="home">
                <component :is="HomeApp" />
              </div>
            </Transition>
          </div>

          <!-- Home Indicator -->
          <div class="home-indicator-area" @click="onHomeIndicatorClick">
            <div
              class="home-indicator-bar"
              :class="{ 'is-swiping': isSwipingUp }"
              @pointerdown="onHomeBarPointerDown"
            ></div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted } from 'vue';
import StatusBar from './components/StatusBar.vue';
import HomeApp from './apps/首页/App.vue';
import { usePhoneStore } from './stores/phone-store';
import { useAppRegistry } from './stores/app-registry';
import { generateForApp } from './utils/generation-pipeline';
import { getAppFormalName } from './utils/app-names';
import { indexPhoneSessionMemory } from './utils/memory-system';

const store = usePhoneStore();
const appRegistry = useAppRegistry();

const phoneBodyStyle = computed(() => {
  if (!store.wallpaperImage) return {};
  return {
    backgroundImage: `url("${store.wallpaperImage}")`,
  };
});

// ─── 关闭手机时触发操作总结 ───
watch(() => store.isOpen, async (isOpen, wasOpen) => {
  if (!wasOpen || isOpen) return;
  const hasActions = store.pendingActions.length > 0;
  const hasChatLogs = store.pendingChatLogs.length > 0;
  if (!hasActions && !hasChatLogs) return;

  try {
    // 1. 构建操作摘要行（供 AI 总结用）
    const actionsByType = categorizeActions(store.pendingActions);
    const actionLines = store.pendingActions.map(
      a => `在「${getAppFormalName(a.appId)}」${a.summary}`,
    ).join('\n');

    // 2. 构建完整聊天记录文本块（脚本直接拼接）
    const chatLogsText = store.formatChatLogsText();

    // 3. AI 总结（将操作摘要 + 聊天记录摘要一起发给 AI）
    let aiSummary = '';
    if (hasActions) {
      const smartPrompt = buildSmartSummaryPrompt(actionsByType);
      // 如果有聊天记录，把聊天记录也发给 AI 以便它准确概括
      const aiInput = chatLogsText
        ? `${actionLines}\n\n以下是完整聊天记录（你只需概括核心事件，不要逐条复述）：\n${chatLogsText}`
        : actionLines;

      const result = await generateForApp('summary', aiInput, smartPrompt);
      aiSummary = result.success
        ? (typeof result.parsed === 'string' ? result.parsed : result.raw?.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim() || '')
        : actionLines;
    }

    // 4. 拼接最终正文楼层内容：AI 总结 + 完整聊天记录
    const parts: string[] = [];
    if (aiSummary) parts.push(aiSummary);
    if (chatLogsText) parts.push(chatLogsText);

    const finalMessage = parts.join('\n\n');
    if (finalMessage) {
      await createChatMessages([{
        role: 'user',
        message: `📱 手机操作：\n${finalMessage}`,
      }]);
    }

    await indexPhoneSessionMemory({
      summary: aiSummary,
      chatLogsText,
      actions: [...store.pendingActions],
    });

    store.clearPendingActions();
  } catch (e) {
    console.warn('[小手机] 操作总结生成失败:', e);
    // 降级：直接写入原始操作记录
    try {
      const fallbackLines = store.pendingActions.map(
        a => `在「${getAppFormalName(a.appId)}」${a.summary}`,
      ).join('\n');
      const chatLogsText = store.formatChatLogsText();
      const fallbackParts = [fallbackLines, chatLogsText].filter(Boolean);
      if (fallbackParts.length > 0) {
        await createChatMessages([{
          role: 'user',
          message: `📱 手机操作：\n${fallbackParts.join('\n\n')}`,
        }]);
      }
      await indexPhoneSessionMemory({
        summary: fallbackLines,
        chatLogsText,
        actions: [...store.pendingActions],
      });
      store.clearPendingActions();
    } catch {
      // 彻底失败，放弃
    }
  }
});

// ─── 操作总结智能化：按类型分类 ───
type ActionCategory = 'financial' | 'social' | 'browse' | 'other';

function categorizeActions(actions: Array<{ appId: string; summary: string }>): Record<ActionCategory, string[]> {
  const result: Record<ActionCategory, string[]> = { financial: [], social: [], browse: [], other: [] };
  const financialApps = new Set(['delivery', 'shop', 'secondhand', 'taxi', 'wallet']);
  const socialApps = new Set(['messages', 'forum', 'sms']);
  const browseApps = new Set(['tiktok', 'bilibili', 'live', 'music', 'movie', 'browser']);

  for (const action of actions) {
    const appId = action.appId;
    const line = `在「${getAppFormalName(appId)}」${action.summary}`;
    if (financialApps.has(appId)) result.financial.push(line);
    else if (socialApps.has(appId)) result.social.push(line);
    else if (browseApps.has(appId)) result.browse.push(line);
    else result.other.push(line);
  }
  return result;
}

function buildSmartSummaryPrompt(actionsByType: Record<ActionCategory, string[]>): string {
  const hints: string[] = [];
  hints.push('请将以上手机操作总结为一段简洁的自然语言描述，不超过3句话，用第三人称。');

  if (actionsByType.financial.length > 0) {
    hints.push('【重要】涉及金额的操作（外卖/购物/打车/二手交易），必须写具体金额和商品/服务名称，如"在xxx点了xxx花了¥xx"。');
  }
  if (actionsByType.social.length > 0) {
    hints.push('社交操作（发消息/评论/发帖/加好友），要概括聊天的核心事件和情感变化，不要逐条复述消息——完整聊天记录会由系统自动附加在总结下方。');
  }
  if (actionsByType.browse.length > 0) {
    hints.push('纯浏览操作（刷视频/看直播/听音乐）简单概括即可，如"刷了会儿短视频"。');
  }

  return hints.join('\n');
}

// ─── 主题 ───
const themeClass = computed(() => (store.isDark ? 'theme-dark' : 'theme-light'));

// ─── APP 切换动画方向 ───
const appTransitionName = ref('app-open');
const homeTransitionName = ref('app-close');

watch(() => store.activeApp, (newApp, oldApp) => {
  if (newApp && !oldApp) {
    // 从首页打开 APP
    appTransitionName.value = 'app-open';
    homeTransitionName.value = 'app-open';
  } else if (!newApp && oldApp) {
    // 返回首页
    appTransitionName.value = 'app-close';
    homeTransitionName.value = 'app-close';
  } else {
    // APP 之间切换
    appTransitionName.value = 'app-switch';
    homeTransitionName.value = 'app-switch';
  }
});

// ─── 当前显示的组件 ───
const currentAppComponent = computed(() => {
  if (store.activeApp) {
    const comp = appRegistry.getAppComponent(store.activeApp);
    if (comp) return comp;
  }
  return HomeApp;
});

// ─── 响应式尺寸 ───
const hostWindow = window.parent;
const windowWidth = ref(hostWindow.innerWidth);
const windowHeight = ref(hostWindow.innerHeight);
const isFullscreen = computed(() => windowWidth.value <= 500);

// ─── 面板尺寸常量 ───
const PANEL_W = 340;
const PANEL_H = 620;
const FAB_SIZE = 52;
const EDGE_GAP = 12;

// ─── FAB 拖动 ───
const isFabDragging = ref(false);
let fabDragStartX = 0, fabDragStartY = 0;
let fabDragBaseX = 0, fabDragBaseY = 0;
let fabHasMoved = false;

const fabStyle = computed(() => ({
  left: `${store.fabPosition.x}px`,
  top: `${store.fabPosition.y}px`,
}));

function onFabPointerDown(e: PointerEvent) {
  if (e.button !== 0) return;
  e.preventDefault();
  isFabDragging.value = false;
  fabHasMoved = false;
  fabDragStartX = e.clientX;
  fabDragStartY = e.clientY;
  fabDragBaseX = store.fabPosition.x;
  fabDragBaseY = store.fabPosition.y;
  hostWindow.addEventListener('pointermove', onFabPointerMove);
  hostWindow.addEventListener('pointerup', onFabPointerUp);
}

function onFabPointerMove(e: PointerEvent) {
  const dx = e.clientX - fabDragStartX;
  const dy = e.clientY - fabDragStartY;
  if (!fabHasMoved && Math.abs(dx) <= 3 && Math.abs(dy) <= 3) return;
  fabHasMoved = true;
  isFabDragging.value = true;
  store.updateFabPosition(fabDragBaseX + dx, fabDragBaseY + dy);
}

function onFabPointerUp() {
  hostWindow.removeEventListener('pointermove', onFabPointerMove);
  hostWindow.removeEventListener('pointerup', onFabPointerUp);
  isFabDragging.value = false;
  if (!fabHasMoved) store.openPhone();
}

// ─── 面板拖动（通过 StatusBar） ───
const isPanelDragging = ref(false);
const panelPosition = ref({ x: 0, y: 0 });
let panelDragStartX = 0, panelDragStartY = 0;
let panelDragBaseX = 0, panelDragBaseY = 0;
let panelHasMoved = false;

// 初始化面板位置
function initPanelPosition() {
  if (isFullscreen.value) return;
  const x = Math.max(EDGE_GAP, Math.min(store.fabPosition.x - PANEL_W / 2, windowWidth.value - PANEL_W - EDGE_GAP));
  const y = Math.max(EDGE_GAP, Math.min(store.fabPosition.y - PANEL_H, windowHeight.value - PANEL_H - EDGE_GAP));
  panelPosition.value = { x, y };
}

watch(() => store.isOpen, (isOpen) => {
  if (isOpen) {
    nextTick(() => initPanelPosition());
  }
});

const panelStyle = computed(() => {
  if (isFullscreen.value) {
    return {
      left: '0px',
      top: '0px',
      width: `${windowWidth.value}px`,
      height: `${windowHeight.value}px`,
    };
  }
  return {
    left: `${panelPosition.value.x}px`,
    top: `${panelPosition.value.y}px`,
    width: `${PANEL_W}px`,
    height: `${PANEL_H}px`,
  };
});

function onPanelPointerDown(e: PointerEvent) {
  if (e.button !== 0 || isFullscreen.value) return;
  // 不要阻止事件传播到 StatusBar 内部按钮
  const target = e.target as HTMLElement;
  if (target.closest('.status-btn') || target.closest('.close-btn')) return;

  e.preventDefault();
  isPanelDragging.value = false;
  panelHasMoved = false;
  panelDragStartX = e.clientX;
  panelDragStartY = e.clientY;
  panelDragBaseX = panelPosition.value.x;
  panelDragBaseY = panelPosition.value.y;
  hostWindow.addEventListener('pointermove', onPanelPointerMove);
  hostWindow.addEventListener('pointerup', onPanelPointerUp);
}

function onPanelPointerMove(e: PointerEvent) {
  const dx = e.clientX - panelDragStartX;
  const dy = e.clientY - panelDragStartY;
  if (!panelHasMoved && Math.abs(dx) <= 3 && Math.abs(dy) <= 3) return;
  panelHasMoved = true;
  isPanelDragging.value = true;

  const newX = _.clamp(panelDragBaseX + dx, EDGE_GAP, windowWidth.value - PANEL_W - EDGE_GAP);
  const newY = _.clamp(panelDragBaseY + dy, EDGE_GAP, windowHeight.value - PANEL_H - EDGE_GAP);
  panelPosition.value = { x: newX, y: newY };
}

function onPanelPointerUp() {
  hostWindow.removeEventListener('pointermove', onPanelPointerMove);
  hostWindow.removeEventListener('pointerup', onPanelPointerUp);
  isPanelDragging.value = false;
}

// ─── App edge swipe back (mobile fullscreen) ───
const EDGE_SWIPE_ZONE_MIN = 72;
const EDGE_SWIPE_ZONE_MAX = 136;
const EDGE_SWIPE_ZONE_RATIO = 0.28;
const EDGE_SWIPE_TRIGGER_DISTANCE = 56;
const EDGE_SWIPE_VERTICAL_LIMIT = 60;
const EDGE_SWIPE_CANCEL_VERTICAL = 90;

const isEdgeSwipingBack = ref(false);
let edgeSwipePointerId: number | null = null;
let edgeSwipeStartX = 0;
let edgeSwipeStartY = 0;
let edgeSwipeIsHorizontal = false;
let edgeSwipeShouldReturnHome = false;

const edgeSwipeZoneWidth = computed(() => (
  _.clamp(windowWidth.value * EDGE_SWIPE_ZONE_RATIO, EDGE_SWIPE_ZONE_MIN, EDGE_SWIPE_ZONE_MAX)
));

function addAppPagePointerListeners(): void {
  window.addEventListener('pointermove', onAppPagePointerMove);
  window.addEventListener('pointerup', onAppPagePointerUp);
  window.addEventListener('pointercancel', onAppPagePointerCancel);
  if (hostWindow !== window) {
    hostWindow.addEventListener('pointermove', onAppPagePointerMove);
    hostWindow.addEventListener('pointerup', onAppPagePointerUp);
    hostWindow.addEventListener('pointercancel', onAppPagePointerCancel);
  }
}

function removeAppPagePointerListeners(): void {
  window.removeEventListener('pointermove', onAppPagePointerMove);
  window.removeEventListener('pointerup', onAppPagePointerUp);
  window.removeEventListener('pointercancel', onAppPagePointerCancel);
  if (hostWindow !== window) {
    hostWindow.removeEventListener('pointermove', onAppPagePointerMove);
    hostWindow.removeEventListener('pointerup', onAppPagePointerUp);
    hostWindow.removeEventListener('pointercancel', onAppPagePointerCancel);
  }
}

function resetAppPageEdgeSwipe(): void {
  edgeSwipePointerId = null;
  edgeSwipeIsHorizontal = false;
  edgeSwipeShouldReturnHome = false;
  isEdgeSwipingBack.value = false;
  removeAppPagePointerListeners();
}

function onAppPagePointerDown(e: PointerEvent) {
  if (!isFullscreen.value || !store.activeApp || edgeSwipePointerId !== null) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (e.clientX < windowWidth.value - edgeSwipeZoneWidth.value) return;

  edgeSwipePointerId = e.pointerId;
  edgeSwipeStartX = e.clientX;
  edgeSwipeStartY = e.clientY;
  edgeSwipeIsHorizontal = false;
  edgeSwipeShouldReturnHome = false;
  addAppPagePointerListeners();
}

function onAppPagePointerMove(e: PointerEvent) {
  if (edgeSwipePointerId !== e.pointerId) return;

  const dx = e.clientX - edgeSwipeStartX;
  const dy = e.clientY - edgeSwipeStartY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absY > EDGE_SWIPE_CANCEL_VERTICAL && absY > absX) {
    resetAppPageEdgeSwipe();
    return;
  }

  if (!edgeSwipeIsHorizontal && absX > 10) {
    edgeSwipeIsHorizontal = dx < 0 && absX > absY;
  }

  if (!edgeSwipeIsHorizontal) return;

  isEdgeSwipingBack.value = dx < -12;
  edgeSwipeShouldReturnHome = dx <= -EDGE_SWIPE_TRIGGER_DISTANCE && absY <= EDGE_SWIPE_VERTICAL_LIMIT;

  if (isEdgeSwipingBack.value) {
    e.preventDefault();
  }
}

function onAppPagePointerUp(e: PointerEvent) {
  if (edgeSwipePointerId !== e.pointerId) return;

  const shouldReturnHome = edgeSwipeShouldReturnHome;
  resetAppPageEdgeSwipe();
  if (shouldReturnHome) {
    store.returnHome();
  }
}

function onAppPagePointerCancel(e: PointerEvent) {
  if (edgeSwipePointerId !== e.pointerId) return;
  resetAppPageEdgeSwipe();
}

// ─── Home Indicator 手势 ───
const isSwipingUp = ref(false);
let homeBarStartY = 0;

function onHomeIndicatorClick() {
  if (store.activeApp) {
    store.returnHome();
  }
}

function onHomeBarPointerDown(e: PointerEvent) {
  homeBarStartY = e.clientY;
  hostWindow.addEventListener('pointermove', onHomeBarPointerMove);
  hostWindow.addEventListener('pointerup', onHomeBarPointerUp);
}

function onHomeBarPointerMove(e: PointerEvent) {
  const dy = homeBarStartY - e.clientY;
  if (dy > 30) {
    isSwipingUp.value = true;
  }
}

function onHomeBarPointerUp() {
  hostWindow.removeEventListener('pointermove', onHomeBarPointerMove);
  hostWindow.removeEventListener('pointerup', onHomeBarPointerUp);
  if (isSwipingUp.value) {
    store.returnHome();
    isSwipingUp.value = false;
  }
}

// ─── 窗口 resize ───
const onResize = () => {
  windowWidth.value = hostWindow.innerWidth;
  windowHeight.value = hostWindow.innerHeight;
};
onMounted(() => hostWindow.addEventListener('resize', onResize));
onUnmounted(() => {
  hostWindow.removeEventListener('resize', onResize);
  resetAppPageEdgeSwipe();
});
</script>

<style scoped>
/* ─── 主题变量 ─── */
.theme-dark {
  --bg-primary: #000000;
  --bg-secondary: #000000;
  --bg-tertiary: rgba(255, 255, 255, 0.04);
  --bg-hover: rgba(255, 255, 255, 0.06);
  --bg-active: rgba(255, 255, 255, 0.08);
  --bg-input: rgba(255, 255, 255, 0.08);
  --bg-fab: rgba(10, 10, 10, 0.95);
  --bg-statusbar: transparent;
  --bg-island: #000;
  --bg-tabbar: rgba(0, 0, 0, 0.7);
  --bg-panel: #000000;
  --bg-card: rgba(28, 28, 30, 1);
  --bg-card-elevated: rgba(44, 44, 46, 1);
  --bg-grouped: rgba(28, 28, 30, 1);
  --bg-dock: rgba(30, 30, 30, 0.6);
  --border-primary: rgba(255, 255, 255, 0.08);
  --border-secondary: rgba(255, 255, 255, 0.05);
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-tertiary: rgba(255, 255, 255, 0.4);
  --text-muted: rgba(255, 255, 255, 0.2);
  --accent: #0a84ff;
  --accent-bg: rgba(10, 132, 255, 0.12);
  --danger: #ff453a;
  --success: #30d158;
  --warning: #ffd60a;
  --shadow-panel: 0 24px 80px rgba(0, 0, 0, 0.8);
  --shadow-fab: 0 4px 24px rgba(0, 0, 0, 0.5);
  --wallpaper: linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  --shell-border: rgba(255, 255, 255, 0.12);
  --shell-bg: #1c1c1e;
}

.theme-light {
  --bg-primary: #ffffff;
  --bg-secondary: #f2f2f7;
  --bg-tertiary: rgba(0, 0, 0, 0.03);
  --bg-hover: rgba(0, 0, 0, 0.04);
  --bg-active: rgba(0, 0, 0, 0.06);
  --bg-input: rgba(118, 118, 128, 0.12);
  --bg-fab: rgba(255, 255, 255, 0.96);
  --bg-statusbar: transparent;
  --bg-island: #000;
  --bg-tabbar: rgba(249, 249, 249, 0.94);
  --bg-panel: #f2f2f7;
  --bg-card: #ffffff;
  --bg-card-elevated: #ffffff;
  --bg-grouped: #ffffff;
  --bg-dock: rgba(230, 230, 230, 0.6);
  --border-primary: rgba(0, 0, 0, 0.08);
  --border-secondary: rgba(0, 0, 0, 0.04);
  --text-primary: #000000;
  --text-secondary: rgba(60, 60, 67, 0.6);
  --text-tertiary: rgba(60, 60, 67, 0.3);
  --text-muted: rgba(60, 60, 67, 0.18);
  --accent: #007aff;
  --accent-bg: rgba(0, 122, 255, 0.1);
  --danger: #ff3b30;
  --success: #34c759;
  --warning: #ffcc00;
  --shadow-panel: 0 24px 80px rgba(0, 0, 0, 0.15);
  --shadow-fab: 0 2px 16px rgba(0, 0, 0, 0.12);
  --wallpaper: linear-gradient(145deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  --shell-border: rgba(0, 0, 0, 0.12);
  --shell-bg: #e5e5ea;
}

.phone-root {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'PingFang SC', 'Helvetica Neue', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-size: var(--font-size-base, 14px);
  --font-size-base: 14px;
  --font-size-sm: 12px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
  --font-size-title: 34px;
}

/* ─── FAB ─── */
.fab {
  position: fixed;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  border: 1px solid var(--border-primary);
  background: var(--bg-fab);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-fab);
  z-index: 9998;
  user-select: none;
  touch-action: none;
  color: var(--text-secondary);
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.2s;
}

.fab:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 32px rgba(0, 0, 0, 0.25);
}

.fab.is-dragging {
  cursor: grabbing;
  transform: scale(1.1);
}

.fab-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: var(--danger);
  color: white;
  font-size: 11px;
  font-weight: 600;
  min-width: 20px;
  height: 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  border: 2px solid var(--bg-fab);
}

/* ─── 手机外壳 ─── */
.phone-shell {
  position: fixed;
  z-index: 9998;
}

.phone-frame {
  width: 100%;
  height: 100%;
  border-radius: 44px;
  background: var(--bg-panel);
  box-shadow: var(--shadow-panel);
  border: 3px solid var(--shell-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

/* ─── 拖动手柄 ─── */
.drag-handle {
  position: absolute;
  top: 0;
  left: 40px;
  right: 40px;
  height: 44px;
  z-index: 20;
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.drag-handle.is-dragging {
  cursor: grabbing;
}

.is-fullscreen .phone-frame {
  border-radius: 0;
  border: none;
  box-shadow: none;
}

/* ─── 内容区 ─── */
.phone-body {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: var(--wallpaper);
  background-size: cover;
  background-position: center;
}

.app-page,
.home-page-wrapper {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.app-page.is-edge-swiping {
  cursor: w-resize;
}

.app-edge-swipe-feedback {
  position: absolute;
  top: 22%;
  right: 0;
  width: 4px;
  height: 56%;
  border-radius: 4px 0 0 4px;
  background: var(--accent);
  opacity: 0;
  pointer-events: none;
  transform: scaleY(0.72);
  transform-origin: center right;
  transition: opacity 0.16s ease, transform 0.16s ease;
  z-index: 60;
}

.app-edge-swipe-feedback.is-active {
  opacity: 0.45;
  transform: scaleY(1);
}

/* ─── Home Indicator ─── */
.home-indicator-area {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 0 10px;
  background: var(--bg-panel);
  cursor: pointer;
}

.home-indicator-bar {
  width: 134px;
  height: 5px;
  border-radius: 3px;
  background: var(--text-tertiary);
  transition: all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.home-indicator-bar:hover {
  background: var(--text-secondary);
  width: 140px;
}

.home-indicator-bar.is-swiping {
  width: 160px;
  background: var(--text-primary);
}

/* ─── APP 打开/关闭过渡 ─── */
.app-open-enter-active {
  transition: all 0.4s cubic-bezier(0.32, 0.72, 0, 1);
}
.app-open-leave-active {
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.app-open-enter-from {
  opacity: 0;
  transform: scale(0.9);
}
.app-open-leave-to {
  opacity: 0;
  transform: scale(1.05);
}

.app-close-enter-active {
  transition: all 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.app-close-leave-active {
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.app-close-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.app-close-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.app-switch-enter-active {
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.app-switch-leave-active {
  transition: all 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.app-switch-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.app-switch-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* ─── FAB 过渡 ─── */
.fab-enter-active,
.fab-leave-active {
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}
.fab-enter-from,
.fab-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

/* ─── 面板过渡 ─── */
.panel-enter-active {
  transition: all 0.5s cubic-bezier(0.32, 0.72, 0, 1);
}
.panel-leave-active {
  transition: all 0.35s cubic-bezier(0.32, 0.72, 0, 1);
}
.panel-enter-from {
  opacity: 0;
  transform: translateY(40px) scale(0.92);
}
.panel-leave-to {
  opacity: 0;
  transform: translateY(40px) scale(0.92);
}
.is-fullscreen.panel-enter-from {
  opacity: 0;
  transform: translateY(100%);
}
.is-fullscreen.panel-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
