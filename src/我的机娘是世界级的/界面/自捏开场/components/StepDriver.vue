<template>
  <div class="step-page">
    <div class="step-header">
      <div class="step-icon">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#6366f1" stroke-width="1.8">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-7 8-7s8 3 8 7" stroke-linecap="round" />
        </svg>
      </div>
      <h2 class="step-title">车手信息</h2>
      <p class="step-desc">你的基础信息，简单就好</p>
    </div>

    <!-- 车队选择 -->
    <div class="form-group">
      <label class="form-label">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 21h18M5 21V7l8-4v18M13 21V3l6 4v14" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        车队归属
      </label>
      <div class="team-select">
        <button
          class="team-btn"
          :class="{ active: store.driverTeamType === '独立' }"
          @click="store.driverTeamType = '独立'"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="12" cy="8" r="3" />
            <path d="M8 21v-2a3 3 0 013-3h2a3 3 0 013 3v2" stroke-linecap="round" />
          </svg>
          <span class="team-btn-title">独立车手</span>
          <span class="team-btn-desc">独自闯荡，自由自在</span>
        </button>
        <button
          class="team-btn"
          :class="{ active: store.driverTeamType === '加入' }"
          @click="store.driverTeamType = '加入'"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="9" cy="7" r="3" />
            <circle cx="17" cy="7" r="3" />
            <path d="M5 21v-2a3 3 0 013-3h2a3 3 0 013 3v2M13 21v-2a3 3 0 013-3h2a3 3 0 013 3v2" stroke-linecap="round" />
          </svg>
          <span class="team-btn-title">加入车队</span>
          <span class="team-btn-desc">背靠组织，资源共享</span>
        </button>
      </div>
    </div>

    <!-- 车队名称（加入时显示） -->
    <transition name="fade">
      <div v-if="store.driverTeamType === '加入'" class="form-group">
        <label class="form-label">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <path d="M9 12h6M12 9v6" stroke-linecap="round" />
          </svg>
          车队名称
          <span class="required">*</span>
        </label>
        <input
          v-model="store.driverTeam"
          class="form-input"
          type="text"
          placeholder="输入你所属的车队名称"
          maxlength="20"
        />
      </div>
    </transition>

    <!-- 初始信用点 -->
    <div class="form-group">
      <label class="form-label">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f59e0b" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4M12 16h.01" stroke-linecap="round" />
        </svg>
        初始资金（信用点）
      </label>
      <input
        v-model.number="store.initialCredits"
        class="form-input"
        type="number"
        min="0"
        max="99999"
        step="100"
        placeholder="初始信用点数"
      />
      <span class="form-hint">启动资金，可用于购买改装芯片和日常开销</span>
    </div>

    <!-- 赛事等级 -->
    <div class="form-group">
      <label class="form-label">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#6366f1" stroke-width="2">
          <polygon points="12,2 15,9 22,9 17,14 19,22 12,18 5,22 7,14 2,9 9,9" />
        </svg>
        起始赛事等级
      </label>
      <div class="tier-select">
        <button
          v-for="tier in tierOptions"
          :key="tier.value"
          class="tier-btn"
          :class="{ active: store.initialTier === tier.value }"
          @click="store.initialTier = tier.value"
        >
          <span class="tier-btn-name">{{ tier.value }}</span>
          <span class="tier-btn-desc">{{ tier.label }}</span>
        </button>
      </div>
      <span class="form-hint">通常从 T5 起步，通过赛季积分晋级到更高级别</span>
    </div>

    <!-- 底部导航 -->
    <div class="nav-bar">
      <button class="nav-btn secondary" @click="store.prevStep()">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
        </svg>
        返回
      </button>
      <button class="nav-btn primary" :disabled="!store.isStep1Valid" @click="store.nextStep()">
        {{ store.creationMode === 'preset' ? '下一步：选择机娘' : '下一步：创建机娘' }}
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCreationStore } from '../store';
const store = useCreationStore();

const tierOptions = [
  { value: 'T5' as const, label: '新秀赛' },
  { value: 'T4' as const, label: '地区赛' },
  { value: 'T3' as const, label: '城市赛' },
  { value: 'T2' as const, label: '全国赛' },
  { value: 'T1' as const, label: '洲际赛' },
  { value: 'T0' as const, label: '世界赛' },
];
</script>

<style scoped>
.step-page {
  padding-bottom: 16px;
}

.step-header {
  text-align: center;
  margin-bottom: 24px;
}

.step-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  background: #eef2ff;
  border-radius: 14px;
  margin-bottom: 8px;
}

.step-title {
  font-size: 20px;
  font-weight: 700;
  color: #1e1b4b;
  margin: 0 0 4px;
}

.step-desc {
  font-size: 13px;
  color: #94a3b8;
  margin: 0;
}

/* 车队选择 */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.required {
  color: #ef4444;
}

.team-select {
  display: flex;
  gap: 10px;
}

.team-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  transition: all 0.25s ease;
}

.team-btn.active {
  border-color: #6366f1;
  background: #f5f3ff;
}

.team-btn:hover {
  border-color: #a5b4fc;
}

.team-btn-title {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.team-btn-desc {
  font-size: 11px;
  color: #94a3b8;
}

.team-btn.active .team-btn-title {
  color: #6366f1;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.2s;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* 提示文字 */
.form-hint {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
  line-height: 1.5;
}

/* 赛事等级选择 */
.tier-select {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tier-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 10px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 64px;
}

.tier-btn.active {
  border-color: #6366f1;
  background: #f5f3ff;
}

.tier-btn:hover:not(.active) {
  border-color: #a5b4fc;
}

.tier-btn-name {
  font-size: 15px;
  font-weight: 700;
  color: #1e1b4b;
}

.tier-btn.active .tier-btn-name {
  color: #6366f1;
}

.tier-btn-desc {
  font-size: 9px;
  color: #94a3b8;
}

/* 底部导航 */
.nav-bar {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.nav-btn.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
}

.nav-btn.primary:hover:not(:disabled) {
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transform: translateY(-1px);
}

.nav-btn.primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.nav-btn.secondary {
  background: #f1f5f9;
  color: #64748b;
}

.nav-btn.secondary:hover {
  background: #e2e8f0;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 手机适配 */
@media (max-width: 480px) {
  .team-select {
    flex-direction: column;
  }

  .team-btn {
    padding: 12px 10px;
  }

  .tier-select {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }

  .tier-btn {
    min-width: unset;
    padding: 6px 4px;
  }

  .tier-btn-name {
    font-size: 13px;
  }

  .nav-btn {
    padding: 8px 14px;
    font-size: 13px;
  }
}
</style>
