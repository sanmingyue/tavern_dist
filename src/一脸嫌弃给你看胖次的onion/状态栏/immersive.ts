/**
 * 沉浸模式
 *
 * PC端：左侧面板显示IF线内容 + 背景覆盖层
 * 手机端：全屏覆盖面板，背景颜色，层级最高，退出按钮在底部
 */

import { BG_IMAGE, AVATAR_IMAGE } from './store';
import type { IfLineResult } from './ifline/types';
import type { Schema } from '../schema';

// ── DOM ID ──
const STYLE_ID = 'onion-immersive-style';
const BACKDROP_ID = 'onion-im-backdrop';
const PANEL_ID = 'onion-im-panel';

// ── 状态 ──
let isActive = false;
let onCloseCallback: (() => void) | null = null;

// ── SVG 图标 ──
const SVG_CLOSE = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

/** 是否手机端 */
function isMobile(): boolean {
  return window.parent.innerWidth <= 768;
}

/** 动态获取 #chat 的左边距 */
function getChatLeftOffset(): number {
  const $chat = $('#chat');
  if ($chat.length === 0) return 0;
  return $chat[0].getBoundingClientRect().left;
}

/** 注入样式 */
function ensureStyles() {
  if ($(`#${STYLE_ID}`).length > 0) return;

  $('<style>')
    .attr('id', STYLE_ID)
    .html(`
      /* ━━━━ 全屏背景覆盖层（PC端） ━━━━ */
      #${BACKDROP_ID} {
        position: fixed;
        inset: 0;
        z-index: 9990;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.5s ease;
      }
      #${BACKDROP_ID}.onion-im-active {
        opacity: 0.1;
      }

      /* ━━━━ 面板基础 ━━━━ */
      #${PANEL_ID} {
        position: fixed;
        overflow-y: auto;
        z-index: 9991;
        pointer-events: auto;
        font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif;
        color: rgba(255, 255, 255, 0.85);
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        animation: onion-im-fade-in 0.4s ease-out;
      }
      #${PANEL_ID}::-webkit-scrollbar { width: 0; }
      #${PANEL_ID} { scrollbar-width: none; }

      /* ━━━━ PC端：左侧面板 ━━━━ */
      @media (min-width: 769px) {
        #${PANEL_ID} {
          left: 0;
          top: 0;
          bottom: 0;
          padding: 60px 24px 24px;
        }
      }

      /* ━━━━ 手机端：全屏覆盖 ━━━━ */
      @media (max-width: 768px) {
        #${PANEL_ID} {
          inset: 0;
          z-index: 99999;
          padding: 24px 20px 80px;
          background: rgba(10, 10, 20, 0.97);
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          animation: onion-im-slide-up 0.3s ease-out;
        }
        #${BACKDROP_ID} { display: none; }
      }

      /* ━━━━ PC端退出按钮（左上角） ━━━━ */
      .onion-im-close-pc {
        position: fixed;
        top: 8px;
        left: 8px;
        z-index: 9992;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        color: rgba(255, 255, 255, 0.6);
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
      }
      .onion-im-close-pc:hover { background: rgba(0, 0, 0, 0.6); color: #fff; }

      /* ━━━━ 手机端退出按钮（底部） ━━━━ */
      .onion-im-close-mobile {
        display: none;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 12px 20px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.6);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
        font-family: inherit;
        margin-top: auto;
        flex-shrink: 0;
      }
      .onion-im-close-mobile:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }

      @media (max-width: 768px) {
        .onion-im-close-pc { display: none; }
        .onion-im-close-mobile { display: flex; }
      }
      @media (min-width: 769px) {
        .onion-im-close-mobile { display: none; }
      }

      /* ━━━━ 内容样式 ━━━━ */
      .onion-im-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(255, 150, 0, 0.3);
        margin-bottom: 16px;
      }

      .onion-im-name {
        margin: 0 0 4px;
        font-size: 22px;
        font-weight: 700;
        color: #fff;
      }

      .onion-im-relation {
        display: inline-block;
        font-size: 12px;
        padding: 3px 10px;
        border-radius: 12px;
        background: rgba(255, 150, 0, 0.15);
        color: rgba(255, 200, 100, 0.9);
        margin-bottom: 16px;
      }

      .onion-im-info {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        margin-bottom: 20px;
        line-height: 1.8;
      }

      .onion-im-ifline-title {
        font-size: 14px;
        font-weight: 600;
        color: rgba(255, 200, 100, 0.9);
        margin: 0 0 8px;
        font-style: italic;
      }

      .onion-im-ifline-text {
        font-size: 14px;
        line-height: 1.8;
        color: rgba(255, 255, 255, 0.8);
        margin: 0;
        white-space: pre-wrap;
      }

      .onion-im-empty {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.35);
        font-style: italic;
        margin-top: 20px;
      }

      @keyframes onion-im-fade-in {
        from { opacity: 0; transform: translateX(-12px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes onion-im-slide-up {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `)
    .appendTo('head');
}

function escapeHTML(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
}

/** 更新面板宽度（PC端） */
function updatePanelWidth() {
  if (isMobile()) return;
  const $panel = $(`#${PANEL_ID}`);
  if ($panel.length === 0) return;
  const leftOffset = getChatLeftOffset();
  const width = Math.max(200, leftOffset - 16);
  $panel.css('width', `${width}px`);
}

/** 进入沉浸模式 */
export function enterImmersive(data: Schema, ifLineResult: IfLineResult | null, onClose: () => void) {
  ensureStyles();
  onCloseCallback = onClose;
  isActive = true;

  // PC端：背景覆盖层
  if (!isMobile()) {
    let $backdrop = $(`#${BACKDROP_ID}`);
    if ($backdrop.length === 0) {
      $backdrop = $('<div>').attr('id', BACKDROP_ID).appendTo('body');
    }
    $backdrop.css('background-image', `url("${BG_IMAGE}")`);
    requestAnimationFrame(() => $backdrop.addClass('onion-im-active'));
  }

  // 面板
  let $panel = $(`#${PANEL_ID}`);
  if ($panel.length === 0) {
    $panel = $('<div>').attr('id', PANEL_ID).appendTo('body');
  }

  if (!isMobile()) {
    updatePanelWidth();
    $(window.parent).off('resize.onion-im').on('resize.onion-im', updatePanelWidth);
  }

  // IF线内容
  const ifLineHTML = ifLineResult
    ? `<p class="onion-im-ifline-title">${escapeHTML(ifLineResult.title)}</p>
       <p class="onion-im-ifline-text">${escapeHTML(ifLineResult.content)}</p>`
    : `<p class="onion-im-empty">还没有生成IF线，返回面板点击"生成IF线"按钮</p>`;

  $panel.html(`
    <img class="onion-im-avatar" src="${AVATAR_IMAGE}" alt="Onion" />
    <h2 class="onion-im-name">Onion</h2>
    <span class="onion-im-relation">${escapeHTML(data.关系状态)}</span>
    <div class="onion-im-info">
      交易次数：${data.交易次数} · ${data.当前场景}<br>
      ${data.星期} · ${data.时间段}
    </div>
    ${ifLineHTML}
    <button class="onion-im-close-mobile">${SVG_CLOSE} 退出沉浸模式</button>
  `);

  // 手机端退出按钮事件
  $panel.find('.onion-im-close-mobile').off('click').on('click', exitImmersive);

  // PC端退出按钮（左上角）
  if (!isMobile()) {
    let $closeBtn = $('.onion-im-close-pc');
    if ($closeBtn.length === 0) {
      $closeBtn = $(`<button class="onion-im-close-pc">${SVG_CLOSE} 退出沉浸模式</button>`).appendTo('body');
    }
    $closeBtn.off('click').on('click', exitImmersive);
  }
}

/** 退出沉浸模式 */
export function exitImmersive() {
  const $backdrop = $(`#${BACKDROP_ID}`);
  $backdrop.removeClass('onion-im-active');
  setTimeout(() => $backdrop.remove(), 500);

  $(`#${PANEL_ID}`).remove();
  $('.onion-im-close-pc').remove();
  $(window.parent).off('resize.onion-im');

  isActive = false;
  onCloseCallback?.();
  onCloseCallback = null;
}

/** 是否处于沉浸模式 */
export function isImmersiveActive(): boolean {
  return isActive;
}

/** 清理 */
export function cleanupImmersive() {
  exitImmersive();
  $(`#${STYLE_ID}`).remove();
}
