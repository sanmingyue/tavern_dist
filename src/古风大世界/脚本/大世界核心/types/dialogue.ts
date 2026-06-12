export type DialoguePlanRequest = {
  sceneId?: string;
  allowedSpeakerIds?: string[];
  preferredSpeakerIds?: string[];
  includeThoughts?: boolean;
  topic?: string;
};

export type DialogueSpeakerCandidate = {
  speakerId: string;
  displayName: string;
  canSpeak: boolean;
  canThink: boolean;
  inScene: boolean;
  priority: number;
  reason: string;
};

export type DialogueTurnPlan = {
  planId: string;
  sceneId?: string;
  createdAt: string;
  outputMode: string;
  topic: string;
  speakerIds: string[];
  candidates: DialogueSpeakerCandidate[];
  includeThoughts: boolean;
  summary: string;
};

