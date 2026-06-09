import { parseString } from '@util/common';
import type { NaiSettings } from './store';

export type NaiImageRequest = {
  action: string;
  input: string;
  model: string;
  parameters: Record<string, unknown>;
};

export type NaiBlockConfig = z.infer<typeof BlockConfigSchema>;

export type NaiGeneratedImage = {
  bytes: Uint8Array;
  dataUrl: string;
  mimeType: string;
  filename: string;
  seed: number;
};

export type NaiTranslatedError = {
  title: string;
  message: string;
  solution: string;
  detail: string;
};

type ZipEntry = {
  filename: string;
  method: number;
  compressedSize: number;
  localHeaderOffset: number;
};

type NaiCharacterCaption = {
  char_caption: string;
  centers: Array<{ x: number; y: number }>;
};

export class NaiApiError extends Error {
  translated: NaiTranslatedError;

  constructor(translated: NaiTranslatedError) {
    super(translated.message);
    this.name = 'NaiApiError';
    this.translated = translated;
  }
}

export const IMAGE_BLOCK_PATTERN = /<nai-image\b[^>]*>([\s\S]*?)<\/nai-image>/i;

const CharacterPromptSchema = z
  .object({
    name: z.string().optional(),
    prompt: z.string().optional(),
    positive: z.string().optional(),
    caption: z.string().optional(),
    negative_prompt: z.string().optional(),
    uc: z.string().optional(),
    x: z.coerce.number().min(0).max(1).optional(),
    y: z.coerce.number().min(0).max(1).optional(),
    position: z.string().optional(),
  })
  .passthrough();

const BlockConfigSchema = z
  .object({
    prompt: z.string().optional(),
    positive: z.string().optional(),
    input: z.string().optional(),
    author_prompt: z.string().optional(),
    style_prompt: z.string().optional(),
    prefix_prompt: z.string().optional(),
    negative_prompt: z.string().optional(),
    uc: z.string().optional(),
    model: z.string().optional(),
    width: z.coerce.number().int().positive().optional(),
    height: z.coerce.number().int().positive().optional(),
    steps: z.coerce.number().positive().optional(),
    scale: z.coerce.number().positive().optional(),
    cfg_rescale: z.coerce.number().min(0).optional(),
    sampler: z.string().optional(),
    noise_schedule: z.string().optional(),
    seed: z.union([z.coerce.number().int().min(0).max(4294967295), z.literal(-1), z.literal('random')]).optional(),
    use_coords: z.coerce.boolean().optional(),
    characters: z.array(CharacterPromptSchema).optional(),
    character_prompts: z.array(CharacterPromptSchema).optional(),
  })
  .passthrough();

export function parseImageBlock(
  message: string,
): { raw: string; cleanedMessage: string; config: NaiBlockConfig } | null {
  const match = message.match(IMAGE_BLOCK_PATTERN);
  if (!match) return null;

  const raw = match[1].trim();
  let parsed: unknown;

  try {
    parsed = parseString(raw);
  } catch {
    parsed = { prompt: raw };
  }

  if (_.isString(parsed)) parsed = { prompt: parsed };

  const config = normalizeBlockConfig(BlockConfigSchema.parse(parsed));
  const prompt = config.prompt ?? config.positive ?? config.input;
  if (!prompt?.trim()) {
    throw new Error('<nai-image> 中没有 prompt、positive 或 input。');
  }

  return {
    raw,
    cleanedMessage: message.replace(IMAGE_BLOCK_PATTERN, '').trimEnd(),
    config: { ...config, prompt: prompt.trim() },
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 4294967295);
}

export function makeCorrelationId(): string {
  const source = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return _.range(6)
    .map(() => source[Math.floor(Math.random() * source.length)])
    .join('');
}

export function buildNaiPayload(settings: NaiSettings, block?: Partial<NaiBlockConfig>): NaiImageRequest {
  const scenePrompt = (
    block?.prompt ??
    block?.positive ??
    block?.input ??
    'best quality, very aesthetic, simple landscape'
  ).trim();
  const authorPrompt = (
    block?.author_prompt ??
    block?.style_prompt ??
    block?.prefix_prompt ??
    settings.authorPrompt
  ).trim();
  const prompt = joinPromptParts([authorPrompt, scenePrompt]);
  const negativePrompt = (block?.negative_prompt ?? block?.uc ?? settings.negativePrompt).trim();
  const characters = normalizeCharacterPrompts(block);
  const charCaptions = characters.map(character => toCharacterCaption(character, false));
  const negativeCharCaptions = characters
    .map(character => toCharacterCaption(character, true))
    .filter((caption): caption is NaiCharacterCaption => Boolean(caption));
  const useCoords = block?.use_coords ?? charCaptions.length > 0;
  const seed =
    block?.seed === undefined || block.seed === -1 || block.seed === 'random'
      ? settings.seedMode === 'fixed'
        ? settings.fixedSeed
        : randomSeed()
      : Number(block.seed);

  return {
    action: 'generate',
    input: prompt,
    model: block?.model ?? settings.model,
    parameters: {
      params_version: 3,
      width: block?.width ?? settings.width,
      height: block?.height ?? settings.height,
      scale: block?.scale ?? settings.scale,
      sampler: block?.sampler ?? settings.sampler,
      steps: block?.steps ?? settings.steps,
      n_samples: settings.nSamples,
      ucPreset: settings.ucPreset,
      qualityToggle: settings.qualityToggle,
      dynamic_thresholding: settings.dynamicThresholding,
      cfg_rescale: block?.cfg_rescale ?? settings.cfgRescale,
      noise_schedule: block?.noise_schedule ?? settings.noiseSchedule,
      sm: settings.sm,
      sm_dyn: settings.smDyn,
      seed,
      image_format: settings.imageFormat,
      negative_prompt: negativePrompt,
      characterPrompts: [],
      v4_prompt: {
        caption: {
          base_caption: prompt,
          char_captions: charCaptions,
        },
        use_coords: useCoords,
        use_order: true,
      },
      v4_negative_prompt: {
        caption: {
          base_caption: negativePrompt,
          char_captions: negativeCharCaptions,
        },
        legacy_uc: false,
      },
      deliberate_euler_ancestral_bug: settings.deliberateEulerAncestralBug,
      prefer_brownian: settings.preferBrownian,
    },
  };
}

function normalizeBlockConfig(config: NaiBlockConfig): NaiBlockConfig {
  const characters = config.characters ?? config.character_prompts;
  if (!characters) return config;
  return { ...config, characters };
}

function joinPromptParts(parts: string[]): string {
  return parts
    .map(part => part.trim())
    .filter(Boolean)
    .join(', ');
}

function normalizeCharacterPrompts(block?: Partial<NaiBlockConfig>): z.infer<typeof CharacterPromptSchema>[] {
  const characters = block?.characters ?? block?.character_prompts ?? [];
  return characters
    .map(character => ({
      ...character,
      prompt: (character.prompt ?? character.positive ?? character.caption ?? '').trim(),
      negative_prompt: (character.negative_prompt ?? character.uc ?? '').trim(),
    }))
    .filter(character => Boolean(character.prompt));
}

function toCharacterCaption(
  character: z.infer<typeof CharacterPromptSchema>,
  negative: boolean,
): NaiCharacterCaption | null {
  const charCaption = negative ? character.negative_prompt || character.uc || '' : character.prompt || '';
  if (!charCaption.trim()) return null;
  return {
    char_caption: charCaption.trim(),
    centers: [resolveCharacterCenter(character)],
  };
}

function resolveCharacterCenter(character: z.infer<typeof CharacterPromptSchema>): { x: number; y: number } {
  if (Number.isFinite(character.x) && Number.isFinite(character.y)) {
    return {
      x: _.clamp(Number(character.x), 0, 1),
      y: _.clamp(Number(character.y), 0, 1),
    };
  }

  const position = (character.position ?? '').trim().toLowerCase();
  const map: Record<string, { x: number; y: number }> = {
    left: { x: 0.25, y: 0.52 },
    center: { x: 0.5, y: 0.52 },
    middle: { x: 0.5, y: 0.52 },
    right: { x: 0.75, y: 0.52 },
    'upper left': { x: 0.25, y: 0.3 },
    'upper center': { x: 0.5, y: 0.3 },
    'upper right': { x: 0.75, y: 0.3 },
    'lower left': { x: 0.25, y: 0.72 },
    'lower center': { x: 0.5, y: 0.72 },
    'lower right': { x: 0.75, y: 0.72 },
    左: { x: 0.25, y: 0.52 },
    中: { x: 0.5, y: 0.52 },
    中间: { x: 0.5, y: 0.52 },
    右: { x: 0.75, y: 0.52 },
    左上: { x: 0.25, y: 0.3 },
    中上: { x: 0.5, y: 0.3 },
    右上: { x: 0.75, y: 0.3 },
    左下: { x: 0.25, y: 0.72 },
    中下: { x: 0.5, y: 0.72 },
    右下: { x: 0.75, y: 0.72 },
  };

  return map[position] ?? { x: 0.5, y: 0.52 };
}

export function getCostWarnings(settings: NaiSettings, block?: Partial<NaiBlockConfig>): string[] {
  const width = block?.width ?? settings.width;
  const height = block?.height ?? settings.height;
  const steps = block?.steps ?? settings.steps;
  const nSamples = settings.nSamples;
  const warnings: string[] = [];
  const maxFreePixels = 1024 * 1024;

  if (nSamples > 1) {
    warnings.push(`一次生成 ${nSamples} 张图，已超出会员单张免费范围。`);
  }
  if (steps > 28) {
    warnings.push(`步数为 ${steps}，超过会员免费范围的 28 步上限。`);
  }
  if (width * height > maxFreePixels) {
    warnings.push(`分辨率为 ${width}x${height}，超过约 1024x1024 的会员免费尺寸范围。`);
  }
  if (settings.sm || settings.smDyn) {
    warnings.push('已开启 SMEA 或动态 SMEA，可能消耗 Anlas。');
  }

  return warnings;
}

export async function requestNaiImage(settings: NaiSettings, payload: NaiImageRequest): Promise<NaiGeneratedImage> {
  const images = await requestNaiImages(settings, payload);
  return images[0];
}

export async function requestNaiImages(settings: NaiSettings, payload: NaiImageRequest): Promise<NaiGeneratedImage[]> {
  if (!settings.token.trim()) {
    throw new NaiApiError({
      title: '缺少 API Token',
      message: '还没有填写 NovelAI Persistent API Token。',
      solution: '在“接口”页填写 token 后再生成。不要把 token 写进世界书或角色卡。',
      detail: '',
    });
  }

  const response = await fetch(settings.endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.token.trim()}`,
      'Content-Type': 'application/json',
      'x-correlation-id': makeCorrelationId(),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new NaiApiError(await translateResponseError(response));
  }

  const zip = new Uint8Array(await response.arrayBuffer());
  const images = await extractImages(zip);
  const fallbackSeed = Number(payload.parameters.seed);

  return Promise.all(
    images.map(async (image, index) => ({
      bytes: image.bytes,
      dataUrl: await blobToDataUrl(new Blob([image.bytes], { type: image.mimeType })),
      mimeType: image.mimeType,
      filename: image.filename,
      seed: readSeedFromFilename(image.filename, Number.isFinite(fallbackSeed) ? fallbackSeed + index : fallbackSeed),
    })),
  );
}

export function translateUnknownError(error: unknown): NaiTranslatedError {
  if (error instanceof NaiApiError) return error.translated;
  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) {
    return {
      title: '网络请求失败',
      message: '浏览器没有成功连接到 NovelAI。',
      solution: '检查网络代理、浏览器是否允许访问 NovelAI；如果酒馆是 HTTPS 页面，确认没有被混合内容或扩展拦截。',
      detail: error.message,
    };
  }
  if (error instanceof Error) {
    return {
      title: '脚本执行失败',
      message: error.message,
      solution: '查看提示词块格式和面板参数；如果是浏览器兼容问题，请更新浏览器或关闭旧内核 WebView。',
      detail: error.stack ?? error.message,
    };
  }
  return {
    title: '未知错误',
    message: String(error),
    solution: '请复制这条日志给脚本作者排查。',
    detail: String(error),
  };
}

export async function translateResponseError(response: Response): Promise<NaiTranslatedError> {
  const body = await response.text().catch(() => '');
  const parsed = parseErrorBody(body);
  const officialMessage = parsed.message || response.statusText || body;
  const detail = compactDetail({
    status: response.status,
    statusText: response.statusText,
    officialMessage,
    details: parsed.details,
  });

  switch (response.status) {
    case 400:
      return {
        title: '请求参数不合法',
        message: officialMessage || 'NovelAI 拒绝了这次生图参数。',
        solution:
          '检查模型名、尺寸、步数、采样器和提示词格式。尺寸建议使用 64 的倍数；V4/V4.5 建议保留 v4_prompt 结构；correlation id 必须是 6 位字母数字。',
        detail,
      };
    case 401:
      return {
        title: '认证失败',
        message: officialMessage || 'NovelAI 没有接受当前 API Token。',
        solution: '重新生成 Persistent API Token，确认复制完整，并删除多余空格。不要使用邮箱密码或网页登录 cookie。',
        detail,
      };
    case 402:
    case 403:
      return {
        title: '订阅或额度不足',
        message: officialMessage || '当前账号没有权限完成这次请求。',
        solution: '检查订阅状态、Anlas 余额，以及是否启用了需要扣点的参数。降低分辨率、步数或关闭参考图后重试。',
        detail,
      };
    case 404:
      return {
        title: '接口地址错误',
        message: officialMessage || '没有找到 NovelAI 接口。',
        solution:
          '确认生图地址为 https://image.novelai.net/ai/generate-image，订阅测试地址为 https://api.novelai.net/user/subscription。',
        detail,
      };
    case 429:
      return {
        title: '请求过于频繁',
        message: officialMessage || 'NovelAI 暂时限制了请求频率。',
        solution: '等待一段时间再重试。建议关闭自动生图或降低连续重试频率。',
        detail,
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        title: 'NovelAI 服务异常',
        message: officialMessage || 'NovelAI 服务器暂时没有完成请求。',
        solution: '稍后重试；如果连续失败，降低参数复杂度并记录 correlation id 给 NovelAI 支持。',
        detail,
      };
    default:
      return {
        title: `HTTP ${response.status}`,
        message: officialMessage || 'NovelAI 返回了未分类错误。',
        solution: '先按参数错误和认证错误排查；如果仍失败，请保留日志中的状态码和官方消息。',
        detail,
      };
  }
}

function parseErrorBody(body: string): { message: string; details: unknown } {
  if (!body.trim()) return { message: '', details: undefined };
  try {
    const parsed = JSON.parse(body) as { message?: string; error?: string; details?: unknown };
    return {
      message: parsed.message ?? parsed.error ?? body.slice(0, 500),
      details: parsed.details,
    };
  } catch {
    return { message: body.slice(0, 500), details: undefined };
  }
}

function compactDetail(data: Record<string, unknown>): string {
  return JSON.stringify(data, (_key, value) => (value === undefined || value === '' ? undefined : value), 2);
}

function findEndOfCentralDirectory(zip: Uint8Array): number {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  for (let offset = zip.byteLength - 22; offset >= 0; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) return offset;
  }
  throw new Error('NAI 返回内容不是可识别的 zip。');
}

function listZipEntries(zip: Uint8Array): ZipEntry[] {
  const decoder = new TextDecoder();
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const eocdOffset = findEndOfCentralDirectory(zip);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  let offset = view.getUint32(eocdOffset + 16, true);
  const entries: ZipEntry[] = [];

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(offset, true) !== 0x02014b50) throw new Error('zip 中央目录损坏。');

    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const filenameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const filename = decoder.decode(zip.slice(offset + 46, offset + 46 + filenameLength));

    entries.push({ filename, method, compressedSize, localHeaderOffset });
    offset += 46 + filenameLength + extraLength + commentLength;
  }

  return entries;
}

async function extractImages(
  zip: Uint8Array,
): Promise<Array<{ bytes: Uint8Array; mimeType: string; filename: string }>> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const entries = listZipEntries(zip).filter(
    item => /\.(png|webp)$/i.test(item.filename) && !item.filename.endsWith('/'),
  );
  if (entries.length === 0) throw new Error('NAI 返回的 zip 中没有 png/webp 图片。');

  return Promise.all(
    entries.map(async entry => {
      const localOffset = entry.localHeaderOffset;
      if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error('zip 本地文件头损坏。');

      const filenameLength = view.getUint16(localOffset + 26, true);
      const extraLength = view.getUint16(localOffset + 28, true);
      const dataStart = localOffset + 30 + filenameLength + extraLength;
      const compressedBytes = zip.slice(dataStart, dataStart + entry.compressedSize);
      const bytes = entry.method === 0 ? compressedBytes : await inflateDeflateRaw(compressedBytes, entry.method);
      const mimeType = entry.filename.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/png';
      return { bytes, mimeType, filename: entry.filename };
    }),
  );
}

async function inflateDeflateRaw(bytes: Uint8Array, method: number): Promise<Uint8Array> {
  if (method !== 8) throw new Error(`暂不支持 zip 压缩方式 ${method}。`);

  const DecompressionStreamCtor = (window as unknown as { DecompressionStream?: typeof DecompressionStream })
    .DecompressionStream;
  if (!DecompressionStreamCtor) {
    throw new Error('当前浏览器不支持 DecompressionStream，无法解压 NAI 返回的 zip。');
  }

  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStreamCtor('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('图片转 data URL 失败。'));
    reader.readAsDataURL(blob);
  });
}

export function downloadImage(image: NaiGeneratedImage, fileName: string): void {
  const blob = new Blob([image.bytes], { type: image.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function renderDownloadName(template: string, data: { messageId: number; seed: number; ext: string }): string {
  return template
    .replaceAll('{{messageId}}', String(data.messageId))
    .replaceAll('{{seed}}', String(data.seed))
    .replaceAll('{{ext}}', data.ext)
    .replace(/[\\/:*?"<>|]/g, '_');
}

function readSeedFromFilename(filename: string, fallbackSeed: number): number {
  const match = filename.match(/(?:seed[_-]?|[_-])(\d{1,10})(?=\.(?:png|webp)$)/i);
  if (!match) return fallbackSeed;

  const seed = Number(match[1]);
  return Number.isInteger(seed) && seed >= 0 ? seed : fallbackSeed;
}
