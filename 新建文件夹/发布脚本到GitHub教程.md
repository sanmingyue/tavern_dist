# 发布酒馆助手脚本到 GitHub + jsdelivr 教程

## 原理说明

通过将打包后的脚本上传到 GitHub 公开仓库，利用 [jsdelivr](https://www.jsdelivr.com/)
为 GitHub 文件提供的免费 CDN 功能，生成一个永久链接。玩家在酒馆助手中只需导入一行 `import` 代码即可加载脚本。

使用 **Git tag 版本号** 来管理版本。**不同项目使用不同的版本号前缀**，互不干扰。

---

## 目录

- [版本号体系](#版本号体系)
- [目录结构](#目录结构)
- **脚本类**
  - [修仙世界脚本](#修仙世界脚本xw-v)
  - [潮汐预设脚本](#潮汐预设脚本cp-v)
  - [小手机脚本](#小手机脚本phone-v)
  - [创意工坊脚本](#创意工坊脚本ws-v)
  - [明月秋青智脑脚本](#明月秋青智脑脚本zhino-v)
  - [秋青子写卡IDE](#秋青子写卡ideide-v)
  - [澜景市地图编辑器](#澜景市地图编辑器map-v)
  - [酒馆联机脚本](#酒馆联机脚本online-v)
  - [8bit的幻想控制台](#8bit的幻想控制台8bit-v)
  - [NAI 生图脚本](#nai-生图脚本nai-v)
- **CDN 资源**
  - [预设JSON文件](#预设json文件preset-v)
  - [角色卡PNG文件](#角色卡png文件char-v)
  - [点赞致谢数据](#点赞致谢数据reactions-v)
- [常用命令](#常用命令)
- [重要链接](#重要链接)

---

## 版本号体系

| 项目                 | 版本号前缀     | 示例                | 说明                                                                  |
| -------------------- | -------------- | ------------------- | --------------------------------------------------------------------- |
| 修仙世界脚本         | `xw-v`         | `xw-v1.1.3`         | 状态栏 + CE脚本                                                       |
| 潮汐预设脚本         | `cp-v`         | `cp-v2.0.8`         | 预设悬浮窗 + 预设仓库                                                 |
| 预设JSON文件         | `preset-v`     | `preset-v2.0.6`     | CDN分发的预设文件                                                     |
| 角色卡PNG文件        | `char-v`       | `char-v1.0.0`       | CDN分发的角色卡PNG                                                    |
| 点赞致谢数据         | `reactions-v`  | `reactions-v1.0.0`  | CDN分发的点赞JSON数据                                                 |
| 小手机脚本           | `phone-v`      | `phone-v0.2.2`      | 虚拟手机模拟器                                                        |
| 创意工坊脚本         | `ws-v`         | `ws-v2.1.1`         | 创意工坊悬浮窗（Zeabur后端）                                          |
| **秋青子写卡IDE**    | **`ide-v`**    | **`ide-v1.0.16`**   | **写卡预设全屏IDE工作环境**                                           |
| **澜景市地图编辑器** | **`map-v`**    | **`map-v1.0.2`**    | **世界书地图树状编辑器**                                              |
| **酒馆联机脚本**     | **`online-v`** | **`online-v0.2.2`** | **多人 AIRP 联机房间（SSE实时通信 + Zeabur后端）**                    |
| **8bit的幻想控制台** | **`8bit-v`**   | **`8bit-v1.0.8`**   | **8bit 世界 AIRP 前端控制台正式入口**                                 |
| **卫疏影开局脚本**   | **`wsy-v`**    | **`wsy-v0.0.1`**    | **卫疏影角色卡开局导入脚本**                                          |
| **明月秋青智脑脚本** | **`zhino-v`**  | **`zhino-v4.0.0`**  | **智脑系统：大总结+梦呓+倒果为因+NSFW隔离+情绪积累+后台角色行动推演** |
| **青春的果实状态栏** | **`fruit-v`**  | **`fruit-v5.0.0`**  | **青春的果实角色卡 MVU 状态栏悬浮窗**                                 |
| **onion状态栏**      | **`onion-v`**  | **`onion-v0.0.1`**  | **一脸嫌弃给你看胖次的onion IF线状态栏**                              |
| **NAI 生图脚本**     | **`nai-v`**    | **`nai-v0.0.2`**    | **NovelAI 生图面板 + 楼层自动生图 + 提示词助手**                      |

> 每个项目的版本号独立递增，互不影响。

---

## 目录结构

```
C:\Users\三明月\Desktop\三明月\           ← 当前 GitHub/CDN 仓库（源码 + 打包产物）
├── src\明月秋青脚本\                     ← 明月秋青智脑脚本源码
├── src\创意工坊\                         ← 创意工坊脚本源码
├── src\修仙世界状态栏\                   ← 修仙世界状态栏源码
├── src\修仙世界重置版\脚本\CE脚本\       ← 修仙世界CE脚本源码
├── src\潮汐预设脚本\                     ← 潮汐预设脚本源码
├── src\澜景市地图编辑器\                 ← 澜景市地图编辑器源码
├── src\8bit的幻想\脚本\控制台\           ← 8bit的幻想控制台源码
├── 我的预设\                             ← 预设JSON文件（源）
├── 我的角色卡\                           ← 角色卡PNG文件（源）
└── dist\                                ← CDN 分发目录（提交到 GitHub）
    ├── 创意工坊\index.js
    ├── 修仙世界状态栏\index.js
    ├── 修仙世界重置版\脚本\CE脚本\index.js
    ├── 潮汐预设脚本\index.js
    ├── 小手机\index.js
    ├── 澜景市地图编辑器\index.js
    ├── 酒馆联机脚本\index.js
    ├── 8bit的幻想\脚本\控制台\index.js
    ├── presets\                         ← CDN分发的预设JSON
    ├── characters\                      ← CDN分发的角色卡PNG
    └── reactions\                       ← CDN分发的点赞数据

C:\Users\三明月\Desktop\workshop-server\  ← 创意工坊后端（独立仓库，部署在Zeabur）
```

---

## 脚本类

---

### 明月秋青智脑脚本（zhino-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@zhino-v4.0.0/dist/明月秋青脚本/index.js';
```

**一键更新**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && git add "src\明月秋青脚本" "dist\明月秋青脚本" "新建文件夹\发布脚本到GitHub教程.md" && git commit -m "明月秋青智脑脚本 v4.0.0" && git tag zhino-v4.0.0 && git push && git push origin zhino-v4.0.0
```

**版本历史**

| 版本号       | 日期       | 更新内容                                                                                                                                                                                                                    |
| ------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| zhino-v4.0.0 | 2026-06-03 | B3.3 大版本发布：后台角色行动推演系统、大总结 Delta 增量存储、串行调度 v2、角色库 NSFW 记忆和逻辑树展示、梦呓多角色修复、数据导入 safeParse 校验、倒计时和楼层隐藏修复                                                      |
| zhino-v1.0.0 | 2026-05-25 | 正式发布：智脑系统v1.0，包含大总结（含NSFW第四SECTION）、梦呓分析（含NSFW分流）、倒果为因（剧情走向预测+节奏控制）、NSFW隔离层（自动检测预设变量）、情绪积累系统（走预设流程读世界书）、撤回/恢复机制、历史楼层补录fallback |

---

### 青春的果实状态栏（fruit-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@fruit-v5.0.0/dist/青春的果实/状态栏/index.js';
```

**一键更新**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm sync bundle 青春的果实 && pnpm build && git add "src\青春的果实" "dist\青春的果实" "新建文件夹\发布脚本到GitHub教程.md" tavern_sync.yaml && git commit -m "青春的果实 v5.0.0" && git tag fruit-v5.0.0 && git push && git push origin fruit-v5.0.0
```

**版本历史**

| 版本号       | 日期       | 更新内容                                                                                                                                                                                                                                    |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| fruit-v5.0.0 | 2026-06-03 | 大版本更新：新增告白事件长线世界书、变量规则正式回应判定、告白/恋人阶段 CDN 视觉资源、花嫁头像与背景、恋人专属边框，并同步状态栏沉浸背景                                                                                                    |
| fruit-v0.1.2 | 2026-05-31 | 沉浸模式重新设计：角色图片改CDN引用(非base64内联)、定时自查确保状态栏在最新AI楼层、沉浸面板嵌入左侧内容区域(非浮动弹框)、角色横版立绘铺满背景、滚动条隐藏、三段命名(内心独白/戏外吐槽/对你的看法)、点击角色卡片直接进入沉浸模式、手机端适配 |
| fruit-v0.0.4 | 2026-05-30 | 修正：删除CDN中不需要的变量结构脚本                                                                                                                                                                                                         |
| fruit-v0.0.3 | 2026-05-30 | 重构FAB操作逻辑(保持原UI)，新增变量结构脚本(本地)，补充世界书(学校/方言/背景)                                                                                                                                                               |
| fruit-v0.0.2 | 2026-05-30 | 重构为 FAB+面板模式：修复无法点击/拖动，FAB 可拖动+位置持久化，PC端面板可拖动，手机端底部抽屉+遮罩+下拉关闭手势                                                                                                                             |
| fruit-v0.0.1 | 2026-05-30 | 初始发布：青春的果实 MVU 状态栏悬浮窗，含11位角色头像内联、好感度/关系状态/关键事件展示、高考倒计时、三层展开交互                                                                                                                           |

---

### onion状态栏（onion-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@onion-v0.0.6/dist/一脸嫌弃给你看胖次的onion/状态栏/index.js';
```

**一键更新**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && New-Item -ItemType Directory -Force "dist\一脸嫌弃给你看胖次的onion\状态栏\assets" && Copy-Item "src\一脸嫌弃给你看胖次的onion\图片\*.png" "dist\一脸嫌弃给你看胖次的onion\状态栏\assets\" -Force && git add "src\一脸嫌弃给你看胖次的onion" "dist\一脸嫌弃给你看胖次的onion" "新建文件夹\发布脚本到GitHub教程.md" && git commit -m "onion状态栏更新" && git tag onion-v0.0.X && git push && git push origin onion-v0.0.X
```

**版本历史**

| 版本号       | 日期       | 更新内容                                                                                                                     |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------- |
| onion-v0.0.1 | 2026-06-01 | 初始发布：IF线生成器状态栏，含MVU变量结构脚本、PC端沉浸模式、手机端内联展开、generateRaw调用AI生成平行世界线短文、打字机效果 |

---

### NAI 生图脚本（nai-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@nai-v0.0.2/dist/nai生图脚本/index.js';
```

**一键更新**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && git add "src\nai生图脚本" "dist\nai生图脚本" "新建文件夹\发布脚本到GitHub教程.md" && git commit -m "NAI 生图脚本 v0.0.2" && git tag nai-v0.0.2 && git push && git push origin nai-v0.0.2
```

**版本历史**

| 版本号     | 日期       | 更新内容                                                                                                                                                                                  |
| ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| nai-v0.0.2 | 2026-06-10 | 移除前端订阅接口“测试账号”入口，避免订阅接口在酒馆浏览器环境中因代理、跨域或扩展拦截造成误报；接口页保留真实生图测试，并确认新 AI 楼层自动捕获、按楼层渲染图片与重新生成按钮 |
| nai-v0.0.1 | 2026-06-10 | 正式发布：NovelAI API 生图面板、AI 楼层 `<nai-image>` 自动捕获与首次自动生成、浏览器 7 天图片缓存、重新生成/保存图片、会员免费范围提醒、作者串与 NAI 参数设置、独立 OpenAI 兼容提示词助手 |

---

### 卫疏影开局脚本（wsy-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@wsy-v0.0.1/dist/卫疏影/index.js';
```

**一键更新**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && git add "src\卫疏影" "dist\卫疏影" "新建文件夹\发布脚本到GitHub教程.md" && git commit -m "卫疏影开局脚本更新" && git tag wsy-v0.0.X && git push && git push origin wsy-v0.0.X
```

**版本历史**

| 版本号     | 日期       | 更新内容                                                                                             |
| ---------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| wsy-v0.0.1 | 2026-05-12 | 初始发布：修复 ready 页面导入角色图显示（左侧竖长方形立绘）、删除背景下雪动画、写完0层后自动关闭脚本 |

---

### 8bit的幻想控制台（8bit-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@8bit-v1.0.9/dist/8bit的幻想/脚本/控制台/index.js';
```

**一键更新**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && New-Item -ItemType Directory -Force "dist\8bit的幻想\脚本\控制台\assets" "dist\8bit的幻想\专属预设和世界书" && Copy-Item "src\8bit的幻想\脚本\控制台\图片素材\*.png" "dist\8bit的幻想\脚本\控制台\assets\" -Force && Copy-Item "src\8bit的幻想\专属预设和世界书\*.json" "dist\8bit的幻想\专属预设和世界书\" -Force && git add "src\8bit的幻想" "dist\8bit的幻想" "新建文件夹\发布脚本到GitHub教程.md" && git commit -m "8bit的幻想 v1.0.9" && git tag 8bit-v1.0.9 && git push && git push origin 8bit-v1.0.9
```

**版本历史**

| 版本号      | 日期       | 更新内容                                                                                                                                                                                                                                     |
| ----------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8bit-v1.0.9 | 2026-05-17 | 玩家反馈修正版：正文/NPC连续发送加提交锁和忙碌保护；NPC/路人草案生成改为 raw 工具调用并清洗外层标签；8bit 专属预设补强地点、人物、奖励、任务阶段检查；手机线索弹窗恢复内部滚动，退出改为左上角三击唤出                                       |
| 8bit-v1.0.8 | 2026-05-16 | 专属资源读取修复版：参考潮汐预设脚本的 CDN 仓库导入方式，修复打包后资源 URL 被编译成本机 `file:///C:/...` 导致 `Failed to fetch`；预设导入名改为不带 `.json`，资源读取增加多 CDN / GitHub raw 回退，世界书继续按条目名合并以保留玩家个人条目 |
| 8bit-v1.0.7 | 2026-05-16 | 专属资源导入版：菜单新增“资源”页，可一键导入并启用 8bit 专属预设；专属静态世界书改为运行时 CDN 资源，按条目名同名覆盖、缺失新增并保留玩家个人条目，同时启用为全局世界书                                                                      |
| 8bit-v1.0.6 | 2026-05-16 | 玩家反馈修正版：任务奖励和怪物掉落改为前端快照权威，接取/推进阶段禁止正文写成已发奖或升级；手机浏览器内全屏适配、可见安全退出键和正文发送触摸兜底修复                                                                                        |
| 8bit-v1.0.5 | 2026-05-16 | 1.0 章节收口修正版：补齐任务阶段、NPC话题、同伴技能与装备、加点/转职、商城购买、小怪掉落和大总结导入闸门；普通小怪战斗保持前端结算，隐藏大总结格式错误时不污染存档                                                                           |
| 8bit-v1.0.4 | 2026-05-16 | 勇者素材收尾版：玩家姓名继续映射到 HUD、队伍、装备和战斗；男/女勇者正式立绘与 Q 版按开场性别映射，战斗小人不再缺图；物理、魔法、治疗三类 4 帧特效保持统一兜底                                                                                |
| 8bit-v1.0.3 | 2026-05-15 | 装载验收修正版：动态玩家身份世界书、正文生成提示、任务叙事摘要和用户可见文案中残留的“AI”改为“你/正文”，不改变 1.0 内容封包                                                                                                                   |
| 8bit-v1.0.2 | 2026-05-15 | AIRP 场景接触测试版：主页面新增线索抽屉、NPC 交谈态和危险确认入口；地图/NPC/任务/遭遇统一走确认弹框，前端先权威结算，再用酒馆预设写正文日志                                                                                                  |
| 8bit-v1.0.1 | 2026-05-15 | 开场身份精调测试版：创建身份拆为用户名、性别、详细人设，玩家身份按 YAML 写入当前聊天世界书；旧存档身份迁移、载入/导入存档自动恢复聊天世界书绑定，并同步状态、现实投影、战斗 actor、AI 开场白与局势摘要的用户名/性别映射                      |
| 8bit-v1.0.0 | 2026-05-14 | 正式发布：四纹章巡礼版固定封包，接入内容包版本、章节迁移、72 条任务范围、43 条新增固定支线、奖励类别显示与最小任务完成接口；停在魔王城外缘远望，不进入魔王城内部、最终战或莱姆完整人设                                                       |
| 8bit-v0.3.5 | 2026-05-10 | 修复立绘 z-index 层级：portrait(z:1) 在 story-dialog(z:2) 后面，正文对话框自然遮住立绘下半身                                                                                                                                                 |
| 8bit-v0.3.4 | 2026-05-10 | 修复立绘 CSS：恢复正常大小 max-height:55vh，不偏出画面，正文对话框自然遮住下半身，角色不居中切割                                                                                                                                             |
| 8bit-v0.3.3 | 2026-05-10 | P5 全屏层系统优化：ESC 分层导航、大地图覆盖、战斗转写按 encounterId 关闭、移动端三连击退出                                                                                                                                                   |
| 8bit-v0.1.1 | 2026-05-10 | 重构为 AIRP 正文舞台：正文居中承载玩法，地图/状态/任务/背包改为辅助信息，战斗结束后支持把前端结算记录一键写成正文                                                                                                                            |
| 8bit-v0.1.0 | 2026-05-10 | 初始测试发布：M13 第一版内容闭环，包含现实身份创建、8bit 手表、状态、地图、战斗、背包装备、任务、NPC、叙述、成就、时间、现实与调试模块                                                                                                       |

---

### 澜景市地图编辑器（map-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@map-v1.0.2/dist/澜景市地图编辑器/index.js';
```

**一键更新**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && git add "src\澜景市地图编辑器" "dist\澜景市地图编辑器" "新建文件夹\发布脚本到GitHub教程.md" && git commit -m "澜景市地图编辑器更新" && git tag map-v1.0.X && git push && git push origin map-v1.0.X
```

**版本历史**

| 版本号     | 日期       | 更新内容                                                                                     |
| ---------- | ---------- | -------------------------------------------------------------------------------------------- |
| map-v1.0.2 | 2026-05-08 | 新增地图画布拖拽平移、滚轮缩放和缩放比例显示；保存、改层级、移动后自动重新分类并聚焦到新位置 |
| map-v1.0.1 | 2026-05-08 | 修正世界书条目分类映射，新增向下分层地图视图、地图编辑面板和 minimap                         |
| map-v1.0.0 | 2026-05-08 | 初始发布：世界书地图树状编辑器                                                               |

---

### 酒馆联机脚本（online-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@online-v0.2.2/dist/酒馆联机脚本/index.js';
```

**后端服务**（与创意工坊共用）

- 后端仓库：https://github.com/sanmingyue/workshop-server
- 部署在 Zeabur：https://sanmingyue.zeabur.app

**前端更新流程**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && git add "src\酒馆联机脚本" "dist\酒馆联机脚本" "新建文件夹\发布脚本到GitHub教程.md" && git commit -m "酒馆联机脚本更新" && git tag online-v0.2.X && git push && git push origin online-v0.2.X
```

**后端更新流程**（修改后端代码后）

```bash
cd C:\Users\三明月\Desktop\workshop-server
git add . && git commit -m "联机后端更新" && git push origin main
# Zeabur 会自动检测 GitHub 更新并重新构建
```

**版本历史**

| 版本号        | 日期       | 更新内容                                                                                                                                                                                                                       |
| ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| online-v0.2.2 | 2026-05-09 | v2大改造：准备系统（玩家ready后房主才能开轮）、角色名+人设（加入时填写，导演提示词注入）、字数范围（min~max替代固定值）、重Roll按钮（回退finalized到integrating）、finalize后30秒清理候选、每10轮自动大总结、去emoji、候选裁剪 |
| online-v0.1.8 | 2026-05-09 | 新增内容裁剪/过滤功能：可配置保留（如 `<content>...</content>`）或删除（如 `[metacognition]...</thinking>`）标签规则，应用于候选回复、导演输出、历史正文和酒馆同步                                                             |
| online-v0.1.7 | 2026-05-09 | 新增剧情正文区（开场白+历史轮次正文边看边写）、修复创建房间 INSERT 占位符缺失导致的 HTTP 500                                                                                                                                   |
| online-v0.1.6 | 2026-05-09 | 架构重构：SSE 实时推送替代轮询（≤100ms延迟）、候选生成异步解耦、酒馆 API 手动同步、房主断线自动转移、组件拆分（App.vue 2075→338行）、手机端底部 Tab 导航、状态引导横幅、历史轮次浏览                                           |
| online-v0.1.5 | -          | 初始版本：3秒轮询、候选阻塞提交、自动酒馆同步                                                                                                                                                                                  |

---

### 秋青子写卡IDE（ide-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@ide-v1.0.16/dist/秋青子写卡预设/伪IDE/index.js';
```

**一键更新**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && git add "src\秋青子写卡预设" "dist\秋青子写卡预设" "新建文件夹\发布脚本到GitHub教程.md" && git commit -m "秋青子写卡IDE更新" && git tag ide-v1.0.X && git push && git push origin ide-v1.0.X
```

**版本历史**

| 版本号      | 日期       | 更新内容                                                                                                                                                                                                                     |
| ----------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ide-v1.0.16 | 2026-05-15 | 修复宝宝辅食写入世界书夹带内部说明：实际正文不再写入处理边界、最初想法、还不确定和待补充占位；同时为条目属性设置增加世界书直写兜底，避免正文已写入但配置停留在默认 D4/system                                                 |
| ide-v1.0.15 | 2026-05-15 | 修复秋青子聊天面板漏显示助手回复：酒馆助手返回的助手楼层可能没有 `is_hidden` 字段，前端改为读取全部楼层后只排除明确隐藏的楼层，并同步修复旧聊天收纳逻辑                                                                      |
| ide-v1.0.14 | 2026-05-15 | 修复秋青子聊天面板偶发不同步助手回复：在角色消息渲染、消息接收、生成结束、消息更新和聊天切换后进行延迟补抓，避免酒馆正文已显示但右侧聊天栏仍停留在用户消息                                                                   |
| ide-v1.0.13 | 2026-05-15 | 移除宝宝辅食页面顶部内部说明文案，第一屏直接进入“准备本卡世界书”，避免把系统处理语汇展示给新手作者                                                                                                                           |
| ide-v1.0.12 | 2026-05-15 | 新增宝宝辅食世界书创建并绑定步骤，后续写入自动使用当前角色绑定世界书；修正前端任务写入当前角色正则；前端美化补齐世界书源文件、D0 配置和角色正则，并新增宝宝模式页面预览                                                      |
| ide-v1.0.11 | 2026-05-15 | 修复宝宝辅食 MVU 写入路径：变量结构脚本写入当前角色，MVU 世界书条目写入目标世界书，避免把世界书名当成角色名导致预检阻塞                                                                                                      |
| ide-v1.0.10 | 2026-05-15 | 重做宝宝辅食 MVU 基础变量：预设只开启变量结构脚本、初始变量和变量更新规则；变量列表、变量输出格式和变量输出格式强调改为前端固定模板自动写入；修正变量列表标签、结构脚本收尾、initvar D4 禁用配置，并支持固定选项变量         |
| ide-v1.0.9  | 2026-05-15 | 新增宝宝辅食上下文收纳：右侧秋青子面板显示聊天 token 估算，超过约 6W 提醒收起旧楼层；完成任务按钮会确认后把旧楼层快照存入 chat 变量并隐藏到最新楼层；MVU 基础变量减少开启条目，固定格式由前端生成写入计划                    |
| ide-v1.0.8  | 2026-05-15 | 优化宝宝辅食任务：世界观改为聊天生成+工作台收稿；宝宝模式移除完整 EJS 工作流，只保留多阶段人设；新增衣柜精简表单，并继续弱化可见技术术语                                                                                     |
| ide-v1.0.7  | 2026-05-14 | 收紧宝宝辅食自然语言体验：聊天栏只展开 `<content>` 正文；任务列表改为用户说明；隐藏第一步、产物、知识引用和硬边界等内部说明；MVU/EJS 不再让用户手写英文类型、`stat_data` 路径或代码条件，状态栏和多阶段自动读取 MVU 基础变量 |
| ide-v1.0.6  | 2026-05-14 | 修正宝宝辅食任务运行链路：只切换一般条目/MVU条目区间内的专项预设，核心预设骨架保持常驻；发送与右侧陪写前自动切换当前任务条目，并优化 PC 宽屏布局                                                                             |
| ide-v1.0.5  | 2026-05-14 | 明确拆分“MVU前端状态栏”和“前端美化”两个任务；宝宝辅食模式隐藏硬边界、写入路径和函数名等技术细节；品牌名统一为“明月秋青”                                                                                                      |
| ide-v1.0.4  | 2026-05-14 | 将宝宝辅食秋青子占位头像替换为真实透明背景 Q 版绿树蟒蛇娘秘书头像，并压缩为适合 UI 内联的轻量 PNG                                                                                                                            |
| ide-v1.0.3  | 2026-05-14 | 收紧宝宝辅食陪写知识引用：文字人设不再默认读取“一般条目自查”，调色盘不再默认引用“创作原则-绝对零度”，避免旧八股自查逻辑混入                                                                                                  |
| ide-v1.0.2  | 2026-05-13 | 新增宝宝辅食专属秋青子陪写面板：Q版占位、聊天气泡、字段级灰色引导、锁定酒馆世界书“写卡知识库”和当前预设条目的 WTC/LTC 辅助提示；标准/专业模式保持原版聊天工作流                                                              |
| ide-v1.0.1  | 2026-05-13 | 修复宝宝辅食角色基础路径：目标世界书与角色姓名分离；dryrun 识别前置 CreateLorebook 后续写入，不再误判不可写                                                                                                                  |
| ide-v1.0.0  | 2026-05-13 | 正式版发布：写卡工坊三模式工作台、宝宝辅食表单、前端产物预览、MVU/EJS/YAML硬约束生成、dryrun/apply写入计划与专家工作区保留                                                                                                   |
| ide-v0.1.1  | 2026-05-06 | HTML纯静态预览（编辑/预览Tab切换+iframe渲染）、聊天栏附加文件按钮                                                                                                                                                            |
| ide-v0.1.0  | 2026-05-06 | 空世界书可见、世界书新建条目按钮、世界书条目属性编辑面板（触发策略/插入位置/深度/顺序/关键词/递归/效果）                                                                                                                     |
| ide-v0.0.9  | 2026-05-06 | 角色卡切换修复（triggerSlash实现真实切换）、聊天消息智能分区（思维链🌙折叠/正文📝展开/LTC🔧折叠）、编辑区保存+恢复按钮                                                                                                       |
| ide-v0.0.8  | 2026-05-06 | 流式AI回复显示、AI操作后自动刷新文件树、定时刷新                                                                                                                                                                             |
| ide-v0.0.1  | 2026-05-06 | 初始发布：全屏IDE布局（PC三栏+手机Tab）、虚拟文件系统（世界书+角色卡+预设条目）、AI活动日志、LTC操作捕获、角色卡CRUD、预设条目管理、禁用提示词模板+酒馆助手宏联合开关                                                        |

---

### 创意工坊脚本（ws-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@ws-v2.1.1/dist/创意工坊/index.js';
```

**后端服务**

- 后端仓库：https://github.com/sanmingyue/workshop-server
- 部署在 Zeabur：https://sanmingyue.zeabur.app
- 管理后台：https://sanmingyue.zeabur.app/admin

**更新流程**

```bash
cd C:\Users\三明月\Desktop\三明月
pnpm build
git add "src\创意工坊" "dist\创意工坊" "新建文件夹\发布脚本到GitHub教程.md"
git commit -m "创意工坊脚本更新"
git tag ws-v2.X.X
git push
git push origin ws-v2.X.X
```

**后端更新流程**（修改后端代码后）

```bash
cd C:\Users\三明月\Desktop\workshop-server
git add . && git commit -m "更新描述" && git push origin main
# Zeabur 会自动检测 GitHub 更新并重新构建
```

**版本历史**

| 版本号    | 日期       | 更新内容                                                                                                                                                                             |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ws-v2.1.1 | 2026-05-08 | 作品更新面板重构：支持封面替换、资源文件替换、完整信息修改（原位替换保留点赞评论收藏）；后端 PUT 路由支持 card_file 双字段上传                                                       |
| ws-v2.1.0 | 2026-05-07 | 新增角色卡(character)类型；regex/worldbook/character改为文件上传；card_addon新增子类型(worldbook/regex/persona)；persona下载改为完整世界书文件；后端下载去重(同用户同作品不重复计数) |
| ws-v2.0.4 | 2026-05-07 | 优化手机端广场分类导航：分类 Tab 独占横向滑动行，排序控件下移，补齐横向触摸滑动与惯性滚动约束                                                                                        |
| ws-v2.0.3 | 2026-05-07 | 加固移动端滚动容器：广场、我的作品、上传、个人页弹层与列表补齐 min-height、惯性滚动与触摸滚动约束，修复手机弹出卡片可能无法滚动的问题                                                |
| ws-v2.0.2 | 2026-05-07 | 修正顶部与个人页致谢文案，界面显示版本号同步到 v2.0.2，并更新署名为三明月肚子疼                                                                                                      |
| ws-v2.0.1 | 2026-05-07 | 前后端契约对接：真实合集子作品、评论区、收藏、历史下载、作者更新作品、角色名字段与后端审核流程适配                                                                                   |
| ws-v2.0.0 | 2026-05-05 | v2: 5种内容类型(正则/人设/角色卡配套/世界书/作者合集)、酒馆直接导入、PNG角色卡上传、确认弹窗、管理后台密码显示                                                                       |
| ws-v1.0.0 | 2026-05-05 | 初始发布：Discord登录、作品上传/审核/下载、悬浮窗界面                                                                                                                                |

---

### 修仙世界脚本（xw-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@xw-v1.1.3/dist/修仙世界状态栏/index.js';
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@xw-v1.1.3/dist/修仙世界重置版/脚本/CE脚本/index.js';
```

**一键更新**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && git add "src\修仙世界状态栏" "src\修仙世界重置版\脚本\CE脚本" "dist\修仙世界状态栏" "dist\修仙世界重置版\脚本\CE脚本" "新建文件夹\发布脚本到GitHub教程.md" && git commit -m "修仙世界脚本更新" && git tag xw-v1.1.X && git push && git push origin xw-v1.1.X
```

---

### 潮汐预设脚本（cp-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@cp-v2.0.8/dist/潮汐预设脚本/index.js';
```

**一键更新**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && git add "src\潮汐预设脚本\presetCatalog.ts" "dist\潮汐预设脚本\index.js" "dist\潮汐预设脚本\index.js.map" "新建文件夹\发布脚本到GitHub教程.md" && git commit -m "潮汐预设脚本 v2.0.8" && git tag cp-v2.0.8 && git push && git push origin cp-v2.0.8
```

**版本历史**

| 版本号    | 日期       | 更新内容                                                                                                                                                                               |
| --------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cp-v2.0.8 | 2026-06-09 | 预设仓库排序调整：将“明月秋青 Maya”移动到最上方；预设资源版本号仍为 `preset-v2.0.6`                                                                                                    |
| cp-v2.0.7 | 2026-06-09 | 预设仓库新增“明月秋青 Maya”，标签 Gemini，展示更新日期 2026.6.9，介绍“最强的Gemini预设”；预设资源版本号升至 `preset-v2.0.6`                                                            |
| cp-v2.0.6 | 2026-06-05 | 预设仓库资源版本号升至 `preset-v2.0.5`，修复“明月秋青 by oneself”变量初始化对齐问题                                                                                                    |
| cp-v2.0.5 | 2026-06-05 | 预设仓库资源版本号升至 `preset-v2.0.4`，重新发布“明月秋青 by oneself”预设修复，展示更新日期改为 2026.6.5                                                                               |
| cp-v2.0.4 | 2026-06-04 | 预设仓库资源版本号升至 `preset-v2.0.3`，重新发布“明月秋青 by oneself”预设修复                                                                                                          |
| cp-v2.0.3 | 2026-06-04 | 预设仓库资源版本号升至 `preset-v2.0.2`，重新发布“明月秋青 Synapse Memory Yield”预设修复                                                                                                |
| cp-v2.0.2 | 2026-06-04 | 预设仓库更新：修复“明月秋青 Synapse Memory Yield”预设小问题，预设资源版本号升至 `preset-v2.0.1`                                                                                        |
| cp-v2.0.1 | 2026-06-04 | 发布修正版：预设仓库资源版本号升至 `preset-v2.0.0`，同步更新“明月秋青 by oneself”预设发布资源                                                                                          |
| cp-v2.0.0 | 2026-06-04 | 大版本更新：新增亮色模式、顶部字体大小 1/2/3 快捷档位；预设仓库新增“明月秋青 by oneself”，标签 Gemini/Claude/DSV4PRO，并显示更新日期 2026.6.4；仓库预设资源版本号升至 `preset-v1.2.12` |
| cp-v1.5.6 | 2026-05-19 | 预设仓库更新：明月秋青 Synapse Memory Yield 预设更新，CDN 预设版本号升至 preset-v1.2.11                                                                                                |
| cp-v1.5.4 | 2026-05-19 | 预设仓库更新：删除"明月秋青 Bad End"，新增"明月秋青 Synapse Memory Yield"（Claude/Gemini/最懂你的预设），CDN 预设版本号升至 preset-v1.2.9                                              |

---

### 小手机脚本（phone-v）

**CDN 链接**

```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@phone-v0.2.2/dist/小手机/index.js';
```

**一键更新**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && git add "src\小手机" "dist\小手机" "新建文件夹\发布脚本到GitHub教程.md" && git commit -m "小手机脚本更新" && git tag phone-v0.2.X && git push && git push origin phone-v0.2.X
```

**版本历史**

| 版本号       | 日期       | 更新内容                                                                                                                                                                                                                                                                             |
| ------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| phone-v0.2.2 | 2026-05-07 | 版本更新                                                                                                                                                                                                                                                                             |
| phone-v0.2.1 | 2026-05-06 | 更新表情包；调整闪讯内容结构；增加手机页面最右端左滑退出 APP 的逻辑                                                                                                                                                                                                                  |
| phone-v0.2.0 | 2026-05-05 | 大版本重构：完整重构 phone-store（新 schema + 世界书持久化）、30+ 个 APP（中英文双套）、4层记忆系统（原文/总结/结构化/核心）、AI 生成管线（generateRaw + XML 解析）、IndexedDB 本地存储、向量记忆检索、闪讯社交标签（好友/拉黑/删好友）、操作总结 + 世界书持久化、壁纸/主题/头像系统 |
| phone-v0.1.8 | -          | 初始发布版本                                                                                                                                                                                                                                                                         |

---

## CDN 资源

---

### 预设JSON文件（preset-v）

预设文件发布到当前仓库的 `dist/presets/` 目录，CDN 路径使用 `preset-v` 版本号，避免 CDN 缓存导致玩家下载到旧文件。

> `preset-v` 标签是整个仓库快照。新增或更新一个预设时，`dist/presets/`
> 必须保留预设仓库会引用的全部 JSON 文件，只提交变更文件可以，但不能让新标签里的目录只剩本次更新的文件。

**更新流程**

`dist/presets/` 是当前仓库已有的预设发布目录，不要在桌面或 `dist` 外另建发布目录。

```powershell
cd C:\Users\三明月\Desktop\三明月
Copy-Item -LiteralPath "我的预设\要发布的预设.json" -Destination "dist\presets\要发布的预设.json" -Force
git add "dist\presets\要发布的预设.json"
git commit -m "更新预设文件"
git tag preset-v1.X.X
git push
git push origin preset-v1.X.X
```

---

### 角色卡PNG文件（char-v）

角色卡PNG发布到当前仓库的 `dist/characters/` 目录下。

**更新流程**

```powershell
cd C:\Users\三明月\Desktop\三明月
New-Item -ItemType Directory -Force "dist\characters"
Copy-Item "我的角色卡\*.png" "dist\characters\" -Force
git add "dist\characters"
git commit -m "更新角色卡文件"
git tag char-v1.0.X
git push
git push origin char-v1.0.X
```

---

### 点赞致谢数据（reactions-v）

```powershell
cd C:\Users\三明月\Desktop\三明月
New-Item -ItemType Directory -Force "dist\reactions"
Copy-Item "预设点赞致谢\reactions_*.json" "dist\reactions\reactions.json" -Force
git add "dist\reactions\reactions.json"
git commit -m "更新点赞致谢数据"
git tag reactions-v1.0.X
git push
git push origin reactions-v1.0.X
```

---

## 常用命令

```bash
# 查看所有标签（按时间倒序）
cd C:\Users\三明月\Desktop\三明月 && git tag --sort=-creatordate

# 只看某个项目的标签
git tag -l "ws-v*" --sort=-creatordate     # 创意工坊
git tag -l "xw-v*" --sort=-creatordate     # 修仙世界
git tag -l "cp-v*" --sort=-creatordate     # 潮汐预设
git tag -l "preset-v*" --sort=-creatordate # 预设文件
git tag -l "char-v*" --sort=-creatordate   # 角色卡文件
git tag -l "phone-v*" --sort=-creatordate  # 小手机
git tag -l "reactions-v*" --sort=-creatordate # 点赞致谢
git tag -l "online-v*" --sort=-creatordate   # 酒馆联机
git tag -l "8bit-v*" --sort=-creatordate     # 8bit的幻想
git tag -l "wsy-v*" --sort=-creatordate      # 卫疏影
```

---

## 重要链接

| 项目                        | 链接                                                           |
| --------------------------- | -------------------------------------------------------------- |
| GitHub 仓库（CDN）          | https://github.com/sanmingyue/tavern_dist                      |
| GitHub 仓库（创意工坊后端） | https://github.com/sanmingyue/workshop-server                  |
| 创意工坊后端                | https://sanmingyue.zeabur.app                                  |
| 创意工坊管理后台            | https://sanmingyue.zeabur.app/admin                            |
| jsdelivr 官网               | https://www.jsdelivr.com/                                      |
| **秋青子写卡IDE CDN**       | `@ide-v1.0.16/dist/秋青子写卡预设/伪IDE/index.js`              |
| **澜景市地图编辑器 CDN**    | `@map-v1.0.2/dist/澜景市地图编辑器/index.js`                   |
| **8bit的幻想 CDN**          | `@8bit-v1.0.8/dist/8bit的幻想/脚本/控制台/index.js`            |
| 创意工坊脚本 CDN            | `@ws-v2.1.1/dist/创意工坊/index.js`                            |
| 修仙世界状态栏 CDN          | `@xw-v1.1.3/dist/修仙世界状态栏/index.js`                      |
| 修仙世界CE脚本 CDN          | `@xw-v1.1.3/dist/修仙世界重置版/脚本/CE脚本/index.js`          |
| 潮汐预设脚本 CDN            | `@cp-v2.0.8/dist/潮汐预设脚本/index.js`                        |
| 小手机脚本 CDN              | `@phone-v0.2.2/dist/小手机/index.js`                           |
| 点赞致谢数据 CDN            | `@reactions-v1.0.0/dist/reactions/reactions.json`              |
| 预设JSON CDN 目录           | `@preset-v2.0.6/dist/presets/`                                 |
| **酒馆联机脚本 CDN**        | `@online-v0.2.2/dist/酒馆联机脚本/index.js`                    |
| **卫疏影开局脚本 CDN**      | `@wsy-v0.0.1/dist/卫疏影/index.js`                             |
| **明月秋青智脑脚本 CDN**    | `@zhino-v4.0.0/dist/明月秋青脚本/index.js`                     |
| **onion状态栏 CDN**         | `@onion-v0.0.6/dist/一脸嫌弃给你看胖次的onion/状态栏/index.js` |
| **NAI 生图脚本 CDN**        | `@nai-v0.0.2/dist/nai生图脚本/index.js`                        |
| 角色卡PNG CDN 目录          | `@char-v1.0.0/dist/characters/`                                |
