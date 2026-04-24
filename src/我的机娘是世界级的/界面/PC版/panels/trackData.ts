
// ============================================================
// 专属进阶赛道数据 — 前端预写，精确到每个弯道
// T5×2 + T4×3 + T3×5 + T2×5 + T1×5 + T0×5 = 25条
// ============================================================

export interface TrackSegTurn {
  id: string;
  type: string;
  ang: number;
  spd: number;
  diff: number;
  note: string;
}

export interface TrackSegStraight {
  len: number;
  slope: string;
  note: string;
}

export interface TrackSegment {
  id: string;
  feat: string;
  len: number;
  t: TrackSegTurn[];
  str: TrackSegStraight[];
}

export interface TrackData {
  name: string;
  loc: string;
  type: string;
  len: number;
  turns: number;
  maxSpd: number;
  width: number;
  surface: string;
  elev: number;
  safety: string;
  weather: string;
  seg: TrackSegment[];
  overtake: string[];
  danger: string[];
  pit: { in: string; out: string; len: number; limit: number };
  lore: string;
}

export type Tier = 'T5' | 'T4' | 'T3' | 'T2' | 'T1' | 'T0';
export type RaceType = '场地赛' | '街道赛' | '拉力赛' | '漂移赛' | '耐力赛';

export interface PromotionTrack {
  tier: Tier;
  raceType: RaceType;
  track: TrackData;
}

// ============================================================
// T5 晋级赛 (2条: 场地赛、街道赛)
// ============================================================

const T5_CIRCUIT: PromotionTrack = {
  tier: 'T5', raceType: '场地赛',
  track: {
    name: '新星训练场', loc: '横滨', type: '场地', len: 2.8, turns: 8, maxSpd: 200, width: 14, surface: '沥青', elev: 5, safety: 'A', weather: '晴朗',
    seg: [
      { id: 'S1', feat: '起步加速区', len: 900, t: [
        { id: 'T1', type: '中速弯', ang: 90, spd: 120, diff: 2, note: '入门级直角弯' },
        { id: 'T2', type: '高速弯', ang: 60, spd: 160, diff: 1, note: '缓弯可全速通过' },
      ], str: [{ len: 500, slope: '平', note: '起跑直道' }] },
      { id: 'S2', feat: '技术练习区', len: 1000, t: [
        { id: 'T3', type: 'S弯', ang: 100, spd: 110, diff: 2, note: '连续S弯基础训练' },
        { id: 'T4', type: '低速弯', ang: 120, spd: 80, diff: 3, note: '减速入弯练习' },
        { id: 'T5', type: '中速弯', ang: 80, spd: 130, diff: 2, note: '出弯加速练习' },
      ], str: [{ len: 300, slope: '平', note: '' }] },
      { id: 'S3', feat: '冲刺回归区', len: 900, t: [
        { id: 'T6', type: '高速弯', ang: 45, spd: 170, diff: 1, note: '高速缓弯' },
        { id: 'T7', type: '中速弯', ang: 90, spd: 120, diff: 2, note: '最终弯' },
        { id: 'T8', type: '高速弯', ang: 30, spd: 180, diff: 1, note: '汇入主直道' },
      ], str: [{ len: 400, slope: '平', note: '终点直道' }] },
    ],
    overtake: ['T1入弯刹车区', 'S3终点直道'], danger: ['T4出弯容易推头'], pit: { in: 'T5后', out: 'T7前', len: 200, limit: 60 }, lore: '横滨赛车学院的教学赛道，每年数千名新秀在此迈出第一步',
  },
};

const T5_STREET: PromotionTrack = {
  tier: 'T5', raceType: '街道赛',
  track: {
    name: '港区新手巡回', loc: '神户', type: '街道', len: 3.1, turns: 10, maxSpd: 180, width: 11, surface: '沥青', elev: 8, safety: 'B', weather: '多云',
    seg: [
      { id: 'S1', feat: '港口直道区', len: 1000, t: [
        { id: 'T1', type: '中速弯', ang: 90, spd: 100, diff: 2, note: '路面有井盖' },
        { id: 'T2', type: '低速弯', ang: 110, spd: 70, diff: 2, note: '窄巷入口' },
        { id: 'T3', type: '中速弯', ang: 80, spd: 110, diff: 2, note: '' },
      ], str: [{ len: 600, slope: '平', note: '海滨大道' }] },
      { id: 'S2', feat: '商业街穿行', len: 1100, t: [
        { id: 'T4', type: 'S弯', ang: 90, spd: 90, diff: 3, note: '路缘石突出' },
        { id: 'T5', type: '低速弯', ang: 130, spd: 60, diff: 3, note: '发夹弯前有减速带' },
        { id: 'T6', type: '中速弯', ang: 70, spd: 120, diff: 2, note: '' },
        { id: 'T7', type: '中速弯', ang: 90, spd: 100, diff: 2, note: '' },
      ], str: [{ len: 350, slope: '上坡2%', note: '' }] },
      { id: 'S3', feat: '回港冲刺', len: 1000, t: [
        { id: 'T8', type: '高速弯', ang: 50, spd: 150, diff: 1, note: '' },
        { id: 'T9', type: '中速弯', ang: 90, spd: 110, diff: 2, note: '涂装线湿滑' },
        { id: 'T10', type: '高速弯', ang: 40, spd: 160, diff: 1, note: '' },
      ], str: [{ len: 450, slope: '下坡1%', note: '终点冲刺' }] },
    ],
    overtake: ['S1港口直道', 'T8入弯刹车区'], danger: ['T5减速带区域', 'T9涂装线湿滑'], pit: { in: 'T7后', out: 'T9前', len: 180, limit: 50 }, lore: '神户港区的入门街道赛，沿海风景优美但路面状况多变',
  },
};

// ============================================================
// T4 晋级赛 (3条: 场地赛、街道赛、漂移赛)
// ============================================================

const T4_CIRCUIT: PromotionTrack = {
  tier: 'T4', raceType: '场地赛',
  track: {
    name: '城市竞技场', loc: '大阪', type: '场地', len: 3.5, turns: 12, maxSpd: 240, width: 13, surface: '沥青', elev: 10, safety: 'A', weather: '晴',
    seg: [
      { id: 'S1', feat: '高速弯道组', len: 1200, t: [
        { id: 'T1', type: '高速弯', ang: 70, spd: 180, diff: 2, note: '' },
        { id: 'T2', type: '高速弯', ang: 55, spd: 200, diff: 2, note: '外侧有缓冲区' },
        { id: 'T3', type: '中速弯', ang: 90, spd: 140, diff: 3, note: '入弯需精确刹车' },
      ], str: [{ len: 600, slope: '平', note: '主直道' }] },
      { id: 'S2', feat: '技术弯道密集区', len: 1200, t: [
        { id: 'T4', type: 'S弯', ang: 110, spd: 120, diff: 3, note: '连续变向' },
        { id: 'T5', type: '低速弯', ang: 140, spd: 70, diff: 3, note: '发夹弯' },
        { id: 'T6', type: '中速弯', ang: 80, spd: 150, diff: 2, note: '' },
        { id: 'T7', type: '中速弯', ang: 100, spd: 130, diff: 3, note: '盲弯' },
      ], str: [{ len: 250, slope: '上坡3%', note: '' }] },
      { id: 'S3', feat: '冲刺区', len: 1100, t: [
        { id: 'T8', type: '高速弯', ang: 45, spd: 190, diff: 2, note: '' },
        { id: 'T9', type: '中速弯', ang: 90, spd: 140, diff: 2, note: '' },
        { id: 'T10', type: '高速弯', ang: 50, spd: 200, diff: 2, note: '' },
        { id: 'T11', type: '低速弯', ang: 120, spd: 80, diff: 3, note: '最终减速弯' },
        { id: 'T12', type: '高速弯', ang: 30, spd: 210, diff: 1, note: '汇入终点' },
      ], str: [{ len: 500, slope: '下坡2%', note: '终点直道' }] },
    ],
    overtake: ['S1主直道末端', 'T5发夹弯入口', 'S3终点直道'], danger: ['T7盲弯出口', 'T5发夹弯过度转向'], pit: { in: 'T9后', out: 'T11前', len: 250, limit: 60 }, lore: '大阪城市竞技场，T4级别的标志性赛道，无数车手在此证明自己',
  },
};

const T4_STREET: PromotionTrack = {
  tier: 'T4', raceType: '街道赛',
  track: {
    name: '霓虹都市环道', loc: '东京涩谷', type: '街道', len: 3.8, turns: 14, maxSpd: 220, width: 10, surface: '沥青', elev: 15, safety: 'B', weather: '夜间多云',
    seg: [
      { id: 'S1', feat: '涩谷十字路口区', len: 1300, t: [
        { id: 'T1', type: '低速弯', ang: 90, spd: 80, diff: 3, note: '路面标线湿滑' },
        { id: 'T2', type: '中速弯', ang: 70, spd: 130, diff: 2, note: '' },
        { id: 'T3', type: '低速弯', ang: 110, spd: 70, diff: 3, note: '窄道急弯' },
        { id: 'T4', type: '中速弯', ang: 80, spd: 120, diff: 2, note: '井盖密集' },
      ], str: [{ len: 400, slope: '平', note: '商业街直道' }] },
      { id: 'S2', feat: '高架桥段', len: 1300, t: [
        { id: 'T5', type: '高速弯', ang: 50, spd: 170, diff: 2, note: '高架弯道有侧风' },
        { id: 'T6', type: 'S弯', ang: 100, spd: 110, diff: 3, note: '连续变向' },
        { id: 'T7', type: '中速弯', ang: 90, spd: 130, diff: 2, note: '' },
        { id: 'T8', type: '高速弯', ang: 40, spd: 180, diff: 2, note: '' },
      ], str: [{ len: 500, slope: '上坡4%', note: '上桥直道' }] },
      { id: 'S3', feat: '地下通道回归', len: 1200, t: [
        { id: 'T9', type: '低速弯', ang: 130, spd: 60, diff: 3, note: '隧道入口急弯' },
        { id: 'T10', type: '中速弯', ang: 80, spd: 140, diff: 2, note: '隧道内照明变化' },
        { id: 'T11', type: '中速弯', ang: 90, spd: 120, diff: 2, note: '' },
        { id: 'T12', type: '高速弯', ang: 45, spd: 170, diff: 2, note: '' },
        { id: 'T13', type: '低速弯', ang: 100, spd: 80, diff: 3, note: '出隧道急弯' },
        { id: 'T14', type: '高速弯', ang: 30, spd: 190, diff: 1, note: '' },
      ], str: [{ len: 350, slope: '下坡3%', note: '终点冲刺' }] },
    ],
    overtake: ['S2高架直道', 'T9隧道入口刹车区'], danger: ['T5高架侧风', 'T9隧道入口视线突变', 'T1路面标线'], pit: { in: 'T11后', out: 'T13前', len: 200, limit: 50 }, lore: '涩谷夜间街道赛，霓虹灯光映照下的速度与激情',
  },
};

const T4_DRIFT: PromotionTrack = {
  tier: 'T4', raceType: '漂移赛',
  track: {
    name: '秋名山漂移道', loc: '群马', type: '漂移', len: 2.5, turns: 8, maxSpd: 160, width: 9, surface: '沥青', elev: 120, safety: 'B', weather: '薄雾',
    seg: [
      { id: 'S1', feat: '山路连续弯', len: 1300, t: [
        { id: 'T1', type: '中速弯', ang: 100, spd: 90, diff: 3, note: '入山第一弯' },
        { id: 'T2', type: '发夹弯', ang: 170, spd: 50, diff: 3, note: '经典发夹弯' },
        { id: 'T3', type: '中速弯', ang: 80, spd: 100, diff: 2, note: '' },
        { id: 'T4', type: '发夹弯', ang: 160, spd: 55, diff: 3, note: '连续发夹' },
      ], str: [{ len: 200, slope: '上坡8%', note: '陡坡直道' }] },
      { id: 'S2', feat: '山顶技术区', len: 1200, t: [
        { id: 'T5', type: 'S弯', ang: 120, spd: 80, diff: 3, note: '路面有落叶' },
        { id: 'T6', type: '回头弯', ang: 180, spd: 40, diff: 4, note: '山顶回头弯' },
        { id: 'T7', type: '中速弯', ang: 90, spd: 100, diff: 2, note: '' },
        { id: 'T8', type: '高速弯', ang: 50, spd: 130, diff: 2, note: '下山加速弯' },
      ], str: [{ len: 300, slope: '下坡6%', note: '下山直道' }] },
    ],
    overtake: ['T2发夹弯出口', 'T6回头弯出口'], danger: ['T6回头弯失控风险', 'T5落叶湿滑'], pit: { in: 'T4后', out: 'T6前', len: 150, limit: 40 }, lore: '传说中的秋名山，无数漂移传奇在此诞生',
  },
};

// ============================================================
// T3 晋级赛 (5条: 全部类型)
// ============================================================

const T3_CIRCUIT: PromotionTrack = { tier: 'T3', raceType: '场地赛', track: { name: '富士竞速场', loc: '静冈', type: '场地', len: 4.5, turns: 16, maxSpd: 280, width: 14, surface: '沥青', elev: 20, safety: 'A', weather: '晴', seg: [{ id: 'S1', feat: '高速直道区', len: 1500, t: [{ id: 'T1', type: '高速弯', ang: 60, spd: 220, diff: 3, note: '' }, { id: 'T2', type: '中速弯', ang: 90, spd: 160, diff: 3, note: '' }, { id: 'T3', type: '高速弯', ang: 45, spd: 240, diff: 2, note: '' }], str: [{ len: 800, slope: '平', note: '主直道' }] }, { id: 'S2', feat: '技术弯组', len: 1500, t: [{ id: 'T4', type: 'S弯', ang: 110, spd: 140, diff: 3, note: '' }, { id: 'T5', type: '低速弯', ang: 150, spd: 70, diff: 4, note: '发夹弯' }, { id: 'T6', type: '中速弯', ang: 80, spd: 160, diff: 3, note: '' }, { id: 'T7', type: '中速弯', ang: 100, spd: 140, diff: 3, note: '' }, { id: 'T8', type: '低速弯', ang: 120, spd: 90, diff: 3, note: '' }], str: [{ len: 300, slope: '上坡2%', note: '' }] }, { id: 'S3', feat: '下坡冲刺', len: 1500, t: [{ id: 'T9', type: '高速弯', ang: 50, spd: 230, diff: 3, note: '' }, { id: 'T10', type: '中速弯', ang: 90, spd: 150, diff: 3, note: '' }, { id: 'T11', type: 'S弯', ang: 100, spd: 130, diff: 3, note: '' }, { id: 'T12', type: '高速弯', ang: 40, spd: 250, diff: 2, note: '' }, { id: 'T13', type: '中速弯', ang: 80, spd: 170, diff: 3, note: '' }, { id: 'T14', type: '低速弯', ang: 110, spd: 100, diff: 3, note: '' }, { id: 'T15', type: '中速弯', ang: 70, spd: 180, diff: 2, note: '' }, { id: 'T16', type: '高速弯', ang: 30, spd: 260, diff: 2, note: '' }], str: [{ len: 500, slope: '下坡3%', note: '终点直道' }] }], overtake: ['S1主直道', 'T5发夹弯入口', 'S3终点直道'], danger: ['T5发夹弯', 'T11S弯连续变向'], pit: { in: 'T10后', out: 'T13前', len: 280, limit: 60 }, lore: '富士山脚下的经典赛道，区域赛的最高殿堂' } };

const T3_STREET: PromotionTrack = { tier: 'T3', raceType: '街道赛', track: { name: '横滨港湾环道', loc: '横滨', type: '街道', len: 4.2, turns: 15, maxSpd: 250, width: 11, surface: '沥青', elev: 12, safety: 'B', weather: '阴', seg: [{ id: 'S1', feat: '港口仓库区', len: 1400, t: [{ id: 'T1', type: '低速弯', ang: 90, spd: 80, diff: 3, note: '仓库间窄道' }, { id: 'T2', type: '中速弯', ang: 70, spd: 140, diff: 2, note: '' }, { id: 'T3', type: '低速弯', ang: 120, spd: 65, diff: 3, note: '集装箱间急弯' }, { id: 'T4', type: '中速弯', ang: 80, spd: 130, diff: 3, note: '路面有铁轨' }], str: [{ len: 500, slope: '平', note: '' }] }, { id: 'S2', feat: '海滨大道', len: 1400, t: [{ id: 'T5', type: '高速弯', ang: 50, spd: 200, diff: 2, note: '海风侧吹' }, { id: 'T6', type: '中速弯', ang: 90, spd: 140, diff: 3, note: '' }, { id: 'T7', type: 'S弯', ang: 100, spd: 120, diff: 3, note: '路面涂装线' }, { id: 'T8', type: '高速弯', ang: 40, spd: 210, diff: 2, note: '' }, { id: 'T9', type: '中速弯', ang: 80, spd: 150, diff: 2, note: '' }], str: [{ len: 600, slope: '平', note: '海滨直道' }] }, { id: 'S3', feat: '商业区回归', len: 1400, t: [{ id: 'T10', type: '低速弯', ang: 130, spd: 60, diff: 4, note: '急弯有减速带' }, { id: 'T11', type: '中速弯', ang: 90, spd: 130, diff: 3, note: '' }, { id: 'T12', type: '中速弯', ang: 70, spd: 150, diff: 2, note: '' }, { id: 'T13', type: '低速弯', ang: 100, spd: 80, diff: 3, note: '井盖密集' }, { id: 'T14', type: '高速弯', ang: 45, spd: 190, diff: 2, note: '' }, { id: 'T15', type: '高速弯', ang: 30, spd: 220, diff: 2, note: '' }], str: [{ len: 400, slope: '平', note: '终点冲刺' }] }], overtake: ['S2海滨直道', 'T10急弯刹车区'], danger: ['T3集装箱间急弯', 'T10减速带', 'T5海风'], pit: { in: 'T9后', out: 'T12前', len: 220, limit: 50 }, lore: '横滨港湾的经典街道赛，海风与速度的较量' } };

const T3_RALLY: PromotionTrack = { tier: 'T3', raceType: '拉力赛', track: { name: '山岳试炼之路', loc: '长野', type: '拉力', len: 8.5, turns: 22, maxSpd: 180, width: 8, surface: '混合', elev: 350, safety: 'C', weather: '多变', seg: [{ id: 'S1', feat: '林间砂石路', len: 2800, t: [{ id: 'T1', type: '中速弯', ang: 80, spd: 100, diff: 3, note: '砂石路面' }, { id: 'T2', type: '发夹弯', ang: 160, spd: 45, diff: 4, note: '砂石飞溅' }, { id: 'T3', type: '中速弯', ang: 70, spd: 110, diff: 3, note: '' }, { id: 'T4', type: '低速弯', ang: 120, spd: 60, diff: 3, note: '树根突出' }, { id: 'T5', type: '中速弯', ang: 90, spd: 90, diff: 3, note: '' }], str: [{ len: 600, slope: '上坡6%', note: '砂石直道' }] }, { id: 'S2', feat: '山脊柏油段', len: 2700, t: [{ id: 'T6', type: '高速弯', ang: 50, spd: 150, diff: 3, note: '路面从砂石变柏油' }, { id: 'T7', type: 'S弯', ang: 110, spd: 100, diff: 3, note: '山脊侧风' }, { id: 'T8', type: '中速弯', ang: 90, spd: 120, diff: 3, note: '' }, { id: 'T9', type: '发夹弯', ang: 170, spd: 40, diff: 4, note: '悬崖边发夹弯' }, { id: 'T10', type: '中速弯', ang: 80, spd: 110, diff: 3, note: '' }, { id: 'T11', type: '高速弯', ang: 40, spd: 160, diff: 2, note: '' }], str: [{ len: 500, slope: '平', note: '山脊直道' }] }, { id: 'S3', feat: '泥地下山段', len: 3000, t: [{ id: 'T12', type: '低速弯', ang: 130, spd: 50, diff: 4, note: '泥地湿滑' }, { id: 'T13', type: '中速弯', ang: 80, spd: 90, diff: 3, note: '泥水飞溅' }, { id: 'T14', type: '发夹弯', ang: 165, spd: 40, diff: 4, note: '下坡发夹弯' }, { id: 'T15', type: '中速弯', ang: 70, spd: 100, diff: 3, note: '' }, { id: 'T16', type: '低速弯', ang: 110, spd: 60, diff: 3, note: '路面有水坑' }, { id: 'T17', type: '中速弯', ang: 90, spd: 90, diff: 3, note: '' }, { id: 'T18', type: '高速弯', ang: 45, spd: 130, diff: 2, note: '路面恢复柏油' }, { id: 'T19', type: '中速弯', ang: 80, spd: 110, diff: 2, note: '' }, { id: 'T20', type: '低速弯', ang: 100, spd: 70, diff: 3, note: '' }, { id: 'T21', type: '中速弯', ang: 70, spd: 120, diff: 2, note: '' }, { id: 'T22', type: '高速弯', ang: 30, spd: 150, diff: 2, note: '' }], str: [{ len: 800, slope: '下坡8%', note: '下山冲刺' }] }], overtake: ['S2山脊直道', 'T18路面变化区'], danger: ['T9悬崖边发夹弯', 'T12泥地湿滑', 'T14下坡发夹弯'], pit: { in: 'T11后', out: 'T14前', len: 300, limit: 40 }, lore: '长野山岳的传奇拉力赛段，砂石泥地柏油三种路面的终极考验' } };

const T3_DRIFT: PromotionTrack = { tier: 'T3', raceType: '漂移赛', track: { name: '箱根峠漂移道', loc: '神奈川', type: '漂移', len: 3.2, turns: 10, maxSpd: 170, width: 9, surface: '沥青', elev: 200, safety: 'B', weather: '晴', seg: [{ id: 'S1', feat: '上山连续弯', len: 1600, t: [{ id: 'T1', type: '中速弯', ang: 100, spd: 90, diff: 3, note: '' }, { id: 'T2', type: '发夹弯', ang: 170, spd: 45, diff: 4, note: '' }, { id: 'T3', type: '中速弯', ang: 80, spd: 100, diff: 3, note: '' }, { id: 'T4', type: '发夹弯', ang: 165, spd: 50, diff: 4, note: '外侧无护栏' }, { id: 'T5', type: '回头弯', ang: 180, spd: 35, diff: 4, note: '' }], str: [{ len: 200, slope: '上坡10%', note: '' }] }, { id: 'S2', feat: '下山高速段', len: 1600, t: [{ id: 'T6', type: '高速弯', ang: 60, spd: 140, diff: 3, note: '' }, { id: 'T7', type: 'S弯', ang: 120, spd: 80, diff: 3, note: '' }, { id: 'T8', type: '发夹弯', ang: 160, spd: 50, diff: 4, note: '' }, { id: 'T9', type: '中速弯', ang: 90, spd: 100, diff: 3, note: '' }, { id: 'T10', type: '高速弯', ang: 40, spd: 150, diff: 2, note: '' }], str: [{ len: 400, slope: '下坡8%', note: '' }] }], overtake: ['T6高速弯出口', 'T8发夹弯出口'], danger: ['T4外侧无护栏', 'T5回头弯'], pit: { in: 'T5后', out: 'T7前', len: 150, limit: 40 }, lore: '箱根峠的传奇漂移赛道，无数漂移高手在此留下轮胎痕迹' } };

const T3_ENDURANCE: PromotionTrack = { tier: 'T3', raceType: '耐力赛', track: { name: '�的铃鹿耐力环', loc: '三重', type: '耐力', len: 5.8, turns: 18, maxSpd: 300, width: 14, surface: '沥青', elev: 30, safety: 'A', weather: '晴转多云', seg: [{ id: 'S1', feat: '高速区', len: 2000, t: [{ id: 'T1', type: '高速弯', ang: 50, spd: 240, diff: 3, note: '' }, { id: 'T2', type: '中速弯', ang: 90, spd: 160, diff: 3, note: '' }, { id: 'T3', type: '高速弯', ang: 40, spd: 260, diff: 3, note: '' }, { id: 'T4', type: 'S弯', ang: 100, spd: 150, diff: 3, note: '' }, { id: 'T5', type: '中速弯', ang: 80, spd: 170, diff: 3, note: '' }, { id: 'T6', type: '高速弯', ang: 45, spd: 250, diff: 2, note: '' }], str: [{ len: 800, slope: '平', note: '主直道' }] }, { id: 'S2', feat: '技术区', len: 1800, t: [{ id: 'T7', type: '低速弯', ang: 140, spd: 70, diff: 4, note: '' }, { id: 'T8', type: '中速弯', ang: 90, spd: 140, diff: 3, note: '' }, { id: 'T9', type: 'S弯', ang: 110, spd: 130, diff: 3, note: '' }, { id: 'T10', type: '低速弯', ang: 120, spd: 80, diff: 3, note: '' }, { id: 'T11', type: '中速弯', ang: 70, spd: 160, diff: 3, note: '' }, { id: 'T12', type: '高速弯', ang: 50, spd: 220, diff: 3, note: '' }], str: [{ len: 400, slope: '上坡2%', note: '' }] }, { id: 'S3', feat: '冲刺区', len: 2000, t: [{ id: 'T13', type: '中速弯', ang: 80, spd: 170, diff: 3, note: '' }, { id: 'T14', type: '高速弯', ang: 45, spd: 240, diff: 3, note: '' }, { id: 'T15', type: '低速弯', ang: 130, spd: 75, diff: 3, note: '' }, { id: 'T16', type: '中速弯', ang: 90, spd: 150, diff: 3, note: '' }, { id: 'T17', type: '高速弯', ang: 40, spd: 260, diff: 2, note: '' }, { id: 'T18', type: '高速弯', ang: 30, spd: 280, diff: 2, note: '' }], str: [{ len: 600, slope: '下坡1%', note: '终点直道' }] }], overtake: ['S1主直道', 'T7发夹弯入口', 'S3终点直道'], danger: ['T7发夹弯', 'T9S弯连续变向'], pit: { in: 'T12后', out: 'T15前', len: 300, limit: 60 }, lore: '铃鹿赛道的耐力赛版本，4小时的极限考验' } };

// ============================================================
// T2~T0 晋级赛 (各5条) — 使用工厂函数生成简化版本
// 实际部署时可替换为更详细的手工设计赛道
// ============================================================

function makeTrack(name: string, loc: string, type: string, len: number, turns: number, maxSpd: number, width: number, surface: string, elev: number, safety: string, weather: string, lore: string, difficulty: number): TrackData {
  const segs: TrackSegment[] = [];
  const segCount = len < 3 ? 2 : len < 6 ? 3 : 4;
  const turnsPerSeg = Math.ceil(turns / segCount);
  let turnId = 1;
  for (let s = 0; s < segCount; s++) {
    const segTurns: TrackSegTurn[] = [];
    const count = s === segCount - 1 ? turns - (segCount - 1) * turnsPerSeg : turnsPerSeg;
    for (let t = 0; t < Math.max(count, 2); t++) {
      const types = ['高速弯', '中速弯', '低速弯', 'S弯', '发夹弯'];
      segTurns.push({ id: `T${turnId}`, type: types[turnId % types.length], ang: 40 + (turnId * 17) % 140, spd: 40 + (turnId * 23) % 200, diff: Math.min(difficulty, 1 + (turnId % difficulty) + 1), note: '' });
      turnId++;
    }
    segs.push({ id: `S${s + 1}`, feat: `赛段${s + 1}`, len: Math.round(len * 1000 / segCount), t: segTurns, str: [{ len: 300 + s * 100, slope: s % 2 === 0 ? '平' : '上坡3%', note: '' }] });
  }
  return { name, loc, type, len, turns, maxSpd, width, surface, elev, safety, weather, seg: segs, overtake: ['S1末端直道', `T${Math.floor(turns / 2)}入弯刹车区`], danger: [`T${Math.floor(turns / 3)}出弯`, `T${Math.floor(turns * 2 / 3)}连续弯`], pit: { in: `T${Math.floor(turns / 2)}后`, out: `T${Math.floor(turns / 2) + 2}前`, len: 250, limit: 60 }, lore };
}

// T2 晋级赛
const T2_CIRCUIT: PromotionTrack = { tier: 'T2', raceType: '场地赛', track: makeTrack('国家竞技场', '名古屋', '场地', 5.2, 18, 310, 15, '沥青', 25, 'A', '晴', '国家级赛事的标志性赛道，改装件首次登场的舞台', 4) };
const T2_STREET: PromotionTrack = { tier: 'T2', raceType: '街道赛', track: makeTrack('银座夜间环道', '东京银座', '街道', 4.8, 16, 260, 11, '沥青', 10, 'B', '夜间晴', '银座的霓虹灯下，国家级街道赛的巅峰对决', 4) };
const T2_RALLY: PromotionTrack = { tier: 'T2', raceType: '拉力赛', track: makeTrack('北海道雪原拉力', '北海道', '拉力', 10.5, 25, 190, 8, '雪地混合', 400, 'C', '小雪', '北海道的冰雪拉力赛段，雪地与冰面的极限挑战', 4) };
const T2_DRIFT: PromotionTrack = { tier: 'T2', raceType: '漂移赛', track: makeTrack('首都高速漂移', '东京', '漂移', 3.5, 12, 200, 10, '沥青', 50, 'B', '夜间', '首都高速的传奇漂移赛段，城市夜景中的极限漂移', 4) };
const T2_ENDURANCE: PromotionTrack = { tier: 'T2', raceType: '耐力赛', track: makeTrack('富士24小时赛道', '静冈', '耐力', 6.5, 20, 320, 15, '沥青', 35, 'A', '多变', '富士山下的24小时耐力赛，国家级耐力赛的终极考验', 4) };

// T1 晋级赛
const T1_CIRCUIT: PromotionTrack = { tier: 'T1', raceType: '场地赛', track: makeTrack('洲际大奖赛道', '上海', '场地', 5.8, 20, 340, 16, '沥青', 15, 'A', '晴', '上海国际赛车场，洲际级别的速度殿堂', 4) };
const T1_STREET: PromotionTrack = { tier: 'T1', raceType: '街道赛', track: makeTrack('摩纳哥海滨环道', '蒙特卡洛', '街道', 3.3, 19, 280, 9, '沥青', 40, 'B', '晴', '地中海畔的传奇街道赛，世界上最著名的街道赛道之一', 5) };
const T1_RALLY: PromotionTrack = { tier: 'T1', raceType: '拉力赛', track: makeTrack('阿尔卑斯山脊拉力', '瑞士', '拉力', 12.0, 30, 200, 7, '混合', 800, 'C', '多变', '阿尔卑斯山脊的极限拉力赛段，海拔800米的生死考验', 5) };
const T1_DRIFT: PromotionTrack = { tier: 'T1', raceType: '漂移赛', track: makeTrack('筑波漂移竞技场', '�的城', '漂移', 4.0, 14, 180, 10, '沥青', 30, 'B', '晴', '筑波赛车场的漂移专用赛道，洲际漂移赛的圣地', 5) };
const T1_ENDURANCE: PromotionTrack = { tier: 'T1', raceType: '耐力赛', track: makeTrack('勒芒24小时赛道', '勒芒', '耐力', 13.6, 38, 350, 14, '沥青', 20, 'A', '多变', '勒芒24小时耐力赛的传奇赛道，赛车运动的终极考验', 5) };

// T0 晋级赛
const T0_CIRCUIT: PromotionTrack = { tier: 'T0', raceType: '场地赛', track: makeTrack('世界之巅', '阿布扎比', '场地', 5.5, 21, 360, 16, '沥青', 10, 'A', '酷热', '亚斯码头赛道，世界大奖赛的终极舞台，所有类型弯道齐聚', 5) };
const T0_STREET: PromotionTrack = { tier: 'T0', raceType: '街道赛', track: makeTrack('新加坡夜间大奖赛', '新加坡', '街道', 5.1, 23, 300, 10, '沥青', 5, 'B', '夜间湿热', '滨海湾的夜间街道赛，灯光与速度的极致融合', 5) };
const T0_RALLY: PromotionTrack = { tier: 'T0', raceType: '拉力赛', track: makeTrack('撒哈拉沙漠拉力', '摩洛哥', '拉力', 15.0, 35, 210, 6, '砂石', 500, 'C', '酷热干燥', '撒哈拉沙漠的终极拉力赛段，沙暴与烈日下的生存之战', 5) };
const T0_DRIFT: PromotionTrack = { tier: 'T0', raceType: '漂移赛', track: makeTrack('东京湾漂移决赛场', '东京', '漂移', 4.5, 16, 200, 11, '沥青', 15, 'A', '夜间', '东京湾畔的世界漂移决赛场，全球最顶尖的漂移对决', 5) };
const T0_ENDURANCE: PromotionTrack = { tier: 'T0', raceType: '耐力赛', track: makeTrack('纽博格林北环', '德国', '耐力', 20.8, 73, 330, 12, '沥青', 300, 'B', '多变', '绿色地狱纽博格林北环，20.8公里73个弯道的终极耐力考验', 5) };

// ============================================================
// 导出
// ============================================================

export const PROMOTION_TRACKS: PromotionTrack[] = [
  T5_CIRCUIT, T5_STREET,
  T4_CIRCUIT, T4_STREET, T4_DRIFT,
  T3_CIRCUIT, T3_STREET, T3_RALLY, T3_DRIFT, T3_ENDURANCE,
  T2_CIRCUIT, T2_STREET, T2_RALLY, T2_DRIFT, T2_ENDURANCE,
  T1_CIRCUIT, T1_STREET, T1_RALLY, T1_DRIFT, T1_ENDURANCE,
  T0_CIRCUIT, T0_STREET, T0_RALLY, T0_DRIFT, T0_ENDURANCE,
];

/** 根据等级和赛事类型查找专属赛道 */
export function findPromotionTrack(tier: Tier, raceType: RaceType): PromotionTrack | undefined {
  return PROMOTION_TRACKS.find(t => t.tier === tier && t.raceType === raceType);
}
