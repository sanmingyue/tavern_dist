<template>
  <div class="luo-chaoxi" :class="{ 'is-expanded': expanded }">
    <!-- 顶部：她的名字，点击可折叠/展开 -->
    <div class="masthead" @click="expanded = !expanded">
      <div class="masthead-line"></div>
      <div class="masthead-content">
        <span class="masthead-name">洛潮汐</span>
        <span class="masthead-sub">Luo Chaoxi</span>
      </div>
      <div class="masthead-line"></div>
      <!-- 展开/收起指示箭头 -->
      <svg
        viewBox="0 0 16 16" width="14" height="14"
        class="expand-icon"
        :class="{ 'is-open': expanded }"
      >
        <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>

    <!-- 展开后的内容 -->
    <Transition name="fold">
      <div v-if="expanded" class="expanded-body">
        <!-- 日期时间天气地点 -->
        <HeaderScene />

        <!-- 主体区域：PC端左右并排，手机端上下 -->
        <div class="main-row">
          <!-- 左：差分表情立绘 -->
          <div class="main-left">
            <ExpressionCard />
          </div>

          <!-- 右：愿望清单 -->
          <div class="main-right">
            <WishList />
          </div>
        </div>

        <!-- 底部潮汐意象 -->
        <div class="footer-tide">
          <div class="footer-text">潮去汐来</div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import HeaderScene from './components/HeaderScene.vue';
import ExpressionCard from './components/ExpressionCard.vue';
import WishList from './components/WishList.vue';

const expanded = ref(false);
</script>

<style lang="scss" scoped>
.luo-chaoxi {
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  font-family: var(--font-main);
  color: var(--text-primary);
  animation: tideIn 0.6s ease;
}

/* ====== 刊头（可点击） ====== */
.masthead {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px 6px;
  cursor: pointer;
  user-select: none;
  position: relative;

  &:hover .masthead-name {
    color: var(--tide-mid);
  }
}

.masthead-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--tide-light), transparent);
}

.masthead-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  flex-shrink: 0;
}

.masthead-name {
  font-family: var(--font-serif);
  font-size: 18px;
  font-weight: 500;
  color: var(--tide-deep);
  letter-spacing: 6px;
  transition: color 0.3s ease;
}

.masthead-sub {
  font-size: 9px;
  color: var(--text-tertiary);
  letter-spacing: 2px;
  font-weight: 300;
  text-transform: uppercase;
}

.expand-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary);
  transition: transform 0.3s ease;
  flex-shrink: 0;

  &.is-open {
    transform: translateY(-50%) rotate(180deg);
  }
}

/* ====== 展开后主体 ====== */
.expanded-body {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ====== 主体区域：立绘 + 愿望清单 ====== */
.main-row {
  display: flex;
  flex-direction: row;
  gap: 12px;
  padding: 0 8px;
  align-items: flex-start;
}

.main-left {
  flex: 1;
  min-width: 0;
}

.main-right {
  flex: 1;
  min-width: 0;
}

/* 手机端（窄屏）：上下排列 */
@media (max-width: 560px) {
  .main-row {
    flex-direction: column;
    gap: 4px;
  }
}

/* ====== 底部潮汐意象 ====== */
.footer-tide {
  display: flex;
  justify-content: center;
  padding: 8px 0 14px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--tide-light), transparent);
  }
}

.footer-text {
  font-family: var(--font-serif);
  font-size: 14px;
  color: var(--text-tertiary);
  letter-spacing: 10px;
  font-weight: 300;
  opacity: 0.5;
}

/* ====== 折叠/展开动画 ====== */
.fold-enter-active,
.fold-leave-active {
  transition: all 0.4s ease;
  overflow: hidden;
}

.fold-enter-from,
.fold-leave-to {
  opacity: 0;
  max-height: 0;
}

.fold-enter-to,
.fold-leave-from {
  opacity: 1;
  max-height: 2000px;
}
</style>
