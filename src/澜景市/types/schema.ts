import { z } from 'zod';

export const SCHEMA_VERSION = 1;
export const SAVE_VARIABLE_KEY = '澜景市存档';
export const PHONE_SYNC_VARIABLE_KEY = '澜景市小手机同步';
export const LANJING_SCHEMA_VERSION = SCHEMA_VERSION;
export const LANJING_SAVE_KEY = SAVE_VARIABLE_KEY;
export const LANJING_SCRIPT_VERSION = '0.0.1';

export const SeasonSchema = z.enum(['春', '夏', '秋', '冬']);
export const TransactionSourceSchema = z.enum(['正文', '淘宝', '闲鱼', '外卖', '电影票', '打工', '小手机', '其他']);

export const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  quantity: z.number().int().nonnegative().default(1),
  portable: z.literal(true).default(true),
  source: z.string().default('未知'),
});

export const PropertySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().default(''),
  type: z.enum(['房产', '车辆', '大型物品', '其他']).default('其他'),
  locationId: z.string().default('unknown'),
  acquiredAt: z.string().default(''),
  condition: z.string().default('正常'),
});

export const TransactionSchema = z.object({
  id: z.string().optional(),
  timestamp: z.string(),
  type: z.enum(['收入', '支出']),
  amount: z.number().nonnegative(),
  description: z.string(),
  source: TransactionSourceSchema.default('其他'),
  relatedItemId: z.string().optional(),
});

export const MemorySchema = z.object({
  id: z.string().default(() => `memory_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
  time: z.string().optional(),
  timestamp: z.string().default(''),
  event: z.string().default(''),
  delta: z.coerce.number().default(0),
  summary: z.string().default(''),
  detail: z.string().default(''),
  tags: z.array(z.string()).default([]),
}).transform(memory => ({
  id: memory.id,
  timestamp: memory.timestamp || memory.time || '',
  event: memory.event,
  delta: memory.delta,
  summary: memory.summary || memory.event,
  detail: memory.detail,
  tags: memory.tags,
}));

export const GiftStatusSchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  count: z.number().int().nonnegative().default(1),
  lastGivenAt: z.string().default(''),
  reaction: z.string().default(''),
});

export const ScheduleRuleSchema = z.object({
  id: z.string(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  locationId: z.string(),
  note: z.string().default(''),
  priority: z.number().int().default(0),
});

export const LegacyScheduleSlotSchema = z.object({
  id: z.string().default(() => `schedule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
  days: z.array(z.number().int().min(0).max(6)).default([0, 1, 2, 3, 4, 5, 6]),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  locationId: z.string(),
  note: z.string().default(''),
  priority: z.number().int().default(0),
});

export const ScheduleOverrideSchema = z.object({
  id: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  locationId: z.string(),
  reason: z.string().default(''),
});

export const ScheduleSchema = z.object({
  defaultLocationId: z.string().default('unknown'),
  rules: z.array(ScheduleRuleSchema).default([]),
  slots: z.array(LegacyScheduleSlotSchema).default([]),
  overrides: z.array(ScheduleOverrideSchema).default([]),
}).transform(schedule => {
  const rules = schedule.rules.length > 0
    ? schedule.rules
    : schedule.slots.map(slot => ({
        id: slot.id,
        daysOfWeek: slot.days,
        start: slot.start,
        end: slot.end,
        locationId: slot.locationId,
        note: slot.note,
        priority: slot.priority,
      }));
  return {
    defaultLocationId: schedule.defaultLocationId,
    rules,
    overrides: schedule.overrides,
  };
});

export const AppointmentSchema = z.object({
  id: z.string().default(() => `appointment_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
  title: z.string(),
  start: z.string(),
  end: z.string().optional(),
  locationId: z.string().optional(),
  withCharIds: z.array(z.string()).default([]),
  description: z.string().default(''),
  note: z.string().default(''),
  reminderMinutesBefore: z.number().int().nonnegative().default(30),
  status: z.enum(['计划中', '已提醒', '已完成', '已取消']).default('计划中'),
  reminded: z.boolean().default(false),
}).transform(appointment => {
  const description = appointment.description || appointment.note;
  return {
    ...appointment,
    description,
    note: appointment.note || description,
    status: appointment.reminded && appointment.status === '计划中' ? '已提醒' : appointment.status,
  };
});

export const HuangliSchema = z.object({
  date: z.string(),
  yi: z.array(z.string()).default([]),
  ji: z.array(z.string()).default([]),
  luck: z.string().default('平'),
});

export const CalendarEventSchema = z.object({
  id: z.string(),
  time: z.string(),
  title: z.string(),
  description: z.string().default(''),
  source: z.string().default('系统'),
});

export const LandmarkChangeSchema = z.object({
  id: z.string().default(() => `landmark_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`),
  locationId: z.string(),
  type: z.enum(['拆迁', '新建', '改建', '老化', '修复', '其他']).default('其他'),
  time: z.string().default(''),
  changedAt: z.string().default(''),
  description: z.string(),
  permanent: z.boolean().default(true),
}).transform(change => {
  const time = change.time || change.changedAt;
  return {
    ...change,
    time,
    changedAt: change.changedAt || time,
  };
});

export const WorldEventSchema = z.object({
  id: z.string(),
  time: z.string(),
  title: z.string(),
  description: z.string().default(''),
  tags: z.array(z.string()).default([]),
});

export const ActionLogSchema = z.object({
  id: z.string(),
  type: z.string().optional(),
  actionType: z.string().optional(),
  timestamp: z.string().optional(),
  time: z.string().optional(),
  message: z.string(),
  ok: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
}).transform(log => ({
  id: log.id,
  type: log.type ?? log.actionType ?? 'UNKNOWN',
  timestamp: log.timestamp ?? log.time ?? '',
  message: log.message,
  ok: log.ok,
  metadata: log.metadata,
}));

export const UserInitDataSchema = z.object({
  name: z.string().default(''),
  age: z.number().int().nonnegative().default(18),
  birthday: z.string().default(''),
  background: z.string().default(''),
  bazi: z.string().default(''),
  fortune: z.string().default(''),
  residence: z.object({
    district: z.string().default(''),
    street: z.string().default(''),
    detail: z.string().default(''),
    locationId: z.string().default('unknown'),
  }).prefault({}),
  appearance: z.object({
    height: z.number().nonnegative().default(0),
    looks: z.string().default(''),
    outfit: z.string().default(''),
    bodyExternal: z.string().default(''),
  }).prefault({}),
  internal: z.object({
    bodyInternal: z.string().default(''),
    experiences: z.array(z.string()).default([]),
  }).prefault({}),
  currentLocationId: z.string().default('unknown'),
  initialMoney: z.number().nonnegative().default(0),
  inventory: z.array(ItemSchema).default([]),
});

export const CharStateSchema = z.object({
  id: z.string(),
  name: z.string(),
  appearance: z.object({
    height: z.number().nonnegative().default(0),
    looks: z.string().default(''),
    outfit: z.string().default(''),
    bodyExternal: z.string().default(''),
    currentLocationId: z.string().default('unknown'),
  }).prefault({}),
  internal: z.object({
    thoughts: z.string().default(''),
    secrets: z.string().default(''),
    bodyInternal: z.string().default(''),
  }).prefault({}),
  schedule: ScheduleSchema.prefault({}),
  relationship: z.object({
    favorability: z.number().default(0),
    label: z.string().default('陌生人'),
    firstImpression: z.string().default(''),
    memories: z.array(MemorySchema).default([]),
    giftStatus: z.array(GiftStatusSchema).default([]),
  }).prefault({}),
  social: z.object({
    shanxunId: z.string().default(''),
    shanxunNickname: z.string().default(''),
    isFriend: z.boolean().default(false),
    isBlocked: z.boolean().default(false),
  }).prefault({}),
  interactionSummary: z.string().default(''),
});

export const GameSaveSchema = z.object({
  schemaVersion: z.number().int().default(SCHEMA_VERSION),
  savedAt: z.number().default(0),
  user: z.object({
    name: z.string().default(''),
    age: z.number().int().nonnegative().default(18),
    birthday: z.string().default(''),
    background: z.string().default(''),
    bazi: z.string().default(''),
    fortune: z.string().default(''),
    residence: z.object({
      district: z.string().default(''),
      street: z.string().default(''),
      detail: z.string().default(''),
      locationId: z.string().default('unknown'),
    }).prefault({}),
    appearance: z.object({
      height: z.number().nonnegative().default(0),
      looks: z.string().default(''),
      outfit: z.string().default(''),
      bodyExternal: z.string().default(''),
    }).prefault({}),
    internal: z.object({
      bodyInternal: z.string().default(''),
      experiences: z.array(z.string()).default([]),
    }).prefault({}),
    currentLocationId: z.string().default('unknown'),
    inventory: z.array(ItemSchema).default([]),
  }).prefault({}),
  assets: z.object({
    money: z.number().default(0),
    items: z.array(ItemSchema).default([]),
    properties: z.array(PropertySchema).default([]),
    transactions: z.array(TransactionSchema).default([]),
  }).prefault({}),
  time: z.object({
    current: z.string(),
    season: SeasonSchema,
    weather: z.string().default('晴'),
    dayOfWeek: z.number().int().min(0).max(6).default(0),
  }),
  calendar: z.object({
    appointments: z.array(AppointmentSchema).default([]),
    huangli: HuangliSchema,
    events: z.array(CalendarEventSchema).default([]),
  }),
  chars: z.record(z.string(), CharStateSchema).default({}),
  world: z.object({
    landmarks: z.record(z.string(), LandmarkChangeSchema).default({}),
    discoveredLocations: z.array(z.string()).default([]),
    worldEvents: z.array(WorldEventSchema).default([]),
  }).prefault({}),
  lastTickAt: z.number().default(0),
  actionLog: z.array(ActionLogSchema).default([]),
  gameStarted: z.boolean().default(false),
});

export const Schema = GameSaveSchema;

export type Season = z.infer<typeof SeasonSchema>;
export type Item = z.infer<typeof ItemSchema>;
export type Property = z.infer<typeof PropertySchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type Memory = z.infer<typeof MemorySchema>;
export type GiftStatus = z.infer<typeof GiftStatusSchema>;
export type ScheduleRule = z.infer<typeof ScheduleRuleSchema>;
export type ScheduleOverride = z.infer<typeof ScheduleOverrideSchema>;
export type Schedule = z.infer<typeof ScheduleSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type Huangli = z.infer<typeof HuangliSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type LandmarkChange = z.infer<typeof LandmarkChangeSchema>;
export type WorldEvent = z.infer<typeof WorldEventSchema>;
export type ActionLog = z.infer<typeof ActionLogSchema>;
export type UserInitData = z.infer<typeof UserInitDataSchema>;
export type CharState = z.infer<typeof CharStateSchema>;
export type GameSave = z.infer<typeof GameSaveSchema>;
