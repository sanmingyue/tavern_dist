import type { Schema } from '../../../schema';

// ============================================================
// 改装系统逻辑 — 纯前端安装/拆卸
// ============================================================

type Tier = 'T5' | 'T4' | 'T3' | 'T2' | 'T1' | 'T0';
const TIER_ORDER: Record<Tier, number> = { T5: 0, T4: 1, T3: 2, T2: 3, T1: 4, T0: 5 };

/** 检查是否可以安装外形改件 */
export function canInstallSkin(playerTier: Tier): { ok: boolean; reason?: string } {
  if (TIER_ORDER[playerTier] < TIER_ORDER.T2) {
    return { ok: false, reason: `外形改件需要 T2 以上赛事等级（当前 ${playerTier}）` };
  }
  return { ok: true };
}

/** 检查是否可以安装技能改件 */
export function canInstallSkill(playerTier: Tier, mechHasSkill: boolean): { ok: boolean; reason?: string } {
  if (TIER_ORDER[playerTier] < TIER_ORDER.T1) {
    return { ok: false, reason: `技能改件需要 T1 以上赛事等级（当前 ${playerTier}）` };
  }
  if (mechHasSkill) {
    return { ok: false, reason: '技能插槽已满，需先拆卸当前技能改件' };
  }
  return { ok: true };
}

/** 安装外形改件：仓库 → 机娘 */
export function installSkinMod(data: Schema, mechName: string, warehouseIndex: number): boolean {
  const mech = data.机娘库[mechName];
  if (!mech) return false;

  const warehouse = data.主角.$改件仓库.外形改件;
  if (warehouseIndex < 0 || warehouseIndex >= warehouse.length) return false;

  const item = warehouse.splice(warehouseIndex, 1)[0];
  mech._外形改件.push(item);
  return true;
}

/** 安装技能改件：仓库 → 机娘 */
export function installSkillMod(data: Schema, mechName: string, warehouseIndex: number): boolean {
  const mech = data.机娘库[mechName];
  if (!mech) return false;
  if (mech._技能改件 !== null) return false;

  const warehouse = data.主角.$改件仓库.技能改件;
  if (warehouseIndex < 0 || warehouseIndex >= warehouse.length) return false;

  const item = warehouse.splice(warehouseIndex, 1)[0];
  mech._技能改件 = item;
  return true;
}

/** 拆卸外形改件：机娘 → 仓库 */
export function uninstallSkinMod(data: Schema, mechName: string, mechIndex: number): boolean {
  const mech = data.机娘库[mechName];
  if (!mech) return false;
  if (mechIndex < 0 || mechIndex >= mech._外形改件.length) return false;

  const item = mech._外形改件.splice(mechIndex, 1)[0];
  data.主角.$改件仓库.外形改件.push(item);
  return true;
}

/** 拆卸技能改件：机娘 → 仓库 */
export function uninstallSkillMod(data: Schema, mechName: string): boolean {
  const mech = data.机娘库[mechName];
  if (!mech || mech._技能改件 === null) return false;

  data.主角.$改件仓库.技能改件.push(mech._技能改件);
  mech._技能改件 = null;
  return true;
}
