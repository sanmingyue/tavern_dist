/**
 * 智脑调度系统 (Scheduler)
 *
 * 核心职责：
 * 1. 所有后台 AI 调用（generateRaw/generate）进入串行队列，绝不同时执行
 * 2. 各功能的触发间隔互质错开，避免同一楼层触发多个分析
 * 3. 大总结链（大总结→梦呓→倒果为因）作为一个整体串行执行
 *
 * 触发间隔设计（默认值，用户可调）：
 * - 大总结:       每 10 楼（summaryInterval）
 * - 情绪积累:     每 7 楼（emotionInterval）
 * - 后台行动推演: 每 13 楼（ecosystemInterval）
 *
 * 10、7、13 互质，最小公倍数为 910，在正常游玩范围内几乎不会重合。
 * 即使偶尔重合，串行队列也保证不会同时调用。
 */

export type AnalysisTaskName =
  | 'summary_chain'    // 大总结（仅大总结本身）
  | 'dreamtalk_chain'  // 大总结后续（梦呓→倒果为因）
  | 'emotion'          // 情绪积累分析
  | 'ecosystem'        // 后台角色行动推演
  | 'persona';         // 用户人格分析（手动触发）

export interface AnalysisTask {
  name: AnalysisTaskName;
  priority: number;  // 数字越小优先级越高
  execute: () => Promise<void>;
}

// 优先级定义（数字越小越优先）
const PRIORITY: Record<AnalysisTaskName, number> = {
  summary_chain: 1,
  dreamtalk_chain: 2,
  emotion: 4,
  ecosystem: 5,
  persona: 6,
};

// ========== 串行队列 ==========

const queue: AnalysisTask[] = [];
let isProcessing = false;
let currentTask: AnalysisTaskName | null = null;

/**
 * 将分析任务加入队列
 * - 同名任务不重复入队（防止快速连续触发）
 * - 按优先级排序
 */
export function enqueueAnalysis(name: AnalysisTaskName, execute: () => Promise<void>): void {
  // 去重：同名任务已在队列中则跳过
  if (queue.some(t => t.name === name)) {
    console.info(`[智脑-调度] ${name} 已在队列中，跳过`);
    return;
  }

  // 如果当前正在执行同名任务，也跳过
  if (currentTask === name) {
    console.info(`[智脑-调度] ${name} 正在执行中，跳过`);
    return;
  }

  const task: AnalysisTask = {
    name,
    priority: PRIORITY[name],
    execute,
  };

  queue.push(task);
  // 按优先级排序（数字小的在前）
  queue.sort((a, b) => a.priority - b.priority);

  console.info(`[智脑-调度] ${name} 入队 (队列长度: ${queue.length})`);

  // 如果没有正在处理的任务，开始处理
  if (!isProcessing) {
    processQueue();
  }
}

/**
 * 处理队列（串行执行）
 */
async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    while (queue.length > 0) {
      const task = queue.shift()!;
      currentTask = task.name;

      const startTime = Date.now();
      console.info(`[智脑-调度] ▶ 开始执行: ${task.name}`);

      try {
        // 5分钟超时，防止任务永久挂起阻塞队列
        const TIMEOUT = 5 * 60 * 1000;
        await Promise.race([
          task.execute(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`任务 ${task.name} 超时 (${TIMEOUT / 1000}s)`)), TIMEOUT),
          ),
        ]);
        console.info(`[智脑-调度] ✅ ${task.name} 完成 (${Date.now() - startTime}ms)`);
      } catch (error) {
        console.error(`[智脑-调度] ❌ ${task.name} 失败:`, error);
      }

      currentTask = null;

      // 任务间间隔 500ms，避免 API 限流
      if (queue.length > 0) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
  } finally {
    currentTask = null;
    isProcessing = false;
  }
}

/**
 * 获取当前队列状态（供面板显示）
 */
export function getSchedulerStatus(): {
  isProcessing: boolean;
  currentTask: AnalysisTaskName | null;
  queueLength: number;
  queueNames: AnalysisTaskName[];
} {
  return {
    isProcessing,
    currentTask,
    queueLength: queue.length,
    queueNames: queue.map(t => t.name),
  };
}

/**
 * 清空队列（用于紧急停止或聊天切换）
 */
export function clearSchedulerQueue(): void {
  queue.length = 0;
  console.info('[智脑-调度] 队列已清空');
}

// ========== 错位触发检查 ==========

/**
 * 检查某个功能在当前楼层是否应该触发
 * 使用互质间隔确保不同功能不会在同一楼层同时触发
 *
 * @param userMessageCount 用户发送消息的累计次数（从 1 开始）
 * @param interval 该功能的触发间隔
 * @param offset 偏移量（用于进一步错开，默认 0）
 */
export function shouldTriggerAtFloor(
  userMessageCount: number,
  interval: number,
  offset: number = 0,
): boolean {
  if (interval <= 0) return false;
  return ((userMessageCount - offset) % interval) === 0;
}

/**
 * 检查当前是否有任务在执行或排队
 * 用于独立触发的功能（情绪、后台行动）判断是否应该延迟
 */
export function isSchedulerBusy(): boolean {
  return isProcessing || queue.length > 0;
}
