<template>
  <div class="tab-basic">
    <!-- 位置信息 -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        当前位置
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">大区域</span>
          <span class="value">{{ data.大区域 || '未知' }}</span>
        </div>
        <div class="info-item">
          <span class="label">子区域</span>
          <span class="value">{{ data.子区域 || '未知' }}</span>
        </div>
        <div class="info-item full">
          <span class="label">具体地点</span>
          <span class="value">{{ data.具体地点 || '未知' }}</span>
        </div>
      </div>

      <!-- 在场角色：头像横排列表 -->
      <div class="present-section" v-if="presentCharacters.length > 0">
        <div class="present-label">在场角色</div>
        <div class="present-avatars">
          <div
            v-for="char in presentCharacters"
            :key="char"
            class="present-avatar"
            :class="{ 'has-portrait': hasPortrait(char) }"
            @click="hasPortrait(char) && openPortrait(char)"
            :title="char"
          >
            <img
              v-if="hasPortrait(char)"
              :src="getPortraitUrl(char)!"
              :alt="char"
              class="present-avatar-img"
              loading="lazy"
            />
            <span v-else class="present-avatar-text">{{ char.charAt(0) }}</span>
            <span class="present-avatar-name">{{ char }}</span>
          </div>
        </div>
      </div>
      <div class="info-grid" v-else>
        <div class="info-item full">
          <span class="label">在场角色</span>
          <span class="value empty">无</span>
        </div>
      </div>
    </div>

    <!-- 身份信息 -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
        身份信息
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">灵根</span>
          <span class="value highlight">{{ data.灵根 || '未测定' }}</span>
        </div>
        <div class="info-item">
          <span class="label">道途</span>
          <span class="value" :style="{ color: store.道途颜色 }">{{ data.道途 || '未确立' }}</span>
        </div>
        <div class="info-item">
          <span class="label">所属势力</span>
          <span class="value">{{ data.所属势力 || '无' }}</span>
        </div>
        <div class="info-item">
          <span class="label">宗门地位</span>
          <span class="value">{{ data.宗门地位 || '无' }}</span>
        </div>
      </div>
    </div>

    <!-- 时间 -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" stroke-linecap="round" />
        </svg>
        时间
      </div>
      <div class="time-display">
        <span class="date">{{ data.阴阳历 || '未知' }}</span>
        <span class="hour" v-if="data.时辰">{{ data.时辰 }}</span>
      </div>
    </div>

    <!-- 寿元 -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        寿元
      </div>
      <div class="lifespan-grid">
        <div class="lifespan-item">
          <span class="label">当前年纪</span>
          <span class="value">{{ data.当前年纪 || 0 }}</span>
        </div>
        <div class="lifespan-item">
          <span class="label">当前寿元</span>
          <span class="value highlight">{{ data.当前寿元 || 0 }}</span>
        </div>
        <div class="lifespan-item">
          <span class="label">剩余寿元</span>
          <span class="value" :style="{ color: lifespanColor }">{{ data._剩余寿元 || 0 }}</span>
        </div>
      </div>
      <div class="lifespan-status" v-if="data._寿元状态 !== '正常' || data._轮回状态 !== '正常'">
        <span class="status-tag" v-if="data._寿元状态 !== '正常'" :class="'status-' + data._寿元状态">{{ data._寿元状态 }}</span>
        <span class="status-tag reincarnation" v-if="data._轮回状态 !== '正常'">{{ data._轮回状态 }}</span>
      </div>
    </div>

    <!-- 立绘弹出层 -->
    <PortraitViewer
      :visible="portraitVisible"
      :url="portraitUrl"
      :name="portraitName"
      @close="portraitVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStatusStore } from '../store';
import { getPortraitUrl, hasPortrait } from '../characterPortraits';
import PortraitViewer from './PortraitViewer.vue';

const store = useStatusStore();
const data = computed(() => store.data);

const lifespanColor = computed(() => {
  const pct = store.寿元百分比;
  if (pct >= 80) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  if (pct >= 20) return '#f97316';
  return '#ef4444';
});

const presentCharacters = computed(() => {
  const raw = data.value.在场角色;
  if (!raw) return [];
  return raw.split(/[、，,；;]/).map(s => s.trim()).filter(Boolean);
});

const portraitVisible = ref(false);
const portraitUrl = ref('');
const portraitName = ref('');

function openPortrait(name: string) {
  const url = getPortraitUrl(name);
  if (!url) return;
  portraitUrl.value = url;
  portraitName.value = name;
  portraitVisible.value = true;
}
</script>

<style scoped>
.tab-basic {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  background: var(--card-bg, #fafafa);
  border: 1px solid var(--card-border, rgba(180, 150, 100, 0.2));
  border-radius: 10px;
  padding: 14px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-gold, #b8963e);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: var(--content-bg, #fff);
  border-radius: 6px;
  border: 1px solid var(--card-border, rgba(180, 150, 100, 0.1));
}

.info-item.full {
  grid-column: 1 / -1;
}

.info-item .label {
  font-size: 12px;
  color: var(--text-muted, #9a8b7a);
}

.info-item .value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #2a1f1a);
}

.info-item .value.highlight {
  color: var(--accent-gold, #b8963e);
}

.info-item .value.empty {
  color: var(--text-muted, #9a8b7a);
  font-style: italic;
}

/* ─── 在场角色头像列表 ─── */
.present-section {
  margin-top: 8px;
  padding: 10px;
  background: var(--content-bg, #fff);
  border-radius: 8px;
  border: 1px solid var(--card-border, rgba(180, 150, 100, 0.1));
}

.present-label {
  font-size: 12px;
  color: var(--text-muted, #9a8b7a);
  margin-bottom: 8px;
}

.present-avatars {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.present-avatar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  transition: all 0.2s;
}

.present-avatar.has-portrait {
  cursor: pointer;
}

.present-avatar.has-portrait:hover {
  transform: translateY(-2px);
}

.present-avatar.has-portrait:hover .present-avatar-img {
  border-color: var(--accent-gold, #b8963e);
  box-shadow: 0 0 12px rgba(200, 169, 110, 0.4);
}

.present-avatar-img {
  width: 40px !important;
  height: 40px;
  border-radius: 50% !important;
  object-fit: cover !important;
  aspect-ratio: 1 / 1;
  display: block;
  border: 2px solid var(--accent-gold, rgba(200, 169, 110, 0.3));
  box-shadow: 0 0 6px rgba(200, 169, 110, 0.1);
  transition: all 0.2s;
}

.present-avatar-text {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--card-bg, #f3f4f6);
  border: 2px solid var(--card-border, #e5e7eb);
  font-size: 15px;
  font-weight: 700;
  color: var(--text-muted, #9ca3af);
  user-select: none;
}

.present-avatar-name {
  font-size: 11px;
  color: var(--text-secondary, #6b5d4e);
  max-width: 52px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.present-avatar.has-portrait .present-avatar-name {
  color: var(--accent-gold, #b8963e);
}

.time-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: var(--content-bg, #fff);
  border: 1px solid var(--card-border, rgba(180, 150, 100, 0.15));
  border-radius: 8px;
}

.date {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary, #2a1f1a);
}

.hour {
  font-size: 13px;
  font-weight: 700;
  color: var(--accent-gold, #b8963e);
  padding: 4px 12px;
  background: var(--card-bg, #fff);
  border: 1px solid var(--card-border, rgba(180, 150, 100, 0.2));
  border-radius: 12px;
}

/* ─── 寿元区域 ─── */
.lifespan-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.lifespan-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 8px;
  background: var(--content-bg, #fff);
  border-radius: 8px;
  border: 1px solid var(--card-border, rgba(180, 150, 100, 0.1));
}

.lifespan-item .label {
  font-size: 11px;
  color: var(--text-muted, #9a8b7a);
  margin-bottom: 4px;
}

.lifespan-item .value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary, #2a1f1a);
}

.lifespan-item .value.highlight {
  color: var(--accent-gold, #b8963e);
}

.lifespan-status {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;
}

.status-tag {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: #fef3c7;
  color: #92400e;
}

.status-tag.status-衰老初期 { background: #fef3c7; color: #92400e; }
.status-tag.status-灵力枯竭 { background: #fed7aa; color: #c2410c; }
.status-tag.status-油尽灯枯 { background: #fee2e2; color: #b91c1c; }
.status-tag.status-寿终正寝 { background: #fecaca; color: #991b1b; }
.status-tag.reincarnation { background: #ede9fe; color: #7c3aed; }

/* PC端字号放大 */
@media (min-width: 501px) {
  .info-item .label { font-size: 13px; }
  .info-item .value { font-size: 14px; }
  .section-title { font-size: 14px; }
  .date { font-size: 15px; }
  .hour { font-size: 14px; }
  .present-avatar-img { width: 44px; height: 44px; }
  .present-avatar-text { width: 44px; height: 44px; font-size: 16px; }
  .present-avatar-name { font-size: 12px; }
}

/* 手机端适配 */
@media (max-width: 500px) {
  .tab-basic { padding: 10px; gap: 12px; }
  .section { padding: 10px; }
  .info-grid { gap: 6px; }
  .info-item { padding: 6px 8px; }
  .info-item .label { font-size: 11px; }
  .info-item .value { font-size: 12px; }
  .lifespan-grid { gap: 6px; }
  .lifespan-item { padding: 8px 6px; }
  .lifespan-item .value { font-size: 14px; }
  .present-avatar-img { width: 36px !important; height: 36px; }
  .present-avatar-text { width: 36px; height: 36px; font-size: 14px; }
  .present-avatar-name { font-size: 10px; max-width: 44px; }
  .present-avatars { gap: 8px; }
}
</style>
