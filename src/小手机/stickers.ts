import stickerLinksRaw from './sticker-links.txt?raw';

/**
 * 闪讯表情包资源
 *
 * 图链放在 sticker-links.txt 中，按“分组名 + 多行图片 URL”的格式维护。
 * 未来只需要替换/更新那个文本文件，然后重新打包即可，不需要把链接写进代码。
 */

export interface Sticker {
  group: string;
  url: string;
  filename: string;
  format: string;
}

export interface ResolvedSticker extends Sticker {
  label: string;
  groupLabel: string;
}

export type StickerMessagePart =
  | { type: 'text'; text: string }
  | { type: 'sticker'; label: string; sticker: ResolvedSticker };

const IMAGE_URL_REGEX = /^https?:\/\/\S+\.(?:gif|png|jpe?g|webp)(?:[?#]\S*)?$/i;
const PURE_STICKER_REGEX = /^\[表情[:：]([^\]]+)\]$/;

/** 表情包正则：匹配 [表情:xxx] */
export const STICKER_REGEX = /\[表情[:：]([^\]]+)\]/g;

const GROUP_LABELS: Record<string, string> = {
  angry: '生气',
  confuse: '疑惑',
  cute: '可爱',
  funny: '搞笑',
  happy: '开心',
  sad: '难过',
};

const DEFAULT_GROUP = 'cute';

const GROUP_ALIASES: Record<string, string[]> = {
  angry: [
    'angry',
    '生气',
    '愤怒',
    '气死',
    '气炸',
    '炸毛',
    '火大',
    '恼火',
    '烦躁',
    '不爽',
    '讨厌',
    '凶',
    '骂',
    '怒',
  ],
  sad: [
    'sad',
    '伤心',
    '难过',
    '不开心',
    '委屈',
    '大哭',
    '哭哭',
    '哭',
    '呜呜',
    '失落',
    '沮丧',
    '丧',
    '破防',
    '心碎',
    '累',
  ],
  confuse: [
    'confuse',
    '疑惑',
    '困惑',
    '迷惑',
    '懵',
    '懵逼',
    '问号',
    '不懂',
    '思考',
    '震惊',
    '惊讶',
    '惊呆',
    '傻眼',
    '无语',
    '尴尬',
    '慌张',
  ],
  cute: [
    'cute',
    '可爱',
    '卖萌',
    '萌',
    '撒娇',
    '害羞',
    '脸红',
    '贴贴',
    '亲亲',
    '抱抱',
    '喜欢',
    '心动',
    '花痴',
  ],
  funny: [
    'funny',
    '搞笑',
    '笑死',
    '爆笑',
    '偷笑',
    '坏笑',
    '滑稽',
    '吐槽',
    '哈哈',
    '乐',
    '嘲笑',
    '得瑟',
  ],
  happy: [
    'happy',
    '开心',
    '高兴',
    '快乐',
    '好耶',
    '耶',
    '比耶',
    '得意',
    '庆祝',
    '期待',
    '满足',
    '赞',
    '棒',
    '胜利',
  ],
};

const EMOJI_GROUPS: Array<{ group: string; pattern: RegExp }> = [
  { group: 'angry', pattern: /[😡😠🤬💢]/u },
  { group: 'sad', pattern: /[😭😢🥲😞😔💔]/u },
  { group: 'confuse', pattern: /[🤔😳😯😮😵❓]/u },
  { group: 'cute', pattern: /[🥰😍😘☺😊💕💗]/u },
  { group: 'funny', pattern: /[🤣😂😹😏😜]/u },
  { group: 'happy', pattern: /[😄😆😁🥳🙂😋👍✨]/u },
];

function normalizeGroupName(value: string): string {
  return value.trim().toLowerCase();
}

function getFilename(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || '');
  } catch {
    return url.split('/').pop()?.split(/[?#]/)[0] || '';
  }
}

function getFormat(filename: string): string {
  return filename.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase() || '';
}

export function parseStickerGroups(raw: string): Record<string, Sticker[]> {
  const groups: Record<string, Sticker[]> = {};
  let currentGroup = '';

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (IMAGE_URL_REGEX.test(trimmed)) {
      if (!currentGroup) continue;
      const filename = getFilename(trimmed);
      groups[currentGroup] ??= [];
      groups[currentGroup].push({
        group: currentGroup,
        url: trimmed,
        filename,
        format: getFormat(filename),
      });
      continue;
    }

    currentGroup = normalizeGroupName(trimmed);
    groups[currentGroup] ??= [];
  }

  return groups;
}

export const STICKER_GROUPS = parseStickerGroups(stickerLinksRaw);
export const STICKER_GROUP_NAMES = Object.keys(STICKER_GROUPS).filter(group => STICKER_GROUPS[group].length > 0);

/** 兼容旧调用：这里返回每个分组的第一张图，而不是硬编码 URL。 */
export const STICKER_MAP: Record<string, string> = STICKER_GROUP_NAMES.reduce<Record<string, string>>((acc, group) => {
  const first = STICKER_GROUPS[group][0];
  if (first) acc[group] = first.url;
  return acc;
}, {});

/** 所有可用表情分组名列表 */
export const STICKER_NAMES = STICKER_GROUP_NAMES;

function normalizeStickerLabel(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(PURE_STICKER_REGEX);
  return (match?.[1] ?? trimmed).trim();
}

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function resolveStickerGroup(label: string): string | null {
  const normalizedLabel = normalizeStickerLabel(label);
  const lowerLabel = normalizedLabel.toLowerCase();

  if (STICKER_GROUPS[lowerLabel]?.length) {
    return lowerLabel;
  }

  for (const { group, pattern } of EMOJI_GROUPS) {
    if (STICKER_GROUPS[group]?.length && pattern.test(normalizedLabel)) {
      return group;
    }
  }

  let bestGroup = '';
  let bestScore = 0;

  for (const [group, aliases] of Object.entries(GROUP_ALIASES)) {
    if (!STICKER_GROUPS[group]?.length) continue;

    for (const alias of aliases) {
      const normalizedAlias = alias.toLowerCase();
      if (!normalizedAlias || !lowerLabel.includes(normalizedAlias)) continue;
      if (normalizedAlias.length > bestScore) {
        bestGroup = group;
        bestScore = normalizedAlias.length;
      }
    }
  }

  if (bestGroup) return bestGroup;
  if (STICKER_GROUPS[DEFAULT_GROUP]?.length) return DEFAULT_GROUP;
  return STICKER_GROUP_NAMES[0] ?? null;
}

export function getStickerGroupName(label: string): string | null {
  const group = resolveStickerGroup(label);
  return group ? (GROUP_LABELS[group] ?? group) : null;
}

export function getStickerForName(label: string, salt = ''): ResolvedSticker | null {
  const cleanLabel = normalizeStickerLabel(label);
  const group = resolveStickerGroup(cleanLabel);
  if (!group) return null;

  const stickers = STICKER_GROUPS[group] ?? [];
  if (stickers.length === 0) return null;

  const index = hashString(`${group}:${cleanLabel}:${salt}`) % stickers.length;
  return {
    ...stickers[index],
    label: cleanLabel,
    groupLabel: GROUP_LABELS[group] ?? group,
  };
}

/**
 * 判断消息内容是否为纯表情（整条消息只有一个 [表情:xxx]）
 */
export function isPureSticker(content: string): boolean {
  return getStickerForContent(content) !== null;
}

/**
 * 从消息内容中提取表情名称（如果是纯表情消息）
 */
export function extractStickerName(content: string): string | null {
  const match = content.trim().match(PURE_STICKER_REGEX);
  if (!match) return null;
  return getStickerForName(match[1]) ? match[1].trim() : null;
}

/**
 * 获取表情图片 URL
 */
export function getStickerUrl(name: string, salt = ''): string | null {
  return getStickerForName(name, salt)?.url ?? null;
}

export function getStickerForContent(content: string, salt = ''): ResolvedSticker | null {
  const match = content.trim().match(PURE_STICKER_REGEX);
  if (!match) return null;
  return getStickerForName(match[1], salt);
}

export function getStickerMessageParts(content: string, salt = ''): StickerMessagePart[] {
  const parts: StickerMessagePart[] = [];
  let lastIndex = 0;
  STICKER_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = STICKER_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: content.slice(lastIndex, match.index) });
    }

    const label = match[1].trim();
    const sticker = getStickerForName(label, `${salt}:${match.index}`);
    if (sticker) {
      parts.push({ type: 'sticker', label, sticker });
    } else {
      parts.push({ type: 'text', text: match[0] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: 'text', text: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: 'text', text: content }];
}
