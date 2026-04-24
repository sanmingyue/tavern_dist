<template>
  <div class="tab-realm">
    <!-- ═══ 1. 境界显示：大境界大字 + 小境界副标题 ═══ -->
    <div class="realm-header">
      <div class="realm-major">{{ store.大境界 }}</div>
      <div v-if="store.小境界" class="realm-minor">{{ store.小境界 }}</div>
    </div>

    <!-- ═══ 2. 修炼进度条（凡人不显示） ═══ -->
    <template v-if="data.当前境界">
      <div class="progress-section">
        <div class="progress-label">
          <span>修炼进度</span>
          <span class="progress-pct">{{ data.$修炼进度 }}%</span>
        </div>
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: data.$修炼进度 + '%' }"
            :class="{ 'is-full': data.$修炼进度 >= 100 }"
          ></div>
        </div>
      </div>

      <!-- ═══ 3. 修炼状态标签 ═══ -->
      <div class="status-row">
        <span class="status-tag" :class="'status-' + (data._修炼状态 || '空闲')">
          {{ data._修炼状态 || '空闲' }}
        </span>
      </div>
    </template>

    <!-- ═══ 4. 主修功法 ═══ -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
        主修功法
      </div>
      <div v-if="data.主修功法" class="gongfa-card">
        <div class="gongfa-top">
          <div class="gongfa-info">
            <span class="gongfa-name">{{ data.主修功法 }}</span>
            <span class="gongfa-grade">{{ data.功法品级 || '未知品级' }}</span>
          </div>
          <button class="gongfa-switch-btn" @click="showGongfaLib = !showGongfaLib">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3l4 4-4 4M4 20h12a4 4 0 0 0 4-4V9" stroke-linecap="round" stroke-linejoin="round"/></svg>
            更换
          </button>
        </div>
        <div class="gongfa-progress">
          <div class="gongfa-progress-label">
            <span>层数</span>
            <span>{{ data.功法已修层数 }} / {{ data.功法总层数 }}</span>
          </div>
          <div class="gongfa-progress-track">
            <div class="gongfa-progress-fill" :style="{ width: gongfaProgressPct + '%' }"></div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <span>尚未修炼功法</span>
        <button v-if="gongfaList.length > 0" class="gongfa-switch-btn" @click="showGongfaLib = !showGongfaLib">从功法库选择</button>
      </div>

      <!-- 功法库面板（可折叠） -->
      <div v-if="showGongfaLib" class="gongfa-library">
        <div class="lib-header">
          <span class="lib-title">功法库</span>
          <button class="lib-close" @click="showGongfaLib = false">✕</button>
        </div>
        <div v-if="gongfaList.length > 0" class="lib-list">
          <div
            v-for="gf in gongfaList"
            :key="gf.name"
            class="lib-item"
            :class="{ 'is-current': gf.name === data.主修功法 }"
          >
            <div class="lib-item-info">
              <span class="lib-item-name">{{ gf.name }}</span>
              <span class="lib-item-grade">{{ gf.grade }}</span>
              <span class="lib-item-progress">{{ gf.current }}/{{ gf.total }}层</span>
            </div>
            <div class="lib-item-actions">
              <button
                v-if="gf.name !== data.主修功法"
                class="lib-equip-btn"
                @click="onEquipGongfa(gf)"
              >装备</button>
              <span v-else class="lib-current-badge">当前</span>
              <button class="lib-remove-btn" @click="onRemoveGongfa(gf.name)">✕</button>
            </div>
          </div>
        </div>
        <div v-else class="lib-empty">功法库为空</div>
      </div>
    </div>

    <!-- ═══ 5. 习得术法：Record格式，标签式翻页，带×删除 ═══ -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"/></svg>
        习得术法
        <span v-if="skillEntries.length" class="count-badge">{{ skillEntries.length }}</span>
      </div>
      <div v-if="skillEntries.length > 0" class="skills-container">
        <div class="skills-list">
          <span
            v-for="skill in pagedSkills"
            :key="skill.name"
            class="skill-tag"
          >
            <span class="skill-name">{{ skill.name }}</span>
            <span class="skill-level">{{ skill.level }}</span>
            <button class="skill-remove" @click="onRemoveSkill(skill.name)">✕</button>
          </span>
        </div>
        <!-- 翻页控制 -->
        <div v-if="totalSkillPages > 1" class="skills-pager">
          <button class="pager-btn" :disabled="skillPage <= 0" @click="skillPage--">‹</button>
          <span class="pager-info">{{ skillPage + 1 }} / {{ totalSkillPages }}</span>
          <button class="pager-btn" :disabled="skillPage >= totalSkillPages - 1" @click="skillPage++">›</button>
        </div>
      </div>
      <div v-else class="empty-state">尚未学会任何术法</div>
    </div>

    <!-- ═══ 6. 异火（条件显示） ═══ -->
    <div v-if="data.异火列表" class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22c-4.97 0-9-2.69-9-6v-.01c0-2.2 1.17-3.14 2-4 .39-.4.78-.87 1-1.49.11-.31.19-.64.21-.99.03-.56-.11-1.07-.38-1.51C4.73 5.87 7.28 2 12 2c4.72 0 7.27 3.87 6.17 6 -.27.44-.41.95-.38 1.51.02.35.1.68.21.99.22.62.61 1.09 1 1.49.83.86 2 1.8 2 4V16c0 3.31-4.03 6-9 6z" stroke-linecap="round" stroke-linejoin="round"/></svg>
        异火
      </div>
      <div class="flame-card"><span class="flame-name">{{ data.异火列表 }}</span></div>
    </div>

    <!-- ═══ 7. 寿元 ═══ -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        寿元
      </div>
      <div class="lifespan-card">
        <div class="lifespan-numbers">
          <span class="lifespan-remaining" :style="{ color: store.寿元状态颜色 }">{{ data._剩余寿元 }}</span>
          <span class="lifespan-separator">/</span>
          <span class="lifespan-total">{{ data.当前寿元 }}</span>
          <span class="lifespan-unit">年</span>
          <span v-if="data._寿元状态 !== '正常'" class="lifespan-status" :style="{ color: store.寿元状态颜色 }">{{ data._寿元状态 }}</span>
        </div>
        <div class="lifespan-track">
          <div class="lifespan-fill" :style="{ width: store.寿元百分比 + '%', background: store.寿元状态颜色 }"></div>
        </div>
      </div>
    </div>

    <!-- ═══ 8. 修炼操作面板 ═══ -->

    <!-- 修炼面板（展开式） -->
    <div v-if="showCultivatePanel" class="section cultivate-panel">
      <div class="panel-header">
        <span class="panel-title">选择修炼方式</span>
        <button class="panel-close" @click="showCultivatePanel = false">✕</button>
      </div>

      <div class="method-grid">
        <button
          v-for="m in CULTIVATE_METHODS"
          :key="m.key"
          class="method-card"
          :class="{ active: cultForm.method === m.key }"
          @click="cultForm.method = m.key"
        >
          <div class="method-icon" v-html="m.icon"></div>
          <div class="method-name">{{ m.name }}</div>
          <div class="method-desc">{{ m.desc }}</div>
        </button>
      </div>

      <!-- 自定义修炼方式输入框 -->
      <div v-if="cultForm.method === 'custom'" class="input-group">
        <label>修炼方式描述</label>
        <input v-model="cultForm.customMethod" type="text" placeholder="输入你的修炼方式，如：以雷淬体、吞噬灵果..." />
      </div>

      <!-- 辅助丹药 -->
      <div class="input-group">
        <label>辅助丹药（从储物戒选择，可选）</label>
        <button v-if="!cultForm.pill" class="select-btn" @click="showPillPicker = true">
          点击从储物戒选择丹药
        </button>
        <div v-else class="selected-material">
          <span>{{ cultForm.pill.name }}×{{ cultForm.pill.count }}</span>
          <button class="clear-btn" @click="cultForm.pill = null">✕</button>
        </div>
      </div>

      <div class="input-group">
        <label>修炼地点</label>
        <div class="location-btns">
          <button class="loc-btn" :class="{ active: cultForm.locMode === 'current' }" @click="cultForm.locMode = 'current'">当前地点</button>
          <button class="loc-btn" :class="{ active: cultForm.locMode === 'custom' }" @click="cultForm.locMode = 'custom'">自定义</button>
        </div>
        <div v-if="cultForm.locMode === 'current'" class="location-display">{{ currentLocation }}</div>
        <input v-else v-model="cultForm.customLocation" type="text" placeholder="输入修炼地点" />
      </div>

      <div class="input-group">
        <label>额外补充（可选）</label>
        <textarea v-model="cultForm.extra" placeholder="双修对象、特殊状况等..." rows="2" />
      </div>

      <div v-if="cultivatePreview" class="preview-box">
        <div class="preview-label">内容预览</div>
        <div class="preview-content">{{ cultivatePreview }}</div>
      </div>

      <button class="send-btn cultivate-send" :disabled="!cultForm.method || (cultForm.method === 'custom' && !cultForm.customMethod.trim())" @click="confirmCultivation">
        确定修炼
      </button>
    </div>

    <!-- 突破/渡劫面板 -->
    <div v-if="showBreakthroughPanel" class="section breakthrough-panel" :class="{ 'tribulation-panel': store.突破类型 === 'tribulation' }">
      <div class="panel-header">
        <span class="panel-title">{{ btPanelTitle }}</span>
        <button class="panel-close" @click="showBreakthroughPanel = false">✕</button>
      </div>

      <div class="breakthrough-info" :class="{ 'tribulation-info': store.突破类型 === 'tribulation' }">
        <div class="bt-realm">{{ data.当前境界 || '凡人' }}</div>
        <div class="bt-arrow">→</div>
        <div class="bt-target">{{ btTargetText }}</div>
      </div>

      <div v-if="store.突破类型 === 'tribulation'" class="tribulation-warning">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <span>渡劫乃修仙路上最大考验，九道天雷将考验肉身、灵力与道心。建议准备充分后再行渡劫。</span>
      </div>

      <div class="input-group">
        <label>{{ store.突破类型 === 'tribulation' ? '渡劫辅助丹药' : store.突破类型 === 'cultivate' ? '引气入体辅助丹药' : '突破辅助丹药' }}（从储物戒选择，可选）</label>
        <button v-if="!btForm.pill" class="select-btn" @click="showBtPillPicker = true">
          点击从储物戒选择丹药
        </button>
        <div v-else class="selected-material">
          <span>{{ btForm.pill.name }}×{{ btForm.pill.count }}</span>
          <button class="clear-btn" @click="btForm.pill = null">✕</button>
        </div>
      </div>

      <div class="input-group">
        <label>额外准备（可选）</label>
        <textarea v-model="btForm.extra" placeholder="布置阵法护持、请人护法等..." rows="2" />
      </div>

      <div v-if="breakthroughPreview" class="preview-box">
        <div class="preview-label">内容预览</div>
        <div class="preview-content">{{ breakthroughPreview }}</div>
      </div>

      <button class="send-btn breakthrough-send" :class="btSendClass" @click="confirmBreakthrough">
        {{ btButtonText }}
      </button>
    </div>

    <!-- ═══ 修炼操作按钮区（页面最底部） ═══ -->
    <div class="action-bar">
      <!-- 凡人模式：只显示引气入体按钮 -->
      <template v-if="!data.当前境界">
        <button
          v-if="data._修炼状态 !== '引气入体'"
          class="action-btn breakthrough-btn cultivate-init-btn"
          @click="startBreakthrough"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          引气入体
        </button>
        <button v-else class="action-btn active-state-btn cancelable" style="background: #3b82f6" @click="cancelState('引气入体')">
          引气入体中
          <span class="cancel-hint">点击取消</span>
        </button>
      </template>
      <!-- 已入修仙之道：正常修炼/突破/渡劫逻辑 -->
      <template v-else>
        <template v-if="!data._修炼状态">
          <button class="action-btn cultivate-btn" @click="startCultivation">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3" stroke-linecap="round"/></svg>
            开始修炼
          </button>
        </template>
        <template v-else-if="data._修炼状态 === '修炼中'">
          <button class="action-btn stop-btn" @click="stopCultivation">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>
            停止修炼
          </button>
        </template>
        <template v-else>
          <button class="action-btn active-state-btn cancelable" :style="{ background: store.修炼状态颜色 }" @click="cancelState(data._修炼状态)">
            {{ data._修炼状态 }}
            <span class="cancel-hint">点击取消</span>
          </button>
        </template>
        <button
          v-if="canBreakthrough"
          class="action-btn breakthrough-btn"
          :class="btButtonClass"
          @click="startBreakthrough"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke-linecap="round" stroke-linejoin="round"/></svg>
          {{ btButtonText }}
        </button>
      </template>
    </div>

    <!-- 丹药选择器 Overlay -->
    <div v-if="showPillPicker" class="picker-overlay">
      <StoragePicker
        title="选择辅助丹药"
        :categories="['丹药']"
        :multiple="false"
        @select="onPillSelect"
        @close="showPillPicker = false"
      />
    </div>
    <div v-if="showBtPillPicker" class="picker-overlay">
      <StoragePicker
        title="选择突破丹药"
        :categories="['丹药']"
        :multiple="false"
        @select="onBtPillSelect"
        @close="showBtPillPicker = false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStatusStore } from '../store';
import StoragePicker from './StoragePicker.vue';

const store = useStatusStore();
const data = computed(() => store.data);

// ─── 功法 ───
const gongfaProgressPct = computed(() => {
  if (!data.value.功法总层数) return 0;
  return Math.min(100, Math.round(data.value.功法已修层数 / data.value.功法总层数 * 100));
});

const showGongfaLib = ref(false);
const gongfaList = computed(() => store.getGongfaList());

async function onEquipGongfa(gf: { name: string; grade: string; current: number; total: number }) {
  await store.equipGongfaFromLibrary(gf);
  showGongfaLib.value = false;
}

async function onRemoveGongfa(name: string) {
  await store.removeGongfaFromLibrary(name);
}

// ─── 术法 ───
const SKILLS_PER_PAGE = 6;
const skillPage = ref(0);

const skillEntries = computed(() => {
  const skills = data.value.习得术法;
  if (!skills || typeof skills !== 'object') return [];
  return Object.entries(skills).map(([name, level]) => ({ name, level }));
});

const totalSkillPages = computed(() => Math.max(1, Math.ceil(skillEntries.value.length / SKILLS_PER_PAGE)));

const pagedSkills = computed(() => {
  const start = skillPage.value * SKILLS_PER_PAGE;
  return skillEntries.value.slice(start, start + SKILLS_PER_PAGE);
});

async function onRemoveSkill(name: string) {
  await store.removeSkill(name);
  // 如果当前页超出范围则回退
  if (skillPage.value >= totalSkillPages.value) {
    skillPage.value = Math.max(0, totalSkillPages.value - 1);
  }
}

// ─── 修炼面板 ───
const CULTIVATE_METHODS = [
  { key: 'meditate', name: '闭关打坐', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3" stroke-linecap="round"/></svg>', desc: '静心凝气，稳步提升' },
  { key: 'pill', name: '服丹修炼', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 4v16M5.5 8.5h13M5.5 15.5h13" stroke-linecap="round"/></svg>', desc: '以丹药辅助加速修炼' },
  { key: 'location', name: '灵地修炼', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3l4 8 5-5 5 15H2L8 3z" stroke-linecap="round" stroke-linejoin="round"/></svg>', desc: '寻找灵气充裕之地' },
  { key: 'combat', name: '实战淬炼', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2" stroke-linecap="round" stroke-linejoin="round"/></svg>', desc: '以战养战，磨砺道心' },
  { key: 'dual', name: '双修合道', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20 5 5 0 0 1 0-10 5 5 0 0 0 0-10z"/></svg>', desc: '与道侣双修' },
  { key: 'comprehend', name: '悟道参禅', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>', desc: '感悟天地大道' },
  { key: 'custom', name: '自定义', icon: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-linecap="round" stroke-linejoin="round"/></svg>', desc: '自由描述修炼方式' },
] as const;

type CultivateMethod = typeof CULTIVATE_METHODS[number]['key'];

const showCultivatePanel = ref(false);
const showBreakthroughPanel = ref(false);
const showPillPicker = ref(false);
const showBtPillPicker = ref(false);

const cultForm = ref({
  method: '' as CultivateMethod | '',
  customMethod: '',
  pill: null as { name: string; count: number } | null,
  locMode: 'current' as 'current' | 'custom',
  customLocation: '',
  extra: '',
});

const btForm = ref({
  pill: null as { name: string; count: number } | null,
  extra: '',
});

const currentLocation = computed(() => {
  return [data.value.大区域, data.value.子区域, data.value.具体地点].filter(Boolean).join('·') || '未知地点';
});

function onPillSelect(items: Array<{ name: string; count: number }>) {
  if (items.length > 0) cultForm.value.pill = items[0];
  showPillPicker.value = false;
}

function onBtPillSelect(items: Array<{ name: string; count: number }>) {
  if (items.length > 0) btForm.value.pill = items[0];
  showBtPillPicker.value = false;
}

// ─── 突破/渡劫相关计算属性 ───

/** 是否可以显示突破/渡劫/引气入体按钮 */
const canBreakthrough = computed(() => {
  // 正在突破或渡劫中不显示
  if (data.value._修炼状态 === '突破中' || data.value._修炼状态 === '渡劫中' || data.value._修炼状态 === '引气入体') return false;
  // 凡人（当前境界为空）可以随时尝试引气入体，不需要修炼进度满100
  if (!data.value.当前境界) return true;
  // 非凡人需要修炼进度满100
  return data.value.$修炼进度 >= 100;
});

const btPanelTitle = computed(() => {
  if (store.突破类型 === 'tribulation') return '准备渡劫';
  if (store.突破类型 === 'cultivate') return '引气入体';
  return '准备突破';
});

const btTargetText = computed(() => {
  if (store.突破类型 === 'tribulation') return '突入下一大境界';
  if (store.突破类型 === 'cultivate') return '炼气期一层';
  return '突破下一小境界';
});

const btButtonText = computed(() => {
  if (store.突破类型 === 'tribulation') return '渡劫飞升';
  if (store.突破类型 === 'cultivate') return '引气入体';
  return '尝试突破';
});

const btButtonClass = computed(() => ({
  'tribulation-btn': store.突破类型 === 'tribulation',
  'cultivate-init-btn': store.突破类型 === 'cultivate',
}));

const btSendClass = computed(() => ({
  'tribulation-send': store.突破类型 === 'tribulation',
  'cultivate-init-send': store.突破类型 === 'cultivate',
}));

// ─── 预览 ───
const cultivatePreview = computed(() => {
  if (!cultForm.value.method) return '';
  const method = CULTIVATE_METHODS.find(m => m.key === cultForm.value.method);
  if (!method) return '';
  // 自定义修炼方式需要填写内容
  if (cultForm.value.method === 'custom' && !cultForm.value.customMethod.trim()) return '';
  const location = cultForm.value.locMode === 'current' ? currentLocation.value : cultForm.value.customLocation || '未知地点';

  const methodName = cultForm.value.method === 'custom' ? cultForm.value.customMethod.trim() : method.name;
  let c = '【修炼·' + methodName + '】\n';
  c += '\n当前境界：' + (data.value.当前境界 || '凡人') + '\n';
  c += '主修功法：' + (data.value.主修功法 || '无功法') + '\n';
  c += '修炼地点：' + location + '\n';
  if (cultForm.value.pill) c += '辅助丹药：' + cultForm.value.pill.name + '（已消耗）\n';
  if (cultForm.value.extra?.trim()) c += '\n【额外】' + cultForm.value.extra.trim();
  return c;
});

const breakthroughPreview = computed(() => {
  const type = store.突破类型;
  if (type === 'tribulation') {
    let c = '【渡劫】' + (data.value.当前境界 || '凡人') + ' → 突入下一大境界\n';
    c += '\n道基圆满，决意渡劫飞升！\n';
    c += '主修功法：' + (data.value.主修功法 || '无功法') + '（' + (data.value.功法品级 || '无') + '）\n';
    c += '灵根：' + (data.value.灵根 || '未知') + '\n';
    if (data.value.剑心境界) c += '剑心境界：' + data.value.剑心境界 + '\n';
    if (data.value.在场角色) c += '在场角色：' + data.value.在场角色 + '\n';
    c += '当前位置：' + currentLocation.value + '\n';
    if (btForm.value.pill) c += '渡劫丹药：' + btForm.value.pill.name + '（已消耗）\n';
    if (btForm.value.extra?.trim()) c += '\n【额外准备】' + btForm.value.extra.trim();
    return c;
  }
  if (type === 'cultivate') {
    let c = '【引气入体】凡人 → 炼气期一层\n';
    c += '\n决意感应天地灵气，尝试引气入体！\n';
    c += '当前位置：' + currentLocation.value + '\n';
    if (btForm.value.pill) c += '辅助丹药：' + btForm.value.pill.name + '（已消耗）\n';
    if (btForm.value.extra?.trim()) c += '\n【额外】' + btForm.value.extra.trim();
    return c;
  }
  let c = '【突破】' + (data.value.当前境界 || '凡人') + '\n';
  c += '\n道基已固，决意尝试突破。\n';
  c += '主修功法：' + (data.value.主修功法 || '无功法') + '（' + (data.value.功法品级 || '无') + '）\n';
  c += '当前位置：' + currentLocation.value + '\n';
  if (btForm.value.pill) c += '突破丹药：' + btForm.value.pill.name + '（已消耗）\n';
  if (btForm.value.extra?.trim()) c += '\n【额外】' + btForm.value.extra.trim();
  return c;
});

// ─── 操作：点击按钮时立刻写入状态变量 ───

/** 点击"开始修炼"按钮：立刻写入 _修炼状态，然后展开面板让用户填写详情 */
async function startCultivation() {
  store.data._修炼状态 = '修炼中';
  await store.saveData();
  showCultivatePanel.value = true;
  toastr.info('已进入修炼状态', '修炼');
}

/** 点击"突破/渡劫/引气入体"按钮：立刻写入对应状态，然后展开面板 */
async function startBreakthrough() {
  const type = store.突破类型;
  if (type === 'tribulation') {
    store.data._修炼状态 = '渡劫中';
  } else if (type === 'cultivate') {
    store.data._修炼状态 = '引气入体';
  } else {
    store.data._修炼状态 = '突破中';
  }
  await store.saveData();
  showBreakthroughPanel.value = true;
  const stateLabel = type === 'tribulation' ? '渡劫' : type === 'cultivate' ? '引气入体' : '突破';
  toastr.info('已进入' + stateLabel + '状态', stateLabel);
}

/** 确认修炼：扣材料 + 发送消息（状态变量已在 startCultivation 时写入） */
async function confirmCultivation() {
  if (!cultForm.value.method) return;
  if (cultForm.value.method === 'custom' && !cultForm.value.customMethod.trim()) return;

  if (cultForm.value.pill) {
    await store.removeFromStorage(cultForm.value.pill.name, cultForm.value.pill.count);
    await store.saveData();
  }

  triggerSlash('/send ' + cultivatePreview.value + ' | /trigger');
  showCultivatePanel.value = false;
  cultForm.value = { method: '', customMethod: '', pill: null, locMode: 'current', customLocation: '', extra: '' };
  toastr.success('修炼内容已发送', '修炼');
}

async function stopCultivation() {
  store.data._修炼状态 = '';
  await store.saveData();
  toastr.info('停止修炼', '修炼');
}

async function cancelState(state: string) {
  store.data._修炼状态 = '';
  await store.saveData();
  toastr.info('已取消' + state, '状态');
}

/** 确认突破/渡劫/引气入体：扣材料 + 发送消息（状态变量已在 startBreakthrough 时写入） */
async function confirmBreakthrough() {
  if (btForm.value.pill) {
    await store.removeFromStorage(btForm.value.pill.name, btForm.value.pill.count);
    await store.saveData();
  }

  const type = store.突破类型;
  triggerSlash('/send ' + breakthroughPreview.value + ' | /trigger');
  showBreakthroughPanel.value = false;
  btForm.value = { pill: null, extra: '' };
  const msg = type === 'tribulation' ? '渡劫已开始！' : type === 'cultivate' ? '引气入体已开始！' : '已开始突破！';
  const title = type === 'tribulation' ? '渡劫' : type === 'cultivate' ? '引气入体' : '突破';
  toastr.success(msg, title);
}
</script>

<style scoped>
.tab-realm { padding: 12px; display: flex; flex-direction: column; gap: 12px; }

/* ═══ 1. 境界显示 ═══ */
.realm-header {
  text-align: center;
  padding: 16px 0 4px;
}
.realm-major {
  font-size: 26px;
  font-weight: 900;
  color: var(--accent-gold, #b8963e);
  letter-spacing: 4px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}
.realm-minor {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary, #6b5d4e);
  margin-top: 2px;
  letter-spacing: 2px;
}

/* ═══ 2. 修炼进度条 ═══ */
.progress-section { padding: 0 4px; }
.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted, #8a7e6a);
  margin-bottom: 4px;
}
.progress-pct { color: var(--accent-gold, #b8963e); font-weight: 700; }
.progress-track {
  height: 10px;
  background: var(--card-border, rgba(180,150,100,0.2));
  border-radius: 5px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #8b5cf6, #a78bfa);
  border-radius: 5px;
  transition: width 0.4s ease;
}
.progress-fill.is-full {
  background: linear-gradient(90deg, #f59e0b, #f97316);
  animation: progress-glow 1.5s ease-in-out infinite;
}
@keyframes progress-glow {
  0%,100% { box-shadow: 0 0 4px rgba(245,158,11,0.4); }
  50% { box-shadow: 0 0 12px rgba(245,158,11,0.7); }
}

/* ═══ 3. 修炼状态标签 ═══ */
.status-row { display: flex; justify-content: center; }
.status-tag {
  display: inline-block;
  padding: 6px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #fff;
}
.status-tag.status-空闲 { background: #94a3b8; }
.status-tag.status-修炼中 { background: #10b981; }
.status-tag.status-突破中 { background: #8b5cf6; }
.status-tag.status-渡劫中 { background: #ef4444; }
.status-tag.status-引气入体 { background: #3b82f6; }

/* ═══ 通用 section ═══ */
.section { background: var(--card-bg, #fafafa); border-radius: 10px; padding: 12px; }
.section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700;
  color: var(--accent-gold, #b8963e);
  margin-bottom: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* ═══ 4. 功法 ═══ */
.gongfa-card { background: var(--content-bg, #fff); border-radius: 8px; padding: 12px; border: 1px solid var(--card-border, #e5e7eb); }
.gongfa-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.gongfa-info { display: flex; flex-direction: column; gap: 2px; }
.gongfa-name { font-size: 15px; font-weight: 700; color: var(--text-primary, #1f2937); }
.gongfa-grade { font-size: 11px; color: var(--accent-gold, #b8963e); font-weight: 600; }
.gongfa-switch-btn {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 5px 12px; border-radius: 6px;
  border: 1px solid var(--accent-gold, #c8a96e);
  background: transparent; color: var(--accent-gold, #b8963e);
  font-size: 11px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.gongfa-switch-btn:hover { background: rgba(200,169,110,0.1); }

.gongfa-progress { display: flex; flex-direction: column; gap: 4px; }
.gongfa-progress-label { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted, #6b7280); }
.gongfa-progress-track { height: 5px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.gongfa-progress-fill { height: 100%; background: #8b5cf6; border-radius: 3px; transition: width 0.3s; }

/* 功法库面板 */
.gongfa-library {
  margin-top: 10px; padding: 10px;
  background: var(--content-bg, #fff);
  border: 1px solid var(--card-border, #e5e7eb);
  border-radius: 8px;
}
.lib-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.lib-title { font-size: 11px; font-weight: 700; color: var(--accent-gold, #b8963e); letter-spacing: 1px; }
.lib-close { background: none; border: none; color: var(--text-muted, #9ca3af); cursor: pointer; font-size: 14px; }
.lib-list { display: flex; flex-direction: column; gap: 6px; }
.lib-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 6px;
  background: var(--card-bg, #fafafa);
}
.lib-item.is-current { border-color: var(--accent-gold, #c8a96e); background: rgba(200,169,110,0.05); }
.lib-item-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.lib-item-name { font-size: 12px; font-weight: 600; color: var(--text-primary, #374151); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lib-item-grade { font-size: 10px; color: var(--accent-gold, #b8963e); white-space: nowrap; }
.lib-item-progress { font-size: 10px; color: var(--text-muted, #6b7280); white-space: nowrap; }
.lib-item-actions { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
.lib-equip-btn {
  padding: 3px 10px; border-radius: 4px; border: 1px solid var(--accent-gold, #c8a96e);
  background: transparent; color: var(--accent-gold, #b8963e);
  font-size: 10px; font-weight: 600; cursor: pointer;
}
.lib-equip-btn:hover { background: rgba(200,169,110,0.15); }
.lib-current-badge {
  padding: 3px 10px; border-radius: 4px;
  background: var(--accent-gold, #b8963e); color: #fff;
  font-size: 10px; font-weight: 600;
}
.lib-remove-btn {
  background: none; border: none; color: var(--text-muted, #9ca3af);
  cursor: pointer; font-size: 12px; padding: 2px 4px;
}
.lib-remove-btn:hover { color: #ef4444; }
.lib-empty { text-align: center; padding: 12px; color: var(--text-muted, #9ca3af); font-size: 11px; font-style: italic; }

/* ═══ 5. 术法 ═══ */
.skills-container { display: flex; flex-direction: column; gap: 8px; }
.skills-list { display: flex; flex-wrap: wrap; gap: 6px; }
.skill-tag {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px; background: var(--content-bg, #fff);
  border: 1px solid var(--card-border, #e5e7eb); border-radius: 14px;
  font-size: 11px; color: var(--text-primary, #374151);
  transition: all 0.15s;
}
.skill-tag:hover { border-color: var(--accent-gold, #c8a96e); }
.skill-name { font-weight: 600; }
.skill-level { font-size: 9px; color: var(--accent-gold, #b8963e); font-weight: 600; }
.skill-remove {
  background: none; border: none;
  color: var(--text-muted, #9ca3af);
  cursor: pointer; font-size: 10px;
  padding: 0 2px; margin-left: 2px;
  line-height: 1;
}
.skill-remove:hover { color: #ef4444; }

.skills-pager {
  display: flex; align-items: center; justify-content: center; gap: 12px;
}
.pager-btn {
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid var(--card-border, #e5e7eb);
  background: var(--content-bg, #fff);
  color: var(--text-primary, #374151);
  font-size: 14px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.pager-btn:hover:not(:disabled) { border-color: var(--accent-gold, #c8a96e); color: var(--accent-gold, #b8963e); }
.pager-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.pager-info { font-size: 11px; color: var(--text-muted, #6b7280); font-weight: 600; }

/* ═══ 6. 异火 ═══ */
.flame-card { background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 8px; padding: 12px; text-align: center; }
.flame-name { font-size: 14px; font-weight: 700; color: #92400e; }

/* ═══ 7. 寿元 ═══ */
.lifespan-card { padding: 4px 0; }
.lifespan-numbers {
  display: flex; align-items: baseline; gap: 2px;
  margin-bottom: 6px;
}
.lifespan-remaining { font-size: 20px; font-weight: 800; }
.lifespan-separator { font-size: 14px; color: var(--text-muted, #9ca3af); margin: 0 2px; }
.lifespan-total { font-size: 14px; font-weight: 600; color: var(--text-muted, #6b7280); }
.lifespan-unit { font-size: 11px; color: var(--text-muted, #9ca3af); margin-left: 2px; }
.lifespan-status {
  margin-left: auto;
  font-size: 11px; font-weight: 700;
  padding: 2px 8px; border-radius: 4px;
  background: rgba(0,0,0,0.05);
}
.lifespan-track { height: 6px; background: var(--card-border, rgba(180,150,100,0.2)); border-radius: 3px; overflow: hidden; }
.lifespan-fill { height: 100%; border-radius: 3px; transition: width 0.4s, background 0.4s; }

/* ═══ 8. 操作按钮区 ═══ */
.action-bar {
  display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;
  padding: 8px 0 4px;
  border-top: 1px solid var(--divider, rgba(200,169,110,0.3));
}
.action-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 10px; border: none;
  font-size: 13px; font-weight: 700; cursor: pointer; letter-spacing: 0.5px;
  transition: all 0.2s;
}
.action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.active-state-btn.cancelable { cursor: pointer; position: relative; opacity: 1; }
.active-state-btn.cancelable:hover { opacity: 0.85; }
.cancel-hint {
  display: none;
  font-size: 10px;
  font-weight: 400;
  opacity: 0.8;
  margin-left: 4px;
}
.active-state-btn.cancelable:hover .cancel-hint { display: inline; }
.cultivate-btn {
  background: linear-gradient(135deg, #10b981, #059669); color: #fff;
  box-shadow: 0 2px 8px rgba(16,185,129,0.3);
}
.cultivate-btn:hover:not(:disabled) { transform: translateY(-1px); }
.stop-btn { background: linear-gradient(135deg, #6b7280, #4b5563); color: #fff; }
.active-state-btn { color: #fff; border-radius: 10px; }
.breakthrough-btn {
  background: linear-gradient(135deg, var(--accent-gold, #b8963e), #9a7d3a); color: #fff;
  box-shadow: 0 2px 8px rgba(184,150,62,0.3);
  animation: pulse 2s ease-in-out infinite;
}
.breakthrough-btn.tribulation-btn {
  background: linear-gradient(135deg, #7c3aed, #4c1d95);
  box-shadow: 0 2px 12px rgba(124,58,237,0.4);
  animation: tribulation-pulse 1.5s ease-in-out infinite;
}
.breakthrough-btn.cultivate-init-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 2px 8px rgba(59,130,246,0.3);
}
@keyframes pulse { 0%,100% { box-shadow: 0 2px 8px rgba(184,150,62,0.3); } 50% { box-shadow: 0 4px 16px rgba(184,150,62,0.5); } }
@keyframes tribulation-pulse { 0%,100% { box-shadow: 0 2px 12px rgba(124,58,237,0.4); } 50% { box-shadow: 0 6px 24px rgba(124,58,237,0.7), 0 0 40px rgba(245,158,11,0.2); } }

/* ═══ 修炼面板 ═══ */
.cultivate-panel, .breakthrough-panel {
  border: 1.5px solid var(--accent-gold, #c8a96e);
  background: linear-gradient(180deg, var(--card-bg, #f5f3ff), var(--content-bg, #fafafa));
}
.breakthrough-panel.tribulation-panel { border-color: #7c3aed; background: linear-gradient(180deg, #f5f3ff, #faf5ff); }
.panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.panel-title { font-size: 13px; font-weight: 700; color: var(--accent-gold, #b8963e); }
.panel-close {
  width: 24px; height: 24px; border-radius: 6px; border: none;
  background: rgba(200, 169, 110, 0.15); color: var(--accent-gold, #b8963e);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; font-size: 14px;
}

.method-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.method-card {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 6px; border: 1.5px solid var(--card-border, #e5e7eb);
  border-radius: 10px; background: var(--content-bg, #fff); cursor: pointer;
}
.method-card:hover { border-color: var(--accent-gold, #b8963e); }
.method-card.active {
  border-color: var(--accent-gold, #b8963e);
  background: var(--tab-hover-bg, #f5f3ff);
  box-shadow: 0 2px 8px rgba(139,92,246,0.15);
}
.method-icon { font-size: 20px; }
.method-name { font-size: 11px; font-weight: 700; color: var(--text-primary, #374151); }
.method-desc { font-size: 9px; color: var(--text-muted, #9ca3af); text-align: center; }

.input-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.input-group label { font-size: 11px; font-weight: 600; color: var(--text-muted, #64748b); text-transform: uppercase; letter-spacing: 0.5px; }
.input-group input, .input-group textarea {
  padding: 8px 10px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 6px;
  font-size: 13px; color: var(--text-primary, #1e293b); background: var(--content-bg, #fff);
}
.input-group input:focus, .input-group textarea:focus { outline: none; border-color: var(--accent-gold, #b8963e); }
.input-group textarea { resize: vertical; min-height: 50px; }

.select-btn {
  padding: 10px; border: 1.5px dashed #c4b5fd; border-radius: 8px;
  background: var(--content-bg, #fff); color: var(--accent-gold, #b8963e);
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.select-btn:hover { background: var(--tab-hover-bg, #f5f3ff); }
.selected-material {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; background: var(--tab-hover-bg, #f5f3ff);
  border: 1px solid #c4b5fd; border-radius: 6px;
  font-size: 12px; color: var(--accent-gold, #b8963e); font-weight: 600;
}
.clear-btn { background: none; border: none; color: var(--accent-gold, #b8963e); cursor: pointer; font-size: 14px; }

.location-btns { display: flex; gap: 8px; margin-bottom: 6px; }
.loc-btn {
  flex: 1; padding: 6px 10px; border: 1px solid var(--card-border, #e5e7eb);
  border-radius: 6px; background: var(--content-bg, #fff);
  font-size: 12px; color: var(--text-secondary, #475569); cursor: pointer;
}
.loc-btn:hover { border-color: var(--accent-gold, #b8963e); color: var(--accent-gold, #b8963e); }
.loc-btn.active { background: #8b5cf6; border-color: var(--accent-gold, #b8963e); color: #fff; }
.location-display {
  padding: 8px 10px; background: rgba(200,169,110,0.08);
  border: 1px solid var(--card-border, #e5e7eb);
  border-radius: 6px; font-size: 12px; color: var(--text-secondary, #475569);
}

.preview-box { background: rgba(200,169,110,0.08); border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; padding: 10px; margin-bottom: 10px; }
.preview-label { font-size: 10px; font-weight: 700; color: var(--accent-gold, #b8963e); margin-bottom: 6px; text-transform: uppercase; }
.preview-content { font-size: 12px; color: var(--text-secondary, #475569); line-height: 1.6; white-space: pre-wrap; max-height: 120px; overflow-y: auto; }

.send-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px; border: none; border-radius: 10px; color: #fff;
  font-size: 14px; font-weight: 700; cursor: pointer; width: 100%;
}
.send-btn:hover:not(:disabled) { transform: translateY(-1px); }
.send-btn:disabled { background: #e8ecf1; color: var(--text-muted, #94a3b8); cursor: not-allowed; }
.cultivate-send { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 2px 8px rgba(16,185,129,0.3); }
.breakthrough-send { background: linear-gradient(135deg, var(--accent-gold, #b8963e), #9a7d3a); box-shadow: 0 2px 8px rgba(184,150,62,0.3); }
.breakthrough-send.tribulation-send { background: linear-gradient(135deg, #7c3aed, #4c1d95); box-shadow: 0 2px 12px rgba(124,58,237,0.4); }
.breakthrough-send.cultivate-init-send { background: linear-gradient(135deg, #3b82f6, #2563eb); box-shadow: 0 2px 8px rgba(59,130,246,0.3); }

.breakthrough-info {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 16px; background: linear-gradient(135deg, rgba(200,169,110,0.08), rgba(200,169,110,0.04));
  border-radius: 10px; margin-bottom: 12px;
}
.breakthrough-info.tribulation-info { background: linear-gradient(135deg, #ede9fe, #ddd6fe); border: 1px solid rgba(124,58,237,0.2); }
.bt-realm { font-size: 14px; font-weight: 700; color: var(--topbar-text, #4a3520); }
.bt-arrow { font-size: 18px; color: var(--accent-gold, #b8963e); font-weight: 800; }
.bt-target { font-size: 14px; font-weight: 700; color: var(--accent-gold, #b8963e); }

.tribulation-warning {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 12px; background: #fffbeb; border: 1px solid #fef08a;
  border-radius: 8px; margin-bottom: 12px;
  font-size: 11px; color: #92400e; line-height: 1.6;
}
.tribulation-warning svg { flex-shrink: 0; margin-top: 2px; }

/* ═══ 通用 ═══ */
.empty-state {
  text-align: center; padding: 16px; color: var(--text-muted, #9ca3af);
  font-size: 12px; font-style: italic;
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.count-badge {
  margin-left: auto; padding: 2px 8px;
  background: rgba(200, 169, 110, 0.15); color: var(--accent-gold, #b8963e);
  border-radius: 10px; font-size: 10px; font-weight: 600;
}
.picker-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  padding: 20px; z-index: 100;
}

/* PC端字号放大 */
@media (min-width: 501px) {
  .section-title { font-size: 14px; }
  .realm-major { font-size: 30px; }
  .realm-minor { font-size: 16px; }
}

/* 手机端适配 */
@media (max-width: 500px) {
  .tab-realm { padding: 10px; gap: 10px; }
  .realm-major { font-size: 22px; letter-spacing: 2px; }
  .realm-minor { font-size: 13px; }
  .section { padding: 10px; }
  .section-title { font-size: 12px; }
  .method-grid { grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .method-card { padding: 8px 4px; }
  .method-name { font-size: 10px; }
  .method-desc { font-size: 8px; }
  .action-btn { padding: 8px 14px; font-size: 12px; }
  .send-btn { padding: 10px; font-size: 13px; }
  .picker-overlay { padding: 10px; }

  .breakthrough-info {
    padding: 12px;
    gap: 8px;
    flex-direction: column;
    text-align: center;
  }

  .bt-realm, .bt-target { font-size: 13px; }
}
</style>
