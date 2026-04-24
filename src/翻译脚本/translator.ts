import { callTranslateApi, shouldRetry } from './api';
import { useSettingsStore } from './settings';
import type { ApiResponse, CachedTranslation, TaskState } from './types';
import { RETRY_DELAY, SCRIPT_NAME } from './types';

// ─── 当前翻译任务管理 ───
let currentAbortController: AbortController | null = null;
let currentTaskState: TaskState | null = null;
const taskStateListeners: Set<(state: TaskState) => void> = new Set();

export function onTaskStateChange(listener: (state: TaskState) => void): () => void {
  taskStateListeners.add(listener);
  return () => taskStateListeners.delete(listener);
}

function emitTaskState(state: TaskState) {
  currentTaskState = state;
  taskStateListeners.forEach(fn => fn(state));
}

export function getCurrentTaskState(): TaskState | null {
  return currentTaskState;
}

/**
 * 取消当前进行中的翻译任务
 */
export function cancelCurrentTask() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
    if (currentTaskState?.status === 'running') {
      emitTaskState({ ...currentTaskState, status: 'cancelled' });
    }
  }
}

/**
 * 是否有正在进行的翻译任务
 */
export function isTranslating(): boolean {
  return currentTaskState?.status === 'running';
}

// ─── 标签提取 ───

/**
 * 从消息中提取指定标签的所有匹配片段
 */
export function extractTagFragments(
  message: string,
  tagName: string,
): { fullMatch: string; content: string; startIndex: number }[] {
  const escaped = _.escapeRegExp(tagName);
  const regex = new RegExp(`<${escaped}>([\\s\\S]*?)</${escaped}>`, 'g');
  const fragments: { fullMatch: string; content: string; startIndex: number }[] = [];

  let match: RegExpExecArray | null;
  while ((match = regex.exec(message)) !== null) {
    fragments.push({
      fullMatch: match[0],
      content: match[1],
      startIndex: match.index,
    });
  }

  return fragments;
}

/**
 * 从 API 响应中提取输出标签内容，带补全尝试
 */
function extractOutputContent(responseText: string, outputTag: string): string | null {
  const escaped = _.escapeRegExp(outputTag);

  // 正常匹配
  const regex = new RegExp(`<${escaped}>([\\s\\S]*?)</${escaped}>`, 's');
  const match = responseText.match(regex);
  if (match) {
    return match[1];
  }

  // 尝试补全：有开始标签但缺少结束标签
  const openTag = `<${outputTag}>`;
  const openIdx = responseText.indexOf(openTag);
  if (openIdx !== -1) {
    const content = responseText.slice(openIdx + openTag.length).trim();
    if (content.length > 0) {
      console.info(`[${SCRIPT_NAME}] 输出标签不完整，已自动补全`);
      return content;
    }
  }

  // 尝试补全：没有标签，但整个响应看起来就是翻译结果
  const trimmed = responseText.trim();
  if (trimmed.length > 0 && !trimmed.startsWith('<') && !trimmed.includes('```')) {
    console.info(`[${SCRIPT_NAME}] 未找到输出标签，将整个响应视为翻译结果`);
    return trimmed;
  }

  return null;
}

/**
 * 替换消息 DOM 中的指定标签内容（虚假替换，仅修改显示）
 */
export function replaceDisplayedContent(
  messageId: number,
  tagName: string,
  fragmentIndex: number,
  translatedText: string,
) {
  const $mes = retrieveDisplayedMessage(messageId);
  if ($mes.length === 0) return;

  const html = $mes.html();
  const escaped = _.escapeRegExp(tagName);
  const regex = new RegExp(`(&lt;${escaped}&gt;)([\\s\\S]*?)(&lt;/${escaped}&gt;)`, 'g');

  let matchCount = 0;
  const newHtml = html.replace(regex, (fullMatch, openTag, _content, closeTag) => {
    if (matchCount === fragmentIndex) {
      matchCount++;
      return `${openTag}${translatedText}${closeTag}`;
    }
    matchCount++;
    return fullMatch;
  });

  if (matchCount > 0) {
    $mes.html(newHtml);
  } else {
    // HTML 中标签可能未被转义，尝试直接文本替换
    const textRegex = new RegExp(`(<${escaped}>)([\\s\\S]*?)(</${escaped}>)`, 'g');
    let textMatchCount = 0;
    const newHtml2 = html.replace(textRegex, (fullMatch, openTag, _content, closeTag) => {
      if (textMatchCount === fragmentIndex) {
        textMatchCount++;
        return `${openTag}${translatedText}${closeTag}`;
      }
      textMatchCount++;
      return fullMatch;
    });
    if (textMatchCount > 0) {
      $mes.html(newHtml2);
    }
  }
}

/**
 * 让用户选择要翻译的片段
 */
async function selectFragment(
  fragments: { content: string; startIndex: number }[],
): Promise<number> {
  if (fragments.length === 1) return 0;

  const listHtml = fragments
    .map((f, i) => {
      const preview = f.content.slice(0, 80).replace(/\n/g, ' ');
      return `<div class="translate-fragment-option" data-index="${i}" style="padding:8px 12px;margin:4px 0;border:1px solid #555;border-radius:6px;cursor:pointer;transition:background .15s">
        <b>片段 ${i + 1}</b>: ${_.escape(preview)}${f.content.length > 80 ? '...' : ''}
      </div>`;
    })
    .join('');

  const html = `<div style="max-height:400px;overflow-y:auto">
    <p style="margin-bottom:8px">消息中找到 ${fragments.length} 个匹配标签，请选择要翻译的片段：</p>
    ${listHtml}
  </div>`;

  return new Promise<number>(resolve => {
    const popup = new SillyTavern.Popup(html, SillyTavern.POPUP_TYPE.TEXT, undefined, {
      okButton: false,
      cancelButton: '取消',
      wide: true,
      onOpen: async (p: any) => {
        $(p.dlg)
          .find('.translate-fragment-option')
          .on('click', function () {
            const idx = parseInt($(this).data('index'), 10);
            resolve(idx);
            p.completeAffirmative();
          })
          .on('mouseenter', function () {
            $(this).css('background', 'rgba(100,100,255,0.15)');
          })
          .on('mouseleave', function () {
            $(this).css('background', '');
          });
      },
      onClosing: async () => {
        resolve(-1);
        return true;
      },
    });
    popup.show();
  });
}

/**
 * 构建发送给副 API 的消息列表
 */
function buildMessages(
  translationContent: string,
): { role: string; content: string }[] {
  const store = useSettingsStore();
  const preset = store.currentPreset;
  if (!preset) return [];

  const messages: { role: string; content: string }[] = [];

  for (const entry of preset.entries) {
    if (entry.type === 'history') {
      messages.push({ role: entry.role, content: translationContent });
    } else {
      messages.push({ role: entry.role, content: entry.content });
    }
  }

  return messages;
}

/**
 * 主翻译函数
 */
export async function translateMessage(messageId: number): Promise<void> {
  const store = useSettingsStore();
  const s = store.settings;

  // 检查 API Key
  if (!s.apiKey) {
    toastr.warning('请先在翻译设置中配置 API Key', SCRIPT_NAME);
    return;
  }

  if (!s.model) {
    toastr.warning('请先在翻译设置中配置模型名称', SCRIPT_NAME);
    return;
  }

  // 取消之前的任务
  cancelCurrentTask();

  // 创建新的 AbortController
  const abortController = new AbortController();
  currentAbortController = abortController;

  const startTime = Date.now();

  emitTaskState({
    status: 'running',
    messageId,
    startTime,
    elapsed: 0,
  });

  // 启动计时器
  const timerInterval = setInterval(() => {
    if (currentTaskState?.status === 'running' && currentTaskState.messageId === messageId) {
      emitTaskState({
        ...currentTaskState,
        elapsed: Date.now() - startTime,
      });
    } else {
      clearInterval(timerInterval);
    }
  }, 100);

  try {
    // 1. 读取消息
    const chatMessages = getChatMessages(messageId);
    if (chatMessages.length === 0) {
      clearInterval(timerInterval);
      emitTaskState({ status: 'failed', messageId, startTime, elapsed: Date.now() - startTime, error: '未找到消息' });
      return;
    }

    const rawMessage = chatMessages[0].message;

    // 2. 提取标签
    const fragments = extractTagFragments(rawMessage, s.inputTag);

    if (fragments.length === 0) {
      clearInterval(timerInterval);
      emitTaskState({ status: 'skipped', messageId, startTime, elapsed: Date.now() - startTime });
      return;
    }

    // 3. 多个片段让用户选择
    let fragmentIndex = 0;
    if (fragments.length > 1) {
      fragmentIndex = await selectFragment(fragments);
      if (fragmentIndex < 0) {
        clearInterval(timerInterval);
        emitTaskState({ status: 'cancelled', messageId, startTime, elapsed: Date.now() - startTime });
        return;
      }
    }

    if (abortController.signal.aborted) {
      clearInterval(timerInterval);
      return;
    }

    const contentToTranslate = fragments[fragmentIndex].content;

    // 4. 构建消息列表
    const messages = buildMessages(contentToTranslate);

    // 5. 调用 API（带重试）
    let lastError = '';
    let response: ApiResponse | null = null;
    const maxAttempts = s.maxRetries + 1;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (abortController.signal.aborted) {
        clearInterval(timerInterval);
        return;
      }

      if (attempt > 0) {
        console.info(`[${SCRIPT_NAME}] 重试第 ${attempt} 次...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }

      try {
        const apiResult = await callTranslateApi({
          provider: s.provider,
          apiKey: s.apiKey,
          baseUrl: s.baseUrl,
          endpoint: store.endpoint,
          model: s.model,
          temperature: s.temperature,
          topP: s.topP,
          topK: s.topK,
          maxTokens: s.maxTokens,
          timeout: s.timeout,
          messages,
          signal: abortController.signal,
        });

        // 6. 从响应中提取翻译结果
        const translated = extractOutputContent(apiResult.content, s.outputTag);

        if (translated !== null) {
          response = { content: translated, usage: apiResult.usage };
          break;
        } else {
          lastError = '输出中未找到匹配标签';
          console.warn(`[${SCRIPT_NAME}] ${lastError}，响应内容: ${apiResult.content.slice(0, 200)}`);
        }
      } catch (err: any) {
        if (abortController.signal.aborted) {
          clearInterval(timerInterval);
          return;
        }
        lastError = err.message || '未知错误';

        // 不可重试的错误直接终止
        if (err.noRetry) {
          break;
        }
      }
    }

    clearInterval(timerInterval);

    if (abortController.signal.aborted) return;

    if (!response) {
      emitTaskState({
        status: 'failed',
        messageId,
        startTime,
        elapsed: Date.now() - startTime,
        error: lastError,
      });
      return;
    }

    // 7. 替换显示
    replaceDisplayedContent(messageId, s.inputTag, fragmentIndex, response.content);

    // 8. 缓存译文
    const chatId = SillyTavern.getCurrentChatId();
    const cacheKey = `${chatId}_${messageId}`;
    s.translationCache[cacheKey] = {
      original: contentToTranslate,
      translated: response.content,
      tagName: s.inputTag,
      fragmentIndex,
      timestamp: Date.now(),
    } as CachedTranslation;

    // 9. 成功状态
    emitTaskState({
      status: 'success',
      messageId,
      startTime,
      elapsed: Date.now() - startTime,
      usage: response.usage
        ? { prompt_tokens: response.usage.prompt_tokens, completion_tokens: response.usage.completion_tokens }
        : undefined,
    });
  } catch (err: any) {
    clearInterval(timerInterval);
    if (!abortController.signal.aborted) {
      emitTaskState({
        status: 'failed',
        messageId,
        startTime,
        elapsed: Date.now() - startTime,
        error: err.message || '未知错误',
      });
    }
  }
}

/**
 * 恢复已缓存的译文显示
 */
export function restoreCachedTranslation(messageId: number) {
  const store = useSettingsStore();
  const chatId = SillyTavern.getCurrentChatId();
  const cacheKey = `${chatId}_${messageId}`;
  const cached = store.settings.translationCache[cacheKey];

  if (cached) {
    replaceDisplayedContent(messageId, cached.tagName, cached.fragmentIndex, cached.translated);
  }
}

/**
 * 恢复当前聊天所有已缓存的译文
 */
export function restoreAllCachedTranslations() {
  const store = useSettingsStore();
  const chatId = SillyTavern.getCurrentChatId();
  const prefix = `${chatId}_`;

  for (const [key, cached] of Object.entries(store.settings.translationCache)) {
    if (key.startsWith(prefix)) {
      const messageId = parseInt(key.slice(prefix.length), 10);
      if (!isNaN(messageId)) {
        try {
          replaceDisplayedContent(messageId, cached.tagName, cached.fragmentIndex, cached.translated);
        } catch {
          /* ignore - 楼层可能不存在 */
        }
      }
    }
  }
}
