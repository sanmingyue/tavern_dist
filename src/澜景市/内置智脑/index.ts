
/**
 * 明月秋青脚本 - 智脑系统入口
 *
 * 功能：
 * 1. 用户人格分析与注入
 * 2. 动态人设生成与注入
 * 3. 正文捕获与记录
 * 4. 精准大总结（精神链记忆库）
 * 5. 记忆激活系统
 * 6. 梦呓系统
 * 7. 调度系统（串行队列）
 * 8. 后台角色行动推演
 */
import { createScriptIdDiv, teleportStyle } from '@util/script';
import App from './App.vue';
import { buildDreamtalkInjection, executeDreamtalkAnalysis, scanCharacterNamesFromContent } from './core/dreamtalk';
import { injectDynamicProfiles } from './core/dynamicProfile';
import { injectNeuralChain } from './core/neuralChain';
import { injectNsfwData, isNsfwActive } from './core/nsfwIsolation';
import { executePlotFateAnalysis, injectPlotFate } from './core/plotFate';
import {
  executeEmotionAnalysis,
  injectEmotionState,
  shouldTriggerEmotionAnalysis,
  buildEmotionSummaryForPlotFate,
  type EmotionAccumulationState,
} from './core/emotionAccumulation';
import {
  executeGrandSummary,
  getContentsSinceLast,
  shouldTriggerSummary,
} from './core/summary';
import {
  ensureRecentFloorsVisible as ensureRecentFloorsVisibleCore,
  getCapturedContentMessageIds,
  hideSummaryFloors,
} from './core/floorVisibility';
import { enqueueAnalysis, clearSchedulerQueue } from './core/scheduler';
import { executeEcosystemAnalysis, injectEcosystem } from './core/ecosystem';
import { getFinalStoryTextFromRaw } from '../services/storyTextService';
import { useMainStore, type GrandSummary } from './stores/mainStore';

export type LanjingZhinoController = {
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  destroy: () => void;
  getStore: () => ReturnType<typeof useMainStore>;
};

declare global {
  interface Window {
    LanjingZhino?: LanjingZhinoController;
    __lanjingZhinoMounted?: boolean;
  }
}

export function installLanjingZhino(options: { openPanel?: boolean } = {}): LanjingZhinoController {
  const existing = window.parent.LanjingZhino ?? window.LanjingZhino;
  if (existing && window.parent.__lanjingZhinoMounted) {
    if (options.openPanel) existing.openPanel();
    return existing;
  }

  window.parent.__lanjingZhinoMounted = true;
  const pinia = createPinia();
  const app = createApp(App, { embedded: true }).use(pinia);

  // ========== 前端面板挂载（div模式，挂载到酒馆网页body） ==========

  const $app = createScriptIdDiv().addClass('lanjing-zhino-app').appendTo('body');
  const { destroy } = teleportStyle();
  const vm = app.mount($app[0]) as {
    openPanel?: () => void;
    closePanel?: () => void;
    togglePanel?: () => void;
  };

  // 捕获开场白（第0层不会触发 MESSAGE_RECEIVED 事件）
  useMainStore(pinia).captureFloorZero();

  // ========== 世界书角色名缓存 ==========

  /** 从世界书条目中提取的角色名集合（每次推演时实时更新） */
  let worldBookNames = new Set<string>();
  /** 世界书角色名→内容（用于手动注入到 callGenerateRaw 调用中） */
  let worldBookContents = new Map<string, string>();
  /** 原始世界书条目（保留用于后续重新扫描） */
  let worldBookRawEntries: any[] = [];

  function refreshWorldBookCache(store: ReturnType<typeof useMainStore>) {
    if (worldBookRawEntries.length === 0) return;
    const knownNames = [
      ...store.getAllCharacterNames(),
      ...store.getDreamtalkCharacterNames(),
      ...store.dynamicProfiles.map(p => p.characterName),
      ...(store.ecosystemManualChars || '').split(',').map(s => s.trim()).filter(Boolean),
    ];
    const knownNamesSet = new Set(knownNames);
    if (knownNamesSet.size === 0) return;

    const names = new Set<string>();
    const contents = new Map<string, string>();

    for (const entry of worldBookRawEntries) {
      const entryContent: string = (entry as any).content || '';
      // entry.key / entry.keysecondary 可能是 string 或 string[]
      const rawKey = (entry as any).key;
      const rawKeySecondary = (entry as any).keysecondary;
      const keyStr = Array.isArray(rawKey) ? rawKey.join(',') : (rawKey || '');
      const keySecStr = Array.isArray(rawKeySecondary) ? rawKeySecondary.join(',') : (rawKeySecondary || '');
      const keys = [
        ...keyStr.split(',').map((k: string) => k.trim().toLowerCase()),
        ...keySecStr.split(',').map((k: string) => k.trim().toLowerCase()),
      ].filter(Boolean);
      const contentLower = entryContent.toLowerCase();

      for (const name of knownNamesSet) {
        const nameLower = name.toLowerCase();
        const nameNorm = nameLower.replace(/\s*\(.+?\)\s*/g, '').trim();
        if (keys.some(k => k.includes(nameNorm) || nameNorm.includes(k))
            || contentLower.includes(nameNorm)
            || contentLower.includes(nameLower)) {
          names.add(name);
          const existing = contents.get(name) || '';
          contents.set(name, existing ? existing + '\n---\n' + entryContent : entryContent);
        }
      }
    }

    if (names.size > 0) {
      worldBookNames = names;
      worldBookContents = contents;
      console.info(`[智脑] 世界书角色缓存: ${[...names].join('、')} (${names.size}/${knownNamesSet.size}个, ${contents.size}条内容)`);
    }
  }

  const worldInfoHandler = eventOn(tavern_events.WORLDINFO_ENTRIES_LOADED, (lores) => {
    // 保存原始条目供后续重新扫描（过滤关闭的条目）
    const allRawEntries = [
      ...(lores.characterLore || []),
      ...(lores.globalLore || []),
      ...(lores.chatLore || []),
      ...(lores.personaLore || []),
    ];
    worldBookRawEntries = allRawEntries.filter((e: any) => e.enabled !== false);
    const store = useMainStore(pinia);
    refreshWorldBookCache(store);
  });

  // ========== 正文捕获系统 ==========

  // 监听AI回复完成 → 捕获正文 + 记录用户输入 + 检查是否触发大总结 + 后台推演
  const messageReceivedHandler = eventOn(tavern_events.MESSAGE_RECEIVED, (messageId, type) => {
    console.info(`[智脑] MESSAGE_RECEIVED #${messageId} type=${type || 'undefined'}`);
    try {
      const store = useMainStore(pinia);
      if (!store.settings.captureEnabled) {
        console.info(`[智脑] 跳过 #${messageId}: 捕获已禁用`);
        return;
      }

      // 只跳过明确不需要捕获的类型
      if (type === 'quiet' || type === 'command' || type === 'extension') {
        console.info(`[智脑] 跳过 #${messageId}: type=${type} (已过滤)`);
        return;
      }

      const aiMessages = getChatMessages(messageId, { role: 'assistant' });
      if (!aiMessages || aiMessages.length === 0) {
        console.info(`[智脑] 跳过 #${messageId}: getChatMessages 返回 ${aiMessages ? aiMessages.length : 'null/undefined'} 条`);
        return;
      }

      const aiMsg = aiMessages[0];
      const content = getFinalStoryTextFromRaw(aiMsg.message, { messageId, source: 'ai_output' });
      if (content) {
        store.captureContent(messageId, content);
        console.info(`[智脑] ✅ 捕获楼层 #${messageId} 正文 (${content.length} 字)`);

        // 记录用户输入
        const userMessages = getChatMessages(messageId - 1, { role: 'user' });
        if (userMessages && userMessages.length > 0) {
          store.recordUserInput(messageId - 1, userMessages[0].message, content);
        }

        // 检查是否应该触发大总结（通过调度器入队）
        checkAndTriggerSummary(store);

        // 后台推演：每 N 楼触发，必须在酒馆 AI 回复完成后
        if (store.settings.ecosystemEnabled) {
          const capturedCount = store.capturedContents.length;
          if (capturedCount > 0 && capturedCount % store.settings.ecosystemInterval === 0) {
            enqueueAnalysis('ecosystem', async () => {
              await triggerEcosystemAnalysis(store);
            });
          }
        }
      } else {
        console.info(`[智脑] 跳过 #${messageId}: 最终正文清洗后为空 (消息长度=${aiMsg.message?.length || 0})`);
      }
    } catch (err) {
      console.error(`[智脑] ❌ MESSAGE_RECEIVED #${messageId} 异常:`, err);
    }
  });

  // 监听消息被swipe → 更新正文记录
  const messageSwipedHandler = eventOn(tavern_events.MESSAGE_SWIPED, messageId => {
    const store = useMainStore(pinia);
    if (!store.settings.captureEnabled) return;

    setTimeout(() => {
      const aiMessages = getChatMessages(messageId, { role: 'assistant' });
      if (aiMessages.length === 0) return;

      const aiMsg = aiMessages[0];
      const content = getFinalStoryTextFromRaw(aiMsg.message, { messageId, source: 'ai_output' });
      if (content) {
        store.captureContent(messageId, content);
        console.info(`[智脑] 更新楼层 #${messageId} 正文 (swipe)`);

        const userMessages = getChatMessages(messageId - 1, { role: 'user' });
        if (userMessages.length > 0) {
          store.recordUserInput(messageId - 1, userMessages[0].message, content);
        }
      }
    }, 500);
  });

  // ========== 情绪积累系统（用户发送消息时触发） ==========

  const messageSentHandler = eventOn(tavern_events.MESSAGE_SENT, () => {
    const store = useMainStore(pinia);
    // 标记为真实聊天消息：MESSAGE_SENT 只在用户发消息时触发，generateRaw 不会
    store._isRealChatMessage = true;
    if (!store.settings.emotionEnabled) return;

    // 更新计数器
    const currentState = store.emotionState ?? {
      characters: [],
      userFloorsSinceLastAnalysis: 0,
      analysisCount: 0,
      lastAnalysisFloor: 0,
    };
    currentState.userFloorsSinceLastAnalysis++;

    // 检查是否达到触发间隔
    if (shouldTriggerEmotionAnalysis(currentState.userFloorsSinceLastAnalysis, store.settings.emotionInterval)) {
      console.log(`[智脑-情绪] 计数到达阈值 (${currentState.userFloorsSinceLastAnalysis}/${store.settings.emotionInterval})，触发分析`);
      // 通过调度器入队，确保不与其他 AI 调用同时执行
      enqueueAnalysis('emotion', async () => {
        await triggerEmotionAnalysis(store, currentState);
      });
    } else {
      store.updateEmotionState(currentState);
    }
  });

  async function triggerEmotionAnalysis(
    store: ReturnType<typeof useMainStore>,
    currentState: EmotionAccumulationState,
  ) {
    try {
      const currentFloor = getLastMessageId();
      const previousCharacters = currentState.characters.length > 0 ? currentState.characters : null;

      const emotionStart = Date.now();
      // 取最近20条聊天记录（10轮对话）手动注入，generateRaw+ordered_prompts时max_chat_history不生效
      const recentMessages = getChatMessages(`0-${currentFloor}`, {})
        .slice(-20)
        .map((m: any) => `[${m.is_user ? '{{user}}' : 'AI'}]: ${m.message || m.mes || ''}`)
        .join('\n\n');
      console.info(`[智脑-情绪] ▶ 第${currentState.analysisCount + 1}次分析开始 | 当前楼层:#${currentFloor} 上次楼层:#${currentState.lastAnalysisFloor} 已有角色:${currentState.characters.length} 聊天记录:${recentMessages.length}条`);
      const { characters: newCharacters, dynamicProfiles } = await executeEmotionAnalysis(previousCharacters, store.dynamicProfiles, currentFloor, store.getUserName(), recentMessages);

      const newState: EmotionAccumulationState = {
        characters: newCharacters,
        userFloorsSinceLastAnalysis: 0,
        analysisCount: currentState.analysisCount + 1,
        lastAnalysisFloor: currentFloor,
      };
      store.updateEmotionState(newState);

      // 更新动态人设（从大总结迁移到情绪积累）
      for (const profile of dynamicProfiles) {
        store.updateDynamicProfile(profile);
      }

      store.forcePersist(); // 立即落盘
      const chars = newCharacters.map(c => `${c.characterName}(${c.dimensions.length}维)`).join(', ');
      console.info(`[智脑-情绪] ✅ 完成 | 角色:${chars} 动态人设:${dynamicProfiles.length} | 耗时${Date.now() - emotionStart}ms`);
    } catch (error) {
      console.error('[智脑-情绪] ❌ 分析失败:', error);
    }
  }

  // ========== 提示词注入系统 ==========

  const completionReadyHandler = eventOn(tavern_events.CHAT_COMPLETION_SETTINGS_READY, completion => {
    const store = useMainStore(pinia);

    // --- 大总结注入（每次生成请求时动态获取最新总结内容） ---
    const latestSummary = store.getLatestSummary();
    console.log(`[智脑-注入诊断] summaries总数=${store.summaries.length}, latestSummary=${latestSummary ? 'v'+latestSummary.version : 'null'}, rawText长度=${latestSummary?.rawText?.length || 0}, dynamicProfiles=${store.dynamicProfiles.length}`);
    if (store.settings.summaryInjectionEnabled && latestSummary && latestSummary.rawText) {
      injectSummaryIntoCompletion(completion.messages, latestSummary);
    } else {
      console.warn('[智脑] ⚠️ 剧情摘要未注入: latestSummary=' + !!latestSummary + ', rawText=' + !!(latestSummary?.rawText));
    }

    // --- 动态人设注入 ---
    if (store.settings.dynamicProfileEnabled && store.dynamicProfiles.length > 0) {
      const latestCaptured = store.capturedContents[store.capturedContents.length - 1];
      const scanText = latestCaptured?.content || '';
      const allNames = [...store.getAllCharacterNames(), ...store.getDreamtalkCharacterNames()];
      injectDynamicProfiles(store.dynamicProfiles, scanText, Array.from(new Set(allNames)));
    }

    // --- 神经链记忆激活 ---
    if (store.settings.memoryActivationEnabled) {
      const latestMemory = store.getLatestSummary()?.characterMemories || [];
      console.log(`[智脑-注入诊断] 记忆激活: enabled=true, characterMemories数量=${latestMemory.length}`);
      if (latestMemory.length > 0) {
        const latestCaptured = store.capturedContents[store.capturedContents.length - 1];
        const scanText = latestCaptured?.content || '';
        const allNames = store.getAllCharacterNames();
        const characterEntries = latestMemory.map(m => ({
          name: m.characterName,
          aliases: m.aliases || [],
        }));
        const userName = store.getUserName();
        injectNeuralChain(store, latestMemory, scanText, allNames, characterEntries, userName);
      }
    }

    // --- 梦呓注入 ---
    if (store.settings.dreamtalkEnabled && store.dreamtalk) {
      injectDreamtalkIntoUserMessage(completion.messages, store);
    }

    // --- NSFW隔离层注入 ---
    if (isNsfwActive()) {
      const latestCaptured2 = store.capturedContents[store.capturedContents.length - 1];
      const scanText2 = latestCaptured2?.content || '';
      const allNames2 = [...store.getAllCharacterNames(), ...store.getDreamtalkCharacterNames()];
      const currentChars = scanCharacterNamesFromContent(scanText2, Array.from(new Set(allNames2)));
      injectNsfwData(store.nsfwMemories, store.nsfwDreamtalk, store.nsfwDynamicProfiles, currentChars);
    }

    // --- 倒果为因注入 ---
    if (store.settings.plotFateEnabled && store.plotFate) {
      injectPlotFate(store.plotFate);
    }

    // --- 情绪积累注入 ---
    if (store.settings.emotionEnabled && store.emotionState?.characters?.length) {
      injectEmotionState(store.emotionState.characters);
    }

    // --- 后台行动推演注入（已通过 injectEcosystem 持久注入，此处确保状态同步） ---
    if (store.settings.ecosystemEnabled && store.ecosystemState) {
      injectEcosystem(store.ecosystemState);
    }

    // 重置真实聊天消息标记
    store._isRealChatMessage = false;
  });

  // ========== 大总结注入到 messages（splice 方式，确保在导出的上下文中可见） ==========

  function injectSummaryIntoCompletion(
    messages: SillyTavern.SendingMessage[],
    summary: GrandSummary,
  ): void {
    const injectionText = buildSummaryInjectionText(summary);
    if (!injectionText) {
      console.warn('[智脑] ⚠️ buildSummaryInjectionText 返回空, rawText前300字:', summary.rawText?.substring(0, 300));
      console.warn('[智脑] ⚠️ sections[0]前300字:', (summary.rawText || '').split(/---SECTION---/i)[0]?.substring(0, 300));
      return;
    }

    console.log(`[智脑-注入诊断] summary注入文本长度=${injectionText.length}, 前150字: ${injectionText.substring(0, 150)}`);
    console.log(`[智脑-注入诊断] messages总数=${messages.length}, 寻找注入位置...`);

    let injected = false;

    // 策略：找到包含 <chathistory> 的消息，直接在它的 content 里把摘要塞在 <chathistory> 之前
    // 这样摘要才真正紧贴 <chathistory>，而不是隔着一整条世界书消息
    for (let i = 0; i < messages.length; i++) {
      const content = messages[i].content;
      if (typeof content !== 'string') continue;
      if (content.includes('<chathistory>')) {
        messages[i].content = content.replace('<chathistory>', injectionText + '\n<chathistory>');
        injected = true;
        console.log(`[智脑-注入诊断] 紧贴 <chathistory> 前注入成功 (消息index=${i})`);
        break;
      }
    }

    // 备选：如果没找到 <chathistory>，找 </chathistory> 在其后紧贴注入
    if (!injected) {
      for (let i = 0; i < messages.length; i++) {
        const content = messages[i].content;
        if (typeof content !== 'string') continue;
        if (content.includes('</chathistory>')) {
          messages[i].content = content.replace('</chathistory>', '</chathistory>\n' + injectionText);
          injected = true;
          console.log(`[智脑-注入诊断] 紧贴 </chathistory> 后注入成功 (消息index=${i})`);
          break;
        }
      }
    }

    // 兜底：splice 新消息
    if (!injected && messages.length > 6) {
      const idx = messages.length - 6;
      messages.splice(idx, 0, { role: 'system', content: injectionText });
      injected = true;
      console.log(`[智脑-注入诊断] 兜底注入 (index=${idx}, 总计${messages.length}条消息)`);
    }

    console.info(`[智脑] ✅ 剧情摘要已注入 (injected=${injected}, textLength=${injectionText.length})`);
  }

  // ========== 大总结注入文本构建 ==========

  function buildSummaryInjectionText(summary: GrandSummary): string {
    if (!summary.rawText) { console.warn('[智脑-注入诊断] rawText为空'); return ''; }
    const sections = summary.rawText.split(/---SECTION---/i);
    const raw = sections[0] || '';
    console.log(`[智脑-注入诊断] buildSummaryInjectionText: sections共${sections.length}段, sections[0]长度=${raw.length}, sections[0]前100字: ${raw.substring(0, 100)}`);
    if (!raw.trim()) { console.warn('[智脑-注入诊断] sections[0]为空'); return ''; }

    const clean = raw
      .replace(/^###\s+第[一二三四]部分[：:][^\n]*\n*/gm, '')
      .replace(/^\[剧情摘要\]\s*/im, '')
      .replace(/^\[角色记忆\]\s*/im, '')
      .trim();

    console.log(`[智脑-注入诊断] 清洗后clean长度=${clean.length}, 前100字: ${clean.substring(0, 100)}`);
    if (!clean) { console.warn('[智脑-注入诊断] 清洗后clean为空'); return ''; }

    const parts: string[] = [];
    parts.push(`<grand_summary version="${summary.version}" generated_at="${summary.generatedAt}">`);
    parts.push(clean);
    parts.push('</grand_summary>');
    return parts.join('\n');
  }

  // ========== 梦呓注入函数 ==========

  function injectDreamtalkIntoUserMessage(
    messages: SillyTavern.SendingMessage[],
    store: ReturnType<typeof useMainStore>,
  ) {
    // 只对真实聊天消息注入：MESSAGE_SENT 触发才为 true，generateRaw 的分析请求不会触发
    if (!store._isRealChatMessage) return;

    const dreamtalkData = store.dreamtalk;
    if (!dreamtalkData) return;

    let lastUserIdx = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIdx = i;
        break;
      }
    }
    if (lastUserIdx === -1) return;

    const lastUserMsg = messages[lastUserIdx];
    if (typeof lastUserMsg.content !== 'string') return;

    let latestContent = '';
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && typeof messages[i].content === 'string') {
        latestContent = messages[i].content as string;
        break;
      }
    }

    // 和神经链记忆激活用同一套判定：从 characterMemories 拿别名，扫名一致
    const latestMemory = store.getLatestSummary()?.characterMemories || [];
    const characterEntries = latestMemory.map(m => ({
      name: m.characterName,
      aliases: m.aliases || [],
    }));
    const allNames = store.getAllCharacterNames();
    const currentCharacters = scanCharacterNamesFromContent(
      latestContent + lastUserMsg.content,
      allNames,
      characterEntries,
    );

    const dreamtalkText = buildDreamtalkInjection(dreamtalkData, currentCharacters);
    // 插入到 "Qiuqingzi: 我即将开始创作" 正上方
    // 模板结构: ...</UpdateVariable> \n <dreamtalk> \n Qiuqingzi: 我即将开始创作...
    const sceneStartMarker = 'Qiuqingzi: 我即将开始创作';
    const sceneStartIdx = lastUserMsg.content.lastIndexOf(sceneStartMarker);
    if (sceneStartIdx !== -1) {
      lastUserMsg.content =
        lastUserMsg.content.slice(0, sceneStartIdx) +
        dreamtalkText + '\n\n' +
        lastUserMsg.content.slice(sceneStartIdx);
    } else {
      // 没找到，回退到 "从此处开始" 之前
      const altMarker = '从此处开始';
      const altIdx = lastUserMsg.content.lastIndexOf(altMarker);
      if (altIdx !== -1) {
        lastUserMsg.content =
          lastUserMsg.content.slice(0, altIdx) +
          dreamtalkText + '\n\n' +
          lastUserMsg.content.slice(altIdx);
      } else {
        // 回退到 <interactive_input> 之前
        const interactiveIdx = lastUserMsg.content.lastIndexOf('<interactive_input>');
        if (interactiveIdx !== -1) {
          lastUserMsg.content =
            lastUserMsg.content.slice(0, interactiveIdx) +
            dreamtalkText + '\n\n' +
            lastUserMsg.content.slice(interactiveIdx);
        } else {
          // 都没找到，回退到破限标记之后
          const resetMarker = '[RESET ALL OF THE ABOVE TO NULL]';
          const resetIdx = lastUserMsg.content.indexOf(resetMarker);
          if (resetIdx !== -1) {
            const afterReset = resetIdx + resetMarker.length;
            lastUserMsg.content =
              lastUserMsg.content.slice(0, afterReset) + '\n\n' + dreamtalkText +
              lastUserMsg.content.slice(afterReset);
          } else {
            // 兜底 prepend
            lastUserMsg.content = dreamtalkText + '\n\n' + lastUserMsg.content;
          }
        }
      }
    }
    console.info(`[智脑] 梦呓已注入用户消息 (${currentCharacters.length} 角色匹配)`);
  }

  // ========== 梦呓分析触发 ==========

  async function triggerDreamtalkAnalysis(store: ReturnType<typeof useMainStore>): Promise<void> {
    store.setDreamtalkInProgress(true);
    const style = (store.settings as any).preferredPlayStyle || undefined;
    try {
      console.info(`[智脑] 正在分析用户行为模式（梦呓）... (${style || '自动判定'})`);
      const { dreamtalk, nsfwDreamtalk } = await executeDreamtalkAnalysis(store.userInputRecords, store.persona.rawInput, store.dreamtalk ?? undefined, style, store.getUserName());
      store.updateDreamtalk(dreamtalk);
      if (nsfwDreamtalk) {
        store.updateNsfwDreamtalk(nsfwDreamtalk);
        console.info('[智脑] NSFW梦呓数据已更新');
      }
      store.forcePersist(); // 兜底（updateDynamicProfile 循环内有 N 次写入）
      console.info(`[智脑] 梦呓分析完成 (${dreamtalk.characterInteractions.length} 角色交互模式)`);
    } catch (error: any) {
      console.error('[智脑] 梦呓分析失败:', error);
      const msg = error?.message || String(error);
      try { window.toastr?.error(msg, '❌ 梦呓分析失败', { timeOut: 8000, extendedTimeOut: 3000 }); } catch(_) {}
    } finally {
      store.setDreamtalkInProgress(false);
    }
  }

  async function ensureRecentFloorsVisible() {
    return ensureRecentFloorsVisibleCore('affected');
  }

  // ========== 大总结触发（通过调度器入队） ==========

  async function checkAndTriggerSummary(store: ReturnType<typeof useMainStore>) {
    if (store.summaryInProgress) return;

    if (!shouldTriggerSummary(store.capturedContents, store.lastSummaryAtMessageId, store.settings.summaryInterval, store.settings.preserveRecentFloors)) {
      return;
    }

    // 通过调度器入队，确保大总结链（大总结→梦呓→倒果为因）串行执行
    enqueueAnalysis('summary_chain', async () => {
      await executeSummaryChain(store);
    });
  }

  async function executeSummaryChain(store: ReturnType<typeof useMainStore>) {
    store.setSummaryInProgress(true);
    console.info('[智脑] 触发大总结');

    // 获取待总结内容（排除最新 N 条不总结的 AI 回复）
    const pendingContents = getContentsSinceLast(store.capturedContents, store.lastSummaryAtMessageId, store.settings.preserveRecentFloors);
    if (pendingContents.length === 0) {
      console.info('[智脑] 排除最新楼层后无可总结内容，跳过');
      store.setSummaryInProgress(false);
      return;
    }

    try {
      // 大总结引导弹窗：用户可填写总结方向
      let userGuidance = '';
      if (store.requestSummaryGuidance) {
        const guidance = await store.requestSummaryGuidance(pendingContents.length);
        if (guidance === null) {
          // 用户点击取消，跳过本次总结
          console.info('[智脑] 用户取消大总结');
          store.setSummaryInProgress(false);
          return;
        }
        userGuidance = guidance;
      }

      const previousSummary = store.getLatestSummary();
      console.log(`[智脑-index] 读取 settings: memoryMin=${store.settings.memoryMinPerChar} (type:${typeof store.settings.memoryMinPerChar}), memoryMax=${store.settings.memoryMaxPerChar} (type:${typeof store.settings.memoryMaxPerChar})`);
      const { summary, nsfwMemories, dateFormat } = await executeGrandSummary(pendingContents, previousSummary, store.storyDateFormat, store.settings.memoryMinPerChar, store.settings.memoryMaxPerChar, userGuidance, store.getUserName());
      const summarizedMessageIds = getCapturedContentMessageIds(pendingContents);
      const summarizedUpTo = summarizedMessageIds[summarizedMessageIds.length - 1] ?? store.lastSummaryAtMessageId;

      // Toastr 弹窗警告：AI 输出的角色记忆为空
      const totalNewMemories = summary.characterMemories.reduce(
        (s, m) => s + (m.coreMemories?.length || 0) + (m.recentMemories?.length || 0),
        0,
      );
      if (totalNewMemories === 0) {
        console.warn('[智脑] ⚠️ AI 输出的角色记忆为空！可能是格式异常，建议重新总结');
        try {
          window.toastr?.warning(
            'AI 输出的角色记忆为空！可能是格式异常，建议重新总结',
            '⚠️ 明月秋青',
            { timeOut: 8000, extendedTimeOut: 3000 },
          );
        } catch(e) {}
      }

      store.addSummary(summary, summarizedUpTo, summarizedMessageIds);
      // 增量模式：rawText Section 2 的合并由 assembledSummary 在读取时自动完成
      if (dateFormat) store.storyDateFormat = dateFormat;

      // 存储NSFW记忆
      if (nsfwMemories.length > 0) {
        store.updateNsfwMemories(nsfwMemories);
        console.info(`[智脑] NSFW记忆已更新 (${nsfwMemories.length} 角色)`);
      }

      console.info(`[智脑] 大总结 v${summary.version} 完成 (${summary.characterMemories.length} 角色)`);

      // ★ 总结完成，立刻标记结束，避免后续后台任务阻塞 UI 进度显示
      store.setSummaryInProgress(false);

      const hiddenIds = await hideSummaryFloors(summarizedUpTo, 0, 'affected');
      if (hiddenIds.length > 0) {
        console.info(`[智脑] ✅ 已隐藏 ${hiddenIds.length} 个已总结楼层`);
      } else {
        console.info(`[智脑] ⚠️ 未隐藏任何楼层 (summarizedUpTo=${summarizedUpTo})`);
      }

      // 大总结完成后触发梦呓+倒果为因（拆为独立调度任务，不再阻塞 summary_chain）
      enqueueAnalysis('dreamtalk_chain', async () => {
        await triggerDreamtalkAnalysis(store);
        if (store.settings.plotFateEnabled) {
          await triggerPlotFateAnalysis(store);
        }
      });
    } catch (error: any) {
      console.error('[智脑] 大总结失败:', error);
      // ★ 大总结失败 → 清空调度队列，后续任务无意义
      clearSchedulerQueue();
      console.info('[智脑-调度] 已清空队列（大总结失败）');
      // 创建空总结占位，方便用户点重新总结
      const version = (store.getLatestSummary()?.version ?? 0) + 1;
      const summarizedMessageIds = getCapturedContentMessageIds(pendingContents);
      const failedSummary: GrandSummary = {
        version,
        generatedAt: new Date().toISOString(),
        upToMessageId: summarizedMessageIds[summarizedMessageIds.length - 1],
        coveredMessageIds: summarizedMessageIds,
        characterMemories: [],
        timeline: [],
        characterTable: [],
        rawText: '总结失败，请重新总结',
      };
      store.addSummary(failedSummary, failedSummary.upToMessageId, summarizedMessageIds);
      const msg = error?.message || String(error);
      try { window.toastr?.error(msg, '❌ 大总结失败：请重新总结', { timeOut: 8000, extendedTimeOut: 3000 }); } catch(_) {}
    } finally {
      store.setSummaryInProgress(false);
    }
  }

  // ========== 倒果为因分析触发 ==========

  async function triggerPlotFateAnalysis(store: ReturnType<typeof useMainStore>): Promise<void> {
    try {
      const latestSummary = store.getLatestSummary();
      if (!latestSummary) { console.log('[智脑-倒果] 无摘要，跳过'); return; }

      const recentContents = store.capturedContents.filter(c => c.messageId > store.lastSummaryAtMessageId);
      const fateStart = Date.now();
      console.info(`[智脑-倒果] ▶ 分析开始 | 摘要:v${latestSummary.version} 最新内容:${recentContents.length}条 上次节奏:${store.plotFate?.currentRhythm || '无'}`);

      const newState = await executePlotFateAnalysis(latestSummary, recentContents, store.plotFate, store.getUserName());
      store.updatePlotFate(newState);

      if (newState.triggeredFate) {
        console.info(`[智脑-倒果] ⚡ 转折点就绪: "${newState.triggeredFate.description}"`);
      }
      console.info(`[智脑-倒果] ✅ 完成 | 节奏:${newState.currentRhythm} ${newState.currentFates.length}果 | 耗时${Date.now() - fateStart}ms`);
    } catch (error) {
      console.error('[智脑-倒果] ❌ 分析失败:', error);
    }
  }

  // ========== 后台行动推演触发 ==========

  async function triggerEcosystemAnalysis(store: ReturnType<typeof useMainStore>): Promise<void> {
    try {
      const latestSummary = store.getLatestSummary();
      if (!latestSummary) { console.log('[智脑-生态] 无摘要，跳过后台推演'); return; }

      // 在场/不在场由 AI 根据最近回复自行判断，不做代码扫描
      const userName = store.getUserName();

      // 提取最近 1 条 AI 回复作为推演上下文
      const recentAiReplies: string[] = [];
      const allCaptured = store.capturedContents;
      for (let i = allCaptured.length - 1; i >= 0 && recentAiReplies.length < 1; i--) {
        recentAiReplies.unshift(allCaptured[i].content);
      }

      // 手动指定角色（逗号分隔，最多5个，跟随聊天保存，排除主角）
      const rawManualChars = store.ecosystemManualChars || '';
      const manualChars = rawManualChars
        ? rawManualChars.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5)
            .filter(c => c !== userName && c !== '{{user}}')
        : [];
      // 用当前已知角色名重新扫描世界书（确保手动指定/新动态人设能被匹配到）
      refreshWorldBookCache(store);
      console.info(`[智脑-生态] 手动角色原始值="${rawManualChars}" → 解析后=[${manualChars.join(', ')}] (AI自行判断在场)`);
      console.info(`[智脑-生态] 世界书状态: names=${worldBookNames.size}个 contents=${worldBookContents.size}条 | ${[...worldBookNames].join(', ') || '(空)'}`);

      const ecoStart = Date.now();
      const modeLabel = manualChars.length > 0 ? `手动:${manualChars.join('、')}` : '自动';
      console.info(`[智脑-生态] ▶ 第${(store.ecosystemState?.analysisCount ?? 0) + 1}次推演开始 | ${modeLabel}`);

      const newState = await executeEcosystemAnalysis(
        latestSummary,
        store.dynamicProfiles,
        store.ecosystemState,
        worldBookNames,
        worldBookContents,
        manualChars,
        recentAiReplies,
        userName,
      );
      store.updateEcosystemState(newState);

      // 更新注入
      injectEcosystem(newState);

      console.info(`[智脑-生态] ✅ 完成 | ${newState.actors.length}角色 ${newState.backgroundEvents.length}事件 | 耗时${Date.now() - ecoStart}ms`);
      if (newState.rawOutput) {
        console.info(`[智脑-生态] 📥 发送给AI的输入:\n${newState.rawInput}`);
        console.info(`[智脑-生态] 📝 AI原始输出:\n${newState.rawOutput}`);
      }
    } catch (error) {
      console.error('[智脑-生态] ❌ 推演失败:', error);
    }
  }

  // 聊天切换时清空调度队列
  const chatChangedHandler = eventOn(tavern_events.CHAT_CHANGED, () => {
    clearSchedulerQueue();
  });

  // ========== 卸载清理 ==========

  const pagehideHandler = () => {
    worldInfoHandler.stop();
    messageReceivedHandler.stop();
    messageSwipedHandler.stop();
    messageSentHandler.stop();
    completionReadyHandler.stop();
    chatChangedHandler.stop();
    clearSchedulerQueue();
    app.unmount();
    $app.remove();
    destroy();
    window.parent.__lanjingZhinoMounted = false;
    delete window.parent.LanjingZhino;
    delete window.LanjingZhino;
  };
  $(window).on('pagehide', pagehideHandler);

  const controller: LanjingZhinoController = {
    openPanel: () => vm.openPanel?.(),
    closePanel: () => vm.closePanel?.(),
    togglePanel: () => vm.togglePanel?.(),
    destroy: () => {
      $(window).off('pagehide', pagehideHandler);
      pagehideHandler();
    },
    getStore: () => useMainStore(pinia),
  };
  window.LanjingZhino = controller;
  window.parent.LanjingZhino = controller;
  if (options.openPanel) controller.openPanel();

  console.info('[澜景智脑] 内置智脑已加载');
  return controller;
}
