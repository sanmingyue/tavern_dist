<template>
  <div class="map-page">
    <!-- 地图背景 -->
    <div class="map-bg">
      <!-- SVG 模拟地图 -->
      <svg viewBox="0 0 400 400" class="map-svg">
        <!-- 道路网格 -->
        <g stroke="var(--map-road)" stroke-width="3" fill="none" opacity="0.6">
          <line x1="0" y1="100" x2="400" y2="100"/>
          <line x1="0" y1="200" x2="400" y2="200"/>
          <line x1="0" y1="300" x2="400" y2="300"/>
          <line x1="100" y1="0" x2="100" y2="400"/>
          <line x1="200" y1="0" x2="200" y2="400"/>
          <line x1="300" y1="0" x2="300" y2="400"/>
        </g>
        <!-- 主干道 -->
        <g stroke="var(--map-main-road)" stroke-width="5" fill="none" opacity="0.8">
          <line x1="0" y1="200" x2="400" y2="200"/>
          <line x1="200" y1="0" x2="200" y2="400"/>
          <path d="M50 350 Q200 100 350 50"/>
        </g>
        <!-- 建筑块 -->
        <g fill="var(--map-building)" opacity="0.3">
          <rect x="110" y="110" width="80" height="80" rx="4"/>
          <rect x="210" y="110" width="80" height="80" rx="4"/>
          <rect x="110" y="210" width="80" height="80" rx="4"/>
          <rect x="210" y="210" width="80" height="80" rx="4"/>
          <rect x="310" y="110" width="60" height="60" rx="4"/>
          <rect x="30" y="210" width="60" height="60" rx="4"/>
        </g>
        <!-- 当前位置标记 -->
        <g transform="translate(200, 200)">
          <circle r="20" fill="var(--accent, #007aff)" opacity="0.15"/>
          <circle r="8" fill="var(--accent, #007aff)" stroke="white" stroke-width="2"/>
        </g>
      </svg>
    </div>

    <!-- 搜索栏（浮动） -->
    <div class="map-search-bar">
      <button class="back-btn" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="search-field">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>搜索地点</span>
      </div>
    </div>

    <!-- 底部卡片 -->
    <div class="map-bottom-card">
      <div class="card-handle"></div>
      <div class="card-content">
        <div class="card-row">
          <div class="card-icon loc">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent, #007aff)" stroke="none">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
          <div class="card-info">
            <span class="card-title">当前位置</span>
            <span class="card-subtitle">功能开发中</span>
          </div>
        </div>

        <div class="quick-actions">
          <button class="quick-btn" v-for="btn in quickBtns" :key="btn.label">
            <div class="quick-icon" :style="{ backgroundColor: btn.color }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" v-html="btn.icon"></svg>
            </div>
            <span>{{ btn.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
const store = usePhoneStore();

const quickBtns = [
  { label: '导航', color: '#007aff', icon: '<polygon points="3 11 22 2 13 21 11 13 3 11"/>' },
  { label: '附近', color: '#34c759', icon: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><line x1="2" y1="12" x2="22" y2="12"/>' },
  { label: '收藏', color: '#ff9500', icon: '<path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>' },
  { label: '分享', color: '#5856d6', icon: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>' },
];
</script>

<style scoped>
.map-page {
  --map-road: rgba(180,180,180,0.4);
  --map-main-road: rgba(140,140,140,0.5);
  --map-building: rgba(100,100,100,0.3);

  height: 100%; display: flex; flex-direction: column;
  position: relative; overflow: hidden;
  background: var(--bg-secondary);
}

/* ─── 地图背景 ─── */
.map-bg {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, #e8eef5 0%, #d0dae6 100%);
}

.map-svg { width: 100%; height: 100%; }

/* ─── 搜索栏 ─── */
.map-search-bar {
  position: relative; z-index: 2;
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; margin: 8px 12px;
  background: var(--bg-card, rgba(255,255,255,0.95));
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.back-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: transparent; color: var(--accent, #007aff);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.search-field {
  flex: 1; display: flex; align-items: center; gap: 8px;
  color: var(--text-tertiary); font-size: 15px;
}

/* ─── 底部卡片 ─── */
.map-bottom-card {
  position: absolute; bottom: 0; left: 0; right: 0; z-index: 2;
  background: var(--bg-card, rgba(255,255,255,0.97));
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
  padding: 8px 16px 16px;
  backdrop-filter: blur(12px);
}

.card-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: var(--border-primary, rgba(0,0,0,0.15));
  margin: 0 auto 12px;
}

.card-row {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 16px;
}

.card-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}

.card-icon.loc { background: rgba(0,122,255,0.1); }

.card-info { flex: 1; }
.card-title { font-size: 16px; font-weight: 600; color: var(--text-primary); display: block; }
.card-subtitle { font-size: 13px; color: var(--text-tertiary); }

.quick-actions {
  display: flex; justify-content: space-around;
}

.quick-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  border: none; background: transparent; cursor: pointer;
}

.quick-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
}

.quick-btn span { font-size: 11px; color: var(--text-secondary); }
</style>
