<template>
  <div class="art-page" :style="cssVars">
    <!-- 顶部导航栏 -->
    <div class="page-topbar">
      <button class="back-btn" @click="handleClose">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>收起百艺</span>
      </button>
      <div class="page-title">
        <span class="title-icon" :style="{ color }">
          <slot name="icon" />
        </span>
        <span class="title-name">{{ name }}</span>
      </div>
      <div style="width: 80px;"></div>
    </div>

    <!-- 境界信息 -->
    <div class="realm-section">
      <div class="realm-badge" :style="{ background: bgTint, borderColor: color }">
        <span class="realm-text">{{ realmValue || '入门' }}</span>
      </div>
      <!-- 有熟练度/经验值时显示进度条 -->
      <template v-if="proficiencyField">
        <div class="progress-wrap">
          <div class="progress-label">
            <span>熟练度</span>
            <span class="progress-val">{{ proficiencyValue }}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: Math.min(100, proficiencyValue) + '%', background: color }" />
          </div>
        </div>
        <div class="progress-wrap">
          <div class="progress-label">
            <span>经验值</span>
            <span class="progress-val">{{ expValue }}/100</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: Math.min(100, expValue) + '%', background: '#f59e0b' }" />
          </div>
        </div>
      </template>
      <!-- 额外的境界区域内容（如剑心的提示文字） -->
      <slot name="realm-extra" />
    </div>

    <!-- 额外信息区（如剑心的"何为剑心"说明卡片） -->
    <slot name="info" />

    <!-- 工具信息 -->
    <div class="tools-section" v-if="toolLabel">
      <div class="tool-card">
        <div class="tool-label">
          <slot name="tool-icon">
            <slot name="icon" />
          </slot>
          {{ toolLabel }}
        </div>
        <div class="tool-value">{{ toolValue || '未装备' }}</div>
      </div>
    </div>

    <div class="divider" />

    <!-- 操作区域（由各百艺自定义） -->
    <div class="operation-area">
      <slot />
    </div>

    <!-- Picker 遮罩层 -->
    <slot name="picker" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStatusStore, ARTS_MAP, type ArtKey } from '../../store';
import type { Schema } from '../../schema';

const props = defineProps<{
  artKey: ArtKey;
  /** 关闭时的 toast 消息，如"已收起炼丹" */
  closeToast?: string;
}>();

const store = useStatusStore();

// 从 ARTS_MAP 获取配置
const artConfig = computed(() => ARTS_MAP[props.artKey]);
const color = computed(() => artConfig.value.color);
const name = computed(() => artConfig.value.name);

// 根据主题色生成淡底色
const bgTint = computed(() => {
  // 简单方案：用 color-mix 或 固定映射
  return `color-mix(in srgb, ${color.value} 8%, white)`;
});

// CSS 变量
const cssVars = computed(() => ({
  '--art-color': color.value,
  '--art-bg-tint': bgTint.value,
}));

// 境界
const realmValue = computed(() => {
  const field = artConfig.value.境界字段;
  if (!field) return '';
  return (store.data[field as keyof Schema] as string) || '';
});

// 熟练度
const proficiencyField = computed(() => artConfig.value.熟练度字段);
const proficiencyValue = computed(() => {
  const field = proficiencyField.value;
  if (!field) return 0;
  return (store.data[field as keyof Schema] as number) || 0;
});

// 经验值
const expValue = computed(() => {
  const field = artConfig.value.经验值字段;
  if (!field) return 0;
  return (store.data[field as keyof Schema] as number) || 0;
});

// 工具
const toolLabel = computed(() => {
  const field = artConfig.value.工具字段;
  if (!field) return '';
  // 从字段名提取工具标签：装备_丹炉 → 丹炉
  return field.replace(/^装备_/, '');
});

const toolValue = computed(() => {
  const field = artConfig.value.工具字段;
  if (!field) return '';
  return (store.data[field as keyof Schema] as string) || '';
});

// 关闭
function handleClose() {
  store.closeArtsPage();
  if (props.closeToast) {
    toastr.info(props.closeToast);
  } else {
    toastr.info('已收起' + name.value);
  }
}
</script>

<style scoped>
.art-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, var(--art-bg-tint, #f8fafc) 0%, #fff 100%);
}

.page-topbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: linear-gradient(135deg, var(--art-bg-tint, #f8fafc), color-mix(in srgb, var(--art-color, #64748b) 12%, white));
  border-bottom: 1px solid color-mix(in srgb, var(--art-color, #64748b) 25%, white);
  flex-shrink: 0;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  border-radius: 6px;
  background: color-mix(in srgb, var(--art-color, #64748b) 10%, transparent);
  color: color-mix(in srgb, var(--art-color, #64748b) 80%, black);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: color-mix(in srgb, var(--art-color, #64748b) 18%, transparent);
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.title-icon {
  font-size: 20px;
  display: flex;
  align-items: center;
}

.title-name {
  font-size: 16px;
  font-weight: 800;
  color: color-mix(in srgb, var(--art-color, #64748b) 80%, black);
  letter-spacing: 1px;
}

.realm-section {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.realm-badge {
  display: inline-flex;
  padding: 4px 16px;
  border-radius: 16px;
  border: 1.5px solid;
}

.realm-text {
  font-size: 14px;
  font-weight: 800;
}

.progress-wrap {
  width: 100%;
  max-width: 300px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-muted, #64748b);
  margin-bottom: 3px;
}

.progress-val {
  font-weight: 600;
  color: var(--text-secondary, #475569);
}

.progress-bar {
  width: 100%;
  height: 5px;
  background: var(--card-bg, #f1f5f9);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s;
}

.tools-section {
  padding: 0 12px 12px;
  flex-shrink: 0;
}

.tool-card {
  background: var(--content-bg, #fff);
  border: 1px solid color-mix(in srgb, var(--art-color, #64748b) 25%, white);
  border-radius: 8px;
  padding: 8px 10px;
}

.tool-label {
  font-size: 11px;
  color: color-mix(in srgb, var(--art-color, #64748b) 80%, black);
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-label :deep(svg) {
  width: 12px;
  height: 12px;
  display: inline-block;
  vertical-align: middle;
}

.tool-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
}

.divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--art-color, #64748b) 25%, white), transparent);
  margin: 0 12px;
  flex-shrink: 0;
}

.operation-area {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
