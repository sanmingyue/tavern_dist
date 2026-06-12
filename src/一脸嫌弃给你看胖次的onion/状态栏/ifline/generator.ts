/**
 * IF线生成器
 * - 串行锁防止并发
 * - 用 generateRaw 调用（不走酒馆预设/世界书）
 * - 读取全部正文作为上下文
 */

import { buildIfLinePrompt } from './prompts';
import type { IfLineResult } from './types';
import type { Schema } from '../../schema';

// ━━━ 串行锁 ━━━━
let generationLock: Promise<void> = Promise.resolve();
let isGenerating = false;

export function getIsGenerating(): boolean {
  return isGenerating;
}

// ━━━━ 读取全部正文 ━━━
function getAllChatContent(): string {
  const lastId = getLastMessageId();
  if (lastId < 0) return '';

  const messages = getChatMessages(`0-${lastId}`);
  if (!messages || messages.length === 0) return '';

  const parts: string[] = [];
  for (const msg of messages) {
    const roleLabel = msg.role === 'user' ? '用户' : '角色';
    const text = msg.message?.trim();
    if (text) {
      parts.push(`[${roleLabel}] ${text}`);
    }
  }
  return parts.join('\n\n');
}

// ━━━ 解析输出 ━━━━
function parseIfLineOutput(output: string): { title: string; content: string } {
  const lines = output.trim().split('\n');

  // 第一行是标题，后面是正文
  let title = '';
  let content = '';

  if (lines.length > 0) {
    title = lines[0].trim();
    // 跳过空行
    let startIdx = 1;
    while (startIdx < lines.length && lines[startIdx].trim() === '') {
      startIdx++;
    }
    content = lines.slice(startIdx).join('\n').trim();
  }

  // 如果标题不以"如果"开头，尝试从内容中提取
  if (!title.startsWith('如果')) {
    // 整体作为正文，自动生成标题
    content = output.trim();
    title = '如果走了另一条路...';
  }

  return { title, content: content || '（生成失败）' };
}

// ━━━━ 主生成函数（串行） ━━━━
export async function generateIfLine(data: Schema): Promise<IfLineResult> {
  // 等待前一个生成完成
  const currentLock = generationLock;
  let resolve!: () => void;
  generationLock = new Promise(r => { resolve = r; });
  await currentLock;

  isGenerating = true;

  try {
    // 1. 构建提示词
    const prompt = buildIfLinePrompt(data);

    // 2. 读取正文作为额外上下文（截取最近部分避免过长）
    const chatContent = getAllChatContent();
    const recentChat = chatContent.length > 3000
      ? chatContent.slice(-3000)
      : chatContent;

    const fullPrompt = recentChat
      ? `${prompt}\n\n<最近剧情参考>\n${recentChat}\n</最近剧情参考>`
      : prompt;

    // 3. 调用 generateRaw
    console.info('[IF线] 开始生成');
    const output = await generateRaw({
      should_silence: true,
      ordered_prompts: [
        { role: 'user', content: fullPrompt },
      ],
    });

    // 4. 解析输出并替换酒馆宏（如 {{user}} → 实际用户名）
    const parsed = parseIfLineOutput(output);
    parsed.title = substitudeMacros(parsed.title);
    parsed.content = substitudeMacros(parsed.content);

    console.info('[IF线] 生成完成:', parsed.title);

    return {
      ...parsed,
      timestamp: Date.now(),
    };
  } finally {
    isGenerating = false;
    resolve();
  }
}
