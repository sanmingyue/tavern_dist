<template>
  <ArtPageLayout artKey="傀儡术">
    <template #icon>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="8.5" cy="16" r="1.5"/><circle cx="15.5" cy="16" r="1.5"/><path d="M12 11V8"/><path d="M8 8l4-5 4 5"/></svg>
    </template>
    <ArtStandardForm
      artKey="傀儡术"
      action-title="傀儡制造"
      item-label="制造名称"
      item-placeholder="输入制造名称..."
      :picker-categories="['傀儡件', '矿石']"
      :options1="{ label: '操作类型', items: ['制造', '修复', '升级', '刻纹', '注灵', '拆解'] }"
      :options2="{ label: '傀儡类型', items: ['战斗型', '防御型', '侦查型', '劳作型', '特殊型'] }"
      extra-placeholder="可补充：傀儡设计、功能需求等..."
      preview-verb="制造"
      preview-title="【制造开始】"
      send-toast="傀儡内容已发送"
    >
      <template #header-icon>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="8.5" cy="16" r="1.5"/><circle cx="15.5" cy="16" r="1.5"/><path d="M12 11V8"/><path d="M8 8l4-5 4 5"/></svg>
      </template>
    </ArtStandardForm>
  </ArtPageLayout>
</template>

<script setup lang="ts">
import ArtPageLayout from './ArtPageLayout.vue';
import ArtStandardForm from './ArtStandardForm.vue';
</script>
