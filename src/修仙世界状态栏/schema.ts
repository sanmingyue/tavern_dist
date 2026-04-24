import { z } from 'zod';

// ─── 基础枚举 ───
export const 修炼状态列表 = ['', '修炼中', '突破中', '渡劫中', '引气入体'] as const;
export const 寿元状态列表 = [
  '正常', '衰老初期', '灵力枯竭', '油尽灯枯', '寿终正寝',
  '第一世', '第二世', '第三世', '第四世', '第五世',
] as const;
export const 轮回状态列表 = ['正常', '轮回中'] as const;

// ─── 装备槽位 ───
export const 装备槽Schema = z.string().default('');
export const 物品列表Schema = z.string().default('');

// ─── 关系列表 ───
export const 关系条目Schema = z.string().describe('性别|修为|所属|关系态度|重要事件');
export const 关系列表Schema = z.record(z.string().describe('角色名'), 关系条目Schema).default({});

// ─── 主 Schema ───
export const Schema = z.object({
  // ═══ A类：AI 自由更新的变量 ═══
  // 位置信息
  大区域: z.string().default(''),
  子区域: z.string().default(''),
  具体地点: z.string().default(''),
  在场角色: z.string().default(''),

  // 身份信息
  灵根: z.string().default(''),
  道途: z.enum(['', '正道', '邪道', '魔道', '中立', '混乱中立']).default(''),
  所属势力: z.string().default(''),
  宗门地位: z.string().default(''),

  // 时间
  阴阳历: z.string().default(''),
  时辰: z.enum(['', '子时', '丑时', '寅时', '卯时', '辰时', '巳时', '午时', '未时', '申时', '酉时', '戌时', '亥时']).default(''),

  // 功法
  主修功法: z.string().default(''),
  功法品级: z.string().default(''),
  功法总层数: z.coerce.number().default(0),
  功法已修层数: z.coerce.number().default(0),
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
  ]).default({}),

  // 剑心·丹道·异火
  剑心境界: z.string().default(''),
  丹道境界: z.string().default(''),
  异火列表: z.string().default(''),

  // 储物戒·灵石·货币（按分类拆分为独立变量，与 CE 脚本 schema 对齐）
  储物戒_药材: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_矿石: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_丹药: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_符纸: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_灵墨: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_符箓: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_灵材: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_阵旗: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_饲料: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_傀儡件: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_种子: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_鱼饵: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_鱼获: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_成品: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_杂物: z.record(z.string(), z.coerce.number()).default({}),
  储物戒_其他: z.record(z.string(), z.coerce.number()).default({}),
  下品灵石: z.coerce.number().min(0).default(0),
  中品灵石: z.coerce.number().min(0).default(0),
  上品灵石: z.coerce.number().min(0).default(0),
  极品灵石: z.coerce.number().min(0).default(0),
  凡俗货币: z.string().default(''),

  // 未装备物品
  未装备_武器: 物品列表Schema,
  未装备_防具: 物品列表Schema,
  未装备_饰品: 物品列表Schema,

  // 关系
  关系列表: 关系列表Schema,

  // 钓鱼结果（AI决定，$前缀对AI不可见节省token）
  $钓鱼_成功次数: z.coerce.number().min(0).default(0),
  $钓鱼_鱼获记录: z.string().default(''),
  $钓鱼_最高记录: z.string().default(''),

  // 百艺学习信号
  习得百艺: z.string().default(''),

  // 境界（AI控制，完整描述如"金丹期前期"）
  当前境界: z.string().default(''),

  // 百艺境界（AI控制升级）
  炼器境界: z.string().default(''),
  阵法境界: z.string().default(''),
  符箓境界: z.string().default(''),
  驭兽境界: z.string().default(''),
  医术境界: z.string().default(''),
  傀儡术境界: z.string().default(''),
  种植采药境界: z.string().default(''),

  // 百艺装备（AI控制）
  装备_傀儡: 装备槽Schema,
  $傀儡状态列表: z.string().default(''),
  装备_灵兽: 装备槽Schema,
  $灵兽状态列表: z.string().default(''),
  装备_丹炉: 装备槽Schema,
  装备_锻造台: 装备槽Schema,
  装备_一寸地: 装备槽Schema,
  $一寸地_种植列表: z.string().default(''),
  装备_符笔: 装备槽Schema,
  装备_阵盘: 装备槽Schema,
  $阵盘_存放阵法: z.string().default(''),
  装备_药箱: 装备槽Schema,
  $药箱_工具: z.string().default(''),

  // 心魔系统（AI控制：执念/态度/记忆）
  心魔名: z.string().default(''),
  心魔执念: z.string().default(''),
  心魔态度: z.string().default(''),
  $心魔记忆: z.string().default(''),

  // ═══ B类：前端/脚本控制的只读变量 ═══
  // 修炼系统
  _当前百艺: z.enum(['', '炼丹', '炼器', '阵法', '符箓', '驭兽', '医术', '傀儡术', '种植采药', '钓鱼']).default(''),
  _修炼状态: z.enum(修炼状态列表).default(''),
  $修炼进度: z.coerce.number().min(0).max(100).default(0),
  心魔状态: z.enum(['无', '潜伏', '活跃', '对峙中']).default('无'),

  // 寿元系统
  当前年纪: z.coerce.number().min(0).default(0),
  当前寿元: z.coerce.number().min(0).default(0),
  _剩余寿元: z.coerce.number().min(0).default(0),
  _寿元状态: z.enum(寿元状态列表).default('正常'),
  _轮回状态: z.enum(轮回状态列表).default('正常'),

  // 装备栏
  _装备_武器: 装备槽Schema,
  _装备_防具: 装备槽Schema,
  _装备_饰品: 装备槽Schema,

  // 钓鱼系统（_钓鱼状态已由 _当前百艺='钓鱼' 替代）
  _钓鱼_钓鱼次数: z.coerce.number().min(0).default(0),
  装备_鱼竿: z.string().default(''),
  装备_渔网: z.string().default(''),
  装备_钓箱: z.string().default(''),

  // 功法库（前端控制，AI不可见）
  $功法库: z.string().default(''),

  // 百艺修炼进度（$前缀对AI不可见节省token）
  $炼丹_熟练度: z.coerce.number().default(0),
  $炼丹_经验值: z.coerce.number().min(0).max(100).default(0),
  $炼器_熟练度: z.coerce.number().default(0),
  $炼器_经验值: z.coerce.number().min(0).max(100).default(0),
  $阵法_熟练度: z.coerce.number().default(0),
  $阵法_经验值: z.coerce.number().min(0).max(100).default(0),
  $符箓_熟练度: z.coerce.number().default(0),
  $符箓_经验值: z.coerce.number().min(0).max(100).default(0),
  $驭兽_熟练度: z.coerce.number().default(0),
  $驭兽_经验值: z.coerce.number().min(0).max(100).default(0),
  $医术_熟练度: z.coerce.number().default(0),
  $医术_经验值: z.coerce.number().min(0).max(100).default(0),
  $傀儡术_熟练度: z.coerce.number().default(0),
  $傀儡术_经验值: z.coerce.number().min(0).max(100).default(0),
  $种植采药_熟练度: z.coerce.number().default(0),
  $种植采药_经验值: z.coerce.number().min(0).max(100).default(0),
});

export type Schema = z.output<typeof Schema>;

// ─── 境界解析工具函数 ───

/** 大境界列表（按优先匹配顺序，带"期"的排前面） */
export const 大境界列表 = [
  '炼气期', '筑基期', '金丹期', '元婴期', '化神期', '炼虚期', '合体期', '大乘期', '渡劫期', '真仙境',
] as const;

/**
 * 解析境界字符串为大境界+小境界
 * "元婴期前期" → { 大境界: "元婴期", 小境界: "前期" }
 * "炼气期三层" → { 大境界: "炼气期", 小境界: "三层" }
 * "真仙境五重天" → { 大境界: "真仙境", 小境界: "五重天" }
 * "" → { 大境界: "凡人", 小境界: "" }
 */
export function parse境界(当前境界: string): { 大境界: string; 小境界: string } {
  if (!当前境界 || 当前境界 === '凡人') return { 大境界: '凡人', 小境界: '' };
  for (const realm of 大境界列表) {
    if (当前境界.startsWith(realm)) {
      return { 大境界: realm, 小境界: 当前境界.slice(realm.length) };
    }
  }
  return { 大境界: 当前境界, 小境界: '' };
}

/**
 * 判断当前小境界是否为大境界的最高小境界（需要渡劫才能升入下一大境界）
 */
export function is大境界顶峰(当前境界: string): boolean {
  if (!当前境界) return false;
  const { 大境界, 小境界 } = parse境界(当前境界);
  if (大境界 === '炼气期') return 小境界 === '十层';
  if (大境界 === '真仙境') return 小境界 === '大圆满';
  // 筑基期~渡劫期：大圆满为顶峰
  if (大境界列表.includes(大境界 as any)) return 小境界 === '大圆满';
  return false;
}

/**
 * 判断修炼进度满后应该走什么流程
 * 'cultivate' = 凡人引气入体
 * 'breakthrough' = 小境界突破
 * 'tribulation' = 大境界渡劫
 */
export function get突破类型(当前境界: string): 'cultivate' | 'breakthrough' | 'tribulation' {
  if (!当前境界) return 'cultivate'; // 凡人→引气入体
  if (is大境界顶峰(当前境界)) return 'tribulation'; // 大境界顶峰→渡劫
  return 'breakthrough'; // 同大境界内→突破
}
