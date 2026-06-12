import { nowIso, pushSaveLog } from '../state/defaults';
import type { FixedCharacterMovePayload, FixedCharacterProfile, FixedCharacterQuery } from '../types/characters';
import type { GameSave } from '../types/schema';

export function upsertFixedCharacter(save: GameSave, profile: FixedCharacterProfile): string {
  const currentLocationId = profile.currentLocationId ?? profile.initialLocationId ?? profile.homeLocationId ?? 'unknown';
  save.npcs.fixedNpcProfiles[profile.npcId] = {
    ...profile,
    aliases: profile.aliases ?? [],
    factionId: profile.factionId ?? '',
    homeLocationId: profile.homeLocationId ?? 'unknown',
    initialLocationId: profile.initialLocationId ?? currentLocationId,
    currentLocationId,
    rankTitle: profile.rankTitle ?? '',
    powerTier: profile.powerTier ?? 0,
    beautyRegisterId: profile.beautyRegisterId ?? '',
    ageText: profile.ageText ?? '',
    regionText: profile.regionText ?? '',
    usualLocationText: profile.usualLocationText ?? '',
    publicIdentity: profile.publicIdentity ?? '',
    factionName: profile.factionName ?? '',
    actualInvolvement: profile.actualInvolvement ?? '',
    martialDirection: profile.martialDirection ?? '',
    powerRankText: profile.powerRankText ?? '',
    beautyRankText: profile.beautyRankText ?? '',
    offerText: profile.offerText ?? '',
    fearText: profile.fearText ?? '',
    currentSituation: profile.currentSituation ?? '',
    appearanceProfile: profile.appearanceProfile ?? '',
    personalityPlaceholder: profile.personalityPlaceholder ?? '',
    sourcePath: profile.sourcePath ?? '',
    formulaResourceIds: profile.formulaResourceIds ?? [],
    tags: profile.tags ?? [],
  };
  save.npcs.fixedNpcStates[profile.npcId] ??= {
    npcId: profile.npcId,
    currentLocationId,
    alive: true,
    met: false,
    discovered: false,
    statusFlags: {},
    runtimeNotes: '',
  };
  save.npcs.fixedNpcStates[profile.npcId].currentLocationId = currentLocationId;
  rebuildNpcLocationIndex(save);
  pushSaveLog(save, 'FIXED_CHARACTER_UPSERT', `固定角色已登记：${profile.name}`, true, [profile.npcId]);
  return `固定角色已登记：${profile.name}`;
}

export function moveFixedCharacter(save: GameSave, payload: FixedCharacterMovePayload): string {
  const state = save.npcs.fixedNpcStates[payload.npcId];
  const profile = save.npcs.fixedNpcProfiles[payload.npcId];
  if (!state && !profile) throw new Error(`固定角色不存在：${payload.npcId}`);
  const nextState = state ?? {
    npcId: payload.npcId,
    currentLocationId: payload.targetLocationId,
    alive: true,
    met: false,
    discovered: false,
    statusFlags: {},
    runtimeNotes: '',
  };
  nextState.currentLocationId = payload.targetLocationId;
  if (payload.discovered !== undefined) nextState.discovered = payload.discovered;
  save.npcs.fixedNpcStates[payload.npcId] = nextState;
  if (profile) {
    profile.currentLocationId = payload.targetLocationId;
    save.npcs.fixedNpcProfiles[payload.npcId] = profile;
  }
  rebuildNpcLocationIndex(save);
  pushSaveLog(save, 'FIXED_CHARACTER_MOVE', `${payload.npcId}移动至${payload.targetLocationId}`, true, [
    payload.npcId,
    payload.targetLocationId,
  ]);
  return `${payload.npcId}移动至${payload.targetLocationId}`;
}

export function discoverFixedCharacter(save: GameSave, npcId: string, met = true): string {
  const state = save.npcs.fixedNpcStates[npcId];
  if (!state) throw new Error(`固定角色不存在：${npcId}`);
  state.discovered = true;
  state.met = met || state.met;
  save.npcs.fixedNpcStates[npcId] = state;
  pushSaveLog(save, 'FIXED_CHARACTER_DISCOVER', `固定角色已发现：${npcId}`, true, [npcId]);
  return `固定角色已发现：${npcId}`;
}

export function queryFixedCharacters(save: GameSave, query: FixedCharacterQuery = {}): FixedCharacterProfile[] {
  return Object.values(save.npcs.fixedNpcProfiles).filter(profile => {
    const state = save.npcs.fixedNpcStates[profile.npcId];
    if (query.locationId && (state?.currentLocationId ?? profile.currentLocationId) !== query.locationId) return false;
    if (query.factionId && profile.factionId !== query.factionId) return false;
    if (query.tag && !profile.tags.includes(query.tag)) return false;
    if (query.discoveredOnly && !state?.discovered) return false;
    if (query.aliveOnly && state?.alive === false) return false;
    return true;
  });
}

export function getFixedCharactersAtLocation(save: GameSave, locationId = save.player.location.currentLocationId): FixedCharacterProfile[] {
  return queryFixedCharacters(save, { locationId, aliveOnly: true });
}

export function rebuildNpcLocationIndex(save: GameSave): void {
  const byLocationId: Record<string, string[]> = {};
  const byFactionId: Record<string, string[]> = {};
  const byTag: Record<string, string[]> = {};
  for (const profile of Object.values(save.npcs.fixedNpcProfiles)) {
    const state = save.npcs.fixedNpcStates[profile.npcId];
    const locationId = state?.currentLocationId ?? profile.currentLocationId ?? 'unknown';
    pushIndex(byLocationId, locationId, profile.npcId);
    if (profile.factionId) pushIndex(byFactionId, profile.factionId, profile.npcId);
    for (const tag of profile.tags) pushIndex(byTag, tag, profile.npcId);
  }
  for (const profile of Object.values(save.npcs.generatedNpcProfiles)) {
    const state = save.npcs.generatedNpcStates[profile.npcId];
    pushIndex(byLocationId, state?.currentLocationId ?? profile.originLocationId ?? 'unknown', profile.npcId);
    if (profile.factionId) pushIndex(byFactionId, profile.factionId, profile.npcId);
    for (const tag of profile.tags) pushIndex(byTag, tag, profile.npcId);
  }
  save.npcs.npcIndex = { byLocationId, byFactionId, byTag };
}

export function markFixedCharacterRuntimeNote(save: GameSave, npcId: string, note: string): string {
  const state = save.npcs.fixedNpcStates[npcId];
  if (!state) throw new Error(`固定角色不存在：${npcId}`);
  state.runtimeNotes = note;
  state.statusFlags.updatedAt = true;
  save.npcs.fixedNpcStates[npcId] = state;
  pushSaveLog(save, 'FIXED_CHARACTER_NOTE', `固定角色备注已更新：${npcId}`, true, [npcId]);
  return `${npcId}备注已更新于${nowIso()}`;
}

function pushIndex(index: Record<string, string[]>, key: string, npcId: string): void {
  index[key] ??= [];
  if (!index[key].includes(npcId)) index[key].push(npcId);
}
