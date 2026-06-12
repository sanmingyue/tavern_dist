import { DEFAULT_DIFFICULTY_ID, DIFFICULTY_DEFINITIONS } from './data/difficulty';
import { CORE_STATIC_SEED_PACK } from './data/staticSeed';
import {
  autoAdvanceBattle,
  createBattleState,
  finalizeBattleResult,
  findUnit,
  getAliveUnits,
  getLegalTargets,
  getReadyActor,
  resolveBattleCommand,
  tickBattleState,
  validateBattleCommand,
} from './engine/combatAtb';
import {
  addEconomyResources,
  addEconomyResourcePatch,
  assignEconomyStaff,
  canAffordEconomy,
  ECONOMY_RESOURCE_IDS,
  EMPTY_ECONOMY_RESOURCES,
  mergeEconomyResources,
  removeEconomyBusiness,
  settleAllEconomyBusinesses,
  settleBusiness,
  settleEconomyBusiness,
  spendEconomyResources,
  transferEconomyResourcesToStrategy,
  unassignEconomyStaff,
  upsertEconomyBusiness,
} from './engine/economy';
import { appendCharacterMemory, getCharacterMemoryText, setCharacterMemory } from './engine/characterMemory';
import {
  discoverFixedCharacter,
  getFixedCharactersAtLocation,
  markFixedCharacterRuntimeNote,
  moveFixedCharacter,
  queryFixedCharacters,
  rebuildNpcLocationIndex,
  upsertFixedCharacter,
} from './engine/characters';
import { buildDialoguePlan, getAllowedSpeakerIds } from './engine/dialogue';
import {
  activateWorldEvent,
  generateWorldEvents,
  resolveWorldEvent,
  upsertEventTemplate,
} from './engine/events';
import {
  executeTravelPlan,
  getReachableLocations,
  markLocationVisited,
  planTravel,
  storeTravelPlan,
  upsertMapLocation,
  upsertMapRoute,
} from './engine/map';
import {
  admitHaremMember,
  endHaremCgMode,
  getHaremAvailableActions,
  listFemaleRoster,
  recordAffectionInteraction,
  recordHaremBoundaryPlaceholder,
  recordHaremInteraction,
  registerFemaleRosterEntry,
  setHaremRank,
  startHaremCgMode,
} from './engine/intimacy';
import {
  decideAndStoreNarrativeMode,
  decideNarrativeMode,
  parseAndStoreUserInput,
  parseNarrativeUserInput,
  setNarrativeOutputMode,
  setNarrativeSceneCategory,
  validateNarrativeOutputBlocks,
} from './engine/narrative';
import { acceptQuest, advanceQuest, getQuestEvidenceIds, recordQuestEvidence, upsertQuestDefinition } from './engine/quest';
import { adjustFactionRelation, adjustNpcRelation, adjustWorldReputation } from './engine/relation';
import { closeScene, getActiveScene, requireScene, setScenePresence, startScene } from './engine/scene';
import { applyStaticSeedPack, buildSeedReportSummary } from './engine/staticSeed';
import {
  addResources,
  canAfford,
  createStrategyCampaign,
  EMPTY_STRATEGY_RESOURCES,
  enqueueStrategyOrder,
  mergeResources,
  resolveStrategyOrder,
  resolveStrategyTurn,
  spendResources,
  STRATEGY_RESOURCE_IDS,
} from './engine/strategy';
import { buildAiIndexBundle, buildAiIndexText } from './services/aiIndexBuilder';
import { dispatchWorldAction, dispatchWorldActionWithoutSaving } from './services/actionService';
import {
  buildAuthoritativeStateSummary,
  buildFormulaScanText,
  clearWorldContext,
  injectWorldContext,
  selectFormulaResourceIds,
} from './services/contextBuilder';
import {
  copySlot,
  createSlot,
  deleteSlot,
  exportSlot,
  getActiveSlotId,
  importSlot,
  listSlots,
  loadActiveSlot,
  loadIndex,
  loadPrologueSkipUnlock,
  loadSettings,
  loadSlot,
  previewImport,
  rebuildIndex,
  saveSlot,
  setActiveSlotId,
  writeSettings,
} from './storage/localStorageAdapter';
import { GUFENG_SCRIPT_VERSION, type GameSave, type SaveSlotId } from './types/schema';
import type { GameAction } from './types/actions';
import type { StaticSeedApplyOptions } from './types/staticSeed';

type GufengWorldApi = {
  version: string;
  difficultyDefinitions: typeof DIFFICULTY_DEFINITIONS;
  defaultDifficultyId: typeof DEFAULT_DIFFICULTY_ID;
  slots: {
    list: typeof listSlots;
    load: typeof loadSlot;
    create: typeof createSlot;
    save: typeof saveSlot;
    delete: typeof deleteSlot;
    copy: typeof copySlot;
    export: typeof exportSlot;
    import: typeof importSlot;
    previewImport: typeof previewImport;
    rebuildIndex: typeof rebuildIndex;
    loadIndex: typeof loadIndex;
  };
  active: {
    getSlotId: typeof getActiveSlotId;
    setSlotId: typeof setActiveSlotId;
    load: typeof loadActiveSlot;
  };
  settings: {
    load: typeof loadSettings;
    write: typeof writeSettings;
    prologueSkip: typeof loadPrologueSkipUnlock;
  };
  action: {
    dispatch: (action: GameAction, save?: GameSave) => ReturnType<typeof dispatchWorldAction>;
    dispatchWithoutSaving: typeof dispatchWorldActionWithoutSaving;
  };
  combatAtb: {
    createBattleState: typeof createBattleState;
    tick: typeof tickBattleState;
    getReadyActor: typeof getReadyActor;
    getLegalTargets: typeof getLegalTargets;
    validateCommand: typeof validateBattleCommand;
    resolveCommand: typeof resolveBattleCommand;
    autoAdvance: typeof autoAdvanceBattle;
    finalizeResult: typeof finalizeBattleResult;
    findUnit: typeof findUnit;
    getAliveUnits: typeof getAliveUnits;
  };
  economy: {
    resourceIds: typeof ECONOMY_RESOURCE_IDS;
    createEmptyResources: () => typeof EMPTY_ECONOMY_RESOURCES;
    upsertBusiness: typeof upsertEconomyBusiness;
    removeBusiness: typeof removeEconomyBusiness;
    assignStaff: typeof assignEconomyStaff;
    unassignStaff: typeof unassignEconomyStaff;
    settleBusiness: typeof settleBusiness;
    settleBusinessState: typeof settleEconomyBusiness;
    settleAllBusinesses: typeof settleAllEconomyBusinesses;
    addResourcePatch: typeof addEconomyResourcePatch;
    transferToStrategy: typeof transferEconomyResourcesToStrategy;
    mergeResources: typeof mergeEconomyResources;
    canAfford: typeof canAffordEconomy;
    spendResources: typeof spendEconomyResources;
    addResources: typeof addEconomyResources;
  };
  map: {
    upsertLocation: typeof upsertMapLocation;
    upsertRoute: typeof upsertMapRoute;
    planTravel: typeof planTravel;
    storeTravelPlan: typeof storeTravelPlan;
    executeTravelPlan: typeof executeTravelPlan;
    markVisited: typeof markLocationVisited;
    getReachable: typeof getReachableLocations;
  };
  characters: {
    upsertFixed: typeof upsertFixedCharacter;
    moveFixed: typeof moveFixedCharacter;
    discoverFixed: typeof discoverFixedCharacter;
    queryFixed: typeof queryFixedCharacters;
    getAtLocation: typeof getFixedCharactersAtLocation;
    rebuildIndex: typeof rebuildNpcLocationIndex;
    setRuntimeNote: typeof markFixedCharacterRuntimeNote;
  };
  scene: {
    start: typeof startScene;
    close: typeof closeScene;
    setPresence: typeof setScenePresence;
    getActive: typeof getActiveScene;
    require: typeof requireScene;
  };
  quest: {
    upsertDefinition: typeof upsertQuestDefinition;
    accept: typeof acceptQuest;
    advance: typeof advanceQuest;
    recordEvidence: typeof recordQuestEvidence;
    getEvidenceIds: typeof getQuestEvidenceIds;
  };
  relation: {
    adjustNpc: typeof adjustNpcRelation;
    adjustFaction: typeof adjustFactionRelation;
    adjustReputation: typeof adjustWorldReputation;
  };
  dialogue: {
    buildPlan: typeof buildDialoguePlan;
    getAllowedSpeakerIds: typeof getAllowedSpeakerIds;
  };
  events: {
    upsertTemplate: typeof upsertEventTemplate;
    generate: typeof generateWorldEvents;
    activate: typeof activateWorldEvent;
    resolve: typeof resolveWorldEvent;
  };
  staticSeed: {
    corePack: typeof CORE_STATIC_SEED_PACK;
    applyPack: typeof applyStaticSeedPack;
    applyCorePack: (save: GameSave, options?: StaticSeedApplyOptions) => ReturnType<typeof applyStaticSeedPack>;
    buildReportSummary: typeof buildSeedReportSummary;
  };
  characterMemory: {
    set: typeof setCharacterMemory;
    append: typeof appendCharacterMemory;
    getText: typeof getCharacterMemoryText;
  };
  aiIndex: {
    buildBundle: typeof buildAiIndexBundle;
    buildText: typeof buildAiIndexText;
  };
  intimacy: {
    registerRoster: typeof registerFemaleRosterEntry;
    listRoster: typeof listFemaleRoster;
    recordAffection: typeof recordAffectionInteraction;
    admitHarem: typeof admitHaremMember;
    setRank: typeof setHaremRank;
    recordHaremInteraction: typeof recordHaremInteraction;
    startCgMode: typeof startHaremCgMode;
    endCgMode: typeof endHaremCgMode;
    recordBoundaryPlaceholder: typeof recordHaremBoundaryPlaceholder;
    getAvailableActions: typeof getHaremAvailableActions;
  };
  narrative: {
    setOutputMode: typeof setNarrativeOutputMode;
    setSceneCategory: typeof setNarrativeSceneCategory;
    parseUserInput: typeof parseNarrativeUserInput;
    parseAndStoreUserInput: typeof parseAndStoreUserInput;
    decideMode: typeof decideNarrativeMode;
    decideAndStoreMode: typeof decideAndStoreNarrativeMode;
    validateOutputBlocks: typeof validateNarrativeOutputBlocks;
  };
  strategy: {
    resourceIds: typeof STRATEGY_RESOURCE_IDS;
    createEmptyResources: () => typeof EMPTY_STRATEGY_RESOURCES;
    createCampaign: typeof createStrategyCampaign;
    enqueueOrder: typeof enqueueStrategyOrder;
    resolveOrder: typeof resolveStrategyOrder;
    resolveTurn: typeof resolveStrategyTurn;
    mergeResources: typeof mergeResources;
    canAfford: typeof canAfford;
    spendResources: typeof spendResources;
    addResources: typeof addResources;
  };
  context: {
    buildState: typeof buildAuthoritativeStateSummary;
    buildScan: typeof buildFormulaScanText;
    selectFormulaIds: typeof selectFormulaResourceIds;
    inject: typeof injectWorldContext;
    clear: typeof clearWorldContext;
  };
  openSlot: (slotId: SaveSlotId) => GameSave;
};

declare global {
  interface Window {
    GufengWorld?: GufengWorldApi;
    __gufengWorldCoreMounted?: boolean;
  }
}

function installApi(): GufengWorldApi {
  const api: GufengWorldApi = {
    version: GUFENG_SCRIPT_VERSION,
    difficultyDefinitions: DIFFICULTY_DEFINITIONS,
    defaultDifficultyId: DEFAULT_DIFFICULTY_ID,
    slots: {
      list: listSlots,
      load: loadSlot,
      create: createSlot,
      save: saveSlot,
      delete: deleteSlot,
      copy: copySlot,
      export: exportSlot,
      import: importSlot,
      previewImport,
      rebuildIndex,
      loadIndex,
    },
    active: {
      getSlotId: getActiveSlotId,
      setSlotId: setActiveSlotId,
      load: loadActiveSlot,
    },
    settings: {
      load: loadSettings,
      write: writeSettings,
      prologueSkip: loadPrologueSkipUnlock,
    },
    action: {
      dispatch: dispatchWorldAction,
      dispatchWithoutSaving: dispatchWorldActionWithoutSaving,
    },
    combatAtb: {
      createBattleState,
      tick: tickBattleState,
      getReadyActor,
      getLegalTargets,
      validateCommand: validateBattleCommand,
      resolveCommand: resolveBattleCommand,
      autoAdvance: autoAdvanceBattle,
      finalizeResult: finalizeBattleResult,
      findUnit,
      getAliveUnits,
    },
    economy: {
      resourceIds: [...ECONOMY_RESOURCE_IDS],
      createEmptyResources: () => ({ ...EMPTY_ECONOMY_RESOURCES }),
      upsertBusiness: upsertEconomyBusiness,
      removeBusiness: removeEconomyBusiness,
      assignStaff: assignEconomyStaff,
      unassignStaff: unassignEconomyStaff,
      settleBusiness,
      settleBusinessState: settleEconomyBusiness,
      settleAllBusinesses: settleAllEconomyBusinesses,
      addResourcePatch: addEconomyResourcePatch,
      transferToStrategy: transferEconomyResourcesToStrategy,
      mergeResources: mergeEconomyResources,
      canAfford: canAffordEconomy,
      spendResources: spendEconomyResources,
      addResources: addEconomyResources,
    },
    map: {
      upsertLocation: upsertMapLocation,
      upsertRoute: upsertMapRoute,
      planTravel,
      storeTravelPlan,
      executeTravelPlan,
      markVisited: markLocationVisited,
      getReachable: getReachableLocations,
    },
    characters: {
      upsertFixed: upsertFixedCharacter,
      moveFixed: moveFixedCharacter,
      discoverFixed: discoverFixedCharacter,
      queryFixed: queryFixedCharacters,
      getAtLocation: getFixedCharactersAtLocation,
      rebuildIndex: rebuildNpcLocationIndex,
      setRuntimeNote: markFixedCharacterRuntimeNote,
    },
    scene: {
      start: startScene,
      close: closeScene,
      setPresence: setScenePresence,
      getActive: getActiveScene,
      require: requireScene,
    },
    quest: {
      upsertDefinition: upsertQuestDefinition,
      accept: acceptQuest,
      advance: advanceQuest,
      recordEvidence: recordQuestEvidence,
      getEvidenceIds: getQuestEvidenceIds,
    },
    relation: {
      adjustNpc: adjustNpcRelation,
      adjustFaction: adjustFactionRelation,
      adjustReputation: adjustWorldReputation,
    },
    dialogue: {
      buildPlan: buildDialoguePlan,
      getAllowedSpeakerIds,
    },
    events: {
      upsertTemplate: upsertEventTemplate,
      generate: generateWorldEvents,
      activate: activateWorldEvent,
      resolve: resolveWorldEvent,
    },
    staticSeed: {
      corePack: CORE_STATIC_SEED_PACK,
      applyPack: applyStaticSeedPack,
      applyCorePack: (save: GameSave, options?: StaticSeedApplyOptions) => applyStaticSeedPack(save, CORE_STATIC_SEED_PACK, options),
      buildReportSummary: buildSeedReportSummary,
    },
    characterMemory: {
      set: setCharacterMemory,
      append: appendCharacterMemory,
      getText: getCharacterMemoryText,
    },
    aiIndex: {
      buildBundle: buildAiIndexBundle,
      buildText: buildAiIndexText,
    },
    intimacy: {
      registerRoster: registerFemaleRosterEntry,
      listRoster: listFemaleRoster,
      recordAffection: recordAffectionInteraction,
      admitHarem: admitHaremMember,
      setRank: setHaremRank,
      recordHaremInteraction,
      startCgMode: startHaremCgMode,
      endCgMode: endHaremCgMode,
      recordBoundaryPlaceholder: recordHaremBoundaryPlaceholder,
      getAvailableActions: getHaremAvailableActions,
    },
    narrative: {
      setOutputMode: setNarrativeOutputMode,
      setSceneCategory: setNarrativeSceneCategory,
      parseUserInput: parseNarrativeUserInput,
      parseAndStoreUserInput: parseAndStoreUserInput,
      decideMode: decideNarrativeMode,
      decideAndStoreMode: decideAndStoreNarrativeMode,
      validateOutputBlocks: validateNarrativeOutputBlocks,
    },
    strategy: {
      resourceIds: [...STRATEGY_RESOURCE_IDS],
      createEmptyResources: () => ({ ...EMPTY_STRATEGY_RESOURCES }),
      createCampaign: createStrategyCampaign,
      enqueueOrder: enqueueStrategyOrder,
      resolveOrder: resolveStrategyOrder,
      resolveTurn: resolveStrategyTurn,
      mergeResources,
      canAfford,
      spendResources,
      addResources,
    },
    context: {
      buildState: buildAuthoritativeStateSummary,
      buildScan: buildFormulaScanText,
      selectFormulaIds: selectFormulaResourceIds,
      inject: injectWorldContext,
      clear: clearWorldContext,
    },
    openSlot: (slotId: SaveSlotId) => {
      const existing = loadSlot(slotId);
      const save = existing ? saveSlot(existing) : createSlot(slotId);
      setActiveSlotId(slotId);
      return save;
    },
  };

  window.GufengWorld = api;
  window.parent.GufengWorld = api;
  return api;
}

function init(): void {
  if (window.parent.__gufengWorldCoreMounted) {
    installApi();
    console.info('[古风大世界] 已存在运行实例，刷新 API 引用');
    return;
  }

  window.parent.__gufengWorldCoreMounted = true;
  installApi();
  rebuildIndex();
  loadSettings();

  $(window).on('pagehide', () => {
    clearWorldContext();
    window.parent.__gufengWorldCoreMounted = false;
  });

  console.info('[古风大世界] 大世界核心脚本已加载');
}

$(() => {
  try {
    init();
  } catch (error) {
    window.parent.__gufengWorldCoreMounted = false;
    console.error('[古风大世界] 初始化失败:', error);
    toastr.error(error instanceof Error ? error.message : String(error), '古风大世界脚本');
  }
});
