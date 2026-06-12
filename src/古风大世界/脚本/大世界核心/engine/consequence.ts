import { createId, nowIso, pushSaveLog } from '../state/defaults';
import type { ConsequencePayload } from '../types/actions';
import type { GameSave } from '../types/schema';

export function addConsequence(save: GameSave, payload: ConsequencePayload): string {
  const consequenceId = createId('consequence');
  const severity = Math.max(0, Math.min(5, Math.floor(payload.severity ?? 1)));
  const at = nowIso();

  save.world.eventFlags[consequenceId] = {
    type: payload.type,
    summary: payload.summary,
    severity,
    at,
    relatedNpcIds: payload.relatedNpcIds ?? [],
    relatedFactionIds: payload.relatedFactionIds ?? [],
    relatedLocationIds: payload.relatedLocationIds ?? [],
  };

  for (const [flag, value] of Object.entries(payload.flags ?? {})) {
    save.world.worldFlags[flag] = value;
  }

  if (payload.type === 'identity_leaked') {
    save.world.wanted.level = Math.max(save.world.wanted.level, Math.min(5, severity || 1));
    save.world.wanted.reason = payload.summary;
    save.world.wanted.updatedAt = at;
    for (const locationId of payload.relatedLocationIds ?? []) {
      if (!save.world.wanted.spreadRegionIds.includes(locationId)) {
        save.world.wanted.spreadRegionIds.push(locationId);
      }
    }
  }

  for (const factionId of payload.relatedFactionIds ?? []) {
    const relation = save.relationship.factionRelations[factionId] ?? {
      factionId,
      reputation: 0,
      hostility: 0,
      relationFlags: {},
    };
    if (payload.type === 'befriend_faction') {
      relation.reputation += severity || 1;
    }
    if (payload.type === 'offend_authority' || payload.type === 'kill') {
      relation.hostility += severity || 1;
    }
    save.relationship.factionRelations[factionId] = relation;
  }

  pushSaveLog(save, 'CONSEQUENCE_ADD', payload.summary, true, [
    consequenceId,
    ...(payload.relatedNpcIds ?? []),
    ...(payload.relatedFactionIds ?? []),
    ...(payload.relatedLocationIds ?? []),
  ]);

  return `已记录后果：${payload.summary}`;
}
