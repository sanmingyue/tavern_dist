/**
 * 语义向量嵌入模块
 *
 * 默认使用 SiliconFlow Embedding API（OpenAI 兼容），可在设置中自定义节点地址。
 * 大总结后批量生成事件向量，注入时语义召回兜底。
 */

export interface EmbeddingSettings {
  enabled: boolean;
  apiUrl: string;
  apiKey: string;
  model: string;
  dimensions: number;
  similarityThreshold: number;  // 0-1，仅召回相似度超过此阈值的事件
}

export const DEFAULT_EMBEDDING_SETTINGS: EmbeddingSettings = {
  enabled: false,
  apiUrl: 'https://api.siliconflow.cn/v1/embeddings',
  apiKey: '',
  model: 'BAAI/bge-m3',
  dimensions: 768,
  similarityThreshold: 0.55,
};

/** 仅 Qwen3 系列支持自定义维度 */
function isQwenModel(model: string): boolean {
  return model.startsWith('Qwen/');
}

/** 单条文本 → embedding 向量 */
export async function getEmbedding(text: string, settings: EmbeddingSettings): Promise<number[]> {
  const body: Record<string, unknown> = {
    model: settings.model,
    input: text,
    encoding_format: 'float',
  };
  if (isQwenModel(settings.model)) body.dimensions = settings.dimensions;

  const resp = await fetch(settings.apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`Embedding API ${resp.status}: ${err}`);
  }
  const json = await resp.json();
  return json.data[0].embedding;
}

/** 批量文本 → embedding 向量数组（每批最多32条） */
export async function getBatchEmbeddings(
  texts: string[],
  settings: EmbeddingSettings,
  onProgress?: (done: number, total: number) => void,
): Promise<number[][]> {
  const results: number[][] = new Array(texts.length);
  for (let i = 0; i < texts.length; i += 32) {
    const batch = texts.slice(i, i + 32);
    const body: Record<string, unknown> = {
      model: settings.model,
      input: batch,
      encoding_format: 'float',
    };
    if (isQwenModel(settings.model)) body.dimensions = settings.dimensions;

    const resp = await fetch(settings.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      throw new Error(`Embedding API ${resp.status}: ${err}`);
    }
    const json = await resp.json();
    for (const item of json.data) {
      results[i + item.index] = item.embedding;
    }
    onProgress?.(Math.min(i + 32, texts.length), texts.length);
  }
  return results;
}

/** 余弦相似度：a·b / (|a|·|b|)，返回 0-1 */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom > 0 ? dot / denom : 0;
}

/**
 * 字符级二元组 Jaccard 相似度（用于混合检索中的词汇匹配分量）
 * 对中文文本有效：将文本切成相邻二字组，计算交集/并集
 * 返回 0-1 之间的值
 */
export function charBigramSimilarity(a: string, b: string): number {
  const getBigrams = (s: string): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) {
      set.add(s.slice(i, i + 2));
    }
    return set;
  };
  const aSet = getBigrams(a);
  const bSet = getBigrams(b);
  if (aSet.size === 0 && bSet.size === 0) return 0;
  let intersection = 0;
  for (const bg of bSet) {
    if (aSet.has(bg)) intersection++;
  }
  const union = aSet.size + bSet.size - intersection;
  return union > 0 ? intersection / union : 0;
}

/**
 * 为角色核心记忆构建上下文注释文本（用于 Contextual Retrieval）
 * 在生成 embedding 时，用带上下文的文本替代原始文本，
 * 提高语义检索命中率（参考 Anthropic 2024 Contextual Retrieval）
 */
export function buildCharacterMemoryContext(
  characterName: string,
  aliases: string[],
  keywords: string[],
  memoryText: string,
): string {
  const parts: string[] = [`[角色: ${characterName}]`];
  if (aliases.length > 0) parts.push(`[别名: ${aliases.join(', ')}]`);
  if (keywords.length > 0) parts.push(`[关键词: ${keywords.join(', ')}]`);
  parts.push(`核心记忆: ${memoryText}`);
  return parts.join(' ');
}

/**
 * 为大总结生成的所有时间线事件批量生成 embedding 向量。
 * 仅处理尚无 embedding 的事件，向量直接写回 event 对象。
 * 调用方负责在完成后 persist。
 */
export async function embedTimelineEvents(
  events: Array<{ event: string; detail?: string; embedding?: number[] }>,
  apiUrl: string,
  apiKey: string,
  model: string,
  dimensions: number,
  onProgress?: (done: number, total: number) => void,
): Promise<number> {
  // 筛选尚无向量的新事件
  const toEmbed: { idx: number; text: string }[] = [];
  let alreadyEmb = 0;
  let noEvent = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (!e.event) { noEvent++; continue; }
    if (e.embedding) { alreadyEmb++; continue; }
    const text = e.event + (e.detail ? '\n' + e.detail : '');
    if (text.trim()) toEmbed.push({ idx: i, text });
  }
  console.info(
    `[智脑-Embedding] 时间线 ${events.length} 个事件 → ` +
    `已有向量:${alreadyEmb} 待生成:${toEmbed.length} 空事件:${noEvent}`,
  );
  if (toEmbed.length === 0) {
    console.info('[智脑-Embedding] 无需生成新向量，跳过');
    return 0;
  }

  const settings: EmbeddingSettings = {
    enabled: true,
    apiUrl,
    apiKey,
    model,
    dimensions,
    similarityThreshold: 0,
  };

  let embedded = 0;
  try {
    const texts = toEmbed.map(t => t.text);
    console.info(`[智脑-Embedding] 开始批量生成 ${texts.length} 条向量 (url=${apiUrl}, model=${model}, dims=${dimensions}, batches=${Math.ceil(texts.length / 32)})`);
    const t0 = Date.now();
    const vectors = await getBatchEmbeddings(texts, settings, (done, total) => {
      console.info(`[智脑-Embedding] 进度: ${done}/${total}`);
      onProgress?.(done, total);
    });
    for (let j = 0; j < toEmbed.length; j++) {
      events[toEmbed[j].idx].embedding = vectors[j];
      embedded++;
    }
    const elapsed = Date.now() - t0;
    console.info(`[智脑-Embedding] ✅ 完成: ${embedded} 条向量 (${elapsed}ms, 平均${(elapsed / embedded).toFixed(0)}ms/条)`);
  } catch (err) {
    console.warn(`[智脑-Embedding] 向量生成失败（非致命）: ${(err as Error).message}`);
  }
  return embedded;
}

/**
 * 批量给角色核心记忆生成语义向量
 * 遍历所有角色的所有版本，给尚无向量的核心记忆生成 embedding
 */
export async function embedCharacterMemories(
  characterMemories: Array<{
    characterName: string;
    coreMemories: Array<{ text: string; embedding?: number[] }>;
  }>,
  apiUrl: string,
  apiKey: string,
  model: string,
  dimensions: number,
): Promise<number> {
  // 收集所有待生成向量的核心记忆
  const toEmbed: Array<{ charIdx: number; memIdx: number; text: string; embedText: string; isOldString: boolean }> = [];
  for (let ci = 0; ci < characterMemories.length; ci++) {
    const mem = characterMemories[ci];
    const cores = mem.coreMemories || [];
    for (let mi = 0; mi < cores.length; mi++) {
      const c = cores[mi];
      // 兼容旧格式 string[] 和新格式 CoreMemoryItem[]
      const text = typeof c === 'string' ? c : (c?.text || '');
      if (!text || c.embedding) continue;
      // 上下文注释：用带角色信息的文本生成向量（Contextual Retrieval）
      const embedText = buildCharacterMemoryContext(
        mem.characterName, mem.aliases || [], mem.keywords || [], text,
      );
      toEmbed.push({ charIdx: ci, memIdx: mi, text, embedText, isOldString: typeof c === 'string' });
    }
  }

  const totalCores = characterMemories.reduce((s, m) => s + (m.coreMemories?.length || 0), 0);
  console.info(
    `[智脑-Embedding] 角色记忆 ${characterMemories.length} 角色, ` +
    `核心记忆共 ${totalCores} 条 → 已有向量:${totalCores - toEmbed.length} 待生成:${toEmbed.length}`,
  );

  if (toEmbed.length === 0) {
    console.info('[智脑-Embedding] 核心记忆无需生成新向量，跳过');
    return 0;
  }

  const settings: EmbeddingSettings = {
    enabled: true,
    apiUrl,
    apiKey,
    model,
    dimensions,
    similarityThreshold: 0,
  };

  let embedded = 0;
  try {
    const texts = toEmbed.map(t => t.embedText);
    console.info(`[智脑-Embedding] 开始批量生成 ${texts.length} 条核心记忆向量（含上下文注释）`);
    const t0 = Date.now();
    const vectors = await getBatchEmbeddings(texts, settings, (done, total) => {
      console.info(`[智脑-Embedding] 核心记忆进度: ${done}/${total}`);
    });
    for (let j = 0; j < toEmbed.length; j++) {
      const item = toEmbed[j];
      const cores = characterMemories[item.charIdx].coreMemories;
      if (item.isOldString) {
        // 旧格式 string[] → 原地升级为 CoreMemoryItem
        cores[item.memIdx] = { text: item.text, embedding: vectors[j] };
      } else {
        (cores[item.memIdx] as any).embedding = vectors[j];
      }
      embedded++;
    }
    const elapsed = Date.now() - t0;
    console.info(`[智脑-Embedding] ✅ 核心记忆向量完成: ${embedded} 条 (${elapsed}ms)`);
  } catch (err) {
    console.warn(`[智脑-Embedding] 核心记忆向量生成失败（非致命）: ${(err as Error).message}`);
  }
  return embedded;
}
