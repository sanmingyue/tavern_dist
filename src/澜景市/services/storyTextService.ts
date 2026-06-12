export type StoryTextSource = 'ai_output' | 'user_input';

export type FinalStoryTextOptions = {
  messageId?: number;
  source?: StoryTextSource;
  characterName?: string;
  applyRegex?: boolean;
  preserveTime?: boolean;
};

const THINKING_TAGS = [
  'think',
  'thinking',
  'thought',
  'thoughts',
  'reasoning',
  'analysis',
  'cot',
  'chain-of-thought',
  'chain_of_thought',
  'inner_monologue',
  'internal',
  '思考',
  '思维链',
  '推理',
  '内心推理',
];

const CONTROL_TAGS = [
  '时间戳',
  '关系事件',
  '回忆记录',
  '约定',
  '地点变更',
  '地标变更',
  '澜景控制',
  '澜景规则',
  '澜景状态',
  '闪讯',
  '短信',
  '话圈',
  '直播',
  '电话',
  '吃点啥',
  '淘点',
  '闲转',
  '备忘录',
  '日历',
  '通知',
  '闪讯好友',
  '闪讯拉黑',
  '闪讯删好友',
];

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripPairedTags(text: string, tagNames: string[]): string {
  let next = text;
  for (const tagName of tagNames) {
    const tag = escapeRegex(tagName);
    next = next.replace(new RegExp(`<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '');
    next = next.replace(new RegExp(`\\[${tag}\\b[^\\]]*\\][\\s\\S]*?\\[\\/${tag}\\]`, 'gi'), '');
    next = next.replace(new RegExp(`【${tag}】[\\s\\S]*?【\\/${tag}】`, 'gi'), '');
  }
  return next;
}

function extractFirstTagContent(text: string, tagNames: string[]): string | undefined {
  for (const tagName of tagNames) {
    const tag = escapeRegex(tagName);
    const match = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(text);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return undefined;
}

function extractContentBlocks(text: string): string | undefined {
  const matches = Array.from(text.matchAll(/<content\b[^>]*>([\s\S]*?)<\/content>/gi))
    .map(match => match[1]?.trim())
    .filter(Boolean);
  return matches.length > 0 ? matches.join('\n\n') : undefined;
}

function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function stripResidualMarkup(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?(?:p|div|section|article|br|hr)\b[^>]*>/gi, '\n')
    .replace(/<[^>\n]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function getRegexDepth(messageId?: number): number | undefined {
  if (messageId === undefined) return undefined;
  try {
    const lastId = getLastMessageId();
    return Math.max(0, lastId - messageId);
  } catch {
    return undefined;
  }
}

function applyDisplayRegex(text: string, options: FinalStoryTextOptions): string {
  if (options.applyRegex === false) return text;
  try {
    const result = formatAsTavernRegexedString(text, options.source ?? 'ai_output', 'display', {
      depth: getRegexDepth(options.messageId),
      character_name: options.characterName,
    });
    return typeof result === 'string' ? result : text;
  } catch (error) {
    console.warn('[澜景市] 应用酒馆显示正则失败，改用原始正文清洗:', error);
    return text;
  }
}

export function sanitizeStoryText(text: string, options: FinalStoryTextOptions = {}): string {
  const timeText = options.preserveTime === false ? undefined : extractFirstTagContent(text, ['time', '时间戳']);
  const contentText = extractContentBlocks(text) ?? text;
  let next = contentText;

  next = stripPairedTags(next, THINKING_TAGS);
  next = stripPairedTags(next, CONTROL_TAGS);
  next = stripResidualMarkup(next);
  next = normalizeWhitespace(next);

  if (timeText && next && !next.startsWith('[时间 ')) {
    return `[时间 ${timeText}]\n${next}`;
  }
  return next;
}

export function getFinalStoryTextFromRaw(rawText: string, options: FinalStoryTextOptions = {}): string {
  if (!rawText) return '';
  const regexed = applyDisplayRegex(rawText, options);
  const finalText = sanitizeStoryText(regexed, options);
  if (finalText) return finalText;

  // 如果显示正则把整段正文处理空了，回退到原文兜底清洗，避免误丢正文。
  return sanitizeStoryText(rawText, { ...options, applyRegex: false });
}

export function getFinalStoryText(messageId: number, options: FinalStoryTextOptions = {}): string {
  const role = options.source === 'user_input' ? 'user' : 'assistant';
  const messages = getChatMessages(messageId, { role });
  const message = messages[0];
  return message ? getFinalStoryTextFromRaw(message.message || '', { ...options, messageId }) : '';
}
