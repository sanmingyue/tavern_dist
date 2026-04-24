import { klona } from 'klona';
import type { ApiProvider, TranslatePreset } from './types';
import { createDefaultPreset } from './types';

// ─── Zod Schema ───
const PresetEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['normal', 'history']),
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().prefault(''),
  label: z.string().optional(),
});

const TranslatePresetSchema = z.object({
  id: z.string(),
  name: z.string(),
  entries: z.array(PresetEntrySchema).prefault([]),
});

const CachedTranslationSchema = z.object({
  original: z.string(),
  translated: z.string(),
  tagName: z.string(),
  fragmentIndex: z.coerce.number().prefault(0),
  timestamp: z.coerce.number().prefault(0),
});

const Settings = z
  .object({
    autoTranslate: z.boolean().prefault(false),
    provider: z
      .enum(['openai', 'gemini', 'openrouter', 'deepseek', 'custom'])
      .prefault('openai' as const),
    apiKey: z.string().prefault(''),
    baseUrl: z.string().prefault(''),
    model: z.string().prefault(''),
    temperature: z.coerce
      .number()
      .transform(v => _.clamp(v, 0, 2))
      .prefault(1),
    topP: z.coerce
      .number()
      .transform(v => _.clamp(v, 0, 1))
      .prefault(1),
    topK: z.coerce.number().optional(),
    maxTokens: z.coerce.number().prefault(8192),
    inputTag: z.string().prefault('content'),
    outputTag: z.string().prefault('translated'),
    maxRetries: z.coerce
      .number()
      .transform(v => _.clamp(v, 0, 10))
      .prefault(3),
    timeout: z.coerce.number().prefault(60000),
    currentPresetId: z.string().prefault('default'),
    presets: z.array(TranslatePresetSchema).prefault([]),
    translationCache: z.record(z.string(), CachedTranslationSchema).prefault({}),
  })
  .prefault({});

export type SettingsType = z.infer<typeof Settings>;

export const useSettingsStore = defineStore('translate-settings', () => {
  const raw = getVariables({ type: 'script', script_id: getScriptId() });
  const parsed = Settings.parse(raw);

  // 如果没有预设则插入默认预设
  if (parsed.presets.length === 0) {
    parsed.presets.push(createDefaultPreset());
  }

  const settings = ref(parsed);

  // 持久化到脚本变量
  watchEffect(() => {
    replaceVariables(klona(settings.value), { type: 'script', script_id: getScriptId() });
  });

  // 获取当前激活的预设
  const currentPreset = computed(() => {
    return (
      settings.value.presets.find(p => p.id === settings.value.currentPresetId) ??
      settings.value.presets[0]
    );
  });

  // 获取 API endpoint
  const endpoint = computed(() => {
    const provider = settings.value.provider;
    if (provider === 'custom') {
      const base = settings.value.baseUrl.replace(/\/+$/, '');
      return `${base}/chat/completions`;
    }
    const endpoints: Record<string, string> = {
      openai: 'https://api.openai.com/v1/chat/completions',
      gemini: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      openrouter: 'https://openrouter.ai/api/v1/chat/completions',
      deepseek: 'https://api.deepseek.com/v1/chat/completions',
    };
    return endpoints[provider] ?? '';
  });

  return { settings, currentPreset, endpoint };
});
