/**
 * 正文标签捕获系统
 *
 * 监听 AI 消息输出，匹配手机 APP 标签，从正文中删除标签，
 * 将内容传入对应 APP 生成完整内容，更新红点通知。
 */

import { CAPTURE_PATTERNS, STRIP_ALL_TAGS_REGEX, cleanMessagesReplyText, getAppFormalName } from './app-names';
import { generateForApp } from './generation-pipeline';

export interface CapturedEvent {
  appId: string;
  appName: string;
  /** 标签属性（如 from="小美" 中的 "小美"） */
  attribute: string;
  /** 标签内容 */
  content: string;
  /** 来源楼层 ID */
  messageId: number;
}

/**
 * 从消息文本中捕获所有手机标签
 */
export function capturePhoneTags(text: string): CapturedEvent[] {
  const events: CapturedEvent[] = [];

  for (const [appId, pattern] of Object.entries(CAPTURE_PATTERNS)) {
    // 重置 lastIndex（全局正则需要）
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(text)) !== null) {
      // 大多数标签有 attribute（from/author/host/seller/app）+ content
      // delivery 和 shop 只有 content
      const hasAttribute = match.length >= 3;
      events.push({
        appId,
        appName: getAppFormalName(appId),
        attribute: hasAttribute ? (match[1] || '') : '',
        content: hasAttribute ? match[2].trim() : match[1].trim(),
        messageId: 0, // 由调用方设置
      });
    }
  }

  return events;
}

/**
 * 从消息文本中删除所有手机标签，保留标签外的叙事内容
 */
export function stripPhoneTags(text: string): string {
  return text.replace(STRIP_ALL_TAGS_REGEX, '').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * 处理捕获到的事件：调用 API 生成完整 APP 内容
 */
export async function processCapturedEvent(
  event: CapturedEvent,
): Promise<{ success: boolean; data?: any; error?: string }> {
  // 根据 APP 类型构造不同的生成请求
  const contextMap: Record<string, string> = {
    messages: `角色「${event.attribute}」在剧情中给用户发了消息，摘要：${event.content}。请以该角色的身份生成完整的聊天消息内容。`,
    sms: `来自「${event.attribute}」的短信，摘要：${event.content}。请生成完整的短信内容。`,
    forum: `角色「${event.attribute}」在论坛发了帖子，标题相关：${event.content}。请生成完整的论坛帖子。`,
    live: `角色「${event.attribute}」正在直播，主题：${event.content}。请生成直播间的弹幕和互动内容。`,
    phone: `角色「${event.attribute}」打电话给用户，原因：${event.content}。`,
    delivery: `外卖状态更新：${event.content}。请生成外卖订单状态详情。`,
    shop: `购物/物流更新：${event.content}。请生成物流通知详情。`,
    secondhand: `角色「${event.attribute}」在二手平台上架了商品：${event.content}。请生成完整的商品信息。`,
    notes: `正文中出现一条备忘录，标题线索：${event.attribute || '未命名'}，内容：${event.content}。请整理成备忘录内容。`,
    calendar: `正文中出现一条日历/时间线事件，时间线索：${event.attribute || '未指定'}，内容：${event.content}。请整理成日历事件。`,
    notifications: `来自「${event.attribute}」的通知：${event.content}。`,
  };

  const extraContext = contextMap[event.appId] || `APP事件：${event.content}`;

  try {
    const result = await generateForApp(event.appId, event.content, extraContext);
    if (result.success) {
      const data = event.appId === 'messages' ? cleanMessagesReplyText(String(result.parsed)) : result.parsed;
      return { success: true, data };
    }
    return { success: false, error: result.error };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : '处理失败' };
  }
}

/**
 * 格式化用户操作总结（写入用户楼层）
 */
export function formatActionSummary(actions: Array<{ appId: string; summary: string }>): string {
  if (actions.length === 0) return '';

  const lines = actions.map(a => `在「${getAppFormalName(a.appId)}」${a.summary}`);

  return `\n---\n📱 手机操作：\n${lines.join('\n')}\n---`;
}
