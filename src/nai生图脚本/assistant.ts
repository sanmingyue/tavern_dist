import { DEFAULT_ASSISTANT_SYSTEM_PROMPT, type NaiAssistantMessage, type NaiSettings } from './store';

export type AssistantModel = {
  id: string;
};

const COMPLETION_MARKER = '<<<NAI_PROMPT_DONE>>>';

export async function fetchAssistantModels(settings: NaiSettings): Promise<string[]> {
  const response = await fetch(`${normalizeBaseUrl(settings.assistantBaseUrl)}/models`, {
    method: 'GET',
    headers: buildAssistantHeaders(settings),
  });

  if (!response.ok) throw new Error(await readAssistantError(response, '拉取模型失败'));

  const data = (await response.json()) as { data?: AssistantModel[] };
  const models = (data.data ?? [])
    .map(model => model.id)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  if (models.length === 0) throw new Error('接口已连接，但没有返回可用模型。');
  return models;
}

export async function requestAssistantReply(settings: NaiSettings, messages: NaiAssistantMessage[]): Promise<string> {
  if (!settings.assistantModel.trim()) throw new Error('请先拉取并选择一个模型。');

  const requestMessages = [
    { role: 'system', content: DEFAULT_ASSISTANT_SYSTEM_PROMPT },
    ...messages.map(message => ({
      role: message.role,
      content: message.content,
    })),
  ];

  const response = await fetch(`${normalizeBaseUrl(settings.assistantBaseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      ...buildAssistantHeaders(settings),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.assistantModel.trim(),
      temperature: settings.assistantTemperature,
      max_tokens: settings.assistantMaxTokens,
      stream: false,
      messages: requestMessages,
    }),
  });

  if (!response.ok) throw new Error(await readAssistantError(response, '提示词助手请求失败'));

  const data = (await response.json()) as AssistantCompletionResponse;
  let content = readAssistantContent(data);
  if (!content.trim()) throw new Error('模型返回为空。');

  if (needsContinuation(content, data.choices?.[0]?.finish_reason)) {
    const continuation = await requestAssistantContinuation(settings, requestMessages, content);
    if (continuation.trim()) {
      content = `${content}\n${continuation}`;
    }
  }

  return stripCompletionMarker(content).trim();
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function buildAssistantHeaders(settings: NaiSettings): Record<string, string> {
  const key = settings.assistantApiKey.trim();
  if (!key) throw new Error('请先填写提示词助手 API Key。');
  return {
    Authorization: `Bearer ${key}`,
  };
}

async function readAssistantError(response: Response, fallback: string): Promise<string> {
  const body = await response.text().catch(() => '');
  if (!body.trim()) return `${fallback}：HTTP ${response.status} ${response.statusText}`;

  try {
    const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
    return parsed.error?.message ?? parsed.message ?? body.slice(0, 500);
  } catch {
    return body.slice(0, 500);
  }
}

type AssistantCompletionResponse = {
  choices?: Array<{
    finish_reason?: string | null;
    message?: { content?: string };
    text?: string;
  }>;
};

type OpenAiMessage = {
  role: string;
  content: string;
};

async function requestAssistantContinuation(
  settings: NaiSettings,
  messages: OpenAiMessage[],
  previousContent: string,
): Promise<string> {
  const response = await fetch(`${normalizeBaseUrl(settings.assistantBaseUrl)}/chat/completions`, {
    method: 'POST',
    headers: {
      ...buildAssistantHeaders(settings),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.assistantModel.trim(),
      temperature: settings.assistantTemperature,
      max_tokens: settings.assistantMaxTokens,
      stream: false,
      messages: [
        ...messages,
        { role: 'assistant', content: previousContent },
        {
          role: 'user',
          content:
            '上一条内容疑似被截断。不要重复已经写完的内容，从中断处继续补完剩余提示词、YAML 或说明，并在最后单独输出 <<<NAI_PROMPT_DONE>>>。',
        },
      ],
    }),
  });

  if (!response.ok) throw new Error(await readAssistantError(response, '提示词助手续写失败'));
  return readAssistantContent((await response.json()) as AssistantCompletionResponse);
}

function readAssistantContent(data: AssistantCompletionResponse): string {
  return data.choices?.[0]?.message?.content ?? data.choices?.[0]?.text ?? '';
}

function stripCompletionMarker(content: string): string {
  return content.replaceAll(COMPLETION_MARKER, '').trim();
}

function needsContinuation(content: string, finishReason?: string | null): boolean {
  if (content.includes(COMPLETION_MARKER)) return false;
  if (finishReason === 'length') return true;
  return hasOpenTag(content, 'nai-image') || hasOpenFence(content);
}

function hasOpenTag(content: string, tag: string): boolean {
  const open = new RegExp(`<${tag}>`, 'gi');
  const close = new RegExp(`</${tag}>`, 'gi');
  return (content.match(open)?.length ?? 0) > (content.match(close)?.length ?? 0);
}

function hasOpenFence(content: string): boolean {
  return (content.match(/```/g)?.length ?? 0) % 2 === 1;
}
