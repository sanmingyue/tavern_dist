import type { CharState, GameSave } from '../types/schema';
import { parseGameDate } from './time';

function minutesOfDay(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

function inTimeRange(current: number, start: string, end: string): boolean {
  const startMin = minutesOfDay(start);
  const endMin = minutesOfDay(end);
  if (startMin <= endMin) return current >= startMin && current < endMin;
  return current >= startMin || current < endMin;
}

export function getCharLocationAt(char: CharState, timeText: string): string {
  const now = parseGameDate(timeText);
  const nowMs = now.getTime();
  const override = char.schedule.overrides.find(item => {
    const start = parseGameDate(`${item.date} ${item.start}`);
    const end = parseGameDate(`${item.date} ${item.end}`);
    if (end.getTime() < start.getTime()) {
      end.setDate(end.getDate() + 1);
    }
    return nowMs >= start.getTime() && nowMs <= end.getTime();
  });
  if (override) return override.locationId;

  const day = now.getDay();
  const current = now.getHours() * 60 + now.getMinutes();
  const rule = [...char.schedule.rules]
    .sort((lhs, rhs) => rhs.priority - lhs.priority)
    .find(item => item.daysOfWeek.includes(day) && inTimeRange(current, item.start, item.end));
  return rule?.locationId ?? char.appearance.currentLocationId ?? char.schedule.defaultLocationId;
}

export function getCharsAtLocation(save: GameSave, locationId: string, timeText = save.time.current): CharState[] {
  return Object.values(save.chars).filter(char => getCharLocationAt(char, timeText) === locationId);
}
