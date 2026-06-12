import { getDifficultyDefinition } from './data/difficulty';
import { addConsequence } from './engine/consequence';
import {
  autoAdvanceActiveAtbBattle,
  resolveActiveAtbCommand,
  resolveBattle,
  startAtbBattle,
  startBattle,
  tickActiveAtbBattle,
} from './engine/combat';
import {
  addEconomyResourcePatch,
  assignEconomyStaff,
  removeEconomyBusiness,
  settleBusiness,
  settleAllEconomyBusinesses,
  transferEconomyResourcesToStrategy,
  unassignEconomyStaff,
  upsertEconomyBusiness,
} from './engine/economy';
import {
  activateWorldEvent,
  generateWorldEvents,
  resolveWorldEvent,
  upsertEventTemplate,
} from './engine/events';
import { appendCharacterMemory, setCharacterMemory } from './engine/characterMemory';
import {
  discoverFixedCharacter,
  moveFixedCharacter,
  upsertFixedCharacter,
} from './engine/characters';
import { buildDialoguePlan } from './engine/dialogue';
import {
  executeTravelPlan,
  storeTravelPlan,
  upsertMapLocation,
  upsertMapRoute,
} from './engine/map';
import {
  admitHaremMember,
  endHaremCgMode,
  recordAffectionInteraction,
  recordHaremBoundaryPlaceholder,
  recordHaremInteraction,
  registerFemaleRosterEntry,
  setHaremRank,
  startHaremCgMode,
} from './engine/intimacy';
import {
  decideAndStoreNarrativeMode,
  parseAndStoreUserInput,
  setNarrativeOutputMode,
  setNarrativeSceneCategory,
} from './engine/narrative';
import { acceptQuest, advanceQuest, recordQuestEvidence, upsertQuestDefinition } from './engine/quest';
import { adjustFactionRelation, adjustNpcRelation, adjustWorldReputation } from './engine/relation';
import { closeScene, setScenePresence, startScene } from './engine/scene';
import { enqueueActiveStrategyOrder, resolveActiveStrategyTurn, startStrategyCampaign } from './engine/strategyRuntime';
import { advanceWorldTime } from './engine/time';
import { changeLocation } from './engine/travel';
import { nowIso, pushSaveLog } from './state/defaults';
import type { ActionResult, CharacterCreatePayload, GameAction } from './types/actions';
import type { GameSave, OpeningGameStage } from './types/schema';

export function dispatchAction(save: GameSave, action: GameAction): ActionResult {
  try {
    const message = dispatchWithoutCatch(save, action);
    save.meta.savedAt = nowIso();
    return { ok: true, tone: 'green', message, save, shouldAskAi: shouldAskAi(action) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    pushSaveLog(save, action.type, message, false);
    save.meta.savedAt = nowIso();
    return { ok: false, tone: 'red', message, save };
  }
}

function dispatchWithoutCatch(save: GameSave, action: GameAction): string {
  switch (action.type) {
    case 'SAVE_STAGE_SET':
      return setStage(save, action.stage);
    case 'DIFFICULTY_SET':
      return setDifficulty(save, action.difficultyId);
    case 'CHARACTER_CREATE':
      return createCharacter(save, action.payload);
    case 'PROLOGUE_COMPLETE':
      return completePrologue(save, action.skipped ?? false);
    case 'ATB_BATTLE_START':
      return startAtbBattle(save, action.payload);
    case 'ATB_BATTLE_TICK':
      return tickActiveAtbBattle(save, action.deltaTime ?? 50);
    case 'ATB_BATTLE_COMMAND':
      return resolveActiveAtbCommand(save, action.payload);
    case 'ATB_BATTLE_AUTO':
      return autoAdvanceActiveAtbBattle(save, action.options ?? {});
    case 'TIME_ADVANCE':
      return advanceWorldTime(save, action.minutes, action.reason);
    case 'TRAVEL':
      return changeLocation(save, action.payload);
    case 'MAP_LOCATION_UPSERT':
      return upsertMapLocation(save, action.payload);
    case 'MAP_ROUTE_UPSERT':
      return upsertMapRoute(save, action.payload);
    case 'MAP_TRAVEL_PLAN':
      return storeTravelPlan(save, action.payload);
    case 'MAP_TRAVEL_EXECUTE':
      return executeTravelPlan(save, action.payload);
    case 'FIXED_CHARACTER_UPSERT':
      return upsertFixedCharacter(save, action.payload);
    case 'FIXED_CHARACTER_MOVE':
      return moveFixedCharacter(save, action.payload);
    case 'FIXED_CHARACTER_DISCOVER':
      return discoverFixedCharacter(save, action.npcId, action.met);
    case 'SCENE_START':
      return startScene(save, action.payload);
    case 'SCENE_END':
      return closeScene(save, action.sceneId);
    case 'SCENE_PRESENCE_SET':
      return setScenePresence(save, action.payload);
    case 'QUEST_DEFINITION_UPSERT':
      return upsertQuestDefinition(save, action.payload);
    case 'QUEST_ACCEPT':
      return acceptQuest(save, action.payload);
    case 'QUEST_ADVANCE':
      return advanceQuest(save, action.payload);
    case 'QUEST_EVIDENCE_RECORD':
      return recordQuestEvidence(save, action.payload);
    case 'RELATION_NPC_ADJUST':
      return adjustNpcRelation(save, action.payload);
    case 'RELATION_FACTION_ADJUST':
      return adjustFactionRelation(save, action.payload);
    case 'REPUTATION_ADJUST':
      return adjustWorldReputation(save, action.payload);
    case 'DIALOGUE_PLAN_BUILD': {
      const plan = buildDialoguePlan(save, action.payload);
      return plan.summary;
    }
    case 'EVENT_TEMPLATE_UPSERT':
      return upsertEventTemplate(save, action.payload);
    case 'EVENT_GENERATE':
      return generateWorldEvents(save, action.payload);
    case 'EVENT_ACTIVATE':
      return activateWorldEvent(save, action.payload);
    case 'EVENT_RESOLVE':
      return resolveWorldEvent(save, action.payload);
    case 'CHARACTER_MEMORY_SET':
      return setCharacterMemory(save, action.payload);
    case 'CHARACTER_MEMORY_APPEND':
      return appendCharacterMemory(save, action.payload);
    case 'INTIMACY_ROSTER_REGISTER':
      return registerFemaleRosterEntry(save, action.payload);
    case 'INTIMACY_AFFECTION_INTERACT':
      return recordAffectionInteraction(save, action.payload);
    case 'HAREM_ADMIT':
      return admitHaremMember(save, action.payload);
    case 'HAREM_RANK_SET':
      return setHaremRank(save, action.payload);
    case 'HAREM_INTERACTION_RECORD':
      return recordHaremInteraction(save, action.payload);
    case 'HAREM_CG_START':
      return startHaremCgMode(save, action.payload);
    case 'HAREM_CG_END':
      return endHaremCgMode(save, action.payload);
    case 'HAREM_BOUNDARY_PLACEHOLDER':
      return recordHaremBoundaryPlaceholder(save, action.payload);
    case 'CONSEQUENCE_ADD':
      return addConsequence(save, action.payload);
    case 'COMBAT_START':
      return startBattle(save, action.payload);
    case 'COMBAT_RESOLVE': {
      const report = resolveBattle(save, action.payload);
      return report.summary;
    }
    case 'BUSINESS_SETTLE':
      return settleBusiness(save, action.payload);
    case 'ECONOMY_BUSINESS_UPSERT':
      return upsertEconomyBusiness(save, action.payload);
    case 'ECONOMY_BUSINESS_REMOVE':
      return removeEconomyBusiness(save, action.businessId);
    case 'ECONOMY_STAFF_ASSIGN':
      return assignEconomyStaff(save, action.payload);
    case 'ECONOMY_STAFF_UNASSIGN':
      return unassignEconomyStaff(save, action.assignmentId);
    case 'ECONOMY_SETTLE_ALL':
      return settleAllEconomyBusinesses(save, action.payload ?? {});
    case 'ECONOMY_RESOURCE_ADD':
      return addEconomyResourcePatch(save, action.payload);
    case 'ECONOMY_TRANSFER_TO_STRATEGY':
      return transferEconomyResourcesToStrategy(save, action.payload);
    case 'STRATEGY_CAMPAIGN_START':
      return startStrategyCampaign(save, action.payload);
    case 'STRATEGY_ORDER_ENQUEUE':
      return enqueueActiveStrategyOrder(save, action.payload, action.campaignId);
    case 'STRATEGY_TURN_RESOLVE':
      return resolveActiveStrategyTurn(save, action.campaignId, action.maxOrders);
    case 'NARRATIVE_OUTPUT_MODE_SET':
      return setNarrativeOutputMode(save, action.mode);
    case 'NARRATIVE_SCENE_CATEGORY_SET':
      return setNarrativeSceneCategory(save, action.category, action.tags ?? []);
    case 'NARRATIVE_USER_INPUT_PARSE':
      return parseAndStoreUserInput(save, action.rawInput);
    case 'NARRATIVE_MODE_DECIDE':
      return decideAndStoreNarrativeMode(save, action.payload ?? {});
    case 'MEMORY_SUMMARY_SET':
      if (action.globalSummary !== undefined) save.memory.globalSummary = action.globalSummary;
      if (action.recentSummary !== undefined) save.memory.recentSummary = action.recentSummary;
      pushSaveLog(save, action.type, '记忆摘要已更新');
      return '记忆摘要已更新';
    case 'NARRATIVE_BIND':
      if (action.tavernChatId !== undefined) save.narrative.tavernChatId = action.tavernChatId;
      if (action.messageId !== undefined) {
        save.narrative.firstBoundMessageId ??= action.messageId;
        save.narrative.latestProcessedMessageId = action.messageId;
      }
      pushSaveLog(save, action.type, '酒馆正文索引已绑定');
      return '酒馆正文索引已绑定';
    case 'LOG_ONLY':
      pushSaveLog(save, action.type, action.summary, true, action.relatedIds ?? []);
      return action.summary;
    default: {
      const neverAction: never = action;
      throw new Error(`未知动作：${JSON.stringify(neverAction)}`);
    }
  }
}

function setStage(save: GameSave, stage: OpeningGameStage): string {
  const previous = save.flow.gameStage;
  save.flow.previousStage = previous;
  save.flow.gameStage = stage;
  save.flow.enteredStageAt = nowIso();
  save.flow.canReturnBeforePrologue = stage === 'DifficultySelection' || stage === 'CharacterCreation';
  pushSaveLog(save, 'SAVE_STAGE_SET', `流程阶段：${previous} -> ${stage}`);
  return `流程阶段已切换：${stage}`;
}

function setDifficulty(save: GameSave, difficultyId: GameSave['opening']['difficultyId']): string {
  if (difficultyId === '') throw new Error('难度不能为空');
  const definition = getDifficultyDefinition(difficultyId);
  save.opening.difficultyId = definition.id;
  save.opening.difficultyName = definition.name;
  save.opening.difficultyPayload = definition.payload;
  setStage(save, 'CharacterCreation');
  pushSaveLog(save, 'DIFFICULTY_SET', `难度已选择：${definition.name}`);
  return `难度已选择：${definition.name}`;
}

function createCharacter(save: GameSave, payload: CharacterCreatePayload): string {
  save.player.profile = {
    name: payload.name,
    gender: payload.gender ?? '',
    avatarId: payload.avatarId ?? '',
    characterFullbodyIndex: payload.characterFullbodyIndex ?? 0,
    origin: payload.origin ?? '',
    spiritRoot: payload.spiritRoot ?? '',
    pathFocus: payload.pathFocus ?? '',
    temperament: payload.temperament ?? '',
  };
  setStage(save, 'OpeningPrologue');
  save.flow.canReturnBeforePrologue = false;
  pushSaveLog(save, 'CHARACTER_CREATE', `角色创建完成：${payload.name}`);
  return `角色创建完成：${payload.name}`;
}

function completePrologue(save: GameSave, skipped: boolean): string {
  const at = nowIso();
  save.opening.prologueCompleted = true;
  save.opening.prologueCompletedAt = at;
  save.opening.prologueSkipped = skipped;
  setStage(save, 'WorldMap');
  save.flow.canReturnBeforePrologue = false;
  pushSaveLog(save, 'PROLOGUE_COMPLETE', skipped ? '开场白已跳过并视为完成' : '开场白已完成');
  return skipped ? '开场白已跳过并视为完成' : '开场白已完成';
}

function shouldAskAi(action: GameAction): boolean {
  return (
    action.type === 'TRAVEL' ||
    action.type === 'MAP_TRAVEL_EXECUTE' ||
    action.type === 'SCENE_START' ||
    action.type === 'QUEST_ADVANCE' ||
    action.type === 'QUEST_EVIDENCE_RECORD' ||
    action.type === 'DIALOGUE_PLAN_BUILD' ||
    action.type === 'EVENT_GENERATE' ||
    action.type === 'EVENT_ACTIVATE' ||
    action.type === 'EVENT_RESOLVE' ||
    action.type === 'INTIMACY_AFFECTION_INTERACT' ||
    action.type === 'HAREM_ADMIT' ||
    action.type === 'HAREM_INTERACTION_RECORD' ||
    action.type === 'HAREM_CG_START' ||
    action.type === 'HAREM_CG_END' ||
    action.type === 'CONSEQUENCE_ADD' ||
    action.type === 'COMBAT_RESOLVE' ||
    action.type === 'BUSINESS_SETTLE' ||
    action.type === 'ECONOMY_SETTLE_ALL' ||
    action.type === 'ATB_BATTLE_COMMAND' ||
    action.type === 'ATB_BATTLE_AUTO' ||
    action.type === 'STRATEGY_TURN_RESOLVE'
  );
}
