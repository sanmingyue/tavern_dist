<template>
  <div class="chat-page">
    <!-- 顶部导航 -->
    <div class="chat-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <span class="chat-title">{{ contactName }}</span>
    </div>

    <!-- 消息列表 -->
    <div class="messages-area" ref="messagesArea">
      <div v-for="msg in messages" :key="msg.id" class="message-item" :class="{ 'is-self': msg.from === owner }">
        <div class="message-bubble">
          <p class="message-content">{{ msg.content }}</p>
          <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
        </div>
      </div>
    </div>

    <!-- 输入区 -->
    <div class="input-area">
      <input
        type="text"
        v-model="inputText"
        placeholder="输入消息..."
        class="message-input"
        @keyup.enter="sendMessage"
      />
      <button class="send-btn" @click="sendMessage" :disabled="!inputText.trim()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13" />
          <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useApiStore } from '../../stores/api-store';
import { usePhoneStore } from '../../stores/phone-store';

const store = usePhoneStore();
const apiStore = useApiStore();

const contactName = computed(() => store.activeContact ?? '');
const owner = computed(() => store.phoneData.device.owner);

const messages = computed(() => {
  if (!contactName.value) return [];
  const conv = store.phoneData.conversations[contactName.value];
  return conv?.messages ?? [];
});

const inputText = ref('');
const messagesArea = ref<HTMLElement | null>(null);

function goBack() {
  store.goBack();
}

function sendMessage() {
  if (!inputText.value.trim() || !contactName.value) return;
  store.sendMessage(contactName.value, inputText.value.trim());
  inputText.value = '';
  scrollToBottom();
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesArea.value) {
      messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
    }
  });
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

onMounted(() => scrollToBottom());
watch(messages, () => nextTick(() => scrollToBottom()));
</script>

<style scoped>
.chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-primary);
}

.back-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chat-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-item {
  display: flex;
  max-width: 80%;
}

.message-item.is-self {
  align-self: flex-end;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  background: var(--bg-primary);
  position: relative;
}

.message-item.is-self .message-bubble {
  background: var(--accent);
  color: white;
}

.message-content {
  margin: 0;
  font-size: 15px;
  line-height: 1.4;
  word-break: break-word;
}

.message-time {
  display: block;
  font-size: 10px;
  color: var(--text-tertiary);
  margin-top: 4px;
  text-align: right;
}

.message-item.is-self .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.input-area {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-primary);
  border-top: 1px solid var(--border-secondary);
}

.message-input {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid var(--border-primary);
  border-radius: 20px;
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
