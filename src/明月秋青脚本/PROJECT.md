# 明月秋青脚本 - 项目文档

> **本文件是项目的持续衔接文件，每次操作后都会更新，防止上下文偏离。**

## 项目概述

一个独立的酒馆助手脚本，为"明月秋青Bad End"预设提供智能增强功能。通过悬浮面板进行设置和信息可视化。

## 技术栈

- 运行环境：酒馆助手脚本（无沙盒iframe后台运行）
- 前端框架：Vue 3 + Pinia + Scoped CSS
- 前端挂载方式：`createScriptIdDiv` + `teleportStyle` → 悬浮面板（挂载到酒馆网页body）
- 数据持久化：
  - 聊天数据（大总结/角色库/梦呓）→ 聊天变量 `{type: 'chat'}`（每个聊天独立）
  - 全局设置（开关/API配置/用户人格）→ 脚本变量 `{type: 'script', script_id}`（全局共享）
- AI调用：酒馆助手 `generate` / `generateRaw` 接口
- 提示词注入：`injectPrompts` + `CHAT_COMPLETION_SETTINGS_READY` 事件

## 前端面板设计

### 挂载方式
- PC：悬浮按钮(FAB) → 点击打开可拖动/可调整大小的面板
- 手机：底部弹出式面板（92%高度），下拉手势关闭，底部有关闭按钮
- 通过 `window.parent.innerWidth <= 768` 判断手机
- 暗色主题（`--zn-bg: #050810`），纯管理面板，功能性为主

### Tab页设计（4个）
1. **总览** — 状态仪表盘：当前楼层/下次大总结倒计时/已激活角色/梦呓状态/手动触发按钮
2. **角色库** — 所有角色数据管理：角色列表(含别名)/点击查看编辑记忆+动态人设+关键词/支持手动修改
3. **梦呓** — 用户行为分析数据：游玩类型/通用行为模式(可编辑)/各角色交互模式(可编辑)/Roll偏好
4. **设置** — 功能开关+API配置：所有开关/大总结间隔/用户人格/API配置(酒馆API或自定义)/模型检测(Claude适配)/数据导出导入清空

### 设计原则
- 纯管理面板，功能性和方便性为主
- 不做半透明，暗色主题
- 所有接口暴露，允许用户自行修改数据
- 所有总结支持手动触发
- 不使用 toastr 弹窗，只用 console.info
- 手机适配参考潮汐的逻辑

## 预设运行逻辑理解

### 消息结构（Kemini压缩模式）

预设使用 `kemini_noass.js` 脚本在 `CHAT_COMPLETION_SETTINGS_READY` 事件中：
1. 将所有消息合并为单条 user 消息（Kemini格式）
2. 带 `<|no-trans|>` 标签的消息保持独立不被合并
3. 合并后的消息用 `Human:`/`Assistant:` 前缀区分角色
4. 聊天记录被包裹在 `<observed_piece class="剧情">` 等标签中
5. 支持数据捕获规则（正则匹配 → 存储 → 标记替换）

### 预设提示词流程

```
顶部系统提示词（破限、创作原则、文风等）
  ↓
角色定义（角色描述、玩家描述、性格、情景）
  ↓
聊天记录开始标记 → <chathistory><additional_settings>
  ↓
大总结放置处（D9999）
  ↓
聊天记录（被压缩为 observed_piece）
  ↓
聊天记录结束标记 → </additional_settings></chathistory>
  ↓
D2标记
  ↓
功能区（视角、对话、剧情、防护、NSFW等）
  ↓
思维链指令
  ↓
输出格式要求
  ↓
输入强调（{{lastUserMessage}}）
  ↓
AI prefill
```

## 功能模块设计

### 模块1：项目基础架构

**文件结构：**
```
src/明月秋青脚本/
├── index.ts              # 脚本入口（div挂载、事件监听、正文捕获）
├── App.vue               # 悬浮面板根组件（FAB + 可拖动面板 + 4 Tab）
├── PROJECT.md            # 项目衔接文档
├── stores/
│   └── mainStore.ts      # Pinia状态管理（chat变量 + script变量拆分）
├── core/
│   ├── persona.ts        # 用户人格系统
│   ├── dynamicProfile.ts # 动态人设系统
│   ├── dreamtalk.ts      # 梦呓系统
│   ├── summary.ts        # 大总结系统
│   ├── neuralChain.ts    # 神经链记忆激活
│   ├── inject.ts         # 提示词注入引擎
│   ├── prefill.ts        # Prefill 处理
│   └── tutorial-essence.ts # 教程精华
└── components/
    ├── OverviewTab.vue    # 总览Tab
    ├── CharacterTab.vue   # 角色库Tab
    ├── DreamtalkTab.vue   # 梦呓Tab
    └── SettingsTab.vue    # 设置Tab
```

### 模块2：用户人格系统

在设置Tab中填写人设 → AI分析生成结构化画像 → 注入提示词

### 模块3：动态人设系统

大总结完成后为每个角色生成动态人设 → 按在场角色条件注入

### 模块4：正文捕获与记录系统

监听 MESSAGE_RECEIVED/MESSAGE_SWIPED → 提取 `<content>` 正文 → 存储到聊天变量

### 模块5：精准大总结系统

每N楼自动触发（或手动触发）→ 拆分为时间线+角色记忆+动态人设

### 模块6：梦呓系统

大总结后分析用户行为模式 → 产出游玩类型/通用行为/角色交互/Roll偏好 → 按在场角色注入

### 模块7：记忆激活系统

扫描正文中角色名 → 从记忆库取对应记忆 → 按关系链注入

## 当前进度

- [x] 需求分析与确认
- [x] 预设结构理解
- [x] 项目文档创建
- [x] 模块1：基础架构搭建
- [x] 前端重写：悬浮面板模式（div挂载 + FAB + 可拖动 + 手机适配）
- [x] 存储拆分：chat变量 vs script变量
- [x] 4 Tab页面板（总览/角色库/梦呓/设置）
- [x] Claude模型检测
- [x] 数据导出导入清空
- [x] 构建通过（1.25 MiB）
- [x] v0.2.0：隐藏楼层管理、重新总结、选定楼层总结、最新4条AI发言安全可见检查

## 技术决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 前端挂载方式 | createScriptIdDiv + teleportStyle | 悬浮面板，不阻塞酒馆页面 |
| 样式方案 | scoped CSS（非 tailwindcss） | 挂载到酒馆body，禁止使用tailwindcss避免类名冲突 |
| 数据存储 | chat变量 + script变量拆分 | 聊天数据独立，设置全局共享 |
| 用户人设来源 | 设置Tab输入 | 脚本完全接管 |
| 记忆激活方式 | injectPrompts | 不修改世界书，灵活可控 |
| 消息压缩兼容 | 与kemini_noass并行 | 本脚本不做消息压缩，专注智能增强 |
| 弹窗方式 | console.info | 不使用toastr，避免影响代入感 |
| 总结边界 | lastSummaryAtMessageId 记录实际已总结的最后AI楼层 | 最新保留楼层后续仍会参与下一轮总结 |
