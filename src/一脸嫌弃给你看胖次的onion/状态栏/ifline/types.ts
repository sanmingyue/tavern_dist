/** IF线生成结果 */
export interface IfLineResult {
  /** IF线标题（如"果那天没有上天台..."） */
  title: string;
  /** IF线正文 */
  content: string;
  /** 生成时间戳 */
  timestamp: number;
}

/** IF线生成状态 */
export type IfLineState = 'idle' | 'generating' | 'done' | 'error';
