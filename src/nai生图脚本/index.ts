import { createScriptIdDiv, reloadOnChatChange, teleportStyle } from '@util/script';
import App from './App.vue';
import {
  blobToDataUrl,
  deleteExpiredCachedImages,
  getCachedImage,
  putCachedImage,
  saveCachedImage,
  type NaiCachedImageMeta,
} from './cache';
import {
  buildNaiPayload,
  downloadImage,
  getCostWarnings,
  parseImageBlock,
  renderDownloadName,
  requestNaiImages,
  translateUnknownError,
  type NaiBlockConfig,
  type NaiImageRequest,
} from './nai';
import { useNaiStore } from './store';

const SCRIPT_STATE_KEY = 'nai_image_script';
const RENDER_CLASS = 'nai-image-render';
const REGENERATE_CLASS = 'nai-image-regenerate';
const SAVE_CLASS = 'nai-image-save';
const processingMessageIds = new Set<number>();
const renderTimers = new Map<number, ReturnType<typeof setTimeout>>();
const renderVersions = new Map<number, number>();
let hasShownAnlasWarning = false;

type NaiMessageImageState = {
  version: 2 | 3;
  fingerprint: string;
  raw: string;
  config: Partial<NaiBlockConfig>;
  status: 'captured' | 'generating' | 'ready' | 'blocked_anlas' | 'error';
  model?: string;
  seed?: number;
  width?: number;
  height?: number;
  generated_at?: string;
  cache?: NaiCachedImageMeta;
  caches?: NaiCachedImageMeta[];
  last_error?: string;
  anlas_warnings?: string[];
};

function buildFingerprint(raw: string, model: string): string {
  return JSON.stringify({ raw, model });
}

function createCapturedState(raw: string, config: NaiBlockConfig, model: string): NaiMessageImageState {
  return {
    version: 3,
    fingerprint: buildFingerprint(raw, config.model ?? model),
    raw,
    config,
    status: 'captured',
  };
}

function getImageState(message: ChatMessage): NaiMessageImageState | null {
  const state = _.get(message.data, SCRIPT_STATE_KEY);
  if (!_.isPlainObject(state)) return null;
  if (![2, 3].includes(Number(_.get(state, 'version')))) return null;
  if (!_.isString(_.get(state, 'raw'))) return null;

  const imageState = state as NaiMessageImageState;
  if (imageState.version === 2 && imageState.cache && !imageState.caches) {
    return { ...imageState, version: 3, caches: [imageState.cache] };
  }
  return imageState;
}

async function setMessageState(
  message: ChatMessage,
  state: NaiMessageImageState,
  nextMessage = message.message,
): Promise<void> {
  const data = _.isPlainObject(message.data) ? { ...(message.data as Record<string, unknown>) } : {};
  data[SCRIPT_STATE_KEY] = state;
  await setChatMessages([
    {
      message_id: message.message_id,
      message: nextMessage,
      data,
    },
  ]);
  queueRenderMessageImage(message.message_id);
}

function shouldBlockForAnlas(warnings: string[], paidMode: 'block' | 'warn' | 'allow'): boolean {
  return warnings.length > 0 && paidMode === 'block';
}

function showAnlasWarningOnce(warnings: string[]): void {
  if (warnings.length === 0) {
    hasShownAnlasWarning = false;
    return;
  }
  if (hasShownAnlasWarning) return;
  hasShownAnlasWarning = true;
  toastr.warning('当前参数已超出会员免费生图范围，生成可能消耗 Anlas。', 'NAI Anlas 提醒');
}

async function generateForMessage(
  message: ChatMessage,
  state: NaiMessageImageState,
  pinia: ReturnType<typeof createPinia>,
): Promise<void> {
  if (processingMessageIds.has(message.message_id)) return;

  const store = useNaiStore(pinia);
  const settings = store.settings;
  const warnings = getCostWarnings(settings, state.config);
  showAnlasWarningOnce(warnings);

  if (shouldBlockForAnlas(warnings, settings.paidMode)) {
    const blockedState: NaiMessageImageState = {
      ...state,
      status: 'blocked_anlas',
      anlas_warnings: warnings,
    };
    await setMessageState(message, blockedState);
    store.setLastLog({
      level: 'warning',
      title: '已阻止可能消耗 Anlas 的请求',
      message: warnings.join('\n'),
      solution: '把参数改回会员免费范围，或在面板中把策略改为“提醒后允许”或“直接允许”。',
      detail: state.raw,
    });
    toastr.warning('当前参数已超出会员免费生图范围，已按“免费优先”策略阻止。');
    return;
  }

  processingMessageIds.add(message.message_id);
  const generatingState: NaiMessageImageState = {
    ...state,
    status: 'generating',
    anlas_warnings: warnings,
    last_error: undefined,
  };
  await setMessageState(message, generatingState);
  store.setLastLog({
    level: 'info',
    title: '正在生图',
    message: `正在处理第 ${message.message_id} 楼。`,
    solution: '请等待 NovelAI 返回图片，期间不要重复点击重新生成。',
    detail: state.raw,
  });

  try {
    const payload = buildNaiPayload(settings, state.config);
    const images = await requestNaiImages(settings, payload);
    const downloadNames = images.map((image, index) => {
      const ext = image.mimeType.includes('webp') ? 'webp' : 'png';
      return renderIndexedDownloadName(settings.downloadNameTemplate, {
        messageId: message.message_id,
        seed: image.seed,
        ext,
        index,
        total: images.length,
      });
    });
    const caches = await Promise.all(
      images.map((image, index) => putCachedImage(image, downloadNames[index], settings.imageTtlDays)),
    );

    if (settings.autoDownload || settings.storageMode === 'download') {
      images.forEach((image, index) => downloadImage(image, downloadNames[index]));
    }

    const readyState: NaiMessageImageState = {
      ...state,
      status: 'ready',
      model: payload.model,
      seed: images[0]?.seed,
      width: Number(payload.parameters.width),
      height: Number(payload.parameters.height),
      generated_at: new Date().toISOString(),
      cache: caches[0],
      caches,
      anlas_warnings: warnings,
      last_error: undefined,
    };
    await setMessageState(message, readyState);
    store.setLastLog({
      level: 'success',
      title: '生图成功',
      message: `第 ${message.message_id} 楼已生成 ${images.length} 张图片，首张 seed=${images[0]?.seed ?? '未知'}。`,
      solution:
        warnings.length > 0 ? `本次参数可能消耗 Anlas：\n${warnings.join('\n')}` : '当前参数处于会员免费生图范围内。',
      detail: buildPayloadDetail(payload, settings.storageMode, caches),
    });
    toastr.success(`第 ${message.message_id} 楼 NAI 生图完成。`);
  } catch (error) {
    const translated = translateUnknownError(error);
    const errorState: NaiMessageImageState = {
      ...state,
      status: 'error',
      last_error: translated.message,
      anlas_warnings: warnings,
    };
    await setMessageState(message, errorState);
    store.setLastLog({ level: 'error', ...translated });
    console.error('[NAI生图脚本] 处理失败', error);
    toastr.error(translated.message, translated.title);
  } finally {
    processingMessageIds.delete(message.message_id);
    queueRenderMessageImage(message.message_id);
  }
}

async function captureAndGenerateMessage(
  messageId: number,
  trigger: 'auto' | 'button',
  pinia: ReturnType<typeof createPinia>,
): Promise<void> {
  const store = useNaiStore(pinia);
  const settings = store.settings;
  if (!settings.enabled) return;

  const message = getChatMessages(messageId, { role: 'assistant' })[0];
  if (!message) {
    if (trigger === 'button') {
      store.setLastLog({
        level: 'warning',
        title: '未处理',
        message: '最新楼层不是 AI 楼层。',
        solution: '请切到包含 <nai-image> 块的 AI 楼层后再手动处理。',
        detail: `messageId=${messageId}`,
      });
      toastr.warning('最新楼层不是 AI 楼层，未处理。');
    }
    return;
  }

  let parsed: ReturnType<typeof parseImageBlock>;
  try {
    parsed = parseImageBlock(message.message);
  } catch (error) {
    const translated = translateUnknownError(error);
    store.setLastLog({ level: 'error', ...translated });
    toastr.error(translated.message, translated.title);
    return;
  }

  if (!parsed) {
    const state = getImageState(message);
    if (state && trigger === 'button') {
      await generateForMessage(message, state, pinia);
      return;
    }
    if (state) {
      queueRenderMessageImage(messageId);
      return;
    }
    if (trigger === 'button') {
      store.setLastLog({
        level: 'info',
        title: '没有找到生图块',
        message: '当前楼层没有 <nai-image>...</nai-image>。',
        solution: '让世界书在正文末尾输出生图 YAML 块，或手动编辑楼层追加生图块。',
        detail: `messageId=${messageId}`,
      });
      toastr.info('没有找到 <nai-image> 提示词块。');
    }
    return;
  }

  const state = createCapturedState(parsed.raw, parsed.config, settings.model);
  const oldState = getImageState(message);
  if (oldState?.fingerprint === state.fingerprint && getStateCaches(oldState).length > 0) {
    queueRenderMessageImage(messageId);
    return;
  }

  await setMessageState(message, state, parsed.cleanedMessage);
  const cleanedMessage = getChatMessages(messageId, { role: 'assistant' })[0] ?? {
    ...message,
    message: parsed.cleanedMessage,
    data: _.merge({}, message.data, { [SCRIPT_STATE_KEY]: state }),
  };
  await generateForMessage(cleanedMessage, state, pinia);
}

function processLatestMessage(trigger: 'auto' | 'button', pinia: ReturnType<typeof createPinia>): void {
  const messageId = getLastMessageId();
  if (messageId < 0) return;
  void captureAndGenerateMessage(messageId, trigger, pinia);
}

function queueRenderMessageImage(messageId: number): void {
  const oldTimer = renderTimers.get(messageId);
  if (oldTimer) clearTimeout(oldTimer);

  const timer = setTimeout(() => {
    renderTimers.delete(messageId);
    void renderMessageImage(messageId);
  }, 20);
  renderTimers.set(messageId, timer);
}

async function renderMessageImage(messageId: number): Promise<void> {
  const renderVersion = (renderVersions.get(messageId) ?? 0) + 1;
  renderVersions.set(messageId, renderVersion);

  const message = getChatMessages(messageId, { role: 'assistant' })[0];
  if (!message) return;

  const state = getImageState(message);
  const $message = retrieveDisplayedMessage(messageId);
  if ($message.length === 0) return;

  if (!state) {
    $message.find(`.${RENDER_CLASS}`).remove();
    return;
  }

  const $box = $('<div></div>').addClass(RENDER_CLASS).attr('data-message-id', String(messageId));
  const $status = $('<div></div>').addClass('nai-image-status').appendTo($box);
  const cachedMetas = getStateCaches(state);
  const records = (
    await Promise.all(
      cachedMetas.map(async meta => ({
        meta,
        record: await getCachedImage(meta.id),
      })),
    )
  ).filter(
    (item): item is { meta: NaiCachedImageMeta; record: NonNullable<Awaited<ReturnType<typeof getCachedImage>>> } =>
      Boolean(item.record),
  );

  if (state.status === 'generating') {
    $status.text('NAI 正在生成图片。');
  } else if (state.status === 'blocked_anlas') {
    $status.text('当前参数已超出会员免费生图范围，已阻止请求。');
  } else if (state.status === 'error') {
    $status.text(
      records.length > 0 && state.last_error
        ? `重新生成失败，已保留上一次缓存图片：${state.last_error}`
        : state.last_error
          ? `生成失败：${state.last_error}`
          : '生成失败。',
    );
  } else if (records.length > 0) {
    $status.text(formatCacheStatus(records));
  } else {
    $status.text('图片缓存已过期或被浏览器清理，可重新生成。');
  }

  for (const [index, item] of records.entries()) {
    const dataUrl = await blobToDataUrl(item.record.blob);
    $('<img />')
      .addClass('nai-image-preview')
      .attr('src', dataUrl)
      .attr('alt', `NAI 图片 ${index + 1} seed=${item.record.seed}`)
      .appendTo($box);
  }

  const $actions = $('<div></div>').addClass('nai-image-actions').appendTo($box);
  $('<button type="button"></button>')
    .addClass(REGENERATE_CLASS)
    .attr('data-message-id', String(messageId))
    .prop('disabled', processingMessageIds.has(messageId))
    .text(processingMessageIds.has(messageId) ? '生成中' : '重新生成')
    .appendTo($actions);

  for (const [index, item] of records.entries()) {
    $('<button type="button"></button>')
      .addClass(SAVE_CLASS)
      .attr('data-message-id', String(messageId))
      .attr('data-cache-id', item.record.id)
      .text(records.length > 1 ? `保存第 ${index + 1} 张` : '保存图片')
      .appendTo($actions);
  }

  if (renderVersions.get(messageId) !== renderVersion) return;
  $message.find(`.${RENDER_CLASS}`).remove();
  $message.append($box);
}

function renderVisibleImages(): void {
  const lastMessageId = getLastMessageId();
  if (lastMessageId < 0) return;
  for (const message of getChatMessages(`0-${lastMessageId}`, { role: 'assistant' })) {
    queueRenderMessageImage(message.message_id);
  }
}

async function handleRegenerateClick(event: JQuery.ClickEvent, pinia: ReturnType<typeof createPinia>): Promise<void> {
  const messageId = Number($(event.currentTarget).attr('data-message-id'));
  if (!Number.isInteger(messageId)) return;

  const message = getChatMessages(messageId, { role: 'assistant' })[0];
  if (!message) return;
  const state = getImageState(message);
  if (!state) return;

  await generateForMessage(message, state, pinia);
}

async function handleSaveClick(event: JQuery.ClickEvent): Promise<void> {
  const messageId = Number($(event.currentTarget).attr('data-message-id'));
  if (!Number.isInteger(messageId)) return;

  const message = getChatMessages(messageId, { role: 'assistant' })[0];
  if (!message) return;
  const state = getImageState(message);
  const cacheId = $(event.currentTarget).attr('data-cache-id') ?? state?.cache?.id;
  if (!cacheId) return;

  const record = await getCachedImage(cacheId);
  if (!record) {
    toastr.warning('图片缓存已过期，请重新生成后再保存。');
    queueRenderMessageImage(messageId);
    return;
  }

  const result = await saveCachedImage(record);
  if (result === 'shared') toastr.success('已打开系统分享面板。');
  if (result === 'downloaded') toastr.success('已请求浏览器下载图片。');
}

function getStateCaches(state: NaiMessageImageState): NaiCachedImageMeta[] {
  if (state.caches?.length) return state.caches;
  return state.cache ? [state.cache] : [];
}

function formatCacheStatus(records: Array<{ record: { seed: number; expiresAt: string } }>): string {
  const firstRecord = records[0]?.record;
  if (!firstRecord) return '图片缓存已过期或被浏览器清理，可重新生成。';
  if (records.length === 1) return `seed=${firstRecord.seed}，缓存至 ${formatDate(firstRecord.expiresAt)}`;
  return `共 ${records.length} 张，首张 seed=${firstRecord.seed}，缓存至 ${formatDate(firstRecord.expiresAt)}`;
}

function renderIndexedDownloadName(
  template: string,
  data: { messageId: number; seed: number; ext: string; index: number; total: number },
): string {
  const rendered = renderDownloadName(template, data).replaceAll('{{index}}', String(data.index + 1));
  if (data.total <= 1 || template.includes('{{index}}')) return rendered;
  return rendered.replace(new RegExp(`\\.${data.ext}$`, 'i'), `-${data.index + 1}.${data.ext}`);
}

function buildPayloadDetail(payload: NaiImageRequest, storageMode: string, caches: NaiCachedImageMeta[]): string {
  return JSON.stringify(
    {
      model: payload.model,
      width: payload.parameters.width,
      height: payload.parameters.height,
      steps: payload.parameters.steps,
      nSamples: payload.parameters.n_samples,
      sampler: payload.parameters.sampler,
      storageMode,
      cacheIds: caches.map(cache => cache.id),
      expiresAt: caches[0]?.expiresAt,
    },
    null,
    2,
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function installRenderStyle(): JQuery<HTMLStyleElement> {
  return $('<style id="nai-image-render-style"></style>')
    .text(
      `
.${RENDER_CLASS} {
  margin: 10px 0 0;
  padding: 10px;
  border: 1px solid rgba(96, 125, 139, 0.28);
  border-radius: 8px;
  background: rgba(96, 125, 139, 0.08);
}
.nai-image-preview {
  display: block;
  max-width: min(100%, 520px);
  max-height: 68vh;
  margin: 0 0 8px;
  border-radius: 8px;
  object-fit: contain;
}
.nai-image-status {
  margin: 0 0 8px;
  color: inherit;
  font-size: 0.92em;
  opacity: 0.82;
  white-space: pre-wrap;
}
.nai-image-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.nai-image-actions button {
  border: 1px solid rgba(47, 111, 159, 0.45);
  border-radius: 7px;
  background: rgba(47, 111, 159, 0.12);
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-weight: 650;
  letter-spacing: 0;
  padding: 6px 10px;
}
.nai-image-actions button:disabled {
  cursor: wait;
  opacity: 0.6;
}
      `.trim(),
    )
    .appendTo('head');
}

$(() => {
  const pinia = createPinia();
  const app = createApp(App).use(pinia);
  const $app = createScriptIdDiv().addClass('nai-image-panel-host').appendTo('body');
  const $renderStyle = installRenderStyle();
  const { destroy } = teleportStyle();
  const exposed = app.mount($app[0]) as unknown as { openPanel?: () => void };
  const store = useNaiStore(pinia);
  store.writeDefaultSettings();
  void deleteExpiredCachedImages();

  appendInexistentScriptButtons([
    { name: 'NAI打开面板', visible: true },
    { name: 'NAI处理最新楼层', visible: true },
  ]);

  eventOn(getButtonEvent('NAI打开面板'), () => exposed.openPanel?.());
  eventOn(getButtonEvent('NAI处理最新楼层'), () => processLatestMessage('button', pinia));

  eventOn(tavern_events.MESSAGE_RECEIVED, messageId => {
    if (useNaiStore(pinia).settings.autoOnMessage) {
      void captureAndGenerateMessage(messageId, 'auto', pinia);
    }
  });

  eventOn(tavern_events.GENERATION_ENDED, messageId => {
    if (useNaiStore(pinia).settings.autoOnMessage) {
      void captureAndGenerateMessage(messageId, 'auto', pinia);
    }
  });

  eventOn(tavern_events.MESSAGE_UPDATED, messageId => queueRenderMessageImage(messageId));
  eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, messageId => queueRenderMessageImage(messageId));
  eventOn(tavern_events.MORE_MESSAGES_LOADED, renderVisibleImages);
  eventOn(tavern_events.CHAT_CHANGED, () => setTimeout(renderVisibleImages, 80));

  $('body').on('click.nai-image-script', `.${REGENERATE_CLASS}`, event => {
    void handleRegenerateClick(event, pinia);
  });
  $('body').on('click.nai-image-script', `.${SAVE_CLASS}`, event => {
    void handleSaveClick(event);
  });

  reloadOnChatChange();
  renderVisibleImages();

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    $renderStyle.remove();
    $('body').off('.nai-image-script');
    destroy();
  });

  console.info('[NAI生图脚本] 已加载');
});
