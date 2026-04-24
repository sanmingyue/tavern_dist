<template>
  <div class="m-chat-input-wrapper">
    <div class="m-chat-input-container">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="m-chat-textarea"
        placeholder="输入你的行动..."
        rows="1"
        @keydown.enter.exact.prevent="onSend"
        @input="autoResize"
      ></textarea>
      <button class="m-send-btn" :disabled="!inputText.trim() || isSending" @click="onSend">
        <svg v-if="isSending" viewBox="0 0 24 24" class="h-4.5 w-4.5 animate-spin" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
        <svg v-else viewBox="0 0 24 24" class="h-4.5 w-4.5" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sendUserMessage } from '../PC版/aiInteraction';

const inputText = ref('');
const isSending = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function autoResize() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

async function onSend() {
  const text = inputText.value.trim();
  if (!text || isSending.value) return;
  isSending.value = true;
  inputText.value = '';
  if (textareaRef.value) textareaRef.value.style.height = 'auto';
  try {
    await sendUserMessage(text);
  } catch (e) {
    console.error('[MobileChatInput] 发送失败:', e);
    toastr.error('消息发送失败');
    inputText.value = text;
  } finally {
    isSending.value = false;
  }
}
</script>

<style scoped>
.m-chat-input-wrapper {
  padding: 8px 12px 12px;
  background: linear-gradient(180deg, transparent, rgba(6,10,19,0.95) 30%);
}
.m-chat-input-container {
  display: flex; align-items: flex-end; gap: 6px;
  background: #1a2236; border: 1px solid rgba(99,130,255,0.2); border-radius: 10px;
  padding: 6px 6px 6px 12px;
}
.m-chat-input-container:focus-within { border-color: rgba(99,130,255,0.5); }
.m-chat-textarea {
  flex: 1; background: transparent; border: none; outline: none;
  color: #e2e8f0; font-size: 13px; line-height: 1.4; resize: none; max-height: 100px; font-family: inherit;
}
.m-chat-textarea::placeholder { color: #475569; }
.m-send-btn {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border: none; border-radius: 7px;
  background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff;
  cursor: pointer; flex-shrink: 0;
}
.m-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
@keyframes spin { to { transform: rotate(360deg); } }
.animate-spin { animation: spin 1s linear infinite; }
</style>
