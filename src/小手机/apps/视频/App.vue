<template>
  <div class="video-page">
    <header class="video-header">
      <button class="icon-btn" @click="store.goBack()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <nav>
        <button class="active">推荐</button>
        <button>关注</button>
        <button>放映厅</button>
      </nav>
      <button class="icon-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </header>

    <main class="video-content">
      <section class="featured-video">
        <div class="video-screen">
          <svg viewBox="0 0 120 90" fill="none" aria-hidden="true">
            <rect x="9" y="12" width="102" height="66" rx="16" fill="rgba(255,255,255,.12)" />
            <path d="M52 34v22l19-11-19-11Z" fill="white" opacity=".86" />
          </svg>
          <div class="video-side-actions">
            <span>12.8w</span>
            <span>4082</span>
            <span>分享</span>
          </div>
        </div>
        <div class="featured-meta">
          <strong>深夜城市漫游 Vol.18</strong>
          <p>短视频播放框、互动栏、评论抽屉入口已完成。</p>
        </div>
      </section>

      <div class="channel-row">
        <button v-for="channel in channels" :key="channel" :class="{ active: channel === '精选' }">{{ channel }}</button>
      </div>

      <section class="video-grid">
        <article v-for="item in videos" :key="item.title" class="video-card">
          <div class="thumb" :style="{ background: item.color }">
            <svg viewBox="0 0 62 48" fill="none" stroke="rgba(255,255,255,.48)" stroke-width="2">
              <rect x="6" y="7" width="50" height="34" rx="8" />
              <path d="M27 18v12l11-6-11-6Z" fill="rgba(255,255,255,.58)" stroke="none" />
            </svg>
            <span>{{ item.duration }}</span>
          </div>
          <h3>{{ item.title }}</h3>
          <p>{{ item.author }} · {{ item.views }}播放</p>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';

const store = usePhoneStore();

const channels = ['精选', '动画', '影视', '音乐', '生活', '游戏'];

const videos = [
  { title: '一杯咖啡的十分钟', author: '城市观察员', views: '5.2万', duration: '03:18', color: '#ff4757' },
  { title: '从零搭一个虚拟手机 UI', author: '前端笔记', views: '1.8万', duration: '08:42', color: '#1e90ff' },
  { title: '雨声白噪音循环', author: '睡眠电台', views: '12万', duration: '11:09', color: '#2f3542' },
  { title: '本周好物开箱', author: '日常研究所', views: '7.6万', duration: '05:20', color: '#ffa502' },
];
</script>

<style scoped>
.video-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0a0a0d;
  color: white;
}

.video-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 0, 0, 0.82);
}

.icon-btn {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  flex-shrink: 0;
}

.icon-btn svg {
  width: 18px;
  height: 18px;
}

.video-header nav {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.video-header nav button,
.channel-row button {
  border: 0;
  border-radius: 15px;
  padding: 6px 12px;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  cursor: pointer;
}

.video-header nav .active,
.channel-row .active {
  color: white;
  background: #ff4757;
}

.video-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px 16px;
}

.featured-video {
  overflow: hidden;
  border-radius: 20px;
  background: #111318;
}

.video-screen {
  position: relative;
  min-height: 220px;
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 28% 25%, rgba(255, 71, 87, 0.55), transparent 34%),
    linear-gradient(135deg, #151821, #050509);
}

.video-screen > svg {
  width: 124px;
  height: 94px;
}

.video-side-actions {
  position: absolute;
  right: 10px;
  bottom: 12px;
  display: grid;
  gap: 8px;
  text-align: center;
  font-size: 11px;
}

.video-side-actions span {
  border-radius: 999px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.12);
}

.featured-meta {
  padding: 12px;
}

.featured-meta strong {
  font-size: 16px;
}

.featured-meta p {
  margin: 5px 0 0;
  color: rgba(255, 255, 255, 0.58);
  font-size: 12px;
}

.channel-row {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding: 12px 0;
  scrollbar-width: none;
}

.channel-row::-webkit-scrollbar {
  display: none;
}

.channel-row button {
  flex: 0 0 auto;
  background: rgba(255, 255, 255, 0.08);
  font-size: 12px;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.video-card {
  overflow: hidden;
  border-radius: 14px;
  background: #111318;
}

.thumb {
  position: relative;
  height: 100px;
  display: grid;
  place-items: center;
}

.thumb svg {
  width: 58px;
  height: 46px;
}

.thumb span {
  position: absolute;
  right: 7px;
  bottom: 7px;
  border-radius: 8px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.48);
  color: white;
  font-size: 10px;
}

.video-card h3 {
  margin: 8px 9px 3px;
  color: white;
  font-size: 13px;
  line-height: 1.35;
}

.video-card p {
  margin: 0 9px 10px;
  color: rgba(255, 255, 255, 0.48);
  font-size: 11px;
}
</style>
