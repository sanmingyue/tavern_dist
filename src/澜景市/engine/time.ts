import type { GameSave } from '../types/schema';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})$/;

export function parseGameDate(value: string): Date {
  const match = DATE_RE.exec(value.trim());
  if (!match) {
    throw new Error(`非法游戏时间: ${value}`);
  }
  const [, year, month, day, hour, minute] = match;
  return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0, 0);
}

export function formatGameDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function addMinutesToGameTime(current: string, minutes: number): string {
  const date = parseGameDate(current);
  date.setMinutes(date.getMinutes() + minutes);
  return formatGameDate(date);
}

export function diffGameMinutes(from: string, to: string): number {
  return Math.round((parseGameDate(to).getTime() - parseGameDate(from).getTime()) / 60_000);
}

export function getSeasonFromDate(date: Date): GameSave['time']['season'] {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}

export function normalizeDateAfterTimeChange(save: GameSave): void {
  const date = parseGameDate(save.time.current);
  save.time.season = getSeasonFromDate(date);
  save.time.dayOfWeek = date.getDay();
}
