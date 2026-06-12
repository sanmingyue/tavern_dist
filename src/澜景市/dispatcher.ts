import { addAppointment, removeAppointment } from './engine/calendar';
import { addItem, addProperty, changeMoney, phonePurchase, removeItem, removeProperty } from './engine/economy';
import { changeLandmark } from './engine/landmark';
import { addMemory, updateRelationship } from './engine/relationship';
import { advanceGameTime, applyTimestamp, tickSave } from './engine/tick';
import { changeLocation } from './engine/travel';
import type { ActionResult, GameAction } from './types/actions';
import type { GameSave } from './types/schema';

export function dispatchAction(save: GameSave, action: GameAction): ActionResult {
  if (action.type !== 'GAME_INIT' && action.type !== 'TIME_SET') {
    tickSave(save, Date.now());
  }

  const result = dispatchWithoutTick(save, action);
  save.savedAt = Date.now();
  save.actionLog.push({
    id: `action_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: action.type,
    timestamp: save.time.current,
    message: result.message,
    ok: result.ok,
    metadata: action.type === 'PHONE_PURCHASE' && action.phoneActionId ? { phoneActionId: action.phoneActionId } : {},
  });
  return result;
}

function dispatchWithoutTick(save: GameSave, action: GameAction): ActionResult {
  switch (action.type) {
    case 'GAME_INIT':
      save.user = {
        name: action.userData.name,
        age: action.userData.age,
        birthday: action.userData.birthday,
        background: action.userData.background,
        bazi: action.userData.bazi,
        fortune: action.userData.fortune,
        residence: action.userData.residence,
        appearance: action.userData.appearance,
        internal: action.userData.internal,
        currentLocationId: action.userData.currentLocationId,
        inventory: action.userData.inventory,
      };
      save.assets.money = action.userData.initialMoney;
      save.assets.items = [...action.userData.inventory];
      save.gameStarted = true;
      return { ok: true, tone: 'green', message: '澜景市存档已初始化', save, shouldAskAI: true };
    case 'LOCATION_CHANGE':
      return changeLocation(save, action.targetId);
    case 'TIME_ADVANCE':
      advanceGameTime(save, action.minutes, action.reason ?? '手动推进');
      return { ok: true, tone: 'blue', message: `时间推进 ${action.minutes} 分钟`, save };
    case 'TIME_SET':
      applyTimestamp(save, action.current);
      return { ok: true, tone: 'blue', message: `时间同步到 ${action.current}`, save };
    case 'MONEY_CHANGE':
      return changeMoney(save, action.amount, action.desc, action.source);
    case 'ITEM_ADD':
      return addItem(save, action.item);
    case 'ITEM_REMOVE':
      return removeItem(save, action.itemId, action.quantity);
    case 'PROPERTY_ADD':
      return addProperty(save, action.property);
    case 'PROPERTY_REMOVE':
      return removeProperty(save, action.propertyId);
    case 'RELATIONSHIP_UPDATE':
      return updateRelationship(save, action.charId, action.delta, action.event);
    case 'MEMORY_ADD':
      return addMemory(save, action.charId, action.memory);
    case 'APPOINTMENT_ADD':
      addAppointment(save, action.appointment);
      return { ok: true, tone: 'green', message: `已添加约定：${action.appointment.title}`, save };
    case 'APPOINTMENT_REMOVE':
      return {
        ok: removeAppointment(save, action.appointmentId),
        tone: 'yellow',
        message: `已移除约定：${action.appointmentId}`,
        save,
      };
    case 'LANDMARK_CHANGE':
      return changeLandmark(save, action.locationId, action.change);
    case 'CHAR_SCHEDULE_OVERRIDE':
      if (!save.chars[action.charId]) return { ok: false, tone: 'red', message: `未知角色：${action.charId}`, save };
      save.chars[action.charId].schedule.overrides.push(action.override);
      return { ok: true, tone: 'green', message: `已覆盖角色日程：${action.charId}`, save };
    case 'PHONE_PURCHASE':
      return phonePurchase(save, action.item, action.cost, action.platform);
    case 'PHONE_ACTION_SYNC':
      return { ok: true, tone: 'blue', message: `已同步手机操作：${action.raw.slice(0, 40)}`, save };
    case 'COMMS_SEND':
      return { ok: true, tone: 'blue', message: `已接收玩家输入：${action.text.slice(0, 40)}`, save, shouldAskAI: true };
    case 'TICK_NOW':
      tickSave(save, Date.now());
      return { ok: true, tone: 'blue', message: '已执行 Tick', save };
    default: {
      const neverAction: never = action;
      return { ok: false, tone: 'red', message: `未知动作：${JSON.stringify(neverAction)}`, save };
    }
  }
}
