import { dispatchGameAction } from './actionService';
import { pushSaveCheckpoint } from './checkpointService';
import type { GameAction } from '../types/actions';
import type { GameSave, Item } from '../types/schema';

type PhoneContact = {
  name: string;
  alias?: string;
  phone?: string;
  blocked?: boolean;
};

type PhoneDataCache = {
  contacts?: Record<string, PhoneContact>;
};

export type PhoneAction = {
  id: string;
  messageId: number;
  raw: string;
  amount?: number;
  platform?: string;
  itemName?: string;
};

function getPhoneDataCacheKey(): string {
  const chatId = SillyTavern.getCurrentChatId?.() || 'default';
  return `mini-phone-data-${chatId}`;
}

export function readPhoneDataCache(): PhoneDataCache | null {
  try {
    const raw = window.parent.localStorage.getItem(getPhoneDataCacheKey());
    return raw ? JSON.parse(raw) as PhoneDataCache : null;
  } catch {
    return null;
  }
}

function extractAmount(raw: string): number | undefined {
  const match = /(?:¥|￥)\s*(\d+(?:\.\d+)?)/.exec(raw) ?? /(?:花了|合计|价格|票价)\s*(\d+(?:\.\d+)?)\s*元?/.exec(raw);
  return match ? Number(match[1]) : undefined;
}

function extractItemName(raw: string): string | undefined {
  return /[「“"]([^」”"]+)[」”"]/.exec(raw)?.[1]
    ?? /(?:购买|下单|点了|买了)([^，。；\n]+)/.exec(raw)?.[1]?.trim();
}

function extractPlatform(raw: string): string | undefined {
  if (/外卖|吃点啥/.test(raw)) return '外卖';
  if (/二手|闲转|闲鱼/.test(raw)) return '闲鱼';
  if (/购物|淘点|淘宝/.test(raw)) return '淘宝';
  if (/电影/.test(raw)) return '电影票';
  if (/打车|出租车/.test(raw)) return '打车';
  return undefined;
}

export function extractPhoneActionsFromMessage(message: string, messageId: number): PhoneAction[] {
  const marker = '📱 手机操作：';
  const index = message.indexOf(marker);
  if (index < 0) return [];
  const content = message.slice(index + marker.length).trim();
  if (!content) return [];
  return content
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((raw, lineIndex) => ({
      id: `phone_${messageId}_${lineIndex}_${raw.slice(0, 12)}`,
      messageId,
      raw,
      amount: extractAmount(raw),
      platform: extractPlatform(raw),
      itemName: extractItemName(raw),
    }));
}

function hasHandledPhoneAction(save: GameSave, phoneActionId: string): boolean {
  return save.actionLog.some(log => log.metadata.phoneActionId === phoneActionId);
}

function actionFromPhoneAction(action: PhoneAction): GameAction {
  if (action.amount && action.platform && action.itemName && !/打车|外卖|电影票/.test(action.platform)) {
    const item: Item = {
      id: `phone_item_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: action.itemName,
      description: `来自小手机操作：${action.raw}`,
      quantity: 1,
      portable: true,
      source: action.platform,
    };
    return { type: 'PHONE_PURCHASE', item, cost: action.amount, platform: action.platform, phoneActionId: action.id };
  }
  if (action.amount && action.platform) {
    return {
      type: 'MONEY_CHANGE',
      amount: -Math.abs(action.amount),
      desc: `小手机操作：${action.raw.slice(0, 40)}`,
      source: '小手机',
    };
  }
  return { type: 'PHONE_ACTION_SYNC', raw: action.raw, phoneActionId: action.id };
}

export function findUnappliedPhoneActions(save: GameSave, lookback = 12): PhoneAction[] {
  const lastId = getLastMessageId();
  const start = Math.max(0, lastId - lookback + 1);
  const messages = getChatMessages(`${start}-${lastId}`, { role: 'user' });
  return messages
    .flatMap(message => extractPhoneActionsFromMessage(message.message, message.message_id))
    .filter(action => !hasHandledPhoneAction(save, action.id));
}

export function syncPhoneActions(save: GameSave, lookback = 12): PhoneAction[] {
  const actions = findUnappliedPhoneActions(save, lookback);
  if (actions.length > 0) {
    pushSaveCheckpoint(save, {
      actionType: 'PHONE_SYNC',
      label: `小手机同步 ${actions.length} 条`,
    });
  }
  for (const action of actions) {
    const gameAction = actionFromPhoneAction(action);
    const result = dispatchGameAction(save, gameAction, {
      checkpoint: false,
      persist: false,
    });
    if (gameAction.type !== 'PHONE_PURCHASE') {
      save.actionLog[save.actionLog.length - 1].metadata.phoneActionId = action.id;
    }
    if (!result.ok) {
      console.warn('[澜景市] 小手机操作同步失败:', result.message);
    }
  }
  return actions;
}

export function syncPhoneContacts(save: GameSave): number {
  const phoneData = readPhoneDataCache();
  if (!phoneData?.contacts) return 0;
  let changed = 0;
  for (const char of Object.values(save.chars)) {
    const contact = phoneData.contacts[char.name];
    if (!contact) continue;
    char.social.isFriend = true;
    char.social.isBlocked = Boolean(contact.blocked);
    char.social.shanxunNickname = contact.alias || char.social.shanxunNickname || char.name;
    char.social.shanxunId = contact.phone || char.social.shanxunId;
    changed += 1;
  }
  return changed;
}
