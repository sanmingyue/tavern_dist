<template>
  <div class="chat-page">
    <!-- 顶部导航 -->
    <div class="chat-header">
      <button class="back-btn" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <div class="chat-info">
        <div class="chat-name">{{ contactName }}</div>
        <div class="chat-status">
          <span class="online-indicator" :class="{ online: isOnline }"></span>
          {{ isOnline ? '在线' : '离线' }}
        </div>
      </div>
      <button class="action-btn" @click="showMoreMenu = !showMoreMenu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>
    </div>

    <!-- 更多菜单 -->
    <Transition name="dropdown">
      <div v-if="showMoreMenu" class="more-menu" @click="showMoreMenu = false">
        <button class="menu-item" @click="clearChat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          清除记录
        </button>
      </div>
    </Transition>

    <!-- 消息列表 -->
    <div class="messages-container" ref="messagesContainer" @scroll="onScroll">
      <div class="messages-list">
        <div
          v-for="(msg, index) in messages"
          :key="msg.id"
          class="message-wrapper"
          :class="{ mine: msg.from === 'me', theirs: msg.from !== 'me' }"
        >
          <!-- 时间戳 -->
          <span v-if="showTimestamp(index)" class="timestamp">
            {{ formatTime(msg.timestamp) }}
          </span>

          <div class="message-row" :class="{ mine: msg.from === 'me' }">
            <!-- 对方头像 -->
            <AvatarBadge v-if="msg.from !== 'me'" :name="contactName" size="sm" />

            <!-- 消息气泡 -->
            <div class="message-bubble" :class="{ streaming: msg.streaming }">
              <!-- 语音消息 -->
              <div v-if="msg.type === 'voice'" class="voice-message">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                </svg>
                <div class="voice-wave">
                  <span v-for="i in 4" :key="i" class="wave-bar"></span>
                </div>
                <span class="voice-duration">{{ msg.duration || 3 }}''</span>
              </div>

              <!-- 图片占位 -->
              <div v-else-if="msg.type === 'image'" class="image-message">
                <div class="image-placeholder">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
              </div>

              <!-- 表情消息 -->
              <div v-else-if="isEmojiOnly(msg.content)" class="emoji-message">
                {{ msg.content }}
              </div>

              <!-- 文本消息 -->
              <div v-else class="text-message" v-html="formatContent(msg.content)"></div>

              <!-- 发送状态 -->
              <div v-if="msg.from === 'me'" class="message-status">
                <svg v-if="msg.sending" class="spinning" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                <svg v-else-if="msg.failed" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 正在输入提示 -->
      <Transition name="fade">
        <div v-if="isTyping" class="typing-row">
          <AvatarBadge :name="contactName" size="sm" />
          <TypingIndicator :name="contactName" variant="bubble" :show-text="false" />
        </div>
      </Transition>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <button class="func-btn" @click="showFuncPanel = !showFuncPanel">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <div class="input-wrapper">
        <textarea
          ref="inputArea"
          v-model="inputText"
          class="message-input"
          placeholder="输入消息..."
          rows="1"
          @keydown.enter.exact.prevent="sendMessage"
          @input="autoResize"
        ></textarea>
      </div>
      <button
        class="send-btn"
        :class="{ active: inputText.trim(), generating: isGenerating }"
        @click="isGenerating ? stopGeneration() : sendMessage()"
        :disabled="!inputText.trim() && !isGenerating"
      >
        <svg v-if="isGenerating" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="2"/>
        </svg>
        <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>

    <!-- 功能面板 -->
    <Transition name="slide-up">
      <div v-if="showFuncPanel" class="func-panel">
        <button class="func-item" @click="sendSpecial('image')">
          <div class="func-icon" style="background: #4facfe;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
          <span>图片</span>
        </button>
        <button class="func-item" @click="sendSpecial('voice')">
          <div class="func-icon" style="background: #f5a623;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            </svg>
          </div>
          <span>语音</span>
        </button>
        <button class="func-item" @click="sendSpecial('[表情:😊]')">
          <div class="func-icon" style="background: #e91e63;">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </div>
          <span>表情</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../stores/phone-store';
import { cleanMessagesReplyText } from '../utils/app-names';
import { generateForApp } from '../utils/generation-pipeline';
import AvatarBadge from './AvatarBadge.vue';
import TypingIndicator from './TypingIndicator.vue';

const store = usePhoneStore();

// ─── 联系人 ───
const contactName = computed(() => store.activeContact || '未知联系人');
const isOnline = ref(true);

// ─── 输入状态 ───
const inputText = ref('');
const inputArea = ref<HTMLTextAreaElement | null>(null);
const messagesContainer = ref<HTMLElement | null>(null);

// ─── UI 状态 ───
const showMoreMenu = ref(false);
const showFuncPanel = ref(false);
const isTyping = ref(false);
const isGenerating = ref(false);

// ─── 消息数据 ───
interface ChatMessage {
  id: string;
  from: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'voice';
  duration?: number;
  sending?: boolean;
  failed?: boolean;
  streaming?: boolean;
}

const messages = ref<ChatMessage[]>([]);
let generationSerial = 0;

// 从 store 的对话数据初始化
onMounted(() => {
  const convName = contactName.value;
  const conv = store.phoneData.conversations[convName];
  if (conv && conv.messages.length > 0) {
    messages.value = conv.messages.map(m => ({
      id: m.id,
      from: m.from === store.phoneData.device.owner ? 'me' : 'other',
      content: m.content,
      timestamp: m.timestamp,
      type: m.type as 'text' | 'image' | 'voice',
    }));
  } else {
    // 默认欢迎消息
    messages.value = [
      { id: 'welcome', from: 'other', content: '你好呀~ 👋', timestamp: Date.now() - 60000, type: 'text' },
    ];
  }
  nextTick(() => scrollToBottom());
});

// ─── 方法 ───
function goBack() {
  showMoreMenu.value = false;
  showFuncPanel.value = false;
  store.goBack();
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function showTimestamp(index: number): boolean {
  if (index === 0) return true;
  return messages.value[index].timestamp - messages.value[index - 1].timestamp > 300000;
}

const EMOJI_REGEX = /^\p{Emoji_Presentation}{1,5}$/u;
function isEmojiOnly(content: string): boolean {
  return EMOJI_REGEX.test(content.trim());
}

function formatContent(content: string): string {
  // [表情:xxx] → emoji
  let result = content
    .replace(/\[表情:([^\]]+)\]/g, '<span class="emoji">$1</span>')
    .replace(/\[图片\]/g, '<span class="inline-tag">📷 图片</span>')
    .replace(/\[语音\]/g, '<span class="inline-tag">🎤 语音</span>')
    .replace(/\[未读\]/g, '')
    .replace(/\n/g, '<br>')
    .replace(/(https?:\/\/[^\s]+)/g, '<a class="msg-link" href="$1">$1</a>');
  return result;
}

async function sendMessage() {
  const text = inputText.value.trim();
  if (!text || isGenerating.value) return;

  showFuncPanel.value = false;

  // 添加用户消息
  const userMsg: ChatMessage = {
    id: `msg_${Date.now()}`,
    from: 'me',
    content: text,
    timestamp: Date.now(),
    type: 'text',
    sending: true,
  };
  messages.value.push(userMsg);
  inputText.value = '';
  autoResize();
  nextTick(() => scrollToBottom());

  // 模拟发送成功
  setTimeout(() => { userMsg.sending = false; }, 300);

  // 通知 store
  store.sendMessage(contactName.value, text, store.phoneData.device.owner, true);

  // 请求 AI 回复
  await requestAIReply(text);
}

function sendSpecial(type: string) {
  showFuncPanel.value = false;
  if (type === 'image') {
    messages.value.push({
      id: `msg_${Date.now()}`,
      from: 'me',
      content: '[图片]',
      timestamp: Date.now(),
      type: 'image',
    });
    store.reportAction({
      appId: 'messages', appName: '消息', action: '发送图片',
      summary: `用户在消息 APP 向 ${contactName.value} 发送了图片`,
      data: { to: contactName.value },
    });
  } else if (type === 'voice') {
    messages.value.push({
      id: `msg_${Date.now()}`,
      from: 'me',
      content: '[语音]',
      timestamp: Date.now(),
      type: 'voice',
      duration: _.random(2, 10),
    });
  } else {
    // 表情等
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      from: 'me',
      content: type,
      timestamp: Date.now(),
      type: 'text',
    };
    messages.value.push(userMsg);
    store.sendMessage(contactName.value, type, store.phoneData.device.owner, false);
    requestAIReply(type);
  }
  nextTick(() => scrollToBottom());
}

async function requestAIReply(userText: string) {
  const currentGeneration = ++generationSerial;
  isGenerating.value = true;

  // 显示输入中
  isTyping.value = true;
  await new Promise(r => setTimeout(r, 800));
  if (currentGeneration !== generationSerial) return;
  isTyping.value = false;

  // 构建聊天历史上下文
  const recentHistory = messages.value
    .filter(m => m.type === 'text' && m.content)
    .slice(-10)
    .map(m => `${m.from === 'me' ? '用户' : contactName.value}: ${m.content}`)
    .join('\n');

  const extraContext = `当前聊天对象: ${contactName.value}\n最近对话:\n${recentHistory}\n\n输出必须严格使用：\n<闪讯 from="${contactName.value}">\n消息内容1\n消息内容2\n</闪讯>\n脚本只读取 <闪讯> 标签内的内容，标签外任何内容都会被删除。`;

  try {
    const result = await generateForApp('messages', userText, extraContext);
    if (currentGeneration !== generationSerial) return;
    if (!result.success || !result.parsed) return;

    const content = cleanMessagesReplyText(String(result.parsed));
    const lines = content.split('\n').map((l: string) => l.trim()).filter((l: string) => l && l !== '[未读]');

    for (const [i, line] of lines.entries()) {
      messages.value.push({
        id: `ai_${Date.now()}_${i}`,
        from: 'other',
        content: line,
        timestamp: Date.now() + i * 1000,
        type: 'text',
      });
      store.sendMessage(contactName.value, line, contactName.value, false);
    }
  } catch (e) {
    console.warn('[小手机] 消息 AI 生成失败:', e);
  } finally {
    if (currentGeneration === generationSerial) {
      isGenerating.value = false;
      isTyping.value = false;
    }
    nextTick(() => scrollToBottom());
  }
}

function stopGeneration() {
  generationSerial++;
  try { stopAllGeneration(); } catch { /* ignore */ }
  isGenerating.value = false;
  isTyping.value = false;
}

function clearChat() {
  messages.value = [];
  showMoreMenu.value = false;
  toastr.success('聊天记录已清除');
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
}

function autoResize() {
  if (inputArea.value) {
    inputArea.value.style.height = 'auto';
    inputArea.value.style.height = Math.min(inputArea.value.scrollHeight, 100) + 'px';
  }
}

function onScroll() {
  showMoreMenu.value = false;
}
</script>

<style scoped>
.chat-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
}

/* ─── Header ─── */
.chat-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary);
  flex-shrink: 0;
}

.back-btn, .action-btn {
  width: 34px; height: 34px; border: none; border-radius: 50%;
  background: var(--bg-tertiary); color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: background 0.15s;
}
.back-btn:hover, .action-btn:hover { background: var(--bg-hover); }

.chat-info { flex: 1; min-width: 0; }
.chat-name {
  font-size: 15px; font-weight: 600; color: var(--text-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.chat-status {
  display: flex; align-items: center; gap: 4px;
  font-size: 11px; color: var(--text-tertiary);
}
.online-indicator {
  width: 7px; height: 7px; border-radius: 50%; background: var(--text-tertiary);
}
.online-indicator.online { background: #27ae60; }

/* ─── More Menu ─── */
.more-menu {
  position: absolute; top: 50px; right: 12px; width: 150px;
  background: var(--bg-primary); border: 1px solid var(--border-primary);
  border-radius: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  z-index: 10; overflow: hidden;
}
.menu-item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 11px 14px; border: none; background: transparent;
  color: var(--text-primary); font-size: 13px; cursor: pointer;
}
.menu-item:hover { background: var(--bg-hover); }

/* ─── Messages ─── */
.messages-container {
  flex: 1; overflow-y: auto; padding: 8px 12px;
}

.messages-list {
  display: flex; flex-direction: column; gap: 4px;
}

.message-wrapper {
  display: flex; flex-direction: column;
}

.timestamp {
  text-align: center; font-size: 11px; color: var(--text-muted);
  margin: 8px 0 4px; padding: 2px 10px;
  background: var(--bg-tertiary); border-radius: 10px;
  align-self: center;
}

.message-row {
  display: flex; align-items: flex-end; gap: 8px;
  max-width: 82%;
}

.message-row.mine {
  align-self: flex-end; flex-direction: row-reverse;
}

.message-row:not(.mine) {
  align-self: flex-start;
}

.message-bubble {
  position: relative; padding: 9px 13px;
  border-radius: 16px; font-size: 14px; line-height: 1.45;
  word-break: break-word; max-width: 100%;
}

.message-row.mine .message-bubble {
  background: var(--accent, #579bf0); color: white;
  border-bottom-right-radius: 4px;
}

.message-row:not(.mine) .message-bubble {
  background: var(--bg-primary); color: var(--text-primary);
  border-bottom-left-radius: 4px;
}

.message-bubble.streaming {
  min-width: 40px;
}

.message-bubble.streaming::after {
  content: '▌';
  animation: blink 0.8s steps(2) infinite;
  color: var(--accent);
  font-weight: 300;
}

@keyframes blink { 50% { opacity: 0; } }

/* ─── 特殊消息 ─── */
.text-message { white-space: pre-wrap; }

.emoji-message {
  font-size: 32px; line-height: 1.2;
  background: transparent !important;
  padding: 0 !important;
}

.message-row.mine .emoji-message,
.message-row:not(.mine) .emoji-message {
  background: transparent;
}

.voice-message {
  display: flex; align-items: center; gap: 6px; min-width: 70px;
}
.voice-wave { display: flex; align-items: center; gap: 2px; height: 18px; }
.wave-bar {
  width: 3px; background: currentColor; border-radius: 2px;
  animation: wave 0.8s ease-in-out infinite;
}
.wave-bar:nth-child(1) { height: 40%; animation-delay: 0s; }
.wave-bar:nth-child(2) { height: 70%; animation-delay: 0.1s; }
.wave-bar:nth-child(3) { height: 50%; animation-delay: 0.2s; }
.wave-bar:nth-child(4) { height: 80%; animation-delay: 0.3s; }
@keyframes wave {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(0.4); }
}
.voice-duration { font-size: 11px; opacity: 0.7; }

.image-message { max-width: 180px; }
.image-placeholder {
  width: 180px; height: 120px; background: var(--bg-tertiary);
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  color: var(--text-muted);
}

.message-status {
  position: absolute; bottom: 2px; right: -16px;
  color: var(--text-muted);
}
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

:deep(.msg-link) { color: inherit; text-decoration: underline; opacity: 0.85; }
:deep(.inline-tag) {
  display: inline-block; padding: 2px 6px; border-radius: 4px;
  background: rgba(255,255,255,0.1); font-size: 12px;
}
:deep(.emoji) { font-size: 18px; }

/* ─── Typing ─── */
.typing-row {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 4px 0; margin-top: 4px;
}

/* ─── Input Area ─── */
.input-area {
  display: flex; align-items: flex-end; gap: 6px;
  padding: 8px 10px; background: var(--bg-primary);
  border-top: 1px solid var(--border-secondary); flex-shrink: 0;
}

.func-btn {
  width: 36px; height: 36px; border: none; border-radius: 50%;
  background: var(--bg-tertiary); color: var(--text-secondary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.15s;
}
.func-btn:hover { background: var(--bg-hover); }

.input-wrapper { flex: 1; min-width: 0; }
.message-input {
  width: 100%; max-height: 100px; padding: 8px 12px;
  border: none; border-radius: 18px; background: var(--bg-secondary);
  color: var(--text-primary); font-size: 14px; line-height: 1.4;
  resize: none; outline: none; overflow-y: auto;
}
.message-input::placeholder { color: var(--text-muted); }

.send-btn {
  width: 36px; height: 36px; border: none; border-radius: 50%;
  background: var(--bg-tertiary); color: var(--text-muted);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.2s;
}
.send-btn.active { background: var(--accent); color: white; }
.send-btn.generating { background: var(--danger); color: white; }
.send-btn:disabled { cursor: not-allowed; opacity: 0.4; }

/* ─── Func Panel ─── */
.func-panel {
  display: flex; gap: 16px; padding: 14px 20px 20px;
  background: var(--bg-primary); border-top: 1px solid var(--border-secondary);
  flex-shrink: 0;
}
.func-item {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
}
.func-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s;
}
.func-item:hover .func-icon { transform: scale(1.08); }
.func-item span { font-size: 11px; color: var(--text-secondary); }

/* ─── Transitions ─── */
.dropdown-enter-active, .dropdown-leave-active { transition: all 0.2s ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-8px); }

.slide-up-enter-active, .slide-up-leave-active { transition: all 0.25s ease; }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(16px); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
