export type NarrativeOutputModePreference = 'auto' | 'staged_dialogue' | 'classic_airp';

export type NarrativeEffectiveOutputMode = 'staged_dialogue' | 'classic_airp';

export type NarrativeSceneCategory =
  | 'mainline'
  | 'hiddenline'
  | 'sidequest'
  | 'npc_dialogue'
  | 'investigation'
  | 'court'
  | 'combat'
  | 'strategy'
  | 'travel'
  | 'daily'
  | 'business'
  | 'intimacy'
  | 'free';

export type NarrativeInputSegmentKind = 'user_speech' | 'user_thought' | 'user_action';

export type NarrativeVisibility = 'public' | 'private' | 'collapsed';

export type NarrativeInputSegment = {
  segmentId: string;
  kind: NarrativeInputSegmentKind;
  speakerId: '{{user}}';
  text: string;
  rawText: string;
  startIndex: number;
  endIndex: number;
  visibility: NarrativeVisibility;
};

export type NarrativeInputParseResult = {
  rawInput: string;
  parsedAt: string;
  segments: NarrativeInputSegment[];
  speechText: string;
  thoughtText: string;
  actionText: string;
  hasSpeech: boolean;
  hasThought: boolean;
  hasAction: boolean;
};

export type NarrativeModeDecisionInput = {
  rawInput?: string;
  actionType?: string;
  sceneCategory?: NarrativeSceneCategory;
  tags?: string[];
};

export type NarrativeModeDecision = {
  decidedAt: string;
  preference: NarrativeOutputModePreference;
  effectiveMode: NarrativeEffectiveOutputMode;
  sceneCategory: NarrativeSceneCategory;
  reason: string;
  signalTags: string[];
};

export type NarrativeOutputBlockKind = 'narration' | 'dialogue' | 'character_thought';

export type NarrativeOutputBlock = {
  blockId?: string;
  kind: NarrativeOutputBlockKind;
  text: string;
  speakerId?: string;
  visibility?: NarrativeVisibility;
};

export type NarrativeBlockValidationIssue = {
  blockIndex: number;
  reasonId: string;
  message: string;
};

export type NarrativeBlockValidationResult = {
  ok: boolean;
  issues: NarrativeBlockValidationIssue[];
};
