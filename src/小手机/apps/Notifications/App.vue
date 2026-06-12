<template>
  <div class="notifications-page">
    <!-- 顶部标签 -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- 通知列表 -->
    <div class="notification-list">
      <div v-if="filteredNotifications.length > 0">
        <div
          v-for="(notif, index) in filteredNotifications"
          :key="index"
          class="notification-item"
          :class="{ unread: !notif.read }"
          @click="markAsRead(notif)"
        >
          <div class="notif-icon" :style="{ backgroundColor: notif.color }">
            <svg v-if="notif.type === 'message'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <svg v-else-if="notif.type === 'system'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <svg v-else-if="notif.type === 'social'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div class="notif-content">
            <div class="notif-header">
              <span class="notif-title">{{ notif.title }}</span>
              <span class="notif-time">{{ notif.time }}</span>
            </div>
            <p class="notif-body">{{ notif.body }}</p>
          </div>
          <span v-if="!notif.read" class="unread-dot"></span>
        </div>
      </div>

      <div v-else class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <p>暂无通知</p>
      </div>
    </div>

    <!-- 全部已读按钮 -->
    <button v-if="hasUnread" class="mark-all-btn" @click="markAllAsRead">
      全部已读
    </button>
  </div>
</template>

<script setup lang="ts">
interface Notification {
  id: string;
  type: 'message' | 'system' | 'social' | 'default';
  title: string;
  body: string;
  time: string;
  read: boolean;
  color: string;
}

const tabs = [
  { id: 'all', label: '全部', count: 3 },
  { id: 'unread', label: '未读', count: 2 },
  { id: 'message', label: '消息', count: 1 },
  { id: 'social', label: '互动', count: 0 },
];

const activeTab = ref('all');

const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'message',
    title: '消息通知',
    body: '您有新的聊天消息，点击查看',
    time: '刚刚',
    read: false,
    color: '#579bf0',
  },
  {
    id: '2',
    type: 'system',
    title: '系统更新',
    body: '小手机已更新到最新版本',
    time: '5分钟前',
    read: false,
    color: '#27ae60',
  },
  {
    id: '3',
    type: 'social',
    title: '好友请求',
    body: '张三向您发送了好友请求',
    time: '1小时前',
    read: true,
    color: '#9b59b6',
  },
]);

const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') return notifications.value;
  if (activeTab.value === 'unread') return notifications.value.filter(n => !n.read);
  if (activeTab.value === 'message') return notifications.value.filter(n => n.type === 'message');
  if (activeTab.value === 'social') return notifications.value.filter(n => n.type === 'social');
  return notifications.value;
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
.notifications-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #111318);
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--bg-primary, #0b0e14);
  overflow-x: auto;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 16px;
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.06));
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tab.active {
  background: var(--accent, #579bf0);
  color: white;
}

.tab-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-list {
  flex: 1;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-primary, #0b0e14);
  border-bottom: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.06));
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.notification-item:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.04));
}

.notification-item.unread {
  background: rgba(87, 155, 240, 0.05);
}

.notif-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.notif-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.notif-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.notif-body {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-dot {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 8px;
  height: 8px;
  background: var(--accent, #579bf0);
  border-radius: 50%;
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 12px;
}

.mark-all-btn {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 24px;
  border: none;
  border-radius: 20px;
  background: var(--bg-primary);
  color: var(--accent);
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
</style>
