export type FixedCharacterCategory =
  | 'mainline'
  | 'hiddenline'
  | 'beauty'
  | 'master'
  | 'court'
  | 'sect'
  | 'family'
  | 'merchant'
  | 'enemy'
  | 'common';

export type FixedCharacterProfile = {
  npcId: string;
  name: string;
  aliases?: string[];
  category: FixedCharacterCategory | string;
  factionId?: string;
  homeLocationId?: string;
  initialLocationId?: string;
  currentLocationId?: string;
  rankTitle?: string;
  powerTier?: number;
  beautyRegisterId?: string;
  ageText?: string;
  regionText?: string;
  usualLocationText?: string;
  publicIdentity?: string;
  factionName?: string;
  actualInvolvement?: string;
  martialDirection?: string;
  powerRankText?: string;
  beautyRankText?: string;
  offerText?: string;
  fearText?: string;
  currentSituation?: string;
  appearanceProfile?: string;
  personalityPlaceholder?: string;
  sourcePath?: string;
  coreInfo: string;
  formulaResourceIds?: string[];
  tags?: string[];
};

export type FixedCharacterQuery = {
  locationId?: string;
  factionId?: string;
  tag?: string;
  discoveredOnly?: boolean;
  aliveOnly?: boolean;
};

export type FixedCharacterMovePayload = {
  npcId: string;
  targetLocationId: string;
  reason?: string;
  discovered?: boolean;
};
