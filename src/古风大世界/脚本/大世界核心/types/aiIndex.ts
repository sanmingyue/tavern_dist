export type AiIndexRequest = {
  actionType?: string;
  sceneId?: string;
  includeFormulaScan?: boolean;
  includeMemories?: boolean;
  extraTags?: string[];
};

export type AiIndexBundle = {
  builtAt: string;
  actionType: string;
  authoritativeState: string;
  formulaScan?: string;
  currentLocationId: string;
  currentRegionId: string;
  sceneSummary: string;
  presentNpcIds: string[];
  activeQuestIds: string[];
  evidenceIds: string[];
  activeEventIds: string[];
  recentRelationTargets: string[];
  lastTravelSummary?: string;
  haremMemberIds: string[];
  eligibleHaremIds: string[];
  activeCgSceneId?: string;
  memoryNpcIds: string[];
  tags: string[];
};
