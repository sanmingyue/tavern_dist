<template>
  <div class="files-page">
    <!-- iOS 导航栏 -->
    <div class="files-nav">
      <button class="nav-btn" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h1 class="nav-title">浏览</h1>
      <button class="nav-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
      </button>
    </div>

    <!-- Tab 切换 -->
    <div class="files-tabs">
      <button :class="{ active: activeTab === 'browse' }" @click="activeTab = 'browse'">浏览</button>
      <button :class="{ active: activeTab === 'recent' }" @click="activeTab = 'recent'">最近项目</button>
    </div>

    <div class="files-scroll">
      <!-- 位置 -->
      <template v-if="activeTab === 'browse'">
        <div class="ios-group">
          <div class="group-header">位置</div>
          <div class="ios-cell" v-for="loc in locations" :key="loc.name">
            <div class="cell-icon" :style="{ backgroundColor: loc.color }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" v-html="loc.icon"></svg>
            </div>
            <span class="cell-label">{{ loc.name }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <!-- 个人收藏 -->
        <div class="ios-group">
          <div class="group-header">个人收藏</div>
          <div class="ios-cell" v-for="fav in favorites" :key="fav.name">
            <div class="cell-icon folder">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--accent, #007aff)" stroke="none">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <span class="cell-label">{{ fav.name }}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <!-- 标签 -->
        <div class="ios-group">
          <div class="group-header">标签</div>
          <div class="tags-row">
            <span v-for="tag in tags" :key="tag.name" class="file-tag" :style="{ '--tag-color': tag.color }">
              <span class="tag-dot" :style="{ backgroundColor: tag.color }"></span>
              {{ tag.name }}
            </span>
          </div>
        </div>
      </template>

      <!-- 最近文件 -->
      <template v-else>
        <div class="recent-list">
          <div v-for="file in recentFiles" :key="file.name" class="file-item">
            <div class="file-icon" :style="{ backgroundColor: file.color }">
              <span class="file-ext">{{ file.ext }}</span>
            </div>
            <div class="file-info">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-meta">{{ file.size }} · {{ file.date }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
const store = usePhoneStore();

const activeTab = ref('browse');

const locations = [
  { name: 'iCloud Drive', color: '#007aff', icon: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>' },
  { name: '我的 iPhone', color: '#8e8e93', icon: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>' },
];

const favorites = [
  { name: '下载' },
  { name: '桌面' },
  { name: '文稿' },
];

const tags = [
  { name: '红色', color: '#ff3b30' },
  { name: '橙色', color: '#ff9500' },
  { name: '黄色', color: '#ffcc00' },
  { name: '绿色', color: '#34c759' },
  { name: '蓝色', color: '#007aff' },
  { name: '紫色', color: '#af52de' },
];

const recentFiles = [
  { name: '工作笔记.txt', ext: 'TXT', size: '2.3 KB', date: '今天', color: '#8e8e93' },
  { name: '假期照片.jpg', ext: 'JPG', size: '4.2 MB', date: '昨天', color: '#34c759' },
  { name: '预算表.xlsx', ext: 'XLS', size: '128 KB', date: '昨天', color: '#34c759' },
  { name: '演示文稿.pdf', ext: 'PDF', size: '8.1 MB', date: '3天前', color: '#ff3b30' },
  { name: '音频录音.m4a', ext: 'M4A', size: '12 MB', date: '上周', color: '#af52de' },
];
</script>

<style scoped>
.files-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary);
}

/* ─── 导航栏 ─── */
.files-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}

.nav-btn {
  border: none; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 4px;
}

.nav-title {
  font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 0;
}

/* ─── Tab ─── */
.files-tabs {
  display: flex; justify-content: center; gap: 0;
  padding: 8px 16px; flex-shrink: 0;
}

.files-tabs button {
  flex: 1; padding: 6px 12px; border: none;
  background: var(--bg-tertiary); color: var(--text-tertiary);
  font-size: 13px; font-weight: 500; cursor: pointer;
}

.files-tabs button:first-child { border-radius: 8px 0 0 8px; }
.files-tabs button:last-child { border-radius: 0 8px 8px 0; }

.files-tabs button.active {
  background: var(--accent, #007aff); color: white;
}

/* ─── 滚动 ─── */
.files-scroll { flex: 1; overflow-y: auto; padding: 0; }

/* ─── iOS 分组 ─── */
.ios-group {
  margin: 8px 16px;
  background: var(--bg-card, var(--bg-primary));
  border-radius: 10px; overflow: hidden;
}

.group-header {
  font-size: 13px; font-weight: 400; color: var(--text-secondary);
  padding: 16px 16px 6px; text-transform: uppercase;
  letter-spacing: 0.3px;
  background: transparent;
  margin: 0;
}

.ios-group .group-header {
  padding: 0; margin: 8px 16px 0;
  background: transparent;
}

.ios-cell {
  display: flex; align-items: center; gap: 12px;
  padding: 11px 16px; min-height: 44px;
  border-bottom: 0.5px solid var(--border-secondary);
}
.ios-cell:last-child { border-bottom: none; }

.cell-icon {
  width: 29px; height: 29px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.cell-icon.folder { background: transparent; }

.cell-label {
  font-size: 16px; color: var(--text-primary); flex: 1;
}

/* ─── 标签 ─── */
.tags-row {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 12px 16px;
}

.file-tag {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 14px;
  background: var(--bg-tertiary);
  font-size: 13px; color: var(--text-primary);
}

.tag-dot {
  width: 10px; height: 10px; border-radius: 50%;
}

/* ─── 最近文件 ─── */
.recent-list { padding: 8px 16px; }

.file-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0;
  border-bottom: 0.5px solid var(--border-secondary);
}

.file-icon {
  width: 40px; height: 48px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.file-ext {
  font-size: 10px; font-weight: 700; color: white;
  letter-spacing: 0.5px;
}

.file-info { flex: 1; display: flex; flex-direction: column; }
.file-name { font-size: 15px; color: var(--text-primary); }
.file-meta { font-size: 12px; color: var(--text-tertiary); margin-top: 2px; }
</style>
