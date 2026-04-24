import type { Schema } from '../../../schema';

// ============================================================
// 比赛结算系统 — 纯前端计算，AI 不参与
// ============================================================

type Tier = 'T5' | 'T4' | 'T3' | 'T2' | 'T1' | 'T0';
type RaceType = '场地赛' | '街道赛' | '拉力赛' | '漂移赛' | '耐力赛';
type Dimension = '加速度' | '极速' | '操控' | '漂移' | '耐久';
type Quality = '基础级' | '精密级' | '极品级';

// ---------- 奖金表 ----------

const PRIZE_TABLE: Record<Tier, [number, number, number, number]> = {
  T5: [1000, 600, 300, 150],
  T4: [4000, 2400, 1200, 400],
  T3: [12000, 7000, 3500, 1000],
  T2: [40000, 24000, 12000, 4000],
  T1: [150000, 90000, 45000, 15000],
  T0: [750000, 450000, 225000, 75000],
};

// ---------- 积分表 ----------

const POINTS_TABLE: Record<Tier, [number, number, number, number]> = {
  T5: [25, 15, 10, 3],
  T4: [40, 25, 15, 5],
  T3: [60, 35, 20, 8],
  T2: [80, 50, 30, 12],
  T1: [120, 70, 40, 15],
  T0: [200, 120, 60, 25],
};

function getRankIndex(rank: number): number {
  if (rank === 1) return 0;
  if (rank === 2) return 1;
  if (rank === 3) return 2;
  return 3; // 参与奖
}

export function calculatePrize(tier: Tier, rank: number): number {
  return PRIZE_TABLE[tier][getRankIndex(rank)];
}

export function calculatePoints(tier: Tier, rank: number): number {
  return POINTS_TABLE[tier][getRankIndex(rank)];
}

// ---------- 比赛类型 → 强化物品维度映射 ----------

const RACE_TYPE_DIMENSIONS: Record<RaceType, { primary: Dimension; secondary: Dimension | null }> = {
  场地赛: { primary: '极速', secondary: '加速度' },
  街道赛: { primary: '操控', secondary: '漂移' },
  拉力赛: { primary: '耐久', secondary: '操控' },
  漂移赛: { primary: '漂移', secondary: null },
  耐力赛: { primary: '耐久', secondary: '极速' },
};

// 维度 → 强化物品ID前缀映射
const DIMENSION_ITEM_PREFIX: Record<Dimension, string> = {
  加速度: 'E-ACC',
  极速: 'E-SPD',
  操控: 'E-HDL',
  漂移: 'E-DFT',
  耐久: 'E-END',
};

export interface EnhanceItemReward {
  itemId: string;
  name: string;
  quality: Quality;
  dimension: Dimension;
  count: number;
}

// ---------- 强化物品奖励表 ----------

interface RewardSpec {
  quality: Quality;
  count: number;
  type: 'primary' | 'secondary';
}

const ENHANCE_REWARD_TABLE: Record<Tier, Record<number, RewardSpec[]>> = {
  T5: {
    1: [{ quality: '基础级', count: 1, type: 'primary' }, { quality: '基础级', count: 1, type: 'secondary' }],
    2: [{ quality: '基础级', count: 1, type: 'primary' }],
  },
  T4: {
    1: [{ quality: '基础级', count: 2, type: 'primary' }, { quality: '基础级', count: 1, type: 'secondary' }],
    2: [{ quality: '基础级', count: 2, type: 'primary' }],
    3: [{ quality: '基础级', count: 1, type: 'primary' }],
  },
  T3: {
    1: [{ quality: '精密级', count: 1, type: 'primary' }, { quality: '基础级', count: 1, type: 'primary' }, { quality: '基础级', count: 1, type: 'secondary' }],
    2: [{ quality: '基础级', count: 3, type: 'primary' }],
    3: [{ quality: '基础级', count: 2, type: 'primary' }],
    4: [{ quality: '基础级', count: 1, type: 'primary' }], // 参与奖
  },
  T2: {
    1: [{ quality: '精密级', count: 1, type: 'primary' }, { quality: '精密级', count: 1, type: 'secondary' }],
    2: [{ quality: '精密级', count: 1, type: 'primary' }, { quality: '基础级', count: 2, type: 'primary' }],
    3: [{ quality: '精密级', count: 1, type: 'primary' }],
    4: [{ quality: '基础级', count: 1, type: 'primary' }],
  },
  T1: {
    1: [{ quality: '极品级', count: 1, type: 'primary' }, { quality: '精密级', count: 1, type: 'secondary' }],
    2: [{ quality: '精密级', count: 2, type: 'primary' }],
    3: [{ quality: '精密级', count: 1, type: 'primary' }],
    4: [{ quality: '基础级', count: 2, type: 'primary' }],
  },
  T0: {
    1: [{ quality: '极品级', count: 1, type: 'primary' }, { quality: '极品级', count: 1, type: 'secondary' }],
    2: [{ quality: '极品级', count: 1, type: 'primary' }, { quality: '精密级', count: 1, type: 'primary' }],
    3: [{ quality: '精密级', count: 2, type: 'primary' }],
    4: [{ quality: '精密级', count: 1, type: 'primary' }],
  },
};

const QUALITY_SUFFIX: Record<Quality, string> = {
  '基础级': '-1',
  '精密级': '-2',
  '极品级': '-3',
};

const DIMENSION_NAMES: Record<Dimension, string> = {
  加速度: '涡轮增压芯片',
  极速: '极速调谐模块',
  操控: '操控稳定陀螺',
  漂移: '漂移校准棱镜',
  耐久: '耐久强化纤维',
};

const QUALITY_NAMES: Record<Quality, string> = {
  '基础级': '基础型',
  '精密级': '精密型',
  '极品级': '极品型',
};

export function calculateEnhanceReward(tier: Tier, rank: number, raceType: RaceType): EnhanceItemReward[] {
  const dims = RACE_TYPE_DIMENSIONS[raceType];
  const rankKey = Math.min(rank, 4);
  const specs = ENHANCE_REWARD_TABLE[tier][rankKey];
  if (!specs) return [];

  const rewards: EnhanceItemReward[] = [];
  for (const spec of specs) {
    const dim = spec.type === 'primary' ? dims.primary : dims.secondary;
    if (!dim) continue;
    const itemId = DIMENSION_ITEM_PREFIX[dim] + QUALITY_SUFFIX[spec.quality];
    rewards.push({
      itemId,
      name: `${DIMENSION_NAMES[dim]}·${QUALITY_NAMES[spec.quality]}`,
      quality: spec.quality,
      dimension: dim,
      count: spec.count,
    });
  }
  return rewards;
}

// ---------- 执行结算 ----------

export interface SettleResult {
  prize: number;
  points: number;
  enhanceItems: EnhanceItemReward[];
  isPromotion: boolean;
  promotedTo: Tier | null;
}

export function settleRace(data: Schema): SettleResult | null {
  const tier = data.当前比赛._赛事级别;
  const rank = data.当前比赛.当前排名;
  const raceType = data.当前比赛._赛事类型;

  if (!tier || !raceType || rank <= 0) return null;

  // 1. 计算奖金
  const prize = calculatePrize(tier, rank);
  data.主角.$信用点数 += prize;

  // 2. 计算积分
  const points = calculatePoints(tier, rank);
  data.主角.$赛季积分 += points;

  // 3. 发放强化物品
  const enhanceItems = calculateEnhanceReward(tier, rank, raceType);
  for (const item of enhanceItems) {
    const current = data.主角.$改件仓库.强化物品[item.itemId] ?? 0;
    data.主角.$改件仓库.强化物品[item.itemId] = current + item.count;
  }

  // 4. 检查晋级赛
  let isPromotion = false;
  let promotedTo: Tier | null = null;
  // TODO: 晋级赛判定逻辑（需要 trackData 中的专属赛道标记）

  // 5. 清空比赛数据
  data.当前比赛._赛事名称 = null;
  data.当前比赛._赛事类型 = null;
  data.当前比赛._赛事级别 = null;
  data.当前比赛.当前圈数 = 0;
  data.当前比赛.总圈数 = 0;
  data.当前比赛.当前排名 = 0;
  data.当前比赛._搭档机娘 = null;
  data.当前比赛._参赛五维 = { 加速度: 0, 极速: 0, 操控: 0, 漂移: 0, 耐久: 0 };
  data.当前比赛.赛道状态 = null;
  data.当前比赛.对手 = {};

  return { prize, points, enhanceItems, isPromotion, promotedTo };
}
