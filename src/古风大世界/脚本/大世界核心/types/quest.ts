export type QuestKind = 'mainline' | 'hiddenline' | 'sidequest' | 'daily' | 'relationship' | 'business';

export type QuestStepDefinition = {
  stepId: string;
  title: string;
  description: string;
  requiredEvidenceIds?: string[];
  nextStepIds?: string[];
  failStepIds?: string[];
  relatedNpcIds?: string[];
  relatedLocationIds?: string[];
};

export type QuestDefinition = {
  questId: string;
  title: string;
  kind: QuestKind;
  startStepId: string;
  steps: QuestStepDefinition[];
  relatedNpcIds?: string[];
  relatedLocationIds?: string[];
  tags?: string[];
};

export type QuestAcceptPayload = {
  questId: string;
  definition?: QuestDefinition;
  stepId?: string;
  relatedNpcIds?: string[];
  relatedLocationIds?: string[];
};

export type QuestAdvancePayload = {
  questId: string;
  stepId: string;
  status?: 'active' | 'completed' | 'failed';
  note?: string;
};

export type QuestEvidencePayload = {
  evidenceId?: string;
  questId?: string;
  title: string;
  summary: string;
  sourceId?: string;
  relatedNpcIds?: string[];
  relatedLocationIds?: string[];
  tags?: string[];
};

export type QuestEvidenceRecord = Required<Pick<QuestEvidencePayload, 'title' | 'summary'>> & {
  evidenceId: string;
  questId?: string;
  foundAt: string;
  sourceId?: string;
  relatedNpcIds: string[];
  relatedLocationIds: string[];
  tags: string[];
};

