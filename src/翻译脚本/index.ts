import { createScriptIdDiv, teleportStyle } from '@util/script';
import App from './App.vue';
import { registerEvents, unregisterEvents } from './events';
import { SCRIPT_NAME } from './types';
import './status-bar.css';

function init() {
  console.info(`[${SCRIPT_NAME}] 加载中...`);

  const app = createApp(App).use(createPinia());

  // 挂载到酒馆网页 body 上
  const $app = createScriptIdDiv().appendTo('body');
  const { destroy: destroyStyle } = teleportStyle();
  app.mount($app[0]);

  // 注册事件监听
  registerEvents();

  console.info(`[${SCRIPT_NAME}] 加载完成`);

  // 关闭脚本时卸载
  $(window).on('pagehide', () => {
    unregisterEvents();
    app.unmount();
    $app.remove();
    destroyStyle();
    console.info(`[${SCRIPT_NAME}] 已卸载`);
  });
}

$(() => {
  errorCatched(init)();
});
