<template>
  <ArtPageLayout artKey="种植采药">
    <template #icon>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V10M7 10c0-4 5-8 5-8s5 4 5 8c0 2.8-2.2 5-5 5s-5-2.2-5-5z" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </template>
    <ArtStandardForm
      artKey="种植采药"
      action-title="种植采药"
      item-label="种植名称"
      item-placeholder="输入种植名称..."
      :picker-categories="['种子', '药材']"
      :options1="{ label: '操作类型', items: ['播种', '培育', '施肥', '浇水', '除虫', '移栽', '采摘', '嫁接', '采药'] }"
      :options2="{ label: '种植方式', items: ['普通种植', '灵液催生', '阵法培育', '嫁接移植', '自然生长'] }"
      extra-placeholder="采药不消耗储物戒物品，但需在合适地点..."
      preview-verb="种植"
      preview-title="【种植开始】"
      send-toast="种植内容已发送"
    >
      <template #header-icon>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22V10M7 10c0-4 5-8 5-8s5 4 5 8c0 2.8-2.2 5-5 5s-5-2.2-5-5z"/></svg>
      </template>
    </ArtStandardForm>
  </ArtPageLayout>
</template>

<script setup lang="ts">
import ArtPageLayout from './ArtPageLayout.vue';
import ArtStandardForm from './ArtStandardForm.vue';
</script>
