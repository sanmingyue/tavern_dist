<template>
  <div class="fruit-theater-wrapper">
    <!-- 左侧：内心独白面板 -->
    <div class="fruit-theater-left" :class="{ 'fruit-theater--generating': state === 'generating' }">
      <!-- 关闭按钮 -->
      <button class="fruit-theater__close" @click="$emit('close')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <!-- 角色名 + 关系 -->
      <div class="fruit-theater__header">
        <h3 class="fruit-theater__name">{{ name }}</h3>
        <span class="fruit-theater__relation" :class="'fruit-theater__relation--' + relationKey">{{ charData.关系状态 }}</span>
      </div>

      <!-- 好感度条 -->
      <div class="fruit-theater__favor">
        <span class="fruit-theater__favor-label">好感度</span>
        <div class="fruit-theater__favor-track">
          <div class="fruit-theater__favor-fill" :style="{ width: progressWidth }"></div>
        </div>
        <span class="fruit-theater__favor-value">{{ charData.好感度 }}</span>
      </div>

      <!-- 生成按钮 -->
      <button
        class="fruit-theater__generate-btn"
        :disabled="state === 'generating'"
        @click="onGenerate"
      >
        <svg v-if="state !== 'generating'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20v-4" />
        </svg>
        <svg v-else class="fruit-theater__spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
        </svg>
        <span>{{ state === 'generating' ? '生成中...' : '生成内心独白' }}</span>
      </button>

      <!-- 内心独白内容 -->
      <div v-if="result" class="fruit-theater__content">
        <!-- 心里话 -->
        <div class="fruit-theater__section">
          <div class="fruit-theater__section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>心里话</span>
          </div>
          <p class="fruit-theater__text">{{ result.innerVoice }}</p>
        </div>

        <!-- 第四面墙 -->
        <div class="fruit-theater__section fruit-theater__section--wall">
          <div class="fruit-theater__section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 14s1.5 2 4 2 4-2 4-2" />
              <line x1="9" y1="9" x2="9.01" y2="9" />
              <line x1="15" y1="9" x2="15.01" y2="9" />
            </svg>
            <span>第四面墙</span>
          </div>
          <p class="fruit-theater__text fruit-theater__text--italic">{{ result.fourthWall }}</p>
        </div>

        <!-- 对用户的反应 -->
        <div class="fruit-theater__section fruit-theater__section--reaction">
          <div class="fruit-theater__section-header">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>对你的反应</span>
          </div>
          <p class="fruit-theater__text">{{ result.userReaction }}</p>
        </div>
      </div>

      <!-- 错误提示 -->
      <div v-if="error" class="fruit-theater__error">{{ error }}</div>
    </div>

    <!-- 右侧：角色立绘 -->
    <div class="fruit-theater-right" :style="portraitBgStyle">
      <div class="fruit-theater-right__overlay"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useStatusStore, CHARACTER_LIST } from '../store';
import { generateTheater, getIsGenerating } from '../theater/generator';
import type { TheaterResult, TheaterState } from '../theater/types';
import { getCharacterVisuals } from '../visuals';

const props = defineProps<{ name: string }>();
defineEmits<{ close: [] }>();

const store = useStatusStore();

const state = ref<TheaterState>('idle');
const result = ref<TheaterResult | null>(null);
const error = ref('');

const meta = computed(() => CHARACTER_LIST.find(c => c.name === props.name));
const charData = computed(() => store.getCharacter(props.name));
const visuals = computed(() => (meta.value ? getCharacterVisuals(meta.value, charData.value) : null));

const relationKey = computed(() => {
  switch (charData.value.关系状态) {
    case '恋人': return 'lover';
    case '暧昧': return 'ambiguous';
    case '熟悉': return 'familiar';
    case '决裂': case '封心': case '疏远': return 'broken';
    default: return 'default';
  }
});

const progressWidth = computed(() => {
  const favor = charData.value.好感度;
  const normalized = Math.max(2, Math.min(100, ((favor + 100) / 200) * 100));
  return `${normalized}%`;
});

const portraitBgStyle = computed(() => {
  const image = visuals.value?.background;
  if (!image) return {};
  return {
    backgroundImage: `linear-gradient(to left, rgba(10,10,20,0) 0%, rgba(10,10,20,0.85) 100%), url("${image}"), url("${visuals.value?.fallback ?? image}")`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
  };
});

async function onGenerate() {
  if (getIsGenerating()) return;

  state.value = 'generating';
  error.value = '';
  result.value = null;

  try {
    result.value = await generateTheater(
      props.name,
      charData.value.关系状态,
      charData.value.好感度,
    );
    state.value = 'done';
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    state.value = 'error';
  }
}
</script>

<style scoped>
/* ━━━━ 左侧面板 ━━━━ */
.fruit-theater-left {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 280px;
  max-height: 80vh;
  overflow-y: auto;
  padding: 20px;
  background: rgba(10, 10, 20, 0.92);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0 12px 12px 0;
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.4);
  z-index: 9996;
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-family: 'Microsoft YaHei', 'PingFang SC', system-ui, sans-serif;
  animation: fruit-slide-in-left 0.3s ease-out;
}

.fruit-theater-left::-webkit-scrollbar {
  width: 3px;
}

.fruit-theater-left::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
}

/* ━━━━ 右侧立绘 ━━━━ */
.fruit-theater-right {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: 320px;
  z-index: 9995;
  pointer-events: none;
  animation: fruit-fade-in 0.5s ease-out;
}

.fruit-theater-right__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(10, 10, 20, 0.9) 0%, transparent 40%, transparent 100%);
}

/* ━━━━ 关闭按钮 ━━━━ */
.fruit-theater__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.fruit-theater__close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* ━━━━ 头部 ━━━━ */
.fruit-theater__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fruit-theater__name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.fruit-theater__relation {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

.fruit-theater__relation--lover {
  background: rgba(236, 72, 153, 0.2);
  color: rgba(249, 168, 212, 1);
}

.fruit-theater__relation--ambiguous {
  background: rgba(168, 85, 247, 0.2);
  color: rgba(196, 181, 253, 1);
}

.fruit-theater__relation--familiar {
  background: rgba(59, 130, 246, 0.2);
  color: rgba(147, 197, 253, 1);
}

.fruit-theater__relation--broken {
  background: rgba(239, 68, 68, 0.2);
  color: rgba(252, 165, 165, 1);
}

/* ━━━━ 好感度条 ━━━━ */
.fruit-theater__favor {
  display: flex;
  align-items: center;
  gap: 8px;
}

.fruit-theater__favor-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.fruit-theater__favor-track {
  flex: 1;
  height: 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
  overflow: hidden;
}

.fruit-theater__favor-fill {
  height: 100%;
  border-radius: 2px;
  background: linear-gradient(90deg, #4a9eff 0%, #a855f7 50%, #ff6b9d 100%);
  transition: width 0.5s ease;
}

.fruit-theater__favor-value {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.7);
  min-width: 24px;
  text-align: right;
}

/* ━━━━ 生成按钮 ━━━━ */
.fruit-theater__generate-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.fruit-theater__generate-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.fruit-theater__generate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fruit-theater__spinner {
  animation: fruit-spin 1s linear infinite;
}

/* ━━━━ 内心独白内容 ━━━━ */
.fruit-theater__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fruit-theater__section {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}

.fruit-theater__section--wall {
  border-color: rgba(168, 85, 247, 0.15);
  background: rgba(168, 85, 247, 0.05);
}

.fruit-theater__section--reaction {
  border-color: rgba(59, 130, 246, 0.15);
  background: rgba(59, 130, 246, 0.05);
}

.fruit-theater__section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  font-weight: 600;
}

.fruit-theater__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.8);
}

.fruit-theater__text--italic {
  font-style: italic;
  color: rgba(196, 181, 253, 0.8);
}

/* ━━━━ 错误 ━━━━ */
.fruit-theater__error {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
  color: rgba(252, 165, 165, 1);
  font-size: 12px;
}

/* ━━━━ 动画 ━━━━ */
@keyframes fruit-slide-in-left {
  from {
    opacity: 0;
    transform: translateY(-50%) translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }
}

@keyframes fruit-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fruit-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
