import { z } from 'zod';

const 关系状态枚举 = z.enum([
  '初识',
  '熟悉',
  '暧昧',
  '恋人',
  '决裂',
]);

const 角色状态 = z.object({
  好感度: z.coerce.number().prefault(0).transform(value => _.clamp(value, -100, 100)),
  关系状态: 关系状态枚举.prefault('初识'),
  关键事件: z.record(z.string().describe('事件名'), z.boolean()).prefault({}),
});

const 师生关系状态枚举 = z.enum([
  '师生',
  '暧昧',
  '恋人',
  '封心',
]);

const 教师角色状态 = z.object({
  好感度: z.coerce.number().prefault(0).transform(value => _.clamp(value, -100, 100)),
  关系状态: 师生关系状态枚举.prefault('师生'),
  关键事件: z.record(z.string().describe('事件名'), z.boolean()).prefault({}),
});

const 亲缘关系状态枚举 = z.enum([
  '亲密无间',
  '暧昧',
  '恋人',
  '疏远',
]);

const 亲缘角色状态 = z.object({
  好感度: z.coerce.number().prefault(0).transform(value => _.clamp(value, -100, 100)),
  关系状态: 亲缘关系状态枚举.prefault('亲密无间'),
  关键事件: z.record(z.string().describe('事件名'), z.boolean()).prefault({}),
});

export const Schema = z.object({
  当前日期: z.string().prefault('高三下学期'),
  当前时段: z.enum(['早晨', '上午', '午休', '下午', '傍晚', '晚自习', '深夜']).prefault('上午'),

  洛月: 角色状态.prefault({}),
  苏晴: 教师角色状态.prefault({}),
  沈曼莎: 教师角色状态.prefault({}),
  宋雨欣: 角色状态.prefault({}),
  司菲: 角色状态.prefault({}),
  慕言: 角色状态.prefault({}),
  云初夏: 角色状态.prefault({}),
  厉莎: 教师角色状态.prefault({}),
  洛蓉: 角色状态.prefault({}),
  苏琪: 角色状态.prefault({}),
  程妞妞: 亲缘角色状态.prefault({}),

  全局标记: z.object({
    身份暴露_云初夏: z.boolean().prefault(false),
    告白发生: z.record(z.string().describe('角色名'), z.boolean()).prefault({}),
  }).prefault({}),
});
