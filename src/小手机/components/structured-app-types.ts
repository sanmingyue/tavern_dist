export interface StructureAction {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

export interface StructureItem {
  id: string;
  title: string;
  subtitle: string;
  meta?: string;
  badge?: string;
  icon?: string;
  color?: string;
  tags?: string[];
  fields?: { label: string; value: string }[];
  actions?: string[];
}

export interface StructureSection {
  id: string;
  title: string;
  subtitle?: string;
  moreLabel?: string;
  layout?: 'list' | 'cards';
  items: StructureItem[];
}

export interface StructureTab {
  id: string;
  label: string;
  badge?: string | number;
  hero?: {
    kicker: string;
    title: string;
    description: string;
    action?: string;
  };
  quickActions?: StructureAction[];
  sections: StructureSection[];
}

export interface StructuredAppSpec {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  primaryAction?: string;
  searchPlaceholder?: string;
  tabs: StructureTab[];
}
