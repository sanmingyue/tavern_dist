<template>
  <ArtPageLayout artKey="驭兽">
    <template #icon>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 13c-3.5 0-6.5 2.5-6.5 6 0 2 1 3.5 3 4.5h7c2-1 3-2.5 3-4.5 0-3.5-3-6-6.5-6z"/></svg>
    </template>
    <ArtStandardForm
      artKey="驭兽"
      action-title="驭兽训练"
      item-label="训练名称"
      item-placeholder="输入训练名称..."
      :picker-categories="['饲料']"
      :options1="{ label: '训练方式', items: ['喂养', '训练', '切磋', '契约', '驯服', '进化'] }"
      :options2="{ label: '训练强度', items: ['温和', '普通', '严格', '极限'] }"
      extra-placeholder="可补充：训练目标、灵兽状态等..."
      preview-verb="训练"
      preview-title="【训练开始】"
      send-toast="驭兽内容已发送"
    >
      <template #header-icon>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 13c-3.5 0-6.5 2.5-6.5 6 0 2 1 3.5 3 4.5h7c2-1 3-2.5 3-4.5 0-3.5-3-6-6.5-6z"/></svg>
      </template>
    </ArtStandardForm>
  </ArtPageLayout>
</template>

<script setup lang="ts">
import ArtPageLayout from './ArtPageLayout.vue';
import ArtStandardForm from './ArtStandardForm.vue';
</script>
