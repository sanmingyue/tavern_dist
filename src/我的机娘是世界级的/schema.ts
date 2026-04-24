// ============================================================
// 变量前缀规则:
//   _ 前缀: AI 可见, 不可更新 (MVU 强制拒绝)
//   $ 前缀: AI 不可见, 前端专属操作
//   无前缀: AI 可见可更新
// ============================================================

const 赛事等级Enum = z.enum(['T5', 'T4', 'T3', 'T2', 'T1', 'T0']);
const 五维维度Enum = z.enum(['加速度', '极速', '操控', '漂移', '耐久']);

// ---------- 改件 ----------

const 外形改件Schema = z
  .object({
    名称: z.string().prefault(''),
    类型: z
      .enum(['尾翼', '花纹', '灯组', '排气', '空力套件', '轮毂', '赛车服', '核心配色'])
      .prefault('花纹'),
    描述: z.string().prefault(''),
  })
  .prefault({});

const 技能改件Schema = z
  .object({
    名称: z.string().prefault(''),
    效果方向: z.enum(['持续微调', '反噬缓和', '充能辅助', '附带光效']).prefault('持续微调'),
    描述: z.string().prefault(''),
    是否黑市: z.boolean().prefault(false),
  })
  .prefault({});

// ---------- 共鸣 ----------

const 共鸣Schema = z
  .object({
    _技能名: z.string().prefault('未激活'),
    _技能描述: z.string().prefault(''),
    _已激活: z.boolean().prefault(false),
    当前共鸣值: z.coerce
      .number()
      .transform(v => _.clamp(v, 0, 100))
      .prefault(0),
    _共鸣上限: z.coerce.number().prefault(100),
  })
  .prefault({});

// ---------- 五维 (上限 100.9, 支持小数点后一位) ----------

const 五维Schema = z
  .object({
    加速度: z.coerce
      .number()
      .transform(v => _.clamp(Math.round(v * 10) / 10, 0, 100.9))
      .prefault(0),
    极速: z.coerce
      .number()
      .transform(v => _.clamp(Math.round(v * 10) / 10, 0, 100.9))
      .prefault(0),
    操控: z.coerce
      .number()
      .transform(v => _.clamp(Math.round(v * 10) / 10, 0, 100.9))
      .prefault(0),
    漂移: z.coerce
      .number()
      .transform(v => _.clamp(Math.round(v * 10) / 10, 0, 100.9))
      .prefault(0),
    耐久: z.coerce
      .number()
      .transform(v => _.clamp(Math.round(v * 10) / 10, 0, 100.9))
      .prefault(0),
  })
  .prefault({});

// ---------- 机娘 ----------

const 机娘Schema = z
  .object({
    _赛车型号: z.string().prefault(''),
    _赛车类型: z.string().prefault(''),
    _天赋维度: z.array(五维维度Enum).prefault([]),
    状态: z.enum(['正常', '受伤', '维修中']).prefault('正常'),
    _五维: 五维Schema,
    _外形改件: z.array(外形改件Schema).prefault([]),
    _技能改件: 技能改件Schema.or(z.null()).prefault(null),
    共鸣: 共鸣Schema,
  })
  .prefault({});

// ---------- 对手 ----------

const 对手Schema = z
  .object({
    车手名: z.string().prefault(''),
    机娘名: z.string().prefault(''),
    当前排名: z.coerce.number().prefault(0),
    参赛五维: 五维Schema,
    共鸣技能: z.string().prefault('未知'),
    技能已使用: z.boolean().prefault(false),
  })
  .prefault({});

// ---------- 强化物品仓库 (Record<物品ID, 数量>) ----------

const 强化物品仓库Schema = z
  .record(
    z.string().describe('强化物品ID'),
    z.coerce
      .number()
      .transform(v => Math.max(v, 0))
      .prefault(0),
  )
  .prefault({});

// ============================================================
// 主 Schema
// ============================================================

export const Schema = z.object({
  世界: z
    .object({
      当前时间: z.string().prefault(''),
      当前地点: z.string().prefault(''),
      _当前状态: z.enum(['日常', '赛前准备', '比赛中']).prefault('日常'),
      天气: z.string().prefault('晴'),
    })
    .prefault({}),

  主角: z
    .object({
      车队: z.string().prefault('独立'),
      _赛事等级: 赛事等级Enum.prefault('T5'),
      $赛季积分: z.coerce
        .number()
        .transform(v => Math.max(v, 0))
        .prefault(0),
      $信用点数: z.coerce
        .number()
        .transform(v => Math.max(v, 0))
        .prefault(0),
      $强化点数: z.coerce
        .number()
        .transform(v => Math.max(v, 0))
        .prefault(0),
      $改件仓库: z
        .object({
          外形改件: z.array(外形改件Schema).prefault([]),
          技能改件: z.array(技能改件Schema).prefault([]),
          强化物品: 强化物品仓库Schema,
        })
        .prefault({}),
      $已解锁等级: 赛事等级Enum.prefault('T5'),
      $晋级赛通过记录: z
        .partialRecord(赛事等级Enum, z.boolean().prefault(false))
        .prefault({}),
    })
    .prefault({}),

  机娘库: z.record(z.string().describe('机娘名'), 机娘Schema).prefault({}),

  当前比赛: z
    .object({
      _赛事名称: z.string().or(z.null()).prefault(null),
      _赛事类型: z
        .enum(['场地赛', '街道赛', '拉力赛', '漂移赛', '耐力赛'])
        .or(z.null())
        .prefault(null),
      _赛事级别: 赛事等级Enum.or(z.null()).prefault(null),
      当前圈数: z.coerce
        .number()
        .transform(v => Math.max(v, 0))
        .prefault(0),
      总圈数: z.coerce
        .number()
        .transform(v => Math.max(v, 0))
        .prefault(0),
      当前排名: z.coerce
        .number()
        .transform(v => Math.max(v, 0))
        .prefault(0),
      _搭档机娘: z.string().or(z.null()).prefault(null),
      _参赛五维: 五维Schema,
      赛道状态: z.string().or(z.null()).prefault(null),
      对手: z.record(z.string().describe('对手名'), 对手Schema).prefault({}),
    })
    .prefault({}),
});

export type Schema = z.output<typeof Schema>;
