<template>
  <div class="music-player">
    <!-- 顶部 -->
    <div class="music-header">
      <span class="music-header-title">音乐</span>
      <button class="music-refresh-btn" @click="refreshPlaylist" :class="{ spinning: store.isLoading }">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 12a8 8 0 11-2.34-5.66M20 4v6h-6" />
        </svg>
      </button>
    </div>

    <!-- 当前播放中 -->
    <div v-if="store.currentTrack" class="now-playing" @click="showPlaylist = !showPlaylist">
      <div class="now-playing-cover" :class="{ spinning: store.isPlaying }">
        <div class="cover-inner" :style="coverStyle">
          <svg v-if="!store.currentTrack.cover" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="cover-fallback-icon">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
      </div>
      <div class="now-playing-info">
        <div class="now-playing-title">{{ store.currentTrack.title }}</div>
        <div class="now-playing-artist">{{ store.currentTrack.artist }}</div>
      </div>
      <div class="now-playing-controls">
        <button class="ctrl-btn" @click.stop="store.prevTrack()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6L18 18V6z"/></svg>
        </button>
        <button class="ctrl-btn ctrl-play" @click.stop="store.togglePlay()">
          <svg v-if="store.isPlaying" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
        </button>
        <button class="ctrl-btn" @click.stop="store.nextTrack()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>
        </button>
      </div>
    </div>

    <!-- 进度条 -->
    <div v-if="store.currentTrack" class="progress-section">
      <div class="progress-bar" @pointerdown="onProgressDown">
        <div class="progress-fill" :style="{ width: store.progress + '%' }" />
      </div>
      <div class="progress-time">
        <span>{{ store.currentTimeFormatted }}</span>
        <span>{{ store.durationFormatted }}</span>
      </div>
    </div>

    <!-- 播放模式 & 音量 -->
    <div v-if="store.currentTrack" class="controls-row">
      <button class="mode-btn" @click="store.cyclePlayMode()">
        <!-- 列表循环 -->
        <svg v-if="store.playMode === 'list'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 01-4 4H3" />
        </svg>
        <!-- 单曲循环 -->
        <svg v-else-if="store.playMode === 'single'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 014-4h14" /><polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 01-4 4H3" />
          <text x="11" y="16" font-size="8" fill="currentColor" stroke="none" text-anchor="middle">1</text>
        </svg>
        <!-- 随机播放 -->
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
          <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
          <line x1="4" y1="4" x2="9" y2="9" />
        </svg>
        <span class="mode-label">{{ playModeLabel }}</span>
      </button>
      <div class="volume-control">
        <button class="vol-btn" @click="store.toggleMute()">
          <svg v-if="store.muted || store.volume === 0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M14 5v14l-5-4H5V9h4zM18 9l-6 6m0-6l6 6"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M14 5v14l-5-4H5V9h4zm2.5 3.5a4.5 4.5 0 010 7"/>
          </svg>
        </button>
        <input
          type="range"
          min="0"
          max="100"
          :value="Math.round((store.muted ? 0 : store.volume) * 100)"
          class="volume-slider"
          @input="onVolumeChange"
        />
      </div>
    </div>

    <!-- 歌单列表 -->
    <div class="playlist-section" :class="{ expanded: showPlaylist }">
      <div class="playlist-header" @click="showPlaylist = !showPlaylist">
        <span>歌单 ({{ store.tracks.length }})</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="chevron" :class="{ rotated: showPlaylist }">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <Transition name="list-expand">
        <div v-if="showPlaylist" class="playlist-items">
          <div
            v-for="(track, idx) in store.tracks"
            :key="track.id"
            class="playlist-item"
            :class="{ active: idx === store.currentIndex }"
            @click="store.playTrackAt(idx)"
          >
            <span class="track-idx">{{ String(idx + 1).padStart(2, '0') }}</span>
            <div class="track-info">
              <div class="track-title">{{ track.title }}</div>
              <div class="track-artist">{{ track.artist }}</div>
            </div>
            <div v-if="idx === store.currentIndex && store.isPlaying" class="track-playing-indicator">
              <div class="indicator-bar" v-for="i in 3" :key="i" :style="{ animationDelay: (i * 0.15) + 's' }" />
            </div>
          </div>
          <div v-if="store.tracks.length === 0" class="playlist-empty">
            {{ store.isLoading ? '加载中...' : '歌单为空' }}
          </div>
        </div>
      </Transition>
    </div>

    <!-- 空状态 -->
    <div v-if="!store.currentTrack && !store.isLoading" class="music-empty">
      <svg class="empty-icon-svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
      <div class="empty-text">暂无音乐</div>
      <button class="empty-load-btn" @click="refreshPlaylist">加载歌单</button>
    </div>

    <div v-if="store.isLoading && !store.currentTrack" class="music-loading">
      <div class="loading-spinner" />
      <div class="loading-text">加载歌单中...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMusicStore } from '../music-store';

const store = useMusicStore();
const showPlaylist = ref(true);

const playModeLabel = computed(() => {
  if (store.playMode === 'list') return '列表循环';
  if (store.playMode === 'single') return '单曲循环';
  return '随机播放';
});

const coverStyle = computed(() => {
  if (!store.currentTrack?.cover) return {};
  return { backgroundImage: `url("${store.currentTrack.cover}")`, backgroundSize: 'cover', backgroundPosition: 'center' };
});

function onProgressDown(e: PointerEvent) {
  const el = e.currentTarget as HTMLElement;
  const rect = el.getBoundingClientRect();
  const updateSeek = (clientX: number) => {
    const ratio = _.clamp((clientX - rect.left) / rect.width, 0, 1);
    store.seek(ratio * 100);
  };

  updateSeek(e.clientX);

  const onMove = (ev: PointerEvent) => updateSeek(ev.clientX);
  const onUp = () => {
    window.parent.removeEventListener('pointermove', onMove);
    window.parent.removeEventListener('pointerup', onUp);
  };
  window.parent.addEventListener('pointermove', onMove);
  window.parent.addEventListener('pointerup', onUp);
}

function onVolumeChange(e: Event) {
  const val = parseInt((e.target as HTMLInputElement).value, 10) || 0;
  store.setVolume(val / 100);
}

async function refreshPlaylist() {
  await store.fetchManifest();
}

onMounted(() => {
  store.loadPrefs();
  if (!store.tracks.length) store.fetchManifest();
});
</script>

<style scoped>
.music-player {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--text-hint) transparent;
}

.music-player::-webkit-scrollbar { width: 4px; }
.music-player::-webkit-scrollbar-thumb { background: var(--text-hint); border-radius: 2px; }

.music-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-secondary);
}

.music-header-title { font-size: 16px; font-weight: 600; color: var(--text-primary); }

.music-refresh-btn {
  width: 28px; height: 28px; border-radius: 6px; border: none;
  background: var(--bg-hover); color: var(--text-tertiary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}

.music-refresh-btn:hover { background: var(--bg-active); color: var(--text-secondary); }
.music-refresh-btn.spinning svg { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* 当前播放 */
.now-playing {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; cursor: pointer;
  background: var(--bg-tertiary);
  border-bottom: 1px solid var(--border-secondary);
}

.now-playing-cover {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--bg-active); flex-shrink: 0;
  overflow: hidden;
}

.now-playing-cover.spinning .cover-inner { animation: spin 12s linear infinite; }

.cover-inner {
  width: 100%; height: 100%; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-active);
}

.cover-fallback-icon {
  color: var(--text-muted);
}

.now-playing-info { flex: 1; min-width: 0; }

.now-playing-title {
  font-size: 14px; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.now-playing-artist {
  font-size: 12px; color: var(--text-tertiary); margin-top: 2px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.now-playing-controls { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }

.ctrl-btn {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: transparent; color: var(--text-secondary);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}

.ctrl-btn:hover { color: var(--text-primary); background: var(--bg-hover); }

.ctrl-play {
  width: 36px; height: 36px;
  background: var(--accent-bg); color: var(--accent);
}

.ctrl-play:hover { background: var(--accent-bg); }

/* 进度条 */
.progress-section { padding: 8px 16px 4px; flex-shrink: 0; }

.progress-bar {
  height: 4px; border-radius: 2px;
  background: var(--bg-active);
  cursor: pointer; position: relative;
}

.progress-fill {
  position: absolute; left: 0; top: 0; bottom: 0;
  border-radius: 2px; background: var(--accent);
  transition: width 0.1s linear;
}

.progress-time {
  display: flex; justify-content: space-between;
  font-size: 10px; color: var(--text-muted);
  margin-top: 4px;
}

/* 控制行 */
.controls-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 4px 16px 8px; flex-shrink: 0;
}

.mode-btn {
  border: none; background: transparent; color: var(--text-tertiary);
  display: flex; align-items: center; gap: 4px; cursor: pointer;
  font-size: 12px; padding: 4px 8px; border-radius: 6px;
  transition: all 0.15s;
}

.mode-btn:hover { background: var(--bg-hover); }
.mode-label { font-size: 11px; }

.volume-control { display: flex; align-items: center; gap: 6px; }

.vol-btn {
  width: 24px; height: 24px; border: none; background: transparent;
  color: var(--text-tertiary); display: flex; align-items: center;
  justify-content: center; cursor: pointer;
}

.volume-slider {
  width: 70px; appearance: none; height: 3px; border-radius: 2px;
  background: var(--bg-active); outline: none;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none; width: 10px; height: 10px; border-radius: 50%;
  background: var(--accent); box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

/* 歌单 */
.playlist-section { flex-shrink: 0; }

.playlist-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px; cursor: pointer;
  font-size: 13px; color: var(--text-tertiary);
  border-top: 1px solid var(--border-secondary);
}

.chevron { transition: transform 0.2s; }
.chevron.rotated { transform: rotate(180deg); }

.playlist-items { padding: 0 8px 8px; }

.playlist-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px; border-radius: 8px; cursor: pointer;
  transition: background 0.15s;
}

.playlist-item:hover { background: var(--bg-hover); }
.playlist-item.active { background: var(--accent-bg); }

.track-idx { font-size: 11px; color: var(--text-muted); min-width: 18px; text-align: center; }
.playlist-item.active .track-idx { color: var(--accent); }

.track-info { flex: 1; min-width: 0; }

.track-title {
  font-size: 13px; font-weight: 500; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.playlist-item.active .track-title { color: var(--accent); }

.track-artist {
  font-size: 11px; color: var(--text-muted); margin-top: 1px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.track-playing-indicator {
  display: flex; align-items: flex-end; gap: 1.5px; height: 14px; flex-shrink: 0;
}

.indicator-bar {
  width: 2px; background: var(--accent); border-radius: 1px;
  animation: bar-bounce 0.5s ease-in-out infinite alternate;
}

.indicator-bar:nth-child(1) { height: 4px; }
.indicator-bar:nth-child(2) { height: 8px; }
.indicator-bar:nth-child(3) { height: 6px; }

@keyframes bar-bounce { 0% { transform: scaleY(0.4); } 100% { transform: scaleY(1); } }

.playlist-empty {
  padding: 20px; text-align: center; font-size: 13px;
  color: var(--text-muted);
}

/* 空状态 & 加载 */
.music-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; flex: 1; gap: 12px; padding: 40px;
}

.empty-icon-svg { color: var(--text-muted); opacity: 0.4; }
.empty-text { font-size: 14px; color: var(--text-tertiary); }

.empty-load-btn {
  padding: 8px 24px; border-radius: 20px; border: 1px solid var(--accent);
  background: var(--accent-bg); color: var(--accent); font-size: 13px;
  cursor: pointer; transition: all 0.15s;
}

.empty-load-btn:hover { background: var(--accent); color: white; }

.music-loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; flex: 1; gap: 12px;
}

.loading-spinner {
  width: 24px; height: 24px; border: 2px solid var(--bg-active);
  border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite;
}

.loading-text { font-size: 13px; color: var(--text-muted); }

/* 展开动画 */
.list-expand-enter-active, .list-expand-leave-active {
  transition: all 0.25s ease; overflow: hidden;
}
.list-expand-enter-from, .list-expand-leave-to { opacity: 0; max-height: 0; }
.list-expand-enter-to, .list-expand-leave-from { opacity: 1; max-height: 500px; }
</style>
