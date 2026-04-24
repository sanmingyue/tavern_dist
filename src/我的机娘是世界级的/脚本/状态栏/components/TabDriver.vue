<template>
  <div class="tab-driver">
    <!-- 头像区域 -->
    <div class="avatar-section">
      <div class="avatar-frame" @click="triggerUpload">
        <img v-if="store.avatarData" :src="store.avatarData" class="avatar-img" alt="车手头像" />
        <svg v-else viewBox="0 0 80 80" width="80" height="80" class="avatar-placeholder">
          <rect width="80" height="80" rx="12" fill="#f1f5f9" />
          <circle cx="40" cy="30" r="14" fill="none" stroke="#cbd5e1" stroke-width="2" />
          <path d="M16 68c0-12 10-20 24-20s24 8 24 20" fill="none" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" />
          <path d="M28 60l12 8 12-8" fill="none" stroke="#e2e8f0" stroke-width="1" />
        </svg>
        <div class="avatar-overlay">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2">
            <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      </div>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileChange"
      />
      <button v-if="store.avatarData" class="avatar-remove" @click.stop="store.setAvatar(null)">
        <svg viewBox="0 0 20 20" width="12" height="12" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
        </svg>
        移除头像
      </button>
    </div>

    <!-- 车手信息卡 -->
    <div class="driver-card">
      <div class="driver-card-header">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#6366f1" stroke-width="2">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke-linecap="round" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span>车手档案</span>
      </div>

      <div class="driver-row">
        <span class="driver-label">车队</span>
        <span class="driver-value">{{ store.data.主角.车队 }}</span>
      </div>
      <div class="driver-row">
        <span class="driver-label">赛事等级</span>
        <span class="driver-value tier">{{ store.data.主角._赛事等级 }}</span>
      </div>
      <div class="driver-row">
        <span class="driver-label">赛季积分</span>
        <span class="driver-value">{{ store.data.主角.赛季积分 }} PTS</span>
      </div>
      <div class="driver-row">
        <span class="driver-label">信用点</span>
        <span class="driver-value credits">{{ store.data.主角.$信用点数.toLocaleString() }} CR</span>
      </div>
      <div class="driver-row">
        <span class="driver-label">拥有机娘</span>
        <span class="driver-value">{{ store.mechCount }} 台</span>
      </div>
    </div>

    <!-- 当前状态 -->
    <div class="state-card">
      <div class="state-icon">
        <svg v-if="store.gameState === '日常'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" stroke-linecap="round" />
        </svg>
        <svg v-else-if="store.gameState === '赛前准备'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f59e0b" stroke-width="2">
          <path d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947z" />
          <circle cx="10" cy="12" r="3" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#ef4444" stroke-width="2">
          <path d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" />
        </svg>
      </div>
      <div class="state-info">
        <span class="state-label">当前状态</span>
        <span class="state-name" :class="'state-' + store.gameState">{{ store.gameState }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useStatusStore } from '../store';

const store = useStatusStore();
const fileInput = ref<HTMLInputElement | null>(null);

function triggerUpload() {
  fileInput.value?.click();
}

function handleFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;

  // 限制文件大小 2MB
  if (file.size > 2 * 1024 * 1024) {
    toastr.warning('图片大小不能超过 2MB');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result as string;
    // 压缩图片到合理大小
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 200;
      let { width, height } = img;
      if (width > height && width > maxSize) {
        height = height * maxSize / width;
        width = maxSize;
      } else if (height > maxSize) {
        width = width * maxSize / height;
        height = maxSize;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', 0.8);
      store.setAvatar(compressed);
    };
    img.src = result;
  };
  reader.readAsDataURL(file);

  // 清空 input 以便重复选择同一文件
  (e.target as HTMLInputElement).value = '';
}
</script>

<style scoped>
.tab-driver {
  padding: 12px;
  overflow-y: auto;
  height: 100%;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 16px;
}

.avatar-frame {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 2px solid #e2e8f0;
  transition: border-color 0.2s;
}

.avatar-frame:hover {
  border-color: #6366f1;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}

.avatar-frame:hover .avatar-overlay {
  opacity: 1;
}

.avatar-remove {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 3px 8px;
  border: none;
  background: transparent;
  color: #ef4444;
  font-size: 10px;
  cursor: pointer;
  border-radius: 4px;
}

.avatar-remove:hover {
  background: #fef2f2;
}

/* 车手信息卡 */
.driver-card {
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 12px;
  clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px));
}

.driver-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #1e1b4b;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 2px solid #6366f1;
}

.driver-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
}

.driver-label {
  font-size: 12px;
  color: #94a3b8;
}

.driver-value {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  font-family: 'Rajdhani', monospace, system-ui;
}

.driver-value.tier {
  color: #6366f1;
  font-size: 16px;
}

.driver-value.credits {
  color: #f59e0b;
}

/* 当前状态 */
.state-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
}

.state-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e8ecf1;
}

.state-info {
  display: flex;
  flex-direction: column;
}

.state-label {
  font-size: 10px;
  color: #94a3b8;
  font-weight: 500;
}

.state-name {
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 1px;
}

.state-日常 { color: #10b981; }
.state-赛前准备 { color: #f59e0b; }
.state-比赛中 { color: #ef4444; }
</style>
