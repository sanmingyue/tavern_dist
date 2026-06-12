<template>
  <div class="home-page">
    <!-- 顶部区域 -->
    <div class="home-header">
      <h1 class="home-title">小手机</h1>
      <button class="search-btn" @click="onSearch">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>
    </div>

    <!-- 搜索栏（展开时显示） -->
    <Transition name="search">
      <div v-if="isSearchOpen" class="search-bar">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          v-model="searchQuery"
          placeholder="搜索应用、功能"
          class="search-input"
          ref="searchInputRef"
        />
        <button v-if="searchQuery" class="clear-btn" @click="searchQuery = ''">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </Transition>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="category-tab"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- APP 网格 -->
    <div class="app-section">
      <h3 class="section-title">{{ currentCategoryName }}</h3>
      <div class="app-grid">
        <AppIcon
          v-for="app in filteredApps"
          :key="app.id"
          :app-id="app.id"
          :name="app.name"
          :icon="app.icon"
          :badge="app.badge"
          :bg-color="app.bgColor || appRegistry.getAppColor(app.id)"
          @click="openApp(app.id)"
        />
      </div>
    </div>

    <!-- 底部预留空间（适配 TabBar） -->
    <div class="bottom-space"></div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { useAppRegistry } from '../../stores/app-registry';
import AppIcon from '../../components/AppIcon.vue';

const store = usePhoneStore();
const appRegistry = useAppRegistry();

const searchQuery = ref('');
const isSearchOpen = ref(false);
const searchInputRef = ref<HTMLInputElement | null>(null);

const categories = [
  { id: 'all', name: '全部' },
  { id: 'social', name: '社交' },
  { id: 'life', name: '生活' },
  { id: 'entertainment', name: '娱乐' },
  { id: 'shopping', name: '购物' },
  { id: 'tools', name: '工具' },
  { id: 'system', name: '系统' },
];

const activeCategory = ref('all');

const currentCategoryName = computed(() => {
  return categories.find(c => c.id === activeCategory.value)?.name ?? '全部';
});

const filteredApps = computed(() => {
  let apps = appRegistry.getHomeApps();
  if (apps.length === 0) {
    apps = appRegistry.apps;
  }

  if (activeCategory.value !== 'all') {
    apps = apps.filter(app => app.category === activeCategory.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    apps = apps.filter(app => app.name.toLowerCase().includes(query));
  }

  return apps;
});

function onSearch() {
  isSearchOpen.value = !isSearchOpen.value;
  if (isSearchOpen.value) {
    nextTick(() => searchInputRef.value?.focus());
  }
}

function openApp(appId: string) {
  store.openApp(appId);
}
</script>

<style scoped>
.home-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #111318);
  overflow: hidden;
}

.home-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  background: var(--bg-primary, #0b0e14);
}

.home-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  margin: 0;
}

.search-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 50%;
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.06));
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.search-btn:hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 16px 12px;
  padding: 10px 14px;
  background: var(--bg-primary, #0b0e14);
  border-radius: 20px;
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary, rgba(255, 255, 255, 0.9));
  font-size: 14px;
  outline: none;
}

.clear-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.1));
  color: var(--text-tertiary, rgba(255, 255, 255, 0.45));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-tabs {
  display: flex;
  gap: 4px;
  padding: 0 12px 12px;
  overflow-x: auto;
  background: var(--bg-primary, #0b0e14);
  scrollbar-width: none;
}

.category-tabs::-webkit-scrollbar {
  display: none;
}

.category-tab {
  flex-shrink: 0;
  padding: 6px 14px;
  border: none;
  border-radius: 16px;
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.06));
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.category-tab.active {
  background: var(--accent, #579bf0);
  color: white;
}

.category-tab:not(.active):hover {
  background: var(--bg-hover, rgba(255, 255, 255, 0.1));
}

.app-section {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  margin: 0 0 12px 0;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px 8px;
}

.bottom-space {
  height: 60px;
  flex-shrink: 0;
}

/* 搜索动画 */
.search-enter-active,
.search-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.search-enter-from,
.search-leave-to {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
