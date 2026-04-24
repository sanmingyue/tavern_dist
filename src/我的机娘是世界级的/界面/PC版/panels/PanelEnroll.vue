<template>
  <div>
    <div class="panel-title">
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="#6366f1" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
      赛事
    </div>

    <!-- 赛前准备状态：显示开始比赛按钮 -->
    <div v-if="data.世界._当前状态 === '赛前准备'" class="text-center">
      <div class="mb-4 text-sm" style="color: #94a3b8;">赛前准备中</div>
      <div class="mb-2 text-xs" style="color: #64748b;">
        {{ data.当前比赛._赛事级别 }} {{ data.当前比赛._赛事类型 }} · {{ data.当前比赛._赛事名称 }}
      </div>
      <div class="mb-6 text-xs" style="color: #64748b;">
        搭档：{{ data.当前比赛._搭档机娘 }}
      </div>
      <button class="btn-race-start" @click="onStartRace">
        <svg viewBox="0 0 24 24" class="mr-2 h-5 w-5" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        开始比赛
      </button>
    </div>

    <!-- 比赛中状态 -->
    <div v-else-if="data.世界._当前状态 === '比赛中'" class="empty-hint">
      比赛进行中，请切换到比赛面板查看
    </div>

    <!-- 日常状态：报名界面 -->
    <template v-else>
      <!-- 赛事等级选择 -->
      <div class="mb-4">
        <div class="section-label">赛事等级</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="t in allTiers"
            :key="t"
            class="tier-btn"
            :class="{ active: selectedTier === t, locked: !isTierOpen(t) }"
            :disabled="!isTierOpen(t)"
            @click="selectedTier = t"
          >
            <span>{{ t }}</span>
            <svg v-if="!isTierOpen(t)" viewBox="0 0 24 24" class="ml-1 h-3 w-3" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </button>
        </div>
      </div>

      <!-- 赛事类型选择 -->
      <div class="mb-4">
        <div class="section-label">赛事类型</div>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="rt in availableTypes"
            :key="rt"
            class="type-btn"
            :class="{ active: selectedType === rt }"
            @click="selectedType = rt"
          >{{ rt }}</button>
        </div>
      </div>

      <!-- 搭档机娘选择 -->
      <div class="mb-4">
        <div class="section-label">搭档机娘</div>
        <select v-model="selectedMech" class="select-mech">
          <option v-for="name in mechNames" :key="name" :value="name">{{ name }}</option>
        </select>
      </div>

      <!-- 点数限制信息 -->
      <div v-if="selectedTier && tierLimit" class="mb-4 rounded-lg p-3" style="background: #0c1120; border: 1px solid rgba(99,130,255,0.1);">
        <div class="flex justify-between text-xs">
          <span style="color: #64748b;">总点数限制</span>
          <span class="font-bold" :style="{ color: totalUsed > tierLimit.totalPoints ? '#ef4444' : '#10b981' }">
            {{ totalUsed }} / {{ tierLimit.totalPoints }}
          </span>
        </div>
        <div class="mt-1 flex justify-between text-xs">
          <span style="color: #64748b;">单项上限</span>
          <span class="font-bold" style="color: #818cf8;">{{ tierLimit.maxPerStat }}</span>
        </div>
        <div class="mt-1 flex justify-between text-xs">
          <span style="color: #64748b;">报名费</span>
          <span class="font-bold" style="color: #fbbf24;">{{ enrollFee.toLocaleString() }}</span>
        </div>
      </div>

      <!-- 五维滑动条 -->
      <div v-if="selectedMech && mechData" class="mb-4 space-y-3">
        <div class="section-label">参赛五维配置</div>
        <div v-for="dim in dims" :key="dim.key" class="flex items-center gap-3">
          <div class="w-10 text-center">
            <div class="text-[10px]" style="color: #64748b;">{{ dim.label }}</div>
            <div class="text-sm font-bold" :style="{ color: dim.color }">{{ raceStats[dim.key] }}</div>
          </div>
          <input
            type="range"
            :min="0"
            :max="getSliderMax(dim.key)"
            :value="raceStats[dim.key]"
            class="slider flex-1"
            @input="onSliderChange(dim.key, ($event.target as HTMLInputElement).valueAsNumber)"
          />
          <div class="w-8 text-right text-[10px]" style="color: #475569;">
            /{{ getSliderMax(dim.key) }}
          </div>
        </div>
      </div>

      <!-- 报名按钮 -->
      <div class="mt-6 flex gap-3">
        <button
          class="btn-enroll flex-1"
          :disabled="!canEnroll"
          @click="showConfirmDialog = true"
        >
          <svg viewBox="0 0 24 24" class="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          确认报名
        </button>
      </div>
      <div v-if="enrollError" class="mt-2 text-center text-[11px]" style="color: #ef4444;">{{ enrollError }}</div>
    </template>

    <!-- 报名确认弹窗 -->
    <div v-if="showConfirmDialog" class="dialog-overlay" @click.self="showConfirmDialog = false">
      <div class="dialog-box">
        <div class="mb-3 text-base font-bold">确认报名</div>
        <div class="space-y-1 text-xs" style="color: #94a3b8;">
          <div>赛事：{{ selectedTier }} {{ selectedType }}</div>
          <div>搭档：{{ selectedMech }}</div>
          <div>报名费：<span class="font-bold" style="color: #fbbf24;">{{ enrollFee.toLocaleString() }}</span> 信用点</div>
          <div>五维：ACC={{ raceStats.加速度 }} SPD={{ raceStats.极速 }} HDL={{ raceStats.操控 }} DFT={{ raceStats.漂移 }} END={{ raceStats.耐久 }}</div>
        </div>
        <div class="mt-4 flex gap-2">
          <button class="btn-secondary flex-1 text-xs" @click="showConfirmDialog = false">取消</button>
          <button class="btn-enroll flex-1 text-xs" @click="doEnroll">确认</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../../schema';
import { dimensions } from './shared';
import { TIER_LIMITS, ENROLL_FEE, AVAILABLE_RACE_TYPES, isTierUnlocked, getStatMax, validateConfig, performEnroll, startRace } from './enrollLogic';
import { sendEnrollNormal, sendRaceStart } from '../aiInteraction';

const props = defineProps<{ data: Schema }>();

const allTiers = ['T5', 'T4', 'T3', 'T2', 'T1', 'T0'] as const;
const dims = dimensions;

const selectedTier = ref<string>('T5');
const selectedType = ref<string>('场地赛');
const selectedMech = ref<string>('');
const showConfirmDialog = ref(false);

const raceStats = reactive({ 加速度: 0, 极速: 0, 操控: 0, 漂移: 0, 耐久: 0 });

const mechNames = computed(() => Object.keys(props.data.机娘库));
const mechData = computed(() => selectedMech.value ? props.data.机娘库[selectedMech.value] : null);

// 自动选择第一个机娘
watch(mechNames, names => { if (names.length && !selectedMech.value) selectedMech.value = names[0]; }, { immediate: true });

// 切换机娘时重置滑动条
watch(mechData, mech => {
  if (!mech) return;
  const limit = TIER_LIMITS[selectedTier.value as keyof typeof TIER_LIMITS];
  for (const dim of ['加速度', '极速', '操控', '漂移', '耐久'] as const) {
    raceStats[dim] = Math.min(Math.floor(mech._五维[dim]), limit?.maxPerStat ?? 50);
  }
}, { immediate: true });

// 切换等级时重新限制
watch(selectedTier, () => {
  if (mechData.value) {
    const limit = TIER_LIMITS[selectedTier.value as keyof typeof TIER_LIMITS];
    for (const dim of ['加速度', '极速', '操控', '漂移', '耐久'] as const) {
      raceStats[dim] = Math.min(raceStats[dim], Math.floor(mechData.value._五维[dim]), limit?.maxPerStat ?? 50);
    }
  }
});

function isTierOpen(t: string): boolean {
  return isTierUnlocked(t as 'T5' | 'T4' | 'T3' | 'T2' | 'T1' | 'T0', props.data);
}

const availableTypes = computed(() => AVAILABLE_RACE_TYPES[selectedTier.value as keyof typeof AVAILABLE_RACE_TYPES] ?? []);
watch(availableTypes, types => { if (types.length && !types.includes(selectedType.value as never)) selectedType.value = types[0]; });

const tierLimit = computed(() => TIER_LIMITS[selectedTier.value as keyof typeof TIER_LIMITS]);
const enrollFee = computed(() => ENROLL_FEE[selectedTier.value as keyof typeof ENROLL_FEE] ?? 0);
const totalUsed = computed(() => raceStats.加速度 + raceStats.极速 + raceStats.操控 + raceStats.漂移 + raceStats.耐久);

function getSliderMax(dim: '加速度' | '极速' | '操控' | '漂移' | '耐久'): number {
  if (!mechData.value || !tierLimit.value) return 0;
  return getStatMax(mechData.value._五维[dim], tierLimit.value.maxPerStat);
}

function onSliderChange(dim: '加速度' | '极速' | '操控' | '漂移' | '耐久', val: number) {
  raceStats[dim] = val;
}

const enrollError = computed(() => {
  if (!selectedMech.value) return '请选择搭档机娘';
  if (!mechData.value) return '未找到机娘数据';
  if (!tierLimit.value) return '';
  if (totalUsed.value > tierLimit.value.totalPoints) return `五维总和超出限制（${totalUsed.value}/${tierLimit.value.totalPoints}）`;
  if (props.data.主角.$信用点数 < enrollFee.value) return `信用点不足（需要${enrollFee.value}）`;
  return '';
});

const canEnroll = computed(() => !enrollError.value && selectedMech.value && selectedType.value);

async function doEnroll() {
  showConfirmDialog.value = false;
  if (!mechData.value) return;

  const validation = validateConfig(raceStats, selectedTier.value as 'T5', mechData.value._五维);
  if (!validation.valid) {
    toastr.error(validation.errors.join('; '), '配置错误');
    return;
  }

  const raceName = `${selectedTier.value}${selectedType.value}`;
  const result = performEnroll(
    props.data,
    selectedTier.value as 'T5',
    selectedType.value as '场地赛',
    selectedMech.value,
    { ...raceStats },
    raceName,
  );

  if (!result.success) {
    toastr.error(result.error ?? '报名失败', '报名失败');
    return;
  }

  toastr.success('报名成功，进入赛前准备', '报名成功');

  try {
    await sendEnrollNormal(
      selectedTier.value,
      selectedType.value,
      selectedMech.value,
      { acc: raceStats.加速度, spd: raceStats.极速, hdl: raceStats.操控, dft: raceStats.漂移, end: raceStats.耐久 },
    );
  } catch (e) {
    console.error('[报名] AI请求失败:', e);
  }
}

async function onStartRace() {
  startRace(props.data);
  toastr.success('比赛开始！', '发车');
  try {
    await sendRaceStart();
  } catch (e) {
    console.error('[比赛] AI请求失败:', e);
  }
}
</script>

<style scoped>
.panel-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.section-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.tier-btn { display: inline-flex; align-items: center; padding: 6px 16px; border: 1px solid rgba(99,130,255,0.15); border-radius: 6px; background: #1a2236; color: #94a3b8; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.tier-btn:hover:not(.locked) { border-color: rgba(99,130,255,0.5); color: #e2e8f0; }
.tier-btn.active { background: rgba(99,102,241,0.15); border-color: rgba(99,130,255,0.5); color: #818cf8; }
.tier-btn.locked { opacity: 0.4; cursor: not-allowed; }
.tier-btn.locked svg { stroke: #475569; }
.type-btn { padding: 5px 14px; border: 1px solid rgba(99,130,255,0.15); border-radius: 6px; background: #1a2236; color: #94a3b8; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.type-btn:hover { border-color: rgba(99,130,255,0.5); }
.type-btn.active { background: rgba(99,102,241,0.15); border-color: rgba(99,130,255,0.5); color: #818cf8; }
.select-mech { width: 100%; background: #1a2236; border: 1px solid rgba(99,130,255,0.15); border-radius: 6px; color: #e2e8f0; font-size: 12px; padding: 8px 12px; outline: none; }
.slider { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.08); outline: none; }
.slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #6366f1; cursor: pointer; border: 2px solid #818cf8; }
.btn-enroll { display: inline-flex; align-items: center; justify-content: center; padding: 10px 20px; border: none; border-radius: 8px; font-size: 13px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; transition: all 0.2s; }
.btn-enroll:hover { filter: brightness(1.1); }
.btn-enroll:disabled { opacity: 0.4; cursor: not-allowed; filter: none; }
.btn-race-start { display: inline-flex; align-items: center; justify-content: center; padding: 14px 32px; border: none; border-radius: 10px; font-size: 16px; font-weight: 800; cursor: pointer; background: linear-gradient(135deg, #10b981, #059669); color: #fff; transition: all 0.2s; box-shadow: 0 4px 20px rgba(16,185,129,0.3); }
.btn-race-start:hover { filter: brightness(1.1); transform: scale(1.02); }
.btn-secondary { display: inline-flex; align-items: center; justify-content: center; padding: 6px 14px; border: 1px solid rgba(99,130,255,0.15); border-radius: 6px; font-weight: 600; cursor: pointer; background: #1a2236; color: #94a3b8; }
.empty-hint { color: #64748b; font-size: 13px; text-align: center; padding: 40px 0; }
.dialog-overlay { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; }
.dialog-box { background: #111827; border: 1px solid rgba(99,130,255,0.3); border-radius: 16px; padding: 24px; width: 380px; max-width: 90vw; color: #e2e8f0; }
</style>
