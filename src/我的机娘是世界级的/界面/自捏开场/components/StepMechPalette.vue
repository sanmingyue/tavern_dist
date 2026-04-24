<template>
  <div class="step-page">
    <div class="step-header">
      <div class="step-icon">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#6366f1" stroke-width="1.8">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-linecap="round" />
        </svg>
      </div>
      <h2 class="step-title">机娘人格</h2>
      <p class="step-desc">用调色盘定义她的灵魂——机娘不只是机械，她有温度</p>
    </div>

    <!-- 底色 -->
    <div class="palette-section">
      <div class="section-header">
        <div class="color-dot" style="background: #1e1b4b"></div>
        <div>
          <h3 class="section-title">底色 <span class="required">*</span></h3>
          <p class="section-hint">她最本质的性格——无论如何伪装都改不掉的核心</p>
        </div>
      </div>
      <input v-model="store.palette.底色.name" class="form-input" type="text" placeholder="例：自卑、骄傲、温顺、执念……" maxlength="10" />
      <textarea v-model="store.palette.底色.desc" class="form-textarea" placeholder="这个底色如何影响她的行为？为什么是这样？" rows="2" maxlength="120"></textarea>
    </div>

    <!-- 主色调 -->
    <div class="palette-section">
      <div class="section-header">
        <div class="color-dot" style="background: #6366f1"></div>
        <div>
          <h3 class="section-title">主色调 <span class="required">*</span> <span class="count-badge">{{ store.palette.主色调.length }}/4</span></h3>
          <p class="section-hint">日常相处中最常展现的2~4个性格面向</p>
        </div>
      </div>
      <div v-for="(color, index) in store.palette.主色调" :key="index" class="main-color-item">
        <div class="main-color-header">
          <span class="color-index">{{ index + 1 }}</span>
          <input v-model="color.name" class="form-input flex-1" type="text" :placeholder="`主色调 ${index + 1}：如毒舌、黏人、倔强……`" maxlength="10" />
          <button v-if="store.palette.主色调.length > 2" class="remove-btn" @click="store.removeMainColor(index)">
            <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
            </svg>
          </button>
        </div>
        <textarea v-model="color.desc" class="form-textarea" placeholder="这一面在什么情况下最明显？" rows="2" maxlength="100"></textarea>
      </div>
      <button v-if="store.palette.主色调.length < 4" class="add-btn" @click="store.addMainColor()">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
        </svg>
        添加主色调
      </button>
    </div>

    <!-- 点缀 -->
    <div class="palette-section">
      <div class="section-header">
        <div class="color-dot" style="background: #f59e0b"></div>
        <div>
          <h3 class="section-title">点缀 <span class="required">*</span></h3>
          <p class="section-hint">平时不轻易展露、但在关键时刻闪耀的那面——反差、秘密</p>
        </div>
      </div>
      <input v-model="store.palette.点缀.name" class="form-input" type="text" placeholder="例：脆弱、温柔、暴走、撒娇……" maxlength="10" />
      <textarea v-model="store.palette.点缀.desc" class="form-textarea" placeholder="什么情况下她会展现这一面？触发条件是什么？" rows="2" maxlength="120"></textarea>
    </div>

    <!-- 衍生色 -->
    <div class="palette-section">
      <div class="section-header">
        <div class="color-dot" style="background: #94a3b8"></div>
        <div>
          <h3 class="section-title">衍生色 <span class="count-badge">{{ store.palette.衍生色.length }}/5</span></h3>
          <p class="section-hint">以上性格混合后衍生的行为模式、口癖、小习惯</p>
        </div>
      </div>
      <div v-for="(_, index) in store.palette.衍生色" :key="index" class="derived-item">
        <input v-model="store.palette.衍生色[index]" class="form-input flex-1" type="text" :placeholder="`衍生特质 ${index + 1}：如嘴上说不要身体很诚实`" maxlength="40" />
        <button v-if="store.palette.衍生色.length > 1" class="remove-btn" @click="store.removeDerived(index)">
          <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
          </svg>
        </button>
      </div>
      <button v-if="store.palette.衍生色.length < 5" class="add-btn" @click="store.addDerived()">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
        </svg>
        添加衍生色
      </button>
    </div>

    <!-- 底部导航 -->
    <div class="nav-bar">
      <button class="nav-btn secondary" @click="store.prevStep()">
        <svg viewBox="0 0 20 20" width="16" height="16" fill="currentColor">
          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
        </svg>
        返回
      </button>
      <button class="nav-btn primary" :disabled="!store.isStep3Valid" @click="store.nextStep()">
        下一步：五维数据
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

/* 调色盘区块 */
.palette-section {
  background: #fafbfe;
  border: 1px solid #eef0f6;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 14px;
}

.section-header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 12px;
}

.color-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-top: 2px;
  flex-shrink: 0;
}

.section-title {
  font-size: 15px;
  font-weight: 700;
  color: #1e1b4b;
  margin: 0;
}

.section-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0;
}

.required {
  color: #ef4444;
}

.count-badge {
  font-size: 11px;
  color: #8b5cf6;
  background: #ede9fe;
  padding: 1px 6px;
  border-radius: 6px;
  font-weight: 500;
}

/* 主色调项 */
.main-color-item {
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed #e8ecf1;
}

.main-color-item:last-of-type {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.main-color-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.color-index {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: #6366f1;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.flex-1 {
  flex: 1;
}

/* 衍生色项 */
.derived-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.derived-item:last-of-type {
  margin-bottom: 0;
}

/* 按钮 */
.remove-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #fecaca;
  background: #fff;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}

.remove-btn:hover {
  background: #fef2f2;
}

.add-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1.5px dashed #c7d2fe;
  border-radius: 8px;
  background: transparent;
  color: #6366f1;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.add-btn:hover {
  background: #eef2ff;
  border-color: #6366f1;
}

/* 表单元素 */
.form-input {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.2s;
  outline: none;
  box-sizing: border-box;
  margin-bottom: 6px;
}

.form-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-textarea {
  width: 100%;
  padding: 9px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  color: #1e293b;
  background: #fff;
  transition: border-color 0.2s;
  outline: none;
  resize: vertical;
  font-family: inherit;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
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

/* 手机端适配 */
@media (max-width: 480px) {
  .step-icon {
    width: 44px;
    height: 44px;
  }

  .step-title {
    font-size: 17px;
  }

  .palette-section {
    padding: 12px;
  }

  .form-input,
  .form-textarea {
    font-size: 14px;
  }

  .main-color-header {
    flex-wrap: wrap;
  }

  .nav-btn {
    padding: 8px 14px;
    font-size: 13px;
  }

  .add-btn {
    font-size: 12px;
    padding: 6px 12px;
  }
}
</style>
