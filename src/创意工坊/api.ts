import {
  API_BASE,
  getAuthToken,
  type WorkListResponse,
  type WorkDetail,
  type MyWork,
  type UserInfo,
  type DownloadResult,
  type WorkComment,
  type MyDownload,
  type MyFavorite,
} from './types';

/** 发送 API 请求 */
async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...(opts.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 如果不是 FormData，设置 Content-Type
  if (!(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const resp = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers,
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    throw new Error(data.error || `请求失败: ${resp.status}`);
  }

  return resp.json();
}

// ─── 认证 ───

/** 用户名密码登录 */
export async function loginWithPassword(username: string, password: string): Promise<{ token: string; user: any }> {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

/** 获取当前用户信息 */
export async function fetchMe(): Promise<UserInfo> {
  return request('/auth/me');
}

/** 登出 */
export async function logout(): Promise<void> {
  await request('/auth/logout', { method: 'POST' });
}

/** 获取 Discord 注册页面 URL */
export function getRegisterUrl(): string {
  return `${API_BASE}/auth/discord`;
}

// ─── 作品列表 ───

/** 获取已审核作品列表 */
export async function fetchWorks(params: {
  page?: number;
  page_size?: number;
  type?: string;
  search?: string;
  sort?: string;
  tag?: string;
} = {}): Promise<WorkListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', String(params.page));
  if (params.page_size) searchParams.set('page_size', String(params.page_size));
  if (params.type) searchParams.set('type', params.type);
  if (params.search) searchParams.set('search', params.search);
  if (params.sort) searchParams.set('sort', params.sort);
  if (params.tag) searchParams.set('tag', params.tag);

  const qs = searchParams.toString();
  return request(`/api/works${qs ? '?' + qs : ''}`);
}

/** 获取所有标签 */
export async function fetchTags(): Promise<string[]> {
  const data = await request<{ tags: string[] }>('/api/works/tags');
  return data.tags;
}

/** 获取单个作品详情 */
export async function fetchWorkDetail(id: number): Promise<WorkDetail> {
  return request(`/api/works/${id}`);
}

/** 下载作品内容 */
export async function downloadWork(id: number): Promise<DownloadResult> {
  return request(`/api/works/${id}/download`);
}

// ─── 作品操作 ───

/** 上传新作品 */
export async function uploadWork(data: {
  title: string;
  description: string;
  type: string;
  content: string;
  tags: string[];
  char_name?: string;
  cover?: File;
  card_link?: string;
  file_type?: string;
  resource_file?: File;       // 资源文件（regex/worldbook/character/card_addon 文件上传）
  addon_subtype?: string;     // card_addon 子类型
  child_ids?: number[];       // 仅 collection 类型使用
}): Promise<{ id: number; message: string }> {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('description', data.description);
  formData.append('type', data.type);
  formData.append('content', data.content);
  formData.append('tags', JSON.stringify(data.tags));
  if (data.char_name) {
    formData.append('char_name', data.char_name);
  }
  if (data.cover) {
    formData.append('cover', data.cover);
  }
  if (data.card_link) {
    formData.append('card_link', data.card_link);
  }
  if (data.file_type) {
    formData.append('file_type', data.file_type);
  }
  if (data.resource_file) {
    formData.append('card_file', data.resource_file);
  }
  if (data.addon_subtype) {
    formData.append('addon_subtype', data.addon_subtype);
  }
  if (data.child_ids && data.child_ids.length > 0) {
    formData.append('child_ids', JSON.stringify(data.child_ids));
  }

  return request('/api/works', {
    method: 'POST',
    body: formData,
  });
}

/** 修改作品 */
export async function updateWork(id: number, data: {
  title?: string;
  description?: string;
  content?: string;
  tags?: string[];
  char_name?: string;
  card_link?: string;
  file_type?: string;
  cover?: File;
  resource_file?: File;
  addon_subtype?: string;
}): Promise<{ message: string }> {
  const formData = new FormData();
  if (data.title !== undefined) formData.append('title', data.title);
  if (data.description !== undefined) formData.append('description', data.description);
  if (data.content !== undefined) formData.append('content', data.content);
  if (data.tags !== undefined) formData.append('tags', JSON.stringify(data.tags));
  if (data.char_name !== undefined) formData.append('char_name', data.char_name);
  if (data.card_link !== undefined) formData.append('card_link', data.card_link);
  if (data.file_type !== undefined) formData.append('file_type', data.file_type);
  if (data.cover) formData.append('cover', data.cover);
  if (data.resource_file) formData.append('card_file', data.resource_file);
  if (data.addon_subtype) formData.append('addon_subtype', data.addon_subtype);

  return request(`/api/works/${id}`, {
    method: 'PUT',
    body: formData,
  });
}

/** 删除作品 */
export async function deleteWorkApi(id: number): Promise<{ message: string }> {
  return request(`/api/works/${id}`, { method: 'DELETE' });
}

/** 点赞/取消点赞 */
export async function toggleLikeApi(id: number): Promise<{ liked: boolean; like_count: number }> {
  return request(`/api/works/${id}/like`, { method: 'POST' });
}

/** 收藏/取消收藏 */
export async function toggleFavoriteApi(id: number): Promise<{ favorited: boolean; favorite_count: number }> {
  return request(`/api/works/${id}/favorite`, { method: 'POST' });
}

/** 获取作品评论 */
export async function fetchComments(workId: number): Promise<{ comments: WorkComment[] }> {
  return request(`/api/works/${workId}/comments`);
}

/** 发表评论 */
export async function createCommentApi(workId: number, content: string): Promise<{ id: number; message: string }> {
  return request(`/api/works/${workId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

/** 修改自己的评论 */
export async function updateCommentApi(commentId: number, content: string): Promise<{ message: string }> {
  return request(`/api/works/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

/** 删除自己的评论，或作者隐藏自己作品下的评论 */
export async function deleteCommentApi(commentId: number, reason?: string): Promise<{ message: string }> {
  return request(`/api/works/comments/${commentId}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  });
}

// ─── 我的作品 ───

/** 获取我的作品列表 */
export async function fetchMyWorks(): Promise<{ works: MyWork[] }> {
  return request('/api/my/works');
}

/** 获取我的下载记录 */
export async function fetchMyDownloads(): Promise<{ downloads: MyDownload[] }> {
  return request('/api/my/downloads');
}

/** 获取我的收藏 */
export async function fetchMyFavorites(): Promise<{ favorites: MyFavorite[] }> {
  return request('/api/my/favorites');
}

/** 向合集追加子作品（作者专属） */
export async function addWorksToCollection(collectionId: number, addIds: number[]): Promise<{ message: string; children_count: number }> {
  return request(`/api/works/${collectionId}/children`, {
    method: 'PUT',
    body: JSON.stringify({ add_ids: addIds }),
  });
}
