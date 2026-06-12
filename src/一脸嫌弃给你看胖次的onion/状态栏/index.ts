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
    if (app) {
      app.unmount();
      app = null;
    }
    if ($container) {
      $container.remove();
      $container = null;
    }

    const $messages = $('#chat .mes:not([is_user="true"])');
    if ($messages.length === 0) return;

    const $lastAiMsg = $messages.last();
    const $mesBlock = $lastAiMsg.find('.mes_block');
    if ($mesBlock.length === 0) return;

    $container = createScriptIdDiv()
      .css({
        width: '100%',
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '8px 4px 4px 4px',
      })
      .appendTo($mesBlock);

    app = createApp(App).use(createPinia());
    app.mount($container[0]);

    console.info('[onion状态栏] 已挂载到楼层', $lastAiMsg.attr('mesid'));
  }

  // 初始挂载
  mountToLatestMessage();

  // 监听消息事件，重新挂载到最新楼层
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

  // 定时自查
  const selfCheckTimer = setInterval(() => {
    if (isImmersiveActive()) return;
    const latestId = getLatestAiMesId();
    const currentId = getCurrentMountedMesId();
    if (latestId !== currentId || !$container || $container.closest('body').length === 0) {
      console.info('[onion状态栏] 自查重新挂载');
      mountToLatestMessage();
    }
  }, 3000);

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
