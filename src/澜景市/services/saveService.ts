import { z } from 'zod';
import { generateHuangli } from '../engine/calendar';
import { getSeasonFromDate } from '../engine/time';
import { generateWeather } from '../engine/weather';
import { GameSaveSchema, LANJING_SAVE_KEY, LANJING_SCHEMA_VERSION, type GameSave, type UserInitData } from '../types/schema';
import { compactSaveForStorage } from './saveSnapshot';

export type LoadSaveResult = {
  save: GameSave;
  created: boolean;
  migrated: boolean;
  errors: string[];
};

function nowGameText(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} 08:00`;
}

function createBlankUser(): UserInitData {
  return {
    name: '',
    age: 18,
    birthday: '01-01',
    background: '',
    bazi: '',
    fortune: '平',
    residence: {
      district: '',
      street: '',
      detail: '',
      locationId: 'unknown',
    },
    appearance: {
      height: 165,
      looks: '',
      outfit: '',
      bodyExternal: '正常',
    },
    internal: {
      bodyInternal: '正常',
      experiences: [],
    },
    currentLocationId: 'unknown',
    inventory: [],
    initialMoney: 0,
  };
}

export function createInitialSave(overrides: Partial<GameSave> = {}): GameSave {
  const current = overrides.time?.current ?? nowGameText();
  const season = getSeasonFromDate(new Date(current.replace(' ', 'T')));
  const base = {
    schemaVersion: LANJING_SCHEMA_VERSION,
    savedAt: Date.now(),
    user: createBlankUser(),
    assets: {
      money: 0,
      items: [],
      properties: [],
      transactions: [],
    },
    time: {
      current,
      season,
      weather: generateWeather(season, current),
      dayOfWeek: new Date(current.replace(' ', 'T')).getDay(),
    },
    calendar: {
      appointments: [],
      huangli: generateHuangli(current),
      events: [],
    },
    chars: {},
    world: {
      landmarks: {},
      discoveredLocations: ['unknown'],
      worldEvents: [],
    },
    lastTickAt: Date.now(),
    actionLog: [],
    gameStarted: false,
    ...overrides,
  };
  return GameSaveSchema.parse(base);
}

function normalizeRaw(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

export function migrateSave(raw: unknown): { save: GameSave; migrated: boolean; errors: string[] } {
  const normalized = normalizeRaw(raw);
  const parsed = GameSaveSchema.safeParse(normalized);
  if (parsed.success) {
    return {
      save: {
        ...parsed.data,
        schemaVersion: LANJING_SCHEMA_VERSION,
      },
      migrated: parsed.data.schemaVersion !== LANJING_SCHEMA_VERSION,
      errors: [],
    };
  }
  return {
    save: createInitialSave(),
    migrated: false,
    errors: [z.prettifyError(parsed.error)],
  };
}

export function loadSave(): LoadSaveResult {
  const variables = getVariables({ type: 'chat' });
  const raw = variables[LANJING_SAVE_KEY];
  if (!raw) {
    return { save: createInitialSave(), created: true, migrated: false, errors: [] };
  }
  const migrated = migrateSave(raw);
  return { ...migrated, created: false };
}

export function writeSave(save: GameSave): void {
  const next = GameSaveSchema.parse({
    ...compactSaveForStorage(save),
    schemaVersion: LANJING_SCHEMA_VERSION,
    savedAt: Date.now(),
  });
  const variables = getVariables({ type: 'chat' });
  replaceVariables({ ...variables, [LANJING_SAVE_KEY]: next }, { type: 'chat' });
}

export function ensureSave(): GameSave {
  const result = loadSave();
  if (result.created || result.migrated || result.errors.length > 0) {
    writeSave(result.save);
  }
  return result.save;
}

export function resetSave(): GameSave {
  const save = createInitialSave();
  writeSave(save);
  return save;
}
