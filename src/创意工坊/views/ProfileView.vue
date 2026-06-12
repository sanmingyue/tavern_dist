<template>
  <div class="ws-profile">
    <!-- 未登录：登录表单 -->
    <div v-if="!isLoggedIn" class="ws-profile-login">
      <div class="ws-profile-logo">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <h3 class="ws-profile-welcome">欢迎来到创意工坊</h3>

      <!-- 登录表单 -->
      <div class="ws-login-form">
        <input
          class="ws-login-input"
          v-model="loginUsername"
          placeholder="用户名"
          spellcheck="false"
          @keydown.enter="onLogin"
        />
        <input
          class="ws-login-input"
          v-model="loginPassword"
          type="password"
          placeholder="密码"
          @keydown.enter="onLogin"
        />
        <button class="ws-login-submit" :disabled="!loginUsername || !loginPassword || auth.loading.value" @click="onLogin">
          {{ auth.loading.value ? '登录中...' : '登录' }}
        </button>
        <div v-if="loginError" class="ws-login-error">{{ loginError }}</div>
      </div>

      <!-- 注册提示 -->
      <div class="ws-register-hint">
        <p>还没有账号？</p>
        <a class="ws-register-link" :href="registerUrl" target="_blank">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" /></svg>
          通过 Discord 注册并设置密码
        </a>
        <p class="ws-register-note">需要加入指定 Discord 服务器</p>
      </div>

      <div class="ws-profile-footer-info">
        <div class="ws-thanks-block">致谢安安提供服务器 -- 让我们有了家</div>
      </div>
    </div>

    <!-- 已登录 -->
    <div v-else class="ws-profile-content">
      <div class="ws-profile-card">
        <img :src="user?.avatar" class="ws-profile-avatar" @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
        <div class="ws-profile-info">
          <div class="ws-profile-name">{{ user?.display_name || user?.username }}</div>
          <div class="ws-profile-username">@{{ user?.username }}</div>
        </div>
      </div>

      <div class="ws-profile-details">
        <div class="ws-detail-row">
          <span class="ws-detail-label">Discord ID</span>
          <span class="ws-detail-value">{{ user?.discord_id }}</span>
        </div>
        <div class="ws-detail-row">
          <span class="ws-detail-label">注册时间</span>
          <span class="ws-detail-value">{{ user?.created_at?.split('T')[0] }}</span>
        </div>
      </div>

      <div class="ws-profile-activity">
        <div class="ws-activity-panel">
          <div class="ws-activity-head">
            <span>历史下载</span>
            <button class="ws-mini-refresh" @click="loadActivity">刷新</button>
          </div>
          <div class="ws-activity-list">
            <div v-if="activityLoading" class="ws-activity-empty">加载中...</div>
            <div v-else-if="downloads.length === 0" class="ws-activity-empty">暂无下载记录</div>
            <template v-else>
              <div v-for="item in downloads.slice(0, 8)" :key="item.id" class="ws-activity-item">
                <img v-if="item.cover_url" :src="item.cover_url" class="ws-activity-cover" @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
                <div v-else class="ws-activity-cover ws-activity-cover-fallback">{{ getTypeLabel(item.type) }}</div>
                <div class="ws-activity-info">
                  <div class="ws-activity-title">{{ item.char_name || item.title }}</div>
                  <div class="ws-activity-meta">{{ getTypeLabel(item.type) }} · {{ item.downloaded_at?.split('T')[0] }}</div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="ws-activity-panel">
          <div class="ws-activity-head">
            <span>我的收藏</span>
            <span>{{ favorites.length }}</span>
          </div>
          <div class="ws-activity-list">
            <div v-if="activityLoading" class="ws-activity-empty">加载中...</div>
            <div v-else-if="favorites.length === 0" class="ws-activity-empty">暂无收藏</div>
            <template v-else>
              <div v-for="item in favorites.slice(0, 8)" :key="item.id" class="ws-activity-item">
                <img v-if="item.cover_url" :src="item.cover_url" class="ws-activity-cover" @error="(e: Event) => (e.target as HTMLImageElement).style.display = 'none'" />
                <div v-else class="ws-activity-cover ws-activity-cover-fallback">{{ getTypeLabel(item.type) }}</div>
                <div class="ws-activity-info">
                  <div class="ws-activity-title">{{ item.char_name || item.title }}</div>
                  <div class="ws-activity-meta">{{ getTypeLabel(item.type) }} · {{ item.favorited_at?.split('T')[0] }}</div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <div class="ws-profile-actions">
        <button class="ws-logout-btn" @click="auth.logout()">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          登出
        </button>
      </div>

      <div class="ws-profile-footer-info">
        <div class="ws-thanks-block">致谢安安提供服务器 -- 让我们有了家</div>
        <div class="ws-version">创意工坊 v2.0.4 by 三明月肚子疼</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { fetchMyDownloads, fetchMyFavorites, getRegisterUrl } from '../api';
import { DEBUG_MODE, getTypeLabel, type MyDownload, type MyFavorite } from '../types';

const props = defineProps<{
  isMobile: boolean;
  auth: any;
}>();

const isLoggedIn = computed(() => DEBUG_MODE || props.auth.isLoggedIn.value);
const user = computed(() => {
  if (DEBUG_MODE) {
    return {
      username: 'Neon_Hacker',
      display_name: 'Neon Hacker',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Neon',
      discord_id: '987654321098765432',
      created_at: '2026-05-01T12:00:00Z',
    };
  }
  return props.auth.user.value;
});

const loginUsername = ref('');
const loginPassword = ref('');
const loginError = ref('');
const registerUrl = getRegisterUrl();
const downloads = ref<MyDownload[]>([]);
const favorites = ref<MyFavorite[]>([]);
const activityLoading = ref(false);

async function loadActivity() {
  if (!isLoggedIn.value || DEBUG_MODE) return;
  activityLoading.value = true;
  try {
    const [downloadData, favoriteData] = await Promise.all([fetchMyDownloads(), fetchMyFavorites()]);
    downloads.value = downloadData.downloads;
    favorites.value = favoriteData.favorites;
  } catch (e) {
    console.error('[创意工坊] 加载账号记录失败:', e);
  } finally {
    activityLoading.value = false;
  }
}

async function onLogin() {
  if (!loginUsername.value || !loginPassword.value) return;
  loginError.value = '';
  const error = await props.auth.login(loginUsername.value, loginPassword.value);
  if (error) {
    loginError.value = error;
  }
}

watch(isLoggedIn, (v) => { if (v) loadActivity(); }, { immediate: true });
</script>

<style scoped>
.ws-profile { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-y; }
.ws-profile::-webkit-scrollbar { width: 3px; }
.ws-profile::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 2px; }

/* 未登录 */
.ws-profile-login { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; flex: 1; padding: 40px 20px; text-align: center; }
.ws-profile-logo { color: var(--ws-primary-dim); }
.ws-profile-welcome { font-size: 18px; font-weight: 600; color: rgba(255,255,255,.8); margin: 0; }

/* 登录表单 */
.ws-login-form { display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 280px; margin-top: 8px; }
.ws-login-input { -webkit-appearance: none; appearance: none; width: 100%; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.08); background: #000 !important; color: var(--ws-text) !important; font-size: 13px; outline: none; text-align: center; transition: border-color .2s, box-shadow .2s; }
.ws-login-input:hover { border-color: rgba(229, 20, 0, 0.3); }
.ws-login-input:focus { border-color: var(--ws-primary); box-shadow: 0 0 12px var(--ws-primary-glow); }
.ws-login-input::placeholder { color: rgba(255,255,255,.25); }
.ws-login-submit { padding: 10px 24px; border-radius: 8px; border: 1px solid rgba(52,211,153,.3); background: rgba(52,211,153,.1); color: #34d399; font-size: 14px; font-weight: 600; cursor: pointer; transition: all .15s; }
.ws-login-submit:hover:not(:disabled) { background: rgba(52,211,153,.2); }
.ws-login-submit:disabled { opacity: .4; cursor: not-allowed; }
.ws-login-error { font-size: 12px; color: #f87171; min-height: 16px; }

/* 注册提示 */
.ws-register-hint { margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--ws-border); }
.ws-register-hint p { font-size: 12px; color: rgba(255,255,255,.3); margin: 4px 0; }
.ws-register-link { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 8px; border: 1px solid rgba(88,101,242,.3); background: rgba(88,101,242,.08); color: #7289da; font-size: 12px; text-decoration: none; transition: all .15s; }
.ws-register-link:hover { background: rgba(88,101,242,.18); border-color: rgba(88,101,242,.5); }
.ws-register-note { font-size: 10px !important; color: rgba(255,255,255,.15) !important; }

/* 已登录 */
.ws-profile-content { padding: 20px; }
.ws-profile-card { display: flex; align-items: center; gap: 16px; padding: 20px; border-radius: 12px; border: 1px solid var(--ws-border); background: var(--ws-glass); margin-bottom: 16px; }
.ws-profile-avatar { width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--ws-primary); flex-shrink: 0; box-shadow: 0 0 10px var(--ws-primary-glow); }
.ws-profile-name { font-size: 17px; font-weight: 600; color: rgba(255,255,255,.9); }
.ws-profile-username { font-size: 12px; color: rgba(255,255,255,.35); margin-top: 2px; }
.ws-profile-role { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #fbbf24; margin-top: 4px; }
.ws-profile-details { padding: 0 4px; margin-bottom: 20px; }
.ws-detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--ws-border); }
.ws-detail-label { font-size: 12px; color: rgba(255,255,255,.4); }
.ws-detail-value { font-size: 12px; color: rgba(255,255,255,.6); font-family: monospace; }
.ws-profile-activity { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
.ws-activity-panel { border: 1px solid var(--ws-border); border-radius: 8px; background: rgba(0,0,0,.22); overflow: hidden; min-width: 0; }
.ws-activity-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 8px 10px; border-bottom: 1px solid var(--ws-border); font-size: 12px; color: rgba(255,255,255,.62); font-weight: 600; }
.ws-mini-refresh { border: none; background: transparent; color: var(--ws-primary); font-size: 11px; cursor: pointer; padding: 2px 4px; border-radius: 4px; }
.ws-mini-refresh:hover { background: var(--ws-primary-dim); }
.ws-activity-list { max-height: 220px; min-height: 0; overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 6px; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; touch-action: pan-y; }
.ws-activity-list::-webkit-scrollbar { width: 3px; }
.ws-activity-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,.12); border-radius: 2px; }
.ws-activity-item { display: flex; align-items: center; gap: 8px; padding: 6px; border-radius: 6px; background: rgba(255,255,255,.025); border: 1px solid rgba(255,255,255,.05); min-width: 0; }
.ws-activity-cover { width: 46px; height: 34px; border-radius: 5px; object-fit: cover; flex-shrink: 0; }
.ws-activity-cover-fallback { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.06); color: rgba(255,255,255,.3); font-size: 9px; text-align: center; }
.ws-activity-info { min-width: 0; flex: 1; }
.ws-activity-title { font-size: 12px; color: rgba(255,255,255,.82); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ws-activity-meta { font-size: 10px; color: rgba(255,255,255,.32); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ws-activity-empty { color: rgba(255,255,255,.25); text-align: center; font-size: 12px; padding: 18px 8px; }
.mobile .ws-profile-activity { grid-template-columns: 1fr; }
.ws-profile-actions { margin-bottom: 24px; }
.ws-logout-btn { display: inline-flex; align-items: center; gap: 8px; padding: 8px 20px; border-radius: 6px; border: 1px solid rgba(248,113,113,.25); background: rgba(248,113,113,.06); color: rgba(248,113,113,.7); font-size: 12px; cursor: pointer; transition: all .15s; }
.ws-logout-btn:hover { background: rgba(248,113,113,.15); border-color: rgba(248,113,113,.4); color: #f87171; }
.ws-profile-footer-info { text-align: center; padding-top: 20px; border-top: 1px solid var(--ws-border); }
.ws-thanks-block { font-size: 12px; color: rgba(255,255,255,.4); font-style: italic; margin-bottom: 6px; }
.ws-version { font-size: 10px; color: rgba(255,255,255,.15); }
</style>
