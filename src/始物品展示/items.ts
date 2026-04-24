// 物品图片映射：物品名 → 图片URL
export const ITEM_IMAGES: Record<string, string> = {
  // ===== 第一层·起始之间 - 场景物品 =====
  '柜子': 'https://i.postimg.cc/P5rd4V2Q/1.png',
  '柜子上的电脑': 'https://i.postimg.cc/CxLwNrmN/2.png',
  '桌子': 'https://i.postimg.cc/fRTMKqBV/3.png',
  '通风管': 'https://i.postimg.cc/K8qxs7H6/4.png',
  '带锁的门': 'https://i.postimg.cc/3wkYM4M5/5.png',
  '双人床': 'https://i.postimg.cc/DzSnVJVn/6.png',

  // ===== 第一层 - 可获取物品 =====
  '铜钥匙': 'https://i.postimg.cc/43YsC7CX/7.png',
  '纸条': 'https://i.postimg.cc/MGnqkMk6/8.png',
  '储蓄罐': 'https://i.postimg.cc/SKnk020N/9.png',
  '提示图': 'https://i.postimg.cc/rpDM606K/10.png',
  '六角形金属块': 'https://i.postimg.cc/43jZXfZN/11.png',

  // ===== 第二层·记忆走廊 - 场景物品 =====
  '照片墙': 'https://i.postimg.cc/k5L97J9D/12.png',
  '裂缝照片': 'https://i.postimg.cc/cJPZdxZg/13.png',
  '走廊尽头的岔路': 'https://i.postimg.cc/ZqXZJbZv/14.png',
  '地板上的信封': 'https://i.postimg.cc/rp7cqVcr/15.png',

  // ===== 第二层 - 可获取物品 =====
  '箱庭信笺': 'https://i.postimg.cc/xdBY9fYR/16.png',

  // ===== 第三层·机关庭院 - 场景物品 =====
  '枯竭喷泉': 'https://i.postimg.cc/xdBY9fYs/17.png',
  '齿轮箱': 'https://i.postimg.cc/DzRF7vFj/18.png',
  '藤蔓墙': 'https://i.postimg.cc/wvJzvCT5/19.png',
  '石板地面': 'https://i.postimg.cc/wvJzvCTC/20.png',
  '日晷': 'https://i.postimg.cc/Twmxwz38/21.png',

  // ===== 第三层 - 可获取物品 =====
  '大齿轮': 'https://i.postimg.cc/cHYWHpLd/22.png',
  '小齿轮': 'https://i.postimg.cc/hjxnjktS/23.png',

  // ===== 第四层·镜之间 - 场景物品 =====
  '入口之镜': 'https://i.postimg.cc/gjWW6gxc/24.png',
  '回忆碎片·神社': 'https://i.postimg.cc/x822b6X1/25.png',
  '真相之镜': 'https://i.postimg.cc/d3YYT5h3/26.png',
  '碎裂走廊': 'https://i.postimg.cc/Bb001mj8/27.png',

  // ===== 第四层 - 可获取物品 =====
  '日晷指针': 'https://i.postimg.cc/kGmmtT2W/28.png',

  // ===== 第五层·最终之门 - 场景物品 =====
  '黎明之门': 'https://i.postimg.cc/BbBG52F6/29.png',
  '独行之门': 'https://i.postimg.cc/D0PKQ1Gm/30.png',
  '无名之门': 'https://i.postimg.cc/QCJrgc7K/31.png',
  '石碑': 'https://i.postimg.cc/QCJrgc7K/31.png', // 共用无名之门图片
};

// 物品描述关键词映射
export const ITEM_KEYWORDS: Record<string, string> = {
  // ===== 第一层·起始之间 =====
  '柜子': '白色木质柜子，触控开关',
  '柜子上的电脑': '薄型笔记本，深灰金属外壳',
  '桌子': '极简木质桌台，浅灰桌面',
  '通风管': '天花板金属通风管，网格覆盖',
  '带锁的门': '厚重防盗门，数字密码面板',
  '双人床': '双人床，枕头YES!/NO!',
  '铜钥匙': '古铜色小钥匙，齿纹复杂',
  '纸条': '白色纸条，钢笔字 7-3-9-1',
  '储蓄罐': '猪形陶瓷储蓄罐',
  '提示图': '简笔画：站桌上够通风口',
  '六角形金属块': '六角金属块，向阳纹图案',

  // ===== 第二层·记忆走廊 =====
  '照片墙': '走廊合照墙，部分未来日期',
  '裂缝照片': '碎裂照片框，内容模糊',
  '走廊尽头的岔路': '左窄共行，右暗独探',
  '地板上的信封': '淡黄信封，向阳纹蜡封',
  '箱庭信笺': '向阳纹蜡封信笺',

  // ===== 第三层·机关庭院 =====
  '枯竭喷泉': '石质喷泉，背靠背双人雕像',
  '齿轮箱': '暴露齿轮箱，缺两个齿轮',
  '藤蔓墙': '浓密藤蔓覆盖的北侧墙壁',
  '石板地面': '刻有沟槽水路的石板地面',
  '日晷': '缺失指针的日晷，底座铭文',
  '大齿轮': '铜制齿轮，直径约5厘米',
  '小齿轮': '铜制齿轮，直径约3厘米',

  // ===== 第四层·镜之间 =====
  '入口之镜': '巨大落地镜，倒影在微笑',
  '回忆碎片·神社': '映出神社许愿画面的镜子',
  '真相之镜': '纯黑镜子，不反射任何东西',
  '碎裂走廊': '散落镜子碎片，折射光线',
  '日晷指针': '细长金属棒，日晷指针形状',

  // ===== 第五层·最终之门 =====
  '黎明之门': '金色门，并肩行走浮雕',
  '独行之门': '银色金属门，刻着"自由"',
  '无名之门': '不起眼的木门，温暖光线',
  '石碑': '刻有文字的石碑',
};

// 房间显示名称与颜色
export interface RoomInfo {
  name: string;
  color: string;
}

export const ROOM_INFO: Record<string, RoomInfo> = {
  '第一层·起始之间': { name: '起始之间', color: '#7eb8c9' },
  '第二层·记忆走廊': { name: '记忆走廊', color: '#c9a87e' },
  '第三层·机关庭院': { name: '机关庭院', color: '#7ec9a8' },
  '第四层·镜之间': { name: '镜之间', color: '#b87ec9' },
  '第五层·最终之门': { name: '最终之门', color: '#c97e7e' },
};

// 默认物品占位图（当没有对应图片时使用）
export const DEFAULT_ITEM_IMAGE = 'data:image/svg+xml,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
  <rect width="120" height="120" fill="#1a1f2e" rx="8"/>
  <circle cx="60" cy="45" r="16" fill="none" stroke="#3a4058" stroke-width="1.5"/>
  <text x="60" y="50" text-anchor="middle" fill="#3a4058" font-size="18" font-family="sans-serif">?</text>
  <text x="60" y="85" text-anchor="middle" fill="#3a4058" font-size="9" font-family="sans-serif">未知物品</text>
</svg>
`);
