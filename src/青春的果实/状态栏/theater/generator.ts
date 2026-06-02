/**
 * 角色内心剧场生成器
 *
 * - 串行锁防止并发
 * - 用 generateRaw 调用（不走酒馆预设/世界书）
 * - 用 getChatMessages 读取全部正文
 * - 内置阶段人设自动匹配
 */

import { getStageProfile } from './profiles';
import type { TheaterResult } from './types';

// ━━━━ 串行锁 ━━━━
let generationLock: Promise<void> = Promise.resolve();
let isGenerating = false;

export function getIsGenerating(): boolean {
  return isGenerating;
}

// ━━━━ 读取全部正文 ━━━━
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

// ━━━━ 构建提示词 ━━━━
function buildPrompt(
  characterName: string,
  profile: { personality: string; interpretation: string },
  relation: string,
  favor: number,
  chatContent: string,
): string {
  return `你是一个角色内心独白生成器。你需要以"${characterName}"的第一人称视角，根据她的人设和当前剧情，生成三段内心独白。

<角色人设>
${profile.personality}
</角色人设>

<角色写法指导>
${profile.interpretation}
</角色写法指导>

<当前状态>
好感度: ${favor}
关系: ${relation}
</当前状态>

<剧情正文>
${chatContent}
</剧情正文>

请以${characterName}的口吻和性格，生成以下三段内容。注意：
- 使用角色独特的说话方式和内心语气
- 如果角色会说方言，内心独白中可以夹杂方言（需附带翻译）
- 每段2-3句话，简短有力
- 不要用书面语，要像真正的内心独白

请严格按照以下格式输出：
<内心独白>
${characterName}真正想说但不会说出口的话，关于当前和用户的关系、最近发生的事。
</内心独白>
<戏外吐槽>
${characterName}突然意识到自己是个"角色"，对自己的人设和行为模式发出吐槽。幽默但不出戏。
</戏外吐槽>
<对你的看法>
${characterName}对用户最近的行为和选择的内心评价。可以是吐槽、感动、无语、开心等。
</对你的看法>`;
}

// ━━━━ 解析输出 ━━━━
function parseTheaterOutput(output: string): { innerVoice: string; fourthWall: string; userReaction: string } {
  function extract(tag: string): string {
    const regex = new RegExp(`<${tag}>\\s*([\\s\\S]*?)\\s*</${tag}>`, 'i');
    const match = output.match(regex);
    return match?.[1]?.trim() ?? '';
  }

  return {
    innerVoice: extract('内心独白') || extract('心里话') || '（生成失败）',
    fourthWall: extract('戏外吐槽') || extract('第四面墙') || '（生成失败）',
    userReaction: extract('对你的看法') || extract('对用户的反应') || '（生成失败）',
  };
}

// ━━━━ 主生成函数（串行） ━━━━
export async function generateTheater(
  characterName: string,
  relation: string,
  favor: number,
): Promise<TheaterResult> {
  // 等待前一个生成完成
  const currentLock = generationLock;
  let resolve!: () => void;
  generationLock = new Promise(r => { resolve = r; });
  await currentLock;

  isGenerating = true;

  try {
    // 1. 获取阶段人设
    const profile = getStageProfile(characterName, relation, favor);
    if (!profile) {
      throw new Error(`未找到 ${characterName} 的阶段人设`);
    }

    // 2. 读取全部正文（不过滤）
    const chatContent = getAllChatContent();
    if (!chatContent) {
      throw new Error('没有聊天记录');
    }

    // 3. 构建提示词
    const prompt = buildPrompt(characterName, profile, relation, favor, chatContent);

    // 4. 调用 generateRaw（不走酒馆预设/世界书，只用我们的内置提示词）
    console.info(`[内心剧场] 开始生成 ${characterName} 的内心独白`);
    const output = await generateRaw({
      should_silence: true,
      ordered_prompts: [
        { role: 'user', content: prompt },
      ],
    });

    // 5. 解析输出
    const parsed = parseTheaterOutput(output);

    console.info(`[内心剧场] ${characterName} 生成完成`);

    return {
      characterName,
      ...parsed,
      timestamp: Date.now(),
    };
  } finally {
    isGenerating = false;
    resolve();
  }
}
