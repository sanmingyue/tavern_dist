import { createId, nowIso, pushSaveLog } from '../state/defaults';
import type { DialoguePlanRequest, DialogueSpeakerCandidate, DialogueTurnPlan } from '../types/dialogue';
import type { GameSave } from '../types/schema';
import { getActiveScene } from './scene';

export function buildDialoguePlan(save: GameSave, request: DialoguePlanRequest = {}): DialogueTurnPlan {
  const scene = request.sceneId ? save.scene.scenes[request.sceneId] : getActiveScene(save);
  const allowed = new Set(request.allowedSpeakerIds ?? []);
  const preferred = new Set(request.preferredSpeakerIds ?? []);
  const sceneParticipantIds = scene?.participantNpcIds ?? [];
  const locationNpcIds = save.npcs.npcIndex.byLocationId[save.player.location.currentLocationId] ?? [];
  const candidateIds = unique([...sceneParticipantIds, ...locationNpcIds, ...allowed]);
  const candidates = candidateIds.map(npcId =>
    buildSpeakerCandidate(save, npcId, sceneParticipantIds.includes(npcId), allowed.size === 0 || allowed.has(npcId), preferred.has(npcId)),
  );
  const speakerIds = candidates
    .filter(candidate => candidate.canSpeak)
    .sort((left, right) => right.priority - left.priority)
    .slice(0, Math.max(1, Math.min(4, candidates.length)))
    .map(candidate => candidate.speakerId);
  const plan: DialogueTurnPlan = {
    planId: createId('dialogue_plan'),
    sceneId: scene?.sceneId,
    createdAt: nowIso(),
    outputMode: save.narrative.lastEffectiveOutputMode,
    topic: request.topic ?? scene?.summary ?? '',
    speakerIds,
    candidates,
    includeThoughts: request.includeThoughts ?? true,
    summary: `台词调度：${speakerIds.length > 0 ? speakerIds.join('、') : '无人发言'}`,
  };
  save.dialogue.lastPlan = plan;
  save.dialogue.recentPlans.unshift(plan);
  save.dialogue.recentPlans = save.dialogue.recentPlans.slice(0, 20);
  pushSaveLog(save, 'DIALOGUE_PLAN_BUILD', plan.summary, true, speakerIds);
  return plan;
}

export function getAllowedSpeakerIds(save: GameSave): string[] {
  const scene = getActiveScene(save);
  if (scene) {
    return scene.participantNpcIds.filter(npcId => scene.participants[npcId]?.canSpeak !== false);
  }
  return save.npcs.npcIndex.byLocationId[save.player.location.currentLocationId] ?? [];
}

function buildSpeakerCandidate(
  save: GameSave,
  npcId: string,
  inScene: boolean,
  allowed: boolean,
  preferred: boolean,
): DialogueSpeakerCandidate {
  const profile = save.npcs.fixedNpcProfiles[npcId] ?? save.npcs.generatedNpcProfiles[npcId];
  const state = save.npcs.fixedNpcStates[npcId] ?? save.npcs.generatedNpcStates[npcId];
  const alive = state?.alive !== false;
  const visible = state?.discovered !== false || inScene;
  const canSpeak = Boolean(profile && alive && visible && allowed);
  return {
    speakerId: npcId,
    displayName: profile?.name ?? npcId,
    canSpeak,
    canThink: Boolean(profile && alive && visible),
    inScene,
    priority: (preferred ? 30 : 0) + (inScene ? 20 : 0) + (state?.met ? 8 : 0) + (state?.discovered ? 4 : 0),
    reason: canSpeak ? '在场且可发言' : '不在可发言范围',
  };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items.filter(Boolean))];
}

