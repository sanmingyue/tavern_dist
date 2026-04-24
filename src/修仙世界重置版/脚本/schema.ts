import { registerMvuSchema } from 'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js';

export const Schema = z.object({
  // ═══════════════════════════════════════
  // A类：AI 自由更新的变量
  // ═══════════════════════════════════════

  // ─── 位置信息 ───
  大区域: z.string().prefault(''),
  子区域: z.string().prefault(''),
  具体地点: z.string().prefault(''),
  在场角色: z.string().prefault(''),

  // ─── 身份信息 ───
  灵根: z.string().prefault(''),
  道途: z.string().prefault(''),
  所属势力: z.string().prefault(''),
  宗门地位: z.string().prefault(''),

  // ─── 时间系统 ───
  阴阳历: z.string().prefault(''),
  时辰: z.enum(['', '子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时']).prefault(''),

  // ─── 功法系统 ───
  主修功法: z.string().prefault(''),
  功法品级: z.string().prefault(''),
  功法总层数: z.coerce.number().transform(v => Math.max(0, Math.floor(v))).prefault(0),
  功法已修层数: z.coerce.number().transform(v => Math.max(0, Math.floor(v))).prefault(0),
  习得术法: z.union([
    z.record(z.string(), z.string()),
    z.string().transform(str => {
      if (!str) return {};
      const result: Record<string, string> = {};
      str.split('、').forEach(s => {
        const m = s.match(/(.+)\((.+)\)/);
        if (m) result[m[1]] = m[2];
        else if (s.trim()) result[s.trim()] = '入门';
      });
      return result;
    }),
  ]).prefault({}),

  // ─── 剑心·丹道·异火 ───
  剑心境界: z.string().prefault(''),
  丹道境界: z.string().prefault(''),
  异火列表: z.string().prefault(''),

  // ─── 储物戒（按分类拆分为独立变量） ───
  储物戒_药材: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_矿石: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_丹药: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_符纸: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_灵墨: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_符箓: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_灵材: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_阵旗: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_饲料: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_傀儡件: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_种子: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_鱼饵: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_鱼获: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_成品: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_杂物: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),
  储物戒_其他: z.record(z.string(), z.coerce.number().transform(v => Math.max(0, Math.floor(v)))).transform(v => _.pickBy(v, n => n > 0)).prefault({}),

  // ─── 灵石·货币 ───
  下品灵石: z.coerce.number().transform(v => Math.max(0, Math.floor(v))).prefault(0),
  中品灵石: z.coerce.number().transform(v => Math.max(0, Math.floor(v))).prefault(0),
  上品灵石: z.coerce.number().transform(v => Math.max(0, Math.floor(v))).prefault(0),
  极品灵石: z.coerce.number().transform(v => Math.max(0, Math.floor(v))).prefault(0),
  凡俗货币: z.string().prefault(''),

  // ─── 未装备物品（AI管理获得/消耗） ───
  未装备_武器: z.string().prefault(''),
  未装备_防具: z.string().prefault(''),
  未装备_饰品: z.string().prefault(''),

  // ─── 关系列表 ───
  关系列表: z.record(z.string(), z.string()).transform(v => v ?? {}).prefault({}),

  // ─── 钓鱼结果（AI决定钓到什么） ───
  $钓鱼_成功次数: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  $钓鱼_鱼获记录: z.string().prefault(''),
  $钓鱼_最高记录: z.string().prefault(''),

  // ─── 百艺学习信号（AI学习成功后写入，脚本消费后清空） ───
  习得百艺: z.string().prefault(''),

  // ─── 境界（AI控制，完整描述如"金丹期前期"、"真仙境十重天大圆满"） ───
  当前境界: z.string().prefault(''),

  // ─── 百艺境界（AI控制升级） ───
  炼器境界: z.string().prefault(''),
  阵法境界: z.string().prefault(''),
  符箓境界: z.string().prefault(''),
  驭兽境界: z.string().prefault(''),
  医术境界: z.string().prefault(''),
  傀儡术境界: z.string().prefault(''),
  种植采药境界: z.string().prefault(''),

  // ─── 百艺装备（AI控制） ───
  装备_傀儡: z.string().prefault(''),
  $傀儡状态列表: z.string().prefault(''),
  装备_灵兽: z.string().prefault(''),
  $灵兽状态列表: z.string().prefault(''),
  装备_丹炉: z.string().prefault(''),
  装备_锻造台: z.string().prefault(''),
  装备_一寸地: z.string().prefault(''),
  $一寸地_种植列表: z.string().prefault(''),
  装备_符笔: z.string().prefault(''),
  装备_阵盘: z.string().prefault(''),
  $阵盘_存放阵法: z.string().prefault(''),
  装备_药箱: z.string().prefault(''),
  $药箱_工具: z.string().prefault(''),

  // ─── 心魔系统（AI控制） ───
  心魔名: z.string().prefault(''),
  心魔执念: z.string().prefault(''),
  心魔态度: z.string().prefault(''),
  $心魔记忆: z.string().prefault(''),

  // ═══════════════════════════════════════
  // B类：前端/脚本控制的只读变量（AI能看不能改）
  // ═══════════════════════════════════════

  // ─── 修炼系统（前端控制） ───
  _当前百艺: z.string().prefault(''),
  _修炼状态: z.string().prefault(''),
  $修炼进度: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
  心魔状态: z.string().prefault('无'),

  // ─── 寿元系统 ───
  当前年纪: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  当前寿元: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  _剩余寿元: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  _寿元状态: z.string().prefault('正常'),
  _轮回状态: z.string().prefault('正常'),

  // ─── 装备槽（前端控制穿脱） ───
  _装备_武器: z.string().prefault(''),
  _装备_防具: z.string().prefault(''),
  _装备_饰品: z.string().prefault(''),

  // ─── 钓鱼系统（_钓鱼状态已由 _当前百艺='钓鱼' 替代） ───
  _钓鱼_钓鱼次数: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  装备_鱼竿: z.string().prefault(''),
  装备_渔网: z.string().prefault(''),
  装备_钓箱: z.string().prefault(''),

  // ─── 功法库（前端控制，AI不可见） ───
  $功法库: z.string().prefault(''),

  // ─── 百艺修炼进度（前端控制，AI不可见） ───
  $炼丹_熟练度: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  $炼丹_经验值: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
  $炼器_熟练度: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  $炼器_经验值: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
  $阵法_熟练度: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  $阵法_经验值: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
  $符箓_熟练度: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  $符箓_经验值: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
  $驭兽_熟练度: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  $驭兽_经验值: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
  $医术_熟练度: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  $医术_经验值: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
  $傀儡术_熟练度: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  $傀儡术_经验值: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
  $种植采药_熟练度: z.coerce.number().transform(v => Math.max(0, v)).prefault(0),
  $种植采药_经验值: z.coerce.number().transform(v => _.clamp(v, 0, 100)).prefault(0),
});

$(() => {
  registerMvuSchema(Schema);
});
