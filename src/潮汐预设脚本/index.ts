import { createScriptIdDiv, teleportStyle } from '@util/script';
import App from './App.vue';

$(() => {
  const app = createApp(App).use(createPinia());

  // 挂载到酒馆网页 body 上（非 iframe），使用 teleportStyle 复制样式
  const $app = createScriptIdDiv().appendTo('body');
  const { destroy } = teleportStyle();
  app.mount($app[0]);

  // 关闭脚本时卸载组件
  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
  });
});
