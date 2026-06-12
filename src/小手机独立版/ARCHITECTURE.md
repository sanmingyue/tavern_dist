# 架构设计草案

## 三层结构

### 1. 酒馆桥接脚本

运行在酒馆环境中，职责是“翻译酒馆能力”。

它应该尽量薄：

- 监听酒馆事件。
- 读取酒馆上下文。
- 接收本地服务命令并调用酒馆接口。
- 不保存大量业务数据。
- 不渲染完整小手机 UI。

典型事件：

- `tavern.chat.changed`
- `tavern.message.received`
- `tavern.message.edited`
- `tavern.generation.before`
- `tavern.generation.after`

典型命令：

- `tavern.chat.read`
- `tavern.input.append`
- `tavern.generate.raw`
- `tavern.prompt.inject`
- `tavern.worldbook.upsert`

### 2. 本地小手机服务

运行在电脑本地，是独立版的核心。

职责：

- 提供 Web UI 静态资源。
- 提供 HTTP API。
- 提供 WebSocket 实时通信。
- 保存 SQLite 数据。
- 管理图片、语音、附件、贴纸等本地文件。
- 与酒馆桥接脚本保持连接。
- 允许手机在局域网访问。

建议默认地址：

- 电脑本机：`http://127.0.0.1:39231`
- 手机局域网：`http://电脑局域网IP:39231`

端口可以后续做成配置。

### 3. 独立小手机 UI

Vue/Pinia 前端，面向用户。

职责：

- 展示小手机界面。
- 管理交互、拖动、手势、窗口状态。
- 通过服务 API 读写数据。
- 通过 WebSocket 接收实时事件。
- 不直接调用酒馆全局函数。

## 为什么不继续塞在酒馆里

旧版酒馆内 UI 会受到这些限制：

- iframe 高度和布局限制。
- 酒馆页面样式污染或隔离问题。
- localStorage / IndexedDB 容量和迁移不稳定。
- 难以自由管理本地文件。
- 手机访问困难。
- 拖动、浮窗、通知、后台任务都容易被宿主页面限制。

独立版把这些问题转移到本地服务和独立 UI 中处理，酒馆只负责它最擅长的剧情上下文。

## iOS 兼容策略

第一阶段不做原生 iOS App，只做 Safari/PWA 兼容。

使用方式：

1. 电脑启动酒馆与小手机本地服务。
2. 手机与电脑连接同一个 Wi-Fi。
3. iPhone Safari 打开 `http://电脑IP:39231`。
4. 添加到主屏幕后，以类 App 方式打开。

iOS 首阶段目标：

- 页面可打开。
- 布局适配安全区。
- 触摸滚动、长按、输入框不崩。
- WebSocket 能连接电脑服务。
- 断线后能重连。

暂不承诺：

- iPhone 本机永久保存完整数据库。
- iOS 后台常驻。
- 系统级通知。
- 绕过苹果签名安装原生 App。

## 数据边界

建议数据归属：

- 酒馆：聊天原文、角色卡、世界书、预设、生成上下文。
- 小手机服务：联系人、App 消息、论坛、订单、相册、文件、设置、索引记忆。
- 小手机 UI：只保存临时 UI 状态，例如当前打开 App、滚动位置、主题缓存。

## 初始技术建议

- 服务端：Node.js + TypeScript。
- 数据库：SQLite。
- 前端：Vue 3 + Pinia + Vite。
- 实时通信：WebSocket。
- 桌面壳：后期优先 Tauri，若前端生态兼容问题明显再考虑 Electron。
- 安卓壳：后期可用 Capacitor。
- iOS：先 PWA，成熟后再评估 Capacitor + TestFlight。

