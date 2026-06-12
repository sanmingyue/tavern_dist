import type { StructureItem, StructuredAppSpec } from '../components/structured-app-types';

function item(
  id: string,
  title: string,
  subtitle: string,
  icon: string,
  meta = '待接入',
  tags: string[] = [],
  actions: string[] = ['打开', '编辑', 'AI 更新', '反馈到正文'],
): StructureItem {
  return {
    id,
    title,
    subtitle,
    icon,
    meta,
    tags,
    actions,
    fields: [
      { label: '页面层级', value: '列表 / 详情 / 操作确认' },
      { label: '数据来源', value: '世界书持久化 + 第二 API 更新' },
      { label: '正文反馈', value: '预留结构，后续接入格式' },
    ],
  };
}

const socialActions = [
  { id: 'publish', label: '发布', icon: 'plus' },
  { id: 'topic', label: '话题', icon: 'topic' },
  { id: 'draft', label: '草稿', icon: 'file' },
  { id: 'notice', label: '提醒', icon: 'box' },
];

export const APP_STRUCTURES: Record<string, StructuredAppSpec> = {
  forum: {
    id: 'forum',
    title: '论坛',
    subtitle: '动态、帖子、话题与个人主页结构',
    accent: '#f5a623',
    primaryAction: '发帖',
    searchPlaceholder: '搜索帖子、话题、用户',
    tabs: [
      {
        id: 'feed',
        label: '推荐',
        hero: { kicker: '社区动态', title: '信息流框架已就绪', description: '后续可接 AI 生成动态、评论、热榜。', action: '发帖' },
        quickActions: socialActions,
        sections: [
          {
            id: 'posts',
            title: '帖子流',
            subtitle: '点击帖子进入详情页，保留评论与转发入口',
            moreLabel: '筛选',
            items: [
              item('post-card', '帖子卡片', '头像、标题、正文预览、图片区、互动栏', 'topic', '互动'),
              item('hot-topic', '热榜话题', '话题详情、参与者、相关帖子列表', 'search', '热榜'),
              item('following-feed', '关注动态', '好友更新、点赞评论、转发入口', 'topic', '关注'),
            ],
          },
        ],
      },
      {
        id: 'mine',
        label: '我的',
        quickActions: socialActions,
        sections: [
          {
            id: 'profile',
            title: '个人中心',
            items: [
              item('my-posts', '我的帖子', '已发布、草稿、审核状态', 'file', '管理'),
              item('favorites', '收藏与历史', '收藏帖子、浏览记录、屏蔽列表', 'box', '本地'),
            ],
          },
        ],
      },
    ],
  },
  map: {
    id: 'map',
    title: '地图',
    subtitle: '搜索、路线、附近、收藏地点',
    accent: '#21b89f',
    primaryAction: '搜索地点',
    searchPlaceholder: '搜索地点、路线、店铺',
    tabs: [
      {
        id: 'map',
        label: '地图',
        hero: { kicker: '当前位置', title: '地图画布占位', description: '后续接入地点状态、世界书地理信息和路线反馈。', action: '定位' },
        quickActions: [
          { id: 'route', label: '路线', icon: 'route' },
          { id: 'nearby', label: '附近', icon: 'search' },
          { id: 'mark', label: '标记', icon: 'plus' },
          { id: 'share', label: '分享', icon: 'box' },
        ],
        sections: [
          {
            id: 'poi',
            title: '附近地点',
            subtitle: '点击地点展开详情、导航、收藏、反馈正文',
            items: [
              item('poi-food', '餐饮地点卡', '距离、营业状态、评分、路线入口', 'route', '300m', ['附近']),
              item('poi-home', '住处 / 常去地点', '世界书可持久化常用地址', 'box', '收藏'),
              item('poi-event', '剧情地点', '可由 AI 更新当前地点与事件备注', 'topic', 'AI'),
            ],
          },
        ],
      },
      {
        id: 'route',
        label: '路线',
        sections: [
          {
            id: 'route-plan',
            title: '路线规划',
            items: [
              item('walk', '步行路线', '起点、终点、途经点、预计时间', 'route', '规划'),
              item('transit', '公共交通', '站点列表、换乘节点、到站提醒', 'route', '换乘'),
            ],
          },
        ],
      },
    ],
  },
  delivery: {
    id: 'delivery',
    title: '外卖',
    subtitle: '商家、菜单、购物车、订单追踪',
    accent: '#ff9f1c',
    primaryAction: '搜索商家',
    searchPlaceholder: '搜索商家或菜品',
    tabs: [
      {
        id: 'home',
        label: '首页',
        hero: { kicker: '当前地址', title: '外卖首页框架', description: '后续接入商家列表、优惠和配送状态。', action: '选择地址' },
        quickActions: [
          { id: 'cart', label: '购物车', icon: 'cart' },
          { id: 'coupon', label: '红包', icon: 'pay' },
          { id: 'address', label: '地址', icon: 'route' },
          { id: 'orders', label: '订单', icon: 'file' },
        ],
        sections: [
          {
            id: 'restaurants',
            title: '推荐商家',
            layout: 'cards',
            items: [
              item('restaurant', '商家卡片', '店铺页、分类菜单、评价、起送价', 'cart', '30min', ['菜单', '配送']),
              item('menu-item', '菜品详情', '规格、加购、备注、购物车联动', 'box', '加购'),
            ],
          },
        ],
      },
      {
        id: 'orders',
        label: '订单',
        sections: [
          {
            id: 'tracking',
            title: '订单追踪',
            items: [
              item('order-flow', '订单状态流', '下单、接单、配送、送达、评价', 'route', '流程'),
              item('after-sale', '售后与评价', '退款、催单、评价入口', 'file', '服务'),
            ],
          },
        ],
      },
    ],
  },
  taxi: {
    id: 'taxi',
    title: '打车',
    subtitle: '定位、目的地、车型、订单',
    accent: '#ff6b6b',
    primaryAction: '呼叫车辆',
    searchPlaceholder: '输入目的地',
    tabs: [
      {
        id: 'request',
        label: '叫车',
        hero: { kicker: '出行', title: '从当前位置出发', description: '预留上车点、终点、车型与司机详情。', action: '选择终点' },
        quickActions: [
          { id: 'pickup', label: '上车点', icon: 'route' },
          { id: 'destination', label: '终点', icon: 'search' },
          { id: 'type', label: '车型', icon: 'car' },
          { id: 'pay', label: '支付', icon: 'pay' },
        ],
        sections: [
          {
            id: 'car-types',
            title: '车型选择',
            items: [
              item('express', '快车', '预计价、等待时间、可选优惠', 'car', '3分钟'),
              item('premium', '专车', '车型等级、司机信息、行程偏好', 'car', '5分钟'),
            ],
          },
        ],
      },
      {
        id: 'orders',
        label: '行程',
        sections: [
          { id: 'rides', title: '行程记录', items: [item('ride-detail', '行程详情', '路线、费用、评价、发票入口', 'file', '历史')] },
        ],
      },
    ],
  },
  movie: {
    id: 'movie',
    title: '电影',
    subtitle: '热映、影院、场次、座位',
    accent: '#9b59b6',
    primaryAction: '搜电影',
    searchPlaceholder: '搜索电影、影院',
    tabs: [
      {
        id: 'showing',
        label: '热映',
        quickActions: [
          { id: 'cinema', label: '影院', icon: 'search' },
          { id: 'ticket', label: '取票', icon: 'file' },
          { id: 'seat', label: '选座', icon: 'box' },
          { id: 'order', label: '订单', icon: 'pay' },
        ],
        sections: [
          {
            id: 'movies',
            title: '影片列表',
            layout: 'cards',
            items: [
              item('movie-card', '电影卡片', '海报、评分、简介、场次入口', 'play', '热映'),
              item('cinema-card', '影院卡片', '距离、场次、价格、座位图入口', 'box', '附近'),
            ],
          },
        ],
      },
      {
        id: 'orders',
        label: '订单',
        sections: [{ id: 'tickets', title: '电影票', items: [item('ticket-detail', '票券详情', '座位、二维码、退改规则', 'file', '待开场')] }],
      },
    ],
  },
  music: {
    id: 'music',
    title: '音乐',
    subtitle: '网易云歌单、播放队列、歌词结构',
    accent: '#d43c33',
    primaryAction: '导入歌单',
    searchPlaceholder: '搜索歌曲、歌手、歌单',
    tabs: [
      {
        id: 'recommend',
        label: '推荐',
        hero: { kicker: '播放中', title: '播放器框架', description: '后续接网易云歌单、播放源和歌词同步。', action: '播放' },
        quickActions: [
          { id: 'netease', label: '网易云', icon: 'play' },
          { id: 'playlist', label: '歌单', icon: 'file' },
          { id: 'queue', label: '队列', icon: 'box' },
          { id: 'identify', label: '识曲', icon: 'search' },
        ],
        sections: [
          {
            id: 'playlists',
            title: '歌单结构',
            layout: 'cards',
            items: [
              item('playlist-card', '歌单卡片', '封面、创建者、歌曲数、导入入口', 'play', '歌单'),
              item('song-row', '歌曲行', '歌曲、歌手、专辑、更多操作', 'play', '歌曲'),
            ],
          },
        ],
      },
      {
        id: 'player',
        label: '播放',
        sections: [{ id: 'player', title: '播放页', items: [item('lyric', '歌词与控制区', '播放、暂停、进度、收藏、评论入口', 'play', '控制')] }],
      },
    ],
  },
  video: {
    id: 'video',
    title: '视频',
    subtitle: '推荐流、关注、收藏、上传',
    accent: '#ff4757',
    primaryAction: '上传',
    searchPlaceholder: '搜索视频、作者',
    tabs: [
      {
        id: 'feed',
        label: '推荐',
        hero: { kicker: '沉浸流', title: '短视频框架', description: '纵向视频流、互动栏、评论抽屉预留。', action: '播放' },
        quickActions: [
          { id: 'like', label: '喜欢', icon: 'plus' },
          { id: 'comment', label: '评论', icon: 'topic' },
          { id: 'share', label: '分享', icon: 'box' },
          { id: 'upload', label: '上传', icon: 'file' },
        ],
        sections: [
          { id: 'videos', title: '视频卡片', items: [item('video-card', '视频详情页', '封面、作者、弹幕、评论、相关推荐', 'play', '播放中')] },
        ],
      },
      {
        id: 'library',
        label: '收藏',
        sections: [{ id: 'library', title: '收藏夹', items: [item('collection', '视频收藏夹', '分组、历史、稍后看', 'file', '本地')] }],
      },
    ],
  },
  shop: {
    id: 'shop',
    title: '购物',
    subtitle: '商品、购物车、订单、售后',
    accent: '#f39c12',
    primaryAction: '搜商品',
    searchPlaceholder: '搜索商品、店铺',
    tabs: [
      {
        id: 'home',
        label: '首页',
        quickActions: [
          { id: 'cart', label: '购物车', icon: 'cart' },
          { id: 'coupon', label: '优惠券', icon: 'pay' },
          { id: 'address', label: '地址', icon: 'route' },
          { id: 'orders', label: '订单', icon: 'file' },
        ],
        sections: [
          {
            id: 'products',
            title: '商品结构',
            layout: 'cards',
            items: [
              item('product', '商品卡片', '图片、价格、规格、店铺、加入购物车', 'cart', '商品'),
              item('store', '店铺主页', '店铺信息、分类、客服、关注入口', 'box', '店铺'),
            ],
          },
        ],
      },
      {
        id: 'orders',
        label: '订单',
        sections: [{ id: 'orders', title: '订单中心', items: [item('order', '订单详情', '物流、售后、评价、再次购买', 'file', '流程')] }],
      },
    ],
  },
  wallet: {
    id: 'wallet',
    title: '钱包',
    subtitle: '付款、收款、转账、账单',
    accent: '#27ae60',
    primaryAction: '付款',
    searchPlaceholder: '搜索账单、商户',
    tabs: [
      {
        id: 'home',
        label: '首页',
        hero: { kicker: '余额', title: '支付首页结构', description: '类似支付宝/钱包的付款、收款、卡包、账单。', action: '付款' },
        quickActions: [
          { id: 'pay', label: '付款', icon: 'pay' },
          { id: 'receive', label: '收款', icon: 'plus' },
          { id: 'transfer', label: '转账', icon: 'route' },
          { id: 'cards', label: '卡包', icon: 'file' },
        ],
        sections: [
          {
            id: 'assets',
            title: '资产与服务',
            items: [
              item('bill', '账单详情', '交易记录、分类统计、退款入口', 'pay', '账单'),
              item('card', '银行卡 / 卡包', '卡片管理、默认支付、验证流程', 'file', '卡包'),
            ],
          },
        ],
      },
      {
        id: 'security',
        label: '安全',
        sections: [{ id: 'security', title: '安全中心', items: [item('verify', '支付安全', '密码、指纹、限额、风控提示', 'box', '安全')] }],
      },
    ],
  },
  camera: {
    id: 'camera',
    title: '相机',
    subtitle: '拍照、视频、扫描、滤镜',
    accent: '#7f8c8d',
    primaryAction: '拍摄',
    searchPlaceholder: '搜索相机模式',
    tabs: [
      {
        id: 'shoot',
        label: '拍照',
        hero: { kicker: '取景框', title: '相机画布占位', description: '预留拍摄、预览、重拍、保存到相册。', action: '拍摄' },
        quickActions: [
          { id: 'switch', label: '切换', icon: 'camera' },
          { id: 'flash', label: '闪光', icon: 'box' },
          { id: 'filter', label: '滤镜', icon: 'plus' },
          { id: 'album', label: '相册', icon: 'file' },
        ],
        sections: [{ id: 'modes', title: '拍摄模式', items: [item('portrait', '人像模式', '景深、滤镜、美颜、保存流程', 'camera', '模式')] }],
      },
      {
        id: 'scan',
        label: '扫描',
        sections: [{ id: 'scan', title: '扫描工具', items: [item('qr', '扫码 / 文档扫描', '识别结果、复制、打开、反馈入口', 'search', '识别')] }],
      },
    ],
  },
  gallery: {
    id: 'gallery',
    title: '相册',
    subtitle: '照片、相簿、回忆、编辑',
    accent: '#e91e63',
    primaryAction: '导入',
    searchPlaceholder: '搜索照片、地点、人物',
    tabs: [
      {
        id: 'photos',
        label: '照片',
        quickActions: [
          { id: 'select', label: '选择', icon: 'plus' },
          { id: 'album', label: '相簿', icon: 'file' },
          { id: 'share', label: '分享', icon: 'box' },
          { id: 'edit', label: '编辑', icon: 'camera' },
        ],
        sections: [
          {
            id: 'photos',
            title: '照片网格',
            layout: 'cards',
            items: [
              item('photo', '照片详情', '预览、编辑、分享、删除、设为壁纸', 'camera', '照片'),
              item('album', '相簿详情', '相簿名、数量、封面、批量操作', 'file', '相簿'),
            ],
          },
        ],
      },
      {
        id: 'memory',
        label: '回忆',
        sections: [{ id: 'memory', title: '回忆合集', items: [item('memory-card', '回忆卡片', '时间线、地点、人物、自动生成入口', 'box', 'AI')] }],
      },
    ],
  },
  browser: {
    id: 'browser',
    title: '浏览器',
    subtitle: '地址栏、标签页、收藏、历史',
    accent: '#2196f3',
    primaryAction: '新标签',
    searchPlaceholder: '搜索或输入网址',
    tabs: [
      {
        id: 'start',
        label: '起始页',
        hero: { kicker: '地址栏', title: '网页浏览结构', description: '预留标签页、历史、收藏、AI 摘要。', action: '打开网页' },
        quickActions: [
          { id: 'tab', label: '标签页', icon: 'plus' },
          { id: 'bookmark', label: '收藏', icon: 'file' },
          { id: 'history', label: '历史', icon: 'box' },
          { id: 'reader', label: '阅读', icon: 'search' },
        ],
        sections: [
          { id: 'sites', title: '快捷网站', items: [item('site', '网站卡片', '标题、网址、快照、打开方式', 'search', '网页')] },
        ],
      },
      {
        id: 'tabs',
        label: '标签',
        sections: [{ id: 'tabs', title: '标签管理', items: [item('tab-detail', '标签页详情', '当前页、后退前进、关闭、加入收藏', 'file', '标签')] }],
      },
    ],
  },
  calendar: {
    id: 'calendar',
    title: '日历',
    subtitle: '月视图、日程、提醒、订阅',
    accent: '#ff5722',
    primaryAction: '新建日程',
    searchPlaceholder: '搜索日程',
    tabs: [
      {
        id: 'today',
        label: '今天',
        hero: { kicker: '今日', title: '日程总览', description: '预留月历、时间线、提醒与重复规则。', action: '新建' },
        quickActions: [
          { id: 'event', label: '日程', icon: 'calendar' },
          { id: 'todo', label: '待办', icon: 'file' },
          { id: 'remind', label: '提醒', icon: 'box' },
          { id: 'subscribe', label: '订阅', icon: 'plus' },
        ],
        sections: [
          { id: 'timeline', title: '时间线', items: [item('event-detail', '日程详情', '时间、地点、参与人、提醒、重复', 'calendar', '今天')] },
        ],
      },
      {
        id: 'month',
        label: '月',
        sections: [{ id: 'month', title: '月视图', items: [item('month-cell', '日期格子', '节日、日程点、选中日详情', 'calendar', '视图')] }],
      },
    ],
  },
  notes: {
    id: 'notes',
    title: '备忘录',
    subtitle: '笔记、清单、文件夹、标签',
    accent: '#ffc107',
    primaryAction: '新笔记',
    searchPlaceholder: '搜索笔记',
    tabs: [
      {
        id: 'all',
        label: '全部',
        quickActions: [
          { id: 'note', label: '笔记', icon: 'file' },
          { id: 'checklist', label: '清单', icon: 'plus' },
          { id: 'voice', label: '语音', icon: 'box' },
          { id: 'folder', label: '文件夹', icon: 'file' },
        ],
        sections: [
          { id: 'notes', title: '笔记列表', items: [item('note-editor', '笔记编辑器', '标题、正文、标签、置顶、分享', 'file', '编辑')] },
        ],
      },
      {
        id: 'folders',
        label: '文件夹',
        sections: [{ id: 'folders', title: '文件夹', items: [item('folder-detail', '文件夹详情', '分组、排序、批量移动', 'file', '管理')] }],
      },
    ],
  },
  files: {
    id: 'files',
    title: '文件',
    subtitle: '最近、浏览、共享、下载',
    accent: '#795548',
    primaryAction: '新建文件夹',
    searchPlaceholder: '搜索文件',
    tabs: [
      {
        id: 'recent',
        label: '最近',
        quickActions: [
          { id: 'folder', label: '文件夹', icon: 'file' },
          { id: 'upload', label: '上传', icon: 'plus' },
          { id: 'scan', label: '扫描', icon: 'search' },
          { id: 'sort', label: '排序', icon: 'box' },
        ],
        sections: [
          {
            id: 'files',
            title: '文件列表',
            items: [
              item('file-row', '文件行', '名称、类型、大小、位置、更多操作', 'file', '文件'),
              item('folder-row', '文件夹行', '子文件、共享、移动、删除入口', 'file', '文件夹'),
            ],
          },
        ],
      },
      {
        id: 'shared',
        label: '共享',
        sections: [{ id: 'shared', title: '共享文件', items: [item('share-detail', '共享详情', '权限、链接、成员、取消共享', 'file', '共享')] }],
      },
    ],
  },
};
