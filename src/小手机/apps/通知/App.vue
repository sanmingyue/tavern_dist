<template>
  <div class="notif-page">
    <!-- iOS 导航栏 -->
    <div class="notif-nav">
      <button class="nav-btn" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007aff)" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <h1 class="nav-title">通知</h1>
      <button v-if="hasUnread" class="nav-btn clear-btn" @click="markAllAsRead">全部已读</button>
      <div v-else style="width:60px"></div>
    </div>

    <!-- 过滤 Tab -->
    <div class="notif-tabs">
      <button v-for="tab in tabs" :key="tab.id" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        {{ tab.label }}
        <span v-if="tab.count > 0" class="tab-badge">{{ tab.count }}</span>
      </button>
    </div>

    <!-- 通知列表 -->
    <div class="notif-scroll">
      <template v-if="filteredNotifications.length > 0">
        <!-- 按时间分组 -->
        <div v-for="group in groupedNotifications" :key="group.label" class="notif-group">
          <div class="group-label">{{ group.label }}</div>
          <div class="group-cards">
            <div
              v-for="notif in group.items"
              :key="notif.id"
              class="notif-card"
              :class="{ unread: !notif.read }"
              @click="markAsRead(notif)"
            >
              <div class="notif-app-icon" :style="{ backgroundColor: notif.color }">
                <svg v-if="notif.type === 'message'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <svg v-else-if="notif.type === 'system'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <svg v-else-if="notif.type === 'social'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                </svg>
              </div>
              <div class="notif-content">
                <div class="notif-top-row">
                  <span class="notif-app-name">{{ notif.title }}</span>
                  <span class="notif-time">{{ notif.time }}</span>
                </div>
                <p class="notif-body">{{ notif.body }}</p>
              </div>
              <span v-if="!notif.read" class="unread-indicator"></span>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <p>暂无通知</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
const store = usePhoneStore();

interface Notification {
  id: string;
  type: 'message' | 'system' | 'social' | 'default';
  title: string;
  body: string;
  time: string;
  timeGroup: string;
  read: boolean;
  color: string;
}

const tabs = reactive([
  { id: 'all', label: '全部', count: 3 },
  { id: 'unread', label: '未读', count: 2 },
  { id: 'message', label: '消息', count: 1 },
  { id: 'social', label: '互动', count: 0 },
]);

const activeTab = ref('all');

const notifications = ref<Notification[]>([
  { id: '1', type: 'message', title: '消息', body: '您有新的聊天消息，点击查看', time: '刚刚', timeGroup: '今天', read: false, color: '#007aff' },
  { id: '2', type: 'system', title: '系统更新', body: '小手机已更新到最新版本 XiaoOS 18.0', time: '5分钟前', timeGroup: '今天', read: false, color: '#34c759' },
  { id: '3', type: 'social', title: '好友请求', body: '张三向您发送了好友请求', time: '1小时前', timeGroup: '今天', read: true, color: '#af52de' },
  { id: '4', type: 'default', title: '提醒', body: '您的闹钟将在明天 7:00 响起', time: '昨天', timeGroup: '昨天', read: true, color: '#ff9500' },
]);

const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') return notifications.value;
  if (activeTab.value === 'unread') return notifications.value.filter(n => !n.read);
  if (activeTab.value === 'message') return notifications.value.filter(n => n.type === 'message');
  if (activeTab.value === 'social') return notifications.value.filter(n => n.type === 'social');
  return notifications.value;
});

const groupedNotifications = computed(() => {
  const groups: Record<string, Notification[]> = {};
  for (const n of filteredNotifications.value) {
    if (!groups[n.timeGroup]) groups[n.timeGroup] = [];
    groups[n.timeGroup].push(n);
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
});

const hasUnread = computed(() => notifications.value.some(n => !n.read));

function markAsRead(notif: Notification) {
  notif.read = true;
  updateTabCounts();
}

function markAllAsRead() {
  notifications.value.forEach(n => n.read = true);
  updateTabCounts();
}

function updateTabCounts() {
  tabs[0].count = notifications.value.length;
  tabs[1].count = notifications.value.filter(n => !n.read).length;
  tabs[2].count = notifications.value.filter(n => n.type === 'message' && !n.read).length;
  tabs[3].count = notifications.value.filter(n => n.type === 'social' && !n.read).length;
}
</script>

<style scoped>
.notif-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary);
}

/* ─── 导航栏 ─── */
.notif-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; background: var(--bg-primary);
  border-bottom: 0.5px solid var(--border-secondary);
  flex-shrink: 0;
}

.nav-btn {
  border: none; background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center; padding: 4px;
}

.clear-btn {
  color: var(--accent, #007aff); font-size: 14px;
}

.nav-title {
  font-size: 17px; font-weight: 600; color: var(--text-primary); margin: 0;
}

/* ─── Tab ─── */
.notif-tabs {
  display: flex; gap: 6px; padding: 8px 16px;
  overflow-x: auto; scrollbar-width: none; flex-shrink: 0;
}
.notif-tabs::-webkit-scrollbar { display: none; }

.notif-tabs button {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px; border: none; border-radius: 16px;
  background: var(--bg-card, var(--bg-primary));
  color: var(--text-secondary); font-size: 13px;
  cursor: pointer; flex-shrink: 0; font-weight: 500;
}

.notif-tabs button.active {
  background: var(--accent, #007aff); color: white;
}

.tab-badge {
  min-width: 16px; height: 16px; padding: 0 4px;
  border-radius: 8px; font-size: 10px; font-weight: 600;
  background: rgba(255,255,255,0.25);
  display: flex; align-items: center; justify-content: center;
}

.notif-tabs button:not(.active) .tab-badge {
  background: var(--bg-tertiary); color: var(--text-tertiary);
}

/* ─── 滚动区 ─── */
.notif-scroll { flex: 1; overflow-y: auto; padding: 0 16px 16px; }

/* ─── 分组 ─── */
.notif-group { margin-bottom: 16px; }

.group-label {
  font-size: 13px; font-weight: 600; color: var(--text-secondary);
  padding: 12px 0 6px;
}

.group-cards { display: flex; flex-direction: column; gap: 6px; }

/* ─── 通知卡片（iOS 样式） ─── */
.notif-card {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px; border-radius: 14px;
  background: var(--bg-card, var(--bg-primary));
  position: relative; cursor: pointer;
  transition: all 0.15s;
}

.notif-card:active { transform: scale(0.98); }

.notif-card.unread {
  background: rgba(0, 122, 255, 0.04);
}

.notif-app-icon {
  width: 32px; height: 32px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.notif-content { flex: 1; min-width: 0; }

.notif-top-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 3px;
}

.notif-app-name {
  font-size: 13px; font-weight: 600; color: var(--text-primary);
}

.notif-time {
  font-size: 11px; color: var(--text-tertiary);
}

.notif-body {
  margin: 0; font-size: 13px; color: var(--text-secondary);
  line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}

.unread-indicator {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent, #007aff);
  flex-shrink: 0; margin-top: 4px;
}

/* ─── 空状态 ─── */
.empty-state {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  color: var(--text-muted); gap: 12px; padding: 40px;
}
.empty-state p { margin: 0; font-size: 15px; color: var(--text-secondary); }
</style>
