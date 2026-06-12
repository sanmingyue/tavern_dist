export type TravelMode = 'walk' | 'horse' | 'boat' | 'carriage' | 'fast';

export type MapLocationKind = 'country' | 'region' | 'city' | 'town' | 'village' | 'site' | 'interior' | 'wild';

export type MapRouteKind = 'road' | 'waterway' | 'mountain_path' | 'desert_route' | 'border_pass' | 'hidden_path';

export type MapLocationNode = {
  locationId: string;
  name: string;
  regionId: string;
  countryId?: string;
  parentLocationId?: string;
  kind: MapLocationKind | string;
  unlocked: boolean;
  discovered: boolean;
  tags?: string[];
  formulaResourceIds?: string[];
  state?: Record<string, unknown>;
};

export type MapRouteNode = {
  routeId: string;
  fromLocationId: string;
  toLocationId: string;
  kind: MapRouteKind | string;
  distanceLi: number;
  allowedModes: Array<TravelMode | string>;
  risk: number;
  blocked: boolean;
  unlockFlagIds?: string[];
  tags?: string[];
};

export type TravelPlanRequest = {
  targetLocationId: string;
  startLocationId?: string;
  mode?: TravelMode;
  reason?: string;
};

export type TravelPlan = {
  planId: string;
  fromLocationId: string;
  targetLocationId: string;
  routeId?: string;
  mode: TravelMode;
  distanceLi: number;
  minutes: number;
  risk: number;
  blocked: boolean;
  reason: string;
  summary: string;
};
