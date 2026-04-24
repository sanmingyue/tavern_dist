<template>
  <div>
    <div class="panel-title">
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#6366f1" stroke-width="2"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
      改装 · {{ firstMechName || '未选择' }}
    </div>

    <div v-if="!firstMech" class="empty-hint">未找到机娘</div>

    <template v-else>
      <!-- 当前装备 -->
      <div class="mb-4">
        <div class="section-label">已装备 · 外形改件</div>
        <div class="flex flex-wrap gap-2">
          <div v-for="(item, idx) in firstMech._外形改件" :key="'skin-' + idx" class="chip">
            <span class="text-[11px]">{{ item.名称 }}</span>
            <button class="chip-remove" title="拆卸" @click="doUninstallSkin(idx)">
              <svg viewBox="0 0 24 24" class="h-3 w-3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div v-if="!firstMech._外形改件.length" class="chip-empty">无已装备外形改件</div>
        </div>
      </div>

      <div class="mb-6">
        <div class="section-label">已装备 · 技能改件</div>
        <div v-if="firstMech._技能改件" class="chip chip-skill">
          <span class="text-[11px]">{{ firstMech._技能改件.名称 }}</span>
          <span class="text-[10px]" style="color: #64748b;">{{ firstMech._技能改件.效果方向 }}</span>
          <button class="chip-remove" title="拆卸" @click="doUninstallSkill">
            <svg viewBox="0 0 24 24" class="h-3 w-3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div v-else class="chip-empty">技能插槽空置</div>
      </div>

      <!-- 仓库 -->
      <div class="mb-2 flex items-center gap-2">
        <div class="section-label mb-0">仓库</div>
        <select v-model="warehouseFilter" class="select-filter">
          <option value="all">全部</option>
          <option value="skin">外形改件</option>
          <option value="skill">技能改件</option>
        </select>
      </div>

      <div class="space-y-2">
        <!-- 外形改件仓库 -->
        <template v-if="warehouseFilter !== 'skill'">
          <div v-for="(item, idx) in warehouseSkins" :key="'ws-' + idx" class="card flex items-center gap-3">
            <div class="item-icon">
              <svg viewBox="0 0 24 24" class="h-4 w-4"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"/></svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="truncate text-xs font-semibold" style="color: #e2e8f0;">{{ item.名称 }}</div>
              <div class="text-[10px]" style="color: #64748b;">{{ item.类型 }} · {{ item.描述 }}</div>
            </div>
            <button
              v-if="skinInstallCheck.ok"
              class="btn-install text-[10px]"
              @click="doInstallSkin(idx)"
            >安装</button>
            <button v-else class="btn-locked text-[10px]" disabled :title="skinInstallCheck.reason">
              {{ skinInstallCheck.reason }}
            </button>
          </div>
        </template>

        <!-- 技能改件仓库 -->
        <template v-if="warehouseFilter !== 'skin'">
          <div v-for="(item, idx) in warehouseSkills" :key="'wk-' + idx" class="card flex items-center gap-3">
            <div class="item-icon item-icon-skill">
              <svg viewBox="0 0 24 24" class="h-4 w-4"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="truncate text-xs font-semibold" style="color: #e2e8f0;">{{ item.名称 }}</span>
                <span v-if="item.是否黑市" class="badge-red">黑市</span>
              </div>
              <div class="text-[10px]" style="color: #64748b;">{{ item.效果方向 }} · {{ item.描述 }}</div>
            </div>
            <button
              v-if="skillInstallCheck.ok"
              class="btn-install text-[10px]"
              @click="doInstallSkill(idx)"
            >安装</button>
            <button v-else class="btn-locked text-[10px]" disabled :title="skillInstallCheck.reason">
              {{ skillInstallCheck.reason?.substring(0, 8) }}
            </button>
          </div>
        </template>

        <div v-if="warehouseEmpty" class="empty-hint">仓库中没有改件</div>
      </div>
    </template>

    <!-- AI叙事确认弹窗 -->
    <div v-if="showNarrateDialog" class="dialog-overlay" @click.self="showNarrateDialog = false">
      <div class="dialog-box">
        <div class="mb-2 text-sm font-bold">操作完成</div>
        <div class="mb-4 text-xs" style="color: #94a3b8;">{{ narrateMessage }}</div>
        <div class="mb-3 text-xs" style="color: #64748b;">是否让AI描写机娘的反应？</div>
        <div class="flex gap-2">
          <button class="btn-secondary flex-1 text-xs" @click="showNarrateDialog = false">跳过</button>
          <button class="btn-primary flex-1 text-xs" @click="doNarrate">描写反应</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../../schema';
import { canInstallSkin, canInstallSkill, installSkinMod, installSkillMod, uninstallSkinMod, uninstallSkillMod } from './modLogic';
import { narrateModInstall } from '../aiInteraction';

const props = defineProps<{
  firstMechName: string | null;
  firstMech: Schema['机娘库'][string] | null;
}>();

// 需要从 store 获取完整 data
const { useDataStore } = await import('../store');
const dataStore = useDataStore();
const data = computed(() => dataStore.data);

const warehouseFilter = ref<'all' | 'skin' | 'skill'>('all');
const showNarrateDialog = ref(false);
const narrateMessage = ref('');
const pendingNarrate = ref<{ name: string; desc: string; isSkill: boolean; isBlack: boolean } | null>(null);

const warehouseSkins = computed(() => data.value.主角.$改件仓库._外形改件);
const warehouseSkills = computed(() => data.value.主角.$改件仓库._技能改件);
const warehouseEmpty = computed(() => {
  if (warehouseFilter.value === 'skin') return !warehouseSkins.value.length;
  if (warehouseFilter.value === 'skill') return !warehouseSkills.value.length;
  return !warehouseSkins.value.length && !warehouseSkills.value.length;
});

const skinInstallCheck = computed(() => canInstallSkin(data.value.主角._赛事等级));
const skillInstallCheck = computed(() => canInstallSkill(data.value.主角._赛事等级, props.firstMech?._技能改件 !== null));

function doInstallSkin(idx: number) {
  if (!props.firstMechName) return;
  const item = data.value.主角.$改件仓库._外形改件[idx];
  if (installSkinMod(data.value, props.firstMechName, idx)) {
    narrateMessage.value = `已为${props.firstMechName}安装外形改件「${item.名称}」`;
    pendingNarrate.value = { name: item.名称, desc: item.描述, isSkill: false, isBlack: false };
    showNarrateDialog.value = true;
  }
}

function doInstallSkill(idx: number) {
  if (!props.firstMechName) return;
  const item = data.value.主角.$改件仓库._技能改件[idx];
  if (installSkillMod(data.value, props.firstMechName, idx)) {
    narrateMessage.value = `已为${props.firstMechName}安装技能改件「${item.名称}」`;
    pendingNarrate.value = { name: item.名称, desc: item.描述, isSkill: true, isBlack: item.是否黑市 };
    showNarrateDialog.value = true;
  }
}

function doUninstallSkin(idx: number) {
  if (!props.firstMechName) return;
  uninstallSkinMod(data.value, props.firstMechName, idx);
  toastr.info('外形改件已拆卸回仓库');
}

function doUninstallSkill() {
  if (!props.firstMechName) return;
  uninstallSkillMod(data.value, props.firstMechName);
  toastr.info('技能改件已拆卸回仓库');
}

async function doNarrate() {
  if (!props.firstMechName || !pendingNarrate.value) return;
  showNarrateDialog.value = false;
  try {
    await narrateModInstall(
      props.firstMechName,
      pendingNarrate.value.name,
      pendingNarrate.value.desc,
      pendingNarrate.value.isSkill,
      pendingNarrate.value.isBlack,
    );
  } catch (e) {
    console.error('[改装] AI叙事失败:', e);
  }
}
</script>

<style scoped>
.panel-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.section-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.card { background: #1a2236; border: 1px solid rgba(99,130,255,0.15); border-radius: 10px; padding: 12px; transition: all 0.2s; }
.card:hover { border-color: rgba(99,130,255,0.5); }
.chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 6px; background: #1a2236; border: 1px solid rgba(99,130,255,0.2); color: #e2e8f0; }
.chip-skill { border-color: rgba(245,158,11,0.3); }
.chip-empty { display: inline-flex; padding: 4px 10px; border-radius: 6px; border: 1px dashed rgba(99,130,255,0.15); color: #475569; font-size: 11px; }
.chip-remove { display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; border: none; background: transparent; cursor: pointer; color: #64748b; transition: color 0.2s; }
.chip-remove:hover { color: #ef4444; }
.chip-remove svg { stroke: currentColor; fill: none; stroke-width: 2; }
.item-icon { width: 32px; height: 32px; border-radius: 6px; background: #212d47; border: 1px solid rgba(99,130,255,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.item-icon svg { stroke: #818cf8; fill: none; stroke-width: 1.5; }
.item-icon-skill svg { stroke: #f59e0b; }
.badge-red { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 10px; font-weight: 700; background: rgba(239,68,68,0.15); color: #ef4444; }
.btn-install { display: inline-flex; align-items: center; justify-content: center; padding: 4px 12px; border: none; border-radius: 5px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; transition: all 0.2s; }
.btn-install:hover { filter: brightness(1.15); }
.btn-locked { display: inline-flex; align-items: center; padding: 4px 8px; border: 1px solid rgba(99,130,255,0.1); border-radius: 5px; font-weight: 600; background: #111827; color: #475569; cursor: not-allowed; white-space: nowrap; }
.btn-primary { display: inline-flex; align-items: center; justify-content: center; padding: 6px 14px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; }
.btn-secondary { display: inline-flex; align-items: center; justify-content: center; padding: 6px 14px; border: 1px solid rgba(99,130,255,0.15); border-radius: 6px; font-weight: 600; cursor: pointer; background: #1a2236; color: #94a3b8; }
.select-filter { background: #1a2236; border: 1px solid rgba(99,130,255,0.15); border-radius: 4px; color: #94a3b8; font-size: 11px; padding: 2px 6px; outline: none; }
.empty-hint { color: #64748b; font-size: 13px; text-align: center; padding: 30px 0; }
.dialog-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
.dialog-box { background: #111827; border: 1px solid rgba(99,130,255,0.3); border-radius: 16px; padding: 24px; width: 340px; max-width: 90vw; color: #e2e8f0; }
</style>
