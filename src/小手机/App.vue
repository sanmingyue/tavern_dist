<template>
  <div class="phone-root" :class="themeClass">
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
        <!-- 手机 SVG 图标 -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" />
        </svg>
        <span v-if="store.totalUnread > 0" class="fab-badge">{{ store.totalUnread > 99 ? '99+' : store.totalUnread }}</span>
      </button>
    </Transition>

    <!-- 展开态：手机面板 -->
    <Transition name="panel">
      <div
        v-if="store.isOpen"
        class="phone-panel"
        :class="{ 'is-mobile': isMobile }"
        :style="panelStyle"
      >
        <!-- 灵动岛状态栏 -->
        <div
          class="phone-statusbar"
          :class="{ 'is-dragging': isPanelDragging }"
          @pointerdown="!isMobile && onPanelPointerDown($event)"
        >
          <span class="statusbar-time">{{ currentTime }}</span>
          <!-- 灵动岛 -->
          <div class="dynamic-island">
            <div class="island-content">
              <template v-if="musicStore.isPlaying">
                <div class="island-music-indicator">
                  <div class="island-bar" v-for="i in 4" :key="i" :style="{ animationDelay: (i * 0.12) + 's' }" />
                </div>
                <span class="island-text">{{ musicStore.currentTrackTitle }}</span>
              </template>
              <template v-else>
                <span class="island-dot" />
              </template>
            </div>
          </div>
          <div class="statusbar-right">
            <!-- 主题切换按钮 -->
            <button class="theme-toggle-btn" @click.stop="store.toggleTheme()" :title="store.isDark ? '切换到白色模式' : '切换到深夜模式'">
              <!-- 太阳/月亮图标 -->
              <svg v-if="store.isDark" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            </button>
            <!-- WiFi 图标 -->
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="statusbar-icon">
              <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
            </svg>
            <!-- 电池图标 -->
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="statusbar-icon">
              <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/>
            </svg>
            <button class="phone-close-btn" @click="store.isOpen = false" @pointerdown.stop>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 手机主体内容 -->
        <div class="phone-body">
          <Transition :name="transitionName" mode="out-in">
            <!-- 消息Tab中的聊天详情 -->
            <ChatView v-if="activeTab === 'messages' && store.activeContact" :key="'chat-' + store.activeContact" />
            <!-- 消息Tab -->
            <ContactList v-else-if="activeTab === 'messages'" key="messages" />
            <!-- 联系人Tab -->
            <FriendList v-else-if="activeTab === 'contacts'" key="contacts" @open-chat="onFriendOpenChat" />
            <!-- 动态Tab -->
            <PlaceholderPage v-else-if="activeTab === 'discover'" key="discover" title="动态" subtitle="暂未完成此功能，敬请期待" />
            <!-- 音乐Tab -->
            <MusicPlayer v-else-if="activeTab === 'music'" key="music" />
          </Transition>

          <!-- 添加好友弹窗 -->
          <AddContactModal />
        </div>

        <!-- 底部Tab导航栏（QQ风格） -->
        <div class="phone-tabbar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="tabbar-item"
            :class="{ active: activeTab === tab.id }"
            @click="switchTab(tab.id)"
          >
            <div class="tabbar-icon-wrap">
              <component :is="tab.icon" />
              <span v-if="tab.badge > 0" class="tabbar-badge">{{ tab.badge > 99 ? '99+' : tab.badge }}</span>
            </div>
            <span class="tabbar-label">{{ tab.label }}</span>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from './store';
import { useMusicStore } from './music-store';
import ContactList from './components/ContactList.vue';
import ChatView from './components/ChatView.vue';
import FriendList from './components/FriendList.vue';
import MusicPlayer from './components/MusicPlayer.vue';
import PlaceholderPage from './components/PlaceholderPage.vue';
import AddContactModal from './components/AddContactModal.vue';
import TabIconMessages from './components/icons/TabIconMessages.vue';
import TabIconContacts from './components/icons/TabIconContacts.vue';
import TabIconDiscover from './components/icons/TabIconDiscover.vue';
import TabIconMusic from './components/icons/TabIconMusic.vue';

const store = usePhoneStore();
const musicStore = useMusicStore();
const fabRef = ref<HTMLButtonElement | null>(null);

// ─── 主题 ───
const themeClass = computed(() => store.isDark ? 'theme-dark' : 'theme-light');

// ─── Tab 导航 ───
const activeTab = ref<'messages' | 'contacts' | 'discover' | 'music'>('messages');

const tabOrder = ['messages', 'contacts', 'discover', 'music'] as const;

const tabs = computed(() => [
  { id: 'messages' as const, label: '消息', icon: TabIconMessages, badge: store.totalUnread },
  { id: 'contacts' as const, label: '联系人', icon: TabIconContacts, badge: 0 },
  { id: 'discover' as const, label: '动态', icon: TabIconDiscover, badge: 0 },
  { id: 'music' as const, label: '音乐', icon: TabIconMusic, badge: 0 },
]);

const transitionName = ref('slide-left');

function onFriendOpenChat(_name: string) {
  transitionName.value = 'slide-right';
  activeTab.value = 'messages';
}

function switchTab(tabId: typeof activeTab.value) {
  if (tabId === activeTab.value) return;

  // 如果在聊天详情里按消息tab，先返回消息列表
  if (tabId === 'messages' && store.activeContact) {
    store.goBack();
    return;
  }

  const oldIdx = tabOrder.indexOf(activeTab.value);
  const newIdx = tabOrder.indexOf(tabId);
  transitionName.value = newIdx > oldIdx ? 'slide-left' : 'slide-right';
  activeTab.value = tabId;
}

// 聊天详情进入时用 slide-left
watch(() => store.activeContact, (newVal, oldVal) => {
  if (newVal && !oldVal) transitionName.value = 'slide-left';
  else if (!newVal && oldVal) transitionName.value = 'slide-right';
});

// ─── 时间显示 ───
const currentTime = ref('');
function updateTime() {
  const now = new Date();
  currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
updateTime();
const timeInterval = setInterval(updateTime, 30000);
onUnmounted(() => clearInterval(timeInterval));

// ─── 响应式尺寸检测 ───
const hostWindow = window.parent;
const windowWidth = ref(hostWindow.innerWidth);
const windowHeight = ref(hostWindow.innerHeight);
const MOBILE_BREAKPOINT = 500;
const isMobile = computed(() => windowWidth.value <= MOBILE_BREAKPOINT);

// ─── 拖动常量 ───
const DRAG_THRESHOLD = 3;
const FAB_SIZE = 52;
const EDGE_GAP = 12;

// 面板尺寸
const panelWidth = computed(() => isMobile.value ? windowWidth.value : 340);
const panelHeight = computed(() => isMobile.value ? windowHeight.value : 620);

// ─── FAB 拖动逻辑 ───
const isDragging = ref(false);
let dragStartX = 0;
let dragStartY = 0;
let dragBaseX = 0;
let dragBaseY = 0;
let hasMoved = false;

const fabStyle = computed(() => ({
  left: `${store.fabPosition.x}px`,
  top: `${store.fabPosition.y}px`,
}));

// ─── 面板拖动逻辑 ───
const isPanelDragging = ref(false);
const panelOffset = ref<{ x: number; y: number } | null>(null);
let panelDragStartX = 0;
let panelDragStartY = 0;
let panelDragBaseX = 0;
let panelDragBaseY = 0;
let panelHasMoved = false;

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
  let top = above >= EDGE_GAP ? above : below + ph <= vh - EDGE_GAP ? below : _.clamp(above, EDGE_GAP, Math.max(EDGE_GAP, vh - ph - EDGE_GAP));

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

// ─── FAB 拖动处理 ───
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
/* ─── CSS 变量：双主题 ─── */
.theme-dark {
  --bg-primary: #0b0e14;
  --bg-secondary: #111318;
  --bg-tertiary: rgba(255, 255, 255, 0.04);
  --bg-hover: rgba(255, 255, 255, 0.06);
  --bg-active: rgba(255, 255, 255, 0.08);
  --bg-input: rgba(255, 255, 255, 0.05);
  --bg-fab: rgba(10, 18, 30, 0.92);
  --bg-statusbar: rgba(0, 0, 0, 0.3);
  --bg-island: #000;
  --bg-tabbar: rgba(12, 14, 20, 0.95);
  --bg-panel: #0b0e14;
  --bg-bubble-self: linear-gradient(135deg, #4a9ebb 0%, #3a7d99 100%);
  --bg-bubble-other: rgba(255, 255, 255, 0.08);
  --border-primary: rgba(255, 255, 255, 0.08);
  --border-secondary: rgba(255, 255, 255, 0.06);
  --border-fab: rgba(255, 255, 255, 0.1);
  --text-primary: rgba(255, 255, 255, 0.9);
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-tertiary: rgba(255, 255, 255, 0.45);
  --text-muted: rgba(255, 255, 255, 0.25);
  --text-hint: rgba(255, 255, 255, 0.15);
  --accent: #579bf0;
  --accent-hover: #6aa8f4;
  --accent-bg: rgba(87, 155, 240, 0.15);
  --danger: #e74c3c;
  --success: #2ecc71;
  --shadow-panel: 0 16px 64px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
  --shadow-fab: 0 4px 20px rgba(0, 0, 0, 0.4);
}

.theme-light {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f6f8;
  --bg-tertiary: rgba(0, 0, 0, 0.03);
  --bg-hover: rgba(0, 0, 0, 0.04);
  --bg-active: rgba(0, 0, 0, 0.06);
  --bg-input: rgba(0, 0, 0, 0.04);
  --bg-fab: rgba(255, 255, 255, 0.95);
  --bg-statusbar: rgba(245, 246, 248, 0.95);
  --bg-island: #1a1c24;
  --bg-tabbar: rgba(255, 255, 255, 0.98);
  --bg-panel: #ffffff;
  --bg-bubble-self: linear-gradient(135deg, #95ec69 0%, #7ed856 100%);
  --bg-bubble-other: #f0f0f0;
  --border-primary: rgba(0, 0, 0, 0.08);
  --border-secondary: rgba(0, 0, 0, 0.06);
  --border-fab: rgba(0, 0, 0, 0.1);
  --text-primary: rgba(0, 0, 0, 0.88);
  --text-secondary: rgba(0, 0, 0, 0.65);
  --text-tertiary: rgba(0, 0, 0, 0.45);
  --text-muted: rgba(0, 0, 0, 0.25);
  --text-hint: rgba(0, 0, 0, 0.12);
  --accent: #1989fa;
  --accent-hover: #3a9bff;
  --accent-bg: rgba(25, 137, 250, 0.1);
  --danger: #e74c3c;
  --success: #07c160;
  --shadow-panel: 0 8px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.06);
  --shadow-fab: 0 2px 12px rgba(0, 0, 0, 0.12);
}

.phone-root {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Helvetica Neue', system-ui, sans-serif;
}

/* ─── 悬浮按钮 ─── */
.fab {
  position: fixed;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  border: 1px solid var(--border-fab);
  background: var(--bg-fab);
  backdrop-filter: blur(8px);
  cursor: grab;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-fab);
  transition: box-shadow 0.2s, border-radius 0.2s;
  padding: 0;
  z-index: 9998;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
  color: var(--text-secondary);
}

.fab:hover { box-shadow: 0 6px 28px rgba(0, 0, 0, 0.2); color: var(--text-primary); }
.fab:active, .fab.is-dragging { cursor: grabbing; }
.fab.is-dragging { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); }

.fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--danger);
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid var(--bg-fab);
}

/* ─── 手机面板 ─── */
.phone-panel {
  position: fixed;
  border-radius: 24px;
  border: 1px solid var(--border-primary);
  background: var(--bg-panel);
  box-shadow: var(--shadow-panel);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9998;
  pointer-events: auto;
}

.phone-panel.is-mobile {
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0;
  border: none;
  box-shadow: none;
  left: 0 !important;
  top: 0 !important;
}

/* ─── 灵动岛状态栏 ─── */
.phone-statusbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  background: var(--bg-statusbar);
  flex-shrink: 0;
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.is-mobile .phone-statusbar { cursor: default; padding: 8px 16px; }
.phone-statusbar.is-dragging { cursor: grabbing; }

.statusbar-time {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 36px;
}

/* 灵动岛 */
.dynamic-island {
  background: var(--bg-island);
  border-radius: 20px;
  padding: 4px 12px;
  min-width: 90px;
  max-width: 160px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.island-content {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.island-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
}

.island-music-indicator {
  display: flex;
  align-items: flex-end;
  gap: 1.5px;
  height: 12px;
}

.island-bar {
  width: 2px;
  background: #1db954;
  border-radius: 1px;
  animation: island-bar-bounce 0.6s ease-in-out infinite alternate;
}

.island-bar:nth-child(1) { height: 4px; }
.island-bar:nth-child(2) { height: 8px; }
.island-bar:nth-child(3) { height: 6px; }
.island-bar:nth-child(4) { height: 10px; }

@keyframes island-bar-bounce {
  0% { transform: scaleY(0.4); }
  100% { transform: scaleY(1); }
}

.island-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.7);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.statusbar-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.statusbar-icon {
  opacity: 0.4;
  color: var(--text-secondary);
}

.theme-toggle-btn {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.theme-toggle-btn:hover { background: var(--bg-hover); color: var(--text-primary); }

.phone-close-btn {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  margin-left: 4px;
}

.phone-close-btn:hover { background: var(--bg-hover); color: var(--text-secondary); }

/* ─── 手机主体 ─── */
.phone-body {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: var(--bg-secondary);
}

/* ─── 底部Tab导航栏（QQ风格） ─── */
.phone-tabbar {
  display: flex;
  align-items: stretch;
  background: var(--bg-tabbar);
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-secondary);
  flex-shrink: 0;
  padding: 2px 0 4px;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px 0;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.15s;
  position: relative;
}

.tabbar-item.active { color: var(--accent); }
.tabbar-item:not(.active):hover { color: var(--text-tertiary); }

.tabbar-icon-wrap {
  position: relative;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tabbar-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  background: var(--danger);
  color: white;
  font-size: 9px;
  font-weight: 700;
  min-width: 14px;
  height: 14px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 3px;
}

.tabbar-label {
  font-size: 10px;
  font-weight: 500;
}

/* ─── 过渡动画 ─── */
.fab-enter-active, .fab-leave-active { transition: opacity 0.25s ease; }
.fab-enter-from, .fab-leave-to { opacity: 0; }

.panel-enter-active, .panel-leave-active { transition: all 0.3s ease; }
.panel-enter-from { opacity: 0; transform: translateY(30px) scale(0.9); }
.panel-leave-to { opacity: 0; transform: translateY(30px) scale(0.9); }
.is-mobile.panel-enter-from { opacity: 0; transform: translateY(100%); }
.is-mobile.panel-leave-to { opacity: 0; transform: translateY(100%); }

/* 页面切换过渡 */
.slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active {
  transition: all 0.25s ease;
  position: absolute;
  inset: 0;
}

.slide-left-enter-from { transform: translateX(100%); opacity: 0; }
.slide-left-leave-to { transform: translateX(-30%); opacity: 0; }
.slide-right-enter-from { transform: translateX(-30%); opacity: 0; }
.slide-right-leave-to { transform: translateX(100%); opacity: 0; }
</style>
