/*
 * 无头思维链提取 + Reasoning 面板美化（iframe 脚本版 / 纯 JS）
 * 规则：提取 reasoning，并把命中的 think 段从正文移除
 */

(function () {
  const DEBUG = true;
  const SCRIPT_ID = typeof getScriptId === 'function' ? getScriptId() : 'reasoning_regex_styler';
  const STYLE_ID = `reasoning-style-${SCRIPT_ID}`;

  // 1. 配置注入：通过获取酒馆 Context 强行修改原生解析器配置
  function injectConfig() {
    const context = getST()?.getContext?.();
    const config = context?.powerUserSettings?.reasoning;
    if (config) {
      config.auto_parse = true;
      config.prefix = '<基础确认>';
      config.suffix = '</基础确认>';
      log('Config injected to ST via Context API');
    } else {
      log('Failed to inject config: Context or powerUserSettings not found');
    }
  }

  function getReasoningConfig() {
    const context = getST()?.getContext?.();
    const config = context?.powerUserSettings?.reasoning;
    if (config) {
      return {
        prefix: config.prefix || '-',
        suffix: config.suffix || '</think>',
        auto_expand: config.auto_expand
      };
    }
    return { prefix: '-', suffix: '</think>', auto_expand: true };
  }

  const REASONING_CSS = String.raw`
/* ========================================================= */
/*  全新皮肤：清凉气泡水风格 (Aqua Bubble Light Theme)           */
/* ========================================================= */

/* 1. 主推演窗口外壳 (你设定的渐变和侧边栏线) */
.mes_reasoning_details {
    margin: 16px 0 !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    width: 100% !important;
    background: linear-gradient(145deg, #F2FCFE 0%, #E0F7FA 100%) !important;
    border: 1px solid #B2EBF2 !important;
    border-left: 4px solid #00BCD4 !important;
    border-radius: 8px !important;
    overflow: hidden !important;
    box-shadow: 0 4px 12px rgba(0, 188, 212, 0.08) !important;
    transition: all 0.3s ease !important;
    box-sizing: border-box !important;
    padding: 0 !important;
}

/* 2. 顶部折叠触发区 */
.mes_reasoning_summary {
    margin: 0 !important;
    width: 100% !important;
    box-sizing: border-box !important;
    padding: 12px 16px !important;
    background: transparent !important;
    border: none !important;
    color: #00838F !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    outline: none !important;
    list-style: none !important;
    display: flex !important;
    align-items: center !important;
}

.mes_reasoning_summary::-webkit-details-marker {
    display: none !important;
}

/* 剥离掉容器里的原生底色和干扰，并且将沿途的包裹层全部撑开 */
.mes_reasoning_header_block,
.mes_reasoning_header {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    flex: 1 !important; /* 一路撑满拉大 */
    cursor: pointer !important;
}

/* 屏蔽原生的系统图标 */
.mes_reasoning_header .thinking-icon,
.mes_reasoning_header .icon-svg,
.mes_reasoning_arrow {
    display: none !important;
}

/* 3. 颜文字动态指示器（思考中轮换，完毕后定格） */
.mes_reasoning_header::before {
    font-size: 0.95rem !important;
    margin-right: 8px !important;
    display: inline-block !important;
    /* 静态默认（不在任何特殊状态时） */
    content: "(＝ω＝)";
    color: #00838F !important;
}

/* 思考进行中：依次轮换颜文字表情 */
.mes_reasoning_details:not([data-state="done"]) .mes_reasoning_header::before {
    animation: kaomoji-think 3.2s infinite steps(1, end);
}

@keyframes kaomoji-think {
    0%   { content: "(・・？)"; }
    25%  { content: "(￣～￣;)"; }
    50%  { content: "( ˘ω˘ )"; }
    75%  { content: "(｀・ω・´)"; }
}

/* 思考完毕：定格满足感 */
.mes_reasoning_details[data-state="done"] .mes_reasoning_header::before {
    content: "(⁠◕⁠ᴗ⁠◕⁠✿⁠)";
    animation: none !important;
}

/* 4. 文字动态改造逻辑 */
.mes_reasoning_header_title {
    font-size: 0 !important; /* 洗掉原生含糊不清的秒数和汉字 */
    letter-spacing: 0.5px !important;
    /* 【核心魔法】：强制这行文字自身像无形气球一样膨胀并占据所有缝隙区域，让它的身体可被点击！ */
    flex: 1 !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
}

.mes_reasoning_header_title::before {
    content: none !important;
    display: none !important;
}

/* 【运行状态下】：展现你要求的动态推演反馈（带点号打字机效果） */
.mes_reasoning_details:not([data-state="done"]) .mes_reasoning_header_title::after {
    font-size: 1rem !important;
    color: #00838F !important;
    content: "浮生正在寻思...";
    animation: aqua-thinking-dots 1.6s infinite steps(1, end);
}

@keyframes aqua-thinking-dots {
    0%  { content: "浮生正在寻思"; }
    25% { content: "浮生正在寻思."; }
    50% { content: "浮生正在寻思.."; }
    75% { content: "浮生正在寻思..."; }
}

/* 【结束状态下】 */
.mes_reasoning_details[data-state="done"] .mes_reasoning_header_title::after {
    content: "浮生已经思考完了呢~";
    font-size: 1rem !important;
    color: #00838F !important;
}

/* 5. 展开后的内容承载主体属性 */
.mes_reasoning {
    padding: 16px !important;
    margin: 0 !important;
    border: none !important;
    border-top: 1px dashed #80DEEA !important; /* 分割虚线 */
    background-color: rgba(255, 255, 255, 0.55) !important;
    color: #004D40 !important;
    font-size: 0.95em !important;
    line-height: 1.7 !important;
    max-height: 400px;
    overflow-y: auto;
}

/* 把滚动条也变成水清色，完美融入 */
.mes_reasoning::-webkit-scrollbar { width: 6px; }
.mes_reasoning::-webkit-scrollbar-track { background: transparent; }
.mes_reasoning::-webkit-scrollbar-thumb { background: rgba(0, 188, 212, 0.2); border-radius: 3px; }
.mes_reasoning::-webkit-scrollbar-thumb:hover { background: rgba(0, 188, 212, 0.5); }

/* 6. （可选增设）把右侧的那些原本的复制、编辑按钮也调成浅湖蓝色，防止扎眼 */
.mes_reasoning_actions div {
    color: #00838F !important;
    opacity: 0.4 !important;
    transition: opacity 0.2s !important;
}
.mes_reasoning_actions div:hover {
    opacity: 1 !important;
}
`;

  function log(...args) {
    if (!DEBUG) return;
    console.log('[ReasoningRegexStyler]', ...args);
  }

  function getTopDocument() {
    try {
      return window.top?.document || document;
    } catch {
      return document;
    }
  }

  function getST() {
    if (typeof SillyTavern !== 'undefined') return SillyTavern;
    return null;
  }

  function getChatArray() {
    const st = getST();
    if (st && Array.isArray(st.chat)) return st.chat;
    if (Array.isArray(window.chat)) return window.chat;
    return null;
  }

  function updateBlock(messageId, message) {
    const st = getST();
    if (st && typeof st.updateMessageBlock === 'function') {
      st.updateMessageBlock(messageId, message);
      return;
    }
    if (typeof window.updateMessageBlock === 'function') {
      window.updateMessageBlock(messageId, message);
    }
  }

  function injectStyleOnce(doc) {
    if (!doc || !doc.head) return;
    let style = doc.getElementById(STYLE_ID);
    if (!style) {
      style = doc.createElement('style');
      style.id = STYLE_ID;
      doc.head.appendChild(style);
      log('style created', { inTop: doc === getTopDocument() });
    }
    style.textContent = REASONING_CSS;
  }

  function injectStyle() {
    injectStyleOnce(document);
    injectStyleOnce(getTopDocument());
    log('style injected', { cssLength: REASONING_CSS.length });
  }

  function removeStyle() {
    for (const doc of [document, getTopDocument()]) {
      const style = doc?.getElementById?.(STYLE_ID);
      if (style) style.remove();
    }
    log('style removed');
  }

  /**
   * 核心：流式兼容的解析逻辑 (无头优先)
   */
  function extractReasoningAndClean(text, isStreaming) {
    if (typeof text !== 'string') return null;
    const { prefix, suffix } = getReasoningConfig();

    // 1. 如果包含闭合标签
    if (text.includes(suffix)) {
      const parts = text.split(suffix);
      let reasoningPart = parts[0];
      const cleaned = parts.slice(1).join(suffix).trim();

      // 如果有前缀则从前缀后开始截取
      if (reasoningPart.includes(prefix)) {
        reasoningPart = reasoningPart.split(prefix)[1];
      }

      const title = extractLatestHeader(reasoningPart);
      return { reasoning: reasoningPart.trim(), cleaned, state: 'done', title };
    }

    // 2. 流式状态下，没看到闭合标签，则全部内容视为思维链
    if (isStreaming && text.length > 0) {
      let reasoning = text;
      // 如果有前缀则去掉前缀显示
      if (text.startsWith(prefix)) {
        reasoning = text.slice(prefix.length);
      }
      const title = extractLatestHeader(reasoning);
      return { reasoning: reasoning.trim(), cleaned: '', state: 'thinking', title };
    }

    // 3. 非流式但有前缀的情况
    if (text.startsWith(prefix)) {
      const reasoning = text.slice(prefix.length).trim();
      const title = extractLatestHeader(reasoning);
      return { reasoning, cleaned: '', state: 'thinking', title };
    }

    return null;
  }

  // 移除 extractLatestHeader，直接使用酒馆默认逻辑

  function applyReasoningToMessage(messageId) {
    const id = Number(messageId);
    if (!Number.isInteger(id) || id < 0) return;

    const chat = getChatArray();
    if (!chat) return;

    const message = chat[id];
    if (!message || message.is_user) return;

    const isStreaming = message.swipe_id === undefined && message.gen_started && !message.extra?.reasoning_duration;

    if (message.extra?.reasoning) {
      const state = isStreaming ? 'thinking' : 'done';

      const { suffix } = getReasoningConfig();
      if (message.mes.includes(suffix)) {
        message.mes = message.mes.split(suffix).slice(1).join(suffix).trim();
        updateBlock(id, message);
      }

      updateReasoningUIState(id, state);
      return;
    }

    const parsed = extractReasoningAndClean(String(message.mes ?? ''), isStreaming);
    if (!parsed) {
      updateReasoningUIState(id, 'none');
      return;
    }

    message.extra = (message.extra && typeof message.extra === 'object') ? message.extra : {};
    message.extra.reasoning = parsed.reasoning;
    message.extra.reasoning_type = 'parsed';
    message.extra.reasoning_state = parsed.state;
    message.mes = parsed.cleaned;

    updateBlock(id, message);
    updateReasoningUIState(id, parsed.state);
  }

  /**
   * 强制同步 DOM 状态属性
   */
  function updateReasoningUIState(messageId, state) {
    requestAnimationFrame(() => {
      const messageDom = document.querySelector(`#chat [mesid="${messageId}"]`);
      if (!messageDom) return;

      // 【核心】给根节点挂载状态，通过 CSS 物理遮断正文渲染
      if (state === 'thinking') {
        messageDom.setAttribute('data-reasoning-state', 'thinking');
        messageDom.setAttribute('data-is-thinking', 'true');
      } else if (state === 'done') {
        messageDom.setAttribute('data-reasoning-state', 'done');
        messageDom.removeAttribute('data-is-thinking');
      } else {
        messageDom.removeAttribute('data-reasoning-state');
        messageDom.removeAttribute('data-is-thinking');
      }

      const mesDetails = messageDom.querySelector('.mes_reasoning_details');

      if (mesDetails) {
        if (mesDetails.getAttribute('data-state') !== state) {
          mesDetails.setAttribute('data-state', state);
        }
        const config = getReasoningConfig();
        if (state === 'thinking' && config.auto_expand) {
          if (!mesDetails.open) mesDetails.open = true;
        }
      }

      // 移除所有自定义标题属性，确保显示原生文本
      const mesTitle = messageDom.querySelector('.mes_reasoning_header_title');
      if (mesTitle) {
          mesTitle.removeAttribute('data-custom-title');
      }
    });
  }

  function applyReasoningToAllMessages() {
    const chat = getChatArray();
    if (!chat) return;
    for (let i = 0; i < chat.length; i++) applyReasoningToMessage(i);
  }

  function bindEvents() {
    if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
      eventOn(tavern_events.MESSAGE_UPDATED, (messageId) => {
        applyReasoningToMessage(messageId);
      });

      eventOn(tavern_events.MESSAGE_RECEIVED, (messageId) => {
        applyReasoningToMessage(messageId);
      });

      eventOn(tavern_events.CHAT_CHANGED, () => {
        injectConfig(); // 切换聊天时再次确保配置注入
        setTimeout(applyReasoningToAllMessages, 50);
      });

      eventOn(tavern_events.CHARACTER_MESSAGE_RENDERED, (messageId) => {
        applyReasoningToMessage(messageId);
      });

      // 新增：高频流式监听，确保在每个 token 到达时都强制同步一次 UI 状态
      eventOn(tavern_events.STREAM_TOKEN_RECEIVED, (messageId) => {
        applyReasoningToMessage(messageId);
      });
    } else {
      log('eventOn/tavern_events not available');
    }
  }

  function init() {
    injectConfig();
    injectStyle();
    bindEvents();

    setTimeout(applyReasoningToAllMessages, 100);
    setTimeout(applyReasoningToAllMessages, 800);

    $(window).on('pagehide', removeStyle);
    log('loaded', { scriptId: SCRIPT_ID, debug: DEBUG });
  }

  $(() => init());
})();
