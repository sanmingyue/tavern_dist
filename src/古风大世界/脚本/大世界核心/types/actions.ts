import type { DifficultyId, GameSave, SaveSlotId } from './schema';
import type { BattleAutoAdvanceOptions, BattleCommand, BattleSetup } from './combat';
import type { CharacterMemoryAppendPayload, CharacterMemorySetPayload } from './characterMemory';
import type { FixedCharacterMovePayload, FixedCharacterProfile } from './characters';
import type { DialoguePlanRequest } from './dialogue';
import type {
  EconomyBusinessSetup,
  EconomyResourceChangePayload,
  EconomySettleAllPayload,
  EconomySettleBusinessPayload,
  EconomyStaffAssignmentInput,
  EconomyTransferToStrategyPayload,
} from './economy';
import type { WorldEventGeneratePayload, WorldEventInstance, WorldEventResolvePayload, WorldEventTemplate } from './events';
import type {
  AffectionInteractionPayload,
  FemaleRosterRegisterPayload,
  HaremAdmitPayload,
  HaremBoundaryPlaceholderPayload,
  HaremCgEndPayload,
  HaremCgStartPayload,
  HaremInteractionPayload,
  HaremRankSetPayload,
} from './intimacy';
import type { MapLocationNode, MapRouteNode, TravelPlanRequest } from './map';
import type { NarrativeModeDecisionInput, NarrativeOutputModePreference, NarrativeSceneCategory } from './narrative';
import type { QuestAcceptPayload, QuestAdvancePayload, QuestDefinition, QuestEvidencePayload } from './quest';
import type { FactionRelationAdjustPayload, NpcRelationAdjustPayload, WorldReputationAdjustPayload } from './relation';
import type { ScenePresencePayload, SceneStartPayload } from './scene';
import type { StrategyCampaignSetup, StrategyOrder } from './strategy';

export type ActionTone = 'green' | 'blue' | 'yellow' | 'red';

export type ActionResult = {
  ok: boolean;
  tone: ActionTone;
  message: string;
  save: GameSave;
  shouldAskAi?: boolean;
  changedIds?: string[];
};

export type CharacterCreatePayload = {
  name: string;
  gender?: string;
  avatarId?: string;
  characterFullbodyIndex?: number;
  origin?: string;
  spiritRoot?: string;
  pathFocus?: string;
  temperament?: string;
};

export type TravelPayload = {
  targetLocationId: string;
  targetRegionId?: string;
  distanceLi?: number;
  reason?: string;
};

export type ConsequencePayload = {
  type:
    | 'kill'
    | 'save'
    | 'escort_failed'
    | 'offend_authority'
    | 'befriend_faction'
    | 'owe_favor'
    | 'identity_leaked'
    | 'missed_timing'
    | 'custom';
  summary: string;
  severity?: number;
  relatedNpcIds?: string[];
  relatedFactionIds?: string[];
  relatedLocationIds?: string[];
  flags?: Record<string, boolean>;
};

export type CombatParticipantInput = {
  id: string;
  name: string;
  side: 'self' | 'ally' | 'enemy' | 'neutral';
  role?: 'duelist' | 'guard' | 'soldier' | 'commander' | 'assassin' | 'healer';
  martialTier?: number;
  troopCount?: number;
  innerPower?: number;
  stamina?: number;
  weaponCondition?: number;
  poisonLevel?: number;
  injuryLevel?: number;
};

export type CombatResolvePayload = {
  battleId?: string;
  mode: 'duel' | 'group' | 'formation' | 'escape';
  locationId?: string;
  participants: CombatParticipantInput[];
  situation?: string;
};

export type BusinessSettlePayload = EconomySettleBusinessPayload;

export type GameAction =
  | { type: 'SAVE_STAGE_SET'; stage: GameSave['flow']['gameStage'] }
  | { type: 'DIFFICULTY_SET'; difficultyId: DifficultyId }
  | { type: 'CHARACTER_CREATE'; payload: CharacterCreatePayload }
  | { type: 'PROLOGUE_COMPLETE'; skipped?: boolean }
  | { type: 'ATB_BATTLE_START'; payload: BattleSetup }
  | { type: 'ATB_BATTLE_TICK'; deltaTime?: number }
  | { type: 'ATB_BATTLE_COMMAND'; payload: BattleCommand }
  | { type: 'ATB_BATTLE_AUTO'; options?: BattleAutoAdvanceOptions }
  | { type: 'TIME_ADVANCE'; minutes: number; reason?: string }
  | { type: 'TRAVEL'; payload: TravelPayload }
  | { type: 'MAP_LOCATION_UPSERT'; payload: MapLocationNode }
  | { type: 'MAP_ROUTE_UPSERT'; payload: MapRouteNode }
  | { type: 'MAP_TRAVEL_PLAN'; payload: TravelPlanRequest }
  | { type: 'MAP_TRAVEL_EXECUTE'; payload?: TravelPlanRequest }
  | { type: 'FIXED_CHARACTER_UPSERT'; payload: FixedCharacterProfile }
  | { type: 'FIXED_CHARACTER_MOVE'; payload: FixedCharacterMovePayload }
  | { type: 'FIXED_CHARACTER_DISCOVER'; npcId: string; met?: boolean }
  | { type: 'SCENE_START'; payload: SceneStartPayload }
  | { type: 'SCENE_END'; sceneId?: string }
  | { type: 'SCENE_PRESENCE_SET'; payload: ScenePresencePayload }
  | { type: 'QUEST_DEFINITION_UPSERT'; payload: QuestDefinition }
  | { type: 'QUEST_ACCEPT'; payload: QuestAcceptPayload }
  | { type: 'QUEST_ADVANCE'; payload: QuestAdvancePayload }
  | { type: 'QUEST_EVIDENCE_RECORD'; payload: QuestEvidencePayload }
  | { type: 'RELATION_NPC_ADJUST'; payload: NpcRelationAdjustPayload }
  | { type: 'RELATION_FACTION_ADJUST'; payload: FactionRelationAdjustPayload }
  | { type: 'REPUTATION_ADJUST'; payload: WorldReputationAdjustPayload }
  | { type: 'DIALOGUE_PLAN_BUILD'; payload?: DialoguePlanRequest }
  | { type: 'EVENT_TEMPLATE_UPSERT'; payload: WorldEventTemplate }
  | { type: 'EVENT_GENERATE'; payload?: WorldEventGeneratePayload }
  | { type: 'EVENT_ACTIVATE'; payload: WorldEventInstance }
  | { type: 'EVENT_RESOLVE'; payload: WorldEventResolvePayload }
  | { type: 'CHARACTER_MEMORY_SET'; payload: CharacterMemorySetPayload }
  | { type: 'CHARACTER_MEMORY_APPEND'; payload: CharacterMemoryAppendPayload }
  | { type: 'INTIMACY_ROSTER_REGISTER'; payload: FemaleRosterRegisterPayload }
  | { type: 'INTIMACY_AFFECTION_INTERACT'; payload: AffectionInteractionPayload }
  | { type: 'HAREM_ADMIT'; payload: HaremAdmitPayload }
  | { type: 'HAREM_RANK_SET'; payload: HaremRankSetPayload }
  | { type: 'HAREM_INTERACTION_RECORD'; payload: HaremInteractionPayload }
  | { type: 'HAREM_CG_START'; payload: HaremCgStartPayload }
  | { type: 'HAREM_CG_END'; payload?: HaremCgEndPayload }
  | { type: 'HAREM_BOUNDARY_PLACEHOLDER'; payload: HaremBoundaryPlaceholderPayload }
  | { type: 'CONSEQUENCE_ADD'; payload: ConsequencePayload }
  | { type: 'COMBAT_START'; payload: CombatResolvePayload }
  | { type: 'COMBAT_RESOLVE'; payload: CombatResolvePayload }
  | { type: 'BUSINESS_SETTLE'; payload: BusinessSettlePayload }
  | { type: 'ECONOMY_BUSINESS_UPSERT'; payload: EconomyBusinessSetup }
  | { type: 'ECONOMY_BUSINESS_REMOVE'; businessId: string }
  | { type: 'ECONOMY_STAFF_ASSIGN'; payload: EconomyStaffAssignmentInput }
  | { type: 'ECONOMY_STAFF_UNASSIGN'; assignmentId: string }
  | { type: 'ECONOMY_SETTLE_ALL'; payload?: EconomySettleAllPayload }
  | { type: 'ECONOMY_RESOURCE_ADD'; payload: EconomyResourceChangePayload }
  | { type: 'ECONOMY_TRANSFER_TO_STRATEGY'; payload: EconomyTransferToStrategyPayload }
  | { type: 'STRATEGY_CAMPAIGN_START'; payload: StrategyCampaignSetup }
  | { type: 'STRATEGY_ORDER_ENQUEUE'; payload: StrategyOrder; campaignId?: string }
  | { type: 'STRATEGY_TURN_RESOLVE'; campaignId?: string; maxOrders?: number }
  | { type: 'NARRATIVE_OUTPUT_MODE_SET'; mode: NarrativeOutputModePreference }
  | { type: 'NARRATIVE_SCENE_CATEGORY_SET'; category: NarrativeSceneCategory; tags?: string[] }
  | { type: 'NARRATIVE_USER_INPUT_PARSE'; rawInput: string }
  | { type: 'NARRATIVE_MODE_DECIDE'; payload?: NarrativeModeDecisionInput }
  | { type: 'MEMORY_SUMMARY_SET'; globalSummary?: string; recentSummary?: string }
  | { type: 'NARRATIVE_BIND'; tavernChatId?: string; messageId?: number }
  | { type: 'LOG_ONLY'; summary: string; relatedIds?: string[] };

export type SaveImportPreview = {
  ok: boolean;
  message: string;
  packageVersion?: number;
  originalSlotId?: SaveSlotId;
  originalSaveId?: string;
  warningCount: number;
};
