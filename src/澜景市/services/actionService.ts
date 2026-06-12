import { dispatchAction as dispatchRawAction } from '../dispatcher';
import type { ActionResult, GameAction } from '../types/actions';
import type { GameSave } from '../types/schema';
import { pushSaveCheckpoint } from './checkpointService';
import { writeSave } from './saveService';

export type DispatchGameActionOptions = {
  checkpoint?: boolean;
  checkpointActionType?: string;
  checkpointLabel?: string;
  persist?: boolean;
};

function defaultActionLabel(action: GameAction): string {
  switch (action.type) {
    case 'COMMS_SEND':
      return '玩家输入';
    case 'TICK_NOW':
      return 'Tick';
    case 'GAME_INIT':
      return '开局初始化';
    default:
      return action.type;
  }
}

function shouldCreateCheckpoint(save: GameSave, action: GameAction, options: DispatchGameActionOptions): boolean {
  if (options.checkpoint === false) return false;
  if (action.type === 'GAME_INIT' && !save.gameStarted) return false;
  return true;
}

export function dispatchGameAction(
  save: GameSave,
  action: GameAction,
  options: DispatchGameActionOptions = {},
): ActionResult {
  if (shouldCreateCheckpoint(save, action, options)) {
    pushSaveCheckpoint(save, {
      actionType: options.checkpointActionType ?? action.type,
      label: options.checkpointLabel ?? defaultActionLabel(action),
    });
  }

  const result = dispatchRawAction(save, action);
  if (options.persist !== false) {
    writeSave(save);
  }
  return result;
}

export function dispatchGameActions(
  save: GameSave,
  actions: GameAction[],
  options: DispatchGameActionOptions = {},
): ActionResult[] {
  if (actions.length === 0) return [];

  if (options.checkpoint !== false) {
    pushSaveCheckpoint(save, {
      actionType: options.checkpointActionType ?? 'ACTION_BATCH',
      label: options.checkpointLabel ?? `批量规则动作 ${actions.length} 条`,
    });
  }

  const results = actions.map(action => dispatchRawAction(save, action));
  if (options.persist !== false) {
    writeSave(save);
  }
  return results;
}
