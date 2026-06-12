/**
 * 统一 SVG 图标系统
 * 所有 APP 和组件统一从这里引用图标
 */

/* ─── SVG 路径映射 ─── */
export const ICON_PATHS: Record<string, string> = {
  comments: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  'address-book':
    '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'comments-alt':
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  map: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
  utensils:
    '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  car: '<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  film: '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  video:
    '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
  tiktok:
    '<path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/><circle cx="9" cy="16" r="4" fill="none"/>',
  bilibili:
    '<rect x="2" y="6" width="20" height="14" rx="3"/><path d="M7 6l3-4"/><path d="M17 6l-3-4"/><circle cx="9" cy="13" r="1.5" fill="currentColor"/><circle cx="15" cy="13" r="1.5" fill="currentColor"/>',
  'shopping-bag':
    '<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  wallet:
    '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/>',
  camera:
    '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  images:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  globe:
    '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  'sticky-note':
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  calculator:
    '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10.01"/><line x1="12" y1="10" x2="12" y2="10.01"/><line x1="16" y1="10" x2="16" y2="10.01"/><line x1="8" y1="14" x2="8" y2="14.01"/><line x1="12" y1="14" x2="12" y2="14.01"/><line x1="16" y1="14" x2="16" y2="14.01"/><line x1="8" y1="18" x2="8" y2="18.01"/><line x1="12" y1="18" x2="16" y2="18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  folder:
    '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  envelope:
    '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  palette:
    '<circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  cog: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  sun: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
  download:
    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  live: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/><circle cx="8" cy="12" r="2" fill="currentColor"/>',
  'second-hand':
    '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  'arrow-left': '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
  'chevron-left': '<polyline points="15 18 9 12 15 6"/>',
  'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  refresh:
    '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
  trash:
    '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  star: '<path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7-6-4.6h7.6z"/>',
  heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
};

/* ─── APP 默认背景色 ─── */
export const APP_COLORS: Record<string, string> = {
  闪讯: '#579bf0',
  通讯录: '#50c9c3',
  论坛: '#f5a623',
  短信: '#7ed321',
  电话: '#4a90e2',
  地图: '#50c9c3',
  外卖: '#f5a623',
  打车: '#e74c3c',
  电影: '#9b59b6',
  天气: '#3498db',
  音乐: '#1db954',
  抖音: '#000000',
  哔哩哔哩: '#00a1d6',
  购物: '#f39c12',
  钱包: '#27ae60',
  相机: '#95a5a6',
  相册: '#e91e63',
  浏览器: '#2196f3',
  日历: '#ff5722',
  备忘录: '#ffc107',
  计算器: '#607d8b',
  时钟: '#9c27b0',
  文件: '#795548',
  通知: '#e74c3c',
  主题: '#9c27b0',
  设置: '#607d8b',
  应用商店: '#2196f3',
  直播: '#ff0050',
  二手: '#ffd21e',
};

/* ─── APP 元数据映射 ─── */
export interface AppInfo {
  id: string;
  name: string;
  icon: string;
  category: 'social' | 'life' | 'entertainment' | 'shopping' | 'tools' | 'system';
  /** 目录名（中文） */
  dir: string;
  /** 显示大小（模拟） */
  size: string;
  /** 描述 */
  description: string;
}

export const APP_LIST: AppInfo[] = [
  // 社交类
  { id: 'messages', name: '闪讯', icon: 'comments', category: 'social', dir: '消息', size: '128MB', description: '即时通讯，与好友畅聊' },
  { id: 'contacts', name: '通讯录', icon: 'address-book', category: 'social', dir: '通讯录', size: '45MB', description: '管理你的联系人' },
  { id: 'forum', name: '论坛', icon: 'comments-alt', category: 'social', dir: '论坛', size: '86MB', description: '发现有趣的帖子和话题' },
  { id: 'sms', name: '短信', icon: 'envelope', category: 'social', dir: '短信', size: '32MB', description: '收发短信息' },
  { id: 'phone', name: '电话', icon: 'phone', category: 'social', dir: '电话', size: '28MB', description: '拨打和接听电话' },

  // 生活服务类
  { id: 'map', name: '地图', icon: 'map', category: 'life', dir: '地图', size: '256MB', description: '导航与位置服务' },
  { id: 'delivery', name: '外卖', icon: 'utensils', category: 'life', dir: '外卖', size: '156MB', description: '美食外卖，送货上门' },
  { id: 'taxi', name: '打车', icon: 'car', category: 'life', dir: '打车', size: '112MB', description: '一键叫车，便捷出行' },
  { id: 'movie', name: '电影', icon: 'film', category: 'life', dir: '电影', size: '98MB', description: '影讯、购票、影评' },
  { id: 'weather', name: '天气', icon: 'sun', category: 'life', dir: '天气', size: '52MB', description: '实时天气预报' },

  // 娱乐类
  { id: 'music', name: '音乐', icon: 'music', category: 'entertainment', dir: '音乐', size: '178MB', description: '海量音乐，随心畅听' },
  { id: 'tiktok', name: '抖音', icon: 'tiktok', category: 'entertainment', dir: '抖音', size: '198MB', description: '竖屏短视频，刷到停不下来' },
  { id: 'bilibili', name: '哔哩哔哩', icon: 'bilibili', category: 'entertainment', dir: '哔哩哔哩', size: '224MB', description: '你感兴趣的视频都在B站' },

  // 购物类
  { id: 'shop', name: '购物', icon: 'shopping-bag', category: 'shopping', dir: '购物', size: '198MB', description: '网购商城，万物可买' },
  { id: 'wallet', name: '钱包', icon: 'wallet', category: 'shopping', dir: '钱包', size: '88MB', description: '支付、转账、理财' },

  // 工具类
  { id: 'camera', name: '相机', icon: 'camera', category: 'tools', dir: '相机', size: '68MB', description: '拍照与录像' },
  { id: 'gallery', name: '相册', icon: 'images', category: 'tools', dir: '相册', size: '42MB', description: '浏览和管理照片' },
  { id: 'browser', name: '浏览器', icon: 'globe', category: 'tools', dir: '浏览器', size: '95MB', description: '浏览网页，AI搜索' },
  { id: 'calendar', name: '日历', icon: 'calendar', category: 'tools', dir: '日历', size: '38MB', description: '日程管理与提醒' },
  { id: 'notes', name: '备忘录', icon: 'sticky-note', category: 'tools', dir: '备忘录', size: '24MB', description: '随手记录想法' },
  { id: 'calculator', name: '计算器', icon: 'calculator', category: 'tools', dir: '计算器', size: '12MB', description: '科学计算器' },
  { id: 'clock', name: '时钟', icon: 'clock', category: 'tools', dir: '时钟', size: '16MB', description: '闹钟、计时器、秒表' },
  { id: 'files', name: '文件', icon: 'folder', category: 'tools', dir: '文件', size: '35MB', description: '文件管理器' },

  // 系统类
  { id: 'notifications', name: '通知', icon: 'bell', category: 'system', dir: '通知', size: '8MB', description: '通知中心' },
  { id: 'themes', name: '主题', icon: 'palette', category: 'system', dir: '主题', size: '56MB', description: '个性化主题设置' },
  { id: 'settings', name: '设置', icon: 'cog', category: 'system', dir: '设置', size: '18MB', description: '系统设置与API配置' },
  { id: 'appstore', name: '应用商店', icon: 'download', category: 'system', dir: '应用商店', size: '64MB', description: '发现和下载应用' },

  // 新增
  { id: 'live', name: '直播', icon: 'live', category: 'entertainment', dir: '直播', size: '142MB', description: '看直播、送礼物、连麦互动' },
  { id: 'secondhand', name: '二手', icon: 'second-hand', category: 'shopping', dir: '二手', size: '108MB', description: '买卖闲置，淘好物' },
];

/** 根据 APP ID 获取图标 SVG path */
export function getIconPath(icon: string): string {
  return ICON_PATHS[icon] || '<rect x="3" y="3" width="18" height="18" rx="2"/>';
}

/** 根据 APP ID 获取背景色 */
export function getAppColor(appId: string): string {
  const info = APP_LIST.find(a => a.id === appId);
  if (info) return APP_COLORS[info.name] || '#579bf0';
  return '#579bf0';
}

/** 根据 APP ID 获取信息 */
export function getAppInfo(appId: string): AppInfo | undefined {
  return APP_LIST.find(a => a.id === appId);
}
