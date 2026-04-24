<template>
  <div class="chat-view">
    <!-- 聊天顶栏 -->
    <div class="chat-topbar">
      <button class="chat-back-btn" @click="store.goBack">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <!-- 顶栏头像（点击换头像） -->
      <div class="chat-topbar-avatar" @click="triggerContactAvatarUpload" title="点击更换头像">
        <img v-if="store.getAvatar(store.activeContact!)" class="topbar-avatar-img" :src="store.getAvatar(store.activeContact!)!" :alt="store.activeContact!" />
        <div v-else class="topbar-avatar-placeholder" :style="{ background: avatarGradient(store.activeContact!) }">
          {{ store.activeContact!.charAt(0) }}
        </div>
      </div>
      <div class="chat-contact-info">
        <span class="chat-contact-name">{{ store.activeContact }}</span>
      </div>
      <input ref="contactAvatarInputRef" type="file" accept="image/*" class="hidden-input" @change="onContactAvatarSelected" />
      <input ref="userAvatarInputRef" type="file" accept="image/*" class="hidden-input" @change="onUserAvatarSelected" />
    </div>

    <!-- 消息列表 -->
    <div ref="messagesRef" class="chat-messages">
      <TransitionGroup name="msg-pop" tag="div" class="msg-list">
        <div
          v-for="entry in visibleMessages"
          :key="entry.id"
          class="message-wrapper"
          :class="{ 'is-self': isSelf(entry) }"
        >
          <!-- 对方头像（点击换头像） -->
          <div v-if="!isSelf(entry)" class="msg-avatar-wrap clickable" @click="triggerContactAvatarUpload" title="点击更换头像">
            <img v-if="store.getAvatar(entry.from)" class="msg-avatar-img" :src="store.getAvatar(entry.from)!" :alt="entry.from" />
            <div v-else class="msg-avatar-placeholder" :style="{ background: avatarGradient(entry.from) }">
              {{ entry.from.charAt(0) }}
            </div>
          </div>

          <!-- 消息内容 -->
          <div class="message-bubble" :class="{ 'bubble-self': isSelf(entry), 'bubble-other': !isSelf(entry), 'bubble-sticker': isStickerMsg(entry) }">
            <!-- 纯表情消息 -->
            <img
              v-if="isStickerMsg(entry)"
              class="sticker-img"
              :src="getStickerImgUrl(entry.content)!"
              :alt="extractStickerText(entry.content) || ''"
              loading="lazy"
            />
            <!-- 混合文本+表情消息 -->
            <div v-else class="message-content" v-html="renderContent(entry.content)" />
          </div>

          <!-- 自己的头像（点击换头像） -->
          <div v-if="isSelf(entry)" class="msg-avatar-wrap clickable" @click="triggerUserAvatarUpload" title="点击更换我的头像">
            <img v-if="store.getUserAvatar()" class="msg-avatar-img" :src="store.getUserAvatar()!" alt="user" />
            <div v-else class="msg-avatar-placeholder msg-avatar-self">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          </div>
        </div>
      </TransitionGroup>

      <div v-if="store.currentConversation.length === 0" class="chat-empty">
        <div class="chat-empty-text">暂无聊天记录</div>
      </div>
    </div>

    <!-- 底部输入栏（可回复） -->
    <div class="chat-input-bar">
      <div class="chat-input-wrapper">
        <input
          ref="inputRef"
          v-model="replyText"
          class="chat-input"
          placeholder="输入回复..."
          @keydown.enter="handleSend"
        />
        <button class="chat-send-btn" :class="{ active: replyText.trim() }" @click="handleSend">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
      <div class="chat-input-hint">回复将添加到酒馆输入框，可与正文一起发送</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../store';
import type { PhoneMessage } from '../parser';
import { isPureSticker, extractStickerName, getStickerUrl, STICKER_MAP } from '../stickers';

const store = usePhoneStore();
const messagesRef = ref<HTMLDivElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const contactAvatarInputRef = ref<HTMLInputElement | null>(null);
const userAvatarInputRef = ref<HTMLInputElement | null>(null);
const replyText = ref('');

// ─── 逐条弹出动画逻辑 ───
const revealedCount = ref(0);
const lastKnownLength = ref(0);
let popTimer: ReturnType<typeof setTimeout> | null = null;

const visibleMessages = computed(() => {
  return store.currentConversation.slice(0, revealedCount.value);
});

// 监听对话变化，逐条弹出新消息
watch(
  () => store.currentConversation.length,
  (newLen) => {
    if (newLen <= lastKnownLength.value) {
      // 消息减少或不变（切换联系人、全量刷新），直接全部显示
      revealedCount.value = newLen;
      lastKnownLength.value = newLen;
      return;
    }

    // 有新消息：逐条弹出
    const startFrom = revealedCount.value;
    const toReveal = newLen - startFrom;

    if (popTimer) clearTimeout(popTimer);

    let i = 0;
    function popNext() {
      if (i >= toReveal) return;
      revealedCount.value = startFrom + i + 1;
      i++;
      scrollToBottom();
      if (i < toReveal) {
        popTimer = setTimeout(popNext, 400 + Math.random() * 300);
      }
    }

    // 第一条稍微延迟一下
    popTimer = setTimeout(popNext, 200);
    lastKnownLength.value = newLen;
  },
  { immediate: true },
);

// 切换联系人时重置
watch(
  () => store.activeContact,
  () => {
    if (popTimer) clearTimeout(popTimer);
    const len = store.currentConversation.length;
    revealedCount.value = len;
    lastKnownLength.value = len;
    scrollToBottom();
  },
);

onUnmounted(() => {
  if (popTimer) clearTimeout(popTimer);
});

const gradients = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

function avatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

function isSelf(entry: PhoneMessage): boolean {
  return entry.from === store.resolvedUserName;
}

function isStickerMsg(entry: PhoneMessage): boolean {
  return isPureSticker(entry.content);
}

function getStickerImgUrl(content: string): string | null {
  const name = extractStickerName(content);
  return name ? getStickerUrl(name) : null;
}

function extractStickerText(content: string): string | null {
  return extractStickerName(content);
}

/**
 * 渲染消息内容：将 [表情:xxx] 替换为 <img> 标签，其余文本转义
 */
function renderContent(content: string): string {
  // 先转义 HTML
  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  // 替换 [表情:xxx] 为 img 标签
  return escaped.replace(/\[表情[:：]([^\]]+)\]/g, (_match, name) => {
    const url = STICKER_MAP[name];
    if (url) {
      return `<img class="inline-sticker" src="${url}" alt="${name}" loading="lazy" />`;
    }
    return `[表情:${name}]`;
  });
}

function handleSend() {
  if (!replyText.value.trim()) return;
  store.sendReply(replyText.value);
  replyText.value = '';
}

/* ─── 头像上传：点击头像触发 ─── */

function triggerContactAvatarUpload() {
  contactAvatarInputRef.value?.click();
}

function triggerUserAvatarUpload() {
  userAvatarInputRef.value?.click();
}

async function onContactAvatarSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file || !store.activeContact) return;
  await store.setAvatar(store.activeContact, file);
  input.value = '';
}

async function onUserAvatarSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  await store.setUserAvatar(file);
  input.value = '';
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesRef.value) {
      messagesRef.value.scrollTop = messagesRef.value.scrollHeight;
    }
  });
}
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-topbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
  border-bottom: 1px solid var(--border-secondary);
  background: var(--bg-tertiary);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.chat-back-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.chat-back-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* 顶栏头像 */
.chat-topbar-avatar {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  cursor: pointer;
  border-radius: 6px;
  overflow: hidden;
  transition: opacity 0.15s;
}

.chat-topbar-avatar:hover {
  opacity: 0.8;
}

.topbar-avatar-img {
  width: 32px;
  height: 32px;
  object-fit: cover;
}

.topbar-avatar-placeholder {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.chat-contact-info {
  flex: 1;
  min-width: 0;
}

.chat-contact-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.hidden-input {
  display: none;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  scrollbar-width: thin;
  scrollbar-color: var(--text-hint) transparent;
}

.chat-messages::-webkit-scrollbar {
  width: 4px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--text-hint);
  border-radius: 2px;
}

.msg-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 85%;
}

.message-wrapper.is-self {
  align-self: flex-end;
  flex-direction: row;
}

.message-wrapper:not(.is-self) {
  align-self: flex-start;
}

/* 消息弹出动画 */
.msg-pop-enter-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.msg-pop-enter-from {
  opacity: 0;
  transform: translateY(16px) scale(0.92);
}

.msg-pop-leave-active {
  transition: all 0.2s ease;
}

.msg-pop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 消息头像 */
.msg-avatar-wrap {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.msg-avatar-wrap.clickable {
  cursor: pointer;
  transition: opacity 0.15s;
}

.msg-avatar-wrap.clickable:hover {
  opacity: 0.8;
}

.msg-avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: cover;
}

.msg-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: white;
}

.msg-avatar-self {
  background: var(--accent-bg);
  color: var(--accent);
}

.message-bubble {
  padding: 8px 12px;
  border-radius: 12px;
  max-width: 100%;
  word-break: break-word;
}

.bubble-sticker {
  padding: 4px;
  background: transparent !important;
}

.bubble-self {
  background: var(--bg-bubble-self);
  border-bottom-right-radius: 4px;
}

.bubble-other {
  background: var(--bg-bubble-other);
  border-bottom-left-radius: 4px;
}

.message-content {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-primary);
}

.bubble-self .message-content {
  color: white;
}

/* 表情贴图（纯表情消息） */
.sticker-img {
  width: 96px;
  height: 96px;
  object-fit: contain;
  display: block;
}

/* 行内表情（混合在文字中） */
:deep(.inline-sticker) {
  width: 24px;
  height: 24px;
  vertical-align: middle;
  display: inline;
  margin: 0 2px;
}

.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 120px;
}

.chat-empty-text {
  font-size: 13px;
  color: var(--text-muted);
}

.chat-input-bar {
  padding: 8px 12px 6px;
  border-top: 1px solid var(--border-secondary);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.chat-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-input);
  border-radius: 18px;
  padding: 4px 4px 4px 14px;
}

.chat-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  padding: 4px 0;
  min-width: 0;
}

.chat-input::placeholder {
  color: var(--text-hint);
}

.chat-send-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: none;
  background: var(--bg-hover);
  color: var(--text-hint);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}

.chat-send-btn.active {
  background: var(--accent);
  color: white;
}

.chat-send-btn:hover {
  background: var(--bg-active);
}

.chat-send-btn.active:hover {
  background: var(--accent-hover);
}

.chat-input-hint {
  font-size: 10px;
  color: var(--text-hint);
  text-align: center;
  padding: 0 4px;
}
</style>
