<template>
  <div class="expression-card">
    <!-- 差分立绘 -->
    <div class="portrait-frame">
      <div class="portrait-inner">
        <img
          :src="currentImageUrl"
          :alt="currentExpression"
          class="portrait-img"
          @error="onImgError"
          loading="lazy"
        />
      </div>
      <!-- 底部渐变遮罩 -->
      <div class="portrait-gradient"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '../store';
import { EXPRESSION_MAP } from '../expressions';

const store = useDataStore();

const currentExpression = computed(() => store.data.洛潮汐.表情 || '微笑');

const currentImageUrl = computed(() => {
  return EXPRESSION_MAP[currentExpression.value] || EXPRESSION_MAP['微笑'];
});

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement;
  img.style.opacity = '0.3';
}
</script>

<style lang="scss" scoped>
.expression-card {
  width: 100%;
  display: flex;
  justify-content: center;
}

.portrait-frame {
  position: relative;
  width: 100%;
  max-width: 320px;
  aspect-ratio: 3 / 4;
  border-radius: 12px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--tide-foam) 0%, var(--tide-sky) 100%);
  box-shadow:
    0 2px 12px rgba(44, 74, 110, 0.08),
    inset 0 0 0 1px rgba(168, 212, 230, 0.3);
}

.portrait-inner {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.portrait-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  transition: opacity 0.5s ease;
}

.portrait-gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: linear-gradient(transparent, rgba(245, 250, 252, 0.8));
  pointer-events: none;
}

</style>
