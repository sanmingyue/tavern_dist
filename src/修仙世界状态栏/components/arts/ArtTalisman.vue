<template>
  <ArtPageLayout artKey="符箓">
    <template #icon>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </template>
    <ArtStandardForm
      artKey="符箓"
      action-title="绘制符箓"
      item-label="绘制名称"
      item-placeholder="输入绘制名称..."
      :picker-categories="['符纸', '灵墨']"
      :options1="{ label: '符箓类型', items: ['攻击', '防御', '辅助', '治疗', '封印', '召唤', '幻术', '符阵'] }"
      :options2="{ label: '绘制方式', items: ['一笔绘成', '三笔定形', '心意绘符', '血绘', '神识烙印'] }"
      extra-placeholder="可补充：中途换墨、有人指导等..."
      preview-verb="绘制"
      preview-title="【绘制开始】"
      send-toast="符箓内容已发送"
    >
      <template #header-icon>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586"/></svg>
      </template>
    </ArtStandardForm>
  </ArtPageLayout>
</template>

<script setup lang="ts">
import ArtPageLayout from './ArtPageLayout.vue';
import ArtStandardForm from './ArtStandardForm.vue';
</script>
