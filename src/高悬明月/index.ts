/**
 * 高悬明月
 *
 * 通用0层视觉锁定脚本：
 * - 保留真实聊天楼层作为上下文
 * - 视觉上隐藏0层以外的楼层
 * - 将最新楼层镜像到0层显示，并让显示正则照常生效
 */
import { createScriptIdDiv, teleportStyle } from '@util/script';
import App from './App.vue';
import { createZeroLockController } from './core/zeroLock';
import { useZeroStore } from './stores/zeroStore';

$(() => {
  const pinia = createPinia();
  const store = useZeroStore(pinia);
  const controller = createZeroLockController(store);

  const app = createApp(App).use(pinia);
  app.provide('gxmy_controller', controller);

  const $app = createScriptIdDiv()
    .addClass('gxmy-host')
    .css({
      position: 'fixed',
      left: '0',
      top: '0',
      width: '0',
      height: '0',
      overflow: 'visible',
      pointerEvents: 'none',
    })
    .appendTo('body');
  const { destroy } = teleportStyle();
  app.mount($app[0]);

  (window.parent as any).gxmyEmergencyDisable = () => {
    controller.dispose();
    app.unmount();
    $app.remove();
    destroy();
    console.info('[高悬明月] 已应急卸载');
  };

  appendInexistentScriptButtons([
    { name: '高悬明月同步', visible: true },
    { name: '高悬明月显隐', visible: true },
  ]);

  eventOn(getButtonEvent('高悬明月同步'), () => {
    void controller.mirrorNow('脚本按钮同步');
  });

  eventOn(getButtonEvent('高悬明月显隐'), () => {
    controller.toggleRevealLatest();
  });

  $(window).on('pagehide', () => {
    controller.dispose();
    app.unmount();
    $app.remove();
    destroy();
    delete (window.parent as any).gxmyEmergencyDisable;
  });

  console.info('[高悬明月] 脚本已加载');
});
