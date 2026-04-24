<template>
  <ArtPageLayout artKey="医术">
    <template #icon>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    </template>
    <ArtStandardForm
      artKey="医术"
      action-title="医术施治"
      item-label="诊治名称"
      item-placeholder="输入诊治名称..."
      :picker-categories="['药材', '丹药']"
      :options1="{ label: '施治方式', items: ['望闻问切', '针灸推拿', '药浴疗法', '灵力疗伤', '配药', '解毒'] }"
      :options2="{ label: '治疗对象', items: ['自身', '同伴', 'NPC', '灵兽'] }"
      extra-placeholder="可补充：患者症状、伤势描述等..."
      preview-verb="诊治"
      preview-title="【诊治开始】"
      send-toast="医术内容已发送"
    >
      <template #header-icon>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </template>
    </ArtStandardForm>
  </ArtPageLayout>
</template>

<script setup lang="ts">
import ArtPageLayout from './ArtPageLayout.vue';
import ArtStandardForm from './ArtStandardForm.vue';
</script>
