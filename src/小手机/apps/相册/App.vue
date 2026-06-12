<template>
  <div class="photos-page">
    <!-- iOS 导航栏 -->
    <div class="photos-nav">
      <button class="nav-btn" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h1 class="nav-title">相册</h1>
      <button class="nav-btn select-btn">选择</button>
    </div>

    <!-- Tab 切换 -->
    <div class="photos-tabs">
      <button v-for="tab in tabs" :key="tab.id" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        {{ tab.label }}
      </button>
    </div>

    <!-- 照片视图 -->
    <div class="photos-scroll">
      <template v-if="activeTab === 'photos'">
        <div v-for="group in photoGroups" :key="group.date" class="photo-group">
          <div class="group-header">
            <span class="group-date">{{ group.date }}</span>
            <span class="group-location">{{ group.location }}</span>
          </div>
          <div class="photo-grid">
            <div v-for="photo in group.photos" :key="photo.id" class="photo-cell" :style="{ backgroundColor: photo.color }" @click="viewPhoto(photo)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
              <span v-if="photo.type === 'video'" class="video-badge">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                {{ photo.duration }}
              </span>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="activeTab === 'albums'">
        <div class="albums-grid">
          <div v-for="album in albums" :key="album.name" class="album-card">
            <div class="album-cover" :style="{ backgroundColor: album.color }">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
              </svg>
            </div>
            <span class="album-name">{{ album.name }}</span>
            <span class="album-count">{{ album.count }}</span>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="for-you">
          <div class="memory-card" style="background: linear-gradient(135deg, #667eea, #764ba2);">
            <span class="memory-label">回忆</span>
            <h3 class="memory-title">去年今天</h3>
            <span class="memory-date">2024年5月3日</span>
          </div>
          <div class="memory-card" style="background: linear-gradient(135deg, #f093fb, #f5576c);">
            <span class="memory-label">精选</span>
            <h3 class="memory-title">最佳照片</h3>
            <span class="memory-date">自动生成</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
const store = usePhoneStore();

const tabs = [
  { id: 'photos', label: '照片' },
  { id: 'albums', label: '相簿' },
  { id: 'foryou', label: '为你推荐' },
];
const activeTab = ref('photos');

interface Photo {
  id: string;
  color: string;
  type: 'photo' | 'video';
  duration?: string;
}

const photoColors = ['#e8d5b7', '#b8cfe8', '#d4e8b8', '#e8b8d4', '#b8e8e0', '#e8c8b8', '#c8b8e8', '#e8e0b8', '#b8d8e8'];

const photoGroups = ref<{ date: string; location: string; photos: Photo[] }[]>([
  {
    date: '今天',
    location: '北京',
    photos: Array.from({ length: 6 }, (_, i): Photo => ({
      id: `p_today_${i}`, color: photoColors[i % photoColors.length],
      type: i === 2 ? 'video' : 'photo',
      duration: i === 2 ? '0:15' : undefined,
    })),
  },
  {
    date: '昨天',
    location: '上海',
    photos: Array.from({ length: 9 }, (_, i): Photo => ({
      id: `p_yest_${i}`, color: photoColors[(i + 3) % photoColors.length],
      type: i === 5 ? 'video' : 'photo',
      duration: i === 5 ? '1:23' : undefined,
    })),
  },
  {
    date: '5月1日',
    location: '杭州',
    photos: Array.from({ length: 4 }, (_, i): Photo => ({
      id: `p_may1_${i}`, color: photoColors[(i + 6) % photoColors.length],
      type: 'photo',
    })),
  },
]);

const albums = ref([
  { name: '最近项目', count: 42, color: '#3498db' },
  { name: '个人收藏', count: 18, color: '#e74c3c' },
  { name: '视频', count: 7, color: '#9b59b6' },
  { name: '自拍', count: 23, color: '#e91e63' },
  { name: '截屏', count: 56, color: '#2ecc71' },
  { name: '全景照片', count: 3, color: '#f39c12' },
]);

function viewPhoto(photo: Photo) {
  store.reportAction({
    appId: 'photos', appName: '相册', action: '查看照片',
    summary: `用户在相册查看了一张${photo.type === 'video' ? '视频' : '照片'}`,
    data: { photoId: photo.id, type: photo.type },
  });
}
</script>

<style scoped>
.photos-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-primary);
}

/* ─── 导航栏 ─── */
.photos-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; flex-shrink: 0;
}

.nav-btn {
  border: none; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 4px;
}

.select-btn {
  color: var(--accent, #007aff); font-size: 15px;
}

.nav-title {
  font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 0;
}

/* ─── Tab ─── */
.photos-tabs {
  display: flex; justify-content: center; gap: 0;
  padding: 0 16px 8px; flex-shrink: 0;
}

.photos-tabs button {
  flex: 1; padding: 6px 12px; border: none;
  background: var(--bg-secondary); color: var(--text-tertiary);
  font-size: 13px; font-weight: 500; cursor: pointer;
}

.photos-tabs button:first-child { border-radius: 8px 0 0 8px; }
.photos-tabs button:last-child { border-radius: 0 8px 8px 0; }

.photos-tabs button.active {
  background: var(--accent, #007aff); color: white;
}

/* ─── 照片滚动区 ─── */
.photos-scroll { flex: 1; overflow-y: auto; }

/* ─── 照片分组 ─── */
.photo-group { margin-bottom: 16px; }

.group-header {
  display: flex; justify-content: space-between; align-items: baseline;
  padding: 8px 16px 4px;
}

.group-date { font-size: 15px; font-weight: 700; color: var(--text-primary); }
.group-location { font-size: 13px; color: var(--text-tertiary); }

/* ─── 照片网格 ─── */
.photo-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 2px; padding: 0 2px;
}

.photo-cell {
  aspect-ratio: 1; display: flex; align-items: center; justify-content: center;
  cursor: pointer; position: relative;
  transition: opacity 0.15s;
}
.photo-cell:active { opacity: 0.7; }

.video-badge {
  position: absolute; bottom: 4px; right: 4px;
  display: flex; align-items: center; gap: 2px;
  padding: 1px 5px; border-radius: 4px;
  background: rgba(0,0,0,0.6); color: white;
  font-size: 10px; font-weight: 500;
}

/* ─── 相簿 ─── */
.albums-grid {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 16px; padding: 12px 16px;
}

.album-card { cursor: pointer; }

.album-cover {
  width: 100%; aspect-ratio: 1; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 6px;
}

.album-name {
  font-size: 14px; font-weight: 500; color: var(--text-primary);
  display: block;
}

.album-count {
  font-size: 12px; color: var(--text-tertiary);
}

/* ─── 为你推荐 ─── */
.for-you { padding: 12px 16px; display: flex; flex-direction: column; gap: 12px; }

.memory-card {
  padding: 20px; border-radius: 16px; color: white;
  display: flex; flex-direction: column; gap: 4px;
}

.memory-label { font-size: 11px; opacity: 0.7; text-transform: uppercase; letter-spacing: 1px; }
.memory-title { font-size: 20px; font-weight: 700; margin: 0; }
.memory-date { font-size: 13px; opacity: 0.8; }
</style>
