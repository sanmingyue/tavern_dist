import { festivals } from '../data/festivals';
import { huangliJi, huangliYi, luckLabels } from '../data/huangliRules';
import type { Appointment, GameSave, Huangli } from '../types/schema';
import { parseGameDate } from './time';

function pickMany(pool: string[], seed: number, count: number): string[] {
  return Array.from({ length: count }, (_, index) => pool[(seed + index * 3) % pool.length]);
}

export function generateHuangli(dateText: string): Huangli {
  const date = parseGameDate(`${dateText.slice(0, 10)} 00:00`);
  const seed = Number(`${date.getMonth() + 1}${date.getDate()}`) + date.getDay();
  return {
    date: dateText.slice(0, 10),
    yi: pickMany(huangliYi, seed, 3),
    ji: pickMany(huangliJi, seed + 1, 3),
    luck: luckLabels[seed % luckLabels.length],
  };
}

export function addAppointment(save: GameSave, appointment: Appointment): void {
  save.calendar.appointments.push(appointment);
}

export function removeAppointment(save: GameSave, appointmentId: string): boolean {
  const before = save.calendar.appointments.length;
  save.calendar.appointments = save.calendar.appointments.filter(appointment => appointment.id !== appointmentId);
  return save.calendar.appointments.length !== before;
}

export function checkAppointments(save: GameSave, timeText = save.time.current): Appointment[] {
  const now = parseGameDate(timeText).getTime();
  const upcoming = save.calendar.appointments.filter(appointment => {
    if (appointment.status !== '计划中') return false;
    const start = parseGameDate(appointment.start).getTime();
    const diff = start - now;
    return diff >= 0 && diff <= appointment.reminderMinutesBefore * 60_000;
  });
  for (const appointment of upcoming) {
    appointment.status = '已提醒';
  }
  return upcoming;
}

export function getNearestFestival(dateText: string): string | null {
  const current = dateText.slice(5, 10);
  const sorted = [...festivals].sort((lhs, rhs) => lhs.date.localeCompare(rhs.date));
  return sorted.find(festival => festival.date >= current)?.name ?? sorted[0]?.name ?? null;
}
