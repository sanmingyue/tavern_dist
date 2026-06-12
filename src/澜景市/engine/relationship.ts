import type { ActionResult } from '../types/actions';
import type { GameSave, Memory } from '../types/schema';

function relationLabel(favorability: number): string {
  if (favorability >= 90) return '恋人';
  if (favorability >= 70) return '好友';
  if (favorability >= 40) return '朋友';
  if (favorability >= 10) return '认识';
  if (favorability <= -30) return '厌恶';
  return '陌生人';
}

export function updateRelationship(save: GameSave, charId: string, delta: number, event: string): ActionResult {
  const char = save.chars[charId];
  if (!char) return { ok: false, tone: 'red', message: `未知角色：${charId}`, save };
  char.relationship.favorability += delta;
  char.relationship.label = relationLabel(char.relationship.favorability);
  char.relationship.memories.push({
    id: `memory_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: save.time.current,
    event,
    delta,
    summary: event,
    detail: '',
    tags: [],
  });
  char.interactionSummary = [char.interactionSummary, `${save.time.current}：${event}`].filter(Boolean).slice(-5).join('\n');
  return {
    ok: true,
    tone: 'green',
    message: `${char.name} 好感度 ${delta >= 0 ? '+' : ''}${delta}`,
    save,
  };
}

export function addMemory(save: GameSave, charId: string, memory: Memory): ActionResult {
  const char = save.chars[charId];
  if (!char) return { ok: false, tone: 'red', message: `未知角色：${charId}`, save };
  char.relationship.memories.push(memory);
  char.interactionSummary = [char.interactionSummary, `${memory.timestamp}：${memory.summary || memory.event}`]
    .filter(Boolean)
    .slice(-5)
    .join('\n');
  return { ok: true, tone: 'green', message: `已记录 ${char.name} 的回忆`, save };
}
