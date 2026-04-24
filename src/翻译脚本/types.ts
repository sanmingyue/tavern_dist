import { uuidv4 } from '@util/common';

// ─── API 提供商 ───
export type ApiProvider = 'openai' | 'gemini' | 'openrouter' | 'deepseek' | 'custom';

export const PROVIDER_LABELS: Record<ApiProvider, string> = {
  openai: 'OpenAI',
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
  deepseek: 'DeepSeek',
  custom: '自定义 (OpenAI 兼容)',
};

export const PROVIDER_ENDPOINTS: Record<Exclude<ApiProvider, 'custom'>, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
};

// 支持 top_k 参数的提供商
export const SUPPORTS_TOP_K: Set<ApiProvider> = new Set(['gemini', 'openrouter', 'deepseek', 'custom']);

// ─── 预设条目 ───
export interface PresetEntry {
  id: string;
  type: 'normal' | 'history';
  role: 'system' | 'user' | 'assistant';
  content: string;
  label?: string;
}

export interface TranslatePreset {
  id: string;
  name: string;
  entries: PresetEntry[];
}

export function createDefaultPreset(): TranslatePreset {
  return {
    id: 'default',
    name: '默认翻译预设',
    entries: [
      {
        id: uuidv4(),
        type: 'normal',
        role: 'system',
        content:
          '你是一个专业的翻译引擎。请将用户提供的文本翻译为中文，保持原文的语气和风格。将翻译结果放在 <translated></translated> 标签内输出。只输出翻译结果，不要添加任何解释。',
      },
      {
        id: uuidv4(),
        type: 'history',
        role: 'user',
        content: '',
      },
    ],
  };
}

// ─── 翻译任务状态 ───
export type TaskStatus = 'idle' | 'running' | 'success' | 'failed' | 'skipped' | 'cancelled';

export interface TaskState {
  status: TaskStatus;
  messageId: number;
  startTime: number;
  elapsed: number;
  error?: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

// ─── 译文缓存 ───
export interface CachedTranslation {
  original: string;
  translated: string;
  tagName: string;
  fragmentIndex: number;
  timestamp: number;
}

// ─── API 响应 ───
export interface ApiResponse {
  content: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens?: number;
  };
}

// ─── 常量 ───
export const SCRIPT_NAME = '异步翻译脚本';
export const FAB_POS_KEY = 'translate-script-fab-pos';
export const RETRY_DELAY = 2000;
export const STATUS_SUCCESS_DURATION = 8000;
export const STATUS_SKIP_DURATION = 3000;
