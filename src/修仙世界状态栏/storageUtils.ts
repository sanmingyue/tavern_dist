// 储物戒物品工具
// 基于按分类拆分的独立变量（储物戒_药材、储物戒_矿石 等），每个变量格式为 { 物品名: 数量 }

import type { Schema } from './schema';

/** 储物戒物品结构 */
export interface StorageItem {
  /** 分类名，如 '药材'、'矿石' */
  category: string;
  /** 物品名 */
  name: string;
  /** 数量 */
  count: number;
  /** 单位（保留兼容，新格式中不再使用） */
  unit: string;
  /** 原始文本（兼容用，格式为 "物品名×数量"） */
  raw: string;
}

/** 所有合法分类 */
export const STORAGE_CATEGORIES = [
  '药材', '矿石', '丹药', '符纸', '灵墨', '符箓',
  '灵材', '阵旗', '饲料', '傀儡件', '种子', '鱼饵', '鱼获', '成品', '杂物', '其他',
] as const;

export type StorageCategory = typeof STORAGE_CATEGORIES[number];

/** 分类 → schema 字段名映射 */
export const CATEGORY_FIELD_MAP: Record<StorageCategory, string> = {
  '药材': '储物戒_药材',
  '矿石': '储物戒_矿石',
  '丹药': '储物戒_丹药',
  '符纸': '储物戒_符纸',
  '灵墨': '储物戒_灵墨',
  '符箓': '储物戒_符箓',
  '灵材': '储物戒_灵材',
  '阵旗': '储物戒_阵旗',
  '饲料': '储物戒_饲料',
  '傀儡件': '储物戒_傀儡件',
  '种子': '储物戒_种子',
  '鱼饵': '储物戒_鱼饵',
  '鱼获': '储物戒_鱼获',
  '成品': '储物戒_成品',
  '杂物': '储物戒_杂物',
  '其他': '储物戒_其他',
};

/** 分类颜色映射 */
export const CATEGORY_COLORS: Record<string, string> = {
  '药材': '#22c55e', '矿石': '#f97316', '丹药': '#ef4444',
  '符纸': '#a855f7', '灵墨': '#6366f1', '符箓': '#8b5cf6',
  '灵材': '#3b82f6', '阵旗': '#0ea5e9', '饲料': '#14b8a6',
  '傀儡件': '#6b7280', '种子': '#84cc16', '鱼饵': '#10b981',
  '鱼获': '#06b6d4', '成品': '#f59e0b', '杂物': '#94a3b8', '其他': '#78716c',
};

/** 分类SVG图标映射（内联SVG HTML字符串） */
const _svgIcon = (d: string, color = 'currentColor') =>
  `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle"><path d="${d}"/></svg>`;

export const CATEGORY_ICONS: Record<string, string> = {
  '药材': _svgIcon('M6 20h12M12 4v16M9 7c0-2 6-2 6 0s-3 4-6 4 3 2 6 4', '#22c55e'),
  '矿石': _svgIcon('M14 2l8 8-8 8-8-8 8-8zM2 12l4 4M18 12l4 4', '#f97316'),
  '丹药': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#ef4444" stroke-width="2" style="display:inline-block;vertical-align:middle"><circle cx="12" cy="12" r="8"/><path d="M12 4v16M5.5 8.5h13M5.5 15.5h13" stroke-linecap="round"/></svg>`,
  '符纸': _svgIcon('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h8M8 9h2', '#a855f7'),
  '灵墨': _svgIcon('M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586', '#6366f1'),
  '符箓': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#8b5cf6" stroke-width="2" style="display:inline-block;vertical-align:middle"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M6.3 6.3l11.4 11.4M17.7 6.3L6.3 17.7" stroke-linecap="round"/></svg>`,
  '灵材': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#3b82f6" stroke-width="2" style="display:inline-block;vertical-align:middle"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke-linejoin="round"/></svg>`,
  '阵旗': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#0ea5e9" stroke-width="2" style="display:inline-block;vertical-align:middle"><path d="M4 22V2"/><path d="M4 2l12 5-12 5"/></svg>`,
  '饲料': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#14b8a6" stroke-width="2" style="display:inline-block;vertical-align:middle"><path d="M15 11h.01M11 15h.01M16 16c1.7-1.7 2.5-4 2-6.3C17.3 7 15 5 12.5 5S7.7 7 7 9.7c-.5 2.3.3 4.6 2 6.3l1 1c.6.6 1 1.4 1 2.3V21h2v-1.7c0-.9.4-1.7 1-2.3l1-1z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  '傀儡件': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6b7280" stroke-width="2" style="display:inline-block;vertical-align:middle"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="8.5" cy="16" r="1.5"/><circle cx="15.5" cy="16" r="1.5"/><path d="M12 11V8M8 8l4-5 4 5"/></svg>`,
  '种子': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#84cc16" stroke-width="2" style="display:inline-block;vertical-align:middle"><path d="M12 22V10M7 10c0-4 5-8 5-8s5 4 5 8c0 2.8-2.2 5-5 5s-5-2.2-5-5z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  '鱼饵': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10b981" stroke-width="2" style="display:inline-block;vertical-align:middle"><path d="M12 2a3 3 0 0 0-3 3c0 1.5 1 3 1 5H9c0-2 1-3.5 1-5a3 3 0 0 0-6 0c0 1.5 1 3 1 5H3" stroke-linecap="round"/><path d="M12 22v-6M8 22h8"/></svg>`,
  '鱼获': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#06b6d4" stroke-width="2" style="display:inline-block;vertical-align:middle"><path d="M6.5 12c3-6 11-6 14 0-3 6-11 6-14 0zM3.5 12c-1.5-2-2-4-2-4s.5 4 2 4-2 4-2 4 .5-2 2-4z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  '成品': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#f59e0b" stroke-width="2" style="display:inline-block;vertical-align:middle"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  '杂物': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#94a3b8" stroke-width="2" style="display:inline-block;vertical-align:middle"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  '其他': `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#78716c" stroke-width="2" style="display:inline-block;vertical-align:middle"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke-linecap="round"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
};

/**
 * 从 schema data 中获取某个分类的物品 Record
 */
export function getCategoryRecord(data: Schema, category: StorageCategory): Record<string, number> {
  const field = CATEGORY_FIELD_MAP[category] as keyof Schema;
  return (data[field] as unknown as Record<string, number>) ?? {};
}

/**
 * 从 schema data 中读取所有分类的全部物品，返回结构化数组
 */
export function getAllStorageItems(data: Schema): StorageItem[] {
  const items: StorageItem[] = [];
  for (const category of STORAGE_CATEGORIES) {
    const record = getCategoryRecord(data, category);
    for (const [name, count] of Object.entries(record)) {
      if (count > 0) {
        items.push({
          category,
          name,
          count,
          unit: '',
          raw: `${name}×${count}`,
        });
      }
    }
  }
  return items;
}

/**
 * 按分类筛选物品
 */
export function filterByCategory(items: StorageItem[], ...categories: string[]): StorageItem[] {
  if (categories.length === 0) return items;
  return items.filter(item => categories.includes(item.category));
}

/**
 * 从 schema data 中扣除指定分类中的指定物品
 * @returns 是否成功扣除
 */
export function removeItemFromCategory(
  data: Schema,
  category: StorageCategory,
  itemName: string,
  count: number = 1,
): boolean {
  const field = CATEGORY_FIELD_MAP[category] as keyof Schema;
  const record = (data[field] as unknown as Record<string, number>) ?? {};
  const current = record[itemName] ?? 0;
  if (current <= 0) return false;

  const remaining = current - count;
  if (remaining <= 0) {
    delete record[itemName];
  } else {
    record[itemName] = remaining;
  }
  return true;
}

/**
 * 从 schema data 中的所有分类中查找并扣除物品（按名称精确匹配）
 * @returns { removed: boolean, category: string } 扣除结果及所在分类
 */
export function removeItemByName(
  data: Schema,
  itemName: string,
  count: number = 1,
): { removed: boolean; category: string } {
  for (const category of STORAGE_CATEGORIES) {
    const record = getCategoryRecord(data, category);
    if (itemName in record && record[itemName] > 0) {
      removeItemFromCategory(data, category, itemName, count);
      return { removed: true, category };
    }
  }
  return { removed: false, category: '' };
}

/**
 * 获取 data 中有物品的分类列表
 */
export function getExistingCategories(data: Schema): StorageCategory[] {
  const result: StorageCategory[] = [];
  for (const category of STORAGE_CATEGORIES) {
    const record = getCategoryRecord(data, category);
    if (Object.keys(record).length > 0) {
      result.push(category);
    }
  }
  return result;
}

/**
 * 向指定分类添加物品
 */
export function addItemToCategory(
  data: Schema,
  category: StorageCategory,
  itemName: string,
  count: number = 1,
): void {
  const field = CATEGORY_FIELD_MAP[category] as keyof Schema;
  const record = (data[field] as unknown as Record<string, number>) ?? {};
  record[itemName] = (record[itemName] ?? 0) + count;
}

// 装备槽类型
export type EquipSlot = '武器' | '防具' | '饰品';
