import { useSettingsStore } from './settings';
import {
  translateMessage,
  cancelCurrentTask,
  isTranslating,
  restoreCachedTranslation,
  restoreAllCachedTranslations,
} from './translator';
import { SCRIPT_NAME } from './types';

const eventHandles: EventOnReturn[] = [];

/**
 * 注入手动翻译按钮到消息操作栏
 */
function injectTranslateButton(messageId: number) {
  const $mes = $(`#chat .mes[mesid="${messageId}"]`);
  if ($mes.length === 0) return;

  // 仅对 AI 消息注入
  if ($mes.attr('is_user') === 'true') return;

  const $extraButtons = $mes.find('.mes_buttons .extraMesButtons');
  if ($extraButtons.length === 0) return;

  // 避免重复注入
  if ($extraButtons.find('.mes_translate_btn').length > 0) return;

  const $btn = $('<div class="mes_button mes_translate_btn fa-solid fa-language" title="翻译此消息"></div>');
  $btn.on('click', (e) => {
    e.stopPropagation();
    const mid = parseInt($mes.attr('mesid') ?? '', 10);
    if (!isNaN(mid)) {
      translateMessage(mid);
    }
  });

  $extraButtons.prepend($btn);
}

/**
 * 为当前所有 AI 消息注入翻译按钮
 */
function injectAllTranslateButtons() {
  $('#chat .mes').each(function () {
    const mesid = $(this).attr('mesid');
    if (mesid !== undefined) {
      injectTranslateButton(parseInt(mesid, 10));
    }
  });
}

/**
 * 注册所有事件监听
 */
export function registerEvents() {
  // AI 消息生成完毕 - 自动翻译
  eventHandles.push(
    eventOn(tavern_events.MESSAGE_RECEIVED, (messageId: number, type: string) => {
      // 仅对普通生成、regenerate、swipe、continue 类型触发
      const autoTypes = new Set(['normal', 'regenerate', 'swipe', 'continue', 'appendFinal']);
      if (!autoTypes.has(type)) return;

      // 检查是否为 AI 消息
      const msgs = getChatMessages(messageId);
      if (msgs.length === 0 || msgs[0].role !== 'assistant') return;

      // 注入翻译按钮
      setTimeout(() => injectTranslateButton(messageId), 100);

      // 自动翻译
      const store = useSettingsStore();
      if (store.settings.autoTranslate) {
        console.info(`[${SCRIPT_NAME}] 自动翻译消息 #${messageId}`);
        translateMessage(messageId);
      }
    }),
  );

  // 生成开始时取消当前翻译（regenerate 场景）
  eventHandles.push(
    eventOn(tavern_events.GENERATION_STARTED, () => {
      if (isTranslating()) {
        console.info(`[${SCRIPT_NAME}] 检测到新生成，取消当前翻译任务`);
        cancelCurrentTask();
      }
    }),
  );

  // Swipe 时取消当前翻译
  eventHandles.push(
    eventOn(tavern_events.MESSAGE_SWIPED, () => {
      if (isTranslating()) {
        console.info(`[${SCRIPT_NAME}] 检测到 swipe，取消当前翻译任务`);
        cancelCurrentTask();
      }
    }),
  );

  // 消息渲染完毕 - 注入按钮 + 恢复缓存译文
  eventHandles.push(
    eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, (messageId: number) => {
      setTimeout(() => {
        injectTranslateButton(messageId);
        restoreCachedTranslation(messageId);
      }, 50);
    }),
  );

  // 用户消息渲染 - 注入按钮（虽然通常不翻译用户消息，但保持按钮注入的统一性）
  eventHandles.push(
    eventOn(tavern_events.USER_MESSAGE_RENDERED, (messageId: number) => {
      setTimeout(() => injectTranslateButton(messageId), 50);
    }),
  );

  // 聊天切换 - 恢复缓存译文 + 重新注入按钮
  eventHandles.push(
    eventOn(tavern_events.CHAT_CHANGED, () => {
      cancelCurrentTask();
      setTimeout(() => {
        injectAllTranslateButtons();
        restoreAllCachedTranslations();
      }, 500);
    }),
  );

  // 更多消息加载
  eventHandles.push(
    eventOn(tavern_events.MORE_MESSAGES_LOADED, () => {
      setTimeout(() => {
        injectAllTranslateButtons();
        restoreAllCachedTranslations();
      }, 300);
    }),
  );

  // 初始注入
  setTimeout(() => {
    injectAllTranslateButtons();
    restoreAllCachedTranslations();
  }, 500);
}

/**
 * 卸载所有事件监听
 */
export function unregisterEvents() {
  cancelCurrentTask();
  eventHandles.forEach(h => h.stop());
  eventHandles.length = 0;

  // 移除注入的翻译按钮
  $('.mes_translate_btn').remove();
}
