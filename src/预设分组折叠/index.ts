import { teleportStyle } from '@util/script';
import css from './style.scss?raw';

// ─── 类型 ───
interface GroupRule {
  name: string;
  mode: 'emoji' | 'regex' | 'markers';
  emoji?: string;
  pattern?: string;
  startPattern?: string;
  endPattern?: string;
  collapsed: boolean;
}

interface FoldConfig {
  rules: GroupRule[];
  autoDetect: boolean;
}

// ─── 常量 ───
const STORAGE_KEY = 'chaoxi-fold-collapsed';
const LIST_SELECTOR = '#completion_prompt_manager_list';
const ITEM_SELECTOR = '.completion_prompt_manager_prompt';
const NAME_SELECTOR = '.completion_prompt_manager_prompt_name';
const DISABLED_CLASS = 'completion_prompt_manager_prompt_disabled';
const FOLD_APPLIED_ATTR = 'data-chaoxi-fold-applied';
const GROUP_ATTR = 'data-chaoxi-fold-group';

// ─── 持久化折叠状态 ───
function readCollapsedState(): Record<string, boolean> {
  try {
    const raw = window.parent.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveCollapsedState(state: Record<string, boolean>) {
  try {
    window.parent.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

// ─── 读写脚本变量配置 ───
function readConfig(): FoldConfig {
  try {
    const vars = getVariables({ type: 'script', script_id: getScriptId() });
    if (vars && typeof vars === 'object' && 'rules' in vars) {
      return vars as FoldConfig;
    }
  } catch { /* ignore */ }
  return { rules: [], autoDetect: true };
}

function saveConfigAsync(config: FoldConfig) {
  replaceVariables(JSON.parse(JSON.stringify(config)), { type: 'script', script_id: getScriptId() });
}

// ─── 自动识别分组 ───
function autoDetectGroups($list: JQuery): GroupRule[] {
  const rules: GroupRule[] = [];
  const emojiGroups = new Map<string, number>();

  // 扫描所有条目，按 emoji 前缀归类
  $list.children(ITEM_SELECTOR).each(function () {
    const name = $(this).find(NAME_SELECTOR).attr('data-pm-name') || '';

    // 收集 emoji 前缀频率
    // eslint-disable-next-line no-control-regex
    const emojiMatch = name.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u);
    if (emojiMatch) {
      const emoji = emojiMatch[1];
      emojiGroups.set(emoji, (emojiGroups.get(emoji) || 0) + 1);
    }
  });

  // 至少2个条目才建组
  for (const [emoji, count] of emojiGroups) {
    if (count >= 2) {
      rules.push({
        name: emoji,
        mode: 'emoji',
        emoji,
        collapsed: true,
      });
    }
  }

  return rules;
}

// ─── 核心分组逻辑 ───
function applyGroups($list: JQuery, config: FoldConfig) {
  // 如果已经应用过，先清除
  cleanupGroups($list);

  const collapsedState = readCollapsedState();
  let rules = config.rules;

  // 自动识别（每次都重新检测，因为预设可能变化）
  if (config.autoDetect) {
    rules = autoDetectGroups($list);
    config.rules = rules;
    saveConfigAsync(config);
  }

  if (rules.length === 0) return;

  const $items = $list.children(ITEM_SELECTOR);

  for (const rule of rules) {
    const groupId = `fold-${rule.name}`;
    const isCollapsed = collapsedState[groupId] ?? rule.collapsed;

    if (rule.mode === 'markers') {
      applyMarkerGroup($list, $items, rule, groupId, isCollapsed);
    } else if (rule.mode === 'emoji') {
      applyEmojiGroup($list, $items, rule, groupId, isCollapsed);
    } else if (rule.mode === 'regex') {
      applyRegexGroup($list, $items, rule, groupId, isCollapsed);
    }
  }

  $list.attr(FOLD_APPLIED_ATTR, 'true');
}

function applyMarkerGroup(
  $list: JQuery,
  $items: JQuery,
  rule: GroupRule,
  groupId: string,
  isCollapsed: boolean,
) {
  let $startItem: JQuery | null = null;
  let $endItem: JQuery | null = null;
  const $groupItems: JQuery[] = [];
  let inGroup = false;

  $items.each(function () {
    const name = $(this).find(NAME_SELECTOR).attr('data-pm-name') || '';
    if (rule.startPattern && name.includes(rule.startPattern)) {
      $startItem = $(this);
      inGroup = true;
      return;
    }
    if (rule.endPattern && name.includes(rule.endPattern)) {
      $endItem = $(this);
      inGroup = false;
      return;
    }
    if (inGroup) {
      $groupItems.push($(this));
    }
  });

  if (!$startItem || $groupItems.length === 0) return;

  // 计算开关状态
  const { onCount, total } = countEnabled($groupItems);

  // 创建分组头
  const $header = createGroupHeader(rule.name, total, onCount, isCollapsed, groupId);

  // 隐藏开始标记条目，替换为分组头
  ($startItem as JQuery).before($header).attr(GROUP_ATTR, groupId).hide();

  // 隐藏结束标记
  if ($endItem) {
    ($endItem as JQuery).attr(GROUP_ATTR, groupId).hide();
  }

  // 给组内条目打标记并控制显隐
  for (const $item of $groupItems) {
    $item.attr(GROUP_ATTR, groupId);
    if (isCollapsed) $item.hide();
  }
}

function applyEmojiGroup(
  $list: JQuery,
  $items: JQuery,
  rule: GroupRule,
  groupId: string,
  isCollapsed: boolean,
) {
  const $groupItems: JQuery[] = [];

  $items.each(function () {
    // 跳过已经被标记分组占用的条目
    if ($(this).attr(GROUP_ATTR)) return;
    const name = $(this).find(NAME_SELECTOR).attr('data-pm-name') || '';
    // 跳过开始/结束标记条目本身
    if (name.match(/^——.+?(开始|结束)/)) return;
    if (rule.emoji && name.startsWith(rule.emoji)) {
      $groupItems.push($(this));
    }
  });

  if ($groupItems.length === 0) return;

  const { onCount, total } = countEnabled($groupItems);
  const $header = createGroupHeader(rule.name, total, onCount, isCollapsed, groupId);

  // 在第一个条目前插入分组头
  $groupItems[0].before($header);

  for (const $item of $groupItems) {
    $item.attr(GROUP_ATTR, groupId);
    if (isCollapsed) $item.hide();
  }
}

function applyRegexGroup(
  $list: JQuery,
  $items: JQuery,
  rule: GroupRule,
  groupId: string,
  isCollapsed: boolean,
) {
  if (!rule.pattern) return;
  const regex = new RegExp(rule.pattern);
  const $groupItems: JQuery[] = [];

  $items.each(function () {
    const name = $(this).find(NAME_SELECTOR).attr('data-pm-name') || '';
    if (regex.test(name)) {
      $groupItems.push($(this));
    }
  });

  if ($groupItems.length === 0) return;

  const { onCount, total } = countEnabled($groupItems);
  const $header = createGroupHeader(rule.name, total, onCount, isCollapsed, groupId);

  $groupItems[0].before($header);

  for (const $item of $groupItems) {
    $item.attr(GROUP_ATTR, groupId);
    if (isCollapsed) $item.hide();
  }
}

// ─── 工具函数 ───
function countEnabled($items: JQuery[]): { onCount: number; total: number } {
  let onCount = 0;
  const total = $items.length;
  for (const $item of $items) {
    if (!$item.hasClass(DISABLED_CLASS)) onCount++;
  }
  return { onCount, total };
}

function createGroupHeader(
  name: string,
  total: number,
  onCount: number,
  isCollapsed: boolean,
  groupId: string,
): JQuery {
  const arrow = isCollapsed ? '▸' : '▾';
  const statusText = `${onCount}/${total} 开启`;
  const allOn = onCount === total;
  const someOn = onCount > 0;

  const $header = $(`<li class="chaoxi-fold-header" data-chaoxi-fold-id="${groupId}">
    <span class="chaoxi-fold-arrow">${arrow}</span>
    <span class="chaoxi-fold-name">${name}</span>
    <span class="chaoxi-fold-count">(${statusText})</span>
    <button class="chaoxi-fold-toggle-btn ${allOn ? 'on' : someOn ? 'partial' : ''}" title="${allOn ? '关闭全部' : '开启全部'}">
      <span class="chaoxi-fold-toggle-knob"></span>
    </button>
  </li>`);

  // 点击展开/折叠
  $header.on('click', function (e) {
    if ($(e.target).closest('.chaoxi-fold-toggle-btn').length) return;
    toggleGroup(groupId);
  });

  // 点击一键开关
  $header.find('.chaoxi-fold-toggle-btn').on('click', function (e) {
    e.stopPropagation();
    toggleGroupEnabled(groupId, allOn);
  });

  return $header;
}

function toggleGroup(groupId: string) {
  const $header = $(`.chaoxi-fold-header[data-chaoxi-fold-id="${groupId}"]`);
  const $items = $(`[${GROUP_ATTR}="${groupId}"]${ITEM_SELECTOR}`);
  const isCurrentlyCollapsed = $items.first().is(':hidden');

  if (isCurrentlyCollapsed) {
    $items.show();
    $header.find('.chaoxi-fold-arrow').text('▾');
  } else {
    $items.hide();
    $header.find('.chaoxi-fold-arrow').text('▸');
  }

  // 保存状态
  const state = readCollapsedState();
  state[groupId] = !isCurrentlyCollapsed;
  saveCollapsedState(state);
}

async function toggleGroupEnabled(groupId: string, currentlyAllOn: boolean) {
  const targetEnabled = !currentlyAllOn;
  const names: string[] = [];

  $(`[${GROUP_ATTR}="${groupId}"]${ITEM_SELECTOR}`).each(function () {
    const name = $(this).find(NAME_SELECTOR).attr('data-pm-name');
    if (name) names.push(name);
  });

  if (names.length === 0) return;

  try {
    const nameSet = new Set(names);
    await updatePresetWith('in_use', preset => {
      for (const p of preset.prompts) {
        if ((isPresetNormalPrompt(p) || isPresetSystemPrompt(p)) && nameSet.has(p.name)) {
          p.enabled = targetEnabled;
        }
      }
      return preset;
    });

    // 更新 DOM 显示
    $(`[${GROUP_ATTR}="${groupId}"]${ITEM_SELECTOR}`).each(function () {
      if (targetEnabled) {
        $(this).removeClass(DISABLED_CLASS);
      } else {
        $(this).addClass(DISABLED_CLASS);
      }
    });

    // 更新分组头状态
    refreshGroupHeader(groupId);
  } catch (e) {
    console.error('[预设分组折叠] 切换失败:', e);
  }
}

function refreshGroupHeader(groupId: string) {
  const $header = $(`.chaoxi-fold-header[data-chaoxi-fold-id="${groupId}"]`);
  const $items: JQuery[] = [];
  $(`[${GROUP_ATTR}="${groupId}"]${ITEM_SELECTOR}`).each(function () {
    $items.push($(this));
  });

  const { onCount, total } = countEnabled($items);
  const allOn = onCount === total;
  const someOn = onCount > 0;

  $header.find('.chaoxi-fold-count').text(`(${onCount}/${total} 开启)`);
  $header
    .find('.chaoxi-fold-toggle-btn')
    .removeClass('on partial')
    .addClass(allOn ? 'on' : someOn ? 'partial' : '')
    .attr('title', allOn ? '关闭全部' : '开启全部');
}

function refreshAllHeaders() {
  $('.chaoxi-fold-header').each(function () {
    const groupId = $(this).attr('data-chaoxi-fold-id');
    if (groupId) refreshGroupHeader(groupId);
  });
}

// ─── 清理 ───
function cleanupGroups($list: JQuery) {
  // 显示所有被隐藏的条目
  $list.children(`[${GROUP_ATTR}]`).show().removeAttr(GROUP_ATTR);
  // 删除分组头
  $list.children('.chaoxi-fold-header').remove();
  // 删除工具栏
  $list.prev('.chaoxi-fold-toolbar').remove();
  $list.removeAttr(FOLD_APPLIED_ATTR);
}

// ─── 工具栏 ───
function injectToolbar($list: JQuery) {
  if ($list.prev('.chaoxi-fold-toolbar').length) return;

  const $toolbar = $(`<div class="chaoxi-fold-toolbar">
    <span class="chaoxi-fold-toolbar-label">📂 分组管理</span>
    <button class="chaoxi-fold-toolbar-btn" data-action="collapse-all" title="全部折叠">全部折叠</button>
    <button class="chaoxi-fold-toolbar-btn" data-action="expand-all" title="全部展开">全部展开</button>
    <button class="chaoxi-fold-toolbar-btn" data-action="refresh" title="刷新分组">🔄 刷新</button>
  </div>`);

  $toolbar.on('click', '.chaoxi-fold-toolbar-btn', function () {
    const action = $(this).data('action');
    if (action === 'collapse-all') {
      $('.chaoxi-fold-header').each(function () {
        const groupId = $(this).attr('data-chaoxi-fold-id')!;
        const $items = $(`[${GROUP_ATTR}="${groupId}"]${ITEM_SELECTOR}`);
        $items.hide();
        $(this).find('.chaoxi-fold-arrow').text('▸');
        const state = readCollapsedState();
        state[groupId] = true;
        saveCollapsedState(state);
      });
    } else if (action === 'expand-all') {
      $('.chaoxi-fold-header').each(function () {
        const groupId = $(this).attr('data-chaoxi-fold-id')!;
        const $items = $(`[${GROUP_ATTR}="${groupId}"]${ITEM_SELECTOR}`);
        $items.show();
        $(this).find('.chaoxi-fold-arrow').text('▾');
        const state = readCollapsedState();
        state[groupId] = false;
        saveCollapsedState(state);
      });
    } else if (action === 'refresh') {
      const config = readConfig();
      config.rules = []; // 清除规则，重新自动识别
      config.autoDetect = true;
      saveConfigAsync(config);
      applyGroups($list, config);
      injectToolbar($list);
    }
  });

  $list.before($toolbar);
}

// ─── 主入口 ───
$(() => {
  const { destroy } = teleportStyle();

  // 注入自定义样式
  const $style = $('<style>').text(css).appendTo('head');

  let observer: MutationObserver | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function tryApply() {
    const $list = $(LIST_SELECTOR);
    if (!$list.length || $list.children(ITEM_SELECTOR).length === 0) return;
    if ($list.attr(FOLD_APPLIED_ATTR)) {
      // 已应用，只刷新头部状态
      refreshAllHeaders();
      return;
    }

    const config = readConfig();
    applyGroups($list, config);
    injectToolbar($list);
  }

  // 防抖应用
  function debouncedApply() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      tryApply();
    }, 300);
  }

  // 初始应用
  tryApply();

  // 监听预设管理器容器变化
  const pmContainer = document.querySelector('#completion_prompt_manager') ?? document.body;
  observer = new MutationObserver(mutations => {
    // 检查是否有条目列表的子节点变化
    for (const m of mutations) {
      if (m.type === 'childList') {
        const target = m.target as HTMLElement;
        if (
          target.id === 'completion_prompt_manager_list' ||
          target.id === 'completion_prompt_manager' ||
          target.querySelector?.('#completion_prompt_manager_list')
        ) {
          // 列表被重建了，需要重新应用
          const $list = $(LIST_SELECTOR);
          $list.removeAttr(FOLD_APPLIED_ATTR);
          debouncedApply();
          return;
        }
      }
      // 检查条目开关状态变化（class 变化）
      if (m.type === 'attributes' && m.attributeName === 'class') {
        const target = m.target as HTMLElement;
        if (target.classList.contains('completion_prompt_manager_prompt')) {
          refreshAllHeaders();
          return;
        }
      }
    }
  });

  observer.observe(pmContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });

  // 定期检查（备份机制）
  const checkTimer = setInterval(() => {
    const $list = $(LIST_SELECTOR);
    if ($list.length && $list.children(ITEM_SELECTOR).length > 0 && !$list.attr(FOLD_APPLIED_ATTR)) {
      tryApply();
    }
  }, 2000);

  // 卸载
  $(window).on('pagehide', () => {
    observer?.disconnect();
    if (debounceTimer) clearTimeout(debounceTimer);
    clearInterval(checkTimer);
    const $list = $(LIST_SELECTOR);
    if ($list.length) cleanupGroups($list);
    $style.remove();
    destroy();
  });
});
