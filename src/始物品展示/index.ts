import { createScriptIdDiv, teleportStyle, reloadOnChatChange } from '@util/script';
import App from './App.vue';

$(async () => {
  // 等待 MVU 变量框架初始化完成
  await waitGlobalInitialized('Mvu');

  const app = createApp(App).use(createPinia());

  // 挂载到酒馆网页 DOM 上（非 iframe），使用 teleportStyle 复制样式
  const $app = createScriptIdDiv().appendTo('body');
  const { destroy } = teleportStyle();
  app.mount($app[0]);

  const chatChangeHandler = reloadOnChatChange();

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
    chatChangeHandler.stop();
  });

  console.info('[脚本|始物品展示] 物品展示面板已加载');
});
