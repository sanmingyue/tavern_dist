/**
 * 鱼冰表情包映射表
 *
 * AI 在 <iphone> 中可以用 [表情:开心] 格式发送表情
 * 小手机解析后将其渲染为对应的表情图片
 *
 * URL 命名规则：拼音（连字符分隔）对应中文表情名
 */

const BASE_URL = 'https://i.postimg.cc';

export interface Sticker {
  name: string;
  url: string;
}

/** 中文名 → 图片 URL 映射 */
export const STICKER_MAP: Record<string, string> = {
  '不理你了': `${BASE_URL}/zG5hHkN9/bu-li-ni-le.png`,
  '今天很丧': `${BASE_URL}/K8FT35F4/jin-tian-hen-sang.png`,
  '你好': `${BASE_URL}/9QV9wBVZ/ni-hao.png`,
  '偷笑': `${BASE_URL}/9Qp7dqFZ/tou-xiao.png`,
  '哦': `${BASE_URL}/FHZLyJsR/o.png`,
  '哭哭': `${BASE_URL}/g2dhLKd6/ku-ku.png`,
  '困了': `${BASE_URL}/jSKfnhKN/kun-le.png`,
  '好耶': `${BASE_URL}/HkHM8tHW/hao-ye.png`,
  '害怕': `${BASE_URL}/bw8nSR8P/hai-pa.png`,
  '害羞': `${BASE_URL}/9QV9wBVC/hai-xiu.png`,
  '开心': `${BASE_URL}/wjHNRkHt/kai-xin.png`,
  '很开心': `${BASE_URL}/JzmXHQmz/hen-kai-xin.png`,
  '很棒哦': `${BASE_URL}/sgyWGJyD/hen-bang-o.png`,
  '思绪混乱': `${BASE_URL}/kgcbQtXb/si-xu-hun-luan.png`,
  '思考': `${BASE_URL}/GmQyFshs/si-kao.png`,
  '惊讶': `${BASE_URL}/Z5ZNvLZC/jing-ya.png`,
  '想吃小拳头了': `${BASE_URL}/FHZLyJs0/xiang-chi-xiao-quan-tou-le.png`,
  '比耶': `${BASE_URL}/qv0K6GrP/bi-ye.png`,
  '沮丧': `${BASE_URL}/P5hDvMhp/ju-sang.png`,
  '深度思考': `${BASE_URL}/fRK9c0TV/shen-du-si-kao.png`,
  '生气': `${BASE_URL}/523CBFNY/sheng-qi.png`,
  '疑惑': `${BASE_URL}/VkRCqbLj/yi-huo.png`,
  '睡着了': `${BASE_URL}/bwTtx2NS/shui-zhe-le.png`,
  '花痴': `${BASE_URL}/kg9SRy9G/hua-chi.png`,
  '诶': `${BASE_URL}/YCkFLxkH/ei.png`,
  '超级害羞': `${BASE_URL}/2SmWLxmp/chao-ji-hai-xiu.png`,
  '超级慌张': `${BASE_URL}/Sxq9YG4H/chao-ji-huang-zhang.png`,
  '饿了': `${BASE_URL}/JzmXHQmW/e-le.png`,
};

/** 所有可用表情名称列表 */
export const STICKER_NAMES = Object.keys(STICKER_MAP);

/** 表情包正则：匹配 [表情:xxx] */
export const STICKER_REGEX = /\[表情[:：]([^\]]+)\]/g;

/**
 * 判断消息内容是否为纯表情（整条消息只有一个 [表情:xxx]）
 */
export function isPureSticker(content: string): boolean {
  const trimmed = content.trim();
  const match = trimmed.match(/^\[表情[:：]([^\]]+)\]$/);
  return !!match && !!STICKER_MAP[match[1]];
}

/**
 * 从消息内容中提取表情名称（如果是纯表情消息）
 */
export function extractStickerName(content: string): string | null {
  const trimmed = content.trim();
  const match = trimmed.match(/^\[表情[:：]([^\]]+)\]$/);
  if (match && STICKER_MAP[match[1]]) return match[1];
  return null;
}

/**
 * 获取表情图片 URL
 */
export function getStickerUrl(name: string): string | null {
  return STICKER_MAP[name] || null;
}
