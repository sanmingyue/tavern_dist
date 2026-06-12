import type { ActionResult, MoneySource } from '../types/actions';
import type { GameSave, Item, Property } from '../types/schema';

function currentTime(save: GameSave): string {
  return save.time.current;
}

export function changeMoney(
  save: GameSave,
  amount: number,
  desc: string,
  source: MoneySource = '其他',
): ActionResult<{ amount: number }> {
  const next = save.assets.money + amount;
  if (next < 0) {
    return {
      ok: false,
      tone: 'red',
      message: `余额不足：${desc}`,
      save,
      data: { amount },
    };
  }
  save.assets.money = next;
  save.assets.transactions.push({
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: currentTime(save),
    type: amount >= 0 ? '收入' : '支出',
    amount: Math.abs(amount),
    description: desc,
    source,
  });
  return {
    ok: true,
    tone: amount >= 0 ? 'green' : 'yellow',
    message: `${desc}：${amount >= 0 ? '+' : ''}${amount} 元`,
    save,
    data: { amount },
  };
}

export function addItem(save: GameSave, item: Item): ActionResult<{ item: Item }> {
  const existing = save.assets.items.find(target => target.id === item.id);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    save.assets.items.push(item);
  }
  return { ok: true, tone: 'green', message: `已获得：${item.name} x${item.quantity}`, save, data: { item } };
}

export function removeItem(save: GameSave, itemId: string, quantity: number): ActionResult {
  const item = save.assets.items.find(target => target.id === itemId);
  if (!item || item.quantity < quantity) {
    return { ok: false, tone: 'red', message: `物品不足：${itemId}`, save };
  }
  item.quantity -= quantity;
  if (item.quantity <= 0) {
    save.assets.items = save.assets.items.filter(target => target.id !== itemId);
  }
  return { ok: true, tone: 'yellow', message: `已移除物品：${item.name} x${quantity}`, save };
}

export function addProperty(save: GameSave, property: Property): ActionResult<{ property: Property }> {
  save.assets.properties.push(property);
  return { ok: true, tone: 'green', message: `已添加资产：${property.name}`, save, data: { property } };
}

export function removeProperty(save: GameSave, propertyId: string): ActionResult {
  const before = save.assets.properties.length;
  save.assets.properties = save.assets.properties.filter(property => property.id !== propertyId);
  return {
    ok: save.assets.properties.length !== before,
    tone: save.assets.properties.length !== before ? 'yellow' : 'red',
    message: save.assets.properties.length !== before ? `已移除资产：${propertyId}` : `未找到资产：${propertyId}`,
    save,
  };
}

export function phonePurchase(save: GameSave, item: Item, cost: number, platform: string): ActionResult {
  const moneyResult = changeMoney(save, -Math.abs(cost), `${platform}购买：${item.name}`, platformToSource(platform));
  if (!moneyResult.ok) return moneyResult;
  addItem(save, item);
  return { ok: true, tone: 'green', message: `${platform}购买完成：${item.name}`, save };
}

function platformToSource(platform: string): MoneySource {
  if (platform.includes('外卖')) return '外卖';
  if (platform.includes('闲') || platform.includes('二手')) return '闲鱼';
  if (platform.includes('电影')) return '电影票';
  if (platform.includes('淘宝') || platform.includes('购物')) return '淘宝';
  return '小手机';
}
