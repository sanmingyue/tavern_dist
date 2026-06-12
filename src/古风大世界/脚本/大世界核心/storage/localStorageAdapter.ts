import {
  ExportedSavePackageSchema,
  GUFENG_SCHEMA_VERSION,
  GameSaveSchema,
  GlobalSettingsSchema,
  OpeningPrologueSkipUnlockSchema,
  SAVE_SLOT_COUNT,
  SaveIndexSchema,
  SaveSlotIdSchema,
  type ExportedSavePackage,
  type GameSave,
  type GlobalSettings,
  type OpeningPrologueSkipUnlock,
  type SaveIndex,
  type SaveSlotId,
  type SaveSlotSummary,
} from '../types/schema';
import type { SaveImportPreview } from '../types/actions';
import { createEmptySlotSummaries, createId, createInitialSave, nowIso, summarizeSave } from '../state/defaults';

const STORAGE_PREFIX = 'gufeng-world';
const SAVE_INDEX_KEY = `${STORAGE_PREFIX}/save-index`;
const ACTIVE_SLOT_KEY = `${STORAGE_PREFIX}/active-save-id`;
const PROLOGUE_SKIP_KEY = `${STORAGE_PREFIX}/opening-prologue-skip-unlocked`;
const SETTINGS_KEY = `${STORAGE_PREFIX}/settings`;

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const memoryStore = new Map<string, string>();

const fallbackStorage: StorageLike = {
  getItem: key => memoryStore.get(key) ?? null,
  setItem: (key, value) => {
    memoryStore.set(key, value);
  },
  removeItem: key => {
    memoryStore.delete(key);
  },
};

function getStorage(): StorageLike {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  } catch {
    return fallbackStorage;
  }
  return fallbackStorage;
}

function slotKey(slotId: SaveSlotId): string {
  return `${STORAGE_PREFIX}/slot/${slotId}`;
}

function readJson(key: string): unknown {
  const raw = getStorage().getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  getStorage().setItem(key, JSON.stringify(value));
}

function checksum(raw: string): string {
  let hash = 2166136261;
  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function loadIndex(): SaveIndex {
  const parsed = SaveIndexSchema.safeParse(readJson(SAVE_INDEX_KEY));
  if (parsed.success) return parsed.data;
  const index: SaveIndex = {
    schemaVersion: GUFENG_SCHEMA_VERSION,
    updatedAt: nowIso(),
    slots: createEmptySlotSummaries(),
  };
  writeJson(SAVE_INDEX_KEY, index);
  return index;
}

export function writeIndex(index: SaveIndex): SaveIndex {
  const next = SaveIndexSchema.parse({ ...index, updatedAt: nowIso() });
  writeJson(SAVE_INDEX_KEY, next);
  return next;
}

export function rebuildIndex(): SaveIndex {
  const slots = createEmptySlotSummaries();
  for (let slotId = 1; slotId <= SAVE_SLOT_COUNT; slotId += 1) {
    const parsedSlotId = SaveSlotIdSchema.parse(slotId);
    const save = loadSlot(parsedSlotId);
    slots[parsedSlotId - 1] = save ? summarizeSave(save) : slots[parsedSlotId - 1];
  }
  return writeIndex({
    schemaVersion: GUFENG_SCHEMA_VERSION,
    updatedAt: nowIso(),
    slots,
  });
}

export function listSlots(): SaveSlotSummary[] {
  return rebuildIndex().slots;
}

export function loadSlot(slotId: SaveSlotId): GameSave | null {
  const parsed = GameSaveSchema.safeParse(readJson(slotKey(slotId)));
  if (!parsed.success) return null;
  if (parsed.data.meta.slotId === slotId) return parsed.data;
  return GameSaveSchema.parse({
    ...parsed.data,
    meta: {
      ...parsed.data.meta,
      slotId,
    },
  });
}

export function saveSlot(save: GameSave): GameSave {
  const next = GameSaveSchema.parse({
    ...save,
    meta: {
      ...save.meta,
      savedAt: nowIso(),
    },
  });
  writeJson(slotKey(next.meta.slotId), next);
  const index = loadIndex();
  index.slots[next.meta.slotId - 1] = summarizeSave(next);
  writeIndex(index);
  return next;
}

export function createSlot(slotId: SaveSlotId): GameSave {
  const save = createInitialSave(slotId);
  saveSlot(save);
  setActiveSlotId(slotId);
  return save;
}

export function deleteSlot(slotId: SaveSlotId): void {
  getStorage().removeItem(slotKey(slotId));
  const index = loadIndex();
  index.slots[slotId - 1] = createEmptySlotSummaries()[slotId - 1];
  writeIndex(index);
  if (getActiveSlotId() === slotId) {
    setActiveSlotId(null);
  }
}

export function copySlot(sourceSlotId: SaveSlotId, targetSlotId: SaveSlotId, overwrite = false): GameSave {
  const source = loadSlot(sourceSlotId);
  if (!source) throw new Error(`源槽位为空：${sourceSlotId}`);
  if (!overwrite && loadSlot(targetSlotId)) throw new Error(`目标槽位已有存档：${targetSlotId}`);

  const at = nowIso();
  const copied = GameSaveSchema.parse({
    ...JSON.parse(JSON.stringify(source)),
    meta: {
      ...source.meta,
      saveId: createId(`save${targetSlotId}`),
      slotId: targetSlotId,
      savedAt: at,
      copiedFromSaveId: source.meta.saveId,
      importedFrom: null,
    },
  });
  return saveSlot(copied);
}

export function setActiveSlotId(slotId: SaveSlotId | null): void {
  writeJson(ACTIVE_SLOT_KEY, slotId);
}

export function getActiveSlotId(): SaveSlotId | null {
  const parsed = SaveSlotIdSchema.nullable().safeParse(readJson(ACTIVE_SLOT_KEY));
  return parsed.success ? parsed.data : null;
}

export function loadActiveSlot(): GameSave | null {
  const activeSlotId = getActiveSlotId();
  return activeSlotId ? loadSlot(activeSlotId) : null;
}

export function loadPrologueSkipUnlock(): OpeningPrologueSkipUnlock {
  const parsed = OpeningPrologueSkipUnlockSchema.safeParse(readJson(PROLOGUE_SKIP_KEY));
  if (parsed.success) return parsed.data;
  return { unlocked: false, unlockedAt: '', unlockedBySlotId: null };
}

export function unlockPrologueSkip(slotId: SaveSlotId): OpeningPrologueSkipUnlock {
  const unlock: OpeningPrologueSkipUnlock = {
    unlocked: true,
    unlockedAt: nowIso(),
    unlockedBySlotId: slotId,
  };
  writeJson(PROLOGUE_SKIP_KEY, unlock);
  return unlock;
}

export function loadSettings(): GlobalSettings {
  const parsed = GlobalSettingsSchema.safeParse(readJson(SETTINGS_KEY));
  if (parsed.success) return parsed.data;
  const settings: GlobalSettings = {
    schemaVersion: GUFENG_SCHEMA_VERSION,
    updatedAt: nowIso(),
    ui: {},
    debug: {},
  };
  writeJson(SETTINGS_KEY, settings);
  return settings;
}

export function writeSettings(settings: GlobalSettings): GlobalSettings {
  const next = GlobalSettingsSchema.parse({ ...settings, updatedAt: nowIso() });
  writeJson(SETTINGS_KEY, next);
  return next;
}

export function exportSlot(slotId: SaveSlotId): string {
  const save = loadSlot(slotId);
  if (!save) throw new Error(`槽位为空，无法导出：${slotId}`);
  const exportedAt = nowIso();
  const saveRaw = JSON.stringify(save);
  const pkg: ExportedSavePackage = {
    packageType: 'gufeng-world-save',
    packageVersion: GUFENG_SCHEMA_VERSION,
    exportedAt,
    checksum: checksum(saveRaw),
    save,
  };
  return JSON.stringify(pkg, null, 2);
}

export function previewImport(raw: string): SaveImportPreview {
  const parsed = parseImportPackage(raw);
  if (!parsed.ok) {
    return { ok: false, message: parsed.message, warningCount: 1 };
  }
  return {
    ok: true,
    message: '存档包可导入',
    packageVersion: parsed.package.packageVersion,
    originalSlotId: parsed.package.save.meta.slotId,
    originalSaveId: parsed.package.save.meta.saveId,
    warningCount: parsed.package.save.maintenance.warnings.filter(warning => !warning.resolved).length,
  };
}

export function importSlot(targetSlotId: SaveSlotId, raw: string, overwrite = false): GameSave {
  if (!overwrite && loadSlot(targetSlotId)) throw new Error(`目标槽位已有存档：${targetSlotId}`);
  const parsed = parseImportPackage(raw);
  if (!parsed.ok) throw new Error(parsed.message);

  const at = nowIso();
  const original = parsed.package.save;
  const imported = GameSaveSchema.parse({
    ...original,
    meta: {
      ...original.meta,
      slotId: targetSlotId,
      savedAt: at,
      importedFrom: {
        importedAt: at,
        originalSaveId: original.meta.saveId,
        originalSchemaVersion: original.meta.schemaVersion,
      },
    },
  });
  return saveSlot(imported);
}

function parseImportPackage(raw: string): { ok: true; package: ExportedSavePackage } | { ok: false; message: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { ok: false, message: '导入内容不是合法 JSON' };
  }

  const packageParsed = ExportedSavePackageSchema.safeParse(json);
  if (packageParsed.success) {
    const expectedChecksum = checksum(JSON.stringify(packageParsed.data.save));
    if (packageParsed.data.checksum !== expectedChecksum) {
      return { ok: false, message: '导入包校验不一致' };
    }
    return { ok: true, package: packageParsed.data };
  }

  const saveParsed = GameSaveSchema.safeParse(json);
  if (saveParsed.success) {
    const saveRaw = JSON.stringify(saveParsed.data);
    return {
      ok: true,
      package: {
        packageType: 'gufeng-world-save',
        packageVersion: GUFENG_SCHEMA_VERSION,
        exportedAt: nowIso(),
        checksum: checksum(saveRaw),
        save: saveParsed.data,
      },
    };
  }

  return { ok: false, message: '导入内容不符合古风大世界存档结构' };
}
