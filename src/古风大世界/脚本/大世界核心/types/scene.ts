import type { NarrativeSceneCategory } from './narrative';

export type SceneStatus = 'active' | 'closed';

export type SceneParticipantState = {
  npcId: string;
  present: boolean;
  canSpeak: boolean;
  canAct: boolean;
  visible: boolean;
  role: string;
};

export type SceneStartPayload = {
  sceneId?: string;
  title: string;
  locationId?: string;
  category?: NarrativeSceneCategory;
  participantNpcIds?: string[];
  tags?: string[];
  summary?: string;
};

export type ScenePresencePayload = {
  sceneId?: string;
  participants: SceneParticipantState[];
  replace?: boolean;
};

export type SceneState = {
  sceneId: string;
  title: string;
  status: SceneStatus;
  locationId: string;
  category: NarrativeSceneCategory;
  startedAt: string;
  updatedAt: string;
  participantNpcIds: string[];
  participants: Record<string, SceneParticipantState>;
  tags: string[];
  summary: string;
};
