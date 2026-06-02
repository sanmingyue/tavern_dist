import { createScriptIdDiv, teleportStyle } from '@util/script';
import App from './App.vue';
import { cleanupImmersive, isImmersiveActive } from './immersive';

$(async () => {
  await waitGlobalInitialized('Mvu');

  let app: ReturnType<typeof createApp> | null = null;
  let $container: JQuery | null = null;
  const { destroy } = teleportStyle();

  /** 获取当前最新 AI 楼层的 mesid */
  function getLatestAiMesId(): string | undefined {
    const $messages = $('#chat .mes:not([is_user="true"])');
    if ($messages.length === 0) return undefined;
    return $messages.last().attr('mesid');
  }

  /** 获取当前状态栏所在楼层的 mesid */
  function getCurrentMountedMesId(): string | undefined {
    if (!$container || $container.length === 0) return undefined;
    return $container.closest('.mes').attr('mesid');
  }

  /** 找到最新 AI 楼层并挂载状态栏 */
  function mountToLatestMessage() {
    // 移除旧的挂载
    if (app) {
      app.unmount();
      app = null;
    }
    if ($container) {
      $container.remove();
      $container = null;
    }

    // 找到最新的 AI 消息楼层（.mes 且不是 user 的最后一个）
    const $messages = $('#chat .mes:not([is_user="true"])');
    if ($messages.length === 0) return;

    const $lastAiMsg = $messages.last();
    const $mesBlock = $lastAiMsg.find('.mes_block');
    if ($mesBlock.length === 0) return;

    // 创建容器并追加到楼层末尾
    $container = $('<div class="fruit-status-container"></div>')
      .css({
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '8px 4px 4px 4px',
      })
      .appendTo($mesBlock);

    // 挂载 Vue
    app = createApp(App).use(createPinia());
    app.mount($container[0]);

    console.info('[状态栏] 已挂载到楼层', $lastAiMsg.attr('mesid'));
  }

  // 初始挂载
  mountToLatestMessage();

  // 监听消息事件，重新挂载到最新楼层（沉浸模式时跳过，已在最新楼层时跳过）
  const debouncedMount = _.debounce(() => {
    if (isImmersiveActive()) return;
    const latestId = getLatestAiMesId();
    const currentId = getCurrentMountedMesId();
    if (latestId === currentId && $container && $container.closest('body').length > 0) return;
    mountToLatestMessage();
  }, 500);

  eventOn(tavern_events.MESSAGE_RECEIVED, debouncedMount);
  eventOn(tavern_events.GENERATION_ENDED, debouncedMount);
  eventOn(tavern_events.MESSAGE_SWIPED, debouncedMount);
  eventOn(tavern_events.MESSAGE_UPDATED, debouncedMount);
  eventOn(tavern_events.CHAT_CHANGED, debouncedMount);

  // ── 定时自查：确保状态栏始终在最新 AI 楼层上 ──
  const SELF_CHECK_INTERVAL = 3000; // 每 3 秒检查一次
  const selfCheckTimer = setInterval(() => {
    // 沉浸模式活跃时不重新挂载，避免 unmount 触发 cleanupImmersive
    if (isImmersiveActive()) return;

    const latestId = getLatestAiMesId();
    const currentId = getCurrentMountedMesId();

    // 如果最新楼层变了，或者容器已被移除/DOM脱离
    if (latestId !== currentId || !$container || $container.closest('body').length === 0) {
      console.info('[状态栏] 自查发现需要重新挂载', { latestId, currentId });
      mountToLatestMessage();
    }
  }, SELF_CHECK_INTERVAL);

  // 关闭脚本时卸载
  $(window).on('pagehide', () => {
    clearInterval(selfCheckTimer);
    if (app) {
      app.unmount();
      app = null;
    }
    if ($container) {
      $container.remove();
      $container = null;
    }
    cleanupImmersive();
    destroy();
  });
});
