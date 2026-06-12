import type { GameSave } from '../types/schema';
import { checkAppointments, generateHuangli } from './calendar';
import { addMinutesToGameTime, normalizeDateAfterTimeChange } from './time';
import { generateWeather } from './weather';

const OFFLINE_LIMIT_MS = 24 * 60 * 60_000;

export function advanceGameTime(save: GameSave, minutes: number, reason = '时间推进'): void {
  if (!Number.isFinite(minutes) || minutes === 0) return;
  save.time.current = addMinutesToGameTime(save.time.current, minutes);
  normalizeDateAfterTimeChange(save);
  save.time.weather = generateWeather(save.time.season, save.time.current);
  save.calendar.huangli = generateHuangli(save.time.current);
  const reminders = checkAppointments(save);
  for (const appointment of reminders) {
    save.calendar.events.push({
      id: `reminder_${appointment.id}_${Date.now()}`,
      time: save.time.current,
      title: `约定提醒：${appointment.title}`,
      description: appointment.description,
      source: '日历',
    });
  }
  save.actionLog.push({
    id: `time_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'TIME_ADVANCE',
    timestamp: save.time.current,
    message: `${reason}：${minutes} 分钟`,
    ok: true,
    metadata: { minutes },
  });
}

export function tickSave(save: GameSave, now = Date.now()): number {
  const elapsedMs = Math.max(0, Math.min(now - save.lastTickAt, OFFLINE_LIMIT_MS));
  const minutes = Math.floor(elapsedMs / 60_000);
  if (minutes > 0) {
    advanceGameTime(save, minutes, '离线结算');
  }
  save.lastTickAt = now;
  return minutes;
}

export function applyTimestamp(save: GameSave, targetTime: string): number {
  const before = save.time.current;
  save.time.current = targetTime;
  normalizeDateAfterTimeChange(save);
  save.time.weather = generateWeather(save.time.season, save.time.current);
  save.calendar.huangli = generateHuangli(save.time.current);
  const beforeDate = new Date(before.replace(' ', 'T')).getTime();
  const afterDate = new Date(targetTime.replace(' ', 'T')).getTime();
  return Math.round((afterDate - beforeDate) / 60_000);
}
