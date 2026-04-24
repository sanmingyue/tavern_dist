// ============================================================
// 统一 AI 交互工具函数
// 所有前端→AI 的通信都通过这个模块
// ============================================================

/**
 * 发送用户消息并请求 AI 回复
 * 用于日常 RP 对话
 */
export async function sendUserMessage(text: string): Promise<void> {
  await createChatMessages([{ role: 'user', message: text }]);
  await generate({ user_input: '' });
}

/**
 * 发送系统指令并请求 AI 回复
 * 用于强化结果叙事、改装反应等
 */
export async function sendSystemPrompt(prompt: string): Promise<void> {
  await createChatMessages([{ role: 'user', message: prompt }]);
  await generate({ user_input: '' });
}

/**
 * 强化结果叙事
 */
export async function narrateEnhanceResult(
  mechName: string,
  dimension: string,
  success: boolean,
  oldValue: number,
  newValue: number,
): Promise<void> {
  const resultText = success
    ? `${dimension}从${oldValue}提升到${newValue}`
    : `${dimension}维持在${oldValue}不变`;
  const prompt = `（系统：玩家对${mechName}进行了${dimension}强化，结果${success ? '成功' : '失败'}。${resultText}。请描写强化过程中机娘的反应。不要输出任何MVU变量命令。）`;
  await sendSystemPrompt(prompt);
}

/**
 * 改装安装叙事
 */
export async function narrateModInstall(
  mechName: string,
  modName: string,
  modDesc: string,
  isSkillMod: boolean,
  isBlackMarket: boolean,
): Promise<void> {
  let prompt: string;
  if (isBlackMarket) {
    prompt = `（系统：玩家为${mechName}的核心插入了来路不明的技能改件「${modName}」——${modDesc}。${mechName}的核心对这个改件产生了异样的感觉。描写她的反应和可能的不适。不要输出任何MVU变量命令。）`;
  } else if (isSkillMod) {
    prompt = `（系统：玩家为${mechName}的核心插入了技能改件「${modName}」——${modDesc}。描写${mechName}感受到核心变化时的反应。不要输出任何MVU变量命令。）`;
  } else {
    prompt = `（系统：玩家为${mechName}安装了外形改件「${modName}」——${modDesc}。描写${mechName}看到新外观后的反应。不要输出任何MVU变量命令。）`;
  }
  await sendSystemPrompt(prompt);
}

/**
 * 报名参赛 — 普通赛事（要求 AI 生成赛道）
 */
export async function sendEnrollNormal(
  tier: string,
  raceType: string,
  mechName: string,
  stats: { acc: number; spd: number; hdl: number; dft: number; end: number },
): Promise<void> {
  const prompt = `（[系统:进入赛前准备] 玩家报名参加${tier}${raceType}，搭档机娘为${mechName}。参赛五维配置：ACC=${stats.acc} SPD=${stats.spd} HDL=${stats.hdl} DFT=${stats.dft} END=${stats.end}。请生成赛道数据（使用<track_data>JSON格式</track_data>），并描写赛前准备场景。赛道数据将被系统自动捕获。不要输出任何MVU变量命令。）`;
  await sendSystemPrompt(prompt);
}

/**
 * 报名参赛 — 专属进阶赛事（赛道已预设）
 */
export async function sendEnrollPromotion(
  tier: string,
  trackName: string,
  mechName: string,
  stats: { acc: number; spd: number; hdl: number; dft: number; end: number },
): Promise<void> {
  const prompt = `（[系统:进入赛前准备] 玩家报名参加${tier}专属晋级赛「${trackName}」，搭档机娘为${mechName}。参赛五维配置：ACC=${stats.acc} SPD=${stats.spd} HDL=${stats.hdl} DFT=${stats.dft} END=${stats.end}。赛道数据已由系统预设，请直接描写赛前准备场景，介绍这条赛道的氛围。不要输出任何MVU变量命令。）`;
  await sendSystemPrompt(prompt);
}

/**
 * 开始比赛
 */
export async function sendRaceStart(): Promise<void> {
  await sendSystemPrompt('（[系统:比赛开始] 发车！描写比赛开始的场景。）');
}

/**
 * 比赛结束
 */
export async function sendRaceEnd(rank: number): Promise<void> {
  await sendSystemPrompt(`（[系统:比赛结束] 比赛结束，第${rank}名完赛。描写冲线和赛后场景。不要输出任何MVU变量命令。）`);
}

/**
 * 共鸣技能释放
 */
export async function sendResonanceRelease(skillName: string): Promise<void> {
  await sendSystemPrompt(`（玩家决定释放共鸣技能「${skillName}」！描写共鸣技能释放的震撼场面和效果。释放后共鸣值归零。）`);
}
