<template>
  <div class="camera-page">
    <!-- 取景器 -->
    <div class="viewfinder">
      <!-- 顶部控制 -->
      <div class="cam-top">
        <button class="cam-btn" @click="store.goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <button class="cam-btn" @click="toggleFlash">
          <svg v-if="flash === 'off'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
          <svg v-else-if="flash === 'on'" width="20" height="20" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        </button>
        <button class="cam-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
        </button>
      </div>

      <!-- 取景框格线 -->
      <div class="grid-overlay">
        <div class="grid-line h1"></div>
        <div class="grid-line h2"></div>
        <div class="grid-line v1"></div>
        <div class="grid-line v2"></div>
      </div>

      <!-- 对焦框 -->
      <div class="focus-frame" v-if="showFocus" :style="{ left: focusX + 'px', top: focusY + 'px' }"></div>
    </div>

    <!-- 底部控制区 -->
    <div class="cam-bottom">
      <!-- 模式选择 -->
      <div class="mode-strip">
        <button v-for="m in modes" :key="m" class="mode-item" :class="{ active: activeMode === m }" @click="activeMode = m">
          {{ m }}
        </button>
      </div>

      <!-- 快门区域 -->
      <div class="shutter-area">
        <!-- 最近照片 -->
        <div class="recent-photo">
          <div class="photo-thumb"></div>
        </div>

        <!-- 快门按钮 -->
        <button class="shutter-btn" @click="takePhoto">
          <div class="shutter-inner"></div>
        </button>

        <!-- 翻转摄像头 -->
        <button class="flip-btn" @click="flipCamera">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8">
            <path d="M16 3h5v5M8 21H3v-5"/>
            <path d="M21 3l-7 7M3 21l7-7"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
const store = usePhoneStore();

const modes = ['延时摄影', '慢动作', '视频', '照片', '人像', '全景'];
const activeMode = ref('照片');
const flash = ref<'off' | 'on' | 'auto'>('auto');
const showFocus = ref(false);
const focusX = ref(0);
const focusY = ref(0);
const isFrontCamera = ref(false);

function toggleFlash() {
  const cycle: Record<string, 'off' | 'on' | 'auto'> = { off: 'on', on: 'auto', auto: 'off' };
  flash.value = cycle[flash.value];
}

function takePhoto() {
  store.reportAction({
    appId: 'camera', appName: '相机', action: '拍照',
    summary: `用户使用相机${activeMode.value}模式拍了一张照片`,
    data: { mode: activeMode.value, flash: flash.value },
  });
  toastr.success('📸 已拍照', '相机');
}

function flipCamera() {
  isFrontCamera.value = !isFrontCamera.value;
}
</script>

<style scoped>
.camera-page {
  height: 100%; display: flex; flex-direction: column;
  background: #000; overflow: hidden;
}

/* ─── 取景器 ─── */
.viewfinder {
  flex: 1; position: relative;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex; align-items: center; justify-content: center;
}

.cam-top {
  position: absolute; top: 0; left: 0; right: 0;
  display: flex; justify-content: space-between;
  padding: 10px 16px; z-index: 2;
}

.cam-btn {
  width: 36px; height: 36px; border: none; border-radius: 50%;
  background: rgba(0,0,0,0.3); backdrop-filter: blur(4px);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}

/* 网格线 */
.grid-overlay {
  position: absolute; inset: 0;
  pointer-events: none;
}

.grid-line {
  position: absolute; background: rgba(255,255,255,0.15);
}
.grid-line.h1 { top: 33.33%; left: 0; right: 0; height: 0.5px; }
.grid-line.h2 { top: 66.66%; left: 0; right: 0; height: 0.5px; }
.grid-line.v1 { left: 33.33%; top: 0; bottom: 0; width: 0.5px; }
.grid-line.v2 { left: 66.66%; top: 0; bottom: 0; width: 0.5px; }

/* 对焦框 */
.focus-frame {
  position: absolute; width: 60px; height: 60px;
  border: 1.5px solid #ffd700;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* ─── 底部 ─── */
.cam-bottom {
  background: #000; padding-bottom: 8px; flex-shrink: 0;
}

.mode-strip {
  display: flex; gap: 4px; justify-content: center;
  padding: 10px 8px 6px;
  overflow-x: auto; scrollbar-width: none;
}
.mode-strip::-webkit-scrollbar { display: none; }

.mode-item {
  border: none; background: transparent;
  color: rgba(255,255,255,0.5); font-size: 12px;
  cursor: pointer; padding: 4px 8px; flex-shrink: 0;
  font-weight: 400;
}
.mode-item.active { color: #ffd700; font-weight: 600; }

.shutter-area {
  display: flex; align-items: center; justify-content: center;
  gap: 36px; padding: 10px 0;
}

.recent-photo {
  width: 40px; height: 40px; border-radius: 8px;
  border: 2px solid rgba(255,255,255,0.3);
  overflow: hidden;
}
.photo-thumb {
  width: 100%; height: 100%;
  background: linear-gradient(135deg, #333, #555);
}

.shutter-btn {
  width: 68px; height: 68px; border-radius: 50%;
  border: 4px solid rgba(255,255,255,0.8);
  background: transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.shutter-btn:active { transform: scale(0.92); }

.shutter-inner {
  width: 54px; height: 54px; border-radius: 50%;
  background: white;
}

.flip-btn {
  width: 40px; height: 40px; border: none; border-radius: 50%;
  background: rgba(255,255,255,0.12);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
</style>
