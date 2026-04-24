/**
 * 小手机内置音乐播放器 Store
 *
 * 通过 manifest URL 获取歌单，在手机内播放音乐。
 * 基于用户提供的云播放器代码简化而来。
 */

const MANIFEST_URL = 'https://smymusic.zeabur.app/player/manifest';
const MUSIC_STORAGE_KEY = 'yubing-phone-music';
const PLAY_MODES = ['list', 'single', 'shuffle'] as const;
type PlayMode = typeof PLAY_MODES[number];

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  audio: string;
  cover: string;
  lyrics: string;
}

interface MusicCacheData {
  volume: number;
  muted: boolean;
  playMode: PlayMode;
  lastTrackId: string;
}

function readMusicCache(): MusicCacheData {
  try {
    const raw = window.parent.localStorage.getItem(MUSIC_STORAGE_KEY);
    if (!raw) return { volume: 0.85, muted: false, playMode: 'list', lastTrackId: '' };
    return JSON.parse(raw);
  } catch {
    return { volume: 0.85, muted: false, playMode: 'list', lastTrackId: '' };
  }
}

function writeMusicCache(data: MusicCacheData) {
  try {
    window.parent.localStorage.setItem(MUSIC_STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export const useMusicStore = defineStore('yubing-phone-music', () => {
  const tracks = ref<MusicTrack[]>([]);
  const currentIndex = ref(0);
  const isPlaying = ref(false);
  const isLoading = ref(false);
  const currentTime = ref(0);
  const duration = ref(0);
  const volume = ref(0.85);
  const muted = ref(false);
  const playMode = ref<PlayMode>('list');
  const audioElement = ref<HTMLAudioElement | null>(null);

  const currentTrack = computed(() => tracks.value[currentIndex.value] || null);
  const currentTrackTitle = computed(() => currentTrack.value?.title || '');
  const progress = computed(() => duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0);

  function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '00:00';
    const s = Math.floor(seconds);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  }

  const currentTimeFormatted = computed(() => formatTime(currentTime.value));
  const durationFormatted = computed(() => formatTime(duration.value));

  function initAudio() {
    if (audioElement.value) return;
    const audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.volume = volume.value;
    audio.muted = muted.value;

    audio.addEventListener('play', () => { isPlaying.value = true; });
    audio.addEventListener('pause', () => { isPlaying.value = false; });
    audio.addEventListener('timeupdate', () => {
      currentTime.value = audio.currentTime || 0;
      duration.value = audio.duration || 0;
    });
    audio.addEventListener('loadedmetadata', () => { duration.value = audio.duration || 0; });
    audio.addEventListener('ended', () => { nextTrack(); });
    audio.addEventListener('error', () => { console.warn('[小手机音乐] 音频加载失败'); });

    audioElement.value = audio;
  }

  async function fetchManifest() {
    isLoading.value = true;
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-store', credentials: 'omit' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const rawTracks = Array.isArray(data.tracks) ? data.tracks : [];
      tracks.value = rawTracks
        .filter((t: any) => t && t.audio)
        .map((t: any, idx: number) => ({
          id: t.id != null ? String(t.id) : `track-${idx}`,
          title: t.title || t.name || `曲目 ${idx + 1}`,
          artist: t.artist || '未知歌手',
          audio: t.audio || '',
          cover: t.cover || '',
          lyrics: t.lyrics || '',
        }));

      /* 恢复上次播放的曲目 */
      const cache = readMusicCache();
      if (cache.lastTrackId) {
        const idx = tracks.value.findIndex(t => t.id === cache.lastTrackId);
        if (idx >= 0) currentIndex.value = idx;
      }

      console.info(`[小手机音乐] 加载了 ${tracks.value.length} 首曲目`);
    } catch (e) {
      console.warn('[小手机音乐] 歌单加载失败:', e);
    } finally {
      isLoading.value = false;
    }
  }

  function loadTrack(index: number) {
    if (!tracks.value.length) return;
    initAudio();
    const audio = audioElement.value!;

    currentIndex.value = _.clamp(index, 0, tracks.value.length - 1);
    const track = tracks.value[currentIndex.value];
    audio.src = track.audio;
    audio.load();
    currentTime.value = 0;
    duration.value = 0;
    persist();
  }

  async function play() {
    if (!tracks.value.length) return;
    initAudio();
    const audio = audioElement.value!;

    if (!audio.src) loadTrack(currentIndex.value);

    try {
      await audio.play();
    } catch {
      console.warn('[小手机音乐] 需要用户交互才能播放');
    }
  }

  function pause() {
    audioElement.value?.pause();
  }

  async function togglePlay() {
    if (!tracks.value.length) return;
    if (isPlaying.value) pause();
    else await play();
  }

  function nextTrack() {
    if (!tracks.value.length) return;
    let next: number;
    if (playMode.value === 'single') {
      next = currentIndex.value;
    } else if (playMode.value === 'shuffle') {
      next = tracks.value.length > 1
        ? (() => { let n = currentIndex.value; while (n === currentIndex.value) n = Math.floor(Math.random() * tracks.value.length); return n; })()
        : currentIndex.value;
    } else {
      next = (currentIndex.value + 1) % tracks.value.length;
    }
    loadTrack(next);
    if (isPlaying.value) play();
  }

  function prevTrack() {
    if (!tracks.value.length) return;
    const prev = currentIndex.value - 1 < 0 ? tracks.value.length - 1 : currentIndex.value - 1;
    loadTrack(prev);
    if (isPlaying.value) play();
  }

  function seek(percent: number) {
    if (!audioElement.value || !duration.value) return;
    audioElement.value.currentTime = (percent / 100) * duration.value;
  }

  function setVolume(val: number) {
    volume.value = _.clamp(val, 0, 1);
    muted.value = volume.value <= 0.001;
    if (audioElement.value) {
      audioElement.value.volume = volume.value;
      audioElement.value.muted = muted.value;
    }
    persist();
  }

  function toggleMute() {
    muted.value = !muted.value;
    if (audioElement.value) audioElement.value.muted = muted.value;
    persist();
  }

  function cyclePlayMode() {
    const idx = PLAY_MODES.indexOf(playMode.value);
    playMode.value = PLAY_MODES[(idx + 1) % PLAY_MODES.length];
    persist();
  }

  function playTrackAt(index: number) {
    loadTrack(index);
    play();
  }

  function persist() {
    writeMusicCache({
      volume: volume.value,
      muted: muted.value,
      playMode: playMode.value,
      lastTrackId: currentTrack.value?.id || '',
    });
  }

  function loadPrefs() {
    const cache = readMusicCache();
    volume.value = cache.volume;
    muted.value = cache.muted;
    playMode.value = cache.playMode;
  }

  function destroy() {
    if (audioElement.value) {
      audioElement.value.pause();
      audioElement.value.removeAttribute('src');
      audioElement.value = null;
    }
  }

  return {
    tracks,
    currentIndex,
    currentTrack,
    currentTrackTitle,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    progress,
    currentTimeFormatted,
    durationFormatted,
    volume,
    muted,
    playMode,
    fetchManifest,
    loadTrack,
    play,
    pause,
    togglePlay,
    nextTrack,
    prevTrack,
    seek,
    setVolume,
    toggleMute,
    cyclePlayMode,
    playTrackAt,
    loadPrefs,
    destroy,
  };
});
