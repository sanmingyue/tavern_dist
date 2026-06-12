export interface PhoneFeedbackPayload {
  type?: 'app_action';
  appId: string;
  appName: string;
  action: string;
  summary: string;
  data?: Record<string, unknown>;
  timestamp?: number;
}

export interface PhoneFeedbackResult {
  ok: boolean;
  text: string;
  error?: string;
}

const PROMPT_INPUT_SELECTORS = [
  '#send_textarea',
  'textarea.mdHotkeys[placeholder*="发送"]',
  'textarea[placeholder*="想发送"]',
  'textarea[placeholder*="/?"]',
  'textarea[name="send_textarea"]',
  '[contenteditable="true"][role="textbox"][aria-label*="发送"]',
  '[contenteditable="true"][role="textbox"][aria-label*="message"]',
];

function getHostDocument(): Document {
  try {
    return window.parent?.document ?? document;
  } catch {
    return document;
  }
}

function findPromptInput(): JQuery<HTMLElement> {
  const hostDocument = getHostDocument();
  for (const selector of PROMPT_INPUT_SELECTORS) {
    const $inputs = $(selector, hostDocument);
    const $visibleInput = $inputs
      .filter((_index, element) => {
        const hostWindow = hostDocument.defaultView ?? window;
        const rect = element.getBoundingClientRect();
        return (
          Boolean(element.offsetWidth || element.offsetHeight || element.getClientRects().length) &&
          rect.bottom > 0 &&
          rect.right > 0 &&
          rect.top < hostWindow.innerHeight &&
          rect.left < hostWindow.innerWidth
        );
      })
      .first();
    if ($visibleInput.length > 0) {
      return $visibleInput as JQuery<HTMLElement>;
    }
  }

  const $sendTextarea = $('#send_textarea', hostDocument).first();
  if ($sendTextarea.length > 0) {
    return $sendTextarea as JQuery<HTMLElement>;
  }

  return $();
}

function normalizeText(currentText: string, appendedText: string): string {
  const separator = currentText.trim() ? '\n' : '';
  return `${currentText}${separator}${appendedText}`;
}

function setPromptText($input: JQuery<HTMLElement>, text: string): boolean {
  const element = $input[0];
  if (!element) return false;

  if ($input.is('textarea,input')) {
    const currentValue = String($input.val() ?? '');
    $input.val(normalizeText(currentValue, text));
  } else if (element.isContentEditable) {
    const currentValue = element.textContent ?? '';
    element.textContent = normalizeText(currentValue, text);
  } else {
    return false;
  }

  $input.trigger('input');
  $input.trigger('change');
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.focus();
  return true;
}

function stringifyFeedback(payload: PhoneFeedbackPayload): string {
  const normalized: Required<Omit<PhoneFeedbackPayload, 'data'>> & { data?: Record<string, unknown> } = {
    type: 'app_action',
    appId: payload.appId,
    appName: payload.appName,
    action: payload.action,
    summary: payload.summary,
    timestamp: payload.timestamp ?? Date.now(),
  };

  if (payload.data) {
    normalized.data = payload.data;
  }

  return JSON.stringify(normalized, null, 2).replace(/</g, '\\u003C');
}

export function formatPhoneFeedback(payload: PhoneFeedbackPayload): string {
  return `<小手机>\n${stringifyFeedback(payload)}\n</小手机>`;
}

export function appendPhoneFeedback(payload: PhoneFeedbackPayload): PhoneFeedbackResult {
  const text = formatPhoneFeedback(payload);
  const $input = findPromptInput();

  if ($input.length === 0) {
    return { ok: false, text, error: '未找到酒馆输入框' };
  }

  if (!setPromptText($input, text)) {
    return { ok: false, text, error: '输入框类型不支持写入' };
  }

  return { ok: true, text };
}
