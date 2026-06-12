<template>
  <div class="tabbar">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tabbar-item"
      :class="{ active: activeTab === tab.id }"
      @click="$emit('tab-change', tab.id)"
    >
      <!-- 图标容器 -->
      <div class="icon-container">
        <!-- 消息 - 气泡消息 -->
        <svg v-if="tab.id === 'home'" class="tab-icon" viewBox="0 0 24 24" fill="none">
          <path d="M3 5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15C21 16.1046 20.1046 17 19 17H17L13 21V17H5C3.89543 17 3 16.1046 3 15V5Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="7" cy="10" r="1" fill="currentColor"/>
          <circle cx="12" cy="10" r="1" fill="currentColor"/>
          <circle cx="17" cy="10" r="1" fill="currentColor"/>
        </svg>

        <!-- 联系人 - 用户组 -->
        <svg v-else-if="tab.id === 'contacts'" class="tab-icon" viewBox="0 0 24 24" fill="none">
          <path d="M17 20H22V18C22 16.3431 20.6569 15 19 15C18.0444 15 17.1931 15.4468 16.6438 16.1429M17 20H7M17 20V18C17 17.3438 16.8736 16.717 16.6438 16.1429M7 20H2V18C2 16.3431 3.34315 15 5 15M7 20V18C7 17.3438 7.12642 16.717 7.35616 16.1429M7.35616 16.1429C8.09326 14.301 9.89479 13 12 13C14.1052 13 15.9067 14.301 16.6438 16.1429M12 13C9.23858 13 7 10.7614 7 8C7 5.23858 9.23858 3 12 3C14.7614 3 17 5.23858 17 8C17 10.7614 14.7614 13 12 13Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        <!-- 动态 - 指南针/星球 -->
        <svg v-else-if="tab.id === 'discover'" class="tab-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/>
          <path d="M12 3C12 3 14 7 14 12C14 17 12 21 12 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M12 3C12 3 10 7 10 12C10 17 12 21 12 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <path d="M3 12H21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
          <circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="1.5"/>
        </svg>

        <!-- 我的 - 用户头像 -->
        <svg v-else-if="tab.id === 'me'" class="tab-icon" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.8"/>
          <path d="M4 20C4 17.2386 7.58172 15 12 15C16.4183 15 20 17.2386 20 20" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>

        <!-- 默认图标 -->
        <svg v-else class="tab-icon" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" stroke-width="1.8"/>
        </svg>

        <!-- 红点未读提示 -->
        <span v-if="tab.badge && tab.badge > 0" class="unread-dot"></span>
      </div>

      <!-- 标签文字 -->
      <span class="tab-label">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface TabItem {
  id: string;
  label: string;
  badge?: number;
}

defineProps<{
  tabs: TabItem[];
  activeTab: string;
}>();

defineEmits<{
  (e: 'tab-change', tabId: string): void;
}>();
</script>

<style scoped>
.tabbar {
  display: flex;
  align-items: stretch;
  background: var(--bg-tabbar, rgba(12, 14, 20, 0.95));
  backdrop-filter: blur(12px);
  border-top: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.06));
  flex-shrink: 0;
  padding: 6px 0 8px;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 4px 0;
  border: none;
  background: transparent;
  color: var(--text-muted, rgba(255, 255, 255, 0.35));
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.tabbar-item:active {
  transform: scale(0.95);
}

.tabbar-item.active {
  color: var(--accent, #579bf0);
}

.tabbar-item:not(.active):hover {
  color: var(--text-tertiary, rgba(255, 255, 255, 0.55));
}

.icon-container {
  position: relative;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tab-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.2s ease;
}

.tabbar-item.active .tab-icon {
  transform: scale(1.1);
}

.unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 8px;
  background: var(--danger, #e74c3c);
  border-radius: 50%;
  border: 2px solid var(--bg-tabbar);
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}

.tab-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3px;
}
</style>
