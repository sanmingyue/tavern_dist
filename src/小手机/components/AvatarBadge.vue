<template>
  <div
    class="avatar-badge"
    :class="[sizeClass, { 'has-image': !!avatarUrl }]"
    :style="avatarStyle"
    role="button"
    tabindex="0"
    title="点击更换头像"
    @click.stop="openAvatarPicker"
    @keydown.enter.prevent.stop="openAvatarPicker"
  >
    <img v-if="avatarUrl" class="avatar-image" :src="avatarUrl" :alt="props.name" />
    <span v-else class="avatar-text">{{ initial }}</span>
    <span v-if="online" class="online-dot"></span>
    <span v-if="badge && badge > 0" class="badge-count" :class="{ large: badge > 99 }">
      {{ badge > 99 ? '99+' : badge }}
    </span>
    <input ref="avatarInputRef" class="avatar-input" type="file" accept="image/*" @change="onAvatarSelected" @click.stop />
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../stores/phone-store';

interface Props {
  /** 名字（取首字符） */
  name: string;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否在线 */
  online?: boolean;
  /** 角标数字 */
  badge?: number;
  /** 自定义颜色 */
  color?: string;
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  online: false,
  badge: 0,
  color: '',
});

const store = usePhoneStore();
const avatarInputRef = ref<HTMLInputElement | null>(null);

const AVATAR_COLORS = [
  '#579bf0', '#50c9c3', '#f5a623', '#7ed321', '#e74c3c',
  '#9b59b6', '#1db954', '#e91e63', '#ff5722', '#00bcd4',
  '#8bc34a', '#ff9800', '#673ab7', '#795548', '#607d8b',
];

const initial = computed(() => {
  return props.name ? props.name.charAt(0) : '?';
});

const bgColor = computed(() => {
  if (props.color) return props.color;
  const code = props.name.charCodeAt(0) || 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
});

const sizeClass = computed(() => `size-${props.size}`);

const avatarUrl = computed(() => store.getAvatar(props.name));

const avatarStyle = computed(() => ({
  backgroundColor: bgColor.value,
}));

function openAvatarPicker() {
  avatarInputRef.value?.click();
}

async function onAvatarSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  await store.setAvatar(props.name, file);
  input.value = '';
}
</script>

<style scoped>
.avatar-badge {
  position: relative;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
  user-select: none;
  cursor: pointer;
}

.avatar-badge:hover {
  filter: brightness(1.04);
}

/* 尺寸 */
.size-sm {
  width: 32px;
  height: 32px;
  font-size: 13px;
}

.size-md {
  width: 44px;
  height: 44px;
  font-size: 17px;
}

.size-lg {
  width: 56px;
  height: 56px;
  font-size: 22px;
}

.avatar-text {
  line-height: 1;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 50%;
}

.avatar-input {
  display: none;
}

/* 在线指示 */
.online-dot {
  position: absolute;
  bottom: 1px;
  right: 1px;
  width: 10px;
  height: 10px;
  background: #27ae60;
  border: 2px solid var(--bg-primary, #0b0e14);
  border-radius: 50%;
}

.size-sm .online-dot {
  width: 8px;
  height: 8px;
  bottom: 0;
  right: 0;
}

.size-lg .online-dot {
  width: 12px;
  height: 12px;
  bottom: 2px;
  right: 2px;
}

/* 角标 */
.badge-count {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: var(--danger, #e74c3c);
  color: white;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--bg-primary, #0b0e14);
}

.badge-count.large {
  min-width: 22px;
  font-size: 9px;
}
</style>
