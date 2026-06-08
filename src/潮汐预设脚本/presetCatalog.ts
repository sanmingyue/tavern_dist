// CDN 基础路径：预设文件使用独立版本号，避免 CDN 缓存导致玩家下到旧预设
export const CDN_BASE = 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@preset-v2.0.6/dist/presets';

export interface PresetCatalogItem {
  /** 显示名称 */
  name: string;
  /** CDN 上的文件名（不含路径） */
  filename: string;
  /** 简介 */
  description: string;
  /** 标签 */
  tags: string[];
  /** 作者 */
  author: string;
  /** 更新日期 */
  updateDate?: string;
}

export const PRESET_CATALOG: PresetCatalogItem[] = [
  {
    name: '明月秋青 Maya',
    filename: '明月秋青Maya.json',
    description: '最强的Gemini预设',
    tags: ['Gemini'],
    author: '三明月',
    updateDate: '2026.6.9',
  },
  {
    name: '明月秋青 by oneself',
    filename: '明月秋青by oneself.json',
    description: '明月秋青自用版预设。兼顾角色活人感、正文质量与多模型适配，适合按个人习惯继续微调。',
    tags: ['Gemini', 'Claude', 'DSV4PRO'],
    author: '三明月',
    updateDate: '2026.6.5',
  },
  {
    name: '明月秋青 Synapse Memory Yield',
    filename: '明月秋青Synapse Memory Yield.json',
    description: '最懂你的预设。活人感与人设挖掘深度极强，适合追求极致角色表现的用户。',
    tags: ['5.19更新', 'Claude', 'Gemini', '最懂你的预设'],
    author: '三明月',
  },
  {
    name: '分成两半的灰魂 · v2.0',
    filename: '分成两半的灰魂 · v2.0.json',
    description: 'DSV4 专属预设，灰魂人格创意写作预设。多文风可选，支持长考/普通思维链切换。',
    tags: ['DSV4专属预设', '非本人预设'],
    author: '濯清江',
  },
  {
    name: '浮生 Vane',
    filename: '浮生Vane.json',
    description: '全新格式大总结不丢人设，活人感无敌。雌小鬼浮生人格，简洁COT思维链。',
    tags: ['最新', 'DSV4PRO', 'Gemini3.1PRO预设'],
    author: '三明月',
  },
  {
    name: '潮汐 Plum blossom',
    filename: '潮汐Plum blossom.json',
    description: '杀八股能力极强，可以做到零八股。正文质量最高，Gemini 百分百适配。',
    tags: ['零八股', 'Gemini', 'Claude'],
    author: '三明月',
  },
  {
    name: '潮汐 Chaoxi',
    filename: '潮汐Chaoxi .json',
    description: '适配 DS3.2 等国模 + Gemini 的预设。小 COT 出字快，正文质量最高。',
    tags: ['国模', 'Gemini', '快速', 'DS3.2'],
    author: '三明月',
  },
  {
    name: '潮汐 女性向 Chaoxi',
    filename: '潮汐-女性向Chaoxi.json',
    description: '为女性玩家提供的游玩预设。NSFW 细分条目丰富，情感表达更细腻。',
    tags: ['女性向', 'NSFW', '情感'],
    author: '三明月',
  },
  {
    name: '明月秋青 NAI 提示词版',
    filename: '明月秋青nai提示词版.json',
    description: '专门用于给 AI 写 TAG 英文提示词的工具预设。只有这一个功能，无法进行 AIRP 游玩。',
    tags: ['工具', 'TAG提示词', 'NAI'],
    author: '三明月',
  },
  {
    name: '氤 yin',
    filename: '氤yin.json',
    description: '超轻 TOKEN 剧情推进向预设。核心重点：轻量 + 人设灵动 + 正文质量 + 剧情自然推进。',
    tags: ['轻量', '剧情推进', '低TOKEN'],
    author: '三明月',
  },
  {
    name: '傻子也有春天',
    filename: '傻子也有春天 .json',
    description: 'Kimi 2.5 专属预设，其他模型不适配。针对 Kimi 模型特性深度优化。',
    tags: ['Kimi 2.5', '专属'],
    author: '三明月',
  },
];
