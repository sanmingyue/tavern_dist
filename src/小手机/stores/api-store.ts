import { defineStore } from 'pinia';
import type { ApiConfig } from '../schema';

/* ─── API Store ─── */
export const useApiStore = defineStore('mini-phone-api', () => {
  /* API 配置 */
  const config = ref<ApiConfig | null>(null);
  const isConfigured = computed(() => config.value !== null && !!config.value.apiurl && !!config.value.model);

  /* 调用状态 */
  const isLoading = ref(false);
  const lastError = ref<string | null>(null);
  const lastResponse = ref<string | null>(null);

  /* 历史记录 */
  const history = ref<
    Array<{
      prompt: string;
      response: string;
      timestamp: number;
      appId: string;
    }>
  >([]);

  /* ─── 方法 ─── */

  function setConfig(newConfig: ApiConfig): void {
    config.value = newConfig;
    persistConfig();
  }

  function clearConfig(): void {
    config.value = null;
    persistConfig();
  }

  function persistConfig(): void {
    try {
      window.parent.localStorage.setItem('mini-phone-api-config', JSON.stringify(config.value));
    } catch {
      /* ignore */
    }
  }

  function loadConfig(): void {
    try {
      const raw = window.parent.localStorage.getItem('mini-phone-api-config');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.encrypted === true && parsed?.version === 2) {
          window.parent.localStorage.removeItem('mini-phone-api-config');
          config.value = null;
          return;
        }
        config.value = parsed;
      }
    } catch {
      /* ignore */
    }
  }

  /**
   * 调用 AI API
   * @param prompt 用户输入
   * @param appId 调用的APP ID（用于上下文）
   * @param systemPrompt 可选的系统提示词
   */
  async function call(prompt: string, appId: string = 'default', systemPrompt?: string): Promise<string> {
    if (!isConfigured.value) {
      throw new Error('API 未配置，请先在设置中配置 API');
    }

    isLoading.value = true;
    lastError.value = null;

    try {
      const orderedPrompts: Array<
        'char_description' | 'chat_history' | 'user_input' | { role: 'system'; content: string }
      > = ['char_description', 'chat_history', 'user_input'];

      const systemContents: string[] = [];
      if (systemPrompt) {
        systemContents.push(systemPrompt);
      }

      const response = await generateRaw({
        user_input: prompt,
        custom_api: config.value!,
        ordered_prompts: orderedPrompts,
        injects: systemContents.map(content => ({
          role: 'system' as const,
          content,
          position: 'in_chat' as const,
          depth: 0,
          should_scan: true,
        })),
      });

      lastResponse.value = response;

      history.value.unshift({
        prompt,
        response,
        timestamp: Date.now(),
        appId,
      });

      if (history.value.length > 100) {
        history.value = history.value.slice(0, 100);
      }

      return response;
    } catch (e) {
      lastError.value = e instanceof Error ? e.message : '未知错误';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 调用 AI API（流式版本）
   */
  async function callStream(
    prompt: string,
    appId: string = 'default',
    onChunk: (text: string) => void,
    systemPrompt?: string,
  ): Promise<string> {
    if (!isConfigured.value) {
      throw new Error('API 未配置，请先在设置中配置 API');
    }

    isLoading.value = true;
    lastError.value = null;
    let fullResponse = '';

    try {
      const orderedPrompts: Array<
        'char_description' | 'chat_history' | 'user_input' | { role: 'system'; content: string }
      > = ['char_description', 'chat_history', 'user_input'];

      const systemContents: string[] = [];
      if (systemPrompt) {
        systemContents.push(systemPrompt);
      }

      // 监听流式事件
      const handler = eventOn(iframe_events.STREAM_TOKEN_RECEIVED_INCREMENTALLY, (token: string) => {
        fullResponse += token;
        onChunk(token);
      });

      await generateRaw({
        user_input: prompt,
        custom_api: config.value!,
        ordered_prompts: orderedPrompts,
        injects: systemContents.map(content => ({
          role: 'system' as const,
          content,
          position: 'in_chat' as const,
          depth: 0,
          should_scan: true,
        })),
        should_stream: true,
      });

      handler.stop();

      lastResponse.value = fullResponse;

      history.value.unshift({
        prompt,
        response: fullResponse,
        timestamp: Date.now(),
        appId,
      });

      return fullResponse;
    } catch (e) {
      lastError.value = e instanceof Error ? e.message : '未知错误';
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 停止当前生成
   */
  function stopGeneration(): void {
    stopAllGeneration();
  }

  /**
   * 清除历史
   */
  function clearHistory(): void {
    history.value = [];
  }

  return {
    config,
    isConfigured,
    isLoading,
    lastError,
    lastResponse,
    history,
    setConfig,
    clearConfig,
    loadConfig,
    call,
    callStream,
    stopGeneration,
    clearHistory,
  };
});
