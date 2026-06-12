import { createScriptIdDiv, teleportStyle, reloadOnChatChange } from '@util/script';
import App from './App.vue';
import { APP_LIST } from './utils/icons';
import { capturePhoneTags, stripPhoneTags, processCapturedEvent } from './utils/content-capture';
import { FRIEND_TAG_REGEX, parseFriendTag, BLOCK_TAG_REGEX, UNFRIEND_TAG_REGEX } from './utils/app-names';
import { getLocalDB, closeLocalDB, watchChatChange as watchDBChatChange } from './utils/local-db';
import { getMemoryInjectContext } from './utils/memory-system';

const MINI_PHONE_MOUNT_FLAG = '__xiaoshoujiMounted';

/**
 * 隐藏聊天楼层中 <小手机> 和 <iphone> 标签的内容
 */
function setupPhoneTagHiding(): { destroy: () => void } {
  const STYLE_ID = 'xiaoshouji-hide-phone-tags';

  const $style = $(`<style id="${STYLE_ID}">
    #chat .mes .mes_text 小手机,
    #chat .mes .mes_text iphone,
    #chat .mes .mes_text 闪讯好友,
    #chat .mes .mes_text 闪讯拉黑,
    #chat .mes .mes_text 闪讯删好友 { display: none !important; }
  </style>`).appendTo($(document.head));

  return {
    destroy: () => {
      $style.remove();
    },
  };
}

/**
 * 处理 AI 输出中的 <闪讯好友> 标签：自动添加好友 + 从正文删除标签
 */
async function processAutoFriendTags(text: string, messageId: number): Promise<void> {
  FRIEND_TAG_REGEX.lastIndex = 0;
  const matches: Array<{ fullMatch: string; content: string }> = [];
  let match;
  while ((match = FRIEND_TAG_REGEX.exec(text)) !== null) {
    matches.push({ fullMatch: match[0], content: match[1] });
  }

  if (matches.length === 0) return;

  const { usePhoneStore } = await import('./stores/phone-store');
  const store = usePhoneStore();

  for (const { content } of matches) {
    const friend = parseFriendTag(content);
    if (!friend) {
      console.warn('[小手机] 闪讯好友标签解析失败，跳过:', content.slice(0, 80));
      continue;
    }

    const { realname, nickname, id, relation } = friend;

    // 防重复：已存在的好友只从正文删除标签，绝不新增或替换任何数据
    if (store.phoneData.contacts[realname]) {
      console.info(`[小手机] 好友「${realname}」已存在，仅删除正文标签，不做任何操作`);
      continue;
    }

    // 添加联系人到 phone store
    store.addContact(realname);
    // 更新标签信息（addContact 保证此时 contacts[realname] 存在）
    (store.phoneData.contacts[realname] as any).tags = [relation];
    (store.phoneData.contacts[realname] as any).alias = nickname !== realname ? nickname : undefined;
    (store.phoneData.contacts[realname] as any).phone = id;

    console.info(`[小手机] 自动添加好友「${realname}」(昵称: ${nickname}, ID: ${id}, 关系: ${relation})`);

    // 添加好友请求通知（红点）
    const { useAppRegistry } = await import('./stores/app-registry');
    const registry = useAppRegistry();
    const currentBadge = registry.getApp('messages')?.badge || 0;
    registry.updateBadge('messages', currentBadge + 1);

    toastr.info(`剧情中交换了联系方式，已自动添加「${realname}」为好友`, '📱 闪讯');
  }
}

/**
 * 处理 AI 输出中的 <闪讯拉黑> 标签：标记联系人为已拉黑 + 写入世界书判定记录
 */
async function processBlockTags(text: string): Promise<void> {
  BLOCK_TAG_REGEX.lastIndex = 0;
  const matches: string[] = [];
  let match;
  while ((match = BLOCK_TAG_REGEX.exec(text)) !== null) {
    matches.push(match[1]);
  }
  if (matches.length === 0) return;

  const { usePhoneStore } = await import('./stores/phone-store');
  const store = usePhoneStore();
  const WORLDBOOK_NAME = '[小手机数据]';

  for (const content of matches) {
    const realname = content.match(/<realname>([\s\S]*?)<\/realname>/i)?.[1]?.trim();
    if (!realname) continue;

    const reason = content.match(/<reason>([\s\S]*?)<\/reason>/i)?.[1]?.trim() || '';

    // 标记联系人为已拉黑（如果存在）
    if (store.phoneData.contacts[realname]) {
      (store.phoneData.contacts[realname] as any).blocked = true;
      (store.phoneData.contacts[realname] as any).blockedAt = Date.now();
      (store.phoneData.contacts[realname] as any).blockReason = reason || undefined;
      console.info(`[小手机] 角色「${realname}」将用户拉黑了${reason ? `，原因：${reason}` : ''}`);
    }

    // 只保留拉黑记录到世界书，用于后续调用判定
    try {
      const worldbookNames = getWorldbookNames();
      if (!worldbookNames.includes(WORLDBOOK_NAME)) {
        await createWorldbook(WORLDBOOK_NAME);
      }
      const entryName = `[拉黑]${realname}`;
      const content = [
        `【闪讯拉黑记录】${realname}已将{{user}}拉黑。`,
        reason ? `原因：${reason}。` : '',
        `记录时间：${new Date().toLocaleString()}`,
      ].filter(Boolean).join('');

      await updateWorldbookWith(WORLDBOOK_NAME, entries => {
        const existing = entries.find(e => e.name === entryName);
        if (existing) {
          existing.enabled = true;
          existing.content = content;
          return entries;
        }
        return [...entries, {
          name: entryName,
          enabled: true,
          content,
          strategy: {
            type: 'selective' as const,
            keys: [realname, '闪讯', '拉黑'],
            keys_secondary: { logic: 'and_any' as const, keys: [] },
            scan_depth: 'same_as_global' as const,
          },
          position: { type: 'before_character_definition' as const, role: 'system' as const, depth: 0, order: 1 },
          probability: 100,
          recursion: { prevent_incoming: true, prevent_outgoing: true, delay_until: null },
          effect: { sticky: null, cooldown: null, delay: null },
        }];
      });
      console.info(`[小手机] 已写入「${realname}」的闪讯拉黑记录`);
    } catch {
      // 静默处理
    }

    toastr.warning(`「${realname}」将你拉黑了${reason ? `：${reason}` : ''}`, '📱 闪讯');
  }
}

/**
 * 处理 AI 输出中的 <闪讯删好友> 标签：删除联系人
 */
async function processUnfriendTags(text: string): Promise<void> {
  UNFRIEND_TAG_REGEX.lastIndex = 0;
  const matches: string[] = [];
  let match;
  while ((match = UNFRIEND_TAG_REGEX.exec(text)) !== null) {
    matches.push(match[1]);
  }
  if (matches.length === 0) return;

  const { usePhoneStore } = await import('./stores/phone-store');
  const store = usePhoneStore();

  for (const content of matches) {
    const realname = content.match(/<realname>([\s\S]*?)<\/realname>/i)?.[1]?.trim();
    if (!realname) continue;

    // 删除联系人
    if (store.phoneData.contacts[realname]) {
      store.removeContact(realname);
      console.info(`[小手机] 角色「${realname}」删除了与用户的好友关系`);
    }

    toastr.warning(`「${realname}」已将你从好友列表移除`, '📱 闪讯');
  }
}

/* ─── 动态导入 APP 组件（中文目录名） ─── */
const APP_COMPONENTS: Record<string, () => Promise<any>> = {
  messages: () => import('./apps/消息/App.vue'),
  contacts: () => import('./apps/通讯录/App.vue'),
  forum: () => import('./apps/论坛/App.vue'),
  sms: () => import('./apps/短信/App.vue'),
  phone: () => import('./apps/电话/App.vue'),
  map: () => import('./apps/地图/App.vue'),
  delivery: () => import('./apps/外卖/App.vue'),
  taxi: () => import('./apps/打车/App.vue'),
  movie: () => import('./apps/电影/App.vue'),
  weather: () => import('./apps/天气/App.vue'),
  music: () => import('./apps/音乐/App.vue'),
  tiktok: () => import('./apps/抖音/App.vue'),
  bilibili: () => import('./apps/哔哩哔哩/App.vue'),
  shop: () => import('./apps/购物/App.vue'),
  wallet: () => import('./apps/钱包/App.vue'),
  camera: () => import('./apps/相机/App.vue'),
  gallery: () => import('./apps/相册/App.vue'),
  browser: () => import('./apps/浏览器/App.vue'),
  calendar: () => import('./apps/日历/App.vue'),
  notes: () => import('./apps/备忘录/App.vue'),
  calculator: () => import('./apps/计算器/App.vue'),
  clock: () => import('./apps/时钟/App.vue'),
  files: () => import('./apps/文件/App.vue'),
  notifications: () => import('./apps/通知/App.vue'),
  themes: () => import('./apps/主题/App.vue'),
  settings: () => import('./apps/设置/App.vue'),
  home: () => import('./apps/首页/App.vue'),
  appstore: () => import('./apps/应用商店/App.vue'),
  live: () => import('./apps/直播/App.vue'),
  secondhand: () => import('./apps/二手/App.vue'),
};

/* ─── 预加载所有 APP 组件并注册 ─── */
async function preloadAppComponents(): Promise<void> {
  const { useAppRegistry } = await import('./stores/app-registry');
  const registry = useAppRegistry();

  const loadPromises = Object.entries(APP_COMPONENTS).map(async ([appId, loader]) => {
    try {
      const module = await loader();
      const info = APP_LIST.find(a => a.id === appId);
      registry.registerApp({
        id: appId,
        name: info?.name || appId,
        icon: info?.icon || 'folder',
        component: module.default,
        category: info?.category || 'tools',
        dir: info?.dir || appId,
        size: info?.size || '0MB',
        description: info?.description || '',
      });
    } catch (e) {
      console.warn(`[小手机] 加载 APP "${appId}" 失败:`, e);
    }
  });

  await Promise.all(loadPromises);
  console.info(`[小手机] 已加载 ${registry.apps.length} 个 APP`);
}

$(async () => {
  const parentWindow = window.parent as Window & Record<typeof MINI_PHONE_MOUNT_FLAG, boolean | undefined>;
  if (parentWindow[MINI_PHONE_MOUNT_FLAG]) {
    console.info('[小手机] 已存在运行实例，跳过重复挂载');
    return;
  }
  parentWindow[MINI_PHONE_MOUNT_FLAG] = true;

  const app = createApp(App).use(createPinia());

  // 挂载到酒馆网页 DOM 上
  const $app = createScriptIdDiv().appendTo('body');
  app.mount($app[0]);

  // 设置隐藏标签的逻辑
  const phoneHider = setupPhoneTagHiding();

  // 预加载所有 APP 组件并注册
  await preloadAppComponents();

  // 必须在所有异步组件加载完毕后再 teleport 样式，
  // 否则异步组件的 scoped CSS 不会被克隆到酒馆页面
  const { destroy } = teleportStyle();

  // 持续监听 iframe <head> 中新增的 style 标签并同步到酒馆页面，
  // 以覆盖运行时延迟渲染的子组件 scoped CSS
  const $teleportDiv = $(`div[script_id="${getScriptId()}"]`, window.parent.document.head);
  const styleObserver = new MutationObserver(mutations => {
    if ($teleportDiv.length === 0) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node instanceof HTMLStyleElement) {
          $teleportDiv.append($(node).clone());
        }
      }
    }
  });
  styleObserver.observe(document.head, { childList: true });

  // 恢复 APP 注册表（安装状态 + 首页布局）
  const { useAppRegistry } = await import('./stores/app-registry');
  const registry = useAppRegistry();
  registry.loadRegistry();

  // 初始化 API store（恢复已保存的配置）
  const { useApiStore } = await import('./stores/api-store');
  const apiStore = useApiStore();
  apiStore.loadConfig();

  // 初始化 phone store
  const { usePhoneStore } = await import('./stores/phone-store');
  const store = usePhoneStore();
  await store.initialize();

  // 初始化 IndexedDB
  try {
    await getLocalDB();
    console.info('[小手机] IndexedDB 已初始化');
  } catch (e) {
    console.warn('[小手机] IndexedDB 初始化失败:', e);
  }

  // 监听聊天切换时自动切换 IndexedDB
  const dbChatWatcher = watchDBChatChange();

  // 生成前即时注入相关手机记忆到酒馆正文请求
  const MEMORY_INJECT_ID = 'xiaoshouji-memory';
  let memoryInjection: { uninject: () => void } | null = null;

  function buildRecentGenerationQuery(): string {
    try {
      const lastId = getLastMessageId();
      if (lastId < 0) return '';
      const startId = Math.max(0, lastId - 3);
      return getChatMessages(`${startId}-${lastId}`, { role: 'all' })
        .map(message => `${message.role}: ${message.message}`)
        .join('\n');
    } catch {
      return '';
    }
  }

  async function updateMemoryInjection(once = false): Promise<void> {
    try {
      const memoryContext = await getMemoryInjectContext(buildRecentGenerationQuery());
      if (memoryInjection) {
        memoryInjection.uninject();
        memoryInjection = null;
      }
      if (memoryContext) {
        memoryInjection = injectPrompts([{
          id: MEMORY_INJECT_ID,
          content: memoryContext,
          position: 'in_chat',
          role: 'system',
          depth: 2,
          should_scan: true,
        }], { once });
      }
    } catch {
      // 静默处理
    }
  }

  const generationMemoryHandler = eventOn(
    tavern_events.GENERATION_AFTER_COMMANDS,
    async (_type, _option, dryRun) => {
      if (dryRun) return;
      await updateMemoryInjection(true);
    },
  );

  // 监听聊天事件：增量更新 + 标签捕获
  const messageReceivedHandler = eventOn(tavern_events.MESSAGE_RECEIVED, async (messageId: number) => {
    store.scanNewMessages?.();

    // ─── 正文标签捕获 ───
    try {
      const messages = getChatMessages(messageId);
      if (!messages || messages.length === 0) return;

      const msg = messages[0];
      // 只处理 AI 输出（assistant 角色）
      if (msg.role !== 'assistant') return;

      // ─── 闪讯社交标签捕获（优先处理，不走 APP 生成流程） ───
      await processAutoFriendTags(msg.message, messageId);
      await processBlockTags(msg.message);
      await processUnfriendTags(msg.message);

      // 1. 从正文中删除所有标签（包括 <闪讯好友>、APP 标签等）
      const cleanedContent = stripPhoneTags(msg.message);
      if (cleanedContent !== msg.message) {
        await setChatMessages([{ message_id: messageId, message: cleanedContent }]);
        console.info('[小手机] 已从正文中删除手机标签');
      }

      const captured = capturePhoneTags(msg.message);
      if (captured.length === 0) return;

      console.info(`[小手机] 捕获到 ${captured.length} 个APP标签`);

      // 2. 处理每个捕获事件（调用 API 生成 + 更新红点 + 写入 IndexedDB）
      for (const event of captured) {
        event.messageId = messageId;

        // 更新 APP 红点
        const currentBadge = registry.getApp(event.appId)?.badge || 0;
        registry.updateBadge(event.appId, currentBadge + 1);

        // 异步调用 API 生成完整内容并写入存储（不阻塞）
        processCapturedEvent(event).then(async result => {
          if (result.success) {
            console.info(`[小手机] APP「${event.appName}」内容已生成`);

            // 将生成结果写入 IndexedDB
            try {
              const db = await getLocalDB();
              await db.addEvent({
                appId: event.appId,
                type: 'captured_content',
                actor: event.attribute || 'system',
                summary: `${event.appName}: ${event.content.slice(0, 50)}`,
                data: { captured: event, generated: result.data },
                timestamp: Date.now(),
              });

              // 根据 APP 类型写入对应的数据表
              if (event.appId === 'messages' && result.data) {
                await db.appendChatMessage(event.attribute, {
                  id: `cap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                  from: event.attribute,
                  to: store.phoneData.device.owner,
                  content: typeof result.data === 'string' ? result.data : JSON.stringify(result.data),
                  timestamp: Date.now(),
                  type: 'text',
                  read: false,
                });
              } else if (event.appId === 'forum' && result.data) {
                const postData = typeof result.data === 'object' ? result.data : { content: result.data };
                await db.addForumPost({
                  id: `post_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                  title: postData.title || event.content.slice(0, 20),
                  author: event.attribute || '匿名',
                  content: postData.content || String(result.data),
                  likes: postData.likes || 0,
                  comments: postData.comments || [],
                  category: postData.category || '话题',
                  timestamp: Date.now(),
                });
              }
            } catch (dbError) {
              console.warn(`[小手机] 写入 IndexedDB 失败:`, dbError);
            }
          } else {
            console.warn(`[小手机] APP「${event.appName}」内容生成失败:`, result.error);
          }
        });
      }
    } catch (e) {
      console.warn('[小手机] 标签捕获处理失败:', e);
    }
  });

  // 聊天切换时重新加载
  const chatChangeHandler = reloadOnChatChange();

  // 卸载
  $(window).on('pagehide', async () => {
    // 清理记忆注入
    if (memoryInjection) {
      memoryInjection.uninject();
    }

    // 关闭 IndexedDB
    closeLocalDB();
    dbChatWatcher.stop();
    generationMemoryHandler.stop();

    // 清理
    styleObserver.disconnect();
    phoneHider.destroy();
    app.unmount();
    $app.remove();
    destroy();
    chatChangeHandler.stop();
    parentWindow[MINI_PHONE_MOUNT_FLAG] = false;
  });

  console.info('[小手机] 脚本已加载');
});
