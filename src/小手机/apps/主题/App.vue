<template>
  <div class="wallpaper-page">
    <!-- iOS 导航栏 -->
    <div class="wp-nav">
      <button class="nav-btn" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h1 class="nav-title">壁纸</h1>
      <div style="width:32px"></div>
    </div>

    <div class="wp-scroll">
      <!-- 当前壁纸预览 -->
      <div class="current-preview">
        <div class="preview-phone" :style="{ background: selectedTheme?.gradient || currentTheme.gradient }">
          <div class="preview-statusbar">
            <span>{{ currentTime }}</span>
          </div>
          <div class="preview-clock">{{ currentTime }}</div>
          <div class="preview-date">5月3日 星期六</div>
        </div>
        <div class="preview-actions">
          <button class="preview-btn" :class="{ active: previewMode === 'lock' }" @click="previewMode = 'lock'">锁定屏幕</button>
          <button class="preview-btn" :class="{ active: previewMode === 'home' }" @click="previewMode = 'home'">主屏幕</button>
        </div>
      </div>

      <!-- 添加新壁纸 -->
      <div class="section">
        <h3 class="section-title">添加新壁纸</h3>
        <div class="wp-grid">
          <div
            v-for="theme in recommendedThemes"
            :key="theme.id"
            class="wp-card"
            :class="{ selected: selectedTheme?.id === theme.id }"
            @click="selectedTheme = theme"
          >
            <div class="wp-preview" :style="{ background: theme.gradient }">
              <span class="wp-time">10:30</span>
            </div>
            <span class="wp-name">{{ theme.name }}</span>
          </div>
        </div>
      </div>

      <!-- 颜色分类 -->
      <div class="section">
        <h3 class="section-title">颜色</h3>
        <div class="color-row">
          <button
            v-for="color in colorCategories"
            :key="color.name"
            class="color-circle"
            :style="{ background: color.gradient }"
            @click="filterByColor(color.name)"
          ></button>
        </div>
      </div>

      <!-- 照片壁纸 -->
      <div class="section">
        <h3 class="section-title">照片壁纸</h3>
        <div class="wp-grid compact">
          <div v-for="i in 6" :key="i" class="wp-card compact">
            <div class="wp-preview" :style="{ background: photoGradients[(i - 1) % photoGradients.length] }">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部设置按钮 -->
    <Transition name="slide-up">
      <div v-if="selectedTheme" class="set-panel">
        <div class="set-preview" :style="{ background: selectedTheme.gradient }">
          <span class="set-time">10:30</span>
        </div>
        <div class="set-info">
          <span class="set-name">{{ selectedTheme.name }}</span>
          <span class="set-author">由 {{ selectedTheme.author }} 制作</span>
        </div>
        <div class="set-actions">
          <button class="set-btn" @click="applyTheme('lock')">设为锁屏</button>
          <button class="set-btn" @click="applyTheme('home')">设为主屏</button>
          <button class="set-btn primary" @click="applyTheme('both')">同时设定</button>
        </div>
        <button class="cancel-btn" @click="selectedTheme = null">取消</button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
const store = usePhoneStore();

interface Theme {
  id: string;
  name: string;
  author: string;
  gradient: string;
}

const selectedTheme = ref<Theme | null>(null);
const previewMode = ref('lock');
const currentTime = ref('');

const currentTheme: Theme = {
  id: 'default', name: '深邃夜空', author: '系统',
  gradient: 'linear-gradient(135deg, #0b0e14 0%, #1a1c24 100%)',
};

const recommendedThemes: Theme[] = [
  { id: 'aurora', name: '极光', author: '星空', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'sunset', name: '落日余晖', author: '黄昏', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'ocean', name: '深海蓝', author: '海洋', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'forest', name: '森林绿', author: '自然', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'sunrise', name: '日出', author: '清晨', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 'nebula', name: '星云', author: '宇宙', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
];

const colorCategories = [
  { name: '蓝色', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
  { name: '紫色', gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)' },
  { name: '粉色', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
  { name: '绿色', gradient: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { name: '橙色', gradient: 'linear-gradient(135deg, #f7971e, #ffd200)' },
  { name: '红色', gradient: 'linear-gradient(135deg, #ff416c, #ff4b2b)' },
  { name: '灰色', gradient: 'linear-gradient(135deg, #2c3e50, #bdc3c7)' },
  { name: '黑色', gradient: 'linear-gradient(135deg, #0f0c29, #302b63)' },
];

const photoGradients = [
  'linear-gradient(135deg, #e8d5b7, #c4a882)',
  'linear-gradient(135deg, #b8cfe8, #8fb0d4)',
  'linear-gradient(135deg, #d4e8b8, #a8d080)',
  'linear-gradient(135deg, #e8b8d4, #d490b8)',
  'linear-gradient(135deg, #b8e8e0, #80c8b8)',
  'linear-gradient(135deg, #e8c8b8, #d4a890)',
];

function updateTime() {
  const now = new Date();
  currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

let timeInterval: ReturnType<typeof setInterval>;
onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
});
onUnmounted(() => clearInterval(timeInterval));

function filterByColor(colorName: string) {
  toastr.info(`筛选 ${colorName} 壁纸`);
}

function applyTheme(target: string) {
  if (!selectedTheme.value) return;
  const targetLabel = target === 'both' ? '锁屏和主屏' : target === 'lock' ? '锁屏' : '主屏';
  store.reportAction({
    appId: 'themes', appName: '主题', action: '设置壁纸',
    summary: `用户将「${selectedTheme.value.name}」设为${targetLabel}壁纸`,
    data: { theme: selectedTheme.value.name, target },
  });
  toastr.success(`已设为${targetLabel}壁纸: ${selectedTheme.value.name}`);
  selectedTheme.value = null;
}
</script>

<style scoped>
.wallpaper-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary); position: relative;
}

/* ─── 导航栏 ─── */
.wp-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}

.nav-btn {
  border: none; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 4px;
}

.nav-title {
  font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 0;
}

/* ─── 滚动区 ─── */
.wp-scroll { flex: 1; overflow-y: auto; }

/* ─── 当前预览 ─── */
.current-preview {
  display: flex; flex-direction: column; align-items: center;
  padding: 20px 16px;
}

.preview-phone {
  width: 160px; height: 280px; border-radius: 24px;
  display: flex; flex-direction: column; align-items: center;
  padding: 16px 0; color: white; position: relative;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
}

.preview-statusbar {
  font-size: 10px; opacity: 0.6; margin-bottom: auto;
}

.preview-clock {
  font-size: 48px; font-weight: 200; line-height: 1;
}

.preview-date {
  font-size: 14px; opacity: 0.8; margin-top: 4px; margin-bottom: auto;
}

.preview-actions {
  display: flex; gap: 12px; margin-top: 12px;
}

.preview-btn {
  padding: 6px 16px; border: 1px solid var(--border-primary);
  border-radius: 16px; background: transparent;
  color: var(--text-secondary); font-size: 13px; cursor: pointer;
}
.preview-btn.active {
  background: var(--accent, #007aff); color: white;
  border-color: var(--accent, #007aff);
}

/* ─── 区块 ─── */
.section { padding: 0 16px 16px; }

.section-title {
  font-size: 20px; font-weight: 700; color: var(--text-primary);
  margin: 16px 0 12px;
}

/* ─── 壁纸网格 ─── */
.wp-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.wp-grid.compact {
  grid-template-columns: repeat(3, 1fr);
}

.wp-card {
  cursor: pointer; transition: all 0.15s;
  border-radius: 12px; overflow: hidden;
}

.wp-card.selected {
  outline: 3px solid var(--accent, #007aff);
  outline-offset: 2px;
}

.wp-card:active { transform: scale(0.95); }

.wp-preview {
  aspect-ratio: 9/16; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  position: relative;
}

.wp-card.compact .wp-preview {
  aspect-ratio: 9/16;
}

.wp-time {
  font-size: 16px; font-weight: 600; color: white;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.wp-name {
  display: block; text-align: center; margin-top: 6px;
  font-size: 12px; color: var(--text-secondary);
}

/* ─── 颜色圆 ─── */
.color-row {
  display: flex; gap: 10px; overflow-x: auto;
  scrollbar-width: none; padding: 4px 0;
}
.color-row::-webkit-scrollbar { display: none; }

.color-circle {
  width: 44px; height: 44px; border-radius: 50%;
  border: none; cursor: pointer; flex-shrink: 0;
  transition: transform 0.15s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.color-circle:active { transform: scale(0.9); }

/* ─── 底部设置面板 ─── */
.set-panel {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: var(--bg-primary);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 24px rgba(0,0,0,0.15);
  padding: 16px; z-index: 10;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}

.set-preview {
  width: 80px; height: 140px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
}

.set-time {
  font-size: 18px; font-weight: 600; color: white;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.set-info { text-align: center; }
.set-name { font-size: 16px; font-weight: 600; color: var(--text-primary); display: block; }
.set-author { font-size: 12px; color: var(--text-tertiary); }

.set-actions {
  display: flex; gap: 8px; width: 100%;
}

.set-btn {
  flex: 1; padding: 10px; border: 1px solid var(--border-primary);
  border-radius: 10px; background: transparent;
  color: var(--text-primary); font-size: 13px; cursor: pointer;
}
.set-btn.primary {
  background: var(--accent, #007aff); color: white;
  border-color: var(--accent, #007aff);
}

.cancel-btn {
  width: 100%; padding: 10px; border: none; border-radius: 10px;
  background: var(--bg-secondary); color: var(--text-secondary);
  font-size: 14px; cursor: pointer;
}

/* ─── 动画 ─── */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(100%); opacity: 0; }
</style>
