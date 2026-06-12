import { createId, nowIso, pushSaveLog } from '../state/defaults';
import type {
  NarrativeBlockValidationResult,
  NarrativeEffectiveOutputMode,
  NarrativeInputParseResult,
  NarrativeInputSegment,
  NarrativeModeDecision,
  NarrativeModeDecisionInput,
  NarrativeOutputBlock,
  NarrativeOutputModePreference,
  NarrativeSceneCategory,
} from '../types/narrative';
import type { GameSave } from '../types/schema';

const STAGED_CATEGORIES: NarrativeSceneCategory[] = [
  'mainline',
  'hiddenline',
  'sidequest',
  'npc_dialogue',
  'investigation',
  'court',
  'combat',
];

const CLASSIC_CATEGORIES: NarrativeSceneCategory[] = ['travel', 'daily', 'business', 'intimacy', 'strategy', 'free'];

const SELF_REFERENCE_PATTERNS = ['作为AI', '我是AI', 'AI回复', '助手回复', '系统提示', '下面是回复', '以下是回复', '我无法'];

const BANNED_SPEAKER_IDS = new Set([
  'ai',
  'AI',
  'assistant',
  '助手',
  'system',
  '系统',
  'narrator',
  '旁白',
  '旁白君',
]);

export function setNarrativeOutputMode(save: GameSave, mode: NarrativeOutputModePreference): string {
  save.narrative.outputMode = mode;
  const decision = decideNarrativeMode(save, { sceneCategory: save.narrative.currentSceneCategory });
  save.narrative.lastEffectiveOutputMode = decision.effectiveMode;
  save.narrative.lastModeDecision = decision;
  pushSaveLog(save, 'NARRATIVE_OUTPUT_MODE_SET', `正文输出模式已切换：${mode}`);
  return `正文输出模式已切换：${mode}`;
}

export function setNarrativeSceneCategory(
  save: GameSave,
  category: NarrativeSceneCategory,
  tags: string[] = [],
): string {
  save.narrative.currentSceneCategory = category;
  save.narrative.currentSceneTags = unique(tags);
  const decision = decideNarrativeMode(save, { sceneCategory: category, tags });
  save.narrative.lastEffectiveOutputMode = decision.effectiveMode;
  save.narrative.lastModeDecision = decision;
  pushSaveLog(save, 'NARRATIVE_SCENE_CATEGORY_SET', `正文场景类别已切换：${category}`);
  return `正文场景类别已切换：${category}`;
}

export function parseAndStoreUserInput(save: GameSave, rawInput: string): string {
  const parsed = parseNarrativeUserInput(rawInput);
  save.narrative.lastInputParse = parsed;
  const decision = decideNarrativeMode(save, { rawInput });
  save.narrative.lastEffectiveOutputMode = decision.effectiveMode;
  save.narrative.lastModeDecision = decision;
  pushSaveLog(save, 'NARRATIVE_USER_INPUT_PARSE', buildParseSummary(parsed));
  return buildParseSummary(parsed);
}

export function decideAndStoreNarrativeMode(save: GameSave, input: NarrativeModeDecisionInput = {}): string {
  const parsed = input.rawInput !== undefined ? parseNarrativeUserInput(input.rawInput) : save.narrative.lastInputParse;
  if (parsed && input.rawInput !== undefined) save.narrative.lastInputParse = parsed;
  const decision = decideNarrativeMode(save, input, parsed ?? undefined);
  save.narrative.currentSceneCategory = decision.sceneCategory;
  save.narrative.lastEffectiveOutputMode = decision.effectiveMode;
  save.narrative.lastModeDecision = decision;
  pushSaveLog(save, 'NARRATIVE_MODE_DECIDE', `正文模式判定：${decision.effectiveMode}，${decision.reason}`);
  return `正文模式判定：${decision.effectiveMode}，${decision.reason}`;
}

export function parseNarrativeUserInput(rawInput: string, parsedAt = nowIso()): NarrativeInputParseResult {
  const segments: NarrativeInputSegment[] = [];
  let actionStart = 0;
  let actionBuffer = '';
  let index = 0;

  const flushAction = (endIndex: number): void => {
    const text = actionBuffer.trim();
    if (text.length > 0) {
      segments.push(createInputSegment('user_action', text, actionBuffer, actionStart, endIndex, 'public'));
    }
    actionBuffer = '';
    actionStart = endIndex;
  };

  while (index < rawInput.length) {
    const char = rawInput[index];
    const quoteEnd = char === '“' ? '”' : char === '"' ? '"' : '';
    if (quoteEnd) {
      const closeIndex = rawInput.indexOf(quoteEnd, index + 1);
      if (closeIndex > index) {
        flushAction(index);
        const rawText = rawInput.slice(index, closeIndex + 1);
        const text = rawInput.slice(index + 1, closeIndex).trim();
        if (text.length > 0) {
          segments.push(createInputSegment('user_speech', text, rawText, index, closeIndex + 1, 'public'));
        }
        index = closeIndex + 1;
        actionStart = index;
        continue;
      }
    }

    if (char === '*') {
      const closeIndex = rawInput.indexOf('*', index + 1);
      if (closeIndex > index) {
        flushAction(index);
        const rawText = rawInput.slice(index, closeIndex + 1);
        const text = rawInput.slice(index + 1, closeIndex).trim();
        if (text.length > 0) {
          segments.push(createInputSegment('user_thought', text, rawText, index, closeIndex + 1, 'private'));
        }
        index = closeIndex + 1;
        actionStart = index;
        continue;
      }
    }

    if (actionBuffer.length === 0) actionStart = index;
    actionBuffer += char;
    index += 1;
  }

  flushAction(rawInput.length);

  const speechText = joinSegments(segments, 'user_speech');
  const thoughtText = joinSegments(segments, 'user_thought');
  const actionText = joinSegments(segments, 'user_action');
  return {
    rawInput,
    parsedAt,
    segments,
    speechText,
    thoughtText,
    actionText,
    hasSpeech: speechText.length > 0,
    hasThought: thoughtText.length > 0,
    hasAction: actionText.length > 0,
  };
}

export function decideNarrativeMode(
  save: GameSave,
  input: NarrativeModeDecisionInput = {},
  parsedInput = input.rawInput !== undefined ? parseNarrativeUserInput(input.rawInput) : save.narrative.lastInputParse ?? undefined,
): NarrativeModeDecision {
  const preference = save.narrative.outputMode;
  const signalTags = unique([
    ...(input.tags ?? []),
    ...classifyActionTags(input.actionType),
    ...(parsedInput?.hasSpeech ? ['user_speech'] : []),
    ...(parsedInput?.hasThought ? ['user_thought'] : []),
    ...(parsedInput?.hasAction ? ['user_action'] : []),
  ]);
  const sceneCategory = input.sceneCategory ?? inferSceneCategory(save, signalTags);
  const effectiveMode = resolveEffectiveMode(preference, sceneCategory, signalTags);
  return {
    decidedAt: nowIso(),
    preference,
    effectiveMode,
    sceneCategory,
    reason: buildDecisionReason(preference, effectiveMode, sceneCategory, signalTags),
    signalTags,
  };
}

export function validateNarrativeOutputBlocks(
  blocks: NarrativeOutputBlock[],
  allowedSpeakerIds: string[],
): NarrativeBlockValidationResult {
  const allowed = new Set(allowedSpeakerIds);
  const issues: NarrativeBlockValidationResult['issues'] = [];
  blocks.forEach((block, blockIndex) => {
    if (!block.text || block.text.trim().length === 0) {
      issues.push({ blockIndex, reasonId: 'empty_text', message: '输出块文本不能为空' });
    }
    if (SELF_REFERENCE_PATTERNS.some(pattern => block.text.includes(pattern))) {
      issues.push({ blockIndex, reasonId: 'model_self_reference', message: '输出块包含模型自述痕迹' });
    }
    if (block.kind === 'narration' && block.speakerId) {
      issues.push({ blockIndex, reasonId: 'narration_has_speaker', message: '正文描写块不应携带说话人' });
    }
    if (block.kind === 'dialogue' || block.kind === 'character_thought') {
      if (!block.speakerId) {
        issues.push({ blockIndex, reasonId: 'speaker_missing', message: '台词或心声块必须有角色 speakerId' });
      } else if (BANNED_SPEAKER_IDS.has(block.speakerId)) {
        issues.push({ blockIndex, reasonId: 'speaker_is_ai_or_system', message: '不允许 AI、助手、系统作为角色发言' });
      } else if (!allowed.has(block.speakerId)) {
        issues.push({ blockIndex, reasonId: 'speaker_not_in_scene', message: `说话人不在当前允许列表：${block.speakerId}` });
      }
    }
    if (block.kind === 'dialogue' && (block.text.includes('*') || block.text.includes('他说') || block.text.includes('她说'))) {
      issues.push({ blockIndex, reasonId: 'dialogue_not_pure', message: '角色台词块应保持纯语言，不写动作或转述' });
    }
    if (block.kind === 'character_thought' && block.visibility !== 'collapsed') {
      issues.push({ blockIndex, reasonId: 'thought_not_collapsed', message: '角色心声默认必须折叠' });
    }
  });
  return { ok: issues.length === 0, issues };
}

function resolveEffectiveMode(
  preference: NarrativeOutputModePreference,
  sceneCategory: NarrativeSceneCategory,
  signalTags: string[],
): NarrativeEffectiveOutputMode {
  if (preference === 'staged_dialogue') return 'staged_dialogue';
  if (preference === 'classic_airp') return 'classic_airp';
  if (STAGED_CATEGORIES.includes(sceneCategory)) return 'staged_dialogue';
  if (CLASSIC_CATEGORIES.includes(sceneCategory)) {
    if (signalTags.includes('user_speech') && sceneCategory === 'free') return 'staged_dialogue';
    return 'classic_airp';
  }
  return signalTags.includes('user_speech') ? 'staged_dialogue' : 'classic_airp';
}

function inferSceneCategory(save: GameSave, signalTags: string[]): NarrativeSceneCategory {
  if (signalTags.includes('mainline')) return 'mainline';
  if (signalTags.includes('hiddenline')) return 'hiddenline';
  if (signalTags.includes('sidequest')) return 'sidequest';
  if (signalTags.includes('combat')) return 'combat';
  if (signalTags.includes('strategy')) return 'strategy';
  if (signalTags.includes('business')) return 'business';
  if (signalTags.includes('travel')) return 'travel';
  if (signalTags.includes('intimacy')) return 'intimacy';
  if (signalTags.includes('user_speech')) return 'npc_dialogue';
  return save.narrative.currentSceneCategory ?? 'free';
}

function classifyActionTags(actionType?: string): string[] {
  if (!actionType) return [];
  if (actionType === 'TRAVEL' || actionType === 'TIME_ADVANCE') return ['travel'];
  if (actionType === 'COMBAT_START' || actionType === 'COMBAT_RESOLVE' || actionType.startsWith('ATB_')) return ['combat'];
  if (actionType.startsWith('STRATEGY_')) return ['strategy'];
  if (actionType === 'BUSINESS_SETTLE' || actionType.startsWith('ECONOMY_')) return ['business'];
  if (actionType === 'CONSEQUENCE_ADD') return ['sidequest'];
  return [];
}

function buildDecisionReason(
  preference: NarrativeOutputModePreference,
  effectiveMode: NarrativeEffectiveOutputMode,
  sceneCategory: NarrativeSceneCategory,
  signalTags: string[],
): string {
  if (preference !== 'auto') return `用户固定选择 ${preference}`;
  const modeName = effectiveMode === 'staged_dialogue' ? '分镜台词模式' : '传统 AIRP 正文模式';
  return `自动模式按 ${sceneCategory} 与 ${signalTags.join('、') || '无额外信号'} 判定为${modeName}`;
}

function createInputSegment(
  kind: NarrativeInputSegment['kind'],
  text: string,
  rawText: string,
  startIndex: number,
  endIndex: number,
  visibility: NarrativeInputSegment['visibility'],
): NarrativeInputSegment {
  return {
    segmentId: createId('input_segment'),
    kind,
    speakerId: '{{user}}',
    text,
    rawText,
    startIndex,
    endIndex,
    visibility,
  };
}

function joinSegments(segments: NarrativeInputSegment[], kind: NarrativeInputSegment['kind']): string {
  return segments
    .filter(segment => segment.kind === kind)
    .map(segment => segment.text)
    .join('\n')
    .trim();
}

function buildParseSummary(parsed: NarrativeInputParseResult): string {
  return `用户输入已解析：说话${parsed.hasSpeech ? '有' : '无'}，内心${parsed.hasThought ? '有' : '无'}，行动${parsed.hasAction ? '有' : '无'}`;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
