<template>
  <ArtPageLayout artKey="阵法">
    <template #icon>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8.5 4.9v9.2L12 22l-8.5-4.9V6.9L12 2z" stroke-linejoin="round"/></svg>
    </template>
    <ArtStandardForm
      artKey="阵法"
      action-title="布阵"
      item-label="布置名称"
      item-placeholder="输入布置名称..."
      :picker-categories="['灵材', '阵旗']"
      :options1="{ label: '阵法类型', items: ['防御', '困敌', '聚灵', '幻阵', '杀阵', '隐匿', '传送', '复合'] }"
      :options2="{ label: '布阵方式', items: ['基础布阵', '连环布阵', '嵌套布阵', '天地人合一', '以身为阵'] }"
      extra-placeholder="可补充：有人协助、叠加阵法等..."
      preview-verb="布置"
      preview-title="【布置开始】"
      send-toast="阵法内容已发送"
    >
      <template #header-icon>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8.5 4.9v9.2L12 22l-8.5-4.9V6.9L12 2z" stroke-linejoin="round"/></svg>
      </template>
    </ArtStandardForm>
  </ArtPageLayout>
</template>

<script setup lang="ts">
import ArtPageLayout from './ArtPageLayout.vue';
import ArtStandardForm from './ArtStandardForm.vue';
</script>
