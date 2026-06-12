import { reactive } from 'vue';
import type { WorkItem, CollectionChild } from './types';

/**
 * 调试模式专用 — 共享 Mock 作品列表
 * WorkshopView 读取，UploadView 写入，实现调试上传后立即显示效果
 */
export const debugWorks: WorkItem[] = [
  {
    id: 9991, title: '如月绘里奈', char_name: '如月绘里奈',
    description: '高冷的财阀千金，背地里却有着不为人知的秘密...',
    type: 'persona', tags: ['OC', '现代', '千金'],
    cover_url: 'https://esvigan.cn/绘里奈插图1.webp',
    card_link: 'https://github.com', file_type: 'json',
    author: { username: 'Stitch', display_name: 'Stitch', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Stitch' },
    download_count: 532, like_count: 102, liked: false, created_at: '2026-05-02T12:00:00Z',
  },
  {
    id: 9992, title: '林绛 (月宫绾音)', char_name: '林绛',
    description: '东京大学大一的中国留学生，Tomorrow\'s Girlfriend 平台 Top 10 的租借女友。',
    type: 'persona', tags: ['OC', '现代', '校园'],
    cover_url: 'https://esvigan.cn/林绛插图1.webp',
    card_link: '', file_type: 'json',
    author: { username: 'Author', display_name: 'Author', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Author' },
    download_count: 850, like_count: 320, liked: true, created_at: '2026-05-03T12:00:00Z',
  },
  {
    id: 9993, title: '安藤由美', char_name: '安藤由美',
    description: '新宿的一名普通女高中生，卷入了不可思议的事件中。',
    type: 'persona', tags: ['OC', '现代', '日常'],
    cover_url: 'https://esvigan.cn/由美插图1.webp',
    card_link: '', file_type: 'json',
    author: { username: 'Creator', display_name: 'Creator', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Creator' },
    download_count: 420, like_count: 85, liked: false, created_at: '2026-05-04T12:00:00Z',
  },
  {
    id: 9994, title: '《边缘行者》完整世界书',
    description: '包含夜之城所有帮派和设定的世界书。',
    type: 'worldbook', tags: ['世界书', '赛博朋克', '科幻'],
    cover_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=worldbook',
    card_link: '', file_type: 'json',
    author: { username: 'LoreMaster', display_name: 'Lore Master', avatar: '' },
    download_count: 8900, like_count: 2310, liked: false, created_at: '2026-05-03T12:00:00Z',
  },
  {
    id: 9995, title: 'Stitch 合集',
    description: '下载作者 Stitch 的所有作品，包含人设、二创、世界书等多类型内容。',
    type: 'collection', tags: ['合集', 'Stitch'],
    cover_url: 'https://api.dicebear.com/7.x/shapes/svg?seed=stitch-collection',
    card_link: '', file_type: 'json',
    author: { username: 'Stitch', display_name: 'Stitch', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Stitch' },
    download_count: 1240, like_count: 380, liked: false, created_at: '2026-05-05T12:00:00Z',
  },
];

/** 调试模式当前登录用户名（用于过滤「我的作品」） */
export const DEBUG_CURRENT_USER = 'Stitch';

/** 调试内容模拟 */
export const DEBUG_MOCK_CONTENT = `[DEBUG MODE CONTENT]\n这里是针对当前类型的模拟正文内容展示。\n\n\`\`\`json\n{\n  "name": "Cyberpunk Mock Data",\n  "version": "1.0.0"\n}\n\`\`\`\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit.`;

/** 合集子作品 Mock 映射（reactive，支持运行时写入）: key = 合集父作品 id */
export const mockCollectionChildren = reactive<Record<number, CollectionChild[]>>({
  9995: [
    {
      id: 9991, title: '如月绘里奈', type: 'persona', char_name: '如月绘里奈',
      description: '高冷的财阀千金，背地里却有着不为人知的秘密...',
      tags: ['OC', '现代', '千金'],
      cover_url: 'https://esvigan.cn/绘里奈插图1.webp',
      card_link: 'https://github.com', file_type: 'json',
      content: DEBUG_MOCK_CONTENT,
      like_count: 102, liked: false, download_count: 532,
      author: { username: 'Stitch', display_name: 'Stitch', avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Stitch' },
    },
    {
      id: 9994, title: '《边缘行者》带连世界书', type: 'worldbook',
      description: '包含多个边缘布派设定的内容的属于边缘行者的带连设定。',
      tags: ['世界书', '赛博朋克'],
      cover_url: null,
      card_link: '', file_type: 'json',
      content: DEBUG_MOCK_CONTENT,
      like_count: 58, liked: false, download_count: 240,
      author: { username: 'LoreMaster', display_name: 'Lore Master', avatar: '' },
    },
  ],
});

/** 生成下一个调试 ID */
export function nextDebugId(): number {
  return Math.max(...debugWorks.map(w => w.id), 9999) + 1;
}
