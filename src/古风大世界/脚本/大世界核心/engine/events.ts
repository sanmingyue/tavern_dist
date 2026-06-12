import { createId, nowIso, pushSaveLog } from '../state/defaults';
import type { WorldEventGeneratePayload, WorldEventInstance, WorldEventResolvePayload, WorldEventTemplate } from '../types/events';
import type { GameSave } from '../types/schema';

export function upsertEventTemplate(save: GameSave, template: WorldEventTemplate): string {
  save.events.templates[template.templateId] = {
    ...template,
    locationIds: template.locationIds ?? [],
    regionIds: template.regionIds ?? [],
    requiredTags: template.requiredTags ?? [],
    relatedNpcIds: template.relatedNpcIds ?? [],
    consequenceType: template.consequenceType ?? 'custom',
  };
  pushSaveLog(save, 'EVENT_TEMPLATE_UPSERT', `事件模板已登记：${template.title}`, true, [template.templateId]);
  return `事件模板已登记：${template.title}`;
}

export function generateWorldEvents(save: GameSave, payload: WorldEventGeneratePayload = {}): string {
  const locationId = payload.locationId ?? save.player.location.currentLocationId;
  const regionId = payload.regionId ?? save.world.currentRegionId;
  const tags = new Set(payload.tags ?? []);
  const maxCount = Math.max(1, Math.floor(payload.maxCount ?? 3));
  const templates = Object.values(save.events.templates)
    .filter(template => matchesTemplate(template, locationId, regionId, tags))
    .sort((left, right) => right.weight - left.weight)
    .slice(0, maxCount);
  if (templates.length === 0) {
    pushSaveLog(save, 'EVENT_GENERATE', '未生成新的地方事件');
    return '未生成新的地方事件';
  }
  for (const template of templates) {
    const event = instantiateEvent(template, locationId, regionId, Array.from(tags));
    save.events.active[event.eventId] = event;
    save.events.recentEventIds = [event.eventId, ...save.events.recentEventIds].slice(0, 50);
  }
  const summary = `生成地方事件：${templates.map(template => template.title).join('、')}`;
  pushSaveLog(save, 'EVENT_GENERATE', summary, true, templates.map(template => template.templateId));
  return summary;
}

export function activateWorldEvent(save: GameSave, event: WorldEventInstance): string {
  save.events.active[event.eventId] = event;
  save.events.recentEventIds = [event.eventId, ...save.events.recentEventIds].slice(0, 50);
  pushSaveLog(save, 'EVENT_ACTIVATE', `事件已激活：${event.title}`, true, [event.eventId]);
  return `事件已激活：${event.title}`;
}

export function resolveWorldEvent(save: GameSave, payload: WorldEventResolvePayload): string {
  const event = save.events.active[payload.eventId];
  if (!event) throw new Error(`事件不存在或未激活：${payload.eventId}`);
  event.status = payload.outcome;
  event.resolvedAt = nowIso();
  if (payload.summary) event.summary = payload.summary;
  delete save.events.active[payload.eventId];
  save.events.resolved[payload.eventId] = event;
  pushSaveLog(save, 'EVENT_RESOLVE', `事件已${payload.outcome}：${event.title}`, true, [event.eventId]);
  return `事件已${payload.outcome}：${event.title}`;
}

function matchesTemplate(template: WorldEventTemplate, locationId: string, regionId: string, tags: Set<string>): boolean {
  if (template.locationIds?.length && !template.locationIds.includes(locationId)) return false;
  if (template.regionIds?.length && !template.regionIds.includes(regionId)) return false;
  if (template.requiredTags?.some(tag => !tags.has(tag))) return false;
  return true;
}

function instantiateEvent(template: WorldEventTemplate, locationId: string, regionId: string, tags: string[]): WorldEventInstance {
  return {
    eventId: createId('event'),
    templateId: template.templateId,
    title: template.title,
    kind: template.kind,
    status: 'active',
    locationId,
    regionId,
    createdAt: nowIso(),
    relatedNpcIds: template.relatedNpcIds ?? [],
    summary: template.summary,
    tags: unique([...(template.requiredTags ?? []), ...tags]),
  };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

