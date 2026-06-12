<template>
  <div class="sms-page">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input type="text" v-model="searchQuery" placeholder="搜索短信" class="search-input" />
    </div>

    <!-- 会话列表 -->
    <div class="conversation-list">
      <div v-if="filteredConversations.length > 0">
        <div
          v-for="(conv, index) in filteredConversations"
          :key="index"
          class="conversation-item"
          @click="openConversation(conv)"
        >
          <div class="conv-avatar">{{ conv.name.charAt(0) }}</div>
          <div class="conv-content">
            <div class="conv-header">
              <span class="conv-name">{{ conv.name }}</span>
              <span class="conv-time">{{ conv.time }}</span>
            </div>
            <div class="conv-preview">
              <span class="preview-text">{{ conv.preview }}</span>
              <span v-if="conv.unread > 0" class="unread-badge">{{ conv.unread }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <p>暂无短信</p>
      </div>
    </div>

    <!-- 新建短信按钮 -->
    <button class="new-sms-btn" @click="composeNew">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>

    <div v-if="selectedConversation" class="sms-sheet-mask" @click.self="closeConversation">
      <section class="sms-sheet">
        <div class="sheet-handle"></div>
        <header class="sms-sheet-header">
          <div class="conv-avatar large">{{ selectedConversation.name.charAt(0) }}</div>
          <div>
            <h2>{{ selectedConversation.name }}</h2>
            <p>{{ selectedConversation.number }}</p>
          </div>
        </header>
        <div class="sms-actions">
          <button @click="toConversationAction('回复')">回复</button>
          <button @click="toConversationAction('电话')">电话</button>
          <button @click="toConversationAction('归档')">归档</button>
          <button @click="toConversationAction('屏蔽')">屏蔽</button>
        </div>
        <div class="sms-thread">
          <div class="sms-bubble received">{{ selectedConversation.preview }}</div>
          <div class="sms-bubble sent">短信回复结构预留，后续接入具体内容生成。</div>
        </div>
        <div class="sms-compose">
          <input v-model="draft" placeholder="输入短信" @keyup.enter="sendDraft" />
          <button @click="sendDraft">发送</button>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const searchQuery = ref('');
interface SmsConversation {
  name: string;
  number: string;
  preview: string;
  time: string;
  unread: number;
}

const selectedConversation = ref<SmsConversation | null>(null);
const draft = ref('');

const conversations = ref<SmsConversation[]>([
  { name: '快递', number: '1065****8901', preview: '您的包裹已到达驿站，请及时取件', time: '今天 14:30', unread: 1 },
  { name: '银行', number: '9558****1234', preview: '您的账户余额变动通知', time: '昨天', unread: 0 },
  { name: '外卖', number: '1010****9999', preview: '您的订单已送达，感谢使用', time: '周一', unread: 0 },
  { name: '运营商', number: '10086', preview: '您的套餐已更新，更多流量等你来', time: '上周', unread: 2 },
]);

const filteredConversations = computed(() => {
  if (!searchQuery.value) return conversations.value;
  const query = searchQuery.value.toLowerCase();
  return conversations.value.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.preview.toLowerCase().includes(query)
  );
});

function openConversation(conv: SmsConversation) {
  selectedConversation.value = conv;
  conv.unread = 0;
}

function composeNew() {
  toastr.info('新建短信');
}

function closeConversation() {
  selectedConversation.value = null;
  draft.value = '';
}

function toConversationAction(action: string) {
  toastr.info(`短信${action}结构已预留`);
}

function sendDraft() {
  if (!draft.value.trim() || !selectedConversation.value) return;
  toastr.success(`已预留发送给 ${selectedConversation.value.name} 的短信`);
  draft.value = '';
}
</script>

<style scoped>
.sms-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #111318);
  position: relative;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 16px;
  padding: 10px 14px;
  background: var(--bg-primary, #0b0e14);
  border-radius: 20px;
  color: var(--text-tertiary);
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-primary, #0b0e14);
  border-bottom: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.06));
  cursor: pointer;
  transition: background 0.15s;
}

.conversation-item:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.04));
}

.conv-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  flex-shrink: 0;
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

.conv-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
}

.conv-time {
  font-size: 12px;
  color: var(--text-tertiary);
}

.conv-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-text {
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.unread-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  background: var(--accent, #579bf0);
  color: white;
  font-size: 11px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  gap: 12px;
}

.new-sms-btn {
  position: absolute;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: var(--accent, #579bf0);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(87, 155, 240, 0.4);
  transition: all 0.2s;
}

.new-sms-btn:hover {
  transform: scale(1.05);
}

.new-sms-btn:active {
  transform: scale(0.95);
}

.sms-sheet-mask {
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.5);
}

.sms-sheet {
  width: 100%;
  max-height: 78%;
  display: flex;
  flex-direction: column;
  border-radius: 18px 18px 0 0;
  background: var(--bg-primary);
  padding: 10px 14px 14px;
}

.sheet-handle {
  width: 38px;
  height: 4px;
  margin: 0 auto 14px;
  border-radius: 999px;
  background: var(--border-primary);
}

.sms-sheet-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.conv-avatar.large {
  width: 54px;
  height: 54px;
  font-size: 20px;
}

.sms-sheet-header h2 {
  margin: 0;
  color: var(--text-primary);
  font-size: 18px;
}

.sms-sheet-header p {
  margin: 4px 0 0;
  color: var(--text-tertiary);
  font-size: 12px;
}

.sms-actions {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.sms-actions button,
.sms-compose button {
  border: 0;
  border-radius: 12px;
  background: var(--accent);
  color: white;
  cursor: pointer;
}

.sms-actions button {
  padding: 9px 4px;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.sms-thread {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.sms-bubble {
  max-width: 78%;
  border-radius: 16px;
  padding: 10px 12px;
  font-size: 14px;
  line-height: 1.4;
}

.sms-bubble.received {
  align-self: flex-start;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.sms-bubble.sent {
  align-self: flex-end;
  background: var(--accent);
  color: white;
}

.sms-compose {
  display: flex;
  gap: 8px;
}

.sms-compose input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  background: var(--bg-input);
  color: var(--text-primary);
  padding: 10px 12px;
  outline: 0;
}

.sms-compose button {
  padding: 0 14px;
}
</style>
