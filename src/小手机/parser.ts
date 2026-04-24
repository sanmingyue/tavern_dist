/**
 * 小手机消息解析器
 *
 * 简化的 <iphone> 标签格式：
 *
 * AI 输出示例：
 * <iphone>
 * 鱼冰：今天晚上来我家吃饭
 * 鱼冰：我妈做了排骨
 * </iphone>
 *
 * 用户回复示例（追加到输入框）：
 * <iphone>
 * {{user}}：好的，几点？
 * </iphone>
 *
 * 每行格式：「发送者：消息内容」
 * 冒号支持中文冒号「：」和英文冒号「:」
 */

export interface PhoneMessage {
  id: string;
  from: string;
  content: string;
  /** 来源楼层号 */
  messageId: number;
  /** 消息来源角色：user 还是 assistant */
  role: 'user' | 'assistant' | 'system';
}

let entryCounter = 0;

function generateId(): string {
  return `ph_${Date.now()}_${entryCounter++}`;
}

/**
 * 从消息文本中解析 <iphone> 标签内的所有消息
 */
export function parsePhoneMessages(text: string, messageId: number, role: 'user' | 'assistant' | 'system'): PhoneMessage[] {
  const entries: PhoneMessage[] = [];

  /* 匹配所有 <iphone>...</iphone> 块 */
  const phoneBlocks = text.match(/<iphone>([\s\S]*?)<\/iphone>/gi);
  if (!phoneBlocks) return entries;

  for (const block of phoneBlocks) {
    const inner = block.replace(/<\/?iphone>/gi, '').trim();
    const lines = inner.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      /* 解析 "发送者：消息内容" 或 "发送者:消息内容" */
      const match = trimmed.match(/^([^：:]+)[：:](.+)$/);
      if (match) {
        entries.push({
          id: generateId(),
          from: match[1].trim(),
          content: match[2].trim(),
          messageId,
          role,
        });
      }
    }
  }

  return entries;
}

/**
 * 从消息列表中提取与指定联系人的对话
 */
export function getConversation(entries: PhoneMessage[], contactName: string, userName: string): PhoneMessage[] {
  return entries.filter(entry =>
    entry.from === contactName || entry.from === userName,
  );
}

/**
 * 从消息列表中提取所有联系人名称（排除用户自己）
 */
export function extractContacts(entries: PhoneMessage[], userName: string): string[] {
  const contacts = new Set<string>();
  for (const entry of entries) {
    if (entry.from !== userName) {
      contacts.add(entry.from);
    }
  }
  return [...contacts];
}

/**
 * 将用户输入格式化为 <iphone> 标签，用于追加到输入框
 */
export function formatUserReply(userName: string, content: string): string {
  return `<iphone>\n${userName}：${content}\n</iphone>`;
}
