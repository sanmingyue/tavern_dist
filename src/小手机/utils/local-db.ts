/**
 * 小手机 IndexedDB 本地存储层
 *
 * 数据库名：xiaoshouji-${chatId}
 * 每个聊天文件一个独立数据库，新开聊天自动隔离。
 */

import { createLocalEmbedding, extractVectorKeywords, truncateByChars } from './vector-memory';
import { isVectorMemoryEnabled } from './memory-settings';

/* ─── 类型定义 ─── */

export interface ChatRecord {
  contactName: string;
  messages: ChatRecordMessage[];
  lastUpdate: number;
}

export interface ChatRecordMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  type: 'text' | 'image' | 'voice' | 'sticker' | 'flash_photo';
  read: boolean;
  /** 是否已被撤回 */
  recalled?: boolean;
  /** 撤回时间戳 */
  recallTimestamp?: number;
  /** 闪照是否已查看 */
  flashViewed?: boolean;
  /** 闪照过期时间戳 */
  flashExpireAt?: number;
}

export interface ForumData {
  posts: ForumPost[];
  summaries: string[];
}

export interface ForumPost {
  id: string;
  title: string;
  author: string;
  content: string;
  likes: number;
  comments: ForumComment[];
  category: string;
  timestamp: number;
}

export interface ForumComment {
  id: string;
  author: string;
  content: string;
  likes: number;
  timestamp: number;
}

export interface TradeRecord {
  id: string;
  type: 'buy' | 'sell';
  counterpart: string;
  chatLog: string[];
  item: string;
  price: number;
  status: string;
  timestamp: number;
}

export interface OrderRecord {
  id: string;
  appId: string;
  items: OrderItem[];
  status: string;
  timestamp: number;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

export interface EventRecord {
  id: string;
  appId: string;
  type: string;
  actor: string;
  summary: string;
  data: any;
  timestamp: number;
}

export interface MemoryCore {
  id: string;
  category: 'relationship' | 'event' | 'promise' | 'secret';
  characters: string[];
  content: string;
  source: string;
  timestamp: number;
}

export type MemoryChunkSource = 'chat' | 'event' | 'summary' | 'core' | 'forum' | 'order' | 'trade';

export interface MemoryChunk {
  id: string;
  appId: string;
  source: MemoryChunkSource;
  title: string;
  content: string;
  summary?: string;
  embedding: number[];
  keywords: string[];
  importance: number;
  timestamp: number;
}

/* ─── 数据库版本与表结构 ─── */

const DB_VERSION = 2;

const STORES = {
  chat_records: { keyPath: 'contactName' },
  forum_data: { keyPath: 'id', autoIncrement: true },
  trade_records: { keyPath: 'id' },
  orders: { keyPath: 'id' },
  events: { keyPath: 'id' },
  memory_core: { keyPath: 'id' },
  memory_chunks: { keyPath: 'id' },
} as const;

const EVENT_INDEXES = [
  { name: 'by_appId', keyPath: 'appId' },
  { name: 'by_type', keyPath: 'type' },
  { name: 'by_actor', keyPath: 'actor' },
  { name: 'by_timestamp', keyPath: 'timestamp' },
];

const MEMORY_CHUNK_INDEXES = [
  { name: 'by_appId', keyPath: 'appId' },
  { name: 'by_source', keyPath: 'source' },
  { name: 'by_timestamp', keyPath: 'timestamp' },
];

function clampImportance(value: number): number {
  return _.clamp(Number.isFinite(value) ? value : 0.5, 0, 1);
}

function stringifyData(data: unknown, maxLength: number = 600): string {
  if (data === undefined || data === null) return '';
  if (typeof data === 'string') return truncateByChars(data, maxLength);
  try {
    return truncateByChars(JSON.stringify(data), maxLength);
  } catch {
    return '';
  }
}

function buildChunkText(chunk: Pick<MemoryChunk, 'title' | 'content' | 'summary'>): string {
  return [chunk.title, chunk.summary, chunk.content].filter(Boolean).join('\n');
}

/* ─── 核心类 ─── */

export class LocalDB {
  private db: IDBDatabase | null = null;
  private dbName: string;

  constructor(chatId: string) {
    this.dbName = `xiaoshouji-${chatId}`;
  }

  /** 打开/创建数据库 */
  async open(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = (event.target as IDBOpenDBRequest).transaction;

        for (const [storeName, options] of Object.entries(STORES)) {
          const store = db.objectStoreNames.contains(storeName)
            ? transaction!.objectStore(storeName)
            : db.createObjectStore(storeName, options);

          // 为 events 表添加索引
          if (storeName === 'events') {
            for (const idx of EVENT_INDEXES) {
              if (!store.indexNames.contains(idx.name)) {
                store.createIndex(idx.name, idx.keyPath, { unique: false });
              }
            }
          }

          // 为 memory_core 添加索引
          if (storeName === 'memory_core') {
            if (!store.indexNames.contains('by_category')) {
              store.createIndex('by_category', 'category', { unique: false });
            }
            if (!store.indexNames.contains('by_source')) {
              store.createIndex('by_source', 'source', { unique: false });
            }
          }

          if (storeName === 'memory_chunks') {
            for (const idx of MEMORY_CHUNK_INDEXES) {
              if (!store.indexNames.contains(idx.name)) {
                store.createIndex(idx.name, idx.keyPath, { unique: false });
              }
            }
          }
        }
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.info(`[LocalDB] 已打开数据库: ${this.dbName}`);
        try {
          await this.backfillMemoryChunks();
        } catch (e) {
          console.warn('[LocalDB] 记忆向量回填失败:', e);
        }
        resolve();
      };

      request.onerror = () => {
        console.error(`[LocalDB] 打开数据库失败: ${this.dbName}`, request.error);
        reject(request.error);
      };
    });
  }

  /** 关闭数据库 */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      console.info(`[LocalDB] 已关闭数据库: ${this.dbName}`);
    }
  }

  /** 确保数据库已打开 */
  private ensureOpen(): IDBDatabase {
    if (!this.db) throw new Error('[LocalDB] 数据库未打开，请先调用 open()');
    return this.db;
  }

  /* ─── 通用 CRUD ─── */

  private tx(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    const db = this.ensureOpen();
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  private async put<T>(storeName: string, data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = this.tx(storeName, 'readwrite').put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      const request = this.tx(storeName).get(key);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAll<T>(storeName: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const request = this.tx(storeName).getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteItem(storeName: string, key: IDBValidKey): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = this.tx(storeName, 'readwrite').delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllByIndex<T>(storeName: string, indexName: string, key: IDBValidKey): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.tx(storeName);
      const index = store.index(indexName);
      const request = index.getAll(key);
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  private async clearStore(storeName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = this.tx(storeName, 'readwrite').clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /* ═══ 向量记忆块 ═══ */

  async upsertMemoryChunk(
    chunk: Omit<MemoryChunk, 'embedding' | 'keywords'> & Partial<Pick<MemoryChunk, 'embedding' | 'keywords'>>,
  ): Promise<void> {
    if (!isVectorMemoryEnabled()) return;

    const indexText = buildChunkText(chunk);
    const record: MemoryChunk = {
      ...chunk,
      content: chunk.content.trim(),
      title: chunk.title.trim(),
      summary: chunk.summary?.trim(),
      embedding: chunk.embedding?.length ? chunk.embedding : createLocalEmbedding(indexText),
      keywords: chunk.keywords?.length ? chunk.keywords : extractVectorKeywords(indexText),
      importance: clampImportance(chunk.importance),
      timestamp: chunk.timestamp || Date.now(),
    };
    return this.put('memory_chunks', record);
  }

  async getMemoryChunksForApp(appId: string): Promise<MemoryChunk[]> {
    return this.getAllByIndex<MemoryChunk>('memory_chunks', 'by_appId', appId);
  }

  async getAllMemoryChunks(): Promise<MemoryChunk[]> {
    return this.getAll<MemoryChunk>('memory_chunks');
  }

  async deleteMemoryChunk(id: string): Promise<void> {
    return this.deleteItem('memory_chunks', id);
  }

  async deleteChatMessageArtifacts(contactName: string, message: ChatRecordMessage): Promise<void> {
    await this.deleteMemoryChunk(`chunk_chat_${contactName}_${message.id}`);

    const events = await this.getAllEvents();
    const matchedEvents = events.filter(event => {
      if (event.appId !== 'messages' || event.type !== 'chat_message') return false;
      const data = event.data as { contactName?: string; messageId?: string; content?: string } | undefined;
      if (!data || data.contactName !== contactName) return false;
      if (data.messageId) return data.messageId === message.id;
      return event.actor === message.from
        && data?.content === message.content
        && Math.abs(event.timestamp - message.timestamp) < 2000;
    });

    await Promise.all(matchedEvents.map(event => this.deleteItem('events', event.id)));
  }

  async backfillMemoryChunks(): Promise<void> {
    if (!isVectorMemoryEnabled()) return;

    const existing = await this.getAllMemoryChunks();
    if (existing.length > 0) return;

    let count = 0;

    for (const record of await this.getAllChatRecords()) {
      for (const message of record.messages) {
        await this.upsertMemoryChunk({
          id: `chunk_chat_${record.contactName}_${message.id}`,
          appId: 'messages',
          source: 'chat',
          title: `与「${record.contactName}」的闪讯聊天`,
          content: `${message.from}：${message.content}`,
          summary: truncateByChars(message.content, 120),
          importance: message.read ? 0.5 : 0.65,
          timestamp: message.timestamp,
        });
        count += 1;
      }
    }

    for (const event of await this.getAllEvents()) {
      await this.upsertMemoryChunk({
        id: `chunk_event_${event.id}`,
        appId: event.appId,
        source: 'event',
        title: event.summary,
        content: [event.summary, stringifyData(event.data)].filter(Boolean).join('\n'),
        summary: event.summary,
        importance: 0.55,
        timestamp: event.timestamp,
      });
      count += 1;
    }

    for (const memory of await this.getAllMemories()) {
      await this.upsertMemoryChunk({
        id: `chunk_core_${memory.id}`,
        appId: memory.source || 'memory',
        source: 'core',
        title: `[${memory.category}] ${memory.characters.join('、') || '核心记忆'}`,
        content: memory.content,
        summary: memory.content,
        importance: 0.9,
        timestamp: memory.timestamp,
      });
      count += 1;
    }

    const forumData = await this.getForumData();
    for (const post of forumData.posts) {
      await this.upsertMemoryChunk({
        id: `chunk_forum_${post.id}`,
        appId: 'forum',
        source: 'forum',
        title: `话圈帖子：${post.title}`,
        content: `${post.author}：${post.content}\n${post.comments.map(c => `${c.author}：${c.content}`).join('\n')}`,
        summary: post.title,
        importance: 0.6,
        timestamp: post.timestamp,
      });
      count += 1;
    }
    for (const [index, summary] of forumData.summaries.entries()) {
      await this.upsertMemoryChunk({
        id: `chunk_forum_summary_${index}`,
        appId: 'forum',
        source: 'summary',
        title: '话圈历史总结',
        content: summary,
        summary,
        importance: 0.65,
        timestamp: Date.now() - (forumData.summaries.length - index),
      });
      count += 1;
    }

    for (const order of await this.getAllOrders()) {
      const itemText = order.items.map(item => `${item.name} x${item.quantity} ¥${item.price}`).join('、');
      await this.upsertMemoryChunk({
        id: `chunk_order_${order.id}`,
        appId: order.appId,
        source: 'order',
        title: `${order.appId} 订单`,
        content: `订单状态：${order.status}；商品：${itemText}`,
        summary: itemText,
        importance: 0.7,
        timestamp: order.timestamp,
      });
      count += 1;
    }

    for (const trade of await this.getAllTradeRecords()) {
      const latestLine = trade.chatLog.length > 0 ? trade.chatLog[trade.chatLog.length - 1] : '';
      await this.upsertMemoryChunk({
        id: `chunk_trade_${trade.id}`,
        appId: 'secondhand',
        source: 'trade',
        title: `与「${trade.counterpart}」的二手交易`,
        content: `状态：${trade.status}；物品：${trade.item || '未定'}；价格：${trade.price || '未定'}\n${trade.chatLog.join('\n')}`,
        summary: trade.item || latestLine || trade.counterpart,
        importance: trade.status === 'completed' ? 0.8 : 0.6,
        timestamp: trade.timestamp,
      });
      count += 1;
    }

    if (count > 0) {
      console.info(`[LocalDB] 已回填 ${count} 条向量记忆`);
    }
  }

  /* ═══ 聊天记录（闪讯） ═══ */

  async getChatRecord(contactName: string): Promise<ChatRecord | undefined> {
    return this.get<ChatRecord>('chat_records', contactName);
  }

  async saveChatRecord(record: ChatRecord): Promise<void> {
    return this.put('chat_records', record);
  }

  async getAllChatRecords(): Promise<ChatRecord[]> {
    return this.getAll<ChatRecord>('chat_records');
  }

  async appendChatMessage(contactName: string, message: ChatRecordMessage): Promise<void> {
    const record = await this.getChatRecord(contactName) || {
      contactName,
      messages: [],
      lastUpdate: Date.now(),
    };
    record.messages.push(message);
    record.lastUpdate = Date.now();
    await this.saveChatRecord(record);
    await this.upsertMemoryChunk({
      id: `chunk_chat_${contactName}_${message.id}`,
      appId: 'messages',
      source: 'chat',
      title: `与「${contactName}」的闪讯聊天`,
      content: `${message.from}：${message.content}`,
      summary: truncateByChars(message.content, 120),
      importance: message.read ? 0.5 : 0.65,
      timestamp: message.timestamp,
    });
  }

  /* ═══ 话圈数据 ═══ */

  async getForumData(): Promise<ForumData> {
    const all = await this.getAll<ForumData>('forum_data');
    return all[0] || { posts: [], summaries: [] };
  }

  async saveForumData(data: ForumData): Promise<void> {
    return this.put('forum_data', { id: 1, ...data });
  }

  async addForumPost(post: ForumPost): Promise<void> {
    const data = await this.getForumData();
    data.posts.push(post);
    await this.saveForumData(data);
    await this.upsertMemoryChunk({
      id: `chunk_forum_${post.id}`,
      appId: 'forum',
      source: 'forum',
      title: `话圈帖子：${post.title}`,
      content: `${post.author}：${post.content}\n${post.comments.map(c => `${c.author}：${c.content}`).join('\n')}`,
      summary: post.title,
      importance: 0.6,
      timestamp: post.timestamp,
    });
  }

  async addForumSummary(summary: string): Promise<void> {
    const data = await this.getForumData();
    data.summaries.push(summary);
    await this.saveForumData(data);
    await this.upsertMemoryChunk({
      id: `chunk_forum_summary_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      appId: 'forum',
      source: 'summary',
      title: '话圈历史总结',
      content: summary,
      summary,
      importance: 0.65,
      timestamp: Date.now(),
    });
  }

  /* ═══ 交易记录（闲转/淘点） ═══ */

  async getTradeRecord(id: string): Promise<TradeRecord | undefined> {
    return this.get<TradeRecord>('trade_records', id);
  }

  async saveTradeRecord(record: TradeRecord): Promise<void> {
    await this.put('trade_records', record);
    const latestLine = record.chatLog.length > 0 ? record.chatLog[record.chatLog.length - 1] : '';
    await this.upsertMemoryChunk({
      id: `chunk_trade_${record.id}`,
      appId: 'secondhand',
      source: 'trade',
      title: `与「${record.counterpart}」的二手交易`,
      content: `状态：${record.status}；物品：${record.item || '未定'}；价格：${record.price || '未定'}\n${record.chatLog.join('\n')}`,
      summary: record.item || latestLine || record.counterpart,
      importance: record.status === 'completed' ? 0.8 : 0.6,
      timestamp: record.timestamp,
    });
  }

  async getAllTradeRecords(): Promise<TradeRecord[]> {
    return this.getAll<TradeRecord>('trade_records');
  }

  /* ═══ 订单（吃点啥/淘点） ═══ */

  async getOrder(id: string): Promise<OrderRecord | undefined> {
    return this.get<OrderRecord>('orders', id);
  }

  async saveOrder(order: OrderRecord): Promise<void> {
    await this.put('orders', order);
    const itemText = order.items.map(item => `${item.name} x${item.quantity} ¥${item.price}`).join('、');
    await this.upsertMemoryChunk({
      id: `chunk_order_${order.id}`,
      appId: order.appId,
      source: 'order',
      title: `${order.appId} 订单`,
      content: `订单状态：${order.status}；商品：${itemText}`,
      summary: itemText,
      importance: 0.7,
      timestamp: order.timestamp,
    });
  }

  async getAllOrders(): Promise<OrderRecord[]> {
    return this.getAll<OrderRecord>('orders');
  }

  async getOrdersByApp(appId: string): Promise<OrderRecord[]> {
    const all = await this.getAllOrders();
    return all.filter(o => o.appId === appId);
  }

  /* ═══ 事件日志 ═══ */

  async addEvent(event: Omit<EventRecord, 'id'>): Promise<void> {
    const record: EventRecord = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    await this.put('events', record);
    await this.upsertMemoryChunk({
      id: `chunk_event_${record.id}`,
      appId: record.appId,
      source: 'event',
      title: record.summary,
      content: [record.summary, stringifyData(record.data)].filter(Boolean).join('\n'),
      summary: record.summary,
      importance: 0.55,
      timestamp: record.timestamp,
    });
  }

  async getEventsByApp(appId: string): Promise<EventRecord[]> {
    return this.getAllByIndex<EventRecord>('events', 'by_appId', appId);
  }

  async getEventsByActor(actor: string): Promise<EventRecord[]> {
    return this.getAllByIndex<EventRecord>('events', 'by_actor', actor);
  }

  async getRecentEvents(limit: number = 20): Promise<EventRecord[]> {
    const all = await this.getAll<EventRecord>('events');
    return all.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  async getAllEvents(): Promise<EventRecord[]> {
    return this.getAll<EventRecord>('events');
  }

  /* ═══ 核心记忆 ═══ */

  async addMemory(memory: Omit<MemoryCore, 'id'>): Promise<void> {
    const record: MemoryCore = {
      ...memory,
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    };
    await this.put('memory_core', record);
    await this.upsertMemoryChunk({
      id: `chunk_core_${record.id}`,
      appId: record.source || 'memory',
      source: 'core',
      title: `[${record.category}] ${record.characters.join('、') || '核心记忆'}`,
      content: record.content,
      summary: record.content,
      importance: 0.9,
      timestamp: record.timestamp,
    });
  }

  async getMemoriesByCategory(category: MemoryCore['category']): Promise<MemoryCore[]> {
    return this.getAllByIndex<MemoryCore>('memory_core', 'by_category', category);
  }

  async getMemoriesBySource(source: string): Promise<MemoryCore[]> {
    return this.getAllByIndex<MemoryCore>('memory_core', 'by_source', source);
  }

  async getAllMemories(): Promise<MemoryCore[]> {
    return this.getAll<MemoryCore>('memory_core');
  }

  async deleteMemory(id: string): Promise<void> {
    return this.deleteItem('memory_core', id);
  }

  /* ═══ 工具方法 ═══ */

  /** 清除所有数据（重置数据库） */
  async clearAll(): Promise<void> {
    for (const storeName of Object.keys(STORES)) {
      await this.clearStore(storeName);
    }
    console.info(`[LocalDB] 已清除所有数据: ${this.dbName}`);
  }

  /** 删除整个数据库 */
  static async deleteDatabase(chatId: string): Promise<void> {
    const name = `xiaoshouji-${chatId}`;
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => {
        console.info(`[LocalDB] 已删除数据库: ${name}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error(`删除数据库被阻塞: ${name}`));
    });
  }

  /** 获取数据库统计信息 */
  async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};
    for (const storeName of Object.keys(STORES)) {
      const all = await this.getAll(storeName);
      stats[storeName] = all.length;
    }
    return stats;
  }
}

/* ─── 单例管理 ─── */

let currentDB: LocalDB | null = null;
let currentChatId: string | null = null;

/**
 * 获取当前聊天对应的 LocalDB 实例
 * 如果 chatId 变化，自动切换数据库
 */
export async function getLocalDB(): Promise<LocalDB> {
  const chatId = SillyTavern.getCurrentChatId() || 'default';

  if (currentDB && currentChatId === chatId) {
    return currentDB;
  }

  // 关闭旧数据库
  if (currentDB) {
    currentDB.close();
  }

  // 打开新数据库
  currentDB = new LocalDB(chatId);
  currentChatId = chatId;
  await currentDB.open();

  return currentDB;
}

/**
 * 关闭当前数据库连接
 */
export function closeLocalDB(): void {
  if (currentDB) {
    currentDB.close();
    currentDB = null;
    currentChatId = null;
  }
}

/**
 * 监听聊天切换并自动切换数据库
 * 返回停止监听的函数
 */
export function watchChatChange(): { stop: () => void } {
  const handler = eventOn(tavern_events.CHAT_CHANGED, async (newChatId: string) => {
    if (currentChatId !== newChatId) {
      console.info(`[LocalDB] 聊天切换: ${currentChatId} → ${newChatId}`);
      if (currentDB) {
        currentDB.close();
        currentDB = null;
      }
      currentChatId = newChatId;
      currentDB = new LocalDB(newChatId);
      await currentDB.open();
    }
  });

  return { stop: () => handler.stop() };
}
