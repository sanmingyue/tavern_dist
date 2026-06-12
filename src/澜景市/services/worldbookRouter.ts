import { getCharsAtLocation } from '../engine/charPresence';
import { getNearestFestival } from '../engine/calendar';
import { getLocationById, getLocationName } from '../data/locations';
import type { GameSave } from '../types/schema';

const SCAN_INJECT_ID = 'lanjing-city-scan';
const SITUATION_INJECT_ID = 'lanjing-city-situation';

export function buildScanText(save: GameSave): string {
  const location = getLocationById(save.user.currentLocationId);
  const chars = getCharsAtLocation(save, save.user.currentLocationId).map(char => char.name);
  const festival = getNearestFestival(save.time.current) ?? '无';
  return [
    `[澜景市] 区域:${location?.district ?? '未知'} 地点:${location?.name ?? save.user.currentLocationId} 季节:${save.time.season}`,
    `天气:${save.time.weather} 在场角色:[${chars.join(',') || '无'}]`,
    `节日:${festival} 角色行为 地点到达`,
  ].join('\n');
}

export function buildSituationSummary(save: GameSave): string {
  const chars = getCharsAtLocation(save, save.user.currentLocationId);
  const locationName = getLocationName(save.user.currentLocationId);
  const charLines = chars.map(char => `- ${char.name}：${char.relationship.label}，${char.interactionSummary || '暂无互动摘要'}`);
  return [
    '【澜景市权威局势摘要】',
    `当前时间：${save.time.current}（${save.time.season}，${save.time.weather}）`,
    `当前位置：${locationName}`,
    `玩家金额：${save.assets.money} 元`,
    `在场角色：${chars.length > 0 ? '' : '无'}`,
    ...charLines,
    '规则：数值、资产、位置、时间以脚本存档为准；AI只负责叙述，不自行裁决。',
  ].join('\n');
}

export function injectLanjingContext(save: GameSave, once = true): { uninject: () => void } {
  return injectPrompts(
    [
      {
        id: SITUATION_INJECT_ID,
        content: buildSituationSummary(save),
        position: 'in_chat',
        role: 'system',
        depth: 2,
        should_scan: false,
      },
    ],
    { once },
  );
}

export function clearLanjingContext(): void {
  uninjectPrompts([SCAN_INJECT_ID, SITUATION_INJECT_ID]);
}
