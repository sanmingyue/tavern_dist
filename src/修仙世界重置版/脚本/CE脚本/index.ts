import { createScriptIdDiv, teleportStyle, reloadOnChatChange } from '@util/script';
import App from './App.vue';

$(async () => {
  await waitGlobalInitialized('Mvu');

  const app = createApp(App).use(createPinia());

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
});
