<template>
  <div class="themes-page">
    <!-- 顶部 Tab -->
    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 主题列表 -->
    <div class="theme-list">
      <!-- 当前主题 -->
      <div class="current-theme">
        <h3 class="section-title">当前主题</h3>
        <div class="theme-card active">
          <div class="theme-preview" :style="{ background: currentTheme.gradient }">
            <div class="preview-time">{{ currentTime }}</div>
          </div>
          <div class="theme-info">
            <span class="theme-name">{{ currentTheme.name }}</span>
            <span class="theme-author">当前使用中</span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
      </div>

      <!-- 推荐主题 -->
      <div class="recommended-themes">
        <h3 class="section-title">推荐主题</h3>
        <div class="themes-grid">
          <div
            v-for="theme in recommendedThemes"
            :key="theme.id"
            class="theme-card"
            :class="{ selected: selectedTheme?.id === theme.id }"
            @click="selectedTheme = theme"
          >
            <div class="theme-preview" :style="{ background: theme.gradient }">
              <div class="preview-time">10:30</div>
            </div>
            <div class="theme-info">
              <span class="theme-name">{{ theme.name }}</span>
              <span class="theme-author">{{ theme.author }}</span>
            </div>
            <div v-if="selectedTheme?.id === theme.id" class="selected-check">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 渐变色分类 -->
      <div class="color-categories">
        <h3 class="section-title">按颜色分类</h3>
        <div class="color-swatches">
          <button
            v-for="color in colorCategories"
            :key="color.name"
            class="color-swatch"
            :style="{ background: color.gradient }"
            :title="color.name"
            @click="filterByColor(color.name)"
          >
            {{ color.name }}
          </button>
        </div>
      </div>
    </div>

    <!-- 应用按钮 -->
    <button
      v-if="selectedTheme"
      class="apply-btn"
      @click="applyTheme"
    >
      应用主题
    </button>
  </div>
</template>

<script setup lang="ts">
interface Theme {
  id: string;
  name: string;
  author: string;
  gradient: string;
}

const tabs = [
  { id: 'all', label: '全部' },
  { id: 'free', label: '免费' },
  { id: 'premium', label: '付费' },
  { id: 'mine', label: '我的' },
];

const activeTab = ref('all');
const selectedTheme = ref<Theme | null>(null);
const currentTime = ref('');

const currentTheme: Theme = {
  id: 'default',
  name: '深邃夜空',
  author: '系统',
  gradient: 'linear-gradient(135deg, #0b0e14 0%, #1a1c24 100%)',
};

const recommendedThemes: Theme[] = [
  { id: 'aurora', name: '极光', author: '星空', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'sunset', name: '落日余晖', author: '黄昏', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'ocean', name: '深海蓝', author: '海洋', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { id: 'forest', name: '森林绿', author: '自然', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { id: 'sunrise', name: '日出', author: '清晨', gradient: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)' },
  { id: 'nebula', name: '星云', author: '宇宙', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
];

const colorCategories = [
  { name: '蓝色', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { name: '紫色', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { name: '粉色', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { name: '绿色', gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' },
  { name: '橙色', gradient: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)' },
  { name: '红色', gradient: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)' },
];

function updateTime() {
  const now = new Date();
  currentTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

let timeInterval: ReturnType<typeof setInterval>;
onMounted(() => {
  updateTime();
  timeInterval = setInterval(updateTime, 1000);
});

onUnmounted(() => {
  clearInterval(timeInterval);
});

function filterByColor(colorName: string) {
  toastr.info(`筛选 ${colorName} 主题`);
}

function applyTheme() {
  if (selectedTheme.value) {
    toastr.success(`已应用主题: ${selectedTheme.value.name}`);
    selectedTheme.value = null;
  }
}
</script>

<style scoped>
.themes-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary, #111318);
  padding-bottom: 80px;
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: var(--bg-primary, #0b0e14);
  overflow-x: auto;
}

.tab {
  padding: 8px 16px;
  border: none;
  border-radius: 16px;
  background: var(--bg-tertiary, rgba(255, 255, 255, 0.06));
  color: var(--text-secondary, rgba(255, 255, 255, 0.7));
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.tab.active {
  background: var(--accent, #579bf0);
  color: white;
}

.theme-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}

.current-theme {
  margin-bottom: 24px;
}

.theme-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-primary);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.theme-card:hover {
  background: var(--bg-hover);
}

.theme-card.selected {
  border: 2px solid var(--accent);
}

.theme-preview {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: 4px;
  flex-shrink: 0;
}

.preview-time {
  font-size: 9px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(0, 0, 0, 0.3);
  padding: 1px 3px;
  border-radius: 2px;
}

.theme-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.theme-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.theme-author {
  font-size: 12px;
  color: var(--text-tertiary);
}

.selected-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--accent);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.color-swatch {
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 10px;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;
}

.color-swatch:hover {
  transform: scale(1.05);
}

.apply-btn {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 32px;
  border: none;
  border-radius: 24px;
  background: var(--accent);
  color: white;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  box-shadow: 0 4px 20px rgba(87, 155, 240, 0.4);
  transition: all 0.2s;
}

.apply-btn:hover {
  transform: translateX(-50%) scale(1.02);
}
</style>
