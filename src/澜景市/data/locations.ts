export interface LocationEdge {
  targetId: string;
  minutes: number;
  mode?: '步行' | '公交' | '地铁' | '打车' | '其他';
}

export interface LocationNode {
  id: string;
  name: string;
  district: string;
  street: string;
  detail?: string;
  x?: number;
  y?: number;
  connected?: LocationEdge[];
  links?: LocationEdge[];
}

// P3 地图组后续会替换/扩展这里。当前只保留可运行接口和一个兜底点位。
export const DEFAULT_LOCATION_ID = 'unknown';

export const locations: LocationNode[] = [
  {
    id: DEFAULT_LOCATION_ID,
    name: '未指定地点',
    district: '',
    street: '',
    connected: [],
  },
];

export const locationById: Record<string, LocationNode> = {};

function normalizeLocation(location: LocationNode): LocationNode {
  const connected = location.connected ?? location.links ?? [];
  return {
    ...location,
    connected,
    links: connected,
  };
}

export function registerRuntimeLocations(nextLocations: LocationNode[], replace = false): void {
  if (replace) {
    locations.splice(0, locations.length);
    Object.keys(locationById).forEach(id => {
      delete locationById[id];
    });
  }

  for (const location of nextLocations) {
    const normalized = normalizeLocation(location);
    const existingIndex = locations.findIndex(item => item.id === normalized.id);
    if (existingIndex >= 0) {
      locations.splice(existingIndex, 1, normalized);
    } else {
      locations.push(normalized);
    }
    locationById[normalized.id] = normalized;
  }
}

registerRuntimeLocations([...locations]);

export function getLocationById(locationId: string): LocationNode | undefined {
  return locationById[locationId];
}

export function getLocationName(locationId: string): string {
  return locationById[locationId]?.name ?? locationId;
}
