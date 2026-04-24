<template>
  <div class="chaoxi-batch-toolbar" v-if="totalCount > 0">
    <div class="chaoxi-batch-left">
      <input
        type="checkbox"
        class="chaoxi-checkbox"
        :checked="allSelected"
        :indeterminate="someSelected && !allSelected"
        @change="$emit('toggle-all')"
        title="全选/取消全选"
      />
      <span class="chaoxi-batch-count" v-if="selectedCount > 0">
        已选 {{ selectedCount }} 项
      </span>
      <span class="chaoxi-batch-total" v-else>
        共 {{ totalCount }} 项
      </span>
    </div>
    <div class="chaoxi-batch-actions" v-if="selectedCount > 0">
      <button class="chaoxi-batch-btn chaoxi-batch-on" @click="$emit('batch-enable')" title="批量开启">
        ✅ 开启
      </button>
      <button class="chaoxi-batch-btn chaoxi-batch-off" @click="$emit('batch-disable')" title="批量关闭">
        ⬜ 关闭
      </button>
      <button
        v-if="showMoveToGroup"
        class="chaoxi-batch-btn chaoxi-batch-group"
        @click="$emit('batch-move-to-group')"
        title="移到分组"
      >
        📁 移到分组
      </button>
      <button
        v-if="showDelete"
        class="chaoxi-batch-btn chaoxi-batch-delete"
        @click="$emit('batch-delete')"
        title="批量删除"
      >
        🗑 删除
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  totalCount: number;
  selectedCount: number;
  allSelected: boolean;
  someSelected: boolean;
  showDelete?: boolean;
  showMoveToGroup?: boolean;
}>();

defineEmits<{
  'toggle-all': [];
  'batch-enable': [];
  'batch-disable': [];
  'batch-delete': [];
  'batch-move-to-group': [];
}>();
</script>

<style scoped>
.chaoxi-batch-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(77, 201, 246, 0.1);
  background: rgba(5, 8, 16, 0.4);
  flex-shrink: 0;
  gap: 8px;
  flex-wrap: wrap;
}

.chaoxi-batch-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chaoxi-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #4dc9f6;
  cursor: pointer;
  flex-shrink: 0;
}

.chaoxi-batch-count {
  font-size: 12px;
  color: #4dc9f6;
  font-weight: 500;
}

.chaoxi-batch-total {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.35);
}

.chaoxi-batch-actions {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.chaoxi-batch-btn {
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.chaoxi-batch-on:hover {
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
  border-color: rgba(52, 211, 153, 0.3);
}

.chaoxi-batch-off:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
}

.chaoxi-batch-group:hover {
  background: rgba(77, 201, 246, 0.12);
  color: #4dc9f6;
  border-color: rgba(77, 201, 246, 0.3);
}

.chaoxi-batch-delete:hover {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
  border-color: rgba(248, 113, 113, 0.3);
}
</style>
