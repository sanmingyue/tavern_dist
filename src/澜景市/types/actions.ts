import type {
  Appointment,
  GameSave,
  Item,
  LandmarkChange,
  Memory,
  Property,
  ScheduleOverride,
  UserInitData,
} from './schema';

export type ActionTone = 'green' | 'yellow' | 'red' | 'blue';

export type ActionResult<TData extends Record<string, unknown> = Record<string, unknown>> = {
  ok: boolean;
  tone: ActionTone;
  message: string;
  save: GameSave;
  shouldAskAI?: boolean;
  data?: TData;
};

export type MoneySource = '正文' | '淘宝' | '闲鱼' | '外卖' | '电影票' | '打工' | '小手机' | '其他';

export type GameAction =
  | { type: 'GAME_INIT'; userData: UserInitData }
  | { type: 'LOCATION_CHANGE'; targetId: string }
  | { type: 'TIME_ADVANCE'; minutes: number; reason?: string }
  | { type: 'TIME_SET'; current: string; reason?: string }
  | { type: 'MONEY_CHANGE'; amount: number; desc: string; source?: MoneySource }
  | { type: 'ITEM_ADD'; item: Item }
  | { type: 'ITEM_REMOVE'; itemId: string; quantity: number }
  | { type: 'PROPERTY_ADD'; property: Property }
  | { type: 'PROPERTY_REMOVE'; propertyId: string }
  | { type: 'RELATIONSHIP_UPDATE'; charId: string; delta: number; event: string }
  | { type: 'MEMORY_ADD'; charId: string; memory: Memory }
  | { type: 'APPOINTMENT_ADD'; appointment: Appointment }
  | { type: 'APPOINTMENT_REMOVE'; appointmentId: string }
  | { type: 'LANDMARK_CHANGE'; locationId: string; change: LandmarkChange }
  | { type: 'CHAR_SCHEDULE_OVERRIDE'; charId: string; override: ScheduleOverride }
  | { type: 'PHONE_PURCHASE'; item: Item; cost: number; platform: string; phoneActionId?: string }
  | { type: 'PHONE_ACTION_SYNC'; raw: string; phoneActionId: string }
  | { type: 'COMMS_SEND'; text: string }
  | { type: 'TICK_NOW' };
