import { reloadOnChatChange } from '@util/script';

const TRACK_ENTRY_NAME = '[赛道]当前赛道数据';
const TRACK_REGEX = /<track_data>([\s\S]*?)<\/track_data>/i;

/**
 * 从消息文本中提取 <track_data> 内容
 */
function extractTrackData(message: string): string | null {
  const match = message.match(TRACK_REGEX);
  return match ? match[1].trim() : null;
}

/**
 * 获取角色卡绑定的主世界书名称
 */
function getCharWorldbookName(): string | null {
  const charWb = getCharWorldbookNames('current');
  return charWb.primary ?? null;
}

/**
 * 将赛道数据写入世界书条目
 */
async function writeTrackToWorldbook(trackContent: string): Promise<void> {
  const wbName = getCharWorldbookName();
  if (!wbName) {
    console.error('[赛道捕获] 未找到角色卡绑定的世界书');
    return;
  }

  try {
    const worldbook = await getWorldbook(wbName);
    const existingEntry = worldbook.find(e => e.name === TRACK_ENTRY_NAME);

    if (existingEntry) {
      // 更新已有条目
      existingEntry.content = `<当前赛道数据>\n${trackContent}\n</当前赛道数据>`;
      existingEntry.enabled = true;
      await replaceWorldbook(wbName, worldbook);
      console.info('[赛道捕获] 已更新赛道世界书条目');
    } else {
      // 创建新条目
      await createWorldbookEntries(wbName, [{
        name: TRACK_ENTRY_NAME,
        enabled: true,
        content: `<当前赛道数据>\n${trackContent}\n</当前赛道数据>`,
        strategy: {
          type: 'constant',
          keys: [],
          keys_secondary: { logic: 'and_any', keys: [] },
          scan_depth: 'same_as_global',
        },
        position: {
          type: 'before_character_definition',
          role: 'system',
          depth: 0,
          order: 7,
        },
        recursion: {
          prevent_incoming: true,
          prevent_outgoing: true,
          delay_until: null,
        },
      }]);
      console.info('[赛道捕获] 已创建赛道世界书条目');
    }

    toastr.success('赛道数据已锁定到世界书', '赛道捕获');
  } catch (e) {
    console.error('[赛道捕获] 写入世界书失败:', e);
    toastr.error('赛道数据写入失败', '赛道捕获');
  }
}

/**
 * 清除赛道世界书条目
 */
async function clearTrackFromWorldbook(): Promise<void> {
  const wbName = getCharWorldbookName();
  if (!wbName) return;

  try {
    const worldbook = await getWorldbook(wbName);
    const existingEntry = worldbook.find(e => e.name === TRACK_ENTRY_NAME);

    if (existingEntry) {
      // 禁用并清空内容
      existingEntry.enabled = false;
      existingEntry.content = '';
      await replaceWorldbook(wbName, worldbook);
      console.info('[赛道捕获] 已清除赛道世界书条目');
      toastr.info('赛道数据已清除', '赛道捕获');
    }
  } catch (e) {
    console.error('[赛道捕获] 清除世界书失败:', e);
  }
}

/**
 * 监听消息接收，捕获 <track_data>
 */
/**
 * 从楼层消息中删除赛道数据标签
 */
async function removeTrackFromMessage(message_id: number, originalMessage: string): Promise<void> {
  try {
    const cleanedMessage = originalMessage.replace(TRACK_REGEX, '').trim();
    if (cleanedMessage !== originalMessage) {
      await setChatMessages([{ message_id, message: cleanedMessage }]);
      console.info(`[赛道捕获] 已从第 ${message_id} 楼删除赛道数据`);
    }
  } catch (e) {
    console.error('[赛道捕获] 删除楼层赛道数据失败:', e);
  }
}

/**
 * 监听消息接收，捕获 <track_data> 并从楼层中删除
 */
function setupMessageListener(): void {
  eventOn(tavern_events.MESSAGE_RECEIVED, async (message_id: number) => {
    try {
      const messages = getChatMessages(message_id);
      if (!messages || messages.length === 0) return;

      const msg = messages[0];
      if (!msg || typeof msg.message !== 'string') return;

      const trackData = extractTrackData(msg.message);
      if (trackData) {
        console.info(`[赛道捕获] 在第 ${message_id} 楼发现赛道数据`);
        await writeTrackToWorldbook(trackData);
        // 从楼层消息中删除赛道数据（用户不可见）
        await removeTrackFromMessage(message_id, msg.message);
      }
    } catch (e) {
      console.error('[赛道捕获] 处理消息失败:', e);
    }
  });

  // 也监听消息编辑（swipe 或手动编辑可能产生新的赛道数据）
  eventOn(tavern_events.MESSAGE_EDITED, async (message_id: number) => {
    try {
      const messages = getChatMessages(message_id);
      if (!messages || messages.length === 0) return;

      const msg = messages[0];
      if (!msg || typeof msg.message !== 'string') return;

      const trackData = extractTrackData(msg.message);
      if (trackData) {
        console.info(`[赛道捕获] 编辑的第 ${message_id} 楼包含赛道数据，更新世界书`);
        await writeTrackToWorldbook(trackData);
        await removeTrackFromMessage(message_id, msg.message);
      }
    } catch (e) {
      console.error('[赛道捕获] 处理编辑消息失败:', e);
    }
  });
}

/**
 * 监听 MVU 变量变化，当状态切回日常时清除赛道
 */
function setupStateListener(): void {
  let previousState: string | null = null;

  eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (variables) => {
    const currentState = _.get(variables, 'stat_data.世界._当前状态') as string | undefined;

    if (!currentState) return;

    // 状态从非日常切换到日常 → 清除赛道数据
    if (currentState === '日常' && previousState && previousState !== '日常') {
      console.info(`[赛道捕获] 状态从「${previousState}」切换到「日常」，清除赛道数据`);
      clearTrackFromWorldbook();
    }

    previousState = currentState;
  });
}

async function init() {
  await waitGlobalInitialized('Mvu');

  // 初始化 previousState
  try {
    const mvuData = Mvu.getMvuData({ type: 'message', message_id: -1 });
    const currentState = _.get(mvuData, 'stat_data.世界._当前状态');
    if (typeof currentState === 'string') {
      // 在 setupStateListener 之前不需要设置，会在第一次事件时初始化
    }
  } catch { /* ignore */ }

  setupMessageListener();
  setupStateListener();
  reloadOnChatChange();

  console.info('[赛道捕获] 脚本已加载');
}

$(() => {
  errorCatched(init)();
});
