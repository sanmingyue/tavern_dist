import { nowIso, pushSaveLog } from '../state/defaults';
import type { CharacterMemoryAppendPayload, CharacterMemorySetPayload } from '../types/characterMemory';
import type { GameSave } from '../types/schema';

export function setCharacterMemory(save: GameSave, payload: CharacterMemorySetPayload): string {
  save.memory.npcMemory[payload.npcId] = {
    npcId: payload.npcId,
    summary: payload.summary,
    importantEvents: payload.importantEvents ?? [],
    lastUpdatedAt: nowIso(),
  };
  save.memory.memoryIndex[payload.npcId] = [payload.npcId];
  pushSaveLog(save, 'CHARACTER_MEMORY_SET', `角色记忆已设置：${payload.npcId}`, true, [payload.npcId]);
  return `角色记忆已设置：${payload.npcId}`;
}

export function appendCharacterMemory(save: GameSave, payload: CharacterMemoryAppendPayload): string {
  const memory = save.memory.npcMemory[payload.npcId] ?? {
    npcId: payload.npcId,
    summary: '',
    importantEvents: [],
    lastUpdatedAt: nowIso(),
  };
  const nextLine = `${nowIso()}：${payload.summary}`;
  memory.summary = [memory.summary, nextLine].filter(Boolean).join('\n').slice(-2400);
  if (payload.important) {
    memory.importantEvents = [payload.summary, ...memory.importantEvents].slice(0, 20);
  }
  memory.lastUpdatedAt = nowIso();
  save.memory.npcMemory[payload.npcId] = memory;
  save.memory.memoryIndex[payload.npcId] = [payload.npcId, ...(payload.sourceId ? [payload.sourceId] : [])];
  pushSaveLog(save, 'CHARACTER_MEMORY_APPEND', `角色记忆已追加：${payload.npcId}`, true, [payload.npcId]);
  return `角色记忆已追加：${payload.npcId}`;
}

export function getCharacterMemoryText(save: GameSave, npcIds: string[]): string {
  return npcIds
    .map(npcId => save.memory.npcMemory[npcId])
    .filter(Boolean)
    .map(memory => `【${memory.npcId}记忆】\n${memory.summary}`)
    .join('\n\n');
}
