<template>
  <div class="welcome-page">
    <!-- 赛车旗帜 SVG -->
    <div class="hero-icon">
      <svg viewBox="0 0 120 120" width="120" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="30" y="15" width="60" height="45" rx="3" fill="#1a1a2e" />
        <rect x="30" y="15" width="15" height="15" fill="#fff" />
        <rect x="60" y="15" width="15" height="15" fill="#fff" />
        <rect x="45" y="30" width="15" height="15" fill="#fff" />
        <rect x="75" y="30" width="15" height="15" fill="#fff" />
        <rect x="30" y="45" width="15" height="15" fill="#fff" />
        <rect x="60" y="45" width="15" height="15" fill="#fff" />
        <rect x="26" y="12" width="4" height="96" rx="2" fill="#6366f1" />
        <circle cx="28" cy="12" r="4" fill="#8b5cf6" />
        <line x1="50" y1="80" x2="95" y2="80" stroke="#c7d2fe" stroke-width="2" stroke-linecap="round" />
        <line x1="55" y1="88" x2="100" y2="88" stroke="#ddd6fe" stroke-width="2" stroke-linecap="round" />
        <line x1="45" y1="96" x2="90" y2="96" stroke="#e8ecf1" stroke-width="2" stroke-linecap="round" />
      </svg>
    </div>

    <h1 class="title">我的机娘是世界级的</h1>
    <p class="subtitle">机魂共鸣 · 赛道传说</p>

    <div class="intro-card">
      <p>在这个世界，机械拥有了灵魂。</p>
      <p>她们是赛车的拟人化 —— <strong>机娘</strong>。</p>
      <p>车手、赛车、机娘，三位一体的赛事时代已经开启。</p>
      <p class="highlight">选择你的开始方式。</p>
    </div>

    <div class="mode-select">
      <button class="mode-btn" @click="store.selectMode('custom')">
        <div class="mode-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#6366f1" stroke-width="1.8">
            <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <span class="mode-title">自定义机娘</span>
        <span class="mode-desc">从零开始，亲手设计你的搭档</span>
      </button>

      <button class="mode-btn" @click="store.selectMode('preset')">
        <div class="mode-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#8b5cf6" stroke-width="1.8">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke-linecap="round" stroke-linejoin="round" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </div>
        <span class="mode-title">选择已有机娘</span>
        <span class="mode-desc">从六位机娘中选择你的搭档</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCreationStore } from '../store';
const store = useCreationStore();
</script>

<style scoped>
.welcome-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
}

.hero-icon {
  margin-bottom: 16px;
  opacity: 0.9;
}

.title {
  font-size: 26px;
  font-weight: 700;
  color: #1e1b4b;
  margin: 0 0 4px;
  letter-spacing: 1px;
}

.subtitle {
  font-size: 14px;
  color: #8b5cf6;
  margin: 0 0 24px;
  letter-spacing: 3px;
  font-weight: 500;
}

.intro-card {
  background: #f8f7ff;
  border: 1px solid #e8e5f8;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 28px;
  max-width: 400px;
  width: 100%;
}

.intro-card p {
  font-size: 14px;
  color: #4a4563;
  margin: 0 0 8px;
  line-height: 1.7;
}

.intro-card p:last-child {
  margin-bottom: 0;
}

.intro-card .highlight {
  color: #6366f1;
  font-weight: 600;
  margin-top: 12px;
}

/* 模式选择 */
.mode-select {
  display: flex;
  gap: 14px;
  width: 100%;
  max-width: 440px;
}

.mode-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 22px 16px;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.mode-btn:hover {
  border-color: #a5b4fc;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.15);
  transform: translateY(-3px);
}

.mode-btn:active {
  transform: translateY(0);
}

.mode-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: #eef2ff;
  border-radius: 14px;
}

.mode-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e1b4b;
}

.mode-desc {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
}

/* 手机端适配 */
@media (max-width: 480px) {
  .hero-icon svg {
    width: 90px;
    height: 90px;
  }

  .title {
    font-size: 21px;
  }

  .intro-card {
    padding: 16px 18px;
  }

  .intro-card p {
    font-size: 13px;
  }

  .mode-select {
    flex-direction: column;
    gap: 10px;
  }

  .mode-btn {
    flex-direction: row;
    padding: 14px 16px;
    gap: 12px;
    text-align: left;
    align-items: center;
  }

  .mode-icon {
    width: 44px;
    height: 44px;
    flex-shrink: 0;
  }

  .mode-title {
    font-size: 14px;
  }

  .mode-desc {
    font-size: 11px;
  }
}
</style>
