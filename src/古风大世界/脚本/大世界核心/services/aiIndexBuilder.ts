import { getCharacterMemoryText } from '../engine/characterMemory';
import { getAllowedSpeakerIds } from '../engine/dialogue';
import { getQuestEvidenceIds } from '../engine/quest';
import { getActiveScene } from '../engine/scene';
import type { AiIndexBundle, AiIndexRequest } from '../types/aiIndex';
import type { GameSave } from '../types/schema';
import { buildAuthoritativeStateSummary, buildFormulaScanText } from './contextBuilder';

export function buildAiIndexBundle(save: GameSave, request: AiIndexRequest = {}): AiIndexBundle {
  const scene = request.sceneId ? save.scene.scenes[request.sceneId] : getActiveScene(save);
  const presentNpcIds = scene?.participantNpcIds ?? getAllowedSpeakerIds(save);
  const activeQuestIds = Object.keys(save.quests.active);
  const evidenceIds = getQuestEvidenceIds(save);
  const activeEventIds = Object.keys(save.events.active);
  const recentRelationTargets = save.relationship.recentChanges
    .slice(0, 8)
    .map(change => `${change.targetType}:${change.targetId}`);
  const haremMemberIds = Object.keys(save.intimacy.haremMembers);
  const eligibleHaremIds = Object.values(save.intimacy.roster)
    .filter(entry => entry.eligibleForHarem && !save.intimacy.haremMembers[entry.npcId])
    .map(entry => entry.npcId);
  const memoryNpcIds = request.includeMemories === false ? [] : presentNpcIds.filter(npcId => save.memory.npcMemory[npcId]);
  return {
    builtAt: new Date().toISOString(),
    actionType: request.actionType ?? 'unknown',
    authoritativeState: buildAuthoritativeStateSummary(save),
    formulaScan: request.includeFormulaScan === false ? undefined : buildFormulaScanText(save, request.actionType),
    currentLocationId: save.player.location.currentLocationId,
    currentRegionId: save.world.currentRegionId,
    sceneSummary: scene ? `${scene.title}：${scene.summary}` : '无激活场景',
    presentNpcIds,
    activeQuestIds,
    evidenceIds,
    activeEventIds,
    recentRelationTargets,
    lastTravelSummary: save.world.lastTravelPlan?.summary,
    haremMemberIds,
    eligibleHaremIds,
    activeCgSceneId: save.intimacy.activeCgSceneId ?? undefined,
    memoryNpcIds,
    tags: [
      ...(request.extraTags ?? []),
      save.narrative.currentSceneCategory,
      save.narrative.lastEffectiveOutputMode,
      ...save.narrative.currentSceneTags,
    ],
  };
}

export function buildAiIndexText(save: GameSave, request: AiIndexRequest = {}): string {
  const bundle = buildAiIndexBundle(save, request);
  const memories = request.includeMemories === false ? '' : getCharacterMemoryText(save, bundle.memoryNpcIds);
  return [
    '【AI索引组装】',
    `动作：${bundle.actionType}`,
    `位置：${bundle.currentRegionId}/${bundle.currentLocationId}`,
    `场景：${bundle.sceneSummary}`,
    `在场角色：${bundle.presentNpcIds.length > 0 ? bundle.presentNpcIds.join('、') : '无'}`,
    `活跃任务：${bundle.activeQuestIds.length > 0 ? bundle.activeQuestIds.join('、') : '无'}`,
    `已知线索：${bundle.evidenceIds.length > 0 ? bundle.evidenceIds.join('、') : '无'}`,
    `活跃事件：${bundle.activeEventIds.length > 0 ? bundle.activeEventIds.join('、') : '无'}`,
    `近期关系：${bundle.recentRelationTargets.length > 0 ? bundle.recentRelationTargets.join('、') : '无'}`,
    `上一行路：${bundle.lastTravelSummary ?? '无'}`,
    `后宫成员：${bundle.haremMemberIds.length > 0 ? bundle.haremMemberIds.join('、') : '无'}`,
    `满好感待收入：${bundle.eligibleHaremIds.length > 0 ? bundle.eligibleHaremIds.join('、') : '无'}`,
    `活动CG：${bundle.activeCgSceneId ?? '无'}`,
    `标签：${bundle.tags.join('、')}`,
    bundle.authoritativeState,
    bundle.formulaScan ?? '',
    memories,
  ]
    .filter(Boolean)
    .join('\n');
}
