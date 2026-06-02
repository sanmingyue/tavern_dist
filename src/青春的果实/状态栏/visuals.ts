import type { CharacterMeta } from './store';

export type CharacterRuntimeData = {
  好感度: number;
  关系状态: string;
  关键事件: Record<string, boolean>;
};

export type CharacterVisualStage = 'normal' | 'confession' | 'lover';

export type CharacterVisuals = {
  stage: CharacterVisualStage;
  avatar: string;
  background: string;
  fallback: string;
  border: string;
  glow: string;
};

const STAGE_ASSET_BASE =
  'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@fruit-v5.0.0/dist/青春的果实/青春的果实图片/stage';

const SLUG_BY_NAME: Record<string, string> = {
  洛月: 'luoyue',
  苏晴: 'suqing',
  沈曼莎: 'shenmansha',
  宋雨欣: 'songyuxin',
  司菲: 'sifei',
  慕言: 'muyan',
  云初夏: 'yunchuxia',
  厉莎: 'lisha',
  洛蓉: 'luorong',
  苏琪: 'suqi',
  程妞妞: 'chengniuniu',
};

const LOVER_BORDER_BY_NAME: Record<string, { border: string; glow: string }> = {
  洛月: { border: 'rgba(147, 197, 253, 0.78)', glow: 'rgba(96, 165, 250, 0.32)' },
  苏晴: { border: 'rgba(216, 180, 254, 0.78)', glow: 'rgba(168, 85, 247, 0.28)' },
  沈曼莎: { border: 'rgba(134, 239, 172, 0.76)', glow: 'rgba(34, 197, 94, 0.26)' },
  宋雨欣: { border: 'rgba(221, 214, 254, 0.78)', glow: 'rgba(139, 92, 246, 0.28)' },
  司菲: { border: 'rgba(253, 186, 116, 0.8)', glow: 'rgba(249, 115, 22, 0.3)' },
  慕言: { border: 'rgba(165, 180, 252, 0.78)', glow: 'rgba(79, 70, 229, 0.3)' },
  云初夏: { border: 'rgba(110, 231, 183, 0.78)', glow: 'rgba(16, 185, 129, 0.28)' },
  厉莎: { border: 'rgba(251, 207, 232, 0.78)', glow: 'rgba(236, 72, 153, 0.26)' },
  洛蓉: { border: 'rgba(191, 219, 254, 0.78)', glow: 'rgba(59, 130, 246, 0.28)' },
  苏琪: { border: 'rgba(217, 249, 157, 0.78)', glow: 'rgba(132, 204, 22, 0.24)' },
  程妞妞: { border: 'rgba(254, 215, 170, 0.82)', glow: 'rgba(245, 158, 11, 0.28)' },
};

const FINAL_RELATIONS = new Set(['恋人', '决裂', '封心', '疏远']);

function hasConfessionEvent(charData: CharacterRuntimeData): boolean {
  return Object.keys(charData.关键事件 ?? {}).some(key => key.includes('告白事件') || key.includes('正式告白'));
}

export function getCharacterVisualStage(charData: CharacterRuntimeData): CharacterVisualStage {
  if (charData.关系状态 === '恋人') return 'lover';
  if (FINAL_RELATIONS.has(charData.关系状态)) return 'normal';
  if (charData.好感度 >= 100 || hasConfessionEvent(charData)) return 'confession';
  return 'normal';
}

export function getCharacterVisuals(meta: CharacterMeta, charData: CharacterRuntimeData): CharacterVisuals {
  const slug = SLUG_BY_NAME[meta.name];
  const stage = getCharacterVisualStage(charData);
  const loverBorder = LOVER_BORDER_BY_NAME[meta.name] ?? {
    border: 'rgba(249, 168, 212, 0.78)',
    glow: 'rgba(236, 72, 153, 0.28)',
  };

  if (stage === 'lover' && slug) {
    return {
      stage,
      avatar: `${STAGE_ASSET_BASE}/${slug}_lover_bride_avatar.jpg`,
      background: `${STAGE_ASSET_BASE}/${slug}_lover_bride_bg.jpg`,
      fallback: meta.image,
      border: loverBorder.border,
      glow: loverBorder.glow,
    };
  }

  if (stage === 'confession' && slug) {
    return {
      stage,
      avatar: `${STAGE_ASSET_BASE}/${slug}_confession_avatar.jpg`,
      background: `${STAGE_ASSET_BASE}/${slug}_confession_bg.jpg`,
      fallback: meta.image,
      border: 'rgba(251, 207, 232, 0.62)',
      glow: 'rgba(244, 114, 182, 0.22)',
    };
  }

  return {
    stage,
    avatar: meta.image,
    background: meta.image,
    fallback: meta.image,
    border: 'rgba(255, 255, 255, 0.1)',
    glow: 'rgba(0, 0, 0, 0)',
  };
}
