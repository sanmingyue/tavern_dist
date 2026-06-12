<template>
  <div class="music-page">
    <!-- 顶部导航 -->
    <div class="music-header">
      <button class="back-btn" @click="store.goBack()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="header-tabs">
        <button :class="{ active: activeTab === 'discover' }" @click="activeTab = 'discover'">发现</button>
        <button :class="{ active: activeTab === 'my' }" @click="activeTab = 'my'">我的</button>
      </div>
      <button class="gen-btn" :disabled="isGenerating" @click="generatePlaylist">AI</button>
    </div>

    <!-- 发现页 -->
    <div v-if="activeTab === 'discover'" class="tab-content">
      <div class="banner">
        <div class="banner-card" style="background: linear-gradient(135deg, #1db954, #191414);">
          <div class="banner-info">
            <span class="banner-tag">每日推荐</span>
            <h3 class="banner-title">今日精选歌单</h3>
            <p class="banner-desc">根据你的口味推荐</p>
          </div>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="1.5">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
        </div>
      </div>

      <div class="music-search">
        <input v-model="songSearch" placeholder="搜索歌曲、歌手" @keyup.enter="reportSongSearch" />
      </div>

      <ErrorBlock v-if="lastError" :message="lastError" :retry-fn="generatePlaylist" />

      <SkeletonLoader v-else-if="isGenerating && playlists.length === 0" type="card" :rows="2" text="AI 正在生成歌单..." />

      <!-- 推荐歌单 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">推荐歌单</span>
          <button class="section-more" @click="generatePlaylist">刷新</button>
        </div>
        <div class="playlist-scroll">
          <div v-for="pl in playlists" :key="pl.name" class="playlist-card" @click="openPlaylist(pl)">
            <div class="playlist-cover" :style="{ backgroundColor: pl.color }">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
              <span class="play-count">{{ pl.playCount }}</span>
            </div>
            <span class="playlist-name">{{ pl.name }}</span>
          </div>
        </div>
      </div>

      <!-- 新歌速递 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title">新歌速递</span>
        </div>
        <div class="song-list">
          <div v-for="(song, idx) in filteredSongs" :key="song.title" class="song-item" @click="playSong(song)">
            <span class="song-index" :class="{ hot: idx < 3 }">{{ idx + 1 }}</span>
            <div class="song-info">
              <span class="song-title">{{ song.title }}</span>
              <span class="song-artist">{{ song.artist }}</span>
            </div>
            <button class="playlist-add" @click.stop="addSongToPlaylist(song)">+</button>
            <button class="play-btn" @click.stop="playSong(song)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div class="section" v-if="currentSong">
        <div class="section-header">
          <span class="section-title">歌词</span>
        </div>
        <div class="lyrics-card">
          <p v-for="line in currentLyrics" :key="line">{{ line }}</p>
        </div>
      </div>

      <!-- 热门评论 -->
      <div class="section" v-if="hotComments.length > 0">
        <div class="section-header">
          <span class="section-title">热评</span>
        </div>
        <div v-for="comment in hotComments" :key="comment.id" class="hot-comment">
          <AvatarBadge :name="comment.author" size="sm" />
          <div class="hc-body">
            <strong>{{ comment.author }}</strong>
            <p>{{ comment.content }}</p>
            <span class="hc-song">—— {{ comment.song }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 我的页 -->
    <div v-if="activeTab === 'my'" class="tab-content">
      <div class="my-actions">
        <div class="my-action-item">
          <div class="action-icon" style="background: #e74c3c;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </div>
          <span>我喜欢</span>
          <span class="count">{{ likedSongs.length }}首</span>
        </div>
        <div class="my-action-item">
          <div class="action-icon" style="background: #9b59b6;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <span>最近播放</span>
          <span class="count">{{ recentPlayed.length }}首</span>
        </div>
      </div>

      <div class="section">
        <div class="section-header"><span class="section-title">我的歌单</span></div>
        <div class="playlist-create">
          <input v-model="newPlaylistName" placeholder="新建歌单名称" @keyup.enter="createPlaylist" />
          <button @click="createPlaylist">新建</button>
        </div>
        <div class="my-playlists">
          <div v-for="pl in myPlaylists" :key="pl.name" class="my-playlist-item">
            <div class="pl-cover" :style="{ backgroundColor: pl.color }">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5">
                <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div class="pl-info">
              <span class="pl-name">{{ pl.name }}</span>
              <span class="pl-count">{{ pl.count }}首</span>
            </div>
            <button class="pl-delete" @click="removePlaylist(pl.name)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部迷你播放器 -->
    <div class="mini-player" v-if="currentSong">
      <div class="mini-cover" :class="{ spinning: isPlaying }">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
      </div>
      <div class="mini-info">
        <span class="mini-title">{{ currentSong.title }}</span>
        <span class="mini-artist">{{ currentSong.artist }}</span>
      </div>
      <button class="mini-play" @click="isPlaying = !isPlaying">
        <svg v-if="isPlaying" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>
        <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
      </button>
      <button class="mini-share" @click="shareSong">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { usePhoneStore } from '../../stores/phone-store';
import { generateForApp, parseXmlResult, extractXmlTag } from '../../utils/generation-pipeline';
import AvatarBadge from '../../components/AvatarBadge.vue';
import SkeletonLoader from '../../components/SkeletonLoader.vue';
import ErrorBlock from '../../components/ErrorBlock.vue';

const store = usePhoneStore();
const activeTab = ref('discover');
const isPlaying = ref(false);
const isGenerating = ref(false);
const lastError = ref('');
const songSearch = ref('');
const newPlaylistName = ref('');

interface Song { title: string; artist: string; album?: string; duration?: string; }

const currentSong = ref<Song | null>(null);
const likedSongs = ref<Song[]>([]);
const recentPlayed = ref<Song[]>([]);
const filteredSongs = computed(() => {
  const q = songSearch.value.trim().toLowerCase();
  if (!q) return newSongs.value;
  return newSongs.value.filter(s => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q));
});
const currentLyrics = computed(() => {
  const song = currentSong.value;
  if (!song) return [];
  return [
    `${song.title} - ${song.artist}`,
    '灯光落在窗边，旋律慢慢靠近',
    '把没说完的话，藏进下一句副歌',
    '如果此刻有人听见，就让故事继续',
  ];
});

interface HotComment { id: string; author: string; content: string; song: string; }
const hotComments = ref<HotComment[]>([
  { id: 'hc1', author: '深夜听歌人', content: '每次听到这首歌都会想起那个夏天的傍晚', song: '晚风 - 周深' },
  { id: 'hc2', author: '音乐治愈', content: '单曲循环到天亮，谢谢这首歌陪我度过最难的日子', song: '起风了 - 买辣椒也用券' },
]);

const playlists = ref([
  { name: '华语流行TOP50', playCount: '128万', color: '#e74c3c', songs: [] as Song[] },
  { name: '深夜情歌', playCount: '86万', color: '#3498db', songs: [] as Song[] },
  { name: '电子音乐精选', playCount: '45万', color: '#9b59b6', songs: [] as Song[] },
  { name: '轻音乐助眠', playCount: '203万', color: '#1db954', songs: [] as Song[] },
  { name: '日语歌单', playCount: '67万', color: '#e91e63', songs: [] as Song[] },
]);

const newSongs = ref<Song[]>([
  { title: '晚风', artist: '周深' },
  { title: '宇宙中心', artist: 'IU' },
  { title: '夜曲', artist: '周杰伦' },
  { title: '光年之外', artist: '邓紫棋' },
  { title: '起风了', artist: '买辣椒也用券' },
  { title: 'Stay', artist: 'The Kid LAROI' },
]);

const myPlaylists = ref([
  { name: '日常循环', count: 48, color: '#2196f3', songs: [] as Song[] },
  { name: '跑步歌单', count: 23, color: '#ff5722', songs: [] as Song[] },
  { name: '学习BGM', count: 35, color: '#4caf50', songs: [] as Song[] },
]);

function reportSongSearch() {
  store.reportAction({
    appId: 'music', appName: '音乐', action: '搜索歌曲',
    summary: `用户在音乐 APP 搜索「${songSearch.value.trim()}」`,
    data: { keyword: songSearch.value.trim() },
  });
}

function createPlaylist() {
  const name = newPlaylistName.value.trim();
  if (!name) return;
  myPlaylists.value.unshift({ name, count: 0, color: '#1db954', songs: [] });
  newPlaylistName.value = '';
  store.reportAction({
    appId: 'music', appName: '音乐', action: '新建歌单',
    summary: `用户新建了歌单「${name}」`,
    data: { name },
  });
}

function removePlaylist(name: string) {
  myPlaylists.value = myPlaylists.value.filter(pl => pl.name !== name);
  store.reportAction({
    appId: 'music', appName: '音乐', action: '删除歌单',
    summary: `用户删除了歌单「${name}」`,
    data: { name },
  });
}

function addSongToPlaylist(song: Song) {
  const target = myPlaylists.value[0];
  if (!target) return;
  if (!target.songs.some(s => s.title === song.title)) {
    target.songs.unshift(song);
    target.count = target.songs.length;
  }
  store.reportAction({
    appId: 'music', appName: '音乐', action: '加入歌单',
    summary: `用户将「${song.title}」加入歌单「${target.name}」`,
    data: { song: song.title, playlist: target.name },
  });
  toastr.success('已加入歌单', '音乐');
}

function playSong(song: Song) {
  currentSong.value = song;
  isPlaying.value = true;
  if (!recentPlayed.value.find(s => s.title === song.title)) {
    recentPlayed.value.unshift(song);
    if (recentPlayed.value.length > 20) recentPlayed.value.pop();
  }
  store.reportAction({
    appId: 'music', appName: '音乐', action: '播放歌曲',
    summary: `用户在音乐 APP 播放了「${song.title} - ${song.artist}」`,
    data: { title: song.title, artist: song.artist },
  });
}

function openPlaylist(pl: typeof playlists.value[0]) {
  store.reportAction({
    appId: 'music', appName: '音乐', action: '查看歌单',
    summary: `用户在音乐 APP 查看了歌单「${pl.name}」`,
    data: { playlist: pl.name },
  });
}

function shareSong() {
  if (!currentSong.value) return;
  // 联动消息 APP
  store.reportAction({
    appId: 'music', appName: '音乐', action: '分享歌曲',
    summary: `用户分享了歌曲「${currentSong.value.title} - ${currentSong.value.artist}」`,
    data: { title: currentSong.value.title, artist: currentSong.value.artist },
  });
  toastr.success(`已分享「${currentSong.value.title}」`, '音乐');
}

async function generatePlaylist() {
  if (isGenerating.value) return;
  isGenerating.value = true;
  try {
    const result = await generateForApp(
      'music',
      '生成一个歌单和 6 首歌曲推荐。歌单名和歌曲可以虚构但要有真实感。',
      '角色平时听什么音乐？歌单名称能体现角色品味。',
    );
    if (!result.success) {
      lastError.value = result.error ?? '生成失败';
      return;
    }
    if (!result.parsed) {
      lastError.value = '生成结果为空';
      return;
    }
    lastError.value = '';
    const text = result.parsed;

    // XML 解析：提取 <playlist> 块，子项 songs -> song
    const parsedPlaylists = parseXmlResult(text, 'playlist', { songs: 'song' });
    if (parsedPlaylists.length === 0) {
      console.warn('[小手机] 音乐解析失败:', text.slice(0, 200));
      lastError.value = '生成结果格式不匹配';
      return;
    }

    const pl = parsedPlaylists[0];
    const playlistName = String(pl.name ?? pl.title ?? 'AI推荐歌单');
    const rawSongs: Record<string, string>[] = Array.isArray(pl.songs) ? pl.songs : [];

    if (rawSongs.length === 0) {
      lastError.value = '歌单中没有歌曲';
      return;
    }

    const colors = ['#e74c3c', '#3498db', '#9b59b6', '#1db954', '#e91e63', '#ff5722'];
    playlists.value.unshift({
      name: playlistName,
      playCount: `${_.random(1, 500)}万`,
      color: colors[playlists.value.length % colors.length],
      songs: rawSongs.map(s => ({
        title: String(s.title ?? '歌曲'),
        artist: String(s.artist ?? '未知'),
        album: s.album ? String(s.album) : undefined,
        duration: s.duration ? String(s.duration) : undefined,
      })),
    });
    // 更新新歌速递
    newSongs.value = rawSongs.slice(0, 6).map(s => ({
      title: String(s.title ?? '歌曲'),
      artist: String(s.artist ?? '未知'),
    }));
    toastr.success(`已生成歌单「${playlistName}」`, '音乐');
  } finally { isGenerating.value = false; }
}
</script>

<style scoped>
.music-page {
  height: 100%; display: flex; flex-direction: column;
  background: var(--bg-secondary); overflow: hidden;
}

.music-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; background: var(--bg-primary);
  border-bottom: 1px solid var(--border-secondary); flex-shrink: 0;
}
.back-btn {
  width: 32px; height: 32px; border: none; border-radius: 50%;
  background: var(--bg-tertiary); color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.header-tabs { display: flex; gap: 4px; }
.header-tabs button {
  padding: 5px 14px; border: none; border-radius: 14px;
  background: transparent; color: var(--text-tertiary); font-size: 13px; font-weight: 500; cursor: pointer;
}
.header-tabs button.active { background: #1db954; color: white; }
.gen-btn {
  border: none; border-radius: 10px; padding: 5px 10px;
  background: #1db954; color: white; font-size: 12px; font-weight: 600; cursor: pointer;
}
.gen-btn:disabled { opacity: 0.5; }

.tab-content { flex: 1; overflow-y: auto; }

/* ─── Banner ─── */
.banner { padding: 12px 16px; }
.banner-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px; border-radius: 14px; color: white;
}
.banner-info { flex: 1; }
.banner-tag { font-size: 10px; padding: 2px 8px; background: rgba(255,255,255,0.2); border-radius: 6px; }
.banner-title { font-size: 17px; font-weight: 700; margin: 8px 0 4px; }
.banner-desc { font-size: 12px; opacity: 0.7; margin: 0; }
.music-search { padding: 0 16px 12px; }
.music-search input,
.playlist-create input {
  width: 100%; border: none; border-radius: 12px; padding: 9px 12px;
  background: var(--bg-primary); color: var(--text-primary); outline: none;
}

/* ─── Section ─── */
.section { padding: 0 16px 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.section-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.section-more { border: none; background: transparent; color: var(--text-tertiary); font-size: 12px; cursor: pointer; }

.playlist-scroll { display: flex; gap: 10px; overflow-x: auto; scrollbar-width: none; }
.playlist-scroll::-webkit-scrollbar { display: none; }
.playlist-card { min-width: 100px; flex-shrink: 0; cursor: pointer; }
.playlist-cover {
  width: 100px; height: 100px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  position: relative; margin-bottom: 6px;
}
.play-count {
  position: absolute; top: 4px; right: 6px;
  font-size: 10px; color: white; display: flex; align-items: center; gap: 2px;
}
.playlist-name {
  font-size: 12px; color: var(--text-secondary);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

/* ─── Song List ─── */
.song-list { display: flex; flex-direction: column; gap: 2px; }
.song-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 6px; border-radius: 8px; cursor: pointer; transition: background 0.15s;
}
.song-item:hover { background: var(--bg-hover); }
.song-index { width: 20px; text-align: center; font-size: 14px; font-weight: 600; color: var(--text-muted); }
.song-index.hot { color: #1db954; }
.song-info { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.song-title { font-size: 14px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.song-artist { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.play-btn {
  width: 30px; height: 30px; border: none; border-radius: 50%;
  background: var(--bg-tertiary); color: #1db954;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.playlist-add {
  width: 28px; height: 28px; border: none; border-radius: 50%;
  background: rgba(29,185,84,0.12); color: #1db954; font-size: 18px; cursor: pointer;
}

.lyrics-card {
  padding: 12px; border-radius: 12px; background: var(--bg-primary);
}
.lyrics-card p {
  margin: 0 0 7px; font-size: 13px; color: var(--text-secondary); line-height: 1.5;
}

/* ─── Hot Comments ─── */
.hot-comment {
  display: flex; gap: 10px; padding: 10px;
  background: var(--bg-primary); border-radius: 10px; margin-bottom: 8px;
}
.hc-body { flex: 1; min-width: 0; }
.hc-body strong { font-size: 13px; color: var(--text-primary); }
.hc-body p { margin: 4px 0 0; font-size: 13px; color: var(--text-secondary); line-height: 1.4; }
.hc-song { font-size: 11px; color: var(--text-muted); font-style: italic; }

/* ─── My Page ─── */
.my-actions { padding: 12px 16px; display: flex; flex-direction: column; gap: 4px; }
.my-action-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px; background: var(--bg-primary); border-radius: 10px; cursor: pointer;
}
.action-icon {
  width: 36px; height: 36px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.my-action-item span:nth-child(2) { flex: 1; font-size: 14px; color: var(--text-primary); }
.count { font-size: 12px; color: var(--text-muted); }

.my-playlists { display: flex; flex-direction: column; gap: 4px; }
.playlist-create {
  display: flex; gap: 8px; margin-bottom: 8px;
}
.playlist-create button,
.pl-delete {
  border: none; border-radius: 10px; padding: 7px 10px;
  background: #1db954; color: white; font-size: 12px; cursor: pointer;
}
.my-playlist-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px; background: var(--bg-primary); border-radius: 8px; cursor: pointer;
}
.pl-cover {
  width: 44px; height: 44px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.pl-info { flex: 1; display: flex; flex-direction: column; }
.pl-name { font-size: 14px; color: var(--text-primary); }
.pl-count { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.pl-delete { background: var(--bg-tertiary); color: var(--text-tertiary); }

/* ─── Mini Player ─── */
.mini-player {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px; background: var(--bg-primary);
  border-top: 1px solid var(--border-secondary); flex-shrink: 0;
}
.mini-cover {
  width: 36px; height: 36px; border-radius: 50%;
  background: #1db954; color: white;
  display: flex; align-items: center; justify-content: center;
}
.mini-cover.spinning { animation: spin 8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.mini-info { flex: 1; min-width: 0; }
.mini-title { font-size: 13px; color: var(--text-primary); display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mini-artist { font-size: 11px; color: var(--text-muted); }
.mini-play, .mini-share {
  width: 36px; height: 36px; border: none; border-radius: 50%;
  background: transparent; color: var(--text-primary);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
</style>
