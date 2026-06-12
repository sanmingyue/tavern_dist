# 月之屋后端审计报告（2026-05-21）

## 结论

月之屋现在不是“把酒馆搬进 Unity”，而是一个面向独立 AIRP/JRPG 前端的本地 AI 后端。它的职责已经比较清楚：

- 作者负责角色卡、世界书、预设、玩法前端。
- 玩家负责本地填写 API、模型、个人设置。
- 月之屋负责把“前端行动 -> 提示词组装 -> 世界书/记忆/变量注入 -> API 调用 -> 解析输出 -> 写入存档/状态”这条链路做好。

按今天的目标看，核心后端已经进入“可以作为明天角色卡迁移底座”的状态。剩下的工作主要是迁移时根据实际角色卡字段补适配，而不是主链路缺失。

## 当前结构

### 1. 前端契约层

文件：`Assets/YueZhiWu/Scripts/Runtime/MoonHouseFrontendContract.cs`

这里定义前端作者真正要调用的接口：

- 普通对话：`SendTurnAsync`
- 流式对话：`SendTurnStreamAsync`
- 游戏化回合：`RunSceneTurnAsync`、`RunNpcDialogueAsync`、`RunPlayerActionAsync`
- Raw 预设接口：`GenerateRawAsync`
- 输出解析：`ParseAssistantOutput`
- 状态补丁：`ApplyStatePatches`
- 记忆/总结/用户画像：`RunMemorySummaryAsync`、`CaptureUserPersona`、`AnalyzeUserPersonaAsync`
- 模型与预设选择：`RefreshAvailableModelsAsync`、`SelectModel`、`SelectPreset`
- 导入导出：月之屋包、世界书、预设、SillyTavern 世界书、SillyTavern 预设、SillyTavern 角色卡

这层的方向是对的：前端不用知道酒馆细节，只需要调用稳定接口。

### 2. 中枢运行层

文件：`Assets/YueZhiWu/Scripts/Runtime/MoonHouseBackend.cs`

这是后端主控：

- 加载/保存本地存档。
- 接收玩家行动。
- 选择本轮使用的预设。
- 组装提示词。
- 调 API。
- 接收结果。
- 运行工具/Agent 循环。
- 解析隐藏结构块。
- 写入聊天记录、状态、记忆。
- 向前端抛事件。

今天重点修正：它现在优先使用 `SaveData.presetLibrary`，也就是玩家本地存档里的 API、模型、预设选择。这样独立游戏重启后不会丢玩家填写的连接信息。

### 3. 数据模型层

文件：`Assets/YueZhiWu/Scripts/Runtime/MoonHouseModels.cs`

包含：

- 生成预设：模型、API、温度、上下文、后处理、函数工具、输出解析。
- 世界书条目。
- Prompt Stack。
- 游戏状态：时间、地点、场景、NPC、事实。
- 运行变量：全局、场景、NPC、玩家、临时等。
- 记忆：大总结、动态人设、记忆库、用户画像。
- 输出解析结构：选项、状态补丁、记忆提示、图片提示。
- 导入导出包结构。

今天补强：`MoonHouseSave` 持有 `presetLibrary`，这是独立游戏必须有的。否则玩家填的 API 只活在编辑器配置里，不够“本地安装包游戏”。

### 4. 提示词与预设层

文件：

- `PromptComposer.cs`
- `MoonHousePromptPostProcessor.cs`
- `MoonHouseMacroEngine.cs`
- `MoonHouseDefaults.cs`

能力：

- 按预算组装 system/user/assistant。
- 世界书插入 before/after/in-chat/depth。
- 支持类 NoAss 的压缩成单 user/assistant 结构。
- 支持基础宏：角色名、玩家名、变量、世界状态、输入、时间等。
- 支持预设库：generation preset、context template、instruct template、system prompt、reasoning preset。

结论：这不是完全复刻酒馆 UI 的预设系统，而是把最有用的预设能力本地化成 Unity 后端接口。方向正确。

### 5. 世界书层

文件：

- `WorldbookScanner.cs`
- `MoonHouseSillyTavernCompat.cs`
- `MoonHouseCharacterCardImporter.cs`

能力：

- key/secondary key 匹配。
- constant、selective、case-sensitive、whole-word、regex。
- depth、order、priority。
- token 预算。
- 递归扫描。
- group competition。
- 兼容 SillyTavern 世界书 JSON。
- 兼容角色卡里的 world info。

结论：世界书主链路已经能工作。明天角色卡迁移时，重点会是把你角色卡里真正使用的字段完整映射进来。

### 6. API 与模型层

文件：`MoonHouseApiClient.cs`

能力：

- OpenAI compatible `/v1/chat/completions`
- OpenAI compatible `/v1/completions`
- Gemini
- Claude
- 模型列表获取
- 流式 SSE
- 请求超时、取消、重试
- OpenAI/Gemini/Claude 工具定义 payload

结论：可作为玩家自填 API 的本地游戏连接层。由于不同中转 API 会有方言差异，未来可能要补“供应商兼容配置”，但主能力已具备。

### 7. Agent/工具层

文件：`MoonHouseAgentRuntime.cs`

能力：

- 原生工具调用模式。
- JSON Actions 工具模式。
- 回合工具循环。
- 工具结果回填。
- 前端可根据工具调用扩展游戏能力。

结论：方向比酒馆插件环境更适合游戏。酒馆助手是为扩展酒馆而生；月之屋可以直接把工具接口做成后端契约，不需要绕插件。

### 8. 记忆/智脑层

文件：`MoonHouseMemoryRuntime.cs`

能力：

- 大总结。
- 近期消息候选。
- 动态角色画像。
- 用户画像。
- 记忆库。
- 记忆检索。
- 记忆链注入。
- 智脑可使用专门 API preset。

结论：已经从“酒馆里靠脚本塞上下文”升级成“本地存档里的正式系统”。大总结不再必须伪装成聊天消息，而是真正作为压缩后的过去内容。

### 9. 内容导入导出层

文件：`MoonHouseContentIO.cs`

能力：

- 导出/导入完整存档。
- 导出/导入内容包。
- 导出/导入世界书包。
- 导出/导入预设包。
- API Key 默认不随包导出。
- 合并模式：Replace、AppendOrUpdate。

今天重点修正：当作者更新一个不含 API Key 的同名预设时，不再覆盖掉玩家本地 API Key 和已刷新模型列表。

## 操作逻辑

### 作者工作流

1. 作者准备角色卡、世界书、预设、初始变量、玩法前端。
2. 作者把月之屋后端放入 Unity 项目。
3. 作者把自己的角色内容导入或内置到配置/资源里。
4. 作者写前端玩法：地图、战斗、养成、场景、NPC 面板等。
5. 前端把玩家行动、场景状态、NPC 状态传给月之屋。
6. 月之屋生成本轮提示词并调用 API。
7. AI 返回正文、可选项、状态补丁、记忆提示。
8. 前端拿结果显示、播放演出、改变游戏状态。

### 玩家工作流

1. 解压游戏。
2. 打开游戏。
3. 填 API 地址、Key、模型，或刷新模型列表选择。
4. 开始游戏。
5. 游戏过程中聊天记录、变量、世界状态、记忆、大总结、用户画像都存本地。
6. 下次打开继续玩。

这就是 Steam 独立游戏式的逻辑：所有游戏内容在本地，AI 连接由玩家自己填，月之屋只做本地后端。

## 深度模拟结果

| 用户操作 | 可能问题 | 当前结果 |
|---|---|---|
| 玩家重启游戏 | API Key、模型、预设选择丢失 | 已修复。预设库进入 `MoonHouseSave`，本地持久化 |
| 作者发新版预设包，玩家导入 | 不含 Key 的包覆盖玩家本地 Key | 已修复。导入同名预设时保留本地 API Key |
| 作者发新版预设包，玩家导入 | 已刷新模型列表被空列表覆盖 | 已修复。导入同名预设时保留本地模型列表 |
| 玩家存档 JSON 损坏 | 游戏打不开或直接崩 | 已修复。坏存档会备份为 `.broken_时间.json`，再新建存档 |
| 作者/前端传入奇怪 saveFileName | 路径穿越写到存档目录外 | 已修复。只取文件名，强制写入月之屋存档目录 |
| AI 输出 `<state_patch>` | 隐藏结构块显示给玩家 | 已修复。最终正文会剥离隐藏块 |
| AI 输出非法 state patch JSON | 解析崩溃 | 已处理。转成 raw note 并记录 parse error |
| AI 修改 NPC 状态但没写 present | NPC 可能被误设为出场 | 已修复。只有显式写 `present` 才改出场状态 |
| 预设里开启输出解析 | 克隆预设时字段丢失导致不生效 | 已修复。`outputParsing` 进入克隆 |
| 旧存档没有 presetLibrary 字段 | 旧玩家无法迁移到本地预设库 | 已修复。加载旧存档时会从 config 或默认预设补齐 |
| SillyTavern 世界书导入 | 字段不兼容 | 已模拟通过基础格式，复杂格式明天迁移角色卡时继续补 |
| SillyTavern 预设导入 | 温度、top_p、max_tokens、model 映射不稳定 | 已模拟通过基础格式 |
| 长篇游戏 Token 膨胀 | 上下文塞爆 | 已有预算、历史裁剪、世界书预算、总结/记忆链；具体阈值要按角色卡调 |
| 流式输出 | 隐藏块可能在最终解析前以 chunk 形式短暂传到前端 | 仍是注意项。前端建议显示“缓冲后的可见文本”，不要逐字直接显示原始 chunk |
| API 方言差异 | 中转 API 不完全像 OpenAI | 主链路支持，但具体供应商可能需要新增 provider adapter |

## 今天实际修复点

1. 本地存档加入 `presetLibrary`，API、模型、预设选择不再只依赖 Unity 编辑器配置。
2. `ResolvePreset` 优先读本地存档预设。
3. `ResolvePresetLibrary` 优先读本地存档预设库。
4. `SelectPreset` 支持直接选择本地预设库。
5. `SelectModel` 和模型刷新结果会落到本地预设。
6. 导入同名预设时保留玩家本地 API Key。
7. 导入同名预设时保留已刷新模型列表。
8. 坏存档自动备份恢复。
9. 存档文件名防路径穿越。
10. 状态补丁不再误改 NPC `present`。
11. 输出解析设置在预设克隆时不再丢失。
12. 角色卡/世界书/预设兼容层加入 Unity `.meta`。

## 验证

已做两类验证：

- 编译验证：临时 .NET 编译项目引用 Unity 6.4 相关程序集，结果 0 error、0 warning。
- 模拟验证：本地脚本跑过存档、坏存档、路径穿越、预设持久化、API Key 保留、模型列表保留、输出解析、状态补丁、非法 JSON、SillyTavern 世界书、SillyTavern 预设，结果 `SIMULATION_OK`。

## 完成度

我给今天的月之屋后端完成度评估为：

- 核心一去一回：完成。
- 世界书：可用，明天按你的角色卡实测补字段。
- 预设接口：可用，支持多预设和本地持久化。
- 酒馆兼容：基础可用，复杂脚本/极端宏不承诺完全执行。
- NoAss 思路：已内置为后处理/压缩逻辑，不再依赖酒馆脚本环境。
- 智脑/长期记忆：可用，有独立 API preset、总结、用户画像、记忆库。
- Agent/工具：可用，前端可以继续扩展游戏工具。
- 本地独立游戏逻辑：成立。

总体：约 92%。剩下 8% 不是“后端没写完”，而是独立游戏发布前的工程化与角色卡迁移校准。

## 明天角色卡迁移时重点

1. 先导入你的“我的养成仙子女友”角色卡/世界书/预设。
2. 对照酒馆实际 prompt，检查缺失字段。
3. 补 SillyTavern 角色卡字段映射。
4. 检查世界书触发是否与酒馆接近。
5. 检查大总结、动态人设、记忆链是否比原智脑更稳。
6. 做一个真实开局到 20 回合的长线测试。
7. 再决定是否要做前端作者用的“配置面板”。

## 剩余风险

1. 流式隐藏块：最终正文安全，但前端若直接逐字显示原始 chunk，可能短暂看到 `<state_patch>`。建议下一步给流式事件加一个可见文本缓冲器。
2. 复杂 SillyTavern 脚本：月之屋不执行任意 JS 脚本，这是安全选择；需要的功能应改成本地正式接口。
3. API 方言：OpenAI 兼容中转很多，可能需要按常用服务补 provider preset。
4. 真机移动端：安卓/iOS 的文件路径、网络权限、TLS、中转 API 兼容还要在打包阶段测试。
5. 自动化测试：现在有临时模拟验证，后续应把这些用例变成正式 Unity EditMode 测试。

## 最终判断

今天可以把月之屋后端视为“角色卡迁移前的第一版完成”。它已经不只是 demo，而是有本地存档、预设库、世界书、记忆、Agent、导入导出、输出解析的 Unity AIRP 后端。

明天最该做的不是再空想架构，而是拿真实角色卡迁移，逼它暴露剩下的字段兼容问题。真实角色卡一上来，后端才会从“通用能力”变成“你的游戏真的能跑”。
