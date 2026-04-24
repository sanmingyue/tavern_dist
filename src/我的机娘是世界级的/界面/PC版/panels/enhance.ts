import type { Schema } from '../../../schema';

// ============================================================
// 强化系统核心逻辑 — 所有计算纯前端完成，AI 不参与
// ============================================================

type Dimension = '加速度' | '极速' | '操控' | '漂移' | '耐久';
type Quality = '基础级' | '精密级' | '极品级';

/** 密码学安全随机数 [0, 1) */
function secureRandom(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] / (0xffffffff + 1);
}

/** 强化判定 */
export function rollEnhance(successRate: number): boolean {
  return secureRandom() < successRate;
}

// ---------- 因子A：当前维度值区间基础率 ----------

interface RateEntry {
  max: number;
  talent: number;
  normal: number;
}

const BASE_RATE_TABLE: RateEntry[] = [
  { max: 30, talent: 0.95, normal: 0.80 },
  { max: 50, talent: 0.90, normal: 0.65 },
  { max: 65, talent: 0.80, normal: 0.45 },
  { max: 75, talent: 0.65, normal: 0.30 },
  { max: 85, talent: 0.45, normal: 0.18 },
  { max: 92, talent: 0.25, normal: 0.08 },
  { max: 97, talent: 0.12, normal: 0.03 },
  { max: 99, talent: 0.05, normal: 0.01 },
  { max: 100, talent: 0.02, normal: 0.005 },
  { max: 100.9, talent: 0.02, normal: 0.005 },
];

function getBaseRate(value: number, isTalent: boolean): number {
  for (const entry of BASE_RATE_TABLE) {
    if (value <= entry.max) {
      return isTalent ? entry.talent : entry.normal;
    }
  }
  return isTalent ? 0.02 : 0.005;
}

// ---------- 因子B：整体赛车等级加成 ----------

function getTierBonus(totalStats: number): number {
  if (totalStats <= 200) return 0;
  if (totalStats <= 280) return 0.03;
  if (totalStats <= 350) return 0.05;
  if (totalStats <= 400) return 0.07;
  if (totalStats <= 440) return 0.04;
  if (totalStats <= 470) return 0.02;
  return 0;
}

// ---------- 因子C：强化物品品质加成（递减式） ----------

function getQualityBonus(value: number, quality: Quality): number {
  if (quality === '基础级') return 0;

  if (value <= 75) {
    return quality === '精密级' ? 0.05 : 0.10;
  } else if (value <= 92) {
    return quality === '精密级' ? 0.03 : 0.05;
  } else if (value <= 100) {
    return quality === '精密级' ? 0.01 : 0.02;
  } else {
    // 100+ 小数区间
    return quality === '精密级' ? 0.005 : 0.01;
  }
}

// ---------- 最终成功率 ----------

export function calculateSuccessRate(
  currentValue: number,
  isTalent: boolean,
  totalStats: number,
  quality: Quality,
): number {
  const baseRate = getBaseRate(currentValue, isTalent);
  const tierBonus = getTierBonus(totalStats);
  const qualityBonus = getQualityBonus(currentValue, quality);
  const raw = baseRate + tierBonus + qualityBonus;
  return Math.min(Math.max(raw, 0.005), 0.95);
}

// ---------- 信用点消耗 ----------

interface CostEntry {
  max: number;
  talent: number;
  normal: number;
}

const COST_TABLE: CostEntry[] = [
  { max: 50, talent: 500, normal: 1000 },
  { max: 75, talent: 1000, normal: 3000 },
  { max: 85, talent: 2000, normal: 5000 },
  { max: 92, talent: 3000, normal: 8000 },
  { max: 97, talent: 5000, normal: 15000 },
  { max: 100, talent: 10000, normal: 30000 },
  { max: 100.9, talent: 20000, normal: 50000 },
];

export function calculateCreditCost(currentValue: number, isTalent: boolean): number {
  for (const entry of COST_TABLE) {
    if (currentValue <= entry.max) {
      return isTalent ? entry.talent : entry.normal;
    }
  }
  return isTalent ? 20000 : 50000;
}

// ---------- 强化增量 ----------

export function getEnhanceIncrement(currentValue: number): number {
  return currentValue >= 100 ? 0.1 : 1;
}

// ---------- 执行强化 ----------

export interface EnhanceResult {
  success: boolean;
  dimension: Dimension;
  oldValue: number;
  newValue: number;
  creditCost: number;
  itemId: string;
  successRate: number;
}

export function performEnhance(
  data: Schema,
  mechName: string,
  dimension: Dimension,
  itemId: string,
  quality: Quality,
): EnhanceResult | { error: string } {
  const mech = data.机娘库[mechName];
  if (!mech) return { error: '未找到机娘' };

  const currentValue = mech._五维[dimension];
  if (currentValue >= 100.9) return { error: '该维度已达上限' };

  const isTalent = mech._天赋维度.includes(dimension);

  // 计算五维总和
  const totalStats = Object.values(mech._五维).reduce((sum, v) => sum + v, 0);

  // 计算成功率
  const successRate = calculateSuccessRate(currentValue, isTalent, totalStats, quality);

  // 计算消耗
  const creditCost = calculateCreditCost(currentValue, isTalent);

  // 检查信用点
  if (data.主角.$信用点数 < creditCost) return { error: `信用点不足（需要 ${creditCost}）` };

  // 检查强化物品
  const itemCount = data.主角.$改件仓库.强化物品[itemId] ?? 0;
  if (itemCount <= 0) return { error: '强化物品不足' };

  // 扣除消耗
  data.主角.$信用点数 -= creditCost;
  data.主角.$改件仓库.强化物品[itemId] = itemCount - 1;

  // 判定
  const success = rollEnhance(successRate);
  const oldValue = currentValue;
  let newValue = currentValue;

  if (success) {
    const increment = getEnhanceIncrement(currentValue);
    newValue = Math.round((currentValue + increment) * 10) / 10;
    mech._五维[dimension] = newValue;
  }

  return { success, dimension, oldValue, newValue, creditCost, itemId, successRate };
}
