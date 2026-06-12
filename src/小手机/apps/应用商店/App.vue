<template>
  <div class="appstore">
    <!-- 顶部导航栏 -->
    <div class="store-nav">
      <button class="nav-back" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="nav-tabs">
        <button
          v-for="tab in navTabs"
          :key="tab.id"
          class="nav-tab"
          :class="{ active: activeNav === tab.id }"
          @click="activeNav = tab.id"
        >{{ tab.name }}</button>
      </div>
    </div>

    <div class="store-scroll">
      <!-- APP 详情页 -->
      <template v-if="detailApp">
        <div class="detail-page">
          <button class="detail-back" @click="selectedDetail = null">返回</button>
          <div class="detail-hero">
            <div class="app-icon-sm detail-icon" :class="{ 'with-image': getIconImage(detailApp.id, detailApp.icon) }" :style="iconGradient(detailApp.id)">
              <img v-if="getIconImage(detailApp.id, detailApp.icon)" class="store-app-icon-image" :src="getIconImage(detailApp.id, detailApp.icon)" alt="" draggable="false" />
              <svg v-else width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="getIcon(detailApp.icon)"></svg>
            </div>
            <div>
              <h2>{{ detailApp.name }}</h2>
              <p>{{ detailApp.description }}</p>
            </div>
            <button v-if="needsUpdate(detailApp.id)" class="get-btn" @click="updateApp(detailApp.id)">更新</button>
            <button v-else-if="isInstalled(detailApp.id)" class="open-btn-sm" @click="openApp(detailApp.id)">打开</button>
            <button v-else class="get-btn" @click="downloadApp(detailApp.id)">获取</button>
          </div>
          <div class="screenshot-row">
            <div v-for="i in 3" :key="i" class="screenshot-card" :style="iconGradient(detailApp.id)">
              {{ detailApp.name }} {{ i }}
            </div>
          </div>
          <section class="store-detail-section">
            <h3>更新日志</h3>
            <p>{{ detailApp.name }} 已适配小手机 v0.1.2，优化界面与交互反馈。</p>
          </section>
          <section class="store-detail-section">
            <h3>评论</h3>
            <div v-for="comment in appComments(detailApp.id)" :key="comment" class="store-comment">{{ comment }}</div>
          </section>
        </div>
      </template>

      <!-- Today 页面 -->
      <template v-else-if="activeNav === 'today' && !searchQuery">
        <div class="today-header">
          <span class="today-date">{{ todayDate }}</span>
          <h1 class="today-title">Today</h1>
        </div>

        <!-- Today 大卡片 -->
        <div class="today-card" @click="activeNav = 'apps'">
          <div class="today-card-bg">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1">
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>
            </svg>
          </div>
          <div class="today-card-content">
            <span class="today-card-tag">编辑精选</span>
            <h2 class="today-card-title">发现精彩应用</h2>
            <p class="today-card-desc">浏览并安装你喜爱的应用，让手机更有趣</p>
          </div>
        </div>

        <!-- 推荐 APP 横向列表 -->
        <div class="section-header">
          <h3>推荐应用</h3>
          <button class="see-all" @click="activeNav = 'apps'">查看全部</button>
        </div>
        <div class="app-scroll-row">
          <div
            v-for="app in recommendedApps"
            :key="app.id"
            class="app-scroll-card"
            @click="selectedDetail = app.id"
          >
            <div class="scroll-card-icon" :class="{ 'with-image': getIconImage(app.id, app.icon) }" :style="iconGradient(app.id)">
              <img v-if="getIconImage(app.id, app.icon)" class="store-app-icon-image" :src="getIconImage(app.id, app.icon)" alt="" draggable="false" />
              <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="getIcon(app.icon)"></svg>
            </div>
            <div class="scroll-card-info">
              <span class="scroll-card-name">{{ app.name }}</span>
              <span class="scroll-card-desc">{{ app.description }}</span>
            </div>
            <button
              v-if="!isInstalled(app.id)"
              class="get-btn"
              @click.stop="downloadApp(app.id)"
            >获取</button>
            <button
              v-else
              class="open-btn-sm"
              @click.stop="openApp(app.id)"
            >打开</button>
          </div>
        </div>
      </template>

      <!-- 应用列表页 -->
      <template v-else-if="activeNav === 'apps' || searchQuery">
        <!-- 搜索栏 -->
        <div class="search-container">
          <div class="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" v-model="searchQuery" placeholder="搜索" class="search-input" />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" opacity="0.3"/>
                <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" fill="none"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- 分类标签 -->
        <div class="category-pills">
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="pill"
            :class="{ active: activeCategory === cat.id }"
            @click="activeCategory = cat.id"
          >{{ cat.name }}</button>
        </div>

        <!-- APP 列表 -->
        <div class="app-list">
          <div v-for="(app, index) in filteredApps" :key="app.id" class="app-row">
            <span class="app-rank" v-if="!searchQuery">{{ index + 1 }}</span>
            <div class="app-icon-sm" :class="{ 'with-image': getIconImage(app.id, app.icon) }" :style="iconGradient(app.id)">
              <img v-if="getIconImage(app.id, app.icon)" class="store-app-icon-image" :src="getIconImage(app.id, app.icon)" alt="" draggable="false" />
              <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" v-html="getIcon(app.icon)"></svg>
            </div>
            <div class="app-info" @click="selectedDetail = app.id">
              <span class="app-name">{{ app.name }}</span>
              <span class="app-subtitle">{{ app.description }}</span>
            </div>
            <div class="app-action">
              <template v-if="isDownloading(app.id)">
                <div class="progress-circle">
                  <svg width="28" height="28" viewBox="0 0 28 28">
                    <circle cx="14" cy="14" r="11" fill="none" stroke="var(--bg-active)" stroke-width="2"/>
                    <circle cx="14" cy="14" r="11" fill="none" stroke="var(--accent)" stroke-width="2"
                      stroke-linecap="round"
                      :stroke-dasharray="69.1"
                      :stroke-dashoffset="69.1 - (69.1 * getProgress(app.id) / 100)"
                      transform="rotate(-90 14 14)"
                    />
                  </svg>
                </div>
              </template>
              <button v-else-if="isInstalled(app.id)" class="open-btn-sm" @click="openApp(app.id)">打开</button>
              <button v-else class="get-btn" @click="downloadApp(app.id)">获取</button>
            </div>
          </div>

          <div v-if="filteredApps.length === 0" class="empty-state">
            <p>未找到相关应用</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { useAppRegistry } from '../../stores/app-registry';
import { APP_LIST, getIconPath, getAppColor } from '../../utils/icons';
import { getAppIconImage } from '../../utils/app-icon-images';

const store = usePhoneStore();
const registry = useAppRegistry();

const searchQuery = ref('');
const activeNav = ref('today');
const activeCategory = ref('all');
const selectedDetail = ref<string | null>(null);
const updatedApps = ref<string[]>([]);
const updateCandidates = ['messages', 'delivery', 'shop', 'music', 'wallet'];

const navTabs = [
  { id: 'today', name: 'Today' },
  { id: 'apps', name: '应用' },
];

const categories = [
  { id: 'all', name: '全部' },
  { id: 'social', name: '社交' },
  { id: 'life', name: '生活' },
  { id: 'entertainment', name: '娱乐' },
  { id: 'shopping', name: '购物' },
  { id: 'tools', name: '工具' },
];

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
  settings: 'linear-gradient(135deg, #8e8e93, #636366)',
  appstore: 'linear-gradient(135deg, #007aff, #5ac8fa)',
  live: 'linear-gradient(135deg, #ff2d55, #ff0050)',
  secondhand: 'linear-gradient(135deg, #ffd60a, #ffcc00)',
};

function iconGradient(appId: string): Record<string, string> {
  return { background: ICON_GRADIENTS[appId] || `linear-gradient(135deg, ${getAppColor(appId)}, ${getAppColor(appId)}dd)` };
}

const todayDate = computed(() => {
  const d = new Date();
  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  const days = ['周日','周一','周二','周三','周四','周五','周六'];
  return `${days[d.getDay()]}  ${months[d.getMonth()]} ${d.getDate()}日`;
});

const recommendedApps = computed(() => {
  return APP_LIST.filter(a => ['messages', 'music', 'forum', 'bilibili', 'tiktok', 'shop'].includes(a.id));
});

const filteredApps = computed(() => {
  let list = APP_LIST;
  if (activeCategory.value !== 'all') {
    list = list.filter(a => a.category === activeCategory.value);
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
  }
  return list;
});
const detailApp = computed(() => APP_LIST.find(a => a.id === selectedDetail.value) || null);

function getIcon(icon: string): string { return getIconPath(icon); }
function getIconImage(appId: string, icon: string): string | undefined { return getAppIconImage(appId) ?? getAppIconImage(icon); }
function isInstalled(appId: string): boolean { return registry.getApp(appId)?.installed ?? false; }
function isDownloading(appId: string): boolean {
  const app = registry.getApp(appId);
  return !!(app && !app.installed && (app.downloadProgress || 0) > 0 && (app.downloadProgress || 0) < 100);
}
function getProgress(appId: string): number { return registry.getApp(appId)?.downloadProgress || 0; }
function needsUpdate(appId: string): boolean {
  return isInstalled(appId) && updateCandidates.includes(appId) && !updatedApps.value.includes(appId);
}

function appComments(appId: string): string[] {
  const app = APP_LIST.find(a => a.id === appId);
  return [
    `界面很像真的 ${app?.name || 'APP'}，打开速度也不错。`,
    '希望后续能继续增加剧情联动。',
    '更新后交互更完整了。',
  ];
}

async function downloadApp(appId: string) {
  await registry.downloadApp(appId);
  toastr.success(`${APP_LIST.find(a => a.id === appId)?.name || appId} 安装完成`);
}

async function updateApp(appId: string) {
  const app = registry.getApp(appId);
  if (app) app.downloadProgress = 0;
  for (const progress of [30, 65, 100]) {
    await new Promise(resolve => setTimeout(resolve, 120));
    if (app) app.downloadProgress = progress;
  }
  updatedApps.value.push(appId);
  toastr.success(`${APP_LIST.find(a => a.id === appId)?.name || appId} 已更新`);
}

function openApp(appId: string) { store.openApp(appId); }
</script>

<style scoped>
.appstore {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

/* ─── 导航栏 ─── */
.store-nav {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 12px;
  border-bottom: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}

.nav-back {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: transparent; color: var(--accent);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

.nav-tabs { display: flex; gap: 4px; }

.nav-tab {
  padding: 6px 16px; border: none; border-radius: 18px;
  background: transparent; color: var(--text-secondary);
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}

.nav-tab.active {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.store-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.detail-page { padding: 16px; }
.detail-back {
  border: none; background: transparent; color: var(--accent);
  font-size: 15px; padding: 0 0 12px; cursor: pointer;
}
.detail-hero {
  display: grid; grid-template-columns: 64px 1fr auto; gap: 12px; align-items: center;
  padding-bottom: 16px; border-bottom: 0.5px solid var(--border-secondary);
}
.detail-icon { width: 64px; height: 64px; border-radius: 14px; }
.detail-hero h2 { margin: 0 0 4px; font-size: 20px; color: var(--text-primary); }
.detail-hero p { margin: 0; font-size: 13px; color: var(--text-tertiary); line-height: 1.4; }
.screenshot-row {
  display: flex; gap: 10px; overflow-x: auto; padding: 16px 0; scrollbar-width: none;
}
.screenshot-row::-webkit-scrollbar { display: none; }
.screenshot-card {
  flex: 0 0 130px; height: 210px; border-radius: 14px; color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; text-align: center; padding: 12px;
}
.store-detail-section {
  padding: 12px 0; border-top: 0.5px solid var(--border-secondary);
}
.store-detail-section h3 { margin: 0 0 8px; font-size: 16px; color: var(--text-primary); }
.store-detail-section p,
.store-comment { margin: 0 0 8px; font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

/* ─── Today ─── */
.today-header {
  padding: 20px 20px 12px;
}

.today-date {
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.today-title {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-primary);
  margin: 4px 0 0;
}

.today-card {
  margin: 0 16px 20px;
  border-radius: 16px;
  background: linear-gradient(145deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
  cursor: pointer;
  position: relative;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  transition: transform 0.2s;
}

.today-card:active { transform: scale(0.98); }

.today-card-bg {
  position: absolute;
  right: 20px;
  top: 24px;
  opacity: 0.4;
}

.today-card-content {
  padding: 20px;
  position: relative;
}

.today-card-tag {
  display: inline-block;
  padding: 3px 10px;
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  font-size: 11px;
  color: rgba(255,255,255,0.9);
  font-weight: 600;
  margin-bottom: 8px;
  backdrop-filter: blur(4px);
}

.today-card-title {
  font-size: 22px;
  font-weight: 700;
  color: white;
  margin: 0 0 6px;
}

.today-card-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.75);
  margin: 0;
  line-height: 1.4;
}

/* ─── Section ─── */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.see-all {
  border: none; background: transparent;
  color: var(--accent); font-size: 14px; font-weight: 500;
  cursor: pointer;
}

/* ─── 横向 APP 卡片 ─── */
.app-scroll-row {
  padding: 0 16px 20px;
}

.app-scroll-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 0.5px solid var(--border-secondary);
  cursor: pointer;
}

.app-scroll-card:last-child { border-bottom: none; }

.scroll-card-icon {
  width: 52px; height: 52px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.scroll-card-icon.with-image,
.app-icon-sm.with-image {
  background: transparent !important;
  overflow: hidden;
}

.store-app-icon-image {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  border-radius: inherit;
  user-select: none;
  pointer-events: none;
}

.scroll-card-icon::after {
  content: ''; position: absolute; inset: 0;
  border-radius: 12px; border: 0.5px solid rgba(255,255,255,0.15);
  pointer-events: none;
}

.scroll-card-icon.with-image::after,
.app-icon-sm.with-image::after {
  border: none;
}

.scroll-card-info { flex: 1; min-width: 0; }

.scroll-card-name {
  font-size: 15px; font-weight: 500;
  color: var(--text-primary); display: block;
}

.scroll-card-desc {
  font-size: 12px; color: var(--text-tertiary);
  display: block; margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ─── 搜索 ─── */
.search-container { padding: 8px 16px; }

.search-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--bg-input);
  border-radius: 10px; color: var(--text-tertiary);
}

.search-input {
  flex: 1; border: none; background: transparent;
  color: var(--text-primary); font-size: 15px; outline: none;
}

.search-clear {
  width: 20px; height: 20px; border: none; background: transparent;
  color: var(--text-tertiary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}

/* ─── 分类标签 ─── */
.category-pills {
  display: flex; gap: 6px; padding: 4px 16px 12px;
  overflow-x: auto; scrollbar-width: none;
}
.category-pills::-webkit-scrollbar { display: none; }

.pill {
  flex-shrink: 0; padding: 6px 16px; border: none;
  border-radius: 20px; background: var(--bg-tertiary);
  color: var(--text-secondary); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.2s;
}

.pill.active {
  background: var(--accent);
  color: white;
}

/* ─── APP 列表 ─── */
.app-list { padding: 0 16px 20px; }

.app-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0;
  border-bottom: 0.5px solid var(--border-secondary);
}

.app-row:last-child { border-bottom: none; }

.app-rank {
  font-size: 18px; font-weight: 700;
  color: var(--text-tertiary); width: 24px;
  text-align: center; flex-shrink: 0;
}

.app-icon-sm {
  width: 52px; height: 52px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; position: relative;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.app-icon-sm::after {
  content: ''; position: absolute; inset: 0;
  border-radius: 12px; border: 0.5px solid rgba(255,255,255,0.15);
  pointer-events: none;
}

.app-info { flex: 1; min-width: 0; }

.app-name {
  font-size: 15px; font-weight: 500;
  color: var(--text-primary); display: block;
}

.app-subtitle {
  font-size: 12px; color: var(--text-tertiary);
  display: block; margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.app-action { flex-shrink: 0; }

/* ─── 按钮 ─── */
.get-btn {
  padding: 5px 18px; border: none; border-radius: 16px;
  background: var(--accent); color: white;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.15s; min-width: 60px;
}

.get-btn:active { transform: scale(0.95); }

.open-btn-sm {
  padding: 5px 18px; border: 1.5px solid var(--accent);
  border-radius: 16px; background: transparent;
  color: var(--accent); font-size: 14px; font-weight: 600;
  cursor: pointer; min-width: 60px;
}

.open-btn-sm:active { background: var(--accent-bg); }

/* ─── 进度圆 ─── */
.progress-circle {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
}

.empty-state {
  padding: 60px 20px; text-align: center;
  color: var(--text-muted); font-size: 15px;
}
</style>
