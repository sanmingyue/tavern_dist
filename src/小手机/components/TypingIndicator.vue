<template>
  <div class="typing-indicator" :class="[variant]">
    <div v-if="showAvatar" class="typing-avatar">
      <AvatarBadge :name="name" size="sm" />
    </div>
    <div class="typing-bubble">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
    <span v-if="showText" class="typing-text">{{ displayText }}</span>
  </div>
</template>

<script setup lang="ts">
import AvatarBadge from './AvatarBadge.vue';

interface Props {
  /** 正在输入的人的名字 */
  name?: string;
  /** 是否显示头像 */
  showAvatar?: boolean;
  /** 是否显示文字 */
  showText?: boolean;
  /** 自定义文字 */
  text?: string;
  /** 样式变体 */
  variant?: 'inline' | 'bubble' | 'minimal';
}

const props = withDefaults(defineProps<Props>(), {
  name: '',
  showAvatar: false,
  showText: true,
  text: '',
  variant: 'inline',
});

const displayText = computed(() => {
  if (props.text) return props.text;
  if (props.name) return `${props.name}正在输入...`;
  return '正在输入...';
});
</script>

<style scoped>
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ─── inline 样式 ─── */
.typing-indicator.inline {
  padding: 6px 0;
}

/* ─── bubble 样式（像消息气泡） ─── */
.typing-indicator.bubble {
  padding: 4px 0;
}

.typing-indicator.bubble .typing-bubble {
  background: var(--bg-primary, #0b0e14);
  padding: 10px 16px;
  border-radius: 16px;
  border-bottom-left-radius: 4px;
}

/* ─── minimal 样式 ─── */
.typing-indicator.minimal .typing-bubble {
  gap: 3px;
}

.typing-indicator.minimal .typing-dot {
  width: 4px;
  height: 4px;
}

/* ─── 气泡圆点 ─── */
.typing-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-tertiary, rgba(255, 255, 255, 0.45));
  animation: typing-bounce 1.4s ease-in-out infinite;
}

.typing-dot:nth-child(1) {
  animation-delay: 0s;
}

.typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-6px);
    opacity: 1;
  }
}

/* ─── 文字 ─── */
.typing-text {
  font-size: 12px;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
  white-space: nowrap;
}

/* ─── 头像 ─── */
.typing-avatar {
  flex-shrink: 0;
}
</style>
