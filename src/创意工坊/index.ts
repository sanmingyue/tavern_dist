import { createScriptIdDiv, teleportStyle } from '@util/script';
import App from './App.vue';

$(() => {
  const app = createApp(App).use(createPinia());

  const $app = createScriptIdDiv().appendTo('body');
  const { destroy } = teleportStyle();
  app.mount($app[0]);

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
  });
});
