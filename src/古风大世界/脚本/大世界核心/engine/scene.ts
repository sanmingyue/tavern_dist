import { createId, nowIso, pushSaveLog } from '../state/defaults';
import type { SceneParticipantState, ScenePresencePayload, SceneStartPayload, SceneState } from '../types/scene';
import type { GameSave } from '../types/schema';

export function startScene(save: GameSave, payload: SceneStartPayload): string {
  const at = nowIso();
  const sceneId = payload.sceneId ?? createId('scene');
  const participantNpcIds = unique(payload.participantNpcIds ?? []);
  const participants = Object.fromEntries(
    participantNpcIds.map(npcId => [
      npcId,
      {
        npcId,
        present: true,
        canSpeak: true,
        canAct: true,
        visible: true,
        role: '',
      } satisfies SceneParticipantState,
    ]),
  );
  const scene: SceneState = {
    sceneId,
    title: payload.title,
    status: 'active',
    locationId: payload.locationId ?? save.player.location.currentLocationId,
    category: payload.category ?? save.narrative.currentSceneCategory ?? 'free',
    startedAt: at,
    updatedAt: at,
    participantNpcIds,
    participants,
    tags: payload.tags ?? [],
    summary: payload.summary ?? '',
  };
  save.scene.scenes[sceneId] = scene;
  save.scene.activeSceneId = sceneId;
  save.scene.recentSceneIds = unique([sceneId, ...save.scene.recentSceneIds]).slice(0, 20);
  save.narrative.currentSceneCategory = scene.category;
  save.narrative.currentSceneTags = scene.tags;
  pushSaveLog(save, 'SCENE_START', `场景开始：${scene.title}`, true, [sceneId, ...participantNpcIds]);
  return `场景开始：${scene.title}`;
}

export function closeScene(save: GameSave, sceneId = save.scene.activeSceneId ?? ''): string {
  const scene = requireScene(save, sceneId);
  scene.status = 'closed';
  scene.updatedAt = nowIso();
  save.scene.scenes[scene.sceneId] = scene;
  if (save.scene.activeSceneId === scene.sceneId) save.scene.activeSceneId = null;
  pushSaveLog(save, 'SCENE_END', `场景结束：${scene.title}`, true, [scene.sceneId]);
  return `场景结束：${scene.title}`;
}

export function setScenePresence(save: GameSave, payload: ScenePresencePayload): string {
  const scene = requireScene(save, payload.sceneId ?? save.scene.activeSceneId ?? '');
  const nextParticipants = payload.replace ? {} : { ...scene.participants };
  for (const participant of payload.participants) {
    nextParticipants[participant.npcId] = participant;
  }
  scene.participants = nextParticipants;
  scene.participantNpcIds = Object.values(nextParticipants)
    .filter(participant => participant.present)
    .map(participant => participant.npcId);
  scene.updatedAt = nowIso();
  save.scene.scenes[scene.sceneId] = scene;
  pushSaveLog(save, 'SCENE_PRESENCE_SET', `场景在场角色已更新：${scene.title}`, true, [
    scene.sceneId,
    ...scene.participantNpcIds,
  ]);
  return `场景在场角色已更新：${scene.title}`;
}

export function getActiveScene(save: GameSave): SceneState | null {
  return save.scene.activeSceneId ? (save.scene.scenes[save.scene.activeSceneId] as SceneState | undefined) ?? null : null;
}

export function requireScene(save: GameSave, sceneId: string): SceneState {
  const scene = save.scene.scenes[sceneId] as SceneState | undefined;
  if (!scene) throw new Error(`场景不存在：${sceneId || '未指定'}`);
  return scene;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

