import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

const ItemSchema = z.object({
  name: z.string(),
  description: z.string(),
  interactions: z.array(z.record(z.string(), z.string())).prefault([]),
});

const EmotionAxis = z.coerce.number().transform(v => _.round(_.clamp(v, -1, 1), 1));

export const Schema = z.object({
  日期: z.string().prefault('08月16日'),
  时间: z.string().prefault('09:00'),

  // ===== 箱庭系统 =====
  当前房间: z.string().prefault('第一层·起始之间'),
  已解锁房间: z.array(z.string()).prefault(['第一层·起始之间']),
  通关状态: z.string().prefault('进行中'), // 进行中 | 结局A·并肩黎明 | 结局B·独行者 | 结局C·留在箱庭

  // ===== 关键选择记录（影响结局） =====
  选择记录: z.object({
    信任始: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(50),
    独立行动次数: z.coerce.number().prefault(0),
    合作行动次数: z.coerce.number().prefault(0),
    牺牲选择: z.array(z.string()).prefault([]),
    发现的秘密: z.array(z.string()).prefault([]),
    始的心墙: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(70),
  }).prefault({}),

  // ===== 主角 =====
  主角: z.object({
    名字: z.string().prefault('主角'),
    持有物品: z.array(ItemSchema).prefault([]),
    状态: z.string().prefault('正常'),
  }).prefault({}),

  // ===== 场景物品（当前房间内） =====
  场景物品: z.array(ItemSchema).prefault([]),

  // ===== 始 =====
  始: z.object({
    当前位置: z.string().prefault('第一层·起始之间'),
    重要物品: z.string().prefault('向阳纹发带'),
    重要记忆: z.string().prefault('尚无'),
    着装: z.string().prefault('浅米色针织背心，白衬衫，晨黄细领结，浅灰格子百褶裙，纯白过膝袜，浅棕牛津鞋'),
    处女: z.string().prefault('是'),
    性行为次数: z.coerce.number().prefault(0),
    情绪状态: z.object({
      pleasure: EmotionAxis.prefault(0.1),
      arousal: EmotionAxis.prefault(0.4),
      dominance: EmotionAxis.prefault(0.5),
      affinity: EmotionAxis.prefault(0.1),
    }).prefault({}),
    当前所想: z.string().prefault('{{user}} 怎么也躺在这里?! 先检查周围环境，确保安全'),
    线索: z.string().prefault('环顾四周，柜子、桌子、电脑、通风管、门——逐个排查'),
    状态: z.string().prefault('正常'),
  }).prefault({}),
});

$(() => {
  registerMvuSchema(Schema);
});
