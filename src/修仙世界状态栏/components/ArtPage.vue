<template>
  <div class="art-page-router">
    <ArtAlchemy v-if="artKey === '炼丹'" />
    <ArtForging v-else-if="artKey === '炼器'" />
    <ArtFormation v-else-if="artKey === '阵法'" />
    <ArtTalisman v-else-if="artKey === '符箓'" />
    <ArtBeast v-else-if="artKey === '驭兽'" />
    <ArtMedical v-else-if="artKey === '医术'" />
    <ArtPuppet v-else-if="artKey === '傀儡术'" />
    <ArtHerb v-else-if="artKey === '种植采药'" />
    <ArtSword v-else-if="artKey === '剑心'" />
    <ArtFishing v-else-if="artKey === '钓鱼'" />
    <div v-else class="not-found">
      <p>未找到该百艺页面</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useStatusStore, type ArtKey } from '../store';

// 导入所有百艺页面组件
import ArtAlchemy from './arts/ArtAlchemy.vue';
import ArtForging from './arts/ArtForging.vue';
import ArtFormation from './arts/ArtFormation.vue';
import ArtTalisman from './arts/ArtTalisman.vue';
import ArtBeast from './arts/ArtBeast.vue';
import ArtMedical from './arts/ArtMedical.vue';
import ArtPuppet from './arts/ArtPuppet.vue';
import ArtHerb from './arts/ArtHerb.vue';
import ArtSword from './arts/ArtSword.vue';
import ArtFishing from './arts/ArtFishing.vue';

const store = useStatusStore();
const artKey = computed<ArtKey | null>(() => store.artsPage);
</script>

<style scoped>
.art-page-router {
  height: 100%;
  overflow: hidden;
}

.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  font-size: 14px;
}
</style>
