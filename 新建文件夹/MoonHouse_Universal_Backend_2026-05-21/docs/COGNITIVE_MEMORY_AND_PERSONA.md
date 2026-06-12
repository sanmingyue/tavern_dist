# 智脑 API 与玩家画像接口

本页记录月之屋后端新增的“智脑”和“玩家画像”能力。它们不是显示用 UI，而是给 Unity 前端、玩法系统和未来角色卡编辑器调用的后端接口。

## 智脑专用 API

长期记忆总结、玩家画像整理这类任务可以不再使用聊天模型，而是使用 `MoonHouseSave.memorySettings.dedicatedApiPreset`。

关键字段：

- `memorySettings.useDedicatedApi`: 为 `true` 时，长期记忆总结和画像整理会优先使用智脑专用预设。
- `memorySettings.dedicatedApiPreset`: 一套完整的 `MoonHouseGenerationPreset`，可独立填写 `endpointBaseUrl`、`apiKey`、`apiProvider`、`model`、`temperature`、`maxTokens`。
- `RefreshCognitiveModelsAsync()`: 刷新智脑专用 API 的模型列表。
- `SelectCognitiveModel(modelId)`: 切换智脑专用模型。

示例：

```csharp
runtime.SaveData.memorySettings.useDedicatedApi = true;
runtime.SaveData.memorySettings.dedicatedApiPreset.endpointBaseUrl = "https://example.com/v1";
runtime.SaveData.memorySettings.dedicatedApiPreset.apiKey = "...";
runtime.SaveData.memorySettings.dedicatedApiPreset.apiProvider = MoonHouseApiProviders.OpenAiCompatible;

MoonHouseModelListResult models = await runtime.RefreshCognitiveModelsAsync();
runtime.SelectCognitiveModel(models.modelIds[0]);
```

## 玩家画像采集

前端不需要要求玩家手动填写一整张复杂画像表。推荐做法是：游戏在自然流程里收集字段，然后交给后端保存。

例如开局问卷、角色创建页、偏好设置页、剧情选择、养成界面的“称呼偏好”等，都可以写入同一份画像。

```csharp
runtime.CaptureUserPersona(new MoonHouseUserPersonaCaptureRequest
{
    name = "三明月",
    setActive = true,
    fields = new List<MoonHouseUserPersonaField>
    {
        new MoonHouseUserPersonaField
        {
            key = "preferred_address",
            label = "称呼偏好",
            value = "希望角色称呼我为三明月",
            priority = 10
        },
        new MoonHouseUserPersonaField
        {
            key = "roleplay_preference",
            label = "互动偏好",
            value = "喜欢角色主动观察我的情绪，但不要替我决定行动",
            priority = 20
        }
    }
});
```

后端会把这些字段保存到 `MoonHouseSave.userPersonas`，当前启用画像 id 保存在 `MoonHouseSave.activeUserPersonaId`。这些内容和普通存档一样写入 Unity 本地存档路径，不需要额外数据库。

## 智脑整理画像

采集到的字段可以直接注入提示词；也可以让智脑整理成更稳定的“玩家画像”。

```csharp
MoonHouseUserPersonaAnalyzeResponse result = await runtime.AnalyzeUserPersonaAsync(
    new MoonHouseUserPersonaAnalyzeRequest
    {
        force = true
    });
```

整理结果写入：

- `MoonHouseUserPersona.rawInput`: 前端采集的原始资料。
- `MoonHouseUserPersona.capturedFields`: 前端分字段采集的资料。
- `MoonHouseUserPersona.analyzedProfile`: 智脑整理后的稳定画像。
- `MoonHouseUserPersona.lastAnalyzedAtIso`: 上次整理时间。

提示词组装时，月之屋会自动把当前启用画像注入到 `PersonaDescription` 槽位，格式为：

```xml
<user_persona id="..." name="...">
...
</user_persona>
```

如果已经有 `analyzedProfile`，优先注入整理后的画像；否则注入前端采集字段。

## 推荐分工

前端负责：

- 在角色创建、设置页、剧情关键选择中收集玩家偏好。
- 调用 `CaptureUserPersona` 写入字段。
- 在合适时机调用 `AnalyzeUserPersonaAsync`，例如开局完成、玩家修改偏好、长篇存档阶段性整理。

后端负责：

- 合并同一玩家画像，避免重复新建。
- 本地存档。
- 使用智脑 API 整理画像。
- 自动把当前启用画像注入聊天提示词。

这样玩家不会感觉自己在填复杂表单，但 NPC 依然能长期知道“这个玩家是谁、喜欢怎样互动、哪些内容不该碰”。

## 大总结与本地记忆库

离开酒馆后，大总结不再需要迁就插件脚本格式。月之屋的大总结现在按三层输出：

- `[完整剧情压缩]`: 真正的旧剧情压缩档案。它应当完整承接过去发生的内容，只压缩 token，不故意遗漏关键事实。
- `[角色记忆]`: 给角色检索用的长期记忆，分核心和近期。
- `[动态人设]`: 当前情绪、关系走势、行为模式变化。

总结完成后，后端会把这些内容拆进本地 `MoonHouseSave.memoryBank`。聊天时不会把所有旧内容一股脑塞进上下文，而是按当前输入、地点、在场角色、关键词、标签检索相关条目，组成 `<memory_bank>` 注入到 `<neural_chain>` 里。

可用接口：

```csharp
List<MoonHouseMemoryItem> all = runtime.GetMemoryBank();

MoonHouseMemorySearchResult result = runtime.SearchMemoryBank(
    new MoonHouseMemorySearchRequest
    {
        query = "我走进灵庭，想看看她今天的状态",
        limit = 8,
        updateAccessStats = true
    });

runtime.UpsertMemoryItem(new MoonHouseMemoryItem
{
    kind = "manual",
    title = "玩家和月之屋角色的约定",
    content = "月之屋角色答应过三明月，在灵庭修炼结束后一起去看新开的灵花。",
    actors = new List<string> { "月之屋角色" },
    tags = new List<string> { "约定", "灵庭" },
    importance = 1.5f
});
```

这层本地记忆库是普通存档数据，不需要数据库；Windows、Android、iOS 都会跟随 Unity 的本地存档路径保存。
