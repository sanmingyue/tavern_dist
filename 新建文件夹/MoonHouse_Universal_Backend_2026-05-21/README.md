# 月之屋（YueZhiWu）

月之屋是给 Unity AIRP 游戏准备的本地“酒馆后端”骨架：它不复刻 SillyTavern 的网页系统，而是在 Unity/C# 里提供角色卡运行时需要的核心能力。

当前第一版已经包含：

- OpenAI-compatible API 调用层，适合 Ollama、OpenRouter、兼容 `/v1/chat/completions` 的本地或云端服务。
- OpenAI-compatible 模型列表获取，支持通过 `/v1/models` 刷新并选择当前模型。
- 聊天预设结构：模型、温度、top_p、上下文长度、停止词、历史裁剪、预设适配器。
- 世界书扫描：常驻条目、关键词条目、二级关键词逻辑、概率、递归、预算裁剪、槽位注入。
- 提示词装配：沿用你旧项目的 `prompt_slot`、`player_action`、`observed_piece` 思路。
- Unity 存档：保存在 `Application.persistentDataPath/YueZhiWu`。
- Inspector 配置资产：`Create > 月之屋 > Runtime Config`。
- 调试组件：`MoonHouseDevConsole` 可在 Inspector 里预览提示词或发送一次请求。
- 最小可玩界面：`MoonHouseDemoUI` 可自动生成聊天界面。

重要边界：本项目参考了 SillyTavern 的功能形态，但没有复制它的实现代码。你本地 SillyTavern 是 AGPL-3.0，直接改搬实现会带来强 copyleft 义务；月之屋应该保持自写内核，只做行为兼容和数据迁移。

## 快速开始

1. 用 Unity Hub 打开 `C:\Users\三明月\Desktop\Unity_Airp`。
2. 在 Unity 里创建 `Assets/Create/月之屋/Runtime Config`。
3. 选中新建的 Config，右键或齿轮菜单执行 `填充月之屋示例配置`。
4. 新建空 GameObject，挂载 `MoonHouseBackend`，把 Config 拖进去。
5. 在 Config 的 `Generation Preset` 里填你的模型服务地址、模型名和 API key。

更完整的布置步骤在 [docs/UNITY_SETUP.md](docs/UNITY_SETUP.md)。

## 目录

- `Assets/YueZhiWu/Scripts/Runtime/MoonHouseBackend.cs`：Unity 入口组件。
- `Assets/YueZhiWu/Scripts/Runtime/MoonHouseDevConsole.cs`：无 UI 调试入口。
- `Assets/YueZhiWu/Scripts/Runtime/MoonHouseDemoUI.cs`：自动生成的最小聊天界面。
- `Assets/YueZhiWu/Scripts/Runtime/MoonHouseApiClient.cs`：模型 API 调用。
- `Assets/YueZhiWu/Scripts/Runtime/PromptComposer.cs`：预设与提示词装配。
- `Assets/YueZhiWu/Scripts/Runtime/WorldbookScanner.cs`：世界书扫描。
- `Assets/YueZhiWu/Scripts/Runtime/TokenCounting.cs`：分词预算接口与估算。
- `Assets/YueZhiWu/Scripts/Editor/MoonHouseConfigEditor.cs`：配置面板里的模型刷新和下拉选择。
- `docs/ARCHITECTURE.md`：架构说明。
- `docs/SILLYTAVERN_RESEARCH.md`：SillyTavern 参考点与协议边界。
