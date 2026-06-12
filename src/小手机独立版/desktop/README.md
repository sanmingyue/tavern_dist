# 电脑 APP 版

当前电脑 APP 版使用本地服务 + 浏览器 App 模式：

1. 双击 `start-desktop.cmd`。
2. 它会在后台启动小手机服务。
3. 自动用 Chrome/Edge 的独立 App 窗口打开 `http://127.0.0.1:39231`。

这已经具备桌面 App 的基本体验：独立窗口、可固定到任务栏、本地数据、与酒馆桥接通信。

后续如果需要安装包，再把同一套 `client/` 和 `server/` 封装进 Tauri 或 Electron。

