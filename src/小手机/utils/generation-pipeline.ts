/**
 * 小手机 AI 生成管线
 *
 * 使用 generateRaw() + custom_api + ordered_prompts 独立调用 AI，
 * 完全不影响用户的酒馆正文预设。
 *
 * v0.1.0: 全面改用 XML 标签输出，用正则解析，彻底避免 MVU 变量标签污染导致解析失败。
 */

import { useApiStore } from '../stores/api-store';
import { usePresetStore } from '../stores/preset-store';

export interface GenerationResult {
  raw: string;
  /** XML 模式下为清理后的原始文本字符串，由各 APP 组件自行调用 parseXmlResult 等解析 */
  parsed: string;
  thinking: string;
  success: boolean;
  error?: string;
}

/* ─── 思维链剥离 ─── */

function extractThinking(text: string): { content: string; thinking: string } {
  const thinkingMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/gi);
  const thinking = thinkingMatch
    ? thinkingMatch.map(m => m.replace(/<\/?thinking>/gi, '').trim()).join('\n')
    : '';
  const content = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
  return { content, thinking };
}

/**
 * 清理 AI 输出中可能被世界书 MVU 变量框架污染的标签
 */
function stripMvuTags(text: string): string {
  return text
    .replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/gi, '')
    .replace(/<Analysis>[\s\S]*?<\/Analysis>/gi, '')
    .replace(/<JSONPatch>[\s\S]*?<\/JSONPatch>/gi, '')
    .replace(/<status_current_variable>[\s\S]*?<\/status_current_variable>/gi, '')
    .replace(/<additional_settings>[\s\S]*?<\/additional_settings>/gi, '')
    .replace(/<interactive_input>[\s\S]*?<\/interactive_input>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ═══════════════════════════════════════════
   XML 解析工具（供各 APP 组件导入使用）
   ═══════════════════════════════════════════ */

/**
 * 从文本中提取指定标签的内容（单个，首次匹配）
 * @example extractXmlTag('<name>青澜老街坊</name>', 'name') => '青澜老街坊'
 */
export function extractXmlTag(text: string, tag: string): string | null {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

/**
 * 从文本中提取指定标签的数值
 */
export function extractXmlNumber(text: string, tag: string, fallback: number): number {
  const raw = extractXmlTag(text, tag);
  if (raw === null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * 从文本中提取所有匹配的同名块的内部内容
 * @example extractXmlBlocks(text, 'restaurant') => ['内容1', '内容2', ...]
 */
export function extractXmlBlocks(text: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const blocks: string[] = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    blocks.push(m[1]);
  }
  return blocks;
}

/**
 * 从一个 XML 块中提取所有直接子标签为扁平对象
 * @example parseXmlBlock('<name>A</name><price>10</price>') => { name: 'A', price: '10' }
 */
export function parseXmlBlock(block: string): Record<string, string> {
  const result: Record<string, string> = {};
  const tagRe = /<(\w+)>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = tagRe.exec(block)) !== null) {
    // 只取第一个出现的值（避免嵌套子项覆盖）
    if (!(m[1] in result)) {
      result[m[1]] = m[2].trim();
    }
  }
  return result;
}

/**
 * 从块内提取嵌套子项列表
 * @example extractXmlItems(block, 'item') => [{ name: '...', price: '...' }, ...]
 */
export function extractXmlItems(block: string, itemTag: string): Record<string, string>[] {
  const items = extractXmlBlocks(block, itemTag);
  return items.map(parseXmlBlock);
}

/**
 * 通用 XML 结果解析：将 AI 输出解析为结构化对象数组
 *
 * @param text AI 输出文本（已剥离 thinking 和 MVU 标签）
 * @param rootTag 根标签名（如 'restaurant', 'movie', 'video' 等）
 * @param subItemTags 需要解析为子列表的标签映射，例如 { items: 'item', comments: 'comment' }
 * @returns 解析后的对象数组
 *
 * @example
 * // AI 输出:
 * // <restaurant><name>青澜</name><items><item><name>生煎</name><price>15</price></item></items></restaurant>
 * parseXmlResult(text, 'restaurant', { items: 'item' })
 * // => [{ name: '青澜', items: [{ name: '生煎', price: '15' }] }]
 */
export function parseXmlResult(
  text: string,
  rootTag: string,
  subItemTags?: Record<string, string>,
): Record<string, any>[] {
  const blocks = extractXmlBlocks(text, rootTag);
  if (blocks.length === 0) return [];

  return blocks.map(block => {
    const obj: Record<string, any> = {};

    // 先处理嵌套子项（在解析扁平标签之前，避免被覆盖）
    if (subItemTags) {
      for (const [containerTag, itemTag] of Object.entries(subItemTags)) {
        const containerContent = extractXmlTag(block, containerTag);
        if (containerContent) {
          obj[containerTag] = extractXmlItems(containerContent, itemTag);
        } else {
          // 容器标签不存在时，直接在块内找子项
          const items = extractXmlItems(block, itemTag);
          if (items.length > 0) {
            obj[containerTag] = items;
          }
        }
      }
    }

    // 解析扁平标签
    const flat = parseXmlBlock(block);
    for (const [k, v] of Object.entries(flat)) {
      // 不覆盖已解析的子列表容器
      if (!(k in obj)) {
        obj[k] = v;
      }
    }

    return obj;
  });
}

/* ═══════════════════════════════════════════
   生成函数
   ═══════════════════════════════════════════ */

/**
 * 为指定 APP 生成内容
 *
 * @param appId APP ID
 * @param userInput 用户输入
 * @param extraContext 额外上下文
 */
export async function generateForApp(
  appId: string,
  userInput: string,
  extraContext?: string,
): Promise<GenerationResult> {
  const apiStore = useApiStore();
  const presetStore = usePresetStore();

  if (!apiStore.isConfigured) {
    return {
      raw: '',
      parsed: '',
      thinking: '',
      success: false,
      error: '未配置 API，请前往设置配置',
    };
  }

  // 1. 从记忆系统获取额外上下文
  let fullExtraContext = extraContext || '';
  try {
    const { buildExtraContext } = await import('./memory-system');
    const memoryContext = await buildExtraContext(appId, [userInput, extraContext].filter(Boolean).join('\n'));
    if (memoryContext) {
      fullExtraContext = fullExtraContext
        ? `${fullExtraContext}\n\n${memoryContext}`
        : memoryContext;
    }
  } catch {
    // 记忆系统不可用时静默降级
  }

  // 2. 构建 ordered_prompts
  const orderedPrompts = presetStore.buildOrderedPrompts(appId, fullExtraContext);

  // 3. 获取最大聊天历史
  const maxChatHistory = presetStore.getMaxChatHistory(appId);

  try {
    // 4. 调用 generateRaw
    const result = await generateRaw({
      user_input: userInput,
      custom_api: apiStore.config!,
      ordered_prompts: orderedPrompts,
      max_chat_history: maxChatHistory,
      should_silence: true,
    });

    // 5. 剥离 <thinking>
    const { content: rawContent, thinking } = extractThinking(result);

    // 6. 清理 MVU 污染标签
    let content = stripMvuTags(rawContent);

    // 6.5. 清理可能的 Markdown 代码块包裹（AI 有时会用 ```xml ... ``` 包裹输出）
    content = content.replace(/^```(?:xml|html|text)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    // 7. 调试日志
    console.info('[小手机] AI生成结果:', {
      appId,
      raw: result.slice(0, 200),
      contentLen: content.length,
      hasXmlTags: /<\w+>/.test(content),
    });

    if (!content) {
      return { raw: result, parsed: '', thinking, success: false, error: 'AI 返回内容为空' };
    }

    return { raw: result, parsed: content, thinking, success: true };
  } catch (e) {
    return {
      raw: '',
      parsed: '',
      thinking: '',
      success: false,
      error: e instanceof Error ? e.message : '生成失败',
    };
  }
}

/**
 * 为指定 APP 流式生成内容
 */
export async function generateStreamForApp(
  appId: string,
  userInput: string,
  onChunk: (text: string) => void,
  extraContext?: string,
): Promise<GenerationResult> {
  if (appId === 'messages') {
    return generateForApp(appId, userInput, extraContext);
  }

  const apiStore = useApiStore();
  const presetStore = usePresetStore();

  if (!apiStore.isConfigured) {
    return {
      raw: '',
      parsed: '',
      thinking: '',
      success: false,
      error: '未配置 API，请前往设置配置',
    };
  }

  let fullExtraContext = extraContext || '';
  try {
    const { buildExtraContext } = await import('./memory-system');
    const memoryContext = await buildExtraContext(appId, [userInput, extraContext].filter(Boolean).join('\n'));
    if (memoryContext) {
      fullExtraContext = fullExtraContext
        ? `${fullExtraContext}\n\n${memoryContext}`
        : memoryContext;
    }
  } catch {
    // 记忆系统不可用时静默降级
  }

  const orderedPrompts = presetStore.buildOrderedPrompts(appId, fullExtraContext);
  const maxChatHistory = presetStore.getMaxChatHistory(appId);

  let fullResponse = '';

  try {
    const handler = eventOn(iframe_events.STREAM_TOKEN_RECEIVED_INCREMENTALLY, (token: string) => {
      fullResponse += token;
      onChunk(token);
    });

    await generateRaw({
      user_input: userInput,
      custom_api: apiStore.config!,
      ordered_prompts: orderedPrompts,
      max_chat_history: maxChatHistory,
      should_stream: true,
      should_silence: true,
    });

    handler.stop();

    const { content, thinking } = extractThinking(fullResponse);
    const parsed = stripMvuTags(content);

    return { raw: fullResponse, parsed, thinking, success: true };
  } catch (e) {
    return {
      raw: '',
      parsed: '',
      thinking: '',
      success: false,
      error: e instanceof Error ? e.message : '生成失败',
    };
  }
}
