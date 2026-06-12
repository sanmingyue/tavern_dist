<template>
  <div class="springboard" ref="springboardRef" @wheel.prevent="onWheel">
    <!-- 桌面图标网格（分页） -->
    <div class="pages-wrapper">
      <div
        class="pages-track"
        :style="{ transform: `translateX(-${currentPage * 100}%)` }"
      >
        <div
          v-for="(page, pageIndex) in pages"
          :key="pageIndex"
          class="page"
        >
          <div class="icon-grid">
            <div
              v-for="app in page"
              :key="app.id"
              class="grid-item"
              @click="openApp(app.id)"
              @pointerdown="onIconPointerDown"
              @pointerup="onIconPointerUp"
              @pointercancel="onIconPointerUp"
            >
              <div class="ios-icon" :class="{ 'with-image': getIconImage(app) }" :style="iconGradient(app.id)">
                <img v-if="getIconImage(app)" class="app-icon-image" :src="getIconImage(app)" alt="" draggable="false" />
                <svg
                  v-else
                  width="26" height="26" viewBox="0 0 24 24"
                  fill="none" stroke="white" stroke-width="1.6"
                  stroke-linecap="round" stroke-linejoin="round"
                  v-html="getIcon(app.icon)"
                ></svg>
                <!-- 角标 -->
                <span v-if="app.badge && app.badge > 0" class="icon-badge">
                  {{ app.badge > 99 ? '99+' : app.badge }}
                </span>
              </div>
              <span class="icon-label">{{ app.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页指示器 -->
    <div class="page-indicator" v-if="totalPages > 1">
      <span
        v-for="i in totalPages"
        :key="i"
        class="indicator-dot"
        :class="{ active: currentPage === i - 1 }"
      ></span>
    </div>

    <!-- Dock 栏 -->
    <div class="dock">
      <div class="dock-bg"></div>
      <div class="dock-icons">
        <div
          v-for="app in dockApps"
          :key="app.id"
          class="dock-item"
          @click="openApp(app.id)"
        >
          <div class="ios-icon dock-icon-size" :class="{ 'with-image': getIconImage(app) }" :style="iconGradient(app.id)">
            <img v-if="getIconImage(app)" class="app-icon-image" :src="getIconImage(app)" alt="" draggable="false" />
            <svg
              v-else
              width="26" height="26" viewBox="0 0 24 24"
              fill="none" stroke="white" stroke-width="1.6"
              stroke-linecap="round" stroke-linejoin="round"
              v-html="getIcon(app.icon)"
            ></svg>
            <span v-if="app.badge && app.badge > 0" class="icon-badge">
              {{ app.badge > 99 ? '99+' : app.badge }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { useAppRegistry, type AppMeta } from '../../stores/app-registry';
import { getIconPath, getAppColor } from '../../utils/icons';
import { getAppIconImage } from '../../utils/app-icon-images';

const store = usePhoneStore();
const appRegistry = useAppRegistry();

const springboardRef = ref<HTMLElement | null>(null);
const currentPage = computed({
  get: () => store.homeCurrentPage,
  set: (val: number) => { store.homeCurrentPage = val; },
});
const isIconPressed = ref(false);

// iOS 渐变色映射
const ICON_GRADIENTS: Record<string, string> = {
  messages: 'linear-gradient(135deg, #5ac8fa, #007aff)',
  contacts: 'linear-gradient(135deg, #5ac8fa, #34aadc)',
  forum: 'linear-gradient(135deg, #ff6b6b, #ff3b30)',
  sms: 'linear-gradient(135deg, #4cd964, #30d158)',
  phone: 'linear-gradient(135deg, #4cd964, #30d158)',
  map: 'linear-gradient(135deg, #5ac8fa, #007aff)',
  delivery: 'linear-gradient(135deg, #ff9500, #ff6b00)',
  taxi: 'linear-gradient(135deg, #ff3b30, #c0392b)',
  movie: 'linear-gradient(135deg, #af52de, #8e44ad)',
  weather: 'linear-gradient(135deg, #5ac8fa, #007aff)',
  music: 'linear-gradient(135deg, #ff2d55, #ff375f)',
  tiktok: 'linear-gradient(135deg, #25f4ee, #fe2c55)',
  bilibili: 'linear-gradient(135deg, #00a1d6, #0077b5)',
  shop: 'linear-gradient(135deg, #ff9500, #ff6b00)',
  wallet: 'linear-gradient(135deg, #34c759, #248a3d)',
  camera: 'linear-gradient(135deg, #8e8e93, #636366)',
  gallery: 'linear-gradient(135deg, #ff2d55, #ff6b9d)',
  browser: 'linear-gradient(135deg, #007aff, #5856d6)',
  calendar: 'linear-gradient(135deg, #ff3b30, #ff453a)',
  notes: 'linear-gradient(135deg, #ffcc00, #ff9500)',
  calculator: 'linear-gradient(135deg, #636366, #48484a)',
  clock: 'linear-gradient(135deg, #1c1c1e, #000000)',
  files: 'linear-gradient(135deg, #007aff, #5ac8fa)',
  notifications: 'linear-gradient(135deg, #ff3b30, #ff453a)',
  themes: 'linear-gradient(135deg, #af52de, #bf5af2)',
  settings: 'linear-gradient(135deg, #8e8e93, #636366)',
  appstore: 'linear-gradient(135deg, #007aff, #5ac8fa)',
  live: 'linear-gradient(135deg, #ff2d55, #ff0050)',
  secondhand: 'linear-gradient(135deg, #ffd60a, #ffcc00)',
};

function iconGradient(appId: string): Record<string, string> {
  return {
    background: ICON_GRADIENTS[appId] || `linear-gradient(135deg, ${getAppColor(appId)}, ${getAppColor(appId)}dd)`,
  };
}

// Dock 固定 APP
const DOCK_IDS = ['phone', 'sms', 'browser', 'music'];

const dockApps = computed(() => {
  return DOCK_IDS
    .map(id => appRegistry.getApp(id))
    .filter((a): a is AppMeta => a !== undefined && a.installed === true);
});

// 桌面 APP（已安装的，排除 Dock 中的和一些系统隐藏的）
const HIDDEN_IDS = new Set(['home', 'notifications']);
const desktopApps = computed(() => {
  return appRegistry.getInstalledApps()
    .filter(a => !DOCK_IDS.includes(a.id) && !HIDDEN_IDS.has(a.id));
});

// 每页最多 4x4=16 个（iOS 风格）
const APPS_PER_PAGE = 16;

const pages = computed(() => {
  const result: AppMeta[][] = [];
  const apps = desktopApps.value;
  for (let i = 0; i < apps.length; i += APPS_PER_PAGE) {
    result.push(apps.slice(i, i + APPS_PER_PAGE));
  }
  if (result.length === 0) result.push([]);
  return result;
});

const totalPages = computed(() => pages.value.length);

// 滑动翻页（触摸）
let touchStartX = 0;
let touchStartY = 0;

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    if (dx < 0 && currentPage.value < totalPages.value - 1) {
      currentPage.value++;
    } else if (dx > 0 && currentPage.value > 0) {
      currentPage.value--;
    }
  }
}

// 鼠标滚轮翻页
function onWheel(e: WheelEvent) {
  // 水平或垂直滚动都支持翻页
  const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (delta > 30 && currentPage.value < totalPages.value - 1) {
    currentPage.value++;
  } else if (delta < -30 && currentPage.value > 0) {
    currentPage.value--;
  }
}

// 图标按压效果
function onIconPointerDown(e: PointerEvent) {
  const target = (e.currentTarget as HTMLElement);
  target.style.transform = 'scale(0.88)';
}

function onIconPointerUp(e: PointerEvent) {
  const target = (e.currentTarget as HTMLElement);
  target.style.transform = '';
}

onMounted(() => {
  springboardRef.value?.addEventListener('touchstart', onTouchStart, { passive: true });
  springboardRef.value?.addEventListener('touchend', onTouchEnd, { passive: true });
});

onUnmounted(() => {
  springboardRef.value?.removeEventListener('touchstart', onTouchStart);
  springboardRef.value?.removeEventListener('touchend', onTouchEnd);
});

function getIcon(icon: string): string {
  return getIconPath(icon);
}

function getIconImage(app: AppMeta): string | undefined {
  return getAppIconImage(app.id) ?? getAppIconImage(app.icon);
}

function openApp(appId: string) {
  store.openApp(appId);
}
</script>

<style scoped>
.springboard {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: none;
}

/* ─── 分页容器 ─── */
.pages-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.pages-track {
  display: flex;
  height: 100%;
  transition: transform 0.45s cubic-bezier(0.32, 0.72, 0, 1);
  will-change: transform;
}

.page {
  min-width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  padding: 16px 18px 8px;
}

/* ─── iOS 图标网格 4列 ─── */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px 0;
  width: 100%;
  align-content: start;
  justify-items: center;
}

.grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
  -webkit-tap-highlight-color: transparent;
}

/* ─── iOS 圆角方形图标 ─── */
.ios-icon {
  width: 56px;
  height: 56px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  /* iOS 的图标都有微妙的内边框高光 */
  overflow: hidden;
}

.ios-icon.with-image {
  background: transparent !important;
}

.app-icon-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: inherit;
  user-select: none;
  pointer-events: none;
}

.ios-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 13px;
  border: 0.5px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.ios-icon.with-image::after {
  border: none;
}

.icon-label {
  font-size: 11px;
  color: #ffffff;
  text-align: center;
  max-width: 68px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  font-weight: 500;
}

/* ─── 角标 ─── */
.icon-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: #ff3b30;
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  z-index: 1;
}

/* ─── 分页指示器 ─── */
.page-indicator {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 6px 0;
  flex-shrink: 0;
}

.indicator-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.32, 0.72, 0, 1);
}

.indicator-dot.active {
  background: rgba(255, 255, 255, 0.9);
  width: 7px;
}

/* ─── Dock 栏 ─── */
.dock {
  flex-shrink: 0;
  position: relative;
  margin: 0 10px 6px;
  padding: 10px 0;
}

.dock-bg {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  background: var(--bg-dock);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border: 0.5px solid rgba(255, 255, 255, 0.1);
}

.dock-icons {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 4px 0;
}

.dock-item {
  cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.32, 0.72, 0, 1);
  -webkit-tap-highlight-color: transparent;
}

.dock-item:active {
  transform: scale(0.88);
}

.dock-icon-size {
  width: 56px;
  height: 56px;
}
</style>
