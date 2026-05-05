import { getAuthToken, setAuthToken, clearAuthToken, type UserInfo } from './types';
import { fetchMe, logout as logoutApi, loginWithPassword } from './api';

/** 认证状态管理 */
export function useAuth() {
  const user = ref<UserInfo | null>(null);
  const isLoggedIn = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.is_admin ?? false);
  const loading = ref(false);

  /** 尝试从本地 token 恢复登录态 */
  async function tryRestore() {
    const token = getAuthToken();
    if (!token) return;

    loading.value = true;
    try {
      user.value = await fetchMe();
    } catch {
      clearAuthToken();
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  /** 用户名密码登录 */
  async function login(username: string, password: string): Promise<string | null> {
    loading.value = true;
    try {
      const result = await loginWithPassword(username, password);
      setAuthToken(result.token);
      user.value = result.user as UserInfo;
      toastr.success(`欢迎，${user.value?.display_name || user.value?.username}！`);
      return null; // 无错误
    } catch (e: any) {
      return e.message || '登录失败';
    } finally {
      loading.value = false;
    }
  }

  /** 登出 */
  async function logout() {
    try {
      await logoutApi();
    } catch { /* ignore */ }
    clearAuthToken();
    user.value = null;
    toastr.info('已登出');
  }

  return { user, isLoggedIn, isAdmin, loading, tryRestore, login, logout };
}
