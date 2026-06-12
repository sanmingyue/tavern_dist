import { diffGameMinutes } from '../engine/time';
import type { GameAction } from '../types/actions';
import { AppointmentSchema, LandmarkChangeSchema, MemorySchema, type GameSave } from '../types/schema';
import { dispatchGameActions } from './actionService';

export type ApplyLanjingTagsOptions = {
  checkpoint?: boolean;
};

export type ParsedTagActions = {
  actions: GameAction[];
  ignoredPhoneTags: number;
};

const PHONE_TAG_RE = /<(?:闪讯|短信|话圈|直播|电话|吃点啥|淘点|闲转|备忘录|日历|通知|闪讯好友|闪讯拉黑|闪讯删好友)\b[\s\S]*?<\/(?:闪讯|短信|话圈|直播|电话|吃点啥|淘点|闲转|备忘录|日历|通知|闪讯好友|闪讯拉黑|闪讯删好友)>/gi;

function getAttr(source: string, name: string): string | undefined {
  return new RegExp(`${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(source)?.slice(1).find(Boolean);
}

function getChild(source: string, name: string): string | undefined {
  return new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, 'i').exec(source)?.[1]?.trim();
}

function collectTags(text: string, tagName: string): Array<{ open: string; content: string }> {
  const tags: Array<{ open: string; content: string }> = [];
  const re = new RegExp(`<${tagName}\\b([^>]*)>([\\s\\S]*?)<\\/${tagName}>`, 'gi');
  let match;
  while ((match = re.exec(text)) !== null) {
    tags.push({ open: match[1] ?? '', content: match[2]?.trim() ?? '' });
  }
  return tags;
}

export function parseLanjingTags(text: string, save: GameSave): ParsedTagActions {
  const phoneMatches = text.match(PHONE_TAG_RE)?.length ?? 0;
  const cleanText = text.replace(PHONE_TAG_RE, '');
  const actions: GameAction[] = [];

  for (const tag of collectTags(cleanText, '时间戳')) {
    const value = tag.content.trim();
    const relativeMinutes = /([+-]?\d+)\s*分钟/.exec(value)?.[1];
    if (relativeMinutes) {
      actions.push({ type: 'TIME_ADVANCE', minutes: Number(relativeMinutes), reason: 'AI时间戳' });
    } else if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(value)) {
      const current = value.replace('T', ' ');
      const diff = diffGameMinutes(save.time.current, current);
      actions.push(Math.abs(diff) <= 12 * 60
        ? { type: 'TIME_ADVANCE', minutes: diff, reason: 'AI时间戳' }
        : { type: 'TIME_SET', current, reason: 'AI时间戳' });
    }
  }

  for (const tag of collectTags(cleanText, '关系事件')) {
    const charId = getAttr(tag.open, 'charId') ?? getAttr(tag.open, 'char') ?? getChild(tag.content, 'charId');
    const deltaText = getAttr(tag.open, 'delta') ?? getChild(tag.content, 'delta') ?? '0';
    const event = getChild(tag.content, 'event') ?? tag.content.replace(/<[\s\S]*?>/g, '').trim();
    if (charId) {
      actions.push({ type: 'RELATIONSHIP_UPDATE', charId, delta: Number(deltaText) || 0, event });
    }
  }

  for (const tag of collectTags(cleanText, '回忆记录')) {
    const charId = getAttr(tag.open, 'charId') ?? getAttr(tag.open, 'char') ?? getChild(tag.content, 'charId');
    if (charId) {
      actions.push({
        type: 'MEMORY_ADD',
        charId,
        memory: MemorySchema.parse({
          timestamp: save.time.current,
          event: getChild(tag.content, 'event') ?? tag.content.replace(/<[\s\S]*?>/g, '').trim(),
          summary: getChild(tag.content, 'summary') ?? '',
          delta: Number(getChild(tag.content, 'delta') ?? 0),
        }),
      });
    }
  }

  for (const tag of collectTags(cleanText, '约定')) {
    const title = getChild(tag.content, 'title') ?? getAttr(tag.open, 'title') ?? '未命名约定';
    const start = getChild(tag.content, 'start') ?? getAttr(tag.open, 'start') ?? save.time.current;
    actions.push({
      type: 'APPOINTMENT_ADD',
      appointment: AppointmentSchema.parse({
        title,
        start: start.replace('T', ' '),
        end: getChild(tag.content, 'end')?.replace('T', ' '),
        locationId: getChild(tag.content, 'locationId') ?? getAttr(tag.open, 'locationId'),
        note: getChild(tag.content, 'note') ?? '',
      }),
    });
  }

  for (const tag of collectTags(cleanText, '地点变更')) {
    const targetId = getChild(tag.content, 'targetId') ?? getChild(tag.content, 'locationId') ?? getAttr(tag.open, 'targetId');
    if (targetId) actions.push({ type: 'LOCATION_CHANGE', targetId });
  }

  for (const tag of collectTags(cleanText, '地标变更')) {
    const locationId = getChild(tag.content, 'locationId') ?? getAttr(tag.open, 'locationId');
    if (locationId) {
      actions.push({
        type: 'LANDMARK_CHANGE',
        locationId,
        change: LandmarkChangeSchema.parse({
          locationId,
          changedAt: save.time.current,
          type: getChild(tag.content, 'type') ?? getAttr(tag.open, 'type') ?? '其他',
          description: getChild(tag.content, 'description') ?? tag.content.replace(/<[\s\S]*?>/g, '').trim(),
        }),
      });
    }
  }

  return { actions, ignoredPhoneTags: phoneMatches };
}

export function applyLanjingTags(save: GameSave, text: string, options: ApplyLanjingTagsOptions = {}): ParsedTagActions {
  const parsed = parseLanjingTags(text, save);
  dispatchGameActions(save, parsed.actions, {
    checkpoint: options.checkpoint,
    checkpointLabel: 'AI 正文标签',
    persist: true,
  });
  return parsed;
}
