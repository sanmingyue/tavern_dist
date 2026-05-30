/**
 * 沉浸式攻略面板 v4
 *
 * 三页画面布局：
 * - 左侧：角色信息+窥探内心，position:fixed 占满 #chat 左边的空白区域
 * - 中间：酒馆聊天正文（不动）
 * - 背景：通过酒馆 FORCE_SET_BACKGROUND 事件设置真正的聊天背景
 *
 * 手机端：底部抽屉面板，带下拉关闭手势
 */

import { generateTheater, getIsGenerating } from './theater/generator';
import type { TheaterResult } from './theater/types';
import { CHARACTER_LIST } from './store';

// ── DOM ID ──
const STYLE_ID = 'fruit-immersive-style-v4';
const PANEL_ID = 'fruit-im-panel';
const SWIPE_HINT_CLASS = 'fruit-im-swipe-hint';

// ── 状态 ──
const resultCache: Record<string, TheaterResult> = {};
let currentCharacter: string | null = null;
let onCloseCallback: (() => void) | null = null;
let savedBackground: string | null = null;

// ── SVG 图标 ──
const SVG_CLOSE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
const SVG_EYE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
const SVG_SPINNER = `<svg class="fruit-im-spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/></svg>`;
const SVG_CHAT = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
const SVG_SMILE = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`;
const SVG_HEART = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

/** 动态获取 #chat 的左边距 */
function getChatLeftOffset(): number {
  const $chat = $('#chat');
  if ($chat.length === 0) return 0;
  return $chat[0].getBoundingClientRect().left;
}

/** 是否手机端 */
function isMobile(): boolean {
  return window.parent.innerWidth <= 768;
}

/** 注入样式 */
function ensureStyles() {
  if ($(`#${STYLE_ID}`).length > 0) return;

  $('<style>').attr('id', STYLE_ID).html(`
    /* ━━━━ 沉浸模式聊天滚动条 ━━━━ */
    body.fruit-immersive-active #chat::-webkit-scrollbar {
      width: 4px;
    }
    body.fruit-immersive-active #chat::-webkit-scrollbar-track {
      background: transparent;
    }
    body.fruit-immersive-active #chat::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.15);
      border-radius: 2px;
    }
    body.fruit-immersive-active #chat::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    body.fruit-immersive-active #chat {
      scrollbar-width: thin;
      scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
    }

    /* ━━━━ 左侧面板：占满 #chat 左边空白 ━━━━ */
    #${PANEL_ID} {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      overflow-y: auto;
      padding: 60px 24px 24px;
      z-index: 1;
      pointer-events: auto;
      font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif;
      color: rgba(255, 255, 255, 0.85);
      background: transparent;
      border: none;
      box-shadow: none;
      animation: fruit-im-fade-in 0.4s ease-out;
    }
    /* 隐藏滚动条 */
    #${PANEL_ID}::-webkit-scrollbar { width: 0; height: 0; }
    #${PANEL_ID} { scrollbar-width: none; -ms-overflow-style: none; }

    /* ━━━━ 退出按钮 ━━━━ */
    .fruit-im-close {
      position: fixed;
      top: 8px;
      left: 8px;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 6px;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(8px);
      color: rgba(255,255,255,0.6);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .fruit-im-close:hover { background: rgba(0,0,0,0.6); color: #fff; }

    /* ━━━━ 角色名 ━━━━ */
    .fruit-im-name {
      margin: 0 0 4px;
      font-size: 24px;
      font-weight: 700;
      color: #fff;
      text-shadow: 0 2px 12px rgba(0,0,0,0.6);
    }

    /* ━━━━ 身份 ━━━━ */
    .fruit-im-identity {
      font-size: 12px;
      color: rgba(255,255,255,0.4);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    /* ━━━━ 关系标签 ━━━━ */
    .fruit-im-relation {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      padding: 3px 12px;
      border-radius: 12px;
      margin-bottom: 12px;
    }
    .fruit-im-relation--default { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.5); }
    .fruit-im-relation--lover { background: rgba(236,72,153,0.2); color: #f9a8d4; }
    .fruit-im-relation--ambiguous { background: rgba(168,85,247,0.2); color: #c4b5fd; }
    .fruit-im-relation--familiar { background: rgba(59,130,246,0.2); color: #93c5fd; }
    .fruit-im-relation--broken { background: rgba(239,68,68,0.2); color: #fca5a5; }

    /* ━━━━ 介绍 ━━━━ */
    .fruit-im-intro {
      font-size: 13px;
      color: rgba(255,255,255,0.5);
      font-style: italic;
      margin: 0 0 16px;
      line-height: 1.7;
    }

    /* ━━━━ 好感度 ━━━━ */
    .fruit-im-favor {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 20px;
    }
    .fruit-im-favor-label { font-size: 12px; color: rgba(255,255,255,0.4); flex-shrink: 0; }
    .fruit-im-favor-track {
      flex: 1;
      height: 4px;
      background: rgba(255,255,255,0.08);
      border-radius: 2px;
      overflow: hidden;
    }
    .fruit-im-favor-fill {
      height: 100%;
      border-radius: 2px;
      background: linear-gradient(90deg, #4a9eff, #a855f7, #ff6b9d);
      transition: width 0.5s ease;
    }
    .fruit-im-favor-value {
      font-size: 13px;
      font-weight: 600;
      color: rgba(255,255,255,0.7);
      min-width: 28px;
      text-align: right;
    }

    /* ━━━━ 窥探按钮 ━━━━ */
    .fruit-im-peek-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      width: 100%;
      padding: 12px 16px;
      border: 1px solid rgba(168,85,247,0.25);
      border-radius: 8px;
      background: rgba(168,85,247,0.08);
      color: rgba(196,181,253,0.9);
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
      margin-bottom: 20px;
    }
    .fruit-im-peek-btn:hover:not(:disabled) {
      background: rgba(168,85,247,0.15);
      border-color: rgba(168,85,247,0.4);
      color: #fff;
    }
    .fruit-im-peek-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* ━━━━ 三段内容 ━━━━ */
    .fruit-im-section {
      padding: 12px 14px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.06);
      background: rgba(255,255,255,0.03);
      margin-bottom: 12px;
    }
    .fruit-im-section--voice { border-color: rgba(255,255,255,0.08); }
    .fruit-im-section--wall { border-color: rgba(168,85,247,0.15); background: rgba(168,85,247,0.05); }
    .fruit-im-section--look { border-color: rgba(59,130,246,0.15); background: rgba(59,130,246,0.05); }
    .fruit-im-section-header {
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 8px;
      font-size: 12px;
      font-weight: 600;
      color: rgba(255,255,255,0.45);
    }
    .fruit-im-section-text {
      font-size: 14px;
      line-height: 1.8;
      color: rgba(255,255,255,0.8);
      margin: 0;
    }
    .fruit-im-section--wall .fruit-im-section-text {
      font-style: italic;
      color: rgba(196,181,253,0.8);
    }

    /* ━━━━ 动画 ━━━━ */
    @keyframes fruit-im-fade-in {
      from { opacity: 0; transform: translateX(-12px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fruit-im-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .fruit-im-spinner {
      animation: fruit-im-spin 0.8s linear infinite;
    }
    @keyframes fruit-im-slide-up {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    /* ━━━━ 手机端下拉关闭指示条 ━━━━ */
    .${SWIPE_HINT_CLASS} {
      display: none;
      justify-content: center;
      padding: 8px 0 4px;
      cursor: pointer;
      touch-action: none;
      flex-shrink: 0;
    }
    .${SWIPE_HINT_CLASS} .swipe-bar {
      width: 36px;
      height: 4px;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.2);
      transition: background 0.15s;
    }
    .${SWIPE_HINT_CLASS}:active .swipe-bar {
      background: rgba(168, 85, 247, 0.5);
    }

    /* ━━━━ 手机端 ━━━━ */
    @media (max-width: 768px) {
      #${PANEL_ID} {
        left: 0;
        right: 0;
        bottom: 0;
        top: auto;
        width: 100% !important;
        max-height: 75vh;
        padding: 0 16px 16px;
        background: rgba(10,10,20,0.95);
        backdrop-filter: blur(12px);
        border-top: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px 16px 0 0;
        animation: fruit-im-slide-up 0.3s ease-out;
      }
      .${SWIPE_HINT_CLASS} {
        display: flex;
      }
      .fruit-im-close {
        display: none;
      }
    }
  `).appendTo('head');
}

// ── 工具函数 ──
function escapeHTML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

function getRelationClass(relation: string): string {
  switch (relation) {
    case '恋人': return 'fruit-im-relation--lover';
    case '暧昧': return 'fruit-im-relation--ambiguous';
    case '熟悉': return 'fruit-im-relation--familiar';
    case '决裂': case '封心': case '疏远': return 'fruit-im-relation--broken';
    default: return 'fruit-im-relation--default';
  }
}

function getFavorWidth(favor: number): string {
  return `${Math.max(2, Math.min(100, ((favor + 100) / 200) * 100))}%`;
}

function buildResultHTML(result: TheaterResult): string {
  return `
    <div class="fruit-im-section fruit-im-section--voice">
      <div class="fruit-im-section-header">${SVG_CHAT}<span>内心独白</span></div>
      <p class="fruit-im-section-text">${escapeHTML(result.innerVoice)}</p>
    </div>
    <div class="fruit-im-section fruit-im-section--wall">
      <div class="fruit-im-section-header">${SVG_SMILE}<span>戏外吐槽</span></div>
      <p class="fruit-im-section-text">${escapeHTML(result.fourthWall)}</p>
    </div>
    <div class="fruit-im-section fruit-im-section--look">
      <div class="fruit-im-section-header">${SVG_EYE}<span>对你的看法</span></div>
      <p class="fruit-im-section-text">${escapeHTML(result.userReaction)}</p>
    </div>
  `;
}

/** 更新面板宽度以匹配 #chat 左侧空白（仅 PC 端） */
function updatePanelWidth() {
  const $panel = $(`#${PANEL_ID}`);
  if ($panel.length === 0) return;

  // 手机端不设置 inline width，让 CSS media query 接管
  if (isMobile()) {
    $panel.css('width', '');
    return;
  }

  const leftOffset = getChatLeftOffset();
  const width = Math.max(200, leftOffset - 16);
  $panel.css('width', `${width}px`);
}

// ── 手机端下拉关闭手势 ──
let swipeStartY = 0;
let swipeStartTime = 0;

function onSwipePointerDown(e: PointerEvent) {
  if (!isMobile()) return;
  e.preventDefault();
  swipeStartY = e.clientY;
  swipeStartTime = Date.now();
  window.parent.addEventListener('pointermove', onSwipePointerMove);
  window.parent.addEventListener('pointerup', onSwipePointerUp);
}

function onSwipePointerMove(_e: PointerEvent) {
  // 仅跟踪，不做实时位移（保持简洁）
}

function onSwipePointerUp(e: PointerEvent) {
  window.parent.removeEventListener('pointermove', onSwipePointerMove);
  window.parent.removeEventListener('pointerup', onSwipePointerUp);
  const dy = e.clientY - swipeStartY;
  const dt = Date.now() - swipeStartTime;
  // 下滑超过 60px 或快速下滑（200ms 内 30px）即关闭
  if (dy > 60 || (dy > 30 && dt < 200)) {
    exitImmersive();
  }
}

/** 进入沉浸模式或切换角色 */
export async function enterImmersive(
  characterName: string,
  relation: string,
  favor: number,
  onClose: () => void,
) {
  ensureStyles();
  onCloseCallback = onClose;
  currentCharacter = characterName;

  const meta = CHARACTER_LIST.find(c => c.name === characterName);
  const image = meta?.image ?? '';
  const intro = meta?.intro ?? '';
  const identity = meta?.identity ?? '';

  // ── 设置酒馆真正背景 ──
  if (image) {
    // 保存当前背景以便退出时恢复
    savedBackground = $('#bg1').css('background-image') ?? null;
    try {
      await eventEmit(tavern_events.FORCE_SET_BACKGROUND, {
        url: `url("${image}")`,
        path: image,
      });
    } catch (e) {
      console.warn('[沉浸模式] FORCE_SET_BACKGROUND 失败，回退到直接设置:', e);
      $('#bg1').css('background-image', `url("${image}")`);
    }
  }

  // ── 添加沉浸模式 body class（用于滚动条样式） ──
  $('body').addClass('fruit-immersive-active');

  // ── 左侧面板 ──
  let $panel = $(`#${PANEL_ID}`);
  if ($panel.length === 0) {
    $panel = $('<div>').attr('id', PANEL_ID).appendTo('body');
  }

  // 设置宽度（PC 端）
  updatePanelWidth();
  // 窗口 resize 时更新宽度
  $(window.parent).off('resize.fruit-im').on('resize.fruit-im', updatePanelWidth);

  // 缓存的结果
  const cached = resultCache[characterName];
  const resultHTML = cached ? buildResultHTML(cached) : '';

  $panel.html(`
    <div class="${SWIPE_HINT_CLASS}"><div class="swipe-bar"></div></div>
    <h2 class="fruit-im-name">${escapeHTML(characterName)}</h2>
    <div class="fruit-im-identity">${SVG_HEART} ${escapeHTML(identity)}</div>
    <span class="fruit-im-relation ${getRelationClass(relation)}">${escapeHTML(relation)}</span>
    <p class="fruit-im-intro">${escapeHTML(intro)}</p>
    <div class="fruit-im-favor">
      <span class="fruit-im-favor-label">好感度</span>
      <div class="fruit-im-favor-track">
        <div class="fruit-im-favor-fill" style="width: ${getFavorWidth(favor)}"></div>
      </div>
      <span class="fruit-im-favor-value">${favor}</span>
    </div>
    <button class="fruit-im-peek-btn">${SVG_EYE} 窥探内心</button>
    <div class="fruit-im-result">${resultHTML}</div>
  `);

  // ── 手机端下拉关闭手势绑定 ──
  $panel.find(`.${SWIPE_HINT_CLASS}`).on('pointerdown', onSwipePointerDown as any);

  // ── 退出按钮（PC 端，固定在左上角）──
  let $closeBtn = $('.fruit-im-close');
  if ($closeBtn.length === 0) {
    $closeBtn = $(`<button class="fruit-im-close">${SVG_CLOSE} 退出沉浸模式</button>`).appendTo('body');
  }
  $closeBtn.off('click').on('click', exitImmersive);

  // ── 窥探内心按钮事件 ──
  $panel.find('.fruit-im-peek-btn').off('click').on('click', async () => {
    if (getIsGenerating()) return;
    const charName = currentCharacter;
    if (!charName) return;

    const $btn = $panel.find('.fruit-im-peek-btn');
    const $result = $panel.find('.fruit-im-result');

    $btn.prop('disabled', true).html(`${SVG_SPINNER} 窥探中...`);
    $result.html('');

    try {
      const theaterResult = await generateTheater(charName, relation, favor);
      resultCache[charName] = theaterResult;
      if (currentCharacter === charName) {
        $result.html(buildResultHTML(theaterResult));
      }
    } catch (e) {
      if (currentCharacter === charName) {
        $result.html(`<div class="fruit-im-section" style="border-color:rgba(239,68,68,0.3);background:rgba(239,68,68,0.08);color:#fca5a5;font-size:12px;padding:8px 10px;">${escapeHTML(String(e))}</div>`);
      }
    } finally {
      if (currentCharacter === charName) {
        $btn.prop('disabled', false).html(`${SVG_EYE} 窥探内心`);
      }
    }
  });
}

/** 退出沉浸模式 */
export async function exitImmersive() {
  // 恢复背景
  if (savedBackground) {
    try {
      // 尝试恢复为原来的背景
      const bgMatch = savedBackground.match(/url\("?(.+?)"?\)/);
      if (bgMatch && bgMatch[1] && !bgMatch[1].includes('__transparent')) {
        await eventEmit(tavern_events.FORCE_SET_BACKGROUND, {
          url: savedBackground,
          path: bgMatch[1],
        });
      } else {
        // 原来是透明背景，直接还原 CSS
        $('#bg1').css('background-image', savedBackground);
      }
    } catch {
      $('#bg1').css('background-image', savedBackground);
    }
    savedBackground = null;
  }

  // 移除沉浸模式 body class
  $('body').removeClass('fruit-immersive-active');

  // 移除面板
  $(`#${PANEL_ID}`).remove();
  $('.fruit-im-close').remove();
  $(window.parent).off('resize.fruit-im');

  // 移除手势监听
  window.parent.removeEventListener('pointermove', onSwipePointerMove);
  window.parent.removeEventListener('pointerup', onSwipePointerUp);

  currentCharacter = null;
  onCloseCallback?.();
  onCloseCallback = null;
}

/** 是否处于沉浸模式 */
export function isImmersiveActive(): boolean {
  return currentCharacter !== null;
}

/** 获取当前沉浸角色 */
export function getCurrentImmersiveCharacter(): string | null {
  return currentCharacter;
}

/** 清理 */
export function cleanupImmersive() {
  exitImmersive();
  $(`#${STYLE_ID}`).remove();
}
