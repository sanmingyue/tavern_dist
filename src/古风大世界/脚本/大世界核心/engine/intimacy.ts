import { createId, nowIso, pushSaveLog } from '../state/defaults';
import { MAX_INTIMACY_AFFECTION } from '../types/intimacy';
import type {
  AffectionInteractionPayload,
  FemaleRosterEntry,
  FemaleRosterRegisterPayload,
  HaremAdmitPayload,
  HaremBoundaryPlaceholderPayload,
  HaremCgEndPayload,
  HaremCgStartPayload,
  HaremInteractionPayload,
  HaremRankSetPayload,
} from '../types/intimacy';
import type { GameSave } from '../types/schema';

export function registerFemaleRosterEntry(save: GameSave, payload: FemaleRosterRegisterPayload): string {
  const entry = ensureFemaleRosterEntry(save, payload);
  save.intimacy.roster[entry.npcId] = entry;
  pushSaveLog(save, 'INTIMACY_ROSTER_REGISTER', `女性栏目已登记：${entry.displayName}`, true, [entry.npcId]);
  return `女性栏目已登记：${entry.displayName}`;
}

export function listFemaleRoster(save: GameSave): FemaleRosterEntry[] {
  return Object.values(save.intimacy.roster).sort((left, right) => {
    const leftHarem = save.intimacy.haremMembers[left.npcId] ? 1 : 0;
    const rightHarem = save.intimacy.haremMembers[right.npcId] ? 1 : 0;
    if (leftHarem !== rightHarem) return rightHarem - leftHarem;
    if (left.eligibleForHarem !== right.eligibleForHarem) return left.eligibleForHarem ? -1 : 1;
    return left.displayName.localeCompare(right.displayName);
  });
}

export function recordAffectionInteraction(save: GameSave, payload: AffectionInteractionPayload): string {
  const entry = ensureFemaleRosterEntry(save, { npcId: payload.npcId, source: 'manual', discovered: true });
  const relation = ensureNpcRelation(save, payload.npcId);
  relation.familiarity = clampRelation(relation.familiarity + (payload.familiarityDelta ?? 1));
  relation.trust = clampRelation(relation.trust + (payload.trustDelta ?? 0));
  relation.affection = clampRelation(relation.affection + (payload.affectionDelta ?? 0));
  relation.lastInteractionAt = nowIso();
  save.relationship.npcRelations[payload.npcId] = relation;

  entry.eligibleForHarem = relation.affection >= MAX_INTIMACY_AFFECTION || entry.eligibleForHarem;
  entry.discovered = true;
  entry.tags = unique([...(entry.tags ?? []), ...(payload.tags ?? [])]);
  save.intimacy.roster[payload.npcId] = entry;

  const title = payload.title ?? interactionTitle(payload.kind);
  recordIntimacyInteraction(save, {
    npcId: payload.npcId,
    kind: payload.kind,
    title,
    summary: payload.summary ?? title,
    cgSceneId: '',
    cgAssetIds: [],
    tags: payload.tags ?? [],
  });

  if (payload.sceneMode && payload.sceneMode !== 'none') {
    save.narrative.currentSceneCategory = 'intimacy';
    save.narrative.currentSceneTags = unique(['female_roster', payload.sceneMode, ...(payload.tags ?? [])]);
  }

  const suffix = entry.eligibleForHarem ? '；已满足收入条件' : '';
  pushSaveLog(save, 'INTIMACY_AFFECTION_INTERACT', `${entry.displayName}好感互动：${title}${suffix}`, true, [
    payload.npcId,
  ]);
  return `${entry.displayName}好感互动：${title}${suffix}`;
}

export function admitHaremMember(save: GameSave, payload: HaremAdmitPayload): string {
  const relation = ensureNpcRelation(save, payload.npcId);
  if (relation.affection < MAX_INTIMACY_AFFECTION) {
    throw new Error(`好感度未满，不能收入后宫：${payload.npcId}`);
  }

  const entry = ensureFemaleRosterEntry(save, { npcId: payload.npcId, source: 'manual', discovered: true });
  const at = nowIso();
  const rankName = payload.rankName ?? defaultRankName(payload.rankId);
  save.intimacy.haremMembers[payload.npcId] = {
    npcId: payload.npcId,
    rankId: payload.rankId,
    rankName,
    admittedAt: at,
    admissionRoute: payload.route ?? 'plot',
    homeLocationId: payload.locationId ?? entry.locationId ?? save.player.location.currentLocationId,
    lastInteractionAt: at,
    mood: 50,
    interactionCount: 0,
    cgUnlocked: true,
    flags: {},
    tags: payload.tags ?? [],
  };
  entry.eligibleForHarem = true;
  entry.discovered = true;
  save.intimacy.roster[payload.npcId] = entry;
  save.collection.beauties[payload.npcId] = {
    npcId: payload.npcId,
    collectionState: '后宫',
    recruitedAt: at,
    assignedRole: rankName,
    growth: {},
    flags: { harem: true },
  };
  recordIntimacyInteraction(save, {
    npcId: payload.npcId,
    kind: 'harem_admit',
    title: `收入后宫：${rankName}`,
    summary: payload.summary ?? `收入后宫，位分为${rankName}`,
    cgSceneId: '',
    cgAssetIds: [],
    tags: payload.tags ?? [],
  });
  save.narrative.currentSceneCategory = 'intimacy';
  save.narrative.currentSceneTags = unique(['harem_admission', payload.route ?? 'plot', ...(payload.tags ?? [])]);
  pushSaveLog(save, 'HAREM_ADMIT', `${entry.displayName}已收入后宫：${rankName}`, true, [payload.npcId]);
  return `${entry.displayName}已收入后宫：${rankName}`;
}

export function setHaremRank(save: GameSave, payload: HaremRankSetPayload): string {
  const member = requireHaremMember(save, payload.npcId);
  member.rankId = payload.rankId;
  member.rankName = payload.rankName ?? defaultRankName(payload.rankId);
  member.lastInteractionAt = nowIso();
  save.intimacy.haremMembers[payload.npcId] = member;
  if (save.collection.beauties[payload.npcId]) {
    save.collection.beauties[payload.npcId].assignedRole = member.rankName;
  }
  recordIntimacyInteraction(save, {
    npcId: payload.npcId,
    kind: 'harem_rank_set',
    title: `后宫位分调整：${member.rankName}`,
    summary: payload.summary ?? `位分调整为${member.rankName}`,
    cgSceneId: '',
    cgAssetIds: [],
    tags: [],
  });
  pushSaveLog(save, 'HAREM_RANK_SET', `${payload.npcId}位分已调整：${member.rankName}`, true, [payload.npcId]);
  return `${payload.npcId}位分已调整：${member.rankName}`;
}

export function recordHaremInteraction(save: GameSave, payload: HaremInteractionPayload): string {
  const member = requireHaremMember(save, payload.npcId);
  const relation = ensureNpcRelation(save, payload.npcId);
  relation.affection = clampRelation(relation.affection + (payload.affectionDelta ?? 0));
  relation.lastInteractionAt = nowIso();
  save.relationship.npcRelations[payload.npcId] = relation;

  member.mood = clampMood(member.mood + (payload.moodDelta ?? 0));
  member.interactionCount += 1;
  member.lastInteractionAt = nowIso();
  save.intimacy.haremMembers[payload.npcId] = member;

  const title = payload.title ?? haremInteractionTitle(payload.kind);
  recordIntimacyInteraction(save, {
    npcId: payload.npcId,
    kind: payload.kind,
    title,
    summary: payload.summary ?? title,
    cgSceneId: payload.cgSceneId ?? '',
    cgAssetIds: payload.cgAssetIds ?? [],
    tags: payload.tags ?? [],
  });
  save.narrative.currentSceneCategory = 'intimacy';
  save.narrative.currentSceneTags = unique(['harem', String(payload.kind), ...(payload.tags ?? [])]);
  pushSaveLog(save, 'HAREM_INTERACTION_RECORD', `${payload.npcId}后宫互动：${title}`, true, [payload.npcId]);
  return `${payload.npcId}后宫互动：${title}`;
}

export function startHaremCgMode(save: GameSave, payload: HaremCgStartPayload): string {
  const member = requireHaremMember(save, payload.npcId);
  if (!member.cgUnlocked) throw new Error(`CG模式未开启：${payload.npcId}`);
  const sceneId = payload.sceneId ?? createId('harem_cg');
  const title = payload.title ?? `${getNpcDisplayName(save, payload.npcId)}的亲密CG`;
  save.intimacy.cgScenes[sceneId] = {
    sceneId,
    npcId: payload.npcId,
    title,
    status: 'active',
    startedAt: nowIso(),
    endedAt: null,
    locationId: payload.locationId ?? save.player.location.currentLocationId,
    cgAssetIds: payload.cgAssetIds ?? [],
    summary: payload.summary ?? title,
    tags: unique(['harem', 'cg', ...(payload.tags ?? [])]),
  };
  save.intimacy.activeCgSceneId = sceneId;
  save.narrative.currentSceneCategory = 'intimacy';
  save.narrative.currentSceneTags = unique(['harem', 'cg_mode', ...(payload.tags ?? [])]);
  recordHaremInteraction(save, {
    npcId: payload.npcId,
    kind: 'cg_intimacy',
    title,
    summary: payload.summary ?? title,
    cgSceneId: sceneId,
    cgAssetIds: payload.cgAssetIds ?? [],
    tags: payload.tags ?? [],
  });
  pushSaveLog(save, 'HAREM_CG_START', `CG模式已开启：${title}`, true, [payload.npcId, sceneId]);
  return `CG模式已开启：${title}`;
}

export function endHaremCgMode(save: GameSave, payload: HaremCgEndPayload = {}): string {
  const sceneId = payload.sceneId ?? save.intimacy.activeCgSceneId ?? '';
  const scene = save.intimacy.cgScenes[sceneId];
  if (!scene) throw new Error(`CG场景不存在：${sceneId || '未指定'}`);
  scene.status = 'completed';
  scene.endedAt = nowIso();
  scene.summary = payload.summary ?? scene.summary;
  scene.cgAssetIds = unique([...scene.cgAssetIds, ...(payload.cgAssetIds ?? [])]);
  save.intimacy.cgScenes[sceneId] = scene;
  if (save.intimacy.activeCgSceneId === sceneId) save.intimacy.activeCgSceneId = null;
  for (const albumId of payload.unlockAlbumIds ?? []) save.collection.albums[albumId] = true;
  for (const assetId of scene.cgAssetIds) save.collection.albums[`cg:${assetId}`] = true;
  pushSaveLog(save, 'HAREM_CG_END', `CG模式已结束：${scene.title}`, true, [scene.npcId, sceneId]);
  return `CG模式已结束：${scene.title}`;
}

export function recordHaremBoundaryPlaceholder(save: GameSave, payload: HaremBoundaryPlaceholderPayload): string {
  const placeholderId = createId('harem_boundary');
  const npcPower = getNpcPowerTier(save, payload.npcId);
  const risk = payload.riskHint ?? (npcPower >= 70 ? '高风险，后续可能转入战斗或严重后果' : '占位，后续再定义判定');
  save.intimacy.boundaryPlaceholders[placeholderId] = {
    placeholderId,
    npcId: payload.npcId,
    createdAt: nowIso(),
    locationId: payload.locationId ?? save.player.location.currentLocationId,
    summary: payload.summary ?? '后续定义的越界判定占位',
    riskHint: risk,
    status: 'placeholder',
  };
  pushSaveLog(save, 'HAREM_BOUNDARY_PLACEHOLDER', `越界判定占位已记录：${payload.npcId}`, true, [
    payload.npcId,
    placeholderId,
  ]);
  return `越界判定占位已记录：${payload.npcId}`;
}

export function getHaremAvailableActions(save: GameSave, npcId: string): string[] {
  const relation = save.relationship.npcRelations[npcId];
  if (save.intimacy.haremMembers[npcId]) {
    return [
      'chat',
      'gift',
      'date',
      'private_time',
      'intimacy_invite',
      'cg_intimacy',
      'sleepover',
      'comfort',
      'assignment',
      'status_change',
    ];
  }
  const actions = ['talk', 'airp_dialogue', 'classic_airp', 'gift', 'outing', 'aid', 'poetry', 'quest', 'business'];
  if ((relation?.affection ?? 0) >= MAX_INTIMACY_AFFECTION) actions.push('admit_harem');
  actions.push('boundary_placeholder');
  return actions;
}

function ensureFemaleRosterEntry(save: GameSave, payload: FemaleRosterRegisterPayload): FemaleRosterEntry {
  const existing = save.intimacy.roster[payload.npcId];
  const displayName = payload.displayName ?? existing?.displayName ?? getNpcDisplayName(save, payload.npcId);
  const relation = save.relationship.npcRelations[payload.npcId];
  return {
    npcId: payload.npcId,
    displayName,
    source: payload.source ?? existing?.source ?? inferNpcSource(save, payload.npcId),
    locationId: payload.locationId ?? existing?.locationId ?? getNpcLocation(save, payload.npcId),
    discovered: payload.discovered ?? existing?.discovered ?? false,
    eligibleForHarem: existing?.eligibleForHarem ?? (relation?.affection ?? 0) >= MAX_INTIMACY_AFFECTION,
    tags: unique([...(existing?.tags ?? []), ...(payload.tags ?? [])]),
    notes: payload.notes ?? existing?.notes ?? '',
  };
}

function ensureNpcRelation(save: GameSave, npcId: string): GameSave['relationship']['npcRelations'][string] {
  save.relationship.npcRelations[npcId] ??= {
    npcId,
    familiarity: 0,
    affection: 0,
    trust: 0,
    fear: 0,
    hostility: 0,
    loyalty: 0,
    relationFlags: {},
    lastInteractionAt: null,
  };
  return save.relationship.npcRelations[npcId];
}

function requireHaremMember(save: GameSave, npcId: string): GameSave['intimacy']['haremMembers'][string] {
  const member = save.intimacy.haremMembers[npcId];
  if (!member) throw new Error(`尚未收入后宫：${npcId}`);
  return member;
}

function recordIntimacyInteraction(
  save: GameSave,
  input: {
    npcId: string;
    kind: string;
    title: string;
    summary: string;
    cgSceneId: string;
    cgAssetIds: string[];
    tags: string[];
  },
): void {
  const interactionId = createId('intimacy_interaction');
  save.intimacy.interactions[interactionId] = {
    interactionId,
    npcId: input.npcId,
    kind: input.kind,
    title: input.title,
    summary: input.summary,
    at: nowIso(),
    locationId: save.player.location.currentLocationId,
    cgSceneId: input.cgSceneId,
    cgAssetIds: input.cgAssetIds,
    tags: input.tags,
  };
  save.intimacy.recentInteractionIds = [interactionId, ...save.intimacy.recentInteractionIds].slice(0, 80);
}

function getNpcDisplayName(save: GameSave, npcId: string): string {
  return save.npcs.fixedNpcProfiles[npcId]?.name ?? save.npcs.generatedNpcProfiles[npcId]?.name ?? npcId;
}

function getNpcLocation(save: GameSave, npcId: string): string {
  return (
    save.npcs.fixedNpcStates[npcId]?.currentLocationId ??
    save.npcs.fixedNpcProfiles[npcId]?.currentLocationId ??
    save.npcs.generatedNpcStates[npcId]?.currentLocationId ??
    save.npcs.generatedNpcProfiles[npcId]?.originLocationId ??
    save.player.location.currentLocationId
  );
}

function getNpcPowerTier(save: GameSave, npcId: string): number {
  return save.npcs.fixedNpcProfiles[npcId]?.powerTier ?? 0;
}

function inferNpcSource(save: GameSave, npcId: string): string {
  if (save.npcs.fixedNpcProfiles[npcId]) return 'fixed';
  if (save.npcs.generatedNpcProfiles[npcId]) return 'generated';
  if (save.collection.beauties[npcId]) return 'collection';
  return 'manual';
}

function interactionTitle(kind: string): string {
  const titles: Record<string, string> = {
    talk: '交谈',
    airp_dialogue: 'AIRP对话',
    classic_airp: '正文互动',
    gift: '送礼',
    outing: '同行',
    aid: '相助',
    poetry: '诗会',
    quest: '事件牵连',
    business: '经营安排',
  };
  return titles[kind] ?? '自定义互动';
}

function haremInteractionTitle(kind: string): string {
  const titles: Record<string, string> = {
    chat: '后宫闲谈',
    gift: '后宫赠礼',
    date: '私约同行',
    private_time: '独处',
    intimacy_invite: '亲密邀请',
    cg_intimacy: 'CG亲密',
    sleepover: '留宿',
    comfort: '安抚',
    assignment: '后宫安排',
    status_change: '状态调整',
  };
  return titles[kind] ?? '后宫互动';
}

function defaultRankName(rankId: string): string {
  const names: Record<string, string> = {
    wife: '正室',
    concubine: '小妾',
    maid: '丫鬟',
    companion: '侍伴',
    guest: '内院贵客',
    custom: '自定义位分',
  };
  return names[rankId] ?? rankId;
}

function clampRelation(value: number): number {
  return Math.max(0, Math.min(MAX_INTIMACY_AFFECTION, Math.round(value)));
}

function clampMood(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items.filter(Boolean))];
}

