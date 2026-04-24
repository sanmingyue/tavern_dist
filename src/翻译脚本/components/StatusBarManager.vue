<template>
  <div style="display: none"></div>
</template>

<script setup lang="ts">
import { onTaskStateChange, getCurrentTaskState } from '../translator';
import type { TaskState } from '../types';
import { STATUS_SUCCESS_DURATION, STATUS_SKIP_DURATION } from '../types';

// 管理已注入的状态栏
const statusBars = new Map<number, { $el: JQuery; timer: number | null }>();

function formatElapsed(ms: number): string {
  return (ms / 1000).toFixed(1) + 's';
}

function getStatusHtml(state: TaskState): string {
  switch (state.status) {
    case 'running':
      return `
        <div class="translate-status translate-status-running">
          <i class="fa-solid fa-spinner fa-spin"></i>
          <span>翻译中...</span>
          <span class="translate-status-timer">${formatElapsed(state.elapsed)}</span>
        </div>`;

    case 'success': {
      let tokenInfo = '';
      if (state.usage) {
        tokenInfo = `<span class="translate-status-tokens">输入 ${state.usage.prompt_tokens} / 输出 ${state.usage.completion_tokens}</span>`;
      }
      return `
        <div class="translate-status translate-status-success">
          <i class="fa-solid fa-check-circle"></i>
          <span>翻译成功</span>
          <span class="translate-status-time">耗时 ${formatElapsed(state.elapsed)}</span>
          ${tokenInfo}
        </div>`;
    }

    case 'failed':
      return `
        <div class="translate-status translate-status-failed">
          <i class="fa-solid fa-exclamation-circle"></i>
          <span>翻译失败</span>
          <span class="translate-status-error">${_.escape(state.error ?? '未知错误')}</span>
          <button class="translate-status-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
        </div>`;

    case 'skipped':
      return `
        <div class="translate-status translate-status-skipped">
          <i class="fa-solid fa-forward"></i>
          <span>未找到待翻译内容，已跳过</span>
        </div>`;

    case 'cancelled':
      return '';

    default:
      return '';
  }
}

function ensureStatusBar(messageId: number): JQuery {
  let entry = statusBars.get(messageId);
  if (entry) {
    // 清除之前的自动消失定时器
    if (entry.timer !== null) {
      clearTimeout(entry.timer);
      entry.timer = null;
    }
    return entry.$el;
  }

  // 创建状态栏容器并注入到消息底部
  const $mesText = $(`#chat .mes[mesid="${messageId}"] .mes_text`);
  if ($mesText.length === 0) {
    // 如果找不到，创建一个脱离的元素
    const $el = $('<div class="translate-status-bar"></div>');
    statusBars.set(messageId, { $el, timer: null });
    return $el;
  }

  const $el = $('<div class="translate-status-bar"></div>');
  $mesText.append($el);
  statusBars.set(messageId, { $el, timer: null });
  return $el;
}

function removeStatusBar(messageId: number) {
  const entry = statusBars.get(messageId);
  if (entry) {
    if (entry.timer !== null) clearTimeout(entry.timer);
    entry.$el.remove();
    statusBars.delete(messageId);
  }
}

function handleTaskState(state: TaskState) {
  const { messageId, status } = state;

  if (status === 'idle' || status === 'cancelled') {
    removeStatusBar(messageId);
    return;
  }

  const $el = ensureStatusBar(messageId);
  const html = getStatusHtml(state);

  if (!html) {
    removeStatusBar(messageId);
    return;
  }

  $el.html(html);

  // 绑定关闭按钮事件
  $el.find('.translate-status-close').on('click', () => {
    removeStatusBar(messageId);
  });

  // 自动消失
  const entry = statusBars.get(messageId);
  if (!entry) return;

  if (status === 'success') {
    entry.timer = window.setTimeout(() => {
      $el.fadeOut(300, () => removeStatusBar(messageId));
    }, STATUS_SUCCESS_DURATION);
  } else if (status === 'skipped') {
    entry.timer = window.setTimeout(() => {
      $el.fadeOut(300, () => removeStatusBar(messageId));
    }, STATUS_SKIP_DURATION);
  }
}

// 监听任务状态变化
let unsubscribe: (() => void) | null = null;

onMounted(() => {
  unsubscribe = onTaskStateChange(handleTaskState);
});

onUnmounted(() => {
  unsubscribe?.();
  // 清理所有状态栏
  for (const [id] of statusBars) {
    removeStatusBar(id);
  }
});
</script>
