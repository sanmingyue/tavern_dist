import { dispatchAction } from '../dispatcher';
import { loadActiveSlot, saveSlot, unlockPrologueSkip } from '../storage/localStorageAdapter';
import type { ActionResult, GameAction } from '../types/actions';
import type { GameSave } from '../types/schema';

export function dispatchWorldAction(action: GameAction, save = loadActiveSlot()): ActionResult {
  if (!save) {
    throw new Error('当前没有激活存档');
  }
  const result = dispatchAction(save, action);
  const saved = saveSlot(result.save);
  if (action.type === 'PROLOGUE_COMPLETE' && result.ok) {
    unlockPrologueSkip(saved.meta.slotId);
  }
  return { ...result, save: saved };
}

export function dispatchWorldActionWithoutSaving(save: GameSave, action: GameAction): ActionResult {
  return dispatchAction(save, action);
}
