import { IMAGE_BLOCK_PATTERN, parseImageBlockRaw, type NaiBlockConfig } from './nai';
import type { ComicApiMode, NaiSettings } from './store';

export type ComicModel = {
  id: string;
};

export type ComicImageBlockResult = {
  raw: string;
  config: NaiBlockConfig;
  modelText: string;
};

type CompletionResponse = {
  choices?: Array<{
    finish_reason?: string | null;
    message?: { content?: string };
    text?: string;
  }>;
};

const COMPLETION_MARKER = '<<<NAI_COMIC_DONE>>>';

const COMIC_SYSTEM_PROMPT = `你是 NovelAI 漫画分镜提示词生成器。
你的任务不是续写剧情，而是把聊天楼层剧情转换成适合 NAI Diffusion V4.5 的英文生图提示词。

规则：
- 只根据用户提供的“剧情上下文”和“当前目标楼层”生成当前楼层画面。
- 1 楼只看 1 楼，2 楼看 1-2 楼，后续同理；越靠后的楼层要保持角色、地点和情绪连续。
- 用户会给出“需要分镜数”。如果分镜数大于 1，必须把当前目标楼层正文按时间顺序拆成对应数量的连续片段，每个片段生成一个不同画面。
- 每个 <nai-image> 块只能对应一个片段，不要把同一段剧情、同一姿势、同一镜头重复写成多张。
- positive 只写当前画面的英文提示词，不包含固定作者串、画师串、质量词或后置作者串。
- negative_prompt 只写当前画面的英文反向提示词。
- 如果有多角色，使用 characters，每个角色单独写 prompt 和 position。
- 不要输出中文解释，不要输出 Markdown。
- 必须输出与分镜数完全一致的完整 <nai-image> YAML 块，最后单独输出 <<<NAI_COMIC_DONE>>>。

输出格式：
<nai-image>
positive: "current scene tags"
negative_prompt: "lowres, bad anatomy, bad hands, text, watermark"
characters:
  - name: "character"
    prompt: "character tags"
    position: center
</nai-image>
<<<NAI_COMIC_DONE>>>`;

export function getDefaultComicBaseUrl(mode: ComicApiMode): string {
  return mode === 'deepseek' ? 'https://api.deepseek.com' : 'https://api.openai.com/v1';
}

export function getDefaultComicModel(mode: ComicApiMode): string {
  return mode === 'deepseek' ? 'deepseek-chat' : '';
}

export async function fetchComicModels(settings: NaiSettings): Promise<string[]> {
  const response = await fetch(`${normalizeBaseUrl(settings.comicBaseUrl)}/models`, {
    method: 'GET',
    headers: buildComicHeaders(settings),
  });

  if (!response.ok) throw new Error(await readComicError(response, '拉取模型失败'));

  const data = (await response.json()) as { data?: ComicModel[] };
  const models = (data.data ?? [])
    .map(model => model.id)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  if (models.length > 0) return models;
  if (settings.comicApiMode === 'deepseek') return ['deepseek-chat', 'deepseek-reasoner'];
  throw new Error('接口已连接，但没有返回可用模型。');
}

export async function requestComicImageBlock(
  settings: NaiSettings,
  context: string,
  targetMessage: ChatMessage,
): Promise<ComicImageBlockResult> {
  const [result] = await requestComicImageBlocks(settings, context, targetMessage, 1);
  return result;
}

export async function requestComicImageBlocks(
  settings: NaiSettings,
  context: string,
  targetMessage: ChatMessage,
  frameCount: number,
): Promise<ComicImageBlockResult[]> {
  if (!settings.comicModel.trim()) throw new Error('请先选择漫画转提示词模型。');
  const requestedFrameCount = Math.min(10, Math.max(1, Math.floor(frameCount)));

  const response = await fetch(`${normalizeBaseUrl(settings.comicBaseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      ...buildComicHeaders(settings),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.comicModel.trim(),
      temperature: settings.comicTemperature,
      max_tokens: settings.comicMaxTokens,
      stream: false,
      messages: [
        { role: 'system', content: COMIC_SYSTEM_PROMPT },
        {
          role: 'user',
          content: buildComicUserPrompt(context, targetMessage, requestedFrameCount),
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(await readComicError(response, '漫画提示词请求失败'));

  const data = (await response.json()) as CompletionResponse;
  const modelText = stripCompletionMarker(readCompletionContent(data));
  if (!modelText.trim()) throw new Error('模型返回为空。');

  const raws = extractRawImageBlocks(modelText, requestedFrameCount);
  if (raws.length < requestedFrameCount) {
    throw new Error(
      `漫画模型只返回了 ${raws.length} 个分镜提示词块，但当前设置需要 ${requestedFrameCount} 个。请提高“最大输出”或重试；不要用同一个 tag 块重复生成多张。`,
    );
  }

  return raws.slice(0, requestedFrameCount).map(raw => ({
    raw,
    config: parseImageBlockRaw(raw),
    modelText,
  }));
}

function buildComicUserPrompt(context: string, targetMessage: ChatMessage, frameCount: number): string {
  return `剧情上下文：
${context}

需要分镜数：
${frameCount}

当前目标楼层：
#${targetMessage.message_id} ${targetMessage.role}
${targetMessage.message.replace(IMAGE_BLOCK_PATTERN, '').trim()}

请输出当前目标楼层的 ${frameCount} 个连续分镜提示词块。
如果正文较长，把当前目标楼层按开头、中段、后段等剧情进度拆分；如果正文较短，也要用不同镜头和动作表达不同瞬间。
只使用剧情上下文维持角色、地点和情绪连续，不要把旧楼层当作当前画面主体。`;
}

function extractRawImageBlock(text: string): string {
  const match = text.match(IMAGE_BLOCK_PATTERN);
  if (match) return match[1].trim();
  return text.trim();
}

function extractRawImageBlocks(text: string, expectedCount: number): string[] {
  const matches = Array.from(text.matchAll(/<\s*nai[\s_-]*image\b[^>]*>([\s\S]*?)<\s*\/\s*nai[\s_-]*image\s*>/gi))
    .map(match => match[1]?.trim() ?? '')
    .filter(Boolean);

  if (matches.length > 0) return matches;
  if (expectedCount === 1) return [extractRawImageBlock(text)];
  return [];
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function buildComicHeaders(settings: NaiSettings): Record<string, string> {
  const key = settings.comicApiKey.trim();
  if (!key) throw new Error('请先填写漫画 API Key。');
  return {
    Authorization: `Bearer ${key}`,
  };
}

async function readComicError(response: Response, fallback: string): Promise<string> {
  const body = await response.text().catch(() => '');
  if (!body.trim()) return `${fallback}：HTTP ${response.status} ${response.statusText}`;

  try {
    const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
    return parsed.error?.message ?? parsed.message ?? body.slice(0, 500);
  } catch {
    return body.slice(0, 500);
  }
}

function readCompletionContent(data: CompletionResponse): string {
  return data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? '';
}

function stripCompletionMarker(content: string): string {
  return content.replaceAll(COMPLETION_MARKER, '').trim();
}
