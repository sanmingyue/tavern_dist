/**
 * APP 正式名称映射
 * 用于世界书标签捕获和正文反馈
 */

/** APP ID → 正式名称（世界书中使用） */
export const APP_FORMAL_NAMES: Record<string, string> = {
  messages: '闪讯',
  sms: '短信',
  forum: '话圈',
  delivery: '吃点啥',
  shop: '淘点',
  secondhand: '闲转',
  movie: '电影',
  live: '直播',
  music: '音乐',
  tiktok: '抖音',
  bilibili: '哔哩哔哩',
  notes: '备忘录',
  phone: '电话',
  taxi: '打车',
  browser: '浏览器',
  wallet: '钱包',
  contacts: '通讯录',
  camera: '相机',
  gallery: '相册',
  calendar: '日历',
  clock: '时钟',
  files: '文件',
  calculator: '计算器',
  weather: '天气',
  notifications: '通知',
  themes: '主题',
  settings: '设置',
  appstore: '应用商店',
};

/** 正式名称 → APP ID（反向映射，用于标签捕获） */
export const FORMAL_NAME_TO_ID: Record<string, string> = Object.fromEntries(
  Object.entries(APP_FORMAL_NAMES).map(([id, name]) => [name, id]),
);

/** 世界书标签名 → APP ID 映射（用于正文捕获） */
export const TAG_TO_APP: Record<string, string> = {
  闪讯: 'messages',
  短信: 'sms',
  话圈: 'forum',
  吃点啥: 'delivery',
  淘点: 'shop',
  闲转: 'secondhand',
  备忘录: 'notes',
  日历: 'calendar',
  直播: 'live',
  电话: 'phone',
  通知: 'notifications',
};

/** 获取 APP 正式名称 */
export function getAppFormalName(appId: string): string {
  return APP_FORMAL_NAMES[appId] || appId;
}

/** 所有可捕获的标签正则（用于从正文中匹配） */
export const CAPTURE_PATTERNS: Record<string, RegExp> = {
  messages: /<闪讯\s+from="([^"]+)">([\s\S]*?)<\/闪讯>/gi,
  sms: /<短信\s+from="([^"]+)">([\s\S]*?)<\/短信>/gi,
  forum: /<话圈\s+author="([^"]+)">([\s\S]*?)<\/话圈>/gi,
  live: /<直播\s+host="([^"]+)">([\s\S]*?)<\/直播>/gi,
  phone: /<电话\s+from="([^"]+)">([\s\S]*?)<\/电话>/gi,
  delivery: /<吃点啥>([\s\S]*?)<\/吃点啥>/gi,
  shop: /<淘点>([\s\S]*?)<\/淘点>/gi,
  secondhand: /<闲转\s+seller="([^"]+)">([\s\S]*?)<\/闲转>/gi,
  notes: /<备忘录(?:\s+title="([^"]+)")?>([\s\S]*?)<\/备忘录>/gi,
  calendar: /<日历(?:\s+time="([^"]+)")?>([\s\S]*?)<\/日历>/gi,
  notifications: /<通知\s+app="([^"]+)">([\s\S]*?)<\/通知>/gi,
};

/** 用于从正文中删除所有标签的正则 */
export const STRIP_ALL_TAGS_REGEX = /<(?:闪讯|短信|话圈|直播|电话|吃点啥|淘点|闲转|备忘录|日历|通知|闪讯好友|闪讯拉黑|闪讯删好友)[^>]*>[\s\S]*?<\/(?:闪讯|短信|话圈|直播|电话|吃点啥|淘点|闲转|备忘录|日历|通知|闪讯好友|闪讯拉黑|闪讯删好友)>/gi;

/** 匹配 <闪讯好友> 标签的正则 */
export const FRIEND_TAG_REGEX = /<闪讯好友>([\s\S]*?)<\/闪讯好友>/gi;

/** 匹配 <闪讯拉黑> 标签的正则 */
export const BLOCK_TAG_REGEX = /<闪讯拉黑>([\s\S]*?)<\/闪讯拉黑>/gi;

/** 匹配 <闪讯删好友> 标签的正则 */
export const UNFRIEND_TAG_REGEX = /<闪讯删好友>([\s\S]*?)<\/闪讯删好友>/gi;

const MESSAGE_REPLY_TAG_REGEX = /<闪讯(?:\s+from=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?[^>]*>([\s\S]*?)<\/闪讯>/gi;

/** 只保留 <闪讯> 标签内的消息正文，标签外内容一律丢弃 */
export function cleanMessagesReplyText(text: string): string {
  MESSAGE_REPLY_TAG_REGEX.lastIndex = 0;
  const blocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = MESSAGE_REPLY_TAG_REGEX.exec(text)) !== null) {
    blocks.push(match[4]);
  }

  if (blocks.length === 0) return '';

  STRIP_ALL_TAGS_REGEX.lastIndex = 0;
  const content = blocks
    .join('\n')
    .replace(STRIP_ALL_TAGS_REGEX, '')
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '');

  return content
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !/^\d{1,2}:\d{2}\s*$/.test(line))
    .map(line => line.replace(/<\/?[a-zA-Z\u4e00-\u9fff_]+[^>]*>/g, '').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

/** 从 <闪讯好友> 标签内容中提取子字段 */
export function parseFriendTag(tagContent: string): {
  realname: string;
  nickname: string;
  id: string;
  relation: string;
} | null {
  const realname = tagContent.match(/<realname>([\s\S]*?)<\/realname>/i)?.[1]?.trim();
  const nickname = tagContent.match(/<nickname>([\s\S]*?)<\/nickname>/i)?.[1]?.trim();
  const id = tagContent.match(/<id>([\s\S]*?)<\/id>/i)?.[1]?.trim();
  const relation = tagContent.match(/<relation>([\s\S]*?)<\/relation>/i)?.[1]?.trim();

  if (!realname) return null; // realname 是必须字段

  return {
    realname,
    nickname: nickname || realname,
    id: id || String(realname.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 7919 % 9000000 + 1000000),
    relation: relation || '好友',
  };
}
