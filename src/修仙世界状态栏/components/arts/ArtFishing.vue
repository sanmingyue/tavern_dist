<template>
  <ArtPageLayout artKey="钓鱼">
    <template #icon>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M6.5 12c0 0 2-5 7.5-5s7.5 5 7.5 5-2 5-7.5 5S6.5 12 6.5 12z" />
        <path d="M6.5 12L2 8v8l4.5-4z" />
        <circle cx="17" cy="12" r="1" fill="currentColor" />
      </svg>
    </template>

    <!-- 钓鱼没有境界/熟练度，用 realm-extra 提示 -->
    <template #realm-extra>
      <div class="hint-text">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>钓鱼不需要境界，人人可钓</span>
      </div>
    </template>

    <!-- 钓鱼装备 -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        钓鱼装备
      </div>
      <div class="equip-grid">
        <div v-for="slot in EQUIP_SLOTS" :key="slot.key" class="equip-item" @click="openFishingEquipInput(slot.key, slot.label)">
          <div class="equip-label">{{ slot.label }}</div>
          <div class="equip-value" :class="{ empty: !getFishingEquip(slot.key) }">
            {{ getFishingEquip(slot.key) || '未装备' }}
          </div>
          <div class="equip-edit-hint">
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
        </div>
      </div>

      <!-- 钓鱼装备编辑弹窗 -->
      <div v-if="editingFishingSlot" class="fishing-equip-overlay" @click="editingFishingSlot = null">
        <div class="fishing-equip-modal" @click.stop>
          <div class="fishing-equip-header">
            <span>设置{{ editingFishingLabel }}</span>
            <button class="fishing-equip-close" @click="editingFishingSlot = null">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <input
            v-model="fishingEquipInput"
            type="text"
            class="fishing-equip-input"
            :placeholder="'输入' + editingFishingLabel + '名称，留空则卸下'"
            @keyup.enter="confirmFishingEquip"
          />
          <div class="fishing-equip-actions">
            <button class="fishing-equip-clear" @click="fishingEquipInput = ''; confirmFishingEquip()">卸下装备</button>
            <button class="fishing-equip-confirm" @click="confirmFishingEquip">确认</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 钓鱼统计 -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
        钓鱼记录
      </div>
      <div class="stats-row">
        <div class="stat-box">
          <div class="stat-num">{{ data._钓鱼_钓鱼次数 }}</div>
          <div class="stat-label">钓鱼次数</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">{{ data.$钓鱼_成功次数 }}</div>
          <div class="stat-label">成功次数</div>
        </div>
        <div class="stat-box">
          <div class="stat-num">{{ successRate }}</div>
          <div class="stat-label">成功率</div>
        </div>
      </div>
      <div v-if="data.$钓鱼_鱼获记录 || data.$钓鱼_最高记录" class="record-row">
        <div v-if="data.$钓鱼_最高记录" class="record-item">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#f59e0b" stroke-width="2"><polygon points="12,2 15,8 22,9 17,14 18,21 12,18 6,21 7,14 2,9 9,8" /></svg>
          <span>{{ data.$钓鱼_最高记录 }}</span>
        </div>
        <div v-if="data.$钓鱼_鱼获记录" class="record-item">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#10b981" stroke-width="2"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" /><path d="M8 12h8M12 8v8" /></svg>
          <span>{{ data.$钓鱼_鱼获记录 }}</span>
        </div>
      </div>
    </div>

    <!-- 钓鱼操作区 -->
    <div v-if="!isQTEActive" class="section fishing-action">
      <!-- 钓鱼地点 -->
      <div class="action-group">
        <div class="action-label">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /><circle cx="12" cy="9" r="2.5" /></svg>
          钓鱼地点
        </div>
        <div class="location-btns">
          <button class="loc-btn" :class="{ active: locationMode === 'current' }" @click="locationMode = 'current'">当前地点</button>
          <button class="loc-btn" :class="{ active: locationMode === 'custom' }" @click="locationMode = 'custom'">自定义</button>
        </div>
        <div v-if="locationMode === 'current'" class="location-display">{{ data.具体地点 || '未设定具体地点' }}</div>
        <input v-else v-model="customLocation" type="text" class="location-input" placeholder="输入钓鱼地点" />
      </div>

      <!-- 鱼饵选择 -->
      <div class="action-group">
        <div class="action-label">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3c0 1.5 1 3 1 5H9c0-2 1-3.5 1-5a3 3 0 0 0-6 0c0 1.5 1 3 1 5H3c0-2 1-3.5 1-5a3 3 0 0 1 6 0" /><path d="M12 22v-6" /><path d="M8 22h8" /></svg>
          鱼饵
        </div>
        <div v-if="availableBaits.length > 0" class="bait-btns">
          <button v-for="bait in availableBaits" :key="bait.name" class="bait-btn" :class="{ active: selectedBait === bait.name }" @click="selectedBait = bait.name">
            {{ bait.name }}<span v-if="bait.count" class="bait-count">×{{ bait.count }}</span>
          </button>
        </div>
        <div v-else class="bait-empty-hint">储物戒中无鱼饵，可手动输入或先购买鱼饵</div>
        <div class="custom-bait-wrap">
          <input v-model="customBaitInput" type="text" class="custom-bait-input" placeholder="手动输入鱼饵名称" @keyup.enter="applyCustomBait" />
          <button v-if="customBaitInput.trim()" class="custom-bait-apply" @click="applyCustomBait">使用</button>
        </div>
      </div>

      <!-- 开始钓鱼按钮 -->
      <button class="start-btn" @click="startFishing">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
        开始钓鱼
      </button>
    </div>

    <!-- QTE钓鱼界面 -->
    <div v-else class="section qte-area">
      <div class="float-container">
        <svg class="water-waves" viewBox="0 0 200 60" preserveAspectRatio="none">
          <path class="wave wave1" d="M0 30 Q25 20 50 30 T100 30 T150 30 T200 30 V60 H0 Z" />
          <path class="wave wave2" d="M0 35 Q25 45 50 35 T100 35 T150 35 T200 35 V60 H0 Z" />
        </svg>
        <div class="float" :class="{ hooked: isFishHooked, warning: isWarning }">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 4v8M8 12l4-4 4 4" />
            <circle cx="12" cy="20" r="3" :fill="isFishHooked ? '#ef4444' : '#3b82f6'" />
          </svg>
        </div>
        <div class="fishing-line"></div>
      </div>

      <div class="qte-status">
        <div class="status-text" :class="{ alert: isFishHooked }">{{ statusText }}</div>
        <div class="attempt-dots">
          <span v-for="i in 3" :key="i" class="dot" :class="{ success: i <= successCount, fail: i <= (3 - remainingAttempts) && i > successCount }"></span>
        </div>
      </div>

      <button class="pull-btn" :class="{ ready: isFishHooked, disabled: !isFishHooked }" :disabled="!isFishHooked" @click="pullRod">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
        <span>{{ isFishHooked ? '提竿！' : '等待中...' }}</span>
      </button>

      <button class="cancel-btn" @click="cancelFishing">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        取消钓鱼
      </button>
    </div>
  </ArtPageLayout>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted } from 'vue';
import { useStatusStore } from '../../store';
import { getCategoryRecord, removeItemFromCategory } from '../../storageUtils';
import ArtPageLayout from './ArtPageLayout.vue';

const store = useStatusStore();
const data = computed(() => store.data);

// ─── 钓鱼装备 ───
function getFishingEquip(key: string): string {
  return (data.value as Record<string, unknown>)[`装备_${key}`] as string ?? '';
}
function setFishingEquip(key: string, value: string) {
  (store.data as Record<string, unknown>)[`装备_${key}`] = value;
}

const editingFishingSlot = ref<string | null>(null);
const editingFishingLabel = ref('');
const fishingEquipInput = ref('');

const EQUIP_SLOTS = [
  { key: '鱼竿', label: '鱼竿' },
  { key: '渔网', label: '渔网' },
  { key: '钓箱', label: '钓箱' },
];

function openFishingEquipInput(key: string, label: string) {
  editingFishingSlot.value = key;
  editingFishingLabel.value = label;
  fishingEquipInput.value = getFishingEquip(key);
}

async function confirmFishingEquip() {
  if (!editingFishingSlot.value) return;
  const newValue = fishingEquipInput.value.trim();
  setFishingEquip(editingFishingSlot.value, newValue);
  await store.saveData();
  if (newValue) {
    toastr.success(`已装备「${newValue}」`, editingFishingLabel.value);
  } else {
    toastr.info(`已卸下${editingFishingLabel.value}`);
  }
  editingFishingSlot.value = null;
}

// ─── 从储物戒_鱼饵获取鱼饵 ───
interface BaitItem { name: string; count: number; }

const availableBaits = computed<BaitItem[]>(() => {
  const record = getCategoryRecord(data.value, '鱼饵');
  return Object.entries(record)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ name, count }));
});

const customBaitInput = ref('');
function applyCustomBait() {
  const v = customBaitInput.value.trim();
  if (v) { selectedBait.value = v; customBaitInput.value = ''; }
}

// ─── 统计 ───
const successRate = computed(() => {
  const total = data.value._钓鱼_钓鱼次数;
  if (!total) return '0%';
  return Math.round((data.value.$钓鱼_成功次数 / total) * 100) + '%';
});

// ─── 钓鱼参数 ───
const locationMode = ref<'current' | 'custom'>('current');
const customLocation = ref('');
// 默认选中储物戒中第一个鱼饵，否则默认灵蚯蚓
const selectedBait = ref('');

// ─── QTE 状态 ───
const isQTEActive = ref(false);
const isFishHooked = ref(false);
const isWarning = ref(false);
const remainingAttempts = ref(3);
const successCount = ref(0);

interface QTEAttempt { pulled: boolean; reactionTime: number | null; }
const qteAttempts = ref<QTEAttempt[]>([]);
let hookTimestamp = 0;
let fishTimer: ReturnType<typeof setTimeout> | null = null;
let warningTimer: ReturnType<typeof setTimeout> | null = null;
let pullTimer: ReturnType<typeof setTimeout> | null = null;

const statusText = computed(() => {
  if (isFishHooked.value) return '鱼儿上钩了！快提竿！';
  if (isWarning.value) return '鱼来了...';
  return '耐心等待鱼儿上钩...';
});

// ─── 开始钓鱼 ───
function startFishing() {
  // _当前百艺 已由 openArtsPage 设置为 '钓鱼'
  isQTEActive.value = true;
  isFishHooked.value = false;
  isWarning.value = false;
  remainingAttempts.value = 3;
  successCount.value = 0;
  qteAttempts.value = [];
  scheduleFish();
}

function scheduleFish() {
  const waitTime = 2000 + Math.random() * 4000;
  fishTimer = setTimeout(() => {
    if (!isQTEActive.value) return;
    isWarning.value = true;
    const warningDuration = 800 + Math.random() * 700;
    warningTimer = setTimeout(() => {
      if (!isQTEActive.value) return;
      isWarning.value = false;
      isFishHooked.value = true;
      hookTimestamp = Date.now();
      const pullWindow = 1500 + Math.random() * 1000;
      pullTimer = setTimeout(() => {
        if (isFishHooked.value && isQTEActive.value) handleMiss();
      }, pullWindow);
    }, warningDuration);
  }, waitTime);
}

function pullRod() {
  if (!isFishHooked.value) return;
  if (pullTimer) { clearTimeout(pullTimer); pullTimer = null; }
  const reactionTime = Date.now() - hookTimestamp;
  qteAttempts.value.push({ pulled: true, reactionTime });
  successCount.value++;
  toastr.success(`提竿成功！反应 ${reactionTime}ms`);
  remainingAttempts.value--;
  isFishHooked.value = false;
  if (remainingAttempts.value <= 0) { finishFishing(); }
  else { setTimeout(() => { if (isQTEActive.value) scheduleFish(); }, 1500); }
}

function handleMiss() {
  isFishHooked.value = false;
  remainingAttempts.value--;
  qteAttempts.value.push({ pulled: false, reactionTime: null });
  toastr.info('鱼跑了…超时未提竿');
  if (remainingAttempts.value <= 0) { finishFishing(); }
  else { setTimeout(() => { if (isQTEActive.value) scheduleFish(); }, 1500); }
}

// ─── 完成钓鱼 ───
async function finishFishing() {
  clearAllTimers();
  isQTEActive.value = false;

  // 从储物戒_鱼饵中扣除鱼饵
  const bait = selectedBait.value;
  let baitConsumed = false;
  if (bait) {
    baitConsumed = removeItemFromCategory(store.data, '鱼饵', bait, 1);
  }

  store.data._钓鱼_钓鱼次数 = (store.data._钓鱼_钓鱼次数 || 0) + 1;
  await store.saveData();

  const content = generateFishingContent(baitConsumed);
  triggerSlash(`/send ${content} | /trigger`);
}

// ─── 取消钓鱼 ───
function cancelFishing() {
  clearAllTimers();
  isQTEActive.value = false;
  isFishHooked.value = false;
  isWarning.value = false;
  // 【修复】取消钓鱼不离开百艺页面，只取消本轮QTE
  toastr.info('已取消本轮抛竿');
}

function clearAllTimers() {
  if (fishTimer) { clearTimeout(fishTimer); fishTimer = null; }
  if (warningTimer) { clearTimeout(warningTimer); warningTimer = null; }
  if (pullTimer) { clearTimeout(pullTimer); pullTimer = null; }
}

function generateFishingContent(baitConsumed: boolean): string {
  const location = locationMode.value === 'current'
    ? (data.value.具体地点 || data.value.子区域 || data.value.大区域 || '某处水域')
    : customLocation.value;
  const rod = data.value.装备_鱼竿 || '普通鱼竿';
  const net = data.value.装备_渔网 || '';
  const box = data.value.装备_钓箱 || '';
  const bait = selectedBait.value;

  let content = '【钓鱼】\n';
  content += `地点：${location}\n`;
  content += `鱼竿：${rod}\n`;
  content += `鱼饵：${bait}${baitConsumed ? '（已消耗）' : '（储物戒中未找到，空手钓鱼）'}\n`;
  if (net) content += `渔网：${net}\n`;
  if (box) content += `钓箱：${box}\n`;

  content += `\n提竿表现：共${qteAttempts.value.length}次机会\n`;
  qteAttempts.value.forEach((attempt, i) => {
    if (attempt.pulled) {
      content += `  第${i + 1}次：成功提竿（反应${attempt.reactionTime}ms）\n`;
    } else {
      content += `  第${i + 1}次：超时未提竿，鱼跑了\n`;
    }
  });
  const pulled = qteAttempts.value.filter(a => a.pulled).length;
  content += `\n结果：${pulled}/${qteAttempts.value.length}次提竿成功\n`;
  content += '\n请根据钓鱼地点环境、装备、鱼饵品质和提竿表现，描写本次钓鱼过程，并决定钓到了什么（或空军）。';
  return content;
}

onUnmounted(() => clearAllTimers());
</script>

<style scoped>
.hint-text { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted, #94a3b8); }

.section { background: var(--card-bg, #fafafa); border-radius: 10px; padding: 12px; }
.section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--accent-gold, #b8963e); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }

.equip-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.equip-item { background: var(--content-bg, #fff); border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; padding: 8px 10px; cursor: pointer; position: relative; transition: all 0.15s; }
.equip-item:hover { border-color: var(--art-color, #0ea5e9); background: var(--tab-hover-bg, rgba(200, 169, 110, 0.05)); }
.equip-label { font-size: 10px; color: var(--text-muted, #9ca3af); margin-bottom: 4px; text-transform: uppercase; }
.equip-value { font-size: 12px; font-weight: 600; color: var(--text-primary, #1e293b); }
.equip-value.empty { color: var(--text-muted, #cbd5e1); font-style: italic; }
.equip-edit-hint { position: absolute; top: 4px; right: 4px; color: var(--text-muted, #cbd5e1); opacity: 0; transition: opacity 0.15s; }
.equip-item:hover .equip-edit-hint { opacity: 1; }

.stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 10px; }
.stat-box { background: var(--content-bg, #fff); border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; padding: 10px; text-align: center; }
.stat-num { font-size: 18px; font-weight: 800; color: #3b82f6; }
.stat-label { font-size: 10px; color: var(--text-muted, #9ca3af); margin-top: 4px; text-transform: uppercase; }

.record-row { display: flex; flex-direction: column; gap: 6px; padding-top: 10px; border-top: 1px dashed #e5e7eb; }
.record-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary, #475569); }

.fishing-action { display: flex; flex-direction: column; gap: 16px; }
.action-group { display: flex; flex-direction: column; gap: 8px; }
.action-label { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; color: var(--text-muted, #64748b); text-transform: uppercase; }

.location-btns { display: flex; gap: 8px; }
.loc-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 12px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; background: var(--content-bg, #fff); font-size: 12px; color: var(--text-secondary, #475569); cursor: pointer; transition: all 0.2s; }
.loc-btn:hover { border-color: var(--art-color, #0ea5e9); color: var(--art-color, #0ea5e9); }
.loc-btn.active { background: var(--art-color, #0ea5e9); border-color: var(--art-color, #0ea5e9); color: #fff; }
.location-display { padding: 10px 12px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; font-size: 13px; color: #0369a1; }
.location-input { padding: 10px 12px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; font-size: 13px; color: var(--text-primary, #1e293b); background: var(--content-bg, #fff); }
.location-input:focus { outline: none; border-color: var(--art-color, #0ea5e9); }

.bait-btns { display: flex; flex-wrap: wrap; gap: 6px; }
.bait-btn { padding: 6px 12px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 16px; background: var(--content-bg, #fff); font-size: 12px; color: var(--text-secondary, #475569); cursor: pointer; transition: all 0.2s; }
.bait-btn:hover { border-color: #10b981; color: #10b981; }
.bait-btn.active { background: #10b981; border-color: #10b981; color: #fff; }
.bait-count { font-size: 10px; color: var(--text-muted, #9ca3af); margin-left: 2px; }
.bait-empty-hint { display: flex; align-items: center; gap: 6px; padding: 8px 12px; background: var(--content-bg, #fff); border: 1px dashed var(--card-border, #e5e7eb); border-radius: 8px; font-size: 11px; color: var(--text-muted, #9ca3af); }
.custom-bait-wrap { display: flex; gap: 6px; margin-top: 6px; }
.custom-bait-input { flex: 1; padding: 6px 10px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 6px; font-size: 12px; color: var(--text-primary, #1e293b); background: var(--content-bg, #fff); }
.custom-bait-input:focus { outline: none; border-color: var(--art-color, #0ea5e9); }
.custom-bait-apply { padding: 6px 12px; border: 1px solid #10b981; border-radius: 6px; background: transparent; color: #10b981; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.custom-bait-apply:hover { background: #10b981; color: #fff; }

.start-btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px; border: none; border-radius: 10px; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(14, 165, 233, 0.3); }
.start-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4); }

/* QTE */
.qte-area { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 20px 12px; }
.float-container { position: relative; width: 100%; height: 80px; overflow: hidden; }
.water-waves { position: absolute; bottom: 0; left: 0; width: 100%; height: 40px; }
.wave { fill: #dbeafe; }
.wave1 { animation: wave 3s ease-in-out infinite; }
.wave2 { animation: wave 2.5s ease-in-out infinite reverse; opacity: 0.6; }
@keyframes wave { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-20px); } }
.float { position: absolute; left: 50%; bottom: 20px; transform: translateX(-50%); transition: all 0.3s ease; }
.float svg { color: #3b82f6; filter: drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3)); }
.float.hooked svg { color: #ef4444; filter: drop-shadow(0 2px 8px rgba(239, 68, 68, 0.5)); animation: bounce 0.3s ease infinite; }
.float.warning svg { animation: shake 0.2s ease infinite; }
@keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
@keyframes shake { 0%, 100% { transform: translateX(-50%) rotate(0deg); } 25% { transform: translateX(-50%) rotate(-5deg); } 75% { transform: translateX(-50%) rotate(5deg); } }
.fishing-line { position: absolute; top: 0; left: 50%; width: 2px; height: 25px; background: linear-gradient(to bottom, #64748b, #3b82f6); transform: translateX(-50%); }
.qte-status { text-align: center; }
.status-text { font-size: 14px; font-weight: 600; color: var(--text-muted, #64748b); margin-bottom: 8px; transition: all 0.3s; }
.status-text.alert { color: #ef4444; animation: pulse 0.5s ease infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
.attempt-dots { display: flex; justify-content: center; gap: 8px; }
.dot { width: 10px; height: 10px; border-radius: 50%; background: #e5e7eb; transition: all 0.3s; }
.dot.success { background: #10b981; }
.dot.fail { background: #ef4444; }
.pull-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px 48px; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.pull-btn.ready { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #fff; box-shadow: 0 4px 16px rgba(239, 68, 68, 0.4); animation: pulse-btn 0.8s ease infinite; }
@keyframes pulse-btn { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
.pull-btn.ready:hover { transform: scale(1.08); }
.pull-btn.disabled { background: #e5e7eb; color: var(--text-muted, #9ca3af); cursor: not-allowed; }
.cancel-btn { display: flex; align-items: center; gap: 4px; padding: 8px 16px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; background: var(--content-bg, #fff); font-size: 12px; color: var(--text-muted, #9ca3af); cursor: pointer; transition: all 0.2s; }
.cancel-btn:hover { border-color: #ef4444; color: #ef4444; }

/* 钓鱼装备编辑弹窗 */
.fishing-equip-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.fishing-equip-modal { background: var(--card-bg, #fff); border: 1px solid var(--card-border, #e5e7eb); border-radius: 12px; padding: 16px; min-width: 240px; max-width: 320px; width: 85%; display: flex; flex-direction: column; gap: 12px; }
.fishing-equip-header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 700; color: var(--text-primary, #1f2937); }
.fishing-equip-close { width: 24px; height: 24px; border: none; background: transparent; color: var(--text-muted, #9ca3af); cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.fishing-equip-close:hover { background: var(--close-hover-bg, rgba(0,0,0,0.05)); }
.fishing-equip-input { padding: 10px 12px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; font-size: 13px; color: var(--text-primary, #1e293b); background: var(--content-bg, #fff); }
.fishing-equip-input:focus { outline: none; border-color: var(--art-color, #0ea5e9); }
.fishing-equip-actions { display: flex; gap: 8px; }
.fishing-equip-clear { flex: 1; padding: 8px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 6px; background: transparent; color: var(--text-muted, #6b7280); font-size: 12px; cursor: pointer; transition: all 0.15s; }
.fishing-equip-clear:hover { border-color: #ef4444; color: #ef4444; }
.fishing-equip-confirm { flex: 1; padding: 8px; border: none; border-radius: 6px; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.fishing-equip-confirm:hover { transform: translateY(-1px); }
</style>
