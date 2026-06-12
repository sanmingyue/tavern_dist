<template>
  <div class="messages-page">
    <!-- 顶部标签栏 -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab-item"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span v-if="tab.count > 0" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" v-model="searchQuery" placeholder="搜索聊天内容" class="search-input" />
      <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- 消息列表 -->
    <div class="messages-list" v-if="filteredConversations.length > 0">
      <!-- 置顶会话 -->
      <div v-if="pinnedConversations.length > 0 && !searchQuery" class="list-section">
        <div class="section-header">
          <span class="section-title">置顶</span>
          <button class="section-action" @click="showPinManager = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
        <div
          v-for="conv in pinnedConversations"
          :key="'pin-' + conv.name"
          class="conversation-item"
          :class="{ unread: conv.unread > 0 }"
          @click="openChat(conv)"
        >
          <div class="avatar-wrapper">
            <div class="avatar" :style="{ backgroundColor: getAvatarColor(conv.name) }">
              {{ conv.name.charAt(0) }}
            </div>
            <span v-if="conv.online" class="online-dot"></span>
          </div>
          <div class="conv-content">
            <div class="conv-header">
              <div class="conv-name-row">
                <svg v-if="conv.pinned" class="pin-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>
                </svg>
                <span class="conv-name">{{ conv.name }}</span>
              </div>
              <span class="conv-time">{{ formatTime(conv.lastUpdate) }}</span>
            </div>
            <div class="conv-preview">
              <span class="preview-text">{{ conv.lastMessage }}</span>
              <div class="conv-meta">
                <span v-if="conv.muted" class="muted-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </span>
                <span v-if="conv.unread > 0" class="unread-badge" :class="{ large: conv.unread > 99 }">
                  {{ conv.unread > 99 ? '99+' : conv.unread }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 普通会话 -->
      <div class="list-section" v-if="normalConversations.length > 0">
        <div v-if="pinnedConversations.length > 0 && !searchQuery" class="section-header">
          <span class="section-title">聊天</span>
        </div>
        <TransitionGroup name="conv-list">
          <div
            v-for="conv in (searchQuery ? filteredConversations : normalConversations)"
            :key="conv.name"
            class="conversation-item"
            :class="{ unread: conv.unread > 0 }"
            @click="openChat(conv)"
            @contextmenu.prevent="showContextMenu($event, conv)"
          >
            <div class="avatar-wrapper">
              <div class="avatar" :style="{ backgroundColor: getAvatarColor(conv.name) }">
                {{ conv.name.charAt(0) }}
              </div>
              <span v-if="conv.online" class="online-dot"></span>
            </div>
            <div class="conv-content">
              <div class="conv-header">
                <span class="conv-name">{{ conv.name }}</span>
                <span class="conv-time">{{ formatTime(conv.lastUpdate) }}</span>
              </div>
              <div class="conv-preview">
                <span class="preview-text">{{ conv.lastMessage }}</span>
                <div class="conv-meta">
                  <span v-if="conv.muted" class="muted-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                    </svg>
                  </span>
                  <span v-if="conv.unread > 0" class="unread-badge" :class="{ large: conv.unread > 99 }">
                    {{ conv.unread > 99 ? '99+' : conv.unread }}
                  </span>
                </div>
              </div>
            </div>
            <!-- 右滑操作 -->
            <div class="swipe-actions">
              <button class="action-btn pin" @click.stop="togglePin(conv)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>
                </svg>
              </button>
              <button class="action-btn delete" @click.stop="deleteConversation(conv)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        <circle cx="8" cy="10" r="1" fill="currentColor"/>
        <circle cx="12" cy="10" r="1" fill="currentColor"/>
        <circle cx="16" cy="10" r="1" fill="currentColor"/>
      </svg>
      <p>{{ searchQuery ? '未找到相关聊天' : '暂无消息' }}</p>
      <span class="hint">{{ searchQuery ? '尝试其他关键词' : '点击通讯录添加联系人开始聊天' }}</span>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div v-if="contextMenu.visible" class="context-menu-overlay" @click="contextMenu.visible = false">
        <div class="context-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }">
          <button class="menu-item" @click="togglePinFromMenu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>
            </svg>
            {{ contextMenu.conv?.pinned ? '取消置顶' : '置顶聊天' }}
          </button>
          <button class="menu-item" @click="toggleMuteFromMenu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            </svg>
            {{ contextMenu.conv?.muted ? '开启消息提醒' : '消息免打扰' }}
          </button>
          <button class="menu-item danger" @click="deleteFromMenu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            删除聊天
          </button>
        </div>
      </div>
    </Teleport>

    <!-- 置顶管理弹窗 -->
    <div v-if="showPinManager" class="modal-overlay" @click.self="showPinManager = false">
      <div class="modal">
        <div class="modal-header">
          <h3>管理置顶</h3>
          <button class="close-btn" @click="showPinManager = false">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-content">
          <p v-if="allPinnable.length === 0" class="modal-empty">暂无更多会话</p>
          <div v-else class="pin-list">
            <div v-for="conv in allPinnable" :key="conv.name" class="pin-item">
              <div class="pin-info">
                <div class="avatar small">{{ conv.name.charAt(0) }}</div>
                <span>{{ conv.name }}</span>
              </div>
              <button
                class="pin-toggle"
                :class="{ active: conv.pinned }"
                @click="togglePin(conv)"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" :fill="conv.pinned ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';

const store = usePhoneStore();

// ─── Tab 标签 ───
const tabs = [
  { id: 'all', label: '全部', count: 0 },
  { id: 'unread', label: '未读', count: 0 },
  { id: 'official', label: '公众号', count: 0 },
];

const activeTab = ref('all');

// ─── 搜索 ───
const searchQuery = ref('');

// ─── 右键菜单 ───
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  conv: null as any,
});

// ─── 置顶管理 ───
const showPinManager = ref(false);

// ─── 模拟数据（整合自 store） ───
interface ConversationData {
  name: string;
  lastMessage: string;
  lastUpdate: number;
  unread: number;
  pinned: boolean;
  muted: boolean;
  online: boolean;
  tag: 'normal' | 'official';
}

const conversations = ref<ConversationData[]>([
  { name: '张三', lastMessage: '好的，我马上到！', lastUpdate: Date.now() - 60000, unread: 2, pinned: true, muted: false, online: true, tag: 'normal' },
  { name: '小美', lastMessage: '[图片]', lastUpdate: Date.now() - 300000, unread: 5, pinned: false, muted: false, online: true, tag: 'normal' },
  { name: '工作群', lastMessage: '@所有人 明早9点开会', lastUpdate: Date.now() - 3600000, unread: 12, pinned: true, muted: true, online: false, tag: 'normal' },
  { name: '外卖', lastMessage: '您的订单已送达，感谢使用', lastUpdate: Date.now() - 7200000, unread: 0, pinned: false, muted: false, online: false, tag: 'official' },
  { name: '快递', lastMessage: '您的包裹已到驿站', lastUpdate: Date.now() - 86400000, unread: 0, pinned: false, muted: false, online: false, tag: 'official' },
  { name: '李四', lastMessage: '晚上见~', lastUpdate: Date.now() - 172800000, unread: 0, pinned: false, muted: false, online: false, tag: 'normal' },
]);

const filteredConversations = computed(() => {
  let list = conversations.value;

  // Tab 过滤
  if (activeTab.value === 'unread') {
    list = list.filter(c => c.unread > 0);
  } else if (activeTab.value === 'official') {
    list = list.filter(c => c.tag === 'official');
  }

  // 搜索过滤
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase();
    list = list.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  }

  return list.sort((a, b) => b.lastUpdate - a.lastUpdate);
});

const pinnedConversations = computed(() =>
  filteredConversations.value.filter(c => c.pinned)
);

const normalConversations = computed(() =>
  filteredConversations.value.filter(c => !c.pinned)
);

const allPinnable = computed(() => conversations.value);

function getAvatarColor(name: string): string {
  const colors = ['#579bf0', '#50c9c3', '#f5a623', '#7ed321', '#e74c3c', '#9b59b6', '#1db954', '#e91e63'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const date = new Date(timestamp);

  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000 && date.toDateString() === new Date(now).toDateString()) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }
  if (diff < 604800000) {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[date.getDay()];
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function openChat(conv: ConversationData) {
  store.selectContact(conv.name);
  store.openApp('chat');
}

function togglePin(conv: ConversationData) {
  conv.pinned = !conv.pinned;
  if (conv.pinned) {
    toastr.success(`已将「${conv.name}」置顶`);
  } else {
    toastr.info(`已取消置顶「${conv.name}」`);
  }
}

function toggleMute(conv: ConversationData) {
  conv.muted = !conv.muted;
  toastr.info(conv.muted ? `已开启「${conv.name}」的消息免打扰` : `已关闭「${conv.name}」的消息免打扰`);
}

function deleteConversation(conv: ConversationData) {
  const index = conversations.value.findIndex(c => c.name === conv.name);
  if (index > -1) {
    conversations.value.splice(index, 1);
    toastr.success(`已删除与「${conv.name}」的聊天`);
  }
}

function showContextMenu(event: MouseEvent, conv: ConversationData) {
  contextMenu.visible = true;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.conv = conv;
}

function togglePinFromMenu() {
  if (contextMenu.conv) togglePin(contextMenu.conv);
  contextMenu.visible = false;
}

function toggleMuteFromMenu() {
  if (contextMenu.conv) toggleMute(contextMenu.conv);
  contextMenu.visible = false;
}

function deleteFromMenu() {
  if (contextMenu.conv) deleteConversation(contextMenu.conv);
  contextMenu.visible = false;
}
</script>

<style scoped>
.messages-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #111318);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: 4px;
  padding: 10px 12px;
  background: var(--bg-primary, #0b0e14);
  border-bottom: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.06));
}

.tab-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: none;
  border-radius: 16px;
  background: transparent;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-item.active {
  background: var(--accent, #579bf0);
  color: white;
  font-weight: 500;
}

.tab-count {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.2);
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-item.active .tab-count {
  background: rgba(255, 255, 255, 0.3);
}

/* Search Bar */
.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 12px;
  padding: 9px 14px;
  background: var(--bg-primary, #0b0e14);
  border-radius: 20px;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.4));
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  font-size: 14px;
  outline: none;
}

.clear-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.1));
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Messages List */
.messages-list {
  flex: 1;
  overflow-y: auto;
}

.list-section {
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px 4px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.4));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-action {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Conversation Item */
.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-primary, #0b0e14);
  cursor: pointer;
  position: relative;
  transition: background 0.15s;
}

.conversation-item:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.04));
}

.conversation-item.unread {
  background: rgba(87, 155, 240, 0.05);
}

.conversation-item:not(:last-child) {
  border-bottom: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.04));
}

.avatar-wrapper {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
}

.avatar.small {
  width: 36px;
  height: 36px;
  font-size: 14px;
}

.online-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 11px;
  height: 11px;
  background: #27ae60;
  border: 2px solid var(--bg-primary, #0b0e14);
  border-radius: 50%;
}

.conv-content {
  flex: 1;
  min-width: 0;
}

.conv-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.conv-name-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.pin-icon {
  color: var(--accent);
  flex-shrink: 0;
}

.conv-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  font-size: 12px;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.4));
  flex-shrink: 0;
}

.conv-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-text {
  font-size: 13px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.6));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.conv-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.muted-icon {
  color: var(--text-tertiary);
  display: flex;
}

.unread-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: var(--danger, #e74c3c);
  color: white;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.unread-badge.large {
  min-width: 24px;
}

/* Swipe Actions */
.swipe-actions {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}

.conversation-item:hover .swipe-actions {
  opacity: 1;
}

.action-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s;
}

.action-btn:hover {
  transform: scale(1.1);
}

.action-btn.pin {
  background: var(--accent);
  color: white;
}

.action-btn.delete {
  background: var(--danger);
  color: white;
}

/* Context Menu */
.context-menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
}

.context-menu {
  position: fixed;
  min-width: 180px;
  background: var(--bg-primary, #0b0e14);
  border: 1px solid var(--border-primary);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 10000;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s;
}

.menu-item:hover {
  background: var(--bg-hover);
}

.menu-item.danger {
  color: var(--danger, #e74c3c);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 100;
}

.modal {
  width: 100%;
  max-height: 70vh;
  background: var(--bg-primary, #0b0e14);
  border-radius: 16px 16px 0 0;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-secondary);
}

.modal-header h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.close-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  padding: 12px;
  max-height: 60vh;
  overflow-y: auto;
}

.modal-empty {
  text-align: center;
  color: var(--text-tertiary);
  padding: 24px;
  font-size: 14px;
}

.pin-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pin-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: 10px;
}

.pin-info {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--text-primary);
  font-size: 14px;
}

.pin-toggle {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.pin-toggle.active {
  background: var(--accent);
  color: white;
}

/* Empty State */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted, rgba(255, 255, 255, 0.25));
  gap: 10px;
  padding: 40px;
}

.empty-state p {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
}

.hint {
  font-size: 13px;
  color: var(--text-tertiary);
  text-align: center;
}

/* List Animation */
.conv-list-enter-active,
.conv-list-leave-active {
  transition: all 0.3s ease;
}

.conv-list-enter-from,
.conv-list-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
