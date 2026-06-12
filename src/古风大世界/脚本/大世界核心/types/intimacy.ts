export const MAX_INTIMACY_AFFECTION = 100;

export type FemaleRosterSource = 'fixed' | 'generated' | 'manual' | 'collection';

export type FemaleRosterEntry = {
  npcId: string;
  displayName: string;
  source: FemaleRosterSource | string;
  locationId: string;
  discovered: boolean;
  eligibleForHarem: boolean;
  tags: string[];
  notes: string;
};

export type FemaleRosterRegisterPayload = {
  npcId: string;
  displayName?: string;
  source?: FemaleRosterSource | string;
  locationId?: string;
  discovered?: boolean;
  tags?: string[];
  notes?: string;
};

export type AffectionInteractionKind =
  | 'talk'
  | 'airp_dialogue'
  | 'classic_airp'
  | 'gift'
  | 'outing'
  | 'aid'
  | 'poetry'
  | 'quest'
  | 'business'
  | 'custom';

export type AffectionInteractionPayload = {
  npcId: string;
  kind: AffectionInteractionKind | string;
  title?: string;
  summary?: string;
  affectionDelta?: number;
  familiarityDelta?: number;
  trustDelta?: number;
  giftId?: string;
  sceneMode?: 'none' | 'airp_dialogue' | 'classic_airp';
  tags?: string[];
};

export type HaremRankId = 'wife' | 'concubine' | 'maid' | 'companion' | 'guest' | 'custom';

export type HaremAdmitPayload = {
  npcId: string;
  rankId: HaremRankId | string;
  rankName?: string;
  route?: 'confession' | 'ceremony' | 'private_promise' | 'household_arrangement' | 'plot' | 'custom';
  sceneId?: string;
  locationId?: string;
  summary?: string;
  tags?: string[];
};

export type HaremRankSetPayload = {
  npcId: string;
  rankId: HaremRankId | string;
  rankName?: string;
  summary?: string;
};

export type HaremInteractionKind =
  | 'chat'
  | 'gift'
  | 'date'
  | 'private_time'
  | 'intimacy_invite'
  | 'cg_intimacy'
  | 'sleepover'
  | 'comfort'
  | 'assignment'
  | 'status_change'
  | 'custom';

export type HaremInteractionPayload = {
  npcId: string;
  kind: HaremInteractionKind | string;
  title?: string;
  summary?: string;
  affectionDelta?: number;
  moodDelta?: number;
  cgSceneId?: string;
  cgAssetIds?: string[];
  locationId?: string;
  tags?: string[];
};

export type HaremCgStartPayload = {
  npcId: string;
  sceneId?: string;
  title?: string;
  summary?: string;
  locationId?: string;
  cgAssetIds?: string[];
  tags?: string[];
};

export type HaremCgEndPayload = {
  sceneId?: string;
  summary?: string;
  cgAssetIds?: string[];
  unlockAlbumIds?: string[];
};

export type HaremBoundaryPlaceholderPayload = {
  npcId: string;
  locationId?: string;
  summary?: string;
  riskHint?: string;
};
