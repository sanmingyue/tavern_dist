import { createScriptIdDiv, reloadOnChatChange, teleportStyle } from '@util/script';
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import { z } from 'zod';
import '../小手机/澜景市版';
import App from './App.vue';
import { registerRuntimeLocations, type LocationNode } from './data/locations';
import { dispatchGameAction } from './services/actionService';
import { getCheckpointStats, rollbackLatestCheckpoint, rollbackToCheckpoint, type RollbackCheckpointOptions } from './services/checkpointService';
import { syncPhoneActions, syncPhoneContacts } from './services/phoneSync';
import { applyLanjingTags, parseLanjingTags } from './services/tagParser';
import { buildScanText, buildSituationSummary, clearLanjingContext, injectLanjingContext } from './services/worldbookRouter';
import { ensureSave, loadSave, resetSave, writeSave } from './services/saveService';
import { GameSaveSchema, LANJING_SAVE_KEY, LANJING_SCRIPT_VERSION } from './types/schema';
import { installLanjingZhino, type LanjingZhinoController } from './内置智脑';
import type { GameAction } from './types/actions';
import type { GameSave } from './types/schema';

type LanjingApi = {
  version: string;
  loadSave: typeof loadSave;
  ensureSave: typeof ensureSave;
  writeSave: typeof writeSave;
  resetSave: typeof resetSave;
  dispatchAction: (action: GameAction, save?: GameSave) => ReturnType<typeof dispatchGameAction>;
  checkpoints: {
    stats: typeof getCheckpointStats;
    rollbackLatest: typeof rollbackLatestCheckpoint;
    rollbackTo: (options: RollbackCheckpointOptions) => ReturnType<typeof rollbackToCheckpoint>;
  };
  parseTags: typeof parseLanjingTags;
  applyTags: typeof applyLanjingTags;
  syncPhoneActions: typeof syncPhoneActions;
  syncPhoneContacts: typeof syncPhoneContacts;
  registerLocations: (locations: LocationNode[], replace?: boolean) => void;
  buildScanText: typeof buildScanText;
  buildSituationSummary: typeof buildSituationSummary;
  injectContext: typeof injectLanjingContext;
  installZhino: (options?: { openPanel?: boolean }) => LanjingZhinoController;
};

declare global {
  interface Window {
    LanjingCity?: LanjingApi;
    __lanjingCityMounted?: boolean;
  }
}

function installApi(): void {
  const api: LanjingApi = {
    version: LANJING_SCRIPT_VERSION,
    loadSave,
    ensureSave,
    writeSave,
    resetSave,
    dispatchAction: (action, save = ensureSave()) => {
      return dispatchGameAction(save, action);
    },
    checkpoints: {
      stats: getCheckpointStats,
      rollbackLatest: rollbackLatestCheckpoint,
      rollbackTo: rollbackToCheckpoint,
    },
    parseTags: parseLanjingTags,
    applyTags: applyLanjingTags,
    syncPhoneActions,
    syncPhoneContacts,
    registerLocations: registerRuntimeLocations,
    buildScanText,
    buildSituationSummary,
    injectContext: injectLanjingContext,
    installZhino: installLanjingZhino,
  };
  window.LanjingCity = api;
  window.parent.LanjingCity = api;
}

function registerSchema(): void {
  registerVariableSchema(
    z.object({
      [LANJING_SAVE_KEY]: GameSaveSchema.optional(),
      澜景市回滚点: z.any().optional(),
    }),
    { type: 'chat' },
  );
}

function init(): void {
  if (window.parent.__lanjingCityMounted) {
    console.info('[澜景市] 已存在运行实例，跳过重复挂载');
    installApi();
    return;
  }
  window.parent.__lanjingCityMounted = true;

  registerSchema();
  installApi();
  ensureSave();

  const app = createApp(App).use(createPinia());
  const $app = createScriptIdDiv().addClass('lanjing-city-app').appendTo('body');
  app.mount($app[0]);
  const { destroy } = teleportStyle();
  const chatChangeHandler = reloadOnChatChange();

  $(window).on('pagehide', () => {
    clearLanjingContext();
    app.unmount();
    $app.remove();
    destroy();
    chatChangeHandler.stop();
    window.parent.__lanjingCityMounted = false;
  });

  console.info('[澜景市] 前端脚本与规则接口已加载');
}

$(() => {
  try {
    init();
  } catch (error) {
    window.parent.__lanjingCityMounted = false;
    console.error('[澜景市] 初始化失败:', error);
    toastr.error(error instanceof Error ? error.message : String(error), '澜景市脚本');
  }
});
