const LITE_BLOCK_TAGS = ['轻量变量更新', 'LiteMVU', 'MVULite'];

function clamp(value, min, max) {
  let result = value;
  if (typeof min === 'number' && Number.isFinite(min)) {
    result = Math.max(result, min);
  }
  if (typeof max === 'number' && Number.isFinite(max)) {
    result = Math.min(result, max);
  }
  return result;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizePath(path) {
  return path
    .replace(/[．。]/g, '.')
    .replace(/\s+/g, '')
    .replace(/^\.+|\.+$/g, '');
}

function splitChineseList(text) {
  return text
    .split(/[、,，/|｜]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function readNumber(text) {
  const match = String(text).match(/[+-]?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}

function getByPath(object, path) {
  if (globalThis._?.get) {
    return globalThis._.get(object, path);
  }
  return path.split('.').reduce((current, key) => (current == null ? undefined : current[key]), object);
}

function toLiteral(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return JSON.stringify(String(value));
}

function stripOuterQuotes(value) {
  return String(value)
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
    .trim();
}

function parseRange(text) {
  const match = text.match(/范围\s*[：:]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:到|至|~|～|—|-)\s*([+-]?\d+(?:\.\d+)?)/);
  if (!match) {
    return {};
  }
  const first = Number(match[1]);
  const second = Number(match[2]);
  return { min: Math.min(first, second), max: Math.max(first, second) };
}

function parseMaxDelta(text) {
  const match = text.match(/(?:单次变化|每次变化|单次|每次|变化)?\s*(?:最多|不超过|上限|最大)\s*±?\s*([+-]?\d+(?:\.\d+)?)/);
  return match ? Math.abs(Number(match[1])) : undefined;
}

function parseMaxLength(text) {
  const match = text.match(/(?:最多|不超过|上限|最大)\s*(\d+)\s*(?:个?字|字符)/);
  return match ? Number(match[1]) : undefined;
}

function parseRuleLine(line) {
  const cleanLine = line.replace(/^[\s\-*·•\d.、]+/, '').trim();
  if (!cleanLine || cleanLine.startsWith('#') || cleanLine.startsWith('//')) {
    return undefined;
  }

  const colonIndex = cleanLine.search(/[：:]/);
  if (colonIndex <= 0) {
    return undefined;
  }

  const path = normalizePath(cleanLine.slice(0, colonIndex));
  const body = cleanLine.slice(colonIndex + 1).trim();
  if (!path || path.startsWith('_') || path.includes('._')) {
    return undefined;
  }

  const segments = body
    .split(/[；;]/)
    .map(segment => segment.trim())
    .filter(Boolean);
  const joined = segments.join('；');
  const rule = {
    path,
    type: 'text',
    description: joined,
  };

  if (/(数字|数值|整数|小数|number)/i.test(joined)) {
    rule.type = 'number';
  }
  if (/(文字|文本|string)/i.test(joined)) {
    rule.type = 'text';
  }
  if (/(布尔|真假|是非|boolean)/i.test(joined)) {
    rule.type = 'boolean';
  }

  const enumSegment = segments.find(segment => /^(选项|枚举|可选值)/.test(segment));
  if (enumSegment) {
    rule.type = 'enum';
    const valueText = enumSegment.replace(/^(选项|枚举|可选值)\s*[：:]?/, '').trim();
    rule.values = splitChineseList(valueText);
  }

  const range = parseRange(joined);
  if (typeof range.min === 'number') {
    rule.min = range.min;
    rule.max = range.max;
  }

  const maxDelta = parseMaxDelta(joined);
  if (typeof maxDelta === 'number') {
    rule.maxDelta = maxDelta;
  }

  const maxLength = parseMaxLength(joined);
  if (typeof maxLength === 'number') {
    rule.maxLength = maxLength;
  }

  if (/(只读|不可更新|禁止更新|不要更新)/.test(joined)) {
    rule.readonly = true;
  }

  return rule;
}

export function 解析轻量变量规则(text) {
  const rules = {};
  String(text ?? '')
    .split(/\r?\n/)
    .map(parseRuleLine)
    .filter(Boolean)
    .forEach(rule => {
      rules[rule.path] = rule;
    });
  return rules;
}

export const parseLiteRules = 解析轻量变量规则;

function extractLiteBlocks(message, allowWholeMessage) {
  const text = String(message ?? '');
  const blocks = [];

  for (const tag of LITE_BLOCK_TAGS) {
    const pattern = new RegExp(`<\\s*${escapeRegExp(tag)}\\s*>[\\s\\S]*?<\\s*\\/\\s*${escapeRegExp(tag)}\\s*>`, 'gi');
    for (const match of text.matchAll(pattern)) {
      const block = match[0]
        .replace(new RegExp(`^<\\s*${escapeRegExp(tag)}\\s*>`, 'i'), '')
        .replace(new RegExp(`<\\s*\\/\\s*${escapeRegExp(tag)}\\s*>$`, 'i'), '')
        .trim();
      if (block) {
        blocks.push(block);
      }
    }
  }

  if (blocks.length === 0 && allowWholeMessage === true) {
    return [text];
  }
  return blocks;
}

export function 移除轻量变量更新块(message) {
  let text = String(message ?? '');
  for (const tag of LITE_BLOCK_TAGS) {
    const pattern = new RegExp(`\\n?\\s*<\\s*${escapeRegExp(tag)}\\s*>[\\s\\S]*?<\\s*\\/\\s*${escapeRegExp(tag)}\\s*>\\s*`, 'gi');
    text = text.replace(pattern, '\n').trim();
  }
  return text;
}

export const removeLiteUpdateBlocks = 移除轻量变量更新块;

function splitReason(body) {
  const parts = body
    .split(/[；;]/)
    .map(part => part.trim())
    .filter(Boolean);
  const main = parts.shift() ?? '';
  const reasonPart = parts.find(part => /^原因\s*[：:]/.test(part));
  const reason = reasonPart ? reasonPart.replace(/^原因\s*[：:]/, '').trim() : parts.join('；');
  return { main, reason };
}

function parseUpdateLine(line) {
  const cleanLine = line.replace(/^[\s\-*·•\d.、]+/, '').trim();
  if (!cleanLine || cleanLine.startsWith('#') || cleanLine.startsWith('//')) {
    return undefined;
  }

  const colonIndex = cleanLine.search(/[：:]/);
  if (colonIndex <= 0) {
    return undefined;
  }

  const path = normalizePath(cleanLine.slice(0, colonIndex));
  const { main, reason } = splitReason(cleanLine.slice(colonIndex + 1).trim());
  if (!path || !main) {
    return undefined;
  }

  let action = 'set';
  let rawValue = main;
  if (/^(改为|设为|变为|更新为)/.test(main)) {
    rawValue = main.replace(/^(改为|设为|变为|更新为)\s*/, '');
  } else if (/^(增加|加上|\+=)/.test(main)) {
    action = 'increase';
    rawValue = main.replace(/^(增加|加上|\+=)\s*/, '');
  } else if (/^(减少|减去|-=)/.test(main)) {
    action = 'decrease';
    rawValue = main.replace(/^(减少|减去|-=)\s*/, '');
  }

  return {
    path,
    action,
    rawValue: stripOuterQuotes(rawValue),
    reason,
    source: cleanLine,
  };
}

export function 解析轻量变量更新(message, options = {}) {
  return extractLiteBlocks(message, options.允许无标签更新 === true)
    .flatMap(block => block.split(/\r?\n/))
    .map(parseUpdateLine)
    .filter(Boolean);
}

export const parseLiteUpdates = 解析轻量变量更新;

function parseBoolean(value) {
  const text = stripOuterQuotes(value).toLowerCase();
  if (/^(true|yes|on|1|是|真|有|开启|打开|启用)$/.test(text)) {
    return true;
  }
  if (/^(false|no|off|0|否|假|无|关闭|关掉|禁用)$/.test(text)) {
    return false;
  }
  return undefined;
}

function applyRule(update, rule, statData, onReject) {
  if (!rule || rule.readonly) {
    onReject?.(update, rule, '变量不存在或只读');
    return undefined;
  }

  const oldValue = getByPath(statData, update.path);
  let value;

  if (rule.type === 'number') {
    const inputNumber = readNumber(update.rawValue);
    if (typeof inputNumber !== 'number' || Number.isNaN(inputNumber)) {
      onReject?.(update, rule, '数字解析失败');
      return undefined;
    }

    const currentNumber = typeof oldValue === 'number' && Number.isFinite(oldValue) ? oldValue : 0;
    if (update.action === 'increase' || update.action === 'decrease') {
      const direction = update.action === 'increase' ? 1 : -1;
      const rawDelta = Math.abs(inputNumber) * direction;
      const delta =
        typeof rule.maxDelta === 'number'
          ? clamp(rawDelta, -Math.abs(rule.maxDelta), Math.abs(rule.maxDelta))
          : rawDelta;
      value = currentNumber + delta;
    } else {
      value = inputNumber;
      if (typeof rule.maxDelta === 'number' && typeof oldValue === 'number') {
        value = clamp(value, oldValue - Math.abs(rule.maxDelta), oldValue + Math.abs(rule.maxDelta));
      }
    }

    value = clamp(value, rule.min, rule.max);
  } else if (rule.type === 'enum') {
    const rawValue = stripOuterQuotes(update.rawValue);
    const values = Array.isArray(rule.values) ? rule.values : [];
    const exactValue = values.find(item => item === rawValue);
    const includedValue = values.find(item => rawValue.includes(item));
    value = exactValue ?? includedValue;
    if (!value) {
      onReject?.(update, rule, `选项不在允许范围内: ${values.join('、')}`);
      return undefined;
    }
  } else if (rule.type === 'boolean') {
    value = parseBoolean(update.rawValue);
    if (typeof value !== 'boolean') {
      onReject?.(update, rule, '布尔值解析失败');
      return undefined;
    }
  } else {
    value = stripOuterQuotes(update.rawValue);
    if (typeof rule.maxLength === 'number' && value.length > rule.maxLength) {
      value = value.slice(0, rule.maxLength);
    }
  }

  const reason = update.reason || `Lite更新: ${update.source}`;
  return {
    type: 'set',
    full_match: `LiteMVU: ${update.source}`,
    args: [update.path, toLiteral(value)],
    reason,
  };
}

export function 转换轻量更新为MVU命令(message, rules, statData = {}, options = {}) {
  const ruleMap = typeof rules === 'string' ? 解析轻量变量规则(rules) : rules;
  const updates = 解析轻量变量更新(message, options);
  const commands = [];
  const rejected = [];

  for (const update of updates) {
    const command = applyRule(update, ruleMap[update.path], statData, (item, rule, reason) => {
      rejected.push({ update: item, rule, reason });
    });
    if (command) {
      commands.push(command);
    }
  }

  return { commands, rejected, updates };
}

export const convertLiteUpdatesToMvuCommands = 转换轻量更新为MVU命令;

async function waitForMvu() {
  if (typeof waitGlobalInitialized === 'function') {
    await waitGlobalInitialized('Mvu');
    return;
  }

  const startedAt = Date.now();
  while (!globalThis.Mvu) {
    if (Date.now() - startedAt > 10000) {
      throw Error('等待 Mvu 初始化超时');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

export async function 注册轻量MVU(options = {}) {
  const rulesText = options.变量规则 ?? options.rules ?? '';
  const rules = typeof rulesText === 'string' ? 解析轻量变量规则(rulesText) : rulesText;
  const logger = options.调试 === true ? console.info : console.debug;

  await waitForMvu();
  if (!globalThis.Mvu?.events?.COMMAND_PARSED) {
    throw Error('未找到 MVU 命令解析事件，无法注册轻量 MVU');
  }
  if (typeof eventOn !== 'function') {
    throw Error('未找到 eventOn，无法注册轻量 MVU');
  }

  const offCommandParsed = eventOn(Mvu.events.COMMAND_PARSED, (first, second, third) => {
    const variables = Array.isArray(first) ? { stat_data: {} } : first;
    const commands = Array.isArray(first) ? first : second;
    const message = Array.isArray(first) ? second : third;
    if (!Array.isArray(commands) || typeof message !== 'string') {
      return;
    }

    const statData = variables?.stat_data ?? {};
    const result = 转换轻量更新为MVU命令(message, rules, statData, options);
    commands.push(...result.commands);

    if (result.commands.length > 0) {
      logger?.(`[MVU Lite] 已转换 ${result.commands.length} 条轻量变量更新`);
    }
    if (result.rejected.length > 0) {
      console.warn('[MVU Lite] 已忽略不合法的轻量变量更新', result.rejected);
    }
  });

  let offBeforeUpdate;
  if (options.清理变量更新块 !== false && Mvu.events.BEFORE_MESSAGE_UPDATE) {
    offBeforeUpdate = eventOn(Mvu.events.BEFORE_MESSAGE_UPDATE, context => {
      if (context && typeof context.message_content === 'string') {
        context.message_content = 移除轻量变量更新块(context.message_content);
      }
    });
  }

  console.info(`[MVU Lite] 注册完成，已加载 ${Object.keys(rules).length} 条变量规则`);
  return {
    rules,
    unregister() {
      if (typeof offCommandParsed === 'function') {
        offCommandParsed();
      }
      if (typeof offBeforeUpdate === 'function') {
        offBeforeUpdate();
      }
    },
  };
}

export const registerLiteMvu = 注册轻量MVU;

export default {
  注册轻量MVU,
  registerLiteMvu,
  解析轻量变量规则,
  parseLiteRules,
  解析轻量变量更新,
  parseLiteUpdates,
  转换轻量更新为MVU命令,
  convertLiteUpdatesToMvuCommands,
  移除轻量变量更新块,
  removeLiteUpdateBlocks,
};
