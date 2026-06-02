/** 内心剧场生成结果 */
export interface TheaterResult {
  characterName: string;
  innerVoice: string;    // 心里话
  fourthWall: string;    // 第四面墙吐槽
  userReaction: string;  // 对用户的反应
  timestamp: number;
}

/** 内心剧场生成状态 */
export type TheaterState = 'idle' | 'generating' | 'done' | 'error';
