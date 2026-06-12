import { createId, nowIso, pushSaveLog } from '../state/defaults';
import type { QuestAcceptPayload, QuestAdvancePayload, QuestDefinition, QuestEvidencePayload } from '../types/quest';
import type { GameSave } from '../types/schema';

export function upsertQuestDefinition(save: GameSave, definition: QuestDefinition): string {
  save.quests.definitions[definition.questId] = definition;
  pushSaveLog(save, 'QUEST_DEFINITION_UPSERT', `任务定义已登记：${definition.title}`, true, [definition.questId]);
  return `任务定义已登记：${definition.title}`;
}

export function acceptQuest(save: GameSave, payload: QuestAcceptPayload): string {
  if (payload.definition) upsertQuestDefinition(save, payload.definition);
  const definition = payload.definition ?? (save.quests.definitions[payload.questId] as QuestDefinition | undefined);
  const stepId = payload.stepId ?? definition?.startStepId ?? 'start';
  const at = nowIso();
  save.quests.active[payload.questId] = {
    questId: payload.questId,
    status: 'active',
    currentStepId: stepId,
    acceptedAt: at,
    updatedAt: at,
    relatedNpcIds: unique([...(definition?.relatedNpcIds ?? []), ...(payload.relatedNpcIds ?? [])]),
    relatedLocationIds: unique([...(definition?.relatedLocationIds ?? []), ...(payload.relatedLocationIds ?? [])]),
    state: {},
  };
  delete save.quests.completed[payload.questId];
  delete save.quests.failed[payload.questId];
  pushSaveLog(save, 'QUEST_ACCEPT', `任务已接取：${payload.questId}`, true, [payload.questId]);
  return `任务已接取：${payload.questId}`;
}

export function advanceQuest(save: GameSave, payload: QuestAdvancePayload): string {
  const quest = save.quests.active[payload.questId] ?? save.quests.completed[payload.questId] ?? save.quests.failed[payload.questId];
  if (!quest) throw new Error(`任务不存在：${payload.questId}`);
  quest.currentStepId = payload.stepId;
  quest.updatedAt = nowIso();
  quest.status = payload.status ?? 'active';
  quest.state.lastNote = payload.note ?? '';
  delete save.quests.active[payload.questId];
  delete save.quests.completed[payload.questId];
  delete save.quests.failed[payload.questId];
  if (quest.status === 'completed') save.quests.completed[payload.questId] = quest;
  else if (quest.status === 'failed') save.quests.failed[payload.questId] = quest;
  else save.quests.active[payload.questId] = quest;
  pushSaveLog(save, 'QUEST_ADVANCE', `任务推进：${payload.questId} -> ${payload.stepId}`, true, [payload.questId]);
  return `任务推进：${payload.questId} -> ${payload.stepId}`;
}

export function recordQuestEvidence(save: GameSave, payload: QuestEvidencePayload): string {
  const evidenceId = payload.evidenceId ?? createId('evidence');
  save.quests.evidence[evidenceId] = {
    evidenceId,
    questId: payload.questId,
    title: payload.title,
    summary: payload.summary,
    foundAt: nowIso(),
    sourceId: payload.sourceId,
    relatedNpcIds: payload.relatedNpcIds ?? [],
    relatedLocationIds: payload.relatedLocationIds ?? [],
    tags: payload.tags ?? [],
  };
  if (payload.questId && save.quests.active[payload.questId]) {
    const quest = save.quests.active[payload.questId];
    const evidenceIds = Array.isArray(quest.state.evidenceIds) ? (quest.state.evidenceIds as string[]) : [];
    quest.state.evidenceIds = unique([...evidenceIds, evidenceId]);
    quest.updatedAt = nowIso();
    save.quests.active[payload.questId] = quest;
  }
  pushSaveLog(save, 'QUEST_EVIDENCE_RECORD', `线索已记录：${payload.title}`, true, [
    evidenceId,
    payload.questId ?? '',
  ].filter(Boolean));
  return `线索已记录：${payload.title}`;
}

export function getQuestEvidenceIds(save: GameSave, questId?: string): string[] {
  return Object.values(save.quests.evidence)
    .filter(evidence => !questId || evidence.questId === questId)
    .map(evidence => evidence.evidenceId);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

