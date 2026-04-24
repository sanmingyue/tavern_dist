import type { Schema } from '../../../schema';

// ============================================================
// 参赛配置系统逻辑 — 纯前端计算
// ============================================================

type Tier = 'T5' | 'T4' | 'T3' | 'T2' | 'T1' | 'T0';
type RaceType = '场地赛' | '街道赛' | '拉力赛' | '漂移赛' | '耐力赛';

// ---------- 赛事点数限制表 ----------

export interface TierLimit {
  totalPoints: number;
  maxPerStat: number;
}

export const TIER_LIMITS: Record<Tier, TierLimit> = {
  T5: { totalPoints: 150, maxPerStat: 50 },
  T4: { totalPoints: 200, maxPerStat: 65 },
  T3: { totalPoints: 260, maxPerStat: 75 },
  T2: { totalPoints: 330, maxPerStat: 85 },
  T1: { totalPoints: 400, maxPerStat: 92 },
  T0: { totalPoints: 480, maxPerStat: 100 },
};

// ---------- 报名费表 ----------

export const ENROLL_FEE: Record<Tier, number> = {
  T5: 200,
  T4: 500,
  T3: 1500,
  T2: 5000,
  T1: 20000,
  T0: 100000,
};

// ---------- 赛事等级解锁条件 ----------

export const UNLOCK_REQUIREMENTS: Record<Tier, { requiredPoints: number; requiredTier: Tier | null }> = {
  T5: { requiredPoints: 0, requiredTier: null },
  T4: { requiredPoints: 100, requiredTier: 'T5' },
  T3: { requiredPoints: 200, requiredTier: 'T4' },
  T2: { requiredPoints: 300, requiredTier: 'T3' },
  T1: { requiredPoints: 500, requiredTier: 'T2' },
  T0: { requiredPoints: 1000, requiredTier: 'T1' },
};

// ---------- 赛事类型可用性 ----------

export const AVAILABLE_RACE_TYPES: Record<Tier, RaceType[]> = {
  T5: ['场地赛', '街道赛'],
  T4: ['场地赛', '街道赛', '漂移赛'],
  T3: ['场地赛', '街道赛', '拉力赛', '漂移赛', '耐力赛'],
  T2: ['场地赛', '街道赛', '拉力赛', '漂移赛', '耐力赛'],
  T1: ['场地赛', '街道赛', '拉力赛', '漂移赛', '耐力赛'],
  T0: ['场地赛', '街道赛', '拉力赛', '漂移赛', '耐力赛'],
};

const TIER_ORDER: Record<Tier, number> = { T5: 0, T4: 1, T3: 2, T2: 3, T1: 4, T0: 5 };

/** 检查赛事等级是否已解锁 */
export function isTierUnlocked(tier: Tier, data: Schema): boolean {
  return TIER_ORDER[data.主角.$已解锁等级] >= TIER_ORDER[tier];
}

/** 计算五维滑动条最大值 */
export function getStatMax(
  originalValue: number,
  tierMaxPerStat: number,
): number {
  return Math.min(Math.floor(originalValue), tierMaxPerStat);
}

/** 验证参赛配置 */
export function validateConfig(
  stats: { 加速度: number; 极速: number; 操控: number; 漂移: number; 耐久: number },
  tier: Tier,
  originalStats: { 加速度: number; 极速: number; 操控: number; 漂移: number; 耐久: number },
): { valid: boolean; errors: string[] } {
  const limit = TIER_LIMITS[tier];
  const errors: string[] = [];
  const total = stats.加速度 + stats.极速 + stats.操控 + stats.漂移 + stats.耐久;

  if (total > limit.totalPoints) {
    errors.push(`五维总和 ${total} 超过限制 ${limit.totalPoints}`);
  }

  for (const [key, value] of Object.entries(stats) as [keyof typeof stats, number][]) {
    if (value > limit.maxPerStat) {
      errors.push(`${key} (${value}) 超过单项上限 ${limit.maxPerStat}`);
    }
    if (value > Math.floor(originalStats[key])) {
      errors.push(`${key} (${value}) 超过原始值 ${Math.floor(originalStats[key])}`);
    }
    if (value < 0) {
      errors.push(`${key} 不能为负数`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/** 执行报名 */
export function performEnroll(
  data: Schema,
  tier: Tier,
  raceType: RaceType,
  mechName: string,
  raceStats: { 加速度: number; 极速: number; 操控: number; 漂移: number; 耐久: number },
  raceName: string,
): { success: boolean; error?: string } {
  // 检查信用点
  const fee = ENROLL_FEE[tier];
  if (data.主角.$信用点数 < fee) {
    return { success: false, error: `信用点不足（需要 ${fee}，当前 ${data.主角.$信用点数}）` };
  }

  // 扣除报名费
  data.主角.$信用点数 -= fee;

  // 写入比赛数据
  data.世界._当前状态 = '赛前准备';
  data.当前比赛._赛事名称 = raceName;
  data.当前比赛._赛事类型 = raceType;
  data.当前比赛._赛事级别 = tier;
  data.当前比赛._搭档机娘 = mechName;
  data.当前比赛._参赛五维 = raceStats;
  data.当前比赛.当前圈数 = 0;
  data.当前比赛.总圈数 = 0;
  data.当前比赛.当前排名 = 0;
  data.当前比赛.赛道状态 = null;
  data.当前比赛.对手 = {};

  return { success: true };
}

/** 开始比赛（赛前准备 → 比赛中） */
export function startRace(data: Schema): void {
  data.世界._当前状态 = '比赛中';
}

/** 结束比赛（比赛中 → 日常） */
export function endRace(data: Schema): void {
  data.世界._当前状态 = '日常';
}
