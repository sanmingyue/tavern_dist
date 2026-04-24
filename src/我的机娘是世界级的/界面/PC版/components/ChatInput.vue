<template>
  <div class="chat-input-wrapper">
    <div class="chat-input-container">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="chat-textarea"
        placeholder="输入你的行动..."
        rows="1"
        @keydown.enter.exact.prevent="onSend"
        @input="autoResize"
      ></textarea>
      <button
        class="send-btn"
        :disabled="!inputText.trim() || isSending"
        @click="onSend"
      >
        <svg v-if="isSending" viewBox="0 0 24 24" class="h-5 w-5 animate-spin" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { sendUserMessage } from '../aiInteraction';

const inputText = ref('');
const isSending = ref(false);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

function autoResize() {
  const el = textareaRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
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
    console.error('[ChatInput] 发送失败:', e);
    toastr.error('消息发送失败', '错误');
    inputText.value = text; // 恢复文本
  } finally {
    isSending.value = false;
  }
}
</script>

<style scoped>
.chat-input-wrapper {
  padding: 12px 20px 16px;
  background: linear-gradient(180deg, transparent, rgba(6,10,19,0.95) 30%);
}
.chat-input-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: #1a2236;
  border: 1px solid rgba(99,130,255,0.2);
  border-radius: 12px;
  padding: 8px 8px 8px 16px;
  transition: border-color 0.2s;
}
.chat-input-container:focus-within {
  border-color: rgba(99,130,255,0.5);
}
.chat-textarea {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.5;
  resize: none;
  max-height: 120px;
  font-family: inherit;
}
.chat-textarea::placeholder {
  color: #475569;
}
.send-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s;
}
.send-btn:hover:not(:disabled) {
  filter: brightness(1.15);
}
.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
