<template>
  <div class="structured-app" :style="{ '--app-accent': spec.accent }">
    <header class="app-header">
      <button class="back-btn" @click="store.goBack()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div class="title-block">
        <h1>{{ spec.title }}</h1>
        <p>{{ spec.subtitle }}</p>
      </div>
      <button class="header-action" @click="openAction(spec.primaryAction ?? '新建')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </header>

    <div class="search-bar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input v-model="query" :placeholder="spec.searchPlaceholder ?? '搜索'" />
      <button v-if="query" class="clear-btn" @click="query = ''">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <nav class="segmented-tabs">
      <button
        v-for="tab in spec.tabs"
        :key="tab.id"
        :class="{ active: activeTabId === tab.id }"
        @click="activeTabId = tab.id"
      >
        {{ tab.label }}
        <span v-if="tab.badge">{{ tab.badge }}</span>
      </button>
    </nav>

    <main class="app-content">
      <section v-if="currentTab?.hero" class="hero-card" :style="{ '--app-accent': spec.accent }">
        <div>
          <span class="hero-kicker">{{ currentTab.hero.kicker }}</span>
          <h2>{{ currentTab.hero.title }}</h2>
          <p>{{ currentTab.hero.description }}</p>
        </div>
        <button @click="openAction(currentTab.hero.action ?? '查看')">{{ currentTab.hero.action ?? '查看' }}</button>
      </section>

      <section v-if="currentTab?.quickActions?.length" class="quick-grid">
        <button v-for="action in currentTab.quickActions" :key="action.id" @click="openAction(action.label)">
          <span class="quick-icon" :style="{ background: action.color ?? spec.accent }">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="iconPath(action.icon)" />
          </span>
          <span>{{ action.label }}</span>
        </button>
      </section>

      <section v-for="section in visibleSections" :key="section.id" class="content-section">
        <div class="section-header">
          <div>
            <h3>{{ section.title }}</h3>
            <p v-if="section.subtitle">{{ section.subtitle }}</p>
          </div>
          <button v-if="section.moreLabel" @click="openAction(section.moreLabel)">{{ section.moreLabel }}</button>
        </div>

        <div class="item-list" :class="section.layout ?? 'list'">
          <article
            v-for="item in section.items"
            :key="item.id"
            class="structure-item"
            :class="{ card: section.layout === 'cards' }"
            @click="selectedItem = item"
          >
            <div class="item-icon" :style="{ background: item.color ?? spec.accent }">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="iconPath(item.icon)" />
            </div>
            <div class="item-main">
              <div class="item-title-row">
                <h4>{{ item.title }}</h4>
                <span v-if="item.meta">{{ item.meta }}</span>
              </div>
              <p>{{ item.subtitle }}</p>
              <div v-if="item.tags?.length" class="tag-row">
                <span v-for="tag in item.tags" :key="tag">{{ tag }}</span>
              </div>
            </div>
            <span v-if="item.badge" class="item-badge">{{ item.badge }}</span>
          </article>
        </div>
      </section>
    </main>

    <Transition name="sheet">
      <div v-if="selectedItem || actionSheet" class="sheet-mask" @click.self="closeSheet">
        <section class="detail-sheet">
          <div class="sheet-handle"></div>
          <template v-if="selectedItem">
            <div class="sheet-title-row">
              <div class="item-icon large" :style="{ background: selectedItem.color ?? spec.accent }">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="iconPath(selectedItem.icon)" />
              </div>
              <div>
                <h3>{{ selectedItem.title }}</h3>
                <p>{{ selectedItem.subtitle }}</p>
              </div>
            </div>
            <div class="detail-fields">
              <div v-for="field in detailFields" :key="field.label">
                <span>{{ field.label }}</span>
                <strong>{{ field.value }}</strong>
              </div>
            </div>
            <div class="sheet-actions">
              <button v-for="action in selectedItem.actions ?? defaultItemActions" :key="action" @click="openAction(action)">
                {{ action }}
              </button>
            </div>
          </template>
          <template v-else>
            <h3>{{ actionSheet }}</h3>
            <p class="sheet-description">这里预留该操作的表单、确认页、AI 更新入口和反馈到正文的后续逻辑。</p>
            <div class="sheet-actions">
              <button @click="closeSheet">取消</button>
              <button class="primary" @click="confirmAction">确认</button>
            </div>
          </template>
        </section>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import type { StructureItem, StructuredAppSpec } from './structured-app-types';
import { usePhoneStore } from '../stores/phone-store';

const props = defineProps<{ spec: StructuredAppSpec }>();
const store = usePhoneStore();

const query = ref('');
const activeTabId = ref(props.spec.tabs[0]?.id ?? '');
const selectedItem = ref<StructureItem | null>(null);
const actionSheet = ref<string | null>(null);

const currentTab = computed(() => props.spec.tabs.find(tab => tab.id === activeTabId.value) ?? props.spec.tabs[0]);
const visibleSections = computed(() => {
  const sections = currentTab.value?.sections ?? [];
  if (!query.value.trim()) return sections;
  const keyword = query.value.trim().toLowerCase();
  return sections
    .map(section => ({
      ...section,
      items: section.items.filter(item =>
        [item.title, item.subtitle, item.meta, ...(item.tags ?? [])].some(text => text?.toLowerCase().includes(keyword)),
      ),
    }))
    .filter(section => section.items.length > 0);
});
const detailFields = computed(() => selectedItem.value?.fields ?? [
  { label: '当前状态', value: '结构已接入' },
  { label: '后续内容', value: '等待具体业务写入' },
  { label: 'AI 更新', value: '预留第二 API 调用入口' },
]);
const defaultItemActions = ['打开', '编辑', 'AI 更新', '反馈到正文'];

function openAction(label: string): void {
  actionSheet.value = label;
  selectedItem.value = null;
}

function closeSheet(): void {
  selectedItem.value = null;
  actionSheet.value = null;
}

function confirmAction(): void {
  toastr.info(`${props.spec.title}: ${actionSheet.value} 已预留`);
  closeSheet();
}

function iconPath(icon = 'box'): string {
  const icons: Record<string, string> = {
    box: '<rect x="4" y="4" width="16" height="16" rx="3"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    route: '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M8.5 16C12 12 12 12 15.5 8"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
    play: '<polygon points="8 5 19 12 8 19 8 5"/>',
    pay: '<rect x="3" y="5" width="18" height="14" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>',
    topic: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    car: '<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  };
  return icons[icon] ?? icons.box;
}
</script>

<style scoped>
.structured-app {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #111318);
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  overflow: hidden;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--bg-primary, #0b0e14);
  border-bottom: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.06));
}

.back-btn,
.header-action,
.clear-btn {
  border: 0;
  color: inherit;
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.06));
  display: grid;
  place-items: center;
  cursor: pointer;
}

.back-btn,
.header-action {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
}

button svg {
  width: 18px;
  height: 18px;
}

.title-block {
  flex: 1;
  min-width: 0;
}

.title-block h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.title-block p {
  margin: 2px 0 0;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 12px;
  padding: 9px 12px;
  border-radius: 18px;
  background: var(--bg-primary, #0b0e14);
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
}

.search-bar svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.search-bar input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: 0;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  background: transparent;
  font-size: 14px;
}

.clear-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
}

.segmented-tabs {
  display: flex;
  gap: 6px;
  padding: 0 12px 10px;
  overflow-x: auto;
  scrollbar-width: none;
}

.segmented-tabs::-webkit-scrollbar {
  display: none;
}

.segmented-tabs button {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 5px;
  border: 0;
  border-radius: 16px;
  padding: 7px 13px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  background: var(--bg-primary, #0b0e14);
  cursor: pointer;
  font-size: 13px;
}

.segmented-tabs button.active {
  color: white;
  background: var(--app-accent, var(--accent, #579bf0));
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px 16px;
}

.hero-card {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  margin-bottom: 12px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--app-accent), rgba(255, 255, 255, 0.08));
  color: white;
}

.hero-kicker {
  display: block;
  margin-bottom: 6px;
  opacity: 0.78;
  font-size: 12px;
}

.hero-card h2 {
  margin: 0;
  font-size: 19px;
  line-height: 1.2;
}

.hero-card p {
  margin: 6px 0 0;
  opacity: 0.82;
  font-size: 12px;
}

.hero-card button {
  flex-shrink: 0;
  border: 0;
  border-radius: 14px;
  padding: 8px 12px;
  color: white;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}

.quick-grid button {
  min-width: 0;
  border: 0;
  border-radius: 14px;
  padding: 10px 6px;
  background: var(--bg-primary, #0b0e14);
  color: var(--text-secondary, rgba(255, 255, 255, 0.72));
  cursor: pointer;
}

.quick-icon {
  width: 32px;
  height: 32px;
  margin: 0 auto 6px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: white;
}

.quick-icon svg {
  width: 18px;
  height: 18px;
}

.quick-grid span:last-child {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
}

.content-section {
  margin-bottom: 14px;
}

.section-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  margin: 0 2px 8px;
}

.section-header h3 {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.72));
}

.section-header p {
  margin: 3px 0 0;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
  font-size: 11px;
}

.section-header button {
  border: 0;
  color: var(--app-accent, var(--accent, #579bf0));
  background: transparent;
  cursor: pointer;
  font-size: 12px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-list.cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.structure-item {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 14px;
  padding: 11px;
  background: var(--bg-primary, #0b0e14);
  cursor: pointer;
}

.structure-item.card {
  align-items: flex-start;
  flex-direction: column;
}

.item-icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 13px;
  display: grid;
  place-items: center;
  color: white;
}

.item-icon.large {
  width: 52px;
  height: 52px;
}

.item-icon svg {
  width: 21px;
  height: 21px;
}

.item-main {
  flex: 1;
  min-width: 0;
}

.item-title-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.item-title-row h4 {
  margin: 0;
  min-width: 0;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-title-row span {
  flex-shrink: 0;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
  font-size: 11px;
}

.item-main p {
  margin: 5px 0 0;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
  font-size: 12px;
  line-height: 1.35;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 7px;
}

.tag-row span,
.item-badge {
  border-radius: 999px;
  padding: 3px 7px;
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.06));
  font-size: 10px;
}

.item-badge {
  flex-shrink: 0;
}

.sheet-mask {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.48);
}

.detail-sheet {
  width: 100%;
  max-height: 76%;
  overflow-y: auto;
  border-radius: 20px 20px 0 0;
  padding: 10px 16px 18px;
  background: var(--bg-primary, #0b0e14);
  box-shadow: 0 -18px 50px rgba(0, 0, 0, 0.35);
}

.sheet-handle {
  width: 40px;
  height: 4px;
  margin: 0 auto 14px;
  border-radius: 999px;
  background: var(--border-primary, rgba(255, 255, 255, 0.12));
}

.sheet-title-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.sheet-title-row h3,
.detail-sheet h3 {
  margin: 0;
  font-size: 18px;
}

.sheet-title-row p,
.sheet-description {
  margin: 4px 0 0;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
  font-size: 13px;
  line-height: 1.45;
}

.detail-fields {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
}

.detail-fields div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--bg-secondary, #111318);
}

.detail-fields span {
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
  font-size: 12px;
}

.detail-fields strong {
  font-size: 12px;
  font-weight: 600;
  text-align: right;
}

.sheet-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.sheet-actions button {
  border: 0;
  border-radius: 12px;
  padding: 10px;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  background: var(--bg-secondary, #111318);
  cursor: pointer;
}

.sheet-actions button.primary,
.sheet-actions button:last-child {
  color: white;
  background: var(--app-accent, var(--accent, #579bf0));
}

.sheet-enter-active,
.sheet-leave-active {
  transition: opacity 0.2s ease;
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
}
</style>
