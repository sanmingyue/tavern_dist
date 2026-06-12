type WebpackContext = {
  keys(): string[];
  <T = unknown>(id: string): T;
};

declare const require: {
  context(directory: string, useSubdirectories: boolean, regExp: RegExp): WebpackContext;
};

export type LanjingTextSlot = 'before' | 'after' | 'd0';

export type LanjingTextResourceEntry = {
  uid: number;
  id: string;
  title: string;
  rawName: string;
  folder: string;
  file: string;
  order: number;
  slot: LanjingTextSlot;
  keys: string[];
  content: string;
};

export type LanjingTextResourceBundle = {
  source: 'bundled_txt';
  entries: LanjingTextResourceEntry[];
};

const textContext = require.context('../新世界书/世界书', true, /^(?!.*\/05_角色人设\/).*\.txt$/);

let cachedBundle: LanjingTextResourceBundle | null = null;

function normalizeTerm(text: string): string {
  return text.trim().toLowerCase();
}

function readModuleText(contextKey: string): string {
  const moduleValue = textContext(contextKey);
  if (typeof moduleValue === 'string') return moduleValue.trim();
  if (moduleValue && typeof moduleValue === 'object' && 'default' in moduleValue) {
    const value = (moduleValue as { default?: unknown }).default;
    return typeof value === 'string' ? value.trim() : '';
  }
  return '';
}

function uniqueStrings(values: unknown[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.flat(Infinity)) {
    const text = String(value ?? '').trim();
    if (!text) continue;
    const key = normalizeTerm(text);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function parseContextKey(contextKey: string): { folder: string; rawName: string; file: string } | null {
  const normalized = contextKey.replace(/\\/g, '/').replace(/^\.\//, '');
  const parts = normalized.split('/');
  if (parts.length < 2) return null;

  const folder = parts[0];
  const filename = parts[parts.length - 1];
  if (!filename.endsWith('.txt')) return null;

  return {
    folder,
    rawName: filename.replace(/\.txt$/i, ''),
    file: `世界书/${normalized}`,
  };
}

function simplifyRawName(rawName: string): string {
  return rawName
    .replace(/^WB\d+_/i, '')
    .replace(/^\d{4}_/, '')
    .replace(/^A\d{3}_/i, '')
    .trim() || rawName;
}

function parseOrder(rawName: string, fallback: number): number {
  const match = rawName.match(/^(?:WB)?(\d{1,4})[_-]?/i) ?? rawName.match(/^A(\d{1,4})[_-]?/i);
  if (!match) return fallback;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : fallback;
}

function resolveSlot(folder: string, rawName: string): LanjingTextSlot {
  if (folder === '00_规则层' && /^WB(?:001|002|005|006)_/i.test(rawName)) return 'd0';
  if (folder === '00_规则层' || folder === '01_城市总纲') return 'before';
  if (folder === '02_行政区街道' || folder === '03_地点设施' || folder === '04_设施详情') return 'after';
  return 'before';
}

function buildKeys(folder: string, rawName: string, title: string, file: string): string[] {
  const nameParts = rawName
    .replace(/^WB\d+_/i, '')
    .replace(/^\d{4}_/, '')
    .replace(/^A\d{3}_/i, '')
    .split(/[_｜|、，,.\s]+/u)
    .map(part => part.trim())
    .filter(part => part.length >= 2);
  return uniqueStrings([folder, rawName, title, file, nameParts]);
}

function buildBundledTextBundle(): LanjingTextResourceBundle {
  const entries = textContext
    .keys()
    .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'))
    .map((contextKey, index) => {
      const parsed = parseContextKey(contextKey);
      if (!parsed) return null;

      const title = simplifyRawName(parsed.rawName);
      const content = readModuleText(contextKey);
      if (!content) return null;

      return {
        uid: index + 1,
        id: `LJTXT-${String(index + 1).padStart(4, '0')}`,
        title,
        rawName: parsed.rawName,
        folder: parsed.folder,
        file: parsed.file,
        order: parseOrder(parsed.rawName, 100),
        slot: resolveSlot(parsed.folder, parsed.rawName),
        keys: buildKeys(parsed.folder, parsed.rawName, title, parsed.file),
        content,
      } satisfies LanjingTextResourceEntry;
    })
    .filter((entry): entry is LanjingTextResourceEntry => Boolean(entry));

  return {
    source: 'bundled_txt',
    entries,
  };
}

export async function loadLanjingTextResources(): Promise<LanjingTextResourceBundle> {
  if (!cachedBundle) {
    cachedBundle = buildBundledTextBundle();
    console.info(`[澜景市] 已加载内置文本资源库: ${cachedBundle.entries.length} 条`);
  }
  return cachedBundle;
}
