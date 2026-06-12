import { defineStore } from 'pinia';
import type { Component } from 'vue';
import { APP_LIST, APP_COLORS, ICON_PATHS, getIconPath, getAppColor } from '../utils/icons';

// 前向声明（在文件底部定义）
let _PREINSTALLED_APPS: Set<string>;
function isPreinstalled(appId: string): boolean {
  if (!_PREINSTALLED_APPS) {
    // 延迟引用，避免 hoisting 问题
    _PREINSTALLED_APPS = new Set([
      'phone', 'sms', 'contacts', 'camera', 'gallery',
      'clock', 'calculator', 'calendar', 'notes', 'weather',
      'browser', 'files', 'settings', 'themes', 'notifications',
      'appstore', 'wallet', 'map',
    ]);
  }
  return _PREINSTALLED_APPS.has(appId);
}

/* ─── APP 元信息 ─── */
export interface AppMeta {
  id: string;
  name: string;
  icon: string;
  component: Component | null;
  category: 'social' | 'life' | 'entertainment' | 'shopping' | 'tools' | 'system';
  /** 目录名（中文） */
  dir: string;
  /** 显示大小（模拟） */
  size: string;
  /** APP 描述 */
  description: string;
  /** 角标数字 */
  badge?: number;
  /** 是否已安装 */
  installed?: boolean;
  /** 下载进度 0-100 */
  downloadProgress?: number;
  /** 版本号 */
  version?: string;
  /** 自定义背景色 */
  bgColor?: string;
}

/* ─── APP 注册中心 ─── */
export const useAppRegistry = defineStore('mini-phone-app-registry', () => {
  /* 已注册的 APP 列表 */
  const apps = ref<AppMeta[]>([]);

  /* 首页显示的 APP（按网格排列） */
  const homeApps = ref<string[]>([]);

  /* ─── 方法 ─── */

  /** 注册一个新 APP */
  function registerApp(app: AppMeta): void {
    const existing = apps.value.findIndex(a => a.id === app.id);
    if (existing >= 0) {
      apps.value[existing] = { ...apps.value[existing], ...app };
    } else {
      // 系统自带 APP 默认安装，商业 APP 默认未安装
      const defaultInstalled = isPreinstalled(app.id);
      apps.value.push({
        ...app,
        installed: app.installed ?? defaultInstalled,
        downloadProgress: app.downloadProgress ?? (defaultInstalled ? 100 : 0),
        version: app.version ?? '1.0.0',
      });
    }
  }

  /** 批量注册 APP */
  function registerApps(appList: AppMeta[]): void {
    for (const app of appList) {
      registerApp(app);
    }
  }

  /** 注销 APP */
  function unregisterApp(appId: string): void {
    apps.value = apps.value.filter(a => a.id !== appId);
    homeApps.value = homeApps.value.filter(id => id !== appId);
  }

  /** 获取 APP 元信息 */
  function getApp(appId: string): AppMeta | undefined {
    return apps.value.find(a => a.id === appId);
  }

  /** 获取 APP 组件 */
  function getAppComponent(appId: string): Component | null {
    const app = getApp(appId);
    return app?.component ?? null;
  }

  /** 更新 APP 角标 */
  function updateBadge(appId: string, badge: number): void {
    const app = apps.value.find(a => a.id === appId);
    if (app) {
      app.badge = badge;
    }
  }

  /** 设置首页显示的 APP */
  function setHomeApps(appIds: string[]): void {
    homeApps.value = appIds;
    persistRegistry();
  }

  /** 添加 APP 到首页 */
  function addToHome(appId: string): void {
    if (!homeApps.value.includes(appId)) {
      homeApps.value.push(appId);
      persistRegistry();
    }
  }

  /** 从首页移除 APP */
  function removeFromHome(appId: string): void {
    homeApps.value = homeApps.value.filter(id => id !== appId);
    persistRegistry();
  }

  /** 按分类获取 APP */
  function getAppsByCategory(category: AppMeta['category']): AppMeta[] {
    return apps.value.filter(a => a.category === category);
  }

  /** 获取已安装的 APP */
  function getInstalledApps(): AppMeta[] {
    return apps.value.filter(a => a.installed);
  }

  /** 获取未安装的 APP */
  function getUninstalledApps(): AppMeta[] {
    return apps.value.filter(a => !a.installed);
  }

  /** 获取首页 APP 列表 */
  function getHomeApps(): AppMeta[] {
    return homeApps.value
      .map(id => apps.value.find(a => a.id === id))
      .filter((a): a is AppMeta => a !== undefined && a.installed === true);
  }

  /** 模拟下载 APP */
  async function downloadApp(appId: string): Promise<void> {
    const app = apps.value.find(a => a.id === appId);
    if (!app || app.installed) return;

    app.downloadProgress = 0;

    // 模拟 iOS 下载进度
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (!app) {
          clearInterval(interval);
          resolve();
          return;
        }
        app.downloadProgress = Math.min((app.downloadProgress || 0) + _.random(5, 15), 100);
        if ((app.downloadProgress || 0) >= 100) {
          clearInterval(interval);
          app.installed = true;
          app.downloadProgress = 100;
          addToHome(appId);
          persistRegistry();
          resolve();
        }
      }, 200);
    });
  }

  /** 卸载 APP */
  function uninstallApp(appId: string): void {
    const app = apps.value.find(a => a.id === appId);
    if (app) {
      app.installed = false;
      app.downloadProgress = 0;
      removeFromHome(appId);
      persistRegistry();
    }
  }

  /** 持久化注册表 */
  function persistRegistry(): void {
    try {
      window.parent.localStorage.setItem(
        'mini-phone-app-registry',
        JSON.stringify({
          homeApps: homeApps.value,
          installedApps: apps.value
            .filter(a => a.installed)
            .map(a => a.id),
        }),
      );
    } catch {
      /* ignore */
    }
  }

  /** 加载注册表 */
  function loadRegistry(): void {
    try {
      const raw = window.parent.localStorage.getItem('mini-phone-app-registry');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.homeApps) {
          homeApps.value = data.homeApps;
        }
        if (data.installedApps) {
          for (const app of apps.value) {
            app.installed = data.installedApps.includes(app.id);
          }
        }
      }
    } catch {
      /* ignore */
    }

    // 如果没有首页 APP 数据，设置默认值
    if (homeApps.value.length === 0) {
      homeApps.value = DEFAULT_HOME_APPS;
    }
  }

  return {
    apps,
    homeApps,
    registerApp,
    registerApps,
    unregisterApp,
    getApp,
    getAppComponent,
    updateBadge,
    setHomeApps,
    addToHome,
    removeFromHome,
    getAppsByCategory,
    getInstalledApps,
    getUninstalledApps,
    getHomeApps,
    downloadApp,
    uninstallApp,
    loadRegistry,
    // 从 icons.ts 导出的工具函数
    getIconPath,
    getAppColor,
  };
});

/* ─── 系统自带 APP（默认安装） ─── */
export const PREINSTALLED_APPS = new Set([
  'phone', 'sms', 'contacts', 'camera', 'gallery',
  'clock', 'calculator', 'calendar', 'notes', 'weather',
  'browser', 'files', 'settings', 'themes', 'notifications',
  'appstore', 'wallet', 'map',
]);

/* ─── 需要下载的 APP（默认未安装，在应用商店中可下载） ─── */
export const DOWNLOADABLE_APPS = new Set([
  'messages', 'forum', 'delivery', 'taxi', 'shop',
  'secondhand', 'movie', 'live', 'music', 'tiktok', 'bilibili',
]);

/* ─── 默认首页 APP 列表（仅系统自带） ─── */
export const DEFAULT_HOME_APPS = [
  'phone', 'sms', 'contacts', 'camera', 'gallery',
  'clock', 'calculator', 'calendar', 'notes', 'weather',
  'browser', 'files', 'wallet', 'map',
  'settings', 'themes', 'notifications', 'appstore',
];

// 重新导出方便使用
export { ICON_PATHS, APP_COLORS, APP_LIST, getIconPath, getAppColor } from '../utils/icons';
