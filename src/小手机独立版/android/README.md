# 安卓 APP 版

当前安卓首版走 PWA 安装：

1. 电脑运行小手机服务。
2. 安卓手机和电脑连接同一个 Wi-Fi。
3. 手机浏览器打开服务显示的局域网地址，例如 `http://192.168.1.23:39231`。
4. 浏览器菜单中选择“添加到主屏幕”或“安装应用”。

安装后它会像普通安卓 App 一样从桌面打开，实际连接的是电脑上的小手机本地服务。

## 后续原生 APK 计划

当 Web/PWA 功能稳定后，再加 Capacitor 壳：

```text
client/ 作为 Web UI
server/ 仍运行在电脑或局域网主机
Android WebView 连接服务地址
```

原生 APK 需要额外安装 Android Studio、Gradle、Capacitor 依赖。当前仓库先保留 PWA APP 版，保证无需额外依赖就能使用。

