import type { GameSave } from '../types/schema';

const SHICHEN = [
  '子时',
  '丑时',
  '丑时',
  '寅时',
  '寅时',
  '卯时',
  '卯时',
  '辰时',
  '辰时',
  '巳时',
  '巳时',
  '午时',
  '午时',
  '未时',
  '未时',
  '申时',
  '申时',
  '酉时',
  '酉时',
  '戌时',
  '戌时',
  '亥时',
  '亥时',
  '子时',
] as const;

export function advanceWorldTime(save: GameSave, minutes: number, reason = '行动推进'): string {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return '时间未推进';
  }

  const totalMinutes = save.world.time.day * 24 * 60 + save.world.time.hour * 60 + save.world.time.minute + Math.floor(minutes);
  const nextDay = Math.floor(totalMinutes / (24 * 60));
  const dayMinutes = totalMinutes % (24 * 60);
  save.world.time.day = Math.max(1, nextDay);
  save.world.time.hour = Math.floor(dayMinutes / 60);
  save.world.time.minute = dayMinutes % 60;
  save.world.time.calendarText = buildCalendarText(save.world.time.day, save.world.time.hour, save.world.time.minute);
  save.meta.playTimeSeconds += Math.floor(minutes * 60);

  return `${reason}，时间推进${Math.floor(minutes)}分钟，现为${save.world.time.calendarText}`;
}

export function estimateTravelMinutes(distanceLi: number, mode: 'walk' | 'horse' | 'boat' = 'walk'): number {
  const speedByMode = {
    walk: 8,
    horse: 25,
    boat: 15,
  };
  const speed = speedByMode[mode];
  return Math.max(15, Math.ceil((Math.max(0, distanceLi) / speed) * 60));
}

export function buildCalendarText(day: number, hour: number, minute: number): string {
  const shichen = SHICHEN[Math.max(0, Math.min(23, hour))];
  const minuteText = String(minute).padStart(2, '0');
  return `大夏某年 第${day}日 ${shichen} ${String(hour).padStart(2, '0')}:${minuteText}`;
}
