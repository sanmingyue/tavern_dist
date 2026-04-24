import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

// ===== 成就ID校验 =====
// 每个前缀对应的最大编号（即该篇章的成就数量）
const ACHIEVEMENT_MAX = {
  RE: 30, DA: 80, WI: 49, LO: 100, TR: 50, ME: 40, IL: 60,
  TI: 31, SP: 25, OB: 25, EM: 40, FU: 30, AF: 30,
  HI: 20, FI: 1,
};
const ACHIEVEMENT_ID_REGEX = /^(RE|DA|WI|LO|TR|ME|IL|TI|SP|OB|EM|FU|AF|HI|FI)(\d{3})$/;

function isValidAchievementId(key) {
  const match = key.match(ACHIEVEMENT_ID_REGEX);
  if (!match) return false;
  const num = parseInt(match[2]);
  const max = ACHIEVEMENT_MAX[match[1]];
  return max !== undefined && num >= 1 && num <= max;
}

export const Schema = z.object({
  世界: z.object({
    当前日期: z.string().prefault('8月1日'),
    当前时间: z.string().prefault('10:00'),
    当前地点: z.string().prefault('家门口'),
    天气: z.string().prefault('晴'),
  }).prefault({}),

  洛潮汐: z.object({
    // 41种差分表情，严格枚举
    表情: z.enum([
      '微笑', '开心', '大笑', '害羞', '平静', '思考', '惊讶', '疑惑',
      '温柔', '思念', '撒娇', '调皮', '心动', '深情凝视', '依赖',
      '轻伤感', '难过', '哭泣', '痛哭', '心痛', '强忍', '释然',
      '疲倦', '虚弱', '气短', '晕眩', '病中微笑', '沉睡',
      '被风吹', '看海', '看烟花', '雨中', '夕阳下', '月光下',
      '吃东西', '画画中', '浴衣', '举起相机',
      '最后的笑', '告别', '安详',
    ]).prefault('微笑'),
  }).prefault({}),

  愿望清单: z.record(
    z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']),
    z.object({
      _名称: z.string(),
      状态: z.enum(['未开始', '进行中', '已完成']).prefault('未开始'),
      完成日期: z.string().prefault(''),
    }),
  ).prefault({}),

  // 成就以ID为键（如 RE001），仅接受611个合法ID
  成就: z
    .record(
      z.string().describe('成就ID，格式: 前缀+三位编号，如 RE001、DA042、FI001'),
      z.object({
        解锁日期: z.string().prefault(''),
      }),
    )
    .transform(data =>
      _(data)
        .pickBy((_, key) => isValidAchievementId(key))
        .entries()
        .takeRight(611)
        .fromPairs()
        .value(),
    )
    .prefault({}),
});

$(() => {
  registerMvuSchema(Schema);
});
