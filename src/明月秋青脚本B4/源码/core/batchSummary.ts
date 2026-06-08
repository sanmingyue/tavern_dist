/**
 * 批量总结引擎
 *
 * 从捕获记录中按楼层范围 + 每批N层，连续自动运行大总结。
 * 单批失败自动重试3次（指数退避）。
 */

import { executeGrandSummary } from './summary';
import { embedTimelineEvents, embedCharacterMemories } from './embedding';
import type { CapturedContent, GrandSummary } from '../stores/mainStore';

export interface BatchProgress {
  status: 'idle' | 'running' | 'done' | 'cancelled' | 'paused';
  currentBatch: number;
  totalBatches: number;
  totalMessages: number;
  startFloor: number;
  endFloor: number;
  batchSize: number;
  /** 当前批次实际楼层范围 */
  currentBatchFloorStart?: number;
  currentBatchFloorEnd?: number;
  /** 当前批次捕获条数 */
  currentBatchCount?: number;
  errors: Array<{ batch: number; message: string; retries: number }>;
}

const MAX_RETRIES = 3;
const RETRY_BASE_DELAY = 5000;

/** 可中止的 sleep：每秒检查 abortSignal，被中止时抛 AbortError */
async function interruptibleSleep(ms: number, abortSignal?: { value: boolean }): Promise<void> {
  const deadline = Date.now() + ms;
  while (Date.now() < deadline) {
    if (abortSignal?.value) throw new DOMException('Aborted', 'AbortError');
    await new Promise(r => setTimeout(r, Math.min(1000, deadline - Date.now())));
  }
}

/** 按楼层范围将捕获记录分配到各批次 */
function computeBatchMap(
  contents: CapturedContent[],
  startFloor: number,
  endFloor: number,
  batchSize: number,
): Map<number, CapturedContent[]> {
  const totalFloors = endFloor - startFloor + 1;
  const totalBatches = Math.ceil(totalFloors / batchSize);
  const map = new Map<number, CapturedContent[]>();
  for (let b = 0; b < totalBatches; b++) map.set(b, []);

  for (const c of contents) {
    // 计算该 messageId 属于第几批
    const batchIdx = Math.floor((c.messageId - startFloor) / batchSize);
    if (batchIdx >= 0 && batchIdx < totalBatches) {
      map.get(batchIdx)!.push(c);
    }
  }
  return map;
}

export async function executeBatchSummary(
  startFloor: number,
  endFloor: number,
  batchSize: number,
  capturedContents: CapturedContent[],
  store: any,
  onProgress: (progress: BatchProgress) => void,
  /** 外部可设置此 ref 为 true 来中止批量（停止按钮） */
  abortSignal?: { value: boolean },
): Promise<void> {
  const progress: BatchProgress = {
    status: 'running',
    currentBatch: 0,
    totalBatches: 0,
    totalMessages: 0,
    startFloor,
    endFloor,
    batchSize,
    errors: [],
  };

  // 创建 AbortController：当外部设置 abortSignal.value=true 时真正中断 fetch 请求
  const controller = new AbortController();
  const pollAbort = () => {
    if (abortSignal?.value) controller.abort();
  };
  // 每 200ms 检查一次，有变化立即中止
  const abortPollTimer = setInterval(pollAbort, 200);

  try {
    // 1. 从捕获记录中筛选范围 + 按 messageId 排序
    const rangeContents = capturedContents
      .filter(c => c.messageId >= startFloor && c.messageId <= endFloor)
      .sort((a, b) => a.messageId - b.messageId);

    if (rangeContents.length === 0) {
      progress.status = 'done';
      onProgress(progress);
      console.warn(`[智脑-批量] 楼层 ${startFloor}-${endFloor} 内无捕获记录`);
      return;
    }

    progress.totalMessages = rangeContents.length;
    // 按楼层范围切批（非按捕获条数）
    const totalFloors = endFloor - startFloor + 1;
    const totalBatches = Math.ceil(totalFloors / batchSize);
    progress.totalBatches = totalBatches;
    const batchContentsByFloor = computeBatchMap(rangeContents, startFloor, endFloor, batchSize);
    onProgress({ ...progress });
    console.info(`[智脑-批量] 开始: 楼层 ${startFloor}-${endFloor}, ${rangeContents.length}条捕获记录, ${totalBatches}批(每批${batchSize}层)`);

    let previousSummary: GrandSummary | undefined;

    // 2. 逐批处理（按楼层范围）
    for (let b = 0; b < totalBatches; b++) {
      // 外部中止检查
      if (abortSignal?.value) {
        progress.status = 'cancelled';
        onProgress({ ...progress });
        return;
      }
      const batchStartFloor = startFloor + b * batchSize;
      const batchEndFloor = Math.min(startFloor + (b + 1) * batchSize - 1, endFloor);
      const batchContents = batchContentsByFloor.get(b) || [];

      progress.currentBatch = b + 1;
      progress.currentBatchFloorStart = batchStartFloor;
      progress.currentBatchFloorEnd = batchEndFloor;
      progress.currentBatchCount = batchContents.length;
      onProgress({ ...progress });

      if (batchContents.length === 0) {
        console.info(`[智脑-批量] 第${b + 1}/${totalBatches}批 (${batchStartFloor}-${batchEndFloor}层) 无捕获记录，跳过`);
        continue;
      }

      console.info(`[智脑-批量] 第${b + 1}/${totalBatches}批 (${batchStartFloor}-${batchEndFloor}层, ${batchContents.length}条)`);

      const lastMsgId = batchContents[batchContents.length - 1].messageId;

      // 重试循环
      for (let retry = 0; retry <= MAX_RETRIES; retry++) {
        // 每次重试前检查中止信号
        if (abortSignal?.value) {
          progress.status = 'cancelled';
          onProgress({ ...progress });
          return;
        }

        // 非首次尝试时等待
        if (retry > 0) {
          const delay = RETRY_BASE_DELAY * Math.pow(2, retry - 1);
          console.warn(`[智脑-批量] 第${b + 1}/${totalBatches}批失败, ${delay / 1000}s后重试(${retry}/${MAX_RETRIES})`);
          try {
            await interruptibleSleep(delay, abortSignal);
          } catch (e: any) {
            if (e?.name === 'AbortError') {
              progress.status = 'cancelled';
              onProgress({ ...progress });
              return;
            }
            throw e;
          }
        }

        try {
          const result = await executeGrandSummary(
            batchContents,
            previousSummary,
            4,
            8,
            undefined,
            store.getUserName(),
            controller.signal,
          );

          // AI 调用完成后立即检查中止
          if (abortSignal?.value) {
            progress.status = 'cancelled';
            onProgress({ ...progress });
            return;
          }

          const batchCoveredIds = batchContents.map(c => c.messageId);
          store.addSummary(result.summary, lastMsgId, batchCoveredIds);

          // 存储 NSFW 记忆
          if (result.nsfwMemories.length > 0) {
            store.updateNsfwMemories(result.nsfwMemories);
            store.forcePersist();
            console.info(`[智脑-批量] NSFW记忆已更新 (${result.nsfwMemories.length} 角色)`);
          }

          // 语义向量：后台生成，不阻塞批量流程
          if (store.settings.embeddingEnabled && store.settings.embeddingApiKey && result.summary.timeline.length > 0) {
            embedTimelineEvents(
              result.summary.timeline,
              store.settings.embeddingApiUrl,
              store.settings.embeddingApiKey,
              store.settings.embeddingModel,
              store.settings.embeddingDimensions,
            ).then(() => store.forcePersist()).catch(() => {});
          }

          // 核心记忆向量：后台生成
          const totalCores = result.summary.characterMemories.reduce((s: number, m: any) => s + (m.coreMemories?.length || 0), 0);
          if (store.settings.embeddingEnabled && store.settings.embeddingApiKey && totalCores > 0) {
            embedCharacterMemories(
              result.summary.characterMemories,
              store.settings.embeddingApiUrl,
              store.settings.embeddingApiKey,
              store.settings.embeddingModel,
              store.settings.embeddingDimensions,
            ).then(() => store.forcePersist()).catch(() => {});
          }

          previousSummary = result.summary;

          if (retry > 0) {
            console.info(`[智脑-批量] 第${b + 1}批重试成功 (第${retry}次)`);
          }
          break;
        } catch (err: any) {
          // AbortError = 用户中止请求，直接退出
          if (err?.name === 'AbortError') {
            progress.status = 'cancelled';
            onProgress({ ...progress });
            clearInterval(abortPollTimer);
            return;
          }
          // 记录错误，下一轮循环会在开头检查中止+等待
          progress.errors.push({
            batch: b + 1,
            message: String(err?.message || err),
            retries: retry + 1,
          });
          onProgress({ ...progress });
          if (retry >= MAX_RETRIES) {
            console.error(`[智脑-批量] 第${b + 1}/${totalBatches}批最终失败，已暂停`);
            progress.errors.push({
              batch: b + 1,
              message: String(err?.message || err),
              retries: MAX_RETRIES + 1,
            });
            progress.status = 'paused';
            onProgress({ ...progress });
            return;  // 停止整个批量，等待用户决定继续或放弃
          }
        }
      }
    }

    progress.status = 'done';
    onProgress({ ...progress });
    const okCount = totalBatches - progress.errors.filter((e) => e.retries > MAX_RETRIES).length;
    console.info(`[智脑-批量] 完成: ${okCount}/${totalBatches}批成功, ${progress.errors.length}次错误`);
  } catch (err: any) {
    clearInterval(abortPollTimer);
    if (err?.name === 'AbortError') {
      progress.status = 'cancelled';
    } else {
      progress.status = 'done';
      progress.errors.push({
        batch: 0,
        message: `致命错误: ${err?.message || err}`,
        retries: 0,
      });
      console.error(`[智脑-批量] 致命错误: ${err?.message || err}`);
    }
    onProgress({ ...progress });
  } finally {
    clearInterval(abortPollTimer);
  }
}
