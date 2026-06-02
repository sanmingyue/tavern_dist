<template>
  <div class="char-detail-card" :style="cardBgStyle">
    <!-- 渐变遮罩层 -->
    <div class="card-overlay"></div>

    <!-- 内容层 -->
    <div class="card-content">
      <!-- 返回按钮 -->
      <button class="back-btn" @click="$emit('back')">
        <svg class="back-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15,18 9,12 15,6" />
        </svg>
        <span>返回</span>
      </button>

      <!-- 角色信息 -->
      <div class="info-section">
        <!-- 角色名 -->
        <h2 class="char-name">{{ name }}</h2>

        <div
          class="char-avatar"
          :class="{ 'char-avatar--stage': visuals?.stage !== 'normal' }"
          :style="avatarStyle"
        ></div>

        <!-- 一句话介绍 -->
        <p class="char-intro">{{ meta?.intro }}</p>

        <!-- 身份标签 -->
        <div class="meta-row">
          <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span class="meta-text">{{ meta?.identity }}</span>
        </div>

        <!-- 关系状态 -->
        <div class="meta-row">
          <svg class="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span class="relation-badge" :class="relationClass">{{ charData.关系状态 }}</span>
        </div>

        <!-- 好感度进度条 -->
        <div class="favor-section">
          <div class="favor-header">
            <span class="favor-label">好感度</span>
            <span class="favor-value">{{ charData.好感度 }}</span>
          </div>
          <div class="favor-track">
            <div
              class="favor-fill"
              :style="{ width: progressWidth, background: progressGradient }"
            ></div>
          </div>
        </div>

        <!-- 关键事件列表 -->
        <div v-if="events.length > 0" class="events-section">
          <span class="events-title">关键事件</span>
          <div class="events-list">
            <div
              v-for="event in events"
              :key="event.name"
              class="event-item"
            >
              <svg v-if="event.done" class="event-icon done" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20,6 9,17 4,12" />
              </svg>
              <svg v-else class="event-icon pending" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span class="event-text" :class="{ done: event.done }">{{ event.name }}</span>
            </div>
          </div>
        </div>

        <!-- 内心剧场按钮 -->
        <button class="theater-btn" :disabled="theaterLoading" @click="onGenerateTheater">
          <svg v-if="!theaterLoading" class="theater-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20V10" />
            <path d="M18 20V4" />
            <path d="M6 20v-4" />
          </svg>
          <svg v-else class="theater-btn-icon theater-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round" />
          </svg>
          <span>{{ theaterLoading ? '生成中...' : (theaterResult ? '重新生成' : '窥探内心') }}</span>
        </button>

        <!-- 内心剧场结果 -->
        <div v-if="theaterResult" class="theater-result">
          <div class="theater-section">
            <span class="theater-label">💬 内心独白</span>
            <p class="theater-text">{{ theaterResult.innerVoice }}</p>
          </div>
          <div class="theater-section theater-section--wall">
            <span class="theater-label">😏 戏外吐槽</span>
            <p class="theater-text theater-text--italic">{{ theaterResult.fourthWall }}</p>
          </div>
          <div class="theater-section theater-section--look">
            <span class="theater-label">👁 对你的看法</span>
            <p class="theater-text">{{ theaterResult.userReaction }}</p>
          </div>
        </div>
        <div v-if="theaterError" class="theater-error">{{ theaterError }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useStatusStore, CHARACTER_LIST, type CharacterMeta } from '../store';
import { generateTheater, getIsGenerating } from '../theater/generator';
import type { TheaterResult } from '../theater/types';
import { getCharacterVisuals } from '../visuals';

const props = defineProps<{ name: string }>();
defineEmits<{ back: []; theater: [name: string] }>();

const store = useStatusStore();
const theaterLoading = ref(false);
const theaterResult = ref<TheaterResult | null>(null);
const theaterError = ref('');

async function onGenerateTheater() {
  if (getIsGenerating()) return;
  theaterLoading.value = true;
  theaterError.value = '';
  try {
    const charData = store.getCharacter(props.name);
    theaterResult.value = await generateTheater(props.name, charData.关系状态, charData.好感度);
  } catch (e) {
    theaterError.value = e instanceof Error ? e.message : String(e);
  } finally {
    theaterLoading.value = false;
  }
}

const meta = computed<CharacterMeta | undefined>(() =>
  CHARACTER_LIST.find(c => c.name === props.name),
);

const charData = computed(() => store.getCharacter(props.name));
const visuals = computed(() => (meta.value ? getCharacterVisuals(meta.value, charData.value) : null));

const events = computed(() =>
  Object.entries(charData.value.关键事件).map(([name, done]) => ({ name, done })),
);

const cardBgStyle = computed(() => {
  const baseColor = meta.value?.color ?? '#1a1a2e';
  const image = visuals.value?.background;
  if (image) {
    return {
      backgroundColor: baseColor,
      backgroundImage: `linear-gradient(135deg, ${baseColor}66 0%, ${baseColor}22 100%), url("${image}"), url("${visuals.value?.fallback ?? image}")`,
      backgroundPosition: 'center right',
      backgroundSize: 'cover',
      borderColor: visuals.value?.border ?? 'rgba(255, 255, 255, 0.1)',
      boxShadow:
        visuals.value?.stage === 'normal'
          ? 'none'
          : `0 0 24px ${visuals.value?.glow ?? 'rgba(236, 72, 153, 0.24)'}`,
    };
  }
  return {
    background: `linear-gradient(135deg, ${baseColor} 0%, ${baseColor}dd 40%, ${baseColor}88 70%, ${baseColor}44 100%)`,
    borderColor: visuals.value?.border ?? 'rgba(255, 255, 255, 0.1)',
  };
});

const avatarStyle = computed(() => {
  const image = visuals.value?.avatar;
  return image
    ? {
        backgroundImage: `url("${image}"), url("${visuals.value?.fallback ?? image}")`,
        backgroundPosition: visuals.value?.stage === 'normal' ? 'center' : 'center right',
        borderColor: visuals.value?.border ?? 'rgba(255, 255, 255, 0.16)',
        boxShadow: `0 0 16px ${visuals.value?.glow ?? 'rgba(0, 0, 0, 0)'}`,
      }
    : {};
});

const progressWidth = computed(() => {
  const favor = charData.value.好感度;
  const normalized = Math.max(2, Math.min(100, ((favor + 100) / 200) * 100));
  return `${normalized}%`;
});

const progressGradient = computed(() => {
  return 'linear-gradient(90deg, #4a9eff 0%, #a855f7 50%, #ff6b9d 100%)';
});

const relationClass = computed(() => {
  switch (charData.value.关系状态) {
    case '恋人':
      return 'relation-lover';
    case '暧昧':
      return 'relation-ambiguous';
    case '熟悉':
      return 'relation-familiar';
    case '决裂':
    case '封心':
    case '疏远':
      return 'relation-broken';
    default:
      return 'relation-default';
  }
});
</script>

<style scoped>
.char-detail-card {
  position: relative;
  width: 100%;
  min-height: 200px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(10, 10, 20, 0.95) 0%, rgba(10, 10, 20, 0.7) 50%, transparent 100%);
  z-index: 1;
}

.card-content {
  position: relative;
  z-index: 2;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
  align-self: flex-start;
}

.back-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.back-icon {
  width: 12px;
  height: 12px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 70%;
}

.char-name {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.char-avatar {
  width: 58px;
  height: 58px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background-position: center;
  background-size: cover;
  flex-shrink: 0;
}

.char-avatar--stage {
  width: min(180px, 100%);
  height: auto;
  aspect-ratio: 8 / 5;
  border-radius: 8px;
  background-size: cover;
}

.char-intro {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  line-height: 1.5;
  font-style: italic;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-icon {
  width: 12px;
  height: 12px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

.meta-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
}

.relation-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

.relation-lover {
  background: rgba(236, 72, 153, 0.2);
  color: #f9a8d4;
}

.relation-ambiguous {
  background: rgba(168, 85, 247, 0.2);
  color: #c4b5fd;
}

.relation-familiar {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.relation-broken {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.relation-default {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.5);
}

.favor-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.favor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.favor-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
}

.favor-value {
  font-size: 12px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
}

.favor-track {
  height: 5px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.favor-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
  min-width: 2px;
}

.events-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 4px;
}

.events-title {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.event-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.event-icon.done {
  color: #34d399;
}

.event-icon.pending {
  color: rgba(255, 255, 255, 0.3);
}

.event-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
}

.event-text.done {
  color: rgba(255, 255, 255, 0.7);
}

/* 内心剧场按钮 */
.theater-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  margin-top: 4px;
  border: 1px solid rgba(168, 85, 247, 0.3);
  border-radius: 8px;
  background: rgba(168, 85, 247, 0.1);
  color: rgba(196, 181, 253, 0.9);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  align-self: flex-start;
  font-family: inherit;
}

.theater-btn:hover {
  background: rgba(168, 85, 247, 0.2);
  border-color: rgba(168, 85, 247, 0.5);
  color: #fff;
}

.theater-btn-icon {
  width: 12px;
  height: 12px;
}

/* 内心剧场结果 */
.theater-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.theater-section {
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(255, 255, 255, 0.03);
}

.theater-section--wall {
  border-color: rgba(168, 85, 247, 0.15);
  background: rgba(168, 85, 247, 0.05);
}

.theater-section--look {
  border-color: rgba(59, 130, 246, 0.15);
  background: rgba(59, 130, 246, 0.05);
}

.theater-label {
  font-size: 10px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
  display: block;
  margin-bottom: 4px;
}

.theater-text {
  font-size: 12px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.theater-text--italic {
  font-style: italic;
  color: rgba(196, 181, 253, 0.8);
}

.theater-error {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.08);
  color: #fca5a5;
  font-size: 11px;
  margin-top: 4px;
}

.theater-spinner {
  animation: theater-spin 0.8s linear infinite;
}

@keyframes theater-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.theater-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
