import { z } from 'zod';

export const GUFENG_SCHEMA_VERSION = 1;
export const GUFENG_CONTENT_VERSION = '2026-06-11';
export const GUFENG_SCRIPT_VERSION = '0.1.0';
export const SAVE_SLOT_COUNT = 9;

export const SaveSlotIdSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
]);

const GAME_STAGE_ALIASES: Record<string, string> = {
  DIFFICULTY_SELECT: 'DifficultySelection',
  CHARACTER_CREATE: 'CharacterCreation',
  OPENING_PROLOGUE: 'OpeningPrologue',
  WORLD_READY: 'WorldMap',
};

export const OpeningGameStageSchema = z.preprocess(
  value => (typeof value === 'string' ? GAME_STAGE_ALIASES[value] ?? value : value),
  z.enum(['DifficultySelection', 'CharacterCreation', 'OpeningPrologue', 'WorldMap']),
);

export const DifficultyIdSchema = z.enum(['story', 'normal', 'realistic', 'stray']);
export const DifficultyOrEmptySchema = z.union([DifficultyIdSchema, z.literal('')]);
export const StageOrEmptySchema = z.union([OpeningGameStageSchema, z.literal('')]);

export const RawRecordSchema = z.record(z.string(), z.unknown()).default({});
export const BooleanRecordSchema = z.record(z.string(), z.boolean()).default({});
export const StringArrayRecordSchema = z.record(z.string(), z.array(z.string())).default({});

export const SaveLogEntrySchema = z.object({
  logId: z.string(),
  at: z.string(),
  type: z.string(),
  slotId: SaveSlotIdSchema,
  success: z.boolean(),
  summary: z.string(),
  relatedIds: z.array(z.string()).default([]),
});

export const SaveWarningSchema = z.object({
  warningId: z.string(),
  at: z.string(),
  level: z.enum(['info', 'warning', 'error']),
  message: z.string(),
  resolved: z.boolean().default(false),
});

export const ImportedFromInfoSchema = z.object({
  importedAt: z.string(),
  originalSaveId: z.string(),
  originalSchemaVersion: z.number().int().nonnegative(),
});

export const SaveMetaSchema = z.object({
  schemaVersion: z.literal(GUFENG_SCHEMA_VERSION),
  contentVersion: z.string(),
  saveId: z.string(),
  slotId: SaveSlotIdSchema,
  createdAt: z.string(),
  savedAt: z.string(),
  playTimeSeconds: z.number().int().nonnegative().default(0),
  copiedFromSaveId: z.string().nullable().default(null),
  importedFrom: ImportedFromInfoSchema.nullable().default(null),
});

export const SaveFlowSchema = z.object({
  gameStage: OpeningGameStageSchema,
  enteredStageAt: z.string(),
  previousStage: OpeningGameStageSchema.nullable().default(null),
  canReturnBeforePrologue: z.boolean().default(true),
});

export const SaveOpeningSchema = z.object({
  difficultyId: DifficultyOrEmptySchema.default(''),
  difficultyName: z.string().default(''),
  difficultyPayload: z.record(z.string(), z.never()).default({}),
  legacyNpcPopulation: z.string().default(''),
  prologueCompleted: z.boolean().default(false),
  prologueCompletedAt: z.string().nullable().default(null),
  prologueSkipped: z.boolean().default(false),
});

export const PlayerSaveSchema = z.object({
  playerId: z.string(),
  profile: z.object({
    name: z.string().default(''),
    gender: z.string().default(''),
    avatarId: z.string().default(''),
    characterFullbodyIndex: z.number().int().nonnegative().default(0),
    origin: z.string().default(''),
    spiritRoot: z.string().default(''),
    pathFocus: z.string().default(''),
    temperament: z.string().default(''),
  }),
  location: z.object({
    currentLocationId: z.string().default('jiangnan_qiantang'),
    previousLocationId: z.string().nullable().default(null),
  }),
  status: RawRecordSchema,
  attributes: RawRecordSchema,
  flags: BooleanRecordSchema,
});

export const LocationRuntimeStateSchema = z.object({
  visited: z.boolean().default(false),
  discoveredAt: z.string().nullable().default(null),
  lastVisitedAt: z.string().nullable().default(null),
  stateFlags: BooleanRecordSchema,
});

export const MapLocationNodeSchema = z.object({
  locationId: z.string(),
  name: z.string(),
  regionId: z.string(),
  countryId: z.string().default(''),
  parentLocationId: z.string().default(''),
  kind: z.string().default('site'),
  unlocked: z.boolean().default(false),
  discovered: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  formulaResourceIds: z.array(z.string()).default([]),
  state: RawRecordSchema,
});

export const MapRouteNodeSchema = z.object({
  routeId: z.string(),
  fromLocationId: z.string(),
  toLocationId: z.string(),
  kind: z.string().default('road'),
  distanceLi: z.number().nonnegative().default(0),
  allowedModes: z.array(z.string()).default(['walk']),
  risk: z.number().min(0).max(100).default(0),
  blocked: z.boolean().default(false),
  unlockFlagIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const TravelPlanSchema = z.object({
  planId: z.string(),
  fromLocationId: z.string(),
  targetLocationId: z.string(),
  routeId: z.string().optional(),
  mode: z.string().default('walk'),
  distanceLi: z.number().nonnegative().default(0),
  minutes: z.number().int().nonnegative().default(0),
  risk: z.number().min(0).max(100).default(0),
  blocked: z.boolean().default(false),
  reason: z.string().default(''),
  summary: z.string(),
});

export const WorldTimeSchema = z.object({
  day: z.number().int().positive().default(1),
  hour: z.number().int().min(0).max(23).default(8),
  minute: z.number().int().min(0).max(59).default(0),
  calendarText: z.string().default('大夏某年 春 正月初一 辰时'),
});

export const WorldSaveSchema = z.object({
  time: WorldTimeSchema,
  currentRegionId: z.string().default('daxia_jiangnan'),
  discoveredLocationIds: z.array(z.string()).default(['jiangnan_qiantang']),
  unlockedLocationIds: z.array(z.string()).default(['jiangnan_qiantang']),
  locationStates: z.record(z.string(), LocationRuntimeStateSchema).default({}),
  mapLocations: z.record(z.string(), MapLocationNodeSchema).default({}),
  mapRoutes: z.record(z.string(), MapRouteNodeSchema).default({}),
  lastTravelPlan: TravelPlanSchema.nullable().default(null),
  worldFlags: BooleanRecordSchema,
  eventFlags: RawRecordSchema,
  reputation: z.record(z.string(), z.number()).default({}),
  wanted: z.object({
    level: z.number().int().nonnegative().default(0),
    reason: z.string().default(''),
    spreadRegionIds: z.array(z.string()).default([]),
    updatedAt: z.string().nullable().default(null),
  }),
});

export const FixedNpcProfileSchema = z.object({
  npcId: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  category: z.string().default('common'),
  factionId: z.string().default(''),
  homeLocationId: z.string().default('unknown'),
  initialLocationId: z.string().default('unknown'),
  currentLocationId: z.string().default('unknown'),
  rankTitle: z.string().default(''),
  powerTier: z.number().default(0),
  beautyRegisterId: z.string().default(''),
  ageText: z.string().default(''),
  regionText: z.string().default(''),
  usualLocationText: z.string().default(''),
  publicIdentity: z.string().default(''),
  factionName: z.string().default(''),
  actualInvolvement: z.string().default(''),
  martialDirection: z.string().default(''),
  powerRankText: z.string().default(''),
  beautyRankText: z.string().default(''),
  offerText: z.string().default(''),
  fearText: z.string().default(''),
  currentSituation: z.string().default(''),
  appearanceProfile: z.string().default(''),
  personalityPlaceholder: z.string().default(''),
  sourcePath: z.string().default(''),
  coreInfo: z.string().default(''),
  formulaResourceIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const FixedNpcRuntimeStateSchema = z.object({
  npcId: z.string(),
  currentLocationId: z.string().default('unknown'),
  alive: z.boolean().default(true),
  met: z.boolean().default(false),
  discovered: z.boolean().default(false),
  statusFlags: BooleanRecordSchema,
  runtimeNotes: z.string().default(''),
});

export const GeneratedNpcProfileSchema = z.object({
  npcId: z.string(),
  name: z.string(),
  aliases: z.array(z.string()).default([]),
  category: z.enum(['beauty', 'master', 'common', 'enemy', 'merchant', 'faction_member']),
  coreInfo: z.string().default(''),
  factionId: z.string().default(''),
  originLocationId: z.string().default('unknown'),
  tags: z.array(z.string()).default([]),
  cardSource: z.string().default(''),
});

export const GeneratedNpcRuntimeStateSchema = z.object({
  npcId: z.string(),
  currentLocationId: z.string().default('unknown'),
  alive: z.boolean().default(true),
  met: z.boolean().default(false),
  discovered: z.boolean().default(false),
  statusFlags: BooleanRecordSchema,
  scheduleHint: z.string().default(''),
  memorySeed: z.string().default(''),
});

export const NpcSaveSchema = z.object({
  fixedNpcProfiles: z.record(z.string(), FixedNpcProfileSchema).default({}),
  fixedNpcStates: z.record(z.string(), FixedNpcRuntimeStateSchema).default({}),
  generatedNpcProfiles: z.record(z.string(), GeneratedNpcProfileSchema).default({}),
  generatedNpcStates: z.record(z.string(), GeneratedNpcRuntimeStateSchema).default({}),
  npcIndex: z.object({
    byLocationId: StringArrayRecordSchema,
    byFactionId: StringArrayRecordSchema,
    byTag: StringArrayRecordSchema,
  }),
});

export const NpcRelationStateSchema = z.object({
  npcId: z.string(),
  familiarity: z.number().default(0),
  affection: z.number().default(0),
  trust: z.number().default(0),
  fear: z.number().default(0),
  hostility: z.number().default(0),
  loyalty: z.number().default(0),
  relationFlags: BooleanRecordSchema,
  lastInteractionAt: z.string().nullable().default(null),
});

export const FactionRelationStateSchema = z.object({
  factionId: z.string(),
  reputation: z.number().default(0),
  hostility: z.number().default(0),
  relationFlags: BooleanRecordSchema,
});

export const RelationChangeRecordSchema = z.object({
  changeId: z.string(),
  at: z.string(),
  targetType: z.enum(['npc', 'faction', 'world']),
  targetId: z.string(),
  summary: z.string(),
});

export const RelationshipSaveSchema = z.object({
  npcRelations: z.record(z.string(), NpcRelationStateSchema).default({}),
  factionRelations: z.record(z.string(), FactionRelationStateSchema).default({}),
  recentChanges: z.array(RelationChangeRecordSchema).default([]),
});

export const ItemStackStateSchema = z.object({
  stackId: z.string(),
  itemId: z.string(),
  quantity: z.number().nonnegative(),
  bound: z.boolean().default(false),
  state: RawRecordSchema,
});

export const InventoryContainerStateSchema = z.object({
  containerId: z.string(),
  unlocked: z.boolean().default(true),
  capacity: z.number().int().nonnegative().default(0),
  itemStackIds: z.array(z.string()).default([]),
});

export const InventorySaveSchema = z.object({
  currencies: z.record(z.string(), z.number()).default({ 银两: 0 }),
  itemStacks: z.record(z.string(), ItemStackStateSchema).default({}),
  equipped: z.record(z.string(), z.string().nullable()).default({}),
  containers: z.record(z.string(), InventoryContainerStateSchema).default({}),
});

export const CollectionMemberStateSchema = z.object({
  npcId: z.string(),
  collectionState: z.string().default('未接触'),
  recruitedAt: z.string().nullable().default(null),
  assignedRole: z.string().nullable().default(null),
  growth: RawRecordSchema,
  flags: BooleanRecordSchema,
});

export const CollectionSaveSchema = z.object({
  beauties: z.record(z.string(), CollectionMemberStateSchema).default({}),
  masters: z.record(z.string(), CollectionMemberStateSchema).default({}),
  albums: z.record(z.string(), z.boolean()).default({}),
});

export const FemaleRosterEntrySchema = z.object({
  npcId: z.string(),
  displayName: z.string(),
  source: z.string().default('manual'),
  locationId: z.string().default(''),
  discovered: z.boolean().default(false),
  eligibleForHarem: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  notes: z.string().default(''),
});

export const HaremMemberStateSchema = z.object({
  npcId: z.string(),
  rankId: z.string().default('custom'),
  rankName: z.string().default('自定义位分'),
  admittedAt: z.string(),
  admissionRoute: z.string().default('plot'),
  homeLocationId: z.string().default(''),
  lastInteractionAt: z.string().nullable().default(null),
  mood: z.number().min(0).max(100).default(50),
  interactionCount: z.number().int().nonnegative().default(0),
  cgUnlocked: z.boolean().default(false),
  flags: BooleanRecordSchema,
  tags: z.array(z.string()).default([]),
});

export const IntimacyInteractionRecordSchema = z.object({
  interactionId: z.string(),
  npcId: z.string(),
  kind: z.string(),
  title: z.string(),
  summary: z.string(),
  at: z.string(),
  locationId: z.string().default(''),
  cgSceneId: z.string().default(''),
  cgAssetIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const HaremCgSceneStateSchema = z.object({
  sceneId: z.string(),
  npcId: z.string(),
  title: z.string(),
  status: z.enum(['active', 'completed', 'aborted']).default('active'),
  startedAt: z.string(),
  endedAt: z.string().nullable().default(null),
  locationId: z.string().default(''),
  cgAssetIds: z.array(z.string()).default([]),
  summary: z.string().default(''),
  tags: z.array(z.string()).default([]),
});

export const HaremBoundaryPlaceholderSchema = z.object({
  placeholderId: z.string(),
  npcId: z.string(),
  createdAt: z.string(),
  locationId: z.string().default(''),
  summary: z.string().default(''),
  riskHint: z.string().default(''),
  status: z.literal('placeholder').default('placeholder'),
});

export const IntimacySaveSchema = z
  .object({
    roster: z.record(z.string(), FemaleRosterEntrySchema).default({}),
    haremMembers: z.record(z.string(), HaremMemberStateSchema).default({}),
    interactions: z.record(z.string(), IntimacyInteractionRecordSchema).default({}),
    recentInteractionIds: z.array(z.string()).default([]),
    cgScenes: z.record(z.string(), HaremCgSceneStateSchema).default({}),
    activeCgSceneId: z.string().nullable().default(null),
    boundaryPlaceholders: z.record(z.string(), HaremBoundaryPlaceholderSchema).default({}),
  })
  .default({
    roster: {},
    haremMembers: {},
    interactions: {},
    recentInteractionIds: [],
    cgScenes: {},
    activeCgSceneId: null,
    boundaryPlaceholders: {},
  });

export const EconomyAssetStateSchema = z.object({
  assetId: z.string(),
  assetType: z.string(),
  unlocked: z.boolean().default(false),
  level: z.number().int().nonnegative().default(0),
  state: RawRecordSchema,
});

export const EconomyResourceLedgerSchema = z.object({
  silver: z.number().nonnegative().default(0),
  grain: z.number().nonnegative().default(0),
  arms: z.number().nonnegative().default(0),
  horses: z.number().nonnegative().default(0),
  manpower: z.number().nonnegative().default(0),
  intel: z.number().nonnegative().default(0),
  medicine: z.number().nonnegative().default(0),
});

export const EconomyResourceDeltaSchema = z.object({
  silver: z.number().default(0),
  grain: z.number().default(0),
  arms: z.number().default(0),
  horses: z.number().default(0),
  manpower: z.number().default(0),
  intel: z.number().default(0),
  medicine: z.number().default(0),
});

export const EconomyResourcePatchSchema = EconomyResourceLedgerSchema.partial().default({});

export const BusinessStateSchema = z.object({
  businessId: z.string(),
  name: z.string().default(''),
  businessType: z.string().default('custom'),
  locationId: z.string(),
  assetId: z.string().nullable().default(null),
  level: z.number().int().nonnegative().default(1),
  staffNpcIds: z.array(z.string()).default([]),
  lastSettledAt: z.string().nullable().default(null),
  baseYield: EconomyResourcePatchSchema,
  upkeep: EconomyResourcePatchSchema,
  riskLevel: z.number().min(0).max(100).default(0),
  security: z.number().min(0).max(100).default(50),
  prosperity: z.number().min(0).max(100).default(50),
  tags: z.array(z.string()).default([]),
  state: RawRecordSchema,
  stateFlags: BooleanRecordSchema,
});

export const EconomyAssignmentStateSchema = z.object({
  assignmentId: z.string(),
  businessId: z.string(),
  npcId: z.string(),
  role: z.string().default('manager'),
  assignedAt: z.string(),
  efficiencyBonus: z.number().default(0),
  riskModifier: z.number().default(0),
  upkeep: EconomyResourcePatchSchema,
  tags: z.array(z.string()).default([]),
});

export const EconomySettlementReportSchema = z.object({
  reportId: z.string(),
  at: z.string(),
  businessId: z.string(),
  businessName: z.string(),
  cycles: z.number().int().positive(),
  produced: EconomyResourceLedgerSchema,
  upkeep: EconomyResourceLedgerSchema,
  net: EconomyResourceDeltaSchema,
  riskDelta: z.number().default(0),
  riskEvent: z.string().default(''),
  staffNpcIds: z.array(z.string()).default([]),
  summary: z.string(),
});

export const EconomySaveSchema = z.object({
  assets: z.record(z.string(), EconomyAssetStateSchema).default({}),
  businesses: z.record(z.string(), BusinessStateSchema).default({}),
  pendingIncome: z.record(z.string(), z.number()).default({}),
  resources: EconomyResourceLedgerSchema.default({
    silver: 0,
    grain: 0,
    arms: 0,
    horses: 0,
    manpower: 0,
    intel: 0,
    medicine: 0,
  }),
  assignments: z.record(z.string(), EconomyAssignmentStateSchema).default({}),
  recentReports: z.array(EconomySettlementReportSchema).default([]),
  lastSettledAt: z.string().nullable().default(null),
});

export const ActiveBattleStateSchema = z.object({
  battleId: z.string(),
  startedAt: z.string(),
  setupSnapshot: RawRecordSchema,
  stateSnapshot: RawRecordSchema,
});

export const BattleReportSummarySchema = z.object({
  battleId: z.string(),
  endedAt: z.string(),
  result: z.string(),
  participants: z.array(z.string()).default([]),
  summary: z.string(),
});

export const CombatSaveSchema = z.object({
  activeBattle: ActiveBattleStateSchema.nullable().default(null),
  recentBattleReports: z.array(BattleReportSummarySchema).default([]),
  cooldowns: z.record(z.string(), z.number()).default({}),
});

export const StrategyResourceLedgerSchema = z.object({
  silver: z.number().nonnegative().default(0),
  grain: z.number().nonnegative().default(0),
  arms: z.number().nonnegative().default(0),
  horses: z.number().nonnegative().default(0),
  manpower: z.number().nonnegative().default(0),
  intel: z.number().nonnegative().default(0),
  medicine: z.number().nonnegative().default(0),
});

export const StrategySaveSchema = z.object({
  activeCampaignId: z.string().nullable().default(null),
  resources: StrategyResourceLedgerSchema,
  campaigns: z.record(z.string(), z.unknown()).default({}),
  lastResolvedAt: z.string().nullable().default(null),
});

export const SceneParticipantStateSchema = z.object({
  npcId: z.string(),
  present: z.boolean().default(true),
  canSpeak: z.boolean().default(true),
  canAct: z.boolean().default(true),
  visible: z.boolean().default(true),
  role: z.string().default(''),
});

export const SceneStateSchema = z.object({
  sceneId: z.string(),
  title: z.string(),
  status: z.enum(['active', 'closed']),
  locationId: z.string(),
  category: z.string().default('free'),
  startedAt: z.string(),
  updatedAt: z.string(),
  participantNpcIds: z.array(z.string()).default([]),
  participants: z.record(z.string(), SceneParticipantStateSchema).default({}),
  tags: z.array(z.string()).default([]),
  summary: z.string().default(''),
});

export const SceneSaveSchema = z.object({
  activeSceneId: z.string().nullable().default(null),
  scenes: z.record(z.string(), SceneStateSchema).default({}),
  recentSceneIds: z.array(z.string()).default([]),
});

export const QuestRuntimeStateSchema = z.object({
  questId: z.string(),
  status: z.enum(['active', 'completed', 'failed']),
  currentStepId: z.string(),
  acceptedAt: z.string(),
  updatedAt: z.string(),
  relatedNpcIds: z.array(z.string()).default([]),
  relatedLocationIds: z.array(z.string()).default([]),
  state: RawRecordSchema,
});

export const QuestEvidenceRecordSchema = z.object({
  evidenceId: z.string(),
  questId: z.string().optional(),
  title: z.string(),
  summary: z.string(),
  foundAt: z.string(),
  sourceId: z.string().optional(),
  relatedNpcIds: z.array(z.string()).default([]),
  relatedLocationIds: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const QuestSaveSchema = z.object({
  definitions: z.record(z.string(), z.unknown()).default({}),
  evidence: z.record(z.string(), QuestEvidenceRecordSchema).default({}),
  active: z.record(z.string(), QuestRuntimeStateSchema).default({}),
  completed: z.record(z.string(), QuestRuntimeStateSchema).default({}),
  failed: z.record(z.string(), QuestRuntimeStateSchema).default({}),
  questFlags: BooleanRecordSchema,
});

export const NpcMemoryStateSchema = z.object({
  npcId: z.string(),
  summary: z.string().default(''),
  importantEvents: z.array(z.string()).default([]),
  lastUpdatedAt: z.string(),
});

export const MemorySaveSchema = z.object({
  globalSummary: z.string().default(''),
  recentSummary: z.string().default(''),
  npcMemory: z.record(z.string(), NpcMemoryStateSchema).default({}),
  playerBehaviorProfile: RawRecordSchema,
  memoryIndex: StringArrayRecordSchema,
});

export const NarrativeOutputModeSchema = z.enum(['auto', 'staged_dialogue', 'classic_airp']);
export const NarrativeEffectiveOutputModeSchema = z.enum(['staged_dialogue', 'classic_airp']);
export const NarrativeSceneCategorySchema = z.enum([
  'mainline',
  'hiddenline',
  'sidequest',
  'npc_dialogue',
  'investigation',
  'court',
  'combat',
  'strategy',
  'travel',
  'daily',
  'business',
  'intimacy',
  'free',
]);

export const NarrativeInputSegmentSchema = z.object({
  segmentId: z.string(),
  kind: z.enum(['user_speech', 'user_thought', 'user_action']),
  speakerId: z.literal('{{user}}'),
  text: z.string(),
  rawText: z.string(),
  startIndex: z.number().int().nonnegative(),
  endIndex: z.number().int().nonnegative(),
  visibility: z.enum(['public', 'private', 'collapsed']),
});

export const NarrativeInputParseResultSchema = z.object({
  rawInput: z.string(),
  parsedAt: z.string(),
  segments: z.array(NarrativeInputSegmentSchema).default([]),
  speechText: z.string().default(''),
  thoughtText: z.string().default(''),
  actionText: z.string().default(''),
  hasSpeech: z.boolean().default(false),
  hasThought: z.boolean().default(false),
  hasAction: z.boolean().default(false),
});

export const NarrativeModeDecisionSchema = z.object({
  decidedAt: z.string(),
  preference: NarrativeOutputModeSchema,
  effectiveMode: NarrativeEffectiveOutputModeSchema,
  sceneCategory: NarrativeSceneCategorySchema,
  reason: z.string(),
  signalTags: z.array(z.string()).default([]),
});

export const NarrativeSaveSchema = z.object({
  tavernChatId: z.string().nullable().default(null),
  firstBoundMessageId: z.number().int().nullable().default(null),
  latestProcessedMessageId: z.number().int().nullable().default(null),
  lastSceneSummary: z.string().default(''),
  outputMode: NarrativeOutputModeSchema.default('auto'),
  currentSceneCategory: NarrativeSceneCategorySchema.default('free'),
  currentSceneTags: z.array(z.string()).default([]),
  lastEffectiveOutputMode: NarrativeEffectiveOutputModeSchema.default('classic_airp'),
  lastInputParse: NarrativeInputParseResultSchema.nullable().default(null),
  lastModeDecision: NarrativeModeDecisionSchema.nullable().default(null),
  outputRulesVersion: z.string().default('narrative-category-v1'),
  pendingNarration: z
    .object({
      actionId: z.string(),
      status: z.enum(['none', 'waiting', 'received', 'failed']),
    })
    .nullable()
    .default(null),
});

export const DialogueSpeakerCandidateSchema = z.object({
  speakerId: z.string(),
  displayName: z.string(),
  canSpeak: z.boolean(),
  canThink: z.boolean(),
  inScene: z.boolean(),
  priority: z.number(),
  reason: z.string(),
});

export const DialogueTurnPlanSchema = z.object({
  planId: z.string(),
  sceneId: z.string().optional(),
  createdAt: z.string(),
  outputMode: z.string(),
  topic: z.string(),
  speakerIds: z.array(z.string()).default([]),
  candidates: z.array(DialogueSpeakerCandidateSchema).default([]),
  includeThoughts: z.boolean().default(false),
  summary: z.string(),
});

export const DialogueSaveSchema = z.object({
  lastPlan: DialogueTurnPlanSchema.nullable().default(null),
  recentPlans: z.array(DialogueTurnPlanSchema).default([]),
});

export const WorldEventTemplateSchema = z.object({
  templateId: z.string(),
  title: z.string(),
  kind: z.string().default('custom'),
  weight: z.number().default(1),
  locationIds: z.array(z.string()).default([]),
  regionIds: z.array(z.string()).default([]),
  requiredTags: z.array(z.string()).default([]),
  relatedNpcIds: z.array(z.string()).default([]),
  consequenceType: z.string().default('custom'),
  summary: z.string(),
});

export const WorldEventInstanceSchema = z.object({
  eventId: z.string(),
  templateId: z.string().optional(),
  title: z.string(),
  kind: z.string().default('custom'),
  status: z.enum(['active', 'resolved', 'expired']),
  locationId: z.string(),
  regionId: z.string(),
  createdAt: z.string(),
  resolvedAt: z.string().optional(),
  relatedNpcIds: z.array(z.string()).default([]),
  summary: z.string(),
  tags: z.array(z.string()).default([]),
});

export const EventSaveSchema = z.object({
  templates: z.record(z.string(), WorldEventTemplateSchema).default({}),
  active: z.record(z.string(), WorldEventInstanceSchema).default({}),
  resolved: z.record(z.string(), WorldEventInstanceSchema).default({}),
  recentEventIds: z.array(z.string()).default([]),
});

export const LogSaveSchema = z.object({
  actionLog: z.array(SaveLogEntrySchema).default([]),
  systemLog: z.array(SaveLogEntrySchema).default([]),
  maxEntries: z.number().int().positive().default(200),
});

export const RepairHistoryEntrySchema = z.object({
  repairId: z.string(),
  at: z.string(),
  sourceSchemaVersion: z.number().int().nonnegative(),
  targetSchemaVersion: z.number().int().nonnegative(),
  summary: z.string(),
  success: z.boolean(),
});

export const MaintenanceSaveSchema = z.object({
  migrationsApplied: z.array(z.string()).default([]),
  warnings: z.array(SaveWarningSchema).default([]),
  lastHealthCheckAt: z.string().nullable().default(null),
  repairHistory: z.array(RepairHistoryEntrySchema).default([]),
});

export const GameSaveSchema = z.object({
  meta: SaveMetaSchema,
  flow: SaveFlowSchema,
  opening: SaveOpeningSchema,
  player: PlayerSaveSchema,
  world: WorldSaveSchema,
  npcs: NpcSaveSchema,
  relationship: RelationshipSaveSchema,
  inventory: InventorySaveSchema,
  collection: CollectionSaveSchema,
  intimacy: IntimacySaveSchema,
  economy: EconomySaveSchema,
  combat: CombatSaveSchema,
  strategy: StrategySaveSchema,
  scene: SceneSaveSchema,
  quests: QuestSaveSchema,
  events: EventSaveSchema,
  memory: MemorySaveSchema,
  narrative: NarrativeSaveSchema,
  dialogue: DialogueSaveSchema,
  logs: LogSaveSchema,
  maintenance: MaintenanceSaveSchema,
});

export const SaveSlotSummarySchema = z.object({
  slotId: SaveSlotIdSchema,
  exists: z.boolean(),
  schemaVersion: z.literal(GUFENG_SCHEMA_VERSION),
  saveId: z.string().default(''),
  displayName: z.string().default(''),
  characterName: z.string().default(''),
  gameStage: StageOrEmptySchema.default(''),
  gameStageName: z.string().default(''),
  difficultyId: DifficultyOrEmptySchema.default(''),
  difficultyName: z.string().default(''),
  createdAt: z.string().default(''),
  savedAt: z.string().default(''),
  playTimeSeconds: z.number().int().nonnegative().default(0),
  warningCount: z.number().int().nonnegative().default(0),
});

export const SaveIndexSchema = z.object({
  schemaVersion: z.literal(GUFENG_SCHEMA_VERSION),
  updatedAt: z.string(),
  slots: z.array(SaveSlotSummarySchema).length(SAVE_SLOT_COUNT),
});

export const OpeningPrologueSkipUnlockSchema = z.object({
  unlocked: z.boolean().default(false),
  unlockedAt: z.string().default(''),
  unlockedBySlotId: SaveSlotIdSchema.nullable().default(null),
});

export const GlobalSettingsSchema = z.object({
  schemaVersion: z.literal(GUFENG_SCHEMA_VERSION),
  updatedAt: z.string(),
  ui: RawRecordSchema,
  debug: RawRecordSchema,
});

export const ExportedSavePackageSchema = z.object({
  packageType: z.literal('gufeng-world-save'),
  packageVersion: z.literal(GUFENG_SCHEMA_VERSION),
  exportedAt: z.string(),
  checksum: z.string(),
  save: GameSaveSchema,
});

export type SaveSlotId = z.infer<typeof SaveSlotIdSchema>;
export type OpeningGameStage = z.infer<typeof OpeningGameStageSchema>;
export type DifficultyId = z.infer<typeof DifficultyIdSchema>;
export type GameSave = z.infer<typeof GameSaveSchema>;
export type SaveSlotSummary = z.infer<typeof SaveSlotSummarySchema>;
export type SaveIndex = z.infer<typeof SaveIndexSchema>;
export type OpeningPrologueSkipUnlock = z.infer<typeof OpeningPrologueSkipUnlockSchema>;
export type GlobalSettings = z.infer<typeof GlobalSettingsSchema>;
export type ExportedSavePackage = z.infer<typeof ExportedSavePackageSchema>;
export type SaveLogEntry = z.infer<typeof SaveLogEntrySchema>;
export type BusinessState = z.infer<typeof BusinessStateSchema>;
export type EconomyResourceLedger = z.infer<typeof EconomyResourceLedgerSchema>;
export type EconomyAssignmentState = z.infer<typeof EconomyAssignmentStateSchema>;
export type EconomySettlementReport = z.infer<typeof EconomySettlementReportSchema>;
export type BattleReportSummary = z.infer<typeof BattleReportSummarySchema>;
export type NarrativeOutputMode = z.infer<typeof NarrativeOutputModeSchema>;
export type NarrativeSceneCategory = z.infer<typeof NarrativeSceneCategorySchema>;
export type FixedNpcProfile = z.infer<typeof FixedNpcProfileSchema>;
export type SceneState = z.infer<typeof SceneStateSchema>;
export type DialogueTurnPlan = z.infer<typeof DialogueTurnPlanSchema>;
export type WorldEventInstance = z.infer<typeof WorldEventInstanceSchema>;
export type FemaleRosterEntryState = z.infer<typeof FemaleRosterEntrySchema>;
export type HaremMemberState = z.infer<typeof HaremMemberStateSchema>;
export type HaremCgSceneState = z.infer<typeof HaremCgSceneStateSchema>;
export type IntimacyInteractionRecord = z.infer<typeof IntimacyInteractionRecordSchema>;
