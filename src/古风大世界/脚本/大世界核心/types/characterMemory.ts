export type CharacterMemoryAppendPayload = {
  npcId: string;
  summary: string;
  important?: boolean;
  sourceId?: string;
};

export type CharacterMemorySetPayload = {
  npcId: string;
  summary: string;
  importantEvents?: string[];
};
