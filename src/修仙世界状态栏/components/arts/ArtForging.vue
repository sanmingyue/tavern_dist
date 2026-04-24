<template>
  <ArtPageLayout artKey="炼器">
    <template #icon>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12l-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="M20.91 11.7a1.65 1.65 0 0 0-.15-2.04l-4.26-4.26a1.65 1.65 0 0 0-2.04-.15" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </template>
    <ArtStandardForm
      artKey="炼器"
      action-title="开始炼器"
      item-label="炼制名称"
      item-placeholder="输入炼制名称..."
      :picker-categories="['矿石', '灵材']"
      :options1="{ label: '器物类型', items: ['武器', '防具', '饰品', '法器', '工具', '其他'] }"
      :options2="{ label: '锻造方式', items: ['千锤百炼', '精锻细造', '一体成型', '拼接组合', '模具铸形'] }"
      extra-placeholder="可补充：中途更换材料、刻入阵法等..."
      preview-verb="炼制"
      preview-title="【炼制开始】"
      send-toast="炼器内容已发送"
    >
      <template #header-icon>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 12l-8.5 8.5a2.12 2.12 0 1 1-3-3L12 9"/><path d="M17.64 15L22 10.64"/><path d="M20.91 11.7a1.65 1.65 0 0 0-.15-2.04l-4.26-4.26a1.65 1.65 0 0 0-2.04-.15"/></svg>
      </template>
    </ArtStandardForm>
  </ArtPageLayout>
</template>

<script setup lang="ts">
import ArtPageLayout from './ArtPageLayout.vue';
import ArtStandardForm from './ArtStandardForm.vue';
</script>
