<template>
  <div class="tab-items">
    <!-- 灵石 -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" stroke-linejoin="round"/></svg>
        灵石
      </div>
      <div class="spirit-stones">
        <div class="stone-item"><span class="stone-label">下品</span><span class="stone-value">{{ data.下品灵石 }}</span></div>
        <div class="stone-item"><span class="stone-label">中品</span><span class="stone-value">{{ data.中品灵石 }}</span></div>
        <div class="stone-item"><span class="stone-label">上品</span><span class="stone-value">{{ data.上品灵石 }}</span></div>
        <div class="stone-item"><span class="stone-label">极品</span><span class="stone-value">{{ data.极品灵石 }}</span></div>
      </div>
      <div class="total-stones">折合下品: <strong>{{ store.灵石总量 }}</strong></div>
    </div>

    <!-- 已装备 -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 20V10a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10M8 8V6a4 4 0 0 1 8 0v2" stroke-linecap="round" stroke-linejoin="round"/><rect x="2" y="10" width="20" height="12" rx="2"/></svg>
        已装备
      </div>
      <div class="equip-list">
        <div v-for="slot in EQUIP_SLOTS" :key="slot.key" class="equip-row">
          <div class="equip-slot-label">{{ slot.label }}</div>
          <div class="equip-slot-value" :class="{ empty: !getEquipValue(slot.key) }">
            {{ getEquipValue(slot.key) || '空' }}
          </div>
          <div class="equip-slot-actions">
            <button v-if="getEquipValue(slot.key)" class="equip-action-btn unequip" @click="handleUnequip(slot.key as any)" title="卸下">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <button class="equip-action-btn change" @click="openEquipPicker(slot.key as any)" title="更换">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 储物戒（按分类分组） -->
    <div class="section">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2" stroke-linecap="round"/></svg>
        储物戒
        <span class="count-badge">{{ allStorageItems.length }}件</span>
      </div>

      <!-- 分类筛选标签 -->
      <div class="category-filters" v-if="existingCategories.length > 0">
        <button :class="['cat-btn', { active: activeCategory === '' }]" @click="activeCategory = ''">全部</button>
        <button v-for="cat in existingCategories" :key="cat"
          :class="['cat-btn', { active: activeCategory === cat }]"
          :style="activeCategory === cat ? { background: getCatColor(cat), borderColor: getCatColor(cat) } : {}"
          @click="activeCategory = cat">
          <span v-html="getCatIcon(cat)"></span> {{ cat }}
        </button>
      </div>

      <!-- 搜索框 -->
      <div class="search-box" v-if="allStorageItems.length > 0">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input type="text" v-model="storageSearch" placeholder="搜索物品..." />
        <button v-if="storageSearch" class="search-clear" @click="storageSearch = ''">✕</button>
      </div>

      <!-- 分类分组显示 -->
      <div class="storage-groups" v-if="displayItems.length > 0">
        <div v-for="group in groupedItems" :key="group.category" class="storage-group">
          <div class="group-header" :style="{ color: getCatColor(group.category) }">
            <span v-html="getCatIcon(group.category)"></span> {{ group.category }}
            <span class="group-count">{{ group.items.length }}</span>
          </div>
          <div class="group-items">
            <button class="item-tag" v-for="item in group.items" :key="item.name" @click="openItemAction(item)">
              {{ item.name }}
              <span class="item-count" v-if="item.count > 1">×{{ item.count }}{{ item.unit }}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="empty-state" v-else-if="storageSearch">未找到匹配的物品</div>
      <div class="empty-state" v-else>储物戒为空</div>
    </div>

    <!-- 凡俗货币 -->
    <div class="section" v-if="data.凡俗货币">
      <div class="section-title">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M14.31 8l-4.62 8M9.69 8h4.62M9.69 16h4.62" stroke-linecap="round" stroke-linejoin="round"/></svg>
        凡俗货币
      </div>
      <div class="money-text">{{ data.凡俗货币 }}</div>
    </div>

    <!-- 物品操作面板 -->
    <div class="item-action-overlay" v-if="actionItem" @click="actionItem = null">
      <div class="item-action-panel" @click.stop>
        <div class="item-action-header">
          <span class="item-action-name">{{ actionItem.name }}</span>
          <span class="item-action-count" v-if="actionItem.count > 1">×{{ actionItem.count }}{{ actionItem.unit }}</span>
          <button class="item-action-close" @click="actionItem = null">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="item-action-category">
          <span v-html="getCatIcon(actionItem.category)"></span>
          <span :style="{ color: getCatColor(actionItem.category) }">{{ actionItem.category }}</span>
        </div>

        <!-- 使用模式：输入使用方式 -->
        <div v-if="useMode" class="use-form">
          <div class="use-label">如何使用「{{ actionItem.name }}」？</div>
          <textarea v-model="useDescription" placeholder="描述你想如何使用这个物品..." rows="3" class="use-textarea" />
          <div class="use-actions">
            <button class="use-cancel" @click="useMode = false">取消</button>
            <button class="use-confirm" :disabled="!useDescription.trim()" @click="handleUseItem">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              发送至酒馆
            </button>
          </div>
        </div>

        <!-- 默认：操作按钮 -->
        <div v-else class="item-action-buttons">
          <button class="action-use" @click="useMode = true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            使用
          </button>
          <button class="action-discard" @click="handleDiscardItem">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            丢弃
          </button>
        </div>
      </div>
    </div>

    <!-- 装备选择弹窗 -->
    <div class="equip-picker-overlay" v-if="equipPickerSlot" @click="equipPickerSlot = null">
      <div class="equip-picker" @click.stop>
        <div class="equip-picker-header">
          <span>选择{{ equipPickerSlot }}装备</span>
          <button class="equip-picker-close" @click="equipPickerSlot = null">✕</button>
        </div>
        <div class="equip-picker-list" v-if="availableEquips.length > 0">
          <button v-for="item in availableEquips" :key="item" class="equip-option" @click="handleEquip(equipPickerSlot!, item)">
            {{ item }}
          </button>
        </div>
        <div class="equip-picker-empty" v-else>
          背包中无可装备的{{ equipPickerSlot }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useStatusStore, CATEGORY_COLORS, CATEGORY_ICONS, type StorageItem, type StorageCategory } from '../store';

const store = useStatusStore();
const data = computed(() => store.data);

const EQUIP_SLOTS = [
  { key: '武器', label: '武器' },
  { key: '防具', label: '防具' },
  { key: '饰品', label: '饰品' },
];

function getEquipValue(key: string): string {
  return (data.value as Record<string, unknown>)[`_装备_${key}`] as string || '';
}

const storageSearch = ref('');
const activeCategory = ref('');

const allStorageItems = computed(() => store.getStorageItems());
const existingCategories = computed(() => store.getStorageCategoryList());

const displayItems = computed(() => {
  let items = allStorageItems.value;
  if (activeCategory.value) items = items.filter(i => i.category === activeCategory.value);
  if (storageSearch.value) {
    const kw = storageSearch.value.toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(kw));
  }
  return items;
});

interface ItemGroup { category: string; items: StorageItem[]; }
const groupedItems = computed<ItemGroup[]>(() => {
  const groups: Record<string, StorageItem[]> = {};
  for (const item of displayItems.value) {
    if (!groups[item.category]) groups[item.category] = [];
    groups[item.category].push(item);
  }
  return Object.entries(groups).map(([category, items]) => ({ category, items }));
});

function getCatColor(cat: string) { return CATEGORY_COLORS[cat] || '#94a3b8'; }
function getCatIcon(cat: string) { return CATEGORY_ICONS[cat] || '📦'; }

// ─── 物品操作 ───
const actionItem = ref<StorageItem | null>(null);
const useMode = ref(false);
const useDescription = ref('');

function openItemAction(item: StorageItem) {
  actionItem.value = item;
  useMode.value = false;
  useDescription.value = '';
}

/** 丢弃物品：前端直接从对应分类中删除 */
async function handleDiscardItem() {
  if (!actionItem.value) return;
  const item = actionItem.value;
  await store.removeFromCategory(item.category as StorageCategory, item.name, item.count);
  toastr.info(`已丢弃「${item.name}」×${item.count}`);
  actionItem.value = null;
}

/** 使用物品：组装内容发送给AI，由AI判断结果和是否消耗 */
function handleUseItem() {
  if (!actionItem.value || !useDescription.value.trim()) return;
  const item = actionItem.value;
  const desc = useDescription.value.trim();

  const content = `【使用物品】\n\n从储物戒中取出「${item.name}」×1\n使用方式：${desc}\n\n请描写使用过程和结果，并根据情况决定是否消耗该物品（从储物戒中移除）。`;

  triggerSlash('/send ' + content + ' | /trigger');

  toastr.success(`已发送使用「${item.name}」的请求`);
  actionItem.value = null;
  useMode.value = false;
  useDescription.value = '';
}

// ─── 装备选择 ───
const equipPickerSlot = ref<'武器' | '防具' | '饰品' | null>(null);

const availableEquips = computed(() => {
  if (!equipPickerSlot.value) return [];
  const field = ('未装备_' + equipPickerSlot.value) as keyof typeof data.value;
  const raw = (data.value[field] as string) || '';
  if (!raw) return [];
  return raw.split('、').map(s => s.trim()).filter(Boolean);
});

function openEquipPicker(slot: '武器' | '防具' | '饰品') {
  equipPickerSlot.value = slot;
}

async function handleEquip(slot: '武器' | '防具' | '饰品', itemName: string) {
  await store.equipItem(slot, itemName);
  equipPickerSlot.value = null;
}

async function handleUnequip(slot: '武器' | '防具' | '饰品') {
  await store.unequipItem(slot);
}
</script>

<style scoped>
.tab-items { padding: 12px; display: flex; flex-direction: column; gap: 12px; }
.section { background: var(--card-bg, #fafafa); border-radius: 10px; padding: 12px; }
.section-title { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: var(--accent-gold, #b8963e); margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px; }

/* 灵石 */
.spirit-stones { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.stone-item { display: flex; flex-direction: column; align-items: center; padding: 8px; background: var(--content-bg, #fff); border-radius: 8px; border: 1px solid var(--card-border, #e5e7eb); }
.stone-label { font-size: 10px; color: var(--text-muted, #6b7280); margin-bottom: 4px; }
.stone-value { font-size: 14px; font-weight: 700; color: #3b82f6; }
.total-stones { margin-top: 8px; text-align: center; font-size: 11px; color: var(--text-muted, #6b7280); }
.total-stones strong { color: #3b82f6; }

/* 装备 - 改版为行式布局 */
.equip-list { display: flex; flex-direction: column; gap: 6px; }
.equip-row { display: flex; align-items: center; gap: 8px; padding: 8px 10px; background: var(--content-bg, #fff); border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; transition: all 0.15s; }
.equip-slot-label { font-size: 10px; font-weight: 700; color: var(--text-muted, #9ca3af); text-transform: uppercase; min-width: 36px; flex-shrink: 0; }
.equip-slot-value { flex: 1; font-size: 13px; font-weight: 600; color: var(--text-primary, #1e293b); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.equip-slot-value.empty { color: var(--text-muted, #cbd5e1); font-style: italic; font-weight: 400; }
.equip-slot-actions { display: flex; gap: 4px; flex-shrink: 0; }
.equip-action-btn { width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--card-border, #e5e7eb); background: var(--content-bg, #fff); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; color: var(--text-muted, #9ca3af); }
.equip-action-btn.unequip:hover { border-color: #fecaca; color: #ef4444; background: #fef2f2; }
.equip-action-btn.change:hover { border-color: var(--accent-gold, #b8963e); color: var(--accent-gold, #b8963e); background: rgba(200, 169, 110, 0.08); }

/* 储物戒 */
.category-filters { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px; }
.cat-btn { padding: 4px 8px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 12px; background: var(--content-bg, #fff); font-size: 10px; color: var(--text-secondary, #475569); cursor: pointer; transition: all 0.15s; }
.cat-btn:hover { border-color: var(--accent-gold, #b8963e); }
.cat-btn.active { color: #fff; }

.search-box { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--content-bg, #fff); border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; margin-bottom: 10px; }
.search-box svg { color: var(--text-muted, #9ca3af); flex-shrink: 0; }
.search-box input { flex: 1; border: none; outline: none; font-size: 12px; color: var(--text-primary, #374151); background: transparent; }
.search-clear { background: none; border: none; color: var(--text-muted, #9ca3af); cursor: pointer; font-size: 12px; }

.storage-groups { display: flex; flex-direction: column; gap: 10px; }
.group-header { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; margin-bottom: 4px; }
.group-count { font-size: 9px; background: rgba(0,0,0,0.06); padding: 1px 6px; border-radius: 8px; margin-left: auto; }
.group-items { display: flex; flex-wrap: wrap; gap: 4px; }

/* 物品标签改为可点击按钮 */
.item-tag { display: inline-flex; align-items: center; gap: 3px; padding: 4px 10px; background: var(--content-bg, #fff); border: 1px solid var(--card-border, #e5e7eb); border-radius: 14px; font-size: 11px; color: var(--text-primary, #374151); cursor: pointer; transition: all 0.15s; }
.item-tag:hover { border-color: var(--accent-gold, #b8963e); background: rgba(200, 169, 110, 0.06); transform: translateY(-1px); }
.item-tag:active { transform: scale(0.97); }
.item-count { color: var(--accent-gold, #b8963e); font-weight: 600; font-size: 10px; }

.money-text { font-size: 13px; color: #92400e; font-weight: 600; }
.empty-state { text-align: center; padding: 16px; color: var(--text-muted, #9ca3af); font-size: 12px; font-style: italic; }
.count-badge { margin-left: auto; padding: 2px 8px; background: rgba(200, 169, 110, 0.15); color: var(--accent-gold, #b8963e); border-radius: 10px; font-size: 10px; font-weight: 600; }

/* ─── 物品操作面板 ─── */
.item-action-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.item-action-panel { background: var(--card-bg, #fff); border: 1px solid var(--card-border, #e5e7eb); border-radius: 14px; padding: 16px; min-width: 260px; max-width: 360px; width: 90%; display: flex; flex-direction: column; gap: 12px; }

.item-action-header { display: flex; align-items: center; gap: 8px; }
.item-action-name { font-size: 16px; font-weight: 800; color: var(--text-primary, #1f2937); flex: 1; }
.item-action-count { font-size: 13px; color: var(--accent-gold, #b8963e); font-weight: 600; }
.item-action-close { width: 28px; height: 28px; border: none; background: transparent; color: var(--text-muted, #9ca3af); cursor: pointer; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.item-action-close:hover { background: var(--close-hover-bg, rgba(0,0,0,0.05)); }

.item-action-category { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600; }

.item-action-buttons { display: flex; gap: 10px; }
.action-use, .action-discard { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 14px 12px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; }

.action-use { border: 1.5px solid #3b82f6; background: rgba(59, 130, 246, 0.06); color: #2563eb; }
.action-use:hover { background: #3b82f6; color: #fff; transform: translateY(-1px); }

.action-discard { border: 1.5px solid #ef4444; background: rgba(239, 68, 68, 0.06); color: #dc2626; }
.action-discard:hover { background: #ef4444; color: #fff; transform: translateY(-1px); }

/* 使用表单 */
.use-form { display: flex; flex-direction: column; gap: 8px; }
.use-label { font-size: 12px; font-weight: 600; color: var(--text-secondary, #475569); }
.use-textarea { padding: 10px 12px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; font-size: 13px; color: var(--text-primary, #1e293b); background: var(--content-bg, #fff); resize: vertical; min-height: 60px; }
.use-textarea:focus { outline: none; border-color: #3b82f6; }
.use-actions { display: flex; gap: 8px; }
.use-cancel { flex: 1; padding: 10px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; background: transparent; color: var(--text-muted, #6b7280); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
.use-cancel:hover { border-color: var(--text-muted, #6b7280); }
.use-confirm { flex: 1; padding: 10px; border: none; border-radius: 8px; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.15s; }
.use-confirm:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
.use-confirm:disabled { background: #e5e7eb; color: var(--text-muted, #9ca3af); cursor: not-allowed; }

/* ─── 装备选择弹窗 ─── */
.equip-picker-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 20px; }
.equip-picker { background: var(--card-bg, #fff); border: 1px solid var(--card-border, #e5e7eb); border-radius: 12px; padding: 16px; min-width: 220px; max-width: 320px; width: 85%; }
.equip-picker-header { display: flex; justify-content: space-between; align-items: center; font-size: 14px; font-weight: 700; color: var(--text-primary, #1f2937); margin-bottom: 12px; }
.equip-picker-close { width: 24px; height: 24px; border: none; background: transparent; color: var(--text-muted, #9ca3af); cursor: pointer; font-size: 16px; border-radius: 4px; }
.equip-picker-close:hover { background: var(--close-hover-bg, rgba(0,0,0,0.05)); }
.equip-picker-list { display: flex; flex-direction: column; gap: 6px; }
.equip-option { padding: 10px 14px; border: 1px solid var(--card-border, #e5e7eb); border-radius: 8px; background: var(--content-bg, #fff); color: var(--text-primary, #1f2937); font-size: 13px; font-weight: 600; cursor: pointer; text-align: left; transition: all 0.15s; }
.equip-option:hover { border-color: var(--accent-gold, #b8963e); background: var(--tab-hover-bg, rgba(200, 169, 110, 0.1)); }
.equip-picker-empty { text-align: center; padding: 20px; color: var(--text-muted, #9ca3af); font-size: 13px; }

/* PC端字号放大 */
@media (min-width: 501px) {
  .section-title { font-size: 14px; }
}

/* 手机端适配 */
@media (max-width: 500px) {
  .tab-items { padding: 10px; gap: 10px; }
  .section { padding: 10px; }
  .spirit-stones { gap: 6px; }
  .stone-item { padding: 6px; }
  .stone-value { font-size: 13px; }
  .equip-row { padding: 6px 8px; }
  .category-filters { gap: 3px; }
  .cat-btn { padding: 3px 6px; font-size: 9px; }
  .item-action-overlay { padding: 12px; }
  .item-action-panel { padding: 14px; min-width: auto; }
  .equip-picker-overlay { padding: 12px; }
  .equip-picker { padding: 14px; min-width: auto; }
}
</style>
