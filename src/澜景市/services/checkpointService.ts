import { z } from 'zod';
import { GameSaveSchema, type GameSave } from '../types/schema';
import { compactSaveForCheckpoint } from './saveSnapshot';
import { writeSave } from './saveService';

export const LANJING_CHECKPOINTS_KEY = '澜景市回滚点';
export const LANJING_MAX_CHECKPOINTS = 5;
const CHECKPOINT_STATE_VERSION = 1;
const ZHINO_CHAT_DATA_KEY = 'lanjing_zhino_chat_data';

export const SaveCheckpointSchema = z.object({
  id: z.string(),
  createdAt: z.number(),
  actionType: z.string().default('UNKNOWN'),
  label: z.string().default(''),
  messageIdBefore: z.number().int().nonnegative().optional(),
  messageIdAfter: z.number().int().nonnegative().optional(),
  summaryVersion: z.number().int().nonnegative().optional(),
  save: GameSaveSchema,
});

export const CheckpointStateSchema = z.object({
  schemaVersion: z.number().int().default(CHECKPOINT_STATE_VERSION),
  maxCheckpoints: z.number().int().positive().default(LANJING_MAX_CHECKPOINTS),
  checkpoints: z.array(SaveCheckpointSchema).default([]),
}).transform(state => ({
  schemaVersion: CHECKPOINT_STATE_VERSION,
  maxCheckpoints: LANJING_MAX_CHECKPOINTS,
  checkpoints: state.checkpoints.slice(-LANJING_MAX_CHECKPOINTS),
}));

export type SaveCheckpoint = z.infer<typeof SaveCheckpointSchema>;
export type CheckpointState = z.infer<typeof CheckpointStateSchema>;

export type SaveCheckpointContext = {
  actionType?: string;
  label?: string;
  messageIdBefore?: number;
  summaryVersion?: number;
};

export type RollbackCheckpointOptions = {
  checkpointId?: string;
  deleteMessages?: boolean;
  refresh?: 'none' | 'affected' | 'all';
};

export type RollbackCheckpointResult = {
  ok: boolean;
  message: string;
  checkpoint?: SaveCheckpoint;
  restoredSave?: GameSave;
  removedCheckpoints: number;
  deletedMessageIds: number[];
};

function createEmptyCheckpointState(): CheckpointState {
  return {
    schemaVersion: CHECKPOINT_STATE_VERSION,
    maxCheckpoints: LANJING_MAX_CHECKPOINTS,
    checkpoints: [],
  };
}

function normalizeRaw(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function safeGetLastMessageId(): number | undefined {
  try {
    if (typeof getLastMessageId === 'function') {
      const value = getLastMessageId();
      return Number.isFinite(value) && value >= 0 ? value : undefined;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

function readLatestSummaryVersion(): number | undefined {
  try {
    const raw = getVariables({ type: 'chat' })[ZHINO_CHAT_DATA_KEY];
    const data = normalizeRaw(raw);
    if (!data || typeof data !== 'object') return undefined;
    const summaries = (data as { summaries?: unknown }).summaries;
    if (!Array.isArray(summaries) || summaries.length === 0) return undefined;
    const latest = summaries[summaries.length - 1];
    if (!latest || typeof latest !== 'object') return undefined;
    const version = Number((latest as { version?: unknown }).version);
    return Number.isFinite(version) && version >= 0 ? version : undefined;
  } catch {
    return undefined;
  }
}

function createCheckpointId(): string {
  return `checkpoint_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function loadCheckpointState(): CheckpointState {
  const variables = getVariables({ type: 'chat' });
  const raw = variables[LANJING_CHECKPOINTS_KEY];
  if (!raw) return createEmptyCheckpointState();

  const parsed = CheckpointStateSchema.safeParse(normalizeRaw(raw));
  if (parsed.success) return parsed.data;

  console.warn('[澜景市] 回滚点读取失败，已忽略旧数据:', z.prettifyError(parsed.error));
  return createEmptyCheckpointState();
}

export function writeCheckpointState(state: CheckpointState): CheckpointState {
  const next = CheckpointStateSchema.parse(state);
  const variables = getVariables({ type: 'chat' });
  replaceVariables({ ...variables, [LANJING_CHECKPOINTS_KEY]: next }, { type: 'chat' });
  return next;
}

export function pushSaveCheckpoint(save: GameSave, context: SaveCheckpointContext = {}): SaveCheckpoint {
  const state = loadCheckpointState();
  const checkpoint = SaveCheckpointSchema.parse({
    id: createCheckpointId(),
    createdAt: Date.now(),
    actionType: context.actionType ?? 'UNKNOWN',
    label: context.label ?? context.actionType ?? '规则动作',
    messageIdBefore: context.messageIdBefore ?? safeGetLastMessageId(),
    summaryVersion: context.summaryVersion ?? readLatestSummaryVersion(),
    save: compactSaveForCheckpoint(save),
  });
  writeCheckpointState({
    ...state,
    checkpoints: [...state.checkpoints, checkpoint].slice(-LANJING_MAX_CHECKPOINTS),
  });
  return checkpoint;
}

export function clearCheckpoints(): void {
  writeCheckpointState(createEmptyCheckpointState());
}

export function getCheckpointStats(): { count: number; max: number; latest?: SaveCheckpoint } {
  const state = loadCheckpointState();
  return {
    count: state.checkpoints.length,
    max: LANJING_MAX_CHECKPOINTS,
    latest: state.checkpoints[state.checkpoints.length - 1],
  };
}

async function deleteMessagesAfter(messageIdBefore: number, refresh: 'none' | 'affected' | 'all'): Promise<number[]> {
  const lastMessageId = safeGetLastMessageId();
  if (lastMessageId === undefined || lastMessageId <= messageIdBefore) return [];

  const ids: number[] = [];
  for (let id = messageIdBefore + 1; id <= lastMessageId; id += 1) {
    ids.push(id);
  }
  await deleteChatMessages(ids, { refresh });
  return ids;
}

export async function rollbackToCheckpoint(options: RollbackCheckpointOptions = {}): Promise<RollbackCheckpointResult> {
  const state = loadCheckpointState();
  const index = options.checkpointId
    ? state.checkpoints.findIndex(checkpoint => checkpoint.id === options.checkpointId)
    : state.checkpoints.length - 1;

  if (index < 0) {
    return {
      ok: false,
      message: '没有可用的澜景市回滚点',
      removedCheckpoints: 0,
      deletedMessageIds: [],
    };
  }

  const checkpoint = state.checkpoints[index];
  const remaining = state.checkpoints.slice(0, index);
  writeCheckpointState({ ...state, checkpoints: remaining });

  const deletedMessageIds =
    options.deleteMessages && checkpoint.messageIdBefore !== undefined
      ? await deleteMessagesAfter(checkpoint.messageIdBefore, options.refresh ?? 'all')
      : [];

  writeSave(checkpoint.save);
  return {
    ok: true,
    message: `已回滚到 ${checkpoint.label || checkpoint.actionType}`,
    checkpoint,
    restoredSave: checkpoint.save,
    removedCheckpoints: state.checkpoints.length - remaining.length,
    deletedMessageIds,
  };
}

export function rollbackLatestCheckpoint(options: Omit<RollbackCheckpointOptions, 'checkpointId'> = {}): Promise<RollbackCheckpointResult> {
  return rollbackToCheckpoint(options);
}
