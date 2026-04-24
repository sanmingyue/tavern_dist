import type { ApiProvider, ApiResponse } from './types';
import { SUPPORTS_TOP_K, SCRIPT_NAME } from './types';

interface ApiCallOptions {
  provider: ApiProvider;
  apiKey: string;
  baseUrl: string;
  endpoint: string;
  model: string;
  temperature: number;
  topP: number;
  topK?: number;
  maxTokens: number;
  timeout: number;
  messages: { role: string; content: string }[];
  signal?: AbortSignal;
}

/**
 * 构建请求 headers
 */
function buildHeaders(provider: ApiProvider, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Gemini 使用 query 参数传递 key，不需要 Authorization header
  if (provider !== 'gemini') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  // OpenRouter 需要额外 header
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
  }

  return headers;
}

/**
 * 构建请求 body
 */
function buildRequestBody(options: ApiCallOptions): Record<string, any> {
  const body: Record<string, any> = {
    model: options.model,
    messages: options.messages,
    temperature: options.temperature,
    top_p: options.topP,
    max_tokens: options.maxTokens,
    stream: false,
  };

  // top_k 仅部分提供商支持
  if (options.topK !== undefined && SUPPORTS_TOP_K.has(options.provider)) {
    body.top_k = options.topK;
  }

  return body;
}

/**
 * 构建最终请求 URL（处理 Gemini 的 key 参数）
 */
function buildUrl(endpoint: string, provider: ApiProvider, apiKey: string): string {
  if (provider === 'gemini') {
    const separator = endpoint.includes('?') ? '&' : '?';
    return `${endpoint}${separator}key=${apiKey}`;
  }
  return endpoint;
}

/**
 * 解析 API 响应
 */
function parseResponse(data: any): ApiResponse {
  const choice = data?.choices?.[0];
  const content = choice?.message?.content ?? '';
  const usage = data?.usage
    ? {
        prompt_tokens: data.usage.prompt_tokens ?? 0,
        completion_tokens: data.usage.completion_tokens ?? 0,
        total_tokens: data.usage.total_tokens,
      }
    : undefined;

  return { content, usage };
}

/**
 * 直接 fetch 外部 API
 */
async function fetchDirect(options: ApiCallOptions): Promise<Response> {
  const url = buildUrl(options.endpoint, options.provider, options.apiKey);
  const headers = buildHeaders(options.provider, options.apiKey);
  const body = buildRequestBody(options);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);

  // 如果外部已提供 signal，联动取消
  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 通过酒馆后端代理调用 API
 * 利用酒馆的 /api/backends/chat-completions/generate 路径
 */
async function fetchViaProxy(options: ApiCallOptions): Promise<Response> {
  const tavernHeaders = SillyTavern.getRequestHeaders();
  const body = buildRequestBody(options);

  // 构建酒馆代理请求的额外参数
  const proxyBody: Record<string, any> = {
    ...body,
    // 酒馆代理需要的字段
    reverse_proxy: options.endpoint,
    proxy_password: options.apiKey,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout);

  if (options.signal) {
    if (options.signal.aborted) {
      controller.abort();
    } else {
      options.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  try {
    const response = await fetch('/api/backends/chat-completions/generate', {
      method: 'POST',
      headers: {
        ...tavernHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(proxyBody),
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 判断是否为 CORS 错误
 */
function isCorsError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    return msg.includes('failed to fetch') || msg.includes('network') || msg.includes('cors');
  }
  return false;
}

/**
 * 判断 HTTP 状态码是否应该重试
 */
export function shouldRetry(status: number): boolean {
  if (status >= 500) return true;
  if (status === 429) return true;
  return false;
}

/**
 * 主调用函数：优先直接 fetch，CORS 失败则回退酒馆代理
 */
export async function callTranslateApi(options: ApiCallOptions): Promise<ApiResponse> {
  let response: Response;
  let usedProxy = false;

  try {
    // 优先直接 fetch
    response = await fetchDirect(options);
  } catch (directError: unknown) {
    if (options.signal?.aborted) {
      throw new Error('翻译已取消');
    }

    // 如果是 CORS 错误，尝试酒馆代理
    if (isCorsError(directError)) {
      console.info(`[${SCRIPT_NAME}] 直接请求失败(CORS)，尝试酒馆代理...`);
      try {
        response = await fetchViaProxy(options);
        usedProxy = true;
      } catch (proxyError: unknown) {
        if (options.signal?.aborted) {
          throw new Error('翻译已取消');
        }
        throw new Error(`API 请求失败：直接请求遇到 CORS 限制，代理请求也失败`);
      }
    } else {
      throw directError;
    }
  }

  // 处理 HTTP 错误
  if (!response.ok) {
    const status = response.status;
    let errorText = '';
    try {
      errorText = await response.text();
    } catch {
      /* ignore */
    }

    const errorMsg = `API 返回错误：${status} ${response.statusText}${errorText ? ` - ${errorText.slice(0, 200)}` : ''}`;

    if (!shouldRetry(status)) {
      // 4xx（非 429）不重试，直接抛出标记
      const err = new Error(errorMsg) as Error & { noRetry: boolean };
      err.noRetry = true;
      throw err;
    }

    throw new Error(errorMsg);
  }

  // 解析响应
  const data = await response.json();
  const result = parseResponse(data);

  if (usedProxy) {
    console.info(`[${SCRIPT_NAME}] 通过酒馆代理成功调用 API`);
  }

  return result;
}
