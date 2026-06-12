import { createId, nowIso, pushSaveLog } from '../state/defaults';
import type { FactionRelationAdjustPayload, NpcRelationAdjustPayload, WorldReputationAdjustPayload } from '../types/relation';
import type { GameSave } from '../types/schema';

export function adjustNpcRelation(save: GameSave, payload: NpcRelationAdjustPayload): string {
  const relation = save.relationship.npcRelations[payload.npcId] ?? {
    npcId: payload.npcId,
    familiarity: 0,
    affection: 0,
    trust: 0,
    fear: 0,
    hostility: 0,
    loyalty: 0,
    relationFlags: {},
    lastInteractionAt: null,
  };
  relation.familiarity += payload.familiarity ?? 0;
  relation.affection += payload.affection ?? 0;
  relation.trust += payload.trust ?? 0;
  relation.fear += payload.fear ?? 0;
  relation.hostility += payload.hostility ?? 0;
  relation.loyalty += payload.loyalty ?? 0;
  relation.relationFlags = { ...relation.relationFlags, ...(payload.flags ?? {}) };
  relation.lastInteractionAt = nowIso();
  save.relationship.npcRelations[payload.npcId] = relation;
  recordRelationChange(save, 'npc', payload.npcId, payload.reason ?? `NPC关系调整：${payload.npcId}`);
  pushSaveLog(save, 'RELATION_NPC_ADJUST', payload.reason ?? `NPC关系调整：${payload.npcId}`, true, [payload.npcId]);
  return payload.reason ?? `NPC关系调整：${payload.npcId}`;
}

export function adjustFactionRelation(save: GameSave, payload: FactionRelationAdjustPayload): string {
  const relation = save.relationship.factionRelations[payload.factionId] ?? {
    factionId: payload.factionId,
    reputation: 0,
    hostility: 0,
    relationFlags: {},
  };
  relation.reputation += payload.reputation ?? 0;
  relation.hostility += payload.hostility ?? 0;
  relation.relationFlags = { ...relation.relationFlags, ...(payload.flags ?? {}) };
  save.relationship.factionRelations[payload.factionId] = relation;
  recordRelationChange(save, 'faction', payload.factionId, payload.reason ?? `势力关系调整：${payload.factionId}`);
  pushSaveLog(save, 'RELATION_FACTION_ADJUST', payload.reason ?? `势力关系调整：${payload.factionId}`, true, [
    payload.factionId,
  ]);
  return payload.reason ?? `势力关系调整：${payload.factionId}`;
}

export function adjustWorldReputation(save: GameSave, payload: WorldReputationAdjustPayload): string {
  save.world.reputation[payload.reputationId] = (save.world.reputation[payload.reputationId] ?? 0) + payload.amount;
  recordRelationChange(save, 'world', payload.reputationId, payload.reason ?? `名声调整：${payload.reputationId}`);
  pushSaveLog(save, 'REPUTATION_ADJUST', payload.reason ?? `名声调整：${payload.reputationId}`, true, [
    payload.reputationId,
  ]);
  return payload.reason ?? `名声调整：${payload.reputationId}`;
}

function recordRelationChange(save: GameSave, targetType: 'npc' | 'faction' | 'world', targetId: string, summary: string): void {
  save.relationship.recentChanges.unshift({
    changeId: createId('relation_change'),
    at: nowIso(),
    targetType,
    targetId,
    summary,
  });
  save.relationship.recentChanges = save.relationship.recentChanges.slice(0, 50);
}
