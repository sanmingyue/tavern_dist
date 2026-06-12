import { getDifficultyDefinition } from '../data/difficulty';
import {
  GUFENG_CONTENT_VERSION,
  GUFENG_SCHEMA_VERSION,
  GameSaveSchema,
  type GameSave,
  type OpeningGameStage,
  type SaveLogEntry,
  type SaveSlotId,
  type SaveSlotSummary,
} from '../types/schema';

export const SAVE_SLOT_IDS: SaveSlotId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const STAGE_NAMES: Record<OpeningGameStage | '', string> = {
  '': '',
  DifficultySelection: '选择难度',
  CharacterCreation: '创建角色',
  OpeningPrologue: '入世开场',
  WorldMap: '大世界',
};

export function nowIso(): string {
  return new Date().toISOString();
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replaceAll('-', '').slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
  return `${prefix}_${Date.now()}_${random}`;
}

export function getStageName(stage: OpeningGameStage | ''): string {
  return STAGE_NAMES[stage];
}

export function createEmptySlotSummary(slotId: SaveSlotId): SaveSlotSummary {
  return {
    slotId,
    exists: false,
    schemaVersion: GUFENG_SCHEMA_VERSION,
    saveId: '',
    displayName: `空槽 ${slotId}`,
    characterName: '',
    gameStage: '',
    gameStageName: '',
    difficultyId: '',
    difficultyName: '',
    createdAt: '',
    savedAt: '',
    playTimeSeconds: 0,
    warningCount: 0,
  };
}

export function createEmptySlotSummaries(): SaveSlotSummary[] {
  return SAVE_SLOT_IDS.map(createEmptySlotSummary);
}

export function createInitialSave(slotId: SaveSlotId, at = nowIso()): GameSave {
  const saveId = createId(`save${slotId}`);
  const playerId = createId('player');
  const save: GameSave = {
    meta: {
      schemaVersion: GUFENG_SCHEMA_VERSION,
      contentVersion: GUFENG_CONTENT_VERSION,
      saveId,
      slotId,
      createdAt: at,
      savedAt: at,
      playTimeSeconds: 0,
      copiedFromSaveId: null,
      importedFrom: null,
    },
    flow: {
      gameStage: 'DifficultySelection',
      enteredStageAt: at,
      previousStage: null,
      canReturnBeforePrologue: true,
    },
    opening: {
      difficultyId: '',
      difficultyName: '',
      difficultyPayload: {},
      legacyNpcPopulation: '',
      prologueCompleted: false,
      prologueCompletedAt: null,
      prologueSkipped: false,
    },
    player: {
      playerId,
      profile: {
        name: '',
        gender: '',
        avatarId: '',
        characterFullbodyIndex: 0,
        origin: '',
        spiritRoot: '',
        pathFocus: '',
        temperament: '',
      },
      location: {
        currentLocationId: 'jiangnan_qiantang',
        previousLocationId: null,
      },
      status: {},
      attributes: {},
      flags: {},
    },
    world: {
      time: {
        day: 1,
        hour: 8,
        minute: 0,
        calendarText: '大夏某年 春 正月初一 辰时',
      },
      currentRegionId: 'daxia_jiangnan',
      discoveredLocationIds: ['jiangnan_qiantang'],
      unlockedLocationIds: ['jiangnan_qiantang'],
      locationStates: {
        jiangnan_qiantang: {
          visited: true,
          discoveredAt: at,
          lastVisitedAt: at,
          stateFlags: {},
        },
      },
      mapLocations: {
        jiangnan_qiantang: {
          locationId: 'jiangnan_qiantang',
          name: '钱塘',
          regionId: 'daxia_jiangnan',
          countryId: 'daxia',
          parentLocationId: '',
          kind: 'city',
          unlocked: true,
          discovered: true,
          tags: ['jiangnan', 'opening'],
          formulaResourceIds: [],
          state: {},
        },
      },
      mapRoutes: {},
      lastTravelPlan: null,
      worldFlags: {},
      eventFlags: {},
      reputation: {},
      wanted: {
        level: 0,
        reason: '',
        spreadRegionIds: [],
        updatedAt: null,
      },
    },
    npcs: {
      fixedNpcProfiles: {},
      fixedNpcStates: {},
      generatedNpcProfiles: {},
      generatedNpcStates: {},
      npcIndex: {
        byLocationId: {},
        byFactionId: {},
        byTag: {},
      },
    },
    relationship: {
      npcRelations: {},
      factionRelations: {},
      recentChanges: [],
    },
    inventory: {
      currencies: { 银两: 0 },
      itemStacks: {},
      equipped: {},
      containers: {},
    },
    collection: {
      beauties: {},
      masters: {},
      albums: {},
    },
    intimacy: {
      roster: {},
      haremMembers: {},
      interactions: {},
      recentInteractionIds: [],
      cgScenes: {},
      activeCgSceneId: null,
      boundaryPlaceholders: {},
    },
    economy: {
      assets: {},
      businesses: {},
      pendingIncome: {},
      resources: {
        silver: 0,
        grain: 0,
        arms: 0,
        horses: 0,
        manpower: 0,
        intel: 0,
        medicine: 0,
      },
      assignments: {},
      recentReports: [],
      lastSettledAt: null,
    },
    combat: {
      activeBattle: null,
      recentBattleReports: [],
      cooldowns: {},
    },
    strategy: {
      activeCampaignId: null,
      resources: {
        silver: 0,
        grain: 0,
        arms: 0,
        horses: 0,
        manpower: 0,
        intel: 0,
        medicine: 0,
      },
      campaigns: {},
      lastResolvedAt: null,
    },
    scene: {
      activeSceneId: null,
      scenes: {},
      recentSceneIds: [],
    },
    quests: {
      definitions: {},
      evidence: {},
      active: {},
      completed: {},
      failed: {},
      questFlags: {},
    },
    events: {
      templates: {},
      active: {},
      resolved: {},
      recentEventIds: [],
    },
    memory: {
      globalSummary: '',
      recentSummary: '',
      npcMemory: {},
      playerBehaviorProfile: {},
      memoryIndex: {},
    },
    narrative: {
      tavernChatId: null,
      firstBoundMessageId: null,
      latestProcessedMessageId: null,
      lastSceneSummary: '',
      outputMode: 'auto',
      currentSceneCategory: 'free',
      currentSceneTags: [],
      lastEffectiveOutputMode: 'classic_airp',
      lastInputParse: null,
      lastModeDecision: null,
      outputRulesVersion: 'narrative-category-v1',
      pendingNarration: null,
    },
    dialogue: {
      lastPlan: null,
      recentPlans: [],
    },
    logs: {
      actionLog: [],
      systemLog: [],
      maxEntries: 200,
    },
    maintenance: {
      migrationsApplied: [],
      warnings: [],
      lastHealthCheckAt: null,
      repairHistory: [],
    },
  };
  return GameSaveSchema.parse(save);
}

export function summarizeSave(save: GameSave): SaveSlotSummary {
  const difficultyName =
    save.opening.difficultyId === '' ? '' : getDifficultyDefinition(save.opening.difficultyId).name;
  const characterName = save.player.profile.name;
  return {
    slotId: save.meta.slotId,
    exists: true,
    schemaVersion: GUFENG_SCHEMA_VERSION,
    saveId: save.meta.saveId,
    displayName: characterName || `存档 ${save.meta.slotId}`,
    characterName,
    gameStage: save.flow.gameStage,
    gameStageName: getStageName(save.flow.gameStage),
    difficultyId: save.opening.difficultyId,
    difficultyName: save.opening.difficultyName || difficultyName,
    createdAt: save.meta.createdAt,
    savedAt: save.meta.savedAt,
    playTimeSeconds: save.meta.playTimeSeconds,
    warningCount: save.maintenance.warnings.filter(warning => !warning.resolved).length,
  };
}

export function pushSaveLog(
  save: GameSave,
  type: string,
  summary: string,
  success = true,
  relatedIds: string[] = [],
): SaveLogEntry {
  const entry: SaveLogEntry = {
    logId: createId('log'),
    at: nowIso(),
    type,
    slotId: save.meta.slotId,
    success,
    summary,
    relatedIds,
  };
  save.logs.actionLog.push(entry);
  if (save.logs.actionLog.length > save.logs.maxEntries) {
    save.logs.actionLog.splice(0, save.logs.actionLog.length - save.logs.maxEntries);
  }
  return entry;
}
