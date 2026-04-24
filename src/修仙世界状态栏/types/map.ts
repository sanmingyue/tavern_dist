import { z } from 'zod';

// ─── 地图层级 ───
export const 地图层级列表 = ['一层', '二层', '三层'] as const;
export type 地图层级 = typeof 地图层级列表[number];

// ─── 地点类型 ───
export const 地点类型列表 = [
  '大区域',      // 一层：中央神州、东荒妖域等
  '子区域',      // 二层：具体区域如星辰山脉、丹霞灵原
  '具体地点',    // 三层：具体地点如玄天宗、星辰阁
  '势力',
  '宗门',
  '城市',
  '特殊地点',
] as const;
export type 地点类型 = typeof 地点类型列表[number];

// ─── 势力颜色 ───
export const 势力颜色表: Record<string, string> = {
  '正道': '#10b981',      // 绿色
  '邪道': '#ef4444',      // 红色
  '魔道': '#a855f7',      // 紫色
  '中立': '#6b7280',      // 灰色
  '混乱中立': '#f59e0b',  // 黄色
  '妖族': '#22c55e',      // 翠绿
  '佛门': '#eab308',      // 金黄
  '海域': '#3b82f6',     // 蓝色
  '冥界': '#6366f1',      // 靛蓝
};

// ─── 地图标记点 ───
export const 地图标记Schema = z.object({
  id: z.string().describe('唯一标识'),
  名称: z.string(),
  类型: z.enum(地点类型列表).default('具体地点'),
  层级: z.enum(地图层级列表).default('三层'),
  所属区域: z.string().optional().describe('所属大区域'),
  所属子区域: z.string().optional().describe('所属子区域'),

  // 位置（百分比，0-100）
  x: z.number().min(0).max(100).describe('X坐标百分比'),
  y: z.number().min(0).max(100).describe('Y坐标百分比'),

  // 样式
  颜色: z.string().default('#8b5cf6'),
  标记大小: z.enum(['tiny', 'small', 'normal', 'large']).default('normal'),
  标签位置: z.enum(['above', 'below', 'left', 'right']).default('above'),

  // 内容
  简介: z.string().optional(),
  势力: z.string().optional(),
  角色列表: z.array(z.string()).default([]),
  钓鱼信息: z.string().optional(),

  // 导航
  子区域: z.array(z.string()).optional().describe('子区域ID列表，用于展开'),
  可前往: z.boolean().default(true).describe('是否可以前往'),
});

export type 地图标记 = z.input<typeof 地图标记Schema>;

// ─── 地图层级配置 ───
export const 地图层级配置 = {
  '一层': {
    名称: '阴阳大陆全览',
    图片URL: 'https://i.postimg.cc/s2ybVV8Q/di1ceng-yin-yang-da-lu-yu-tu.png',
    默认显示: true,
  },
  '二层': {
    '中央神州': {
      名称: '中央神州',
      图片URL: 'https://i.postimg.cc/N0pCBRRF/di2ceng-zhong-yang-shen-zhou-yu-tu.png',
    },
    '东荒妖域': {
      名称: '东荒妖域',
      图片URL: 'https://i.postimg.cc/5yHRPjY9/di2ceng-dong-huang-yao-yu-yu-tu.png',
    },
    '北原魔土': {
      名称: '北原魔土',
      图片URL: 'https://i.postimg.cc/kGVpjD6n/di2ceng-bei-yuan-mo-tu-yu-tu.png',
    },
    '西漠佛国': {
      名称: '西漠佛国',
      图片URL: 'https://i.postimg.cc/RZ1bpkFL/di2ceng-xi-mo-fu-guo-yu-tu.png',
    },
    '南疆巫地': {
      名称: '南疆巫地',
      图片URL: 'https://i.postimg.cc/pXFSzhMk/di2ceng-nan-jiang-wu-de-yu-tu.png',
    },
    '四海': {
      名称: '四海',
      图片URL: 'https://i.postimg.cc/52WR34xt/di2ceng-si-hai-yu-tu.png',
    },
    '大魔国': {
      名称: '大魔国',
      图片URL: 'https://i.postimg.cc/hvJ5Chzg/di2ceng-da-mo-guo-yu-tu.png',
    },
    '东瀛': {
      名称: '东瀛',
      图片URL: 'https://i.postimg.cc/xj77XGhf/di2ceng-dong-ying-yu-tu.png',
    },
    '阴曹地府': {
      名称: '阴曹地府',
      图片URL: 'https://i.postimg.cc/tgXvKBnQ/di2ceng-yin-cao-de-fu-yu-tu.png',
    },
  },
  '三层': {
    // 各区域的详细地点将在后续定义
  },
} as const;

// ─── 区域定义 ───
export interface 区域定义 {
  id: string;
  名称: string;
  层级: 地图层级;
  父区域?: string;
  图片URL?: string;
  标记点: 地图标记[];
  简介?: string;
  角色列表?: string[];
}

// ─── 移动目的地 ───
export const 移动目的地Schema = z.object({
  大区域: z.string(),
  子区域: z.string().optional(),
  具体地点: z.string().optional(),
  移动方式: z.enum(['御剑飞行', '御空飞行', '传送阵', '步行', '骑乘', '乘船']).default('御空飞行'),
  预计时间: z.string().optional(),
  危险程度: z.enum(['安全', '较低', '中等', '较高', '危险']).default('中等'),
});

export type 移动目的地 = z.output<typeof 移动目的地Schema>;

// ─── 移动确认信息 ───
export const 移动确认Schema = z.object({
  当前位置: 移动目的地Schema,
  目的地: 移动目的地Schema,
  途经: z.array(z.string()).default([]),
  备注: z.string().optional(),
});

export type 移动确认 = z.output<typeof 移动确认Schema>;
