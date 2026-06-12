/**
 * 小手机记忆分层系统
 *
 * 四层记忆架构：
 * - 第一层：原文保留（闪讯聊天、交易聊天、短信）
 * - 第二层：总结压缩（话圈帖子、视频评论区互动）
 * - 第三层：结构化记录（外卖/购物订单、电影购票）
 * - 第四层：核心记忆（关系变化、重要承诺、秘密）
 */

import { getLocalDB, type MemoryChunk, type MemoryCore } from './local-db';
import { getAppFormalName } from './app-names';
import { cosineSimilarity, createLocalEmbedding, truncateByChars } from './vector-memory';
import { isVectorMemoryEnabled } from './memory-settings';

/* ─── 总结触发阈值 ─── */
const FORUM_SUMMARY_THRESHOLD = 5; // 话圈帖子超过 5 条评论时触发总结
const CHAT_MEMORY_CHECK_INTERVAL = 10; // 每 10 条聊天消息检查核心记忆
const TRADE_COMPLETE_TRIGGER = true; // 交易完成时提取核心记忆
const APP_CONTEXT_TOP_K = 8;
const APP_CONTEXT_BUDGET = 1800;
const INJECT_CONTEXT_TOP_K = 6;
const INJECT_CONTEXT_BUDGET = 1200;
const MIN_RETRIEVAL_SCORE = 0.03;

/* ─── 第一层：原文保留 ─── */

/**
 * 保存闪讯聊天记录（完整保留）
 */
export async function saveChatMessage(
  contactName: string,
  message: { id: string; from: string; to: string; content: string; timestamp: number; type?: string; read?: boolean },
): Promise<void> {
  const db = await getLocalDB();
  await db.appendChatMessage(contactName, {
    id: message.id,
    from: message.from,
    to: message.to,
    content: message.content,
    timestamp: message.timestamp,
    type: (message.type as any) || 'text',
    read: message.read ?? true,
  });

  // 记录事件
  await db.addEvent({
    appId: 'messages',
    type: 'chat_message',
    actor: message.from,
    summary: `${message.from} 给 ${message.to} 发送了消息`,
    data: { contactName, messageId: message.id, content: message.content },
    timestamp: message.timestamp,
  });

  // 检查是否需要提取核心记忆
  const record = await db.getChatRecord(contactName);
  if (record && record.messages.length % CHAT_MEMORY_CHECK_INTERVAL === 0) {
    extractCoreMemoryFromChat(contactName, record.messages.slice(-CHAT_MEMORY_CHECK_INTERVAL)).catch(e =>
      console.warn('[记忆系统] 核心记忆提取失败:', e),
    );
  }
}

/**
 * 保存短信记录（完整保留）
 */
export async function saveSmsMessage(
  from: string,
  content: string,
  type: 'notification' | 'personal' | 'marketing' = 'personal',
): Promise<void> {
  const db = await getLocalDB();
  await db.addEvent({
    appId: 'sms',
    type: `sms_${type}`,
    actor: from,
    summary: `收到来自「${from}」的短信`,
    data: { from, content, smsType: type },
    timestamp: Date.now(),
  });
}

/**
 * 保存交易聊天记录（完整保留）
 */
export async function saveTradeChat(
  tradeId: string,
  counterpart: string,
  chatLine: string,
  appId: string = 'secondhand',
): Promise<void> {
  const db = await getLocalDB();
  const existing = await db.getTradeRecord(tradeId);
  if (existing) {
    existing.chatLog.push(chatLine);
    await db.saveTradeRecord(existing);
  } else {
    await db.saveTradeRecord({
      id: tradeId,
      type: 'buy',
      counterpart,
      chatLog: [chatLine],
      item: '',
      price: 0,
      status: 'chatting',
      timestamp: Date.now(),
    });
  }

  await db.addEvent({
    appId,
    type: 'trade_chat',
    actor: counterpart,
    summary: `与「${counterpart}」进行交易聊天`,
    data: { tradeId, chatLine },
    timestamp: Date.now(),
  });
}

/* ─── 第二层：总结压缩 ─── */

/**
 * 保存话圈帖子并检查是否需要总结
 */
export async function saveForumPost(post: {
  id: string;
  title: string;
  author: string;
  content: string;
  likes: number;
  comments: Array<{ id: string; author: string; content: string; likes: number; timestamp: number }>;
  category: string;
}): Promise<void> {
  const db = await getLocalDB();
  await db.addForumPost({
    ...post,
    timestamp: Date.now(),
  });

  await db.addEvent({
    appId: 'forum',
    type: 'forum_post',
    actor: post.author,
    summary: `「${post.author}」在话圈发了帖子：${post.title}`,
    data: { postId: post.id, title: post.title },
    timestamp: Date.now(),
  });

  // 评论超过阈值时触发总结
  if (post.comments.length >= FORUM_SUMMARY_THRESHOLD) {
    summarizeForumPost(post).catch(e =>
      console.warn('[记忆系统] 话圈总结失败:', e),
    );
  }
}

/**
 * 用 AI 总结话圈帖子评论区
 */
async function summarizeForumPost(post: {
  title: string;
  author: string;
  content: string;
  comments: Array<{ author: string; content: string }>;
}): Promise<void> {
  const commentsText = post.comments.map(c => `${c.author}: ${c.content}`).join('\n');
  const { generateForApp } = await import('./generation-pipeline');
  const result = await generateForApp(
    'summary',
    `帖子「${post.title}」(作者: ${post.author})\n正文: ${post.content}\n评论区:\n${commentsText}`,
    '请总结这个帖子及评论区的核心信息，用一两句话概括讨论的要点和参与者的态度。',
  );

  if (result.success) {
    const db = await getLocalDB();
    const summary = typeof result.parsed === 'string' ? result.parsed : result.raw;
    await db.addForumSummary(summary);
    console.info('[记忆系统] 话圈帖子已总结');
  }
}

/**
 * 保存视频/音乐评论互动并总结
 */
export async function saveMediaInteraction(
  appId: string,
  topic: string,
  interactions: Array<{ author: string; content: string }>,
): Promise<void> {
  const db = await getLocalDB();
  const summary = `在「${getAppFormalName(appId)}」的「${topic}」话题下，${interactions.map(i => i.author).join('、')}进行了讨论`;

  await db.addEvent({
    appId,
    type: 'media_interaction',
    actor: interactions[0]?.author || 'unknown',
    summary,
    data: { topic, interactions },
    timestamp: Date.now(),
  });
}

/* ─── 第三层：结构化记录 ─── */

/**
 * 保存订单记录
 */
export async function saveOrderRecord(order: {
  appId: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  status: string;
}): Promise<void> {
  const db = await getLocalDB();
  const record = {
    id: `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    appId: order.appId,
    items: order.items,
    status: order.status,
    timestamp: Date.now(),
  };
  await db.saveOrder(record);

  const totalPrice = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemNames = order.items.map(i => i.name).join('、');

  await db.addEvent({
    appId: order.appId,
    type: 'order',
    actor: 'user',
    summary: `在「${getAppFormalName(order.appId)}」下单了${itemNames}，共 ${totalPrice} 元`,
    data: record,
    timestamp: Date.now(),
  });
}

/**
 * 完成交易并提取核心记忆
 */
export async function completeTradeRecord(
  tradeId: string,
  item: string,
  price: number,
  type: 'buy' | 'sell',
): Promise<void> {
  const db = await getLocalDB();
  const existing = await db.getTradeRecord(tradeId);
  if (existing) {
    existing.item = item;
    existing.price = price;
    existing.type = type;
    existing.status = 'completed';
    await db.saveTradeRecord(existing);

    // 交易完成时提取核心记忆
    if (TRADE_COMPLETE_TRIGGER) {
      const action = type === 'buy' ? '买了' : '卖出了';
      await db.addMemory({
        category: 'event',
        characters: [existing.counterpart],
        content: `与「${existing.counterpart}」完成了交易：${action}「${item}」，价格 ${price} 元`,
        source: 'secondhand',
        timestamp: Date.now(),
      });
    }
  }
}

/* ─── 第四层：核心记忆 ─── */

/**
 * 从聊天记录中提取核心记忆
 */
async function extractCoreMemoryFromChat(
  contactName: string,
  recentMessages: Array<{ from: string; content: string }>,
): Promise<void> {
  const messagesText = recentMessages.map(m => `${m.from}: ${m.content}`).join('\n');

  const { generateForApp } = await import('./generation-pipeline');
  const result = await generateForApp(
    'summary',
    `以下是与「${contactName}」的最近聊天记录:\n${messagesText}`,
    `请分析这段聊天，判断是否有以下关键信息值得记住：
1. 关系变化（如告白、吵架、和好、变亲密/疏远）
2. 重要承诺（如约定见面、答应帮忙）
3. 秘密（如对方透露的隐私信息）
4. 重要事件（如生日、搬家、换工作）

如果有，请用以下 JSON 格式输出（没有则输出空数组）：
[{"category":"relationship|event|promise|secret","content":"具体内容"}]

只输出 JSON，不要解释。`,
  );

  if (result.success && result.parsed) {
    const db = await getLocalDB();
    const memories = Array.isArray(result.parsed) ? result.parsed : [];

    for (const mem of memories) {
      if (mem?.category && mem?.content) {
        await db.addMemory({
          category: mem.category as MemoryCore['category'],
          characters: [contactName],
          content: String(mem.content),
          source: 'messages',
          timestamp: Date.now(),
        });
        console.info(`[记忆系统] 提取核心记忆: [${mem.category}] ${mem.content}`);
      }
    }
  }
}

/**
 * 手动添加核心记忆
 */
export async function addCoreMemory(
  category: MemoryCore['category'],
  characters: string[],
  content: string,
  source: string,
): Promise<void> {
  const db = await getLocalDB();
  await db.addMemory({
    category,
    characters,
    content,
    source,
    timestamp: Date.now(),
  });
}

/* ─── 信息检索（注入 AI） ─── */

type RankedMemoryChunk = {
  chunk: MemoryChunk;
  score: number;
};

function recencyBoost(timestamp: number): number {
  const ageDays = Math.max(0, (Date.now() - timestamp) / 86400000);
  return Math.max(0, 0.05 - ageDays * 0.002);
}

function rankMemoryChunks(chunks: MemoryChunk[], queryText: string, appId?: string): RankedMemoryChunk[] {
  const queryEmbedding = createLocalEmbedding(queryText);
  return chunks
    .map(chunk => {
      const appBoost = appId && chunk.appId === appId ? 0.08 : 0;
      const coreBoost = chunk.source === 'core' ? 0.04 : 0;
      const score = cosineSimilarity(queryEmbedding, chunk.embedding)
        + appBoost
        + coreBoost
        + chunk.importance * 0.04
        + recencyBoost(chunk.timestamp);
      return { chunk, score };
    })
    .filter(item => item.score >= MIN_RETRIEVAL_SCORE)
    .sort((a, b) => b.score - a.score || b.chunk.timestamp - a.chunk.timestamp);
}

function formatChunkLine(chunk: MemoryChunk): string {
  const label = getAppFormalName(chunk.appId);
  const content = chunk.summary || chunk.content;
  const keywords = chunk.keywords.length > 0 ? `；关键词：${chunk.keywords.slice(0, 4).join('、')}` : '';
  return `- [${label}/${chunk.source}] ${chunk.title}：${truncateByChars(content, 220)}${keywords}`;
}

function fitChunkLines(chunks: MemoryChunk[], budget: number): string[] {
  const lines: string[] = [];
  let used = 0;

  for (const chunk of chunks) {
    const line = formatChunkLine(chunk);
    if (used + line.length > budget) {
      const remaining = budget - used;
      if (remaining > 80) {
        lines.push(truncateByChars(line, remaining));
      }
      break;
    }
    lines.push(line);
    used += line.length + 1;
  }

  return lines;
}

async function retrieveMemoryChunks(options: {
  appId?: string;
  queryText: string;
  topK: number;
  budget: number;
}): Promise<MemoryChunk[]> {
  if (!isVectorMemoryEnabled()) return [];

  const db = await getLocalDB();
  let chunks = await db.getAllMemoryChunks();
  if (chunks.length === 0) {
    await db.backfillMemoryChunks();
    chunks = await db.getAllMemoryChunks();
  }
  if (chunks.length === 0) return [];

  const ranked = rankMemoryChunks(chunks, options.queryText || '手机 记忆 剧情 关系 约定 最近', options.appId);
  return ranked.slice(0, options.topK).map(item => item.chunk);
}

async function buildFallbackContext(appId: string): Promise<string> {
  const db = await getLocalDB();
  const parts: string[] = [];

  const memories = await db.getAllMemories();
  if (memories.length > 0) {
    const memoryText = memories
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6)
      .map(m => `[${m.category}] ${m.characters.join('、')}: ${m.content}`)
      .join('\n');
    parts.push(`【核心记忆】\n${memoryText}`);
  }

  const appEvents = await db.getEventsByApp(appId);
  if (appEvents.length > 0) {
    const recentEvents = appEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3)
      .map(e => e.summary)
      .join('\n');
    parts.push(`【${getAppFormalName(appId)}最近动态】\n${recentEvents}`);
  }

  return parts.join('\n\n');
}

function getRecentChatQuery(): string {
  try {
    const lastId = getLastMessageId();
    if (lastId < 0) return '';
    const startId = Math.max(0, lastId - 3);
    return getChatMessages(`${startId}-${lastId}`, { role: 'all' })
      .map(message => `${message.role}: ${message.message}`)
      .join('\n');
  } catch {
    return '';
  }
}

/**
 * 为 APP 生成时构建额外上下文
 * 从 IndexedDB 向量索引召回相关记忆和事件
 */
export async function buildExtraContext(appId: string, queryText: string = ''): Promise<string> {
  const chunks = await retrieveMemoryChunks({
    appId,
    queryText: queryText || appId,
    topK: APP_CONTEXT_TOP_K,
    budget: APP_CONTEXT_BUDGET,
  });
  const lines = fitChunkLines(chunks, APP_CONTEXT_BUDGET);

  if (lines.length > 0) {
    console.info('[小手机] 召回相关记忆:', { appId, count: lines.length });
    return `【相关手机记忆】\n${lines.join('\n')}`;
  }

  return buildFallbackContext(appId);
}

/**
 * 索引关闭手机后产生的操作总结和聊天记录
 */
export async function indexPhoneSessionMemory(payload: {
  summary?: string;
  chatLogsText?: string;
  actions?: Array<{ appId: string; summary: string }>;
  timestamp?: number;
}): Promise<void> {
  if (!isVectorMemoryEnabled()) return;

  const db = await getLocalDB();
  const timestamp = payload.timestamp ?? Date.now();
  const actionText = payload.actions?.map(action => `在「${getAppFormalName(action.appId)}」${action.summary}`).join('\n') ?? '';

  if (payload.summary || actionText) {
    await db.upsertMemoryChunk({
      id: `chunk_phone_session_${timestamp}`,
      appId: 'phone',
      source: 'summary',
      title: '手机操作总结',
      content: [payload.summary, actionText].filter(Boolean).join('\n'),
      summary: payload.summary || truncateByChars(actionText, 160),
      importance: 0.7,
      timestamp,
    });
  }

  for (const [index, action] of (payload.actions ?? []).entries()) {
    await db.upsertMemoryChunk({
      id: `chunk_phone_action_${timestamp}_${index}`,
      appId: action.appId,
      source: 'event',
      title: `${getAppFormalName(action.appId)}操作`,
      content: action.summary,
      summary: action.summary,
      importance: 0.55,
      timestamp,
    });
  }

  const chatLogsText = payload.chatLogsText?.trim();
  if (!chatLogsText) return;

  const blockRe = /【闪讯聊天记录 · ([^】]+)】\n([\s\S]*?)(?=\n\n【闪讯聊天记录 · |$)/g;
  let match;
  let matched = false;
  while ((match = blockRe.exec(chatLogsText)) !== null) {
    matched = true;
    await db.upsertMemoryChunk({
      id: `chunk_phone_chat_${timestamp}_${match[1]}`,
      appId: 'messages',
      source: 'chat',
      title: `与「${match[1]}」的闪讯聊天`,
      content: match[2].trim(),
      summary: truncateByChars(match[2], 160),
      importance: 0.7,
      timestamp,
    });
  }

  if (!matched) {
    await db.upsertMemoryChunk({
      id: `chunk_phone_chat_${timestamp}`,
      appId: 'messages',
      source: 'chat',
      title: '闪讯聊天记录',
      content: chatLogsText,
      summary: truncateByChars(chatLogsText, 160),
      importance: 0.65,
      timestamp,
    });
  }
}

/**
 * 获取用于 AI 注入的相关记忆上下文
 * 可通过 injectPrompts 注入到酒馆 AI 请求中
 */
export async function getMemoryInjectContext(queryText: string = ''): Promise<string> {
  const db = await getLocalDB();
  const resolvedQuery = queryText || getRecentChatQuery();
  const chunks = await retrieveMemoryChunks({
    queryText: resolvedQuery || '手机 记忆 剧情 最近',
    topK: INJECT_CONTEXT_TOP_K,
    budget: INJECT_CONTEXT_BUDGET,
  });
  const lines = fitChunkLines(chunks, INJECT_CONTEXT_BUDGET);

  if (lines.length > 0) {
    return `【手机相关记忆】\n${lines.join('\n')}`;
  }

  const memories = await db.getAllMemories();
  if (memories.length === 0) return '';
  const grouped = _.groupBy(memories, 'category');
  const parts: string[] = ['【手机记忆】'];

  if (grouped.relationship?.length) {
    parts.push('关系记录：' + grouped.relationship.slice(-4).map(m => m.content).join('；'));
  }
  if (grouped.promise?.length) {
    parts.push('重要约定：' + grouped.promise.slice(-4).map(m => m.content).join('；'));
  }
  if (grouped.secret?.length) {
    parts.push('已知秘密：' + grouped.secret.slice(-3).map(m => m.content).join('；'));
  }
  if (grouped.event?.length) {
    parts.push('重要事件：' + grouped.event.slice(-4).map(m => m.content).join('；'));
  }

  return truncateByChars(parts.join('\n'), INJECT_CONTEXT_BUDGET);
}
