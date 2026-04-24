import { createScriptIdDiv, teleportStyle, reloadOnChatChange } from '@util/script';
import App from './App.vue';

/**
 * 隐藏聊天楼层中 <iphone> 标签的内容
 * 酒馆会将 <iphone> 保留为真正的 DOM 元素，因此直接用 CSS 隐藏即可
 */
function setupIphoneTagHiding(): { destroy: () => void } {
  const STYLE_ID = 'yubing-phone-hide-iphone-tags';

  // 注入全局隐藏样式到酒馆网页
  // <iphone> 在 DOM 中是一个真实的自定义元素，直接用标签选择器隐藏
  const $style = $(`<style id="${STYLE_ID}">
    #chat .mes .mes_text iphone { display: none !important; }
  </style>`).appendTo($(document.head));

  return {
    destroy: () => {
      $style.remove();
    },
  };
}

$(async () => {
  const app = createApp(App).use(createPinia());

  // 挂载到酒馆网页 DOM 上（非 iframe），使用 teleportStyle 复制样式
  const $app = createScriptIdDiv().appendTo('body');
  const { destroy } = teleportStyle();
  app.mount($app[0]);

  // 设置隐藏 <iphone> 标签的逻辑
  const iphoneHider = setupIphoneTagHiding();

  // 初始化 phone store，加载数据
  const { usePhoneStore } = await import('./store');
  const store = usePhoneStore();
  await store.initialize();

  // 初始化 music store，加载歌单
  const { useMusicStore } = await import('./music-store');
  const musicStore = useMusicStore();
  musicStore.loadPrefs();

  // 监听新消息事件，自动增量扫描
  const messageReceivedHandler = eventOn(tavern_events.MESSAGE_RECEIVED, () => {
    store.scanNewMessages();
  });

  // 消息被编辑时重新全量扫描（用户手动编辑楼层内容）
  const messageEditedHandler = eventOn(tavern_events.MESSAGE_EDITED, () => {
    store.scanAllMessages();
  });

  // 消息被滑动切换时重新全量扫描（用户重新 ROLL / swipe）
  const messageSwipedHandler = eventOn(tavern_events.MESSAGE_SWIPED, () => {
    store.scanAllMessages();
  });

  // 消息被删除时重新全量扫描
  const messageDeletedHandler = eventOn(tavern_events.MESSAGE_DELETED, () => {
    store.scanAllMessages();
  });

  // 消息内容更新时重新全量扫描
  const messageUpdatedHandler = eventOn(tavern_events.MESSAGE_UPDATED, () => {
    store.scanAllMessages();
  });

  // 定时轮询兜底（每 10 秒）
  const pollInterval = setInterval(() => {
    store.scanNewMessages();
  }, 10000);

  // 定时同步到世界书（每 30 秒）
  const syncInterval = setInterval(() => {
    if (store.contacts.length > 0) {
      store.syncAllToWorldbook();
    }
  }, 30000);

  // 聊天切换时重新加载
  const chatChangeHandler = reloadOnChatChange();

  // 卸载
  $(window).on('pagehide', () => {
    // 卸载前同步一次世界书
    if (store.contacts.length > 0) {
      store.syncAllToWorldbook();
    }

    // 清理音乐播放器
    musicStore.destroy();

    // 清理 iphone 标签隐藏
    iphoneHider.destroy();

    app.unmount();
    $app.remove();
    destroy();
    messageReceivedHandler.stop();
    messageEditedHandler.stop();
    messageSwipedHandler.stop();
    messageDeletedHandler.stop();
    messageUpdatedHandler.stop();
    chatChangeHandler.stop();
    clearInterval(pollInterval);
    clearInterval(syncInterval);
  });

  console.info('[小手机] 脚本已加载');
});
