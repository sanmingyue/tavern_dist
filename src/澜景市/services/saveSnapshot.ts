import { GameSaveSchema, type GameSave } from '../types/schema';

export const CURRENT_SAVE_ACTION_LOG_LIMIT = 120;
export const CHECKPOINT_ACTION_LOG_LIMIT = 40;

function cloneValue<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value);
    } catch {
      // Vue/Pinia proxies cannot always be structured-cloned; JSON is fine for plain save data.
    }
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function keepTail<T>(items: T[], limit: number): T[] {
  if (items.length <= limit) return items;
  return items.slice(-limit);
}

export function compactSaveForStorage(save: GameSave): GameSave {
  const next = cloneValue(save);
  next.actionLog = keepTail(next.actionLog, CURRENT_SAVE_ACTION_LOG_LIMIT);
  return GameSaveSchema.parse(next);
}

export function compactSaveForCheckpoint(save: GameSave): GameSave {
  const next = cloneValue(save);
  next.actionLog = keepTail(next.actionLog, CHECKPOINT_ACTION_LOG_LIMIT);
  return GameSaveSchema.parse(next);
}
