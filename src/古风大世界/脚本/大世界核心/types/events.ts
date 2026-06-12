export type WorldEventKind =
  | 'encounter'
  | 'rumor'
  | 'travel_risk'
  | 'business_risk'
  | 'sect_daily'
  | 'court_notice'
  | 'quest_hook'
  | 'custom';

export type WorldEventTemplate = {
  templateId: string;
  title: string;
  kind: WorldEventKind | string;
  weight: number;
  locationIds?: string[];
  regionIds?: string[];
  requiredTags?: string[];
  relatedNpcIds?: string[];
  consequenceType?: string;
  summary: string;
};

export type WorldEventGeneratePayload = {
  locationId?: string;
  regionId?: string;
  tags?: string[];
  maxCount?: number;
};

export type WorldEventInstance = {
  eventId: string;
  templateId?: string;
  title: string;
  kind: WorldEventKind | string;
  status: 'active' | 'resolved' | 'expired';
  locationId: string;
  regionId: string;
  createdAt: string;
  resolvedAt?: string;
  relatedNpcIds: string[];
  summary: string;
  tags: string[];
};

export type WorldEventResolvePayload = {
  eventId: string;
  outcome: 'resolved' | 'expired';
  summary?: string;
};
