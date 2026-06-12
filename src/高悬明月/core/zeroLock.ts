import { watch } from 'vue';
import { type ZeroSettings, type useZeroStore } from '../stores/zeroStore';

type ZeroStore = ReturnType<typeof useZeroStore>;

export type ZeroLockController = {
  mirrorNow: (reason?: string) => Promise<void>;
  toggleRevealLatest: () => void;
  hideAgain: () => void;
  applyAll: () => void;
  dispose: () => void;
};

const STYLE_PREFIX = 'gxmy-zero-lock';
const VISUAL_ZERO_SELECTOR = '#chat > .mes[data-gxmy-visual-zero="true"]';

function styleId(suffix: string) {
  return `${STYLE_PREFIX}-${getScriptId().replace(/[^\w-]/g, '_')}-${suffix}`;
}

function ensureParentStyle(id: string, css: string) {
  let $style = $(`head > style#${id}`);
  if ($style.length === 0) {
    $style = $('<style>').attr('id', id).appendTo('head');
  }
  $style.text(css);
}

function removeParentStyle(id: string) {
  $(`head > style#${id}`).remove();
}

function getCurrentMessageText(message: ChatMessage | ChatMessageSwiped): string {
  const swiped = message as ChatMessageSwiped;
  const normal = message as ChatMessage;
  const swipeId = swiped.swipe_id ?? 0;
  return (normal.message ?? swiped.swipes?.[swipeId] ?? swiped.swipes?.[0] ?? '').trim();
}

function getMessage(messageId: number, options?: Parameters<typeof getChatMessages>[1]) {
  return (getChatMessages(messageId, options)[0] as ChatMessageSwiped | undefined) ?? null;
}

function pickMirrorSource(settings: ZeroSettings): ChatMessageSwiped | null {
  const lastId = getLastMessageId();
  if (lastId < 0) {
    return null;
  }
  if (settings.mirrorMode === 'latest_message') {
    return getMessage(lastId, { include_swipes: true });
  }
  const messages = getChatMessages(`0-${lastId}`, { role: 'assistant', include_swipes: true }) as ChatMessageSwiped[];
  return messages[messages.length - 1] ?? getMessage(0, { include_swipes: true });
}

function ensureVisualZero(sourceId?: number) {
  const $existing = $(VISUAL_ZERO_SELECTOR);
  if ($existing.length > 0) {
    $existing.slice(1).remove();
    return $existing.first().attr('data-gxmy-visual-zero', 'true');
  }

  const $source =
    sourceId !== undefined
      ? $(`#chat > .mes[mesid="${sourceId}"]:not([data-gxmy-visual-zero="true"])`).first()
      : $();
  const $template = $source.length > 0 ? $source : $('#chat > .mes:not([data-gxmy-visual-zero="true"])').last();
  const $visual =
    $template.length > 0
      ? $template.clone(false, false)
      : $('<div class="mes"><div class="mes_block"><div class="mes_text"></div></div></div>');

  $visual
    .removeAttr('id')
    .removeAttr('style')
    .attr('data-gxmy-visual-zero', 'true')
    .attr('mesid', '0')
    .appendTo('#chat');
  $visual.find('[id]').removeAttr('id');
  return $visual;
}

function removeVisualZero() {
  $(VISUAL_ZERO_SELECTOR).remove();
}

function updateVisualZeroAttributes(sourceId: number) {
  ensureVisualZero(sourceId)
    .attr('data-gxmy-visual-zero', 'true')
    .attr('mesid', '0')
    .attr('data-gxmy-source', String(sourceId))
    .attr('data-gxmy-mirroring', sourceId > 0 ? 'true' : 'false')
    .removeAttr('data-gxmy-preview');
}

function getVisualMessageText(sourceId: number) {
  const $visual = ensureVisualZero(sourceId);
  let $text = $visual.find('.mes_text').first();
  if ($text.length === 0) {
    $text = $('<div class="mes_text"></div>').appendTo($visual);
  }
  return $text;
}

function scrollToMessage(messageId: number) {
  const element = $(`#chat > .mes[mesid="${messageId}"]:not([data-gxmy-visual-zero="true"])`)[0];
  if (!element) {
    return;
  }
  element.scrollIntoView({ behavior: 'smooth', block: 'end' });
}

function scrollToVisualZero(behavior: ScrollBehavior = 'auto') {
  const element = $(VISUAL_ZERO_SELECTOR)[0];
  if (!element) {
    return;
  }
  element.scrollIntoView({ behavior, block: 'start' });
}

export function createZeroLockController(store: ZeroStore): ZeroLockController {
  let disposed = false;
  let applyingMirror = false;
  let mirrorTimer: number | undefined;
  let currentChatId = String(SillyTavern.getCurrentChatId() ?? '');
  const stopList: Array<() => void> = [];
  const hideStyleId = styleId('hide');
  const customStyleId = styleId('custom');
  const hostStyleId = styleId('host');

  function shouldHideRealFloors() {
    return (
      store.settings.enabled &&
      store.settings.hideNonZero &&
      !store.settings.debugShowHidden &&
      !store.status.manualReveal
    );
  }

  function applyBaseStyle() {
    ensureParentStyle(
      hostStyleId,
      `body > div[script_id="${getScriptId()}"].gxmy-host,
body > div[script_id="${getScriptId()}"].gxmy-host .gxmy-root {
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  width: 0 !important;
  height: 0 !important;
  min-width: 0 !important;
  min-height: 0 !important;
  max-width: none !important;
  max-height: none !important;
  overflow: visible !important;
  pointer-events: none !important;
}

body > div[script_id="${getScriptId()}"].gxmy-host .gxmy-fab,
body > div[script_id="${getScriptId()}"].gxmy-host .gxmy-panel,
body > div[script_id="${getScriptId()}"].gxmy-host .gxmy-panel * {
  pointer-events: auto;
}`,
    );

    ensureParentStyle(
      hideStyleId,
      `#chat.gxmy-zero-lock[data-gxmy-hide="true"] > .mes:not([data-gxmy-visual-zero="true"]) {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

#chat.gxmy-zero-lock[data-gxmy-hide="true"] > .mes[data-gxmy-visual-zero="true"] {
  display: block !important;
  visibility: visible !important;
  pointer-events: auto !important;
}

#chat.gxmy-zero-lock[data-gxmy-hide="true"] #show_more_messages,
#chat.gxmy-zero-lock[data-gxmy-hide="true"] .show_more_messages,
#chat.gxmy-zero-lock[data-gxmy-hide="true"] [id*="show_more"],
#chat.gxmy-zero-lock[data-gxmy-hide="true"] [class*="show_more"],
#chat.gxmy-zero-lock[data-gxmy-hide="true"] [id*="load_more"],
#chat.gxmy-zero-lock[data-gxmy-hide="true"] [class*="load_more"],
#chat.gxmy-zero-lock[data-gxmy-hide="true"] [id*="more_messages"],
#chat.gxmy-zero-lock[data-gxmy-hide="true"] [class*="more_messages"],
#chat.gxmy-zero-lock[data-gxmy-hide="true"] [title*="Show more"],
#chat.gxmy-zero-lock[data-gxmy-hide="true"] [aria-label*="Show more"],
body[data-gxmy-zero-lock-hide="true"] #show_more_messages,
body[data-gxmy-zero-lock-hide="true"] .show_more_messages,
body[data-gxmy-zero-lock-hide="true"] [id*="show_more"],
body[data-gxmy-zero-lock-hide="true"] [class*="show_more"],
body[data-gxmy-zero-lock-hide="true"] [id*="load_more"],
body[data-gxmy-zero-lock-hide="true"] [class*="load_more"],
body[data-gxmy-zero-lock-hide="true"] [id*="more_messages"],
body[data-gxmy-zero-lock-hide="true"] [class*="more_messages"],
body[data-gxmy-zero-lock-hide="true"] [title*="Show more"],
body[data-gxmy-zero-lock-hide="true"] [aria-label*="Show more"] {
  display: none !important;
  visibility: hidden !important;
  pointer-events: none !important;
}`,
    );
  }

  function applyCustomStyle() {
    ensureParentStyle(customStyleId, shouldHideRealFloors() ? store.settings.customCss : '');
  }

  function applyVisibility() {
    const shouldHide = shouldHideRealFloors();
    const $chat = $('#chat');
    if ($chat.hasClass('gxmy-zero-lock') !== shouldHide) {
      $chat.toggleClass('gxmy-zero-lock', shouldHide);
    }
    const nextHide = shouldHide ? 'true' : 'false';
    if ($chat.attr('data-gxmy-hide') !== nextHide) {
      $chat.attr('data-gxmy-hide', nextHide);
    }
    $('body').attr('data-gxmy-zero-lock-hide', nextHide);
    if (!shouldHide) {
      removeVisualZero();
    }

    store.markStatus({
      ready: true,
      totalFloors: Math.max(0, getLastMessageId() + 1),
    });
  }

  function applyAll() {
    if (disposed) {
      return;
    }
    applyBaseStyle();
    applyCustomStyle();
    applyVisibility();
  }

  function queueMirror(reason: string, delay = store.settings.mirrorDelayMs) {
    if (disposed || !store.settings.enabled || store.status.manualReveal) {
      return;
    }
    window.clearTimeout(mirrorTimer);
    mirrorTimer = window.setTimeout(() => {
      void mirrorNow(reason);
    }, delay);
  }

  async function mirrorNow(reason = 'manual') {
    if (disposed || !store.settings.enabled || applyingMirror) {
      return;
    }
    if (store.status.manualReveal) {
      applyVisibility();
      return;
    }

    const source = pickMirrorSource(store.settings);
    if (!source) {
      applyVisibility();
      store.markStatus({ lastReason: '没有可镜像的楼层' });
      return;
    }

    const sourceId = source.message_id;
    applyingMirror = true;
    try {
      const $visual = ensureVisualZero(sourceId);
      await refreshOneMessage(sourceId, $visual);
      updateVisualZeroAttributes(sourceId);
      store.markStatus({
        lastMirroredId: sourceId,
        lastMirrorRole: source.role,
        lastMirrorAt: new Date().toLocaleTimeString(),
        lastReason: reason,
        lastError: '',
      });
    } catch (error) {
      store.markStatus({ lastError: String(error), lastReason: `${reason} 失败` });
      console.error('[高悬明月] 视觉镜像失败:', error);
    } finally {
      applyingMirror = false;
      applyAll();
    }
  }

  function renderStreamToZero(text: string) {
    if (!store.settings.enabled || store.status.manualReveal || !store.settings.streamPreview || !text.trim()) {
      return;
    }
    const sourceId = Math.max(0, getLastMessageId());
    try {
      getVisualMessageText(sourceId).html(formatAsDisplayedMessage(text, { message_id: sourceId }));
      updateVisualZeroAttributes(sourceId);
      applyVisibility();
    } catch {
      getVisualMessageText(sourceId).text(text);
    }
  }

  function previewUserMessageToZero(messageId: number) {
    if (!store.settings.enabled || store.status.manualReveal || !store.settings.previewUserInput || messageId < 1) {
      return;
    }
    const message = getMessage(messageId, { role: 'user', include_swipes: true });
    if (!message) {
      return;
    }
    const text = getCurrentMessageText(message);
    if (!text) {
      return;
    }
    try {
      getVisualMessageText(messageId).html(formatAsDisplayedMessage(text, { message_id: messageId }));
    } catch {
      getVisualMessageText(messageId).text(text);
    }
    ensureVisualZero(messageId)
      .attr('mesid', '0')
      .attr('data-gxmy-visual-zero', 'true')
      .attr('data-gxmy-source', String(messageId))
      .attr('data-gxmy-mirroring', 'false')
      .attr('data-gxmy-preview', 'user');
    store.markStatus({
      lastMirroredId: messageId,
      lastMirrorRole: 'user',
      lastMirrorAt: new Date().toLocaleTimeString(),
      lastReason: '正在显示用户输入',
      lastError: '',
    });
    applyVisibility();
  }

  function toggleRevealLatest() {
    if (store.status.manualReveal) {
      hideAgain();
      return;
    }
    window.clearTimeout(mirrorTimer);
    store.markStatus({
      manualReveal: true,
      lastReason: '已解除隐藏并跳到最新楼层',
    });
    applyAll();
    scrollToMessage(getLastMessageId());
  }

  function hideAgain() {
    store.markStatus({ manualReveal: false, lastReason: '已恢复视觉锁定' });
    void mirrorNow('恢复锁定后同步').finally(() => {
      scrollToVisualZero();
    });
  }

  function listen<T extends EventType>(event: T, listener: ListenerType[T], last = false) {
    stopList.push((last ? eventMakeLast(event, errorCatched(listener)) : eventOn(event, errorCatched(listener))).stop);
  }

  listen(tavern_events.MESSAGE_SENT, messageId => {
    store.markStatus({ isGenerating: true, lastReason: '用户消息已发送，等待回复' });
    window.setTimeout(() => {
      previewUserMessageToZero(messageId);
    }, 0);
  }, true);

  listen(tavern_events.MESSAGE_RECEIVED, (_messageId, type) => {
    if (type === 'quiet' || type === 'command' || type === 'extension') {
      applyVisibility();
      return;
    }
    store.markStatus({ isGenerating: false });
    queueMirror('AI回复完成');
  }, true);

  listen(tavern_events.GENERATION_STARTED, () => {
    store.markStatus({ isGenerating: true, lastReason: '生成开始' });
    applyVisibility();
  }, true);

  listen(tavern_events.GENERATION_STOPPED, () => {
    store.markStatus({ isGenerating: false, lastReason: '生成停止' });
    queueMirror('生成停止后同步', 100);
  }, true);

  listen(tavern_events.GENERATION_ENDED, () => {
    store.markStatus({ isGenerating: false });
    queueMirror('生成结束');
  }, true);

  listen(tavern_events.STREAM_TOKEN_RECEIVED, text => {
    renderStreamToZero(text);
  });

  listen(tavern_events.MESSAGE_SWIPED, () => {
    queueMirror('切换消息页', 200);
  }, true);

  [tavern_events.MESSAGE_EDITED, tavern_events.MESSAGE_UPDATED, tavern_events.MESSAGE_DELETED].forEach(event => {
    listen(event, () => {
      queueMirror('楼层变更', 250);
    }, true);
  });

  [tavern_events.USER_MESSAGE_RENDERED, tavern_events.CHARACTER_MESSAGE_RENDERED].forEach(event => {
    listen(event, () => {
      applyVisibility();
    }, true);
  });

  listen(tavern_events.CHAT_CHANGED, chatId => {
    const nextChatId = String(chatId || SillyTavern.getCurrentChatId());
    if (nextChatId === currentChatId) {
      applyAll();
      return;
    }
    currentChatId = nextChatId;
    window.clearTimeout(mirrorTimer);
    removeVisualZero();
    store.markStatus({
      isGenerating: false,
      lastMirroredId: null,
      lastMirrorRole: null,
      lastMirrorAt: '',
      lastReason: '聊天切换',
      lastError: '',
      manualReveal: false,
    });
    queueMirror('聊天切换后同步', 300);
  }, true);

  const observer = new MutationObserver(() => {
    applyVisibility();
  });
  const chat = $('#chat')[0];
  if (chat) {
    observer.observe(chat, { childList: true, subtree: false });
  }

  const stopWatch = watch(
    () => ({ ...store.settings }),
    (_settings, oldSettings) => {
      applyAll();
      if (!store.settings.enabled && oldSettings?.enabled) {
        removeVisualZero();
      } else if (store.settings.enabled) {
        queueMirror('设置更新', 100);
      }
    },
    { deep: true },
  );

  applyBaseStyle();
  applyCustomStyle();
  void mirrorNow('初始化同步');

  return {
    mirrorNow,
    toggleRevealLatest,
    hideAgain,
    applyAll,
    dispose: () => {
      disposed = true;
      window.clearTimeout(mirrorTimer);
      observer.disconnect();
      stopWatch();
      stopList.forEach(stop => stop());
      removeVisualZero();
      $('#chat').removeClass('gxmy-zero-lock').removeAttr('data-gxmy-hide');
      $('body').removeAttr('data-gxmy-zero-lock-hide');
      removeParentStyle(hideStyleId);
      removeParentStyle(customStyleId);
      removeParentStyle(hostStyleId);
    },
  };
}
