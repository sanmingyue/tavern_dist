# 月之屋后端契约

月之屋是 Unity 内的 AI RPG 后端。前端负责玩法、画面、地点、角色状态和数值；月之屋负责提示词、世界书、预设、存档、模型 API 调用和内容包导入导出。

## 每回合调用

前端每次让 AI 回应时，调用 `IMoonHouseRuntime.SendTurnAsync`。

```csharp
await runtime.SendTurnAsync(new MoonHouseTurnRequest
{
    playerInput = "我走进灵庭，观察她的状态。",
    gameState = currentGameState,
    runtimeVariables = variables,
    temporaryInjects = temporaryRules,
    saveToHistory = true
});
```

`playerInput` 是玩家公开行动。`gameState` 是前端已经确定的事实，例如时间、地点、场景、在场 NPC、天气、目标、危险度。`runtimeVariables` 是数值或旗标，例如好感、灵力、任务阶段、背包状态。

常用可选项：

- `temporaryInjects`: 只在本轮生效的临时提示词，可用于地点规则、战斗规则、任务判定说明。
- `presetOverride`: 只覆盖本次生成的模型、温度、上下文长度等预设，不改全局配置。
- `historyMessageLimitOverride`: 只覆盖本次携带的历史消息数量。
- `generationId`: 前端自己传入的本次生成 ID，便于把 UI、日志和事件对应起来。
- `silent`: 不触发旧式 `MessageAdded` 事件，适合后台生成或调试。

## 事件总线

前端可以监听 `EventEmitted`，不需要一直轮询后端状态。

```csharp
runtime.EventEmitted += evt =>
{
    if (evt.eventType == MoonHouseEventTypes.GenerationCompleted)
    {
        Debug.Log(evt.generationResult.text);
    }
};
```

也可以随时读取最近事件：

```csharp
List<MoonHouseEvent> events = runtime.GetRecentEvents(50);
runtime.ClearRecentEvents();
```

当前事件类型包括：后端加载、存档变化、游戏状态变化、变量变化、提示词组装、生成开始、生成完成、生成失败、聊天消息新增、世界书激活、内容导入、模型列表刷新、Agent 工具执行结果。

## API 预设与 Provider

`MoonHouseGenerationPreset.apiProvider` 决定月之屋如何组装请求体、鉴权头、模型列表地址和流式解析。默认值是 `openai_compatible`，这会保持你现在的 cat / OpenAI 兼容接口用法不变。

当前支持：
- `openai_compatible`: OpenAI 兼容接口。`Endpoint Base Url` 通常填 `/v1` 根地址，例如 `https://example.com/v1`，月之屋会自动请求 `/chat/completions`、`/completions` 或 `/models`。
- `gemini`: Google Gemini 原生接口。`Endpoint Base Url` 可留空，默认使用 `https://generativelanguage.googleapis.com/v1beta`；也可以手动填这个根地址。请求会自动走 `models/{model}:generateContent` 或 `streamGenerateContent?alt=sse`。
- `claude`: Anthropic Claude 原生接口。`Endpoint Base Url` 可留空，默认使用 `https://api.anthropic.com/v1`；请求会自动走 `/messages`，并设置 `anthropic-version: 2023-06-01`。

前端可以把这三个 provider 做成下拉框。玩家只需要选 provider、填 base url、填 API key、刷新模型列表，再选择模型即可。

## 提示词后处理与 Agent

`MoonHouseGenerationPreset.promptPostProcessor` 控制发给模型前的最后一步排版：

- `Default`: 保持 system/user/assistant 多消息结构。
- `SingleUserMessage`: 把所有消息折叠成一条 user 消息，并用 `Human`、`Assistant`、`SYSTEM` 这类前缀区分原始角色。
- `NoAssLike`: 内置 NOASS 风格折叠，把多轮历史压成一条消息，同时处理 `<regex order=...>`、`<@n>...</@n>`、`<|join|>`、`<|space|>`、`<|curtail|>` 这类预设后处理标记。

`NoAssLike` 的输出角色由 `noAssSquashRole` 决定，默认是 `assistant`。这对应酒馆里“把聊天历史压进一个大消息，避免模型被多条 assistant 打断”的用法，也能把用 `<@n>` 标记的世界书/设定片段插回靠近目标历史的位置。

`MoonHouseGenerationPreset.agentMode` 控制 Agent 工具：

- `Disabled`: 关闭工具。
- `JsonActions`: 推荐默认方案。模型在正文后隐藏输出 `<moonhouse_actions>{...}</moonhouse_actions>`，月之屋解析后更新存档，并从可见正文里移除这段。
- `NativeTools`: 给支持函数调用的 OpenAI-compatible、Gemini、Claude 请求附带原生 tools schema。如果模型只返回 tool call 没有正文，月之屋会自动执行工具并追加一次“工具结果回灌”请求，拿到最终可见回复。
- `ToolLoop`: 多轮工具循环。默认最多 2 轮工具执行，`maxToolRounds` 可调整；工具轮数用完后会强制关闭原生 tools，让模型写最终回复。

内置工具第一批用于 AIRP 游戏状态：

- `add_fact`: 写入确认事实。
- `set_location`: 更新地点。
- `set_scene`: 更新场景阶段、目标、气氛、危险度。
- `set_actor_state`: 更新 NPC 在场、动作、态度、关系值。
- `set_runtime_variable`: 更新月之屋变量。
- `add_context_block`: 写入长期上下文块。
- `add_worldbook_entry`: 写入世界书条目。

工具只会在 `saveToHistory = true` 的正式回合里真正修改存档；调试或后台 dry-run 仍会清理隐藏 action 块，但不会落状态。执行结果会出现在 `MoonHouseGenerationResult.toolResults`，并通过 `agent.tool_executed` / `agent.tool_failed` 事件通知前端。`MoonHouseGenerationResult.usedToolLoop` 和 `toolLoopRounds` 可用于前端调试面板显示本轮是否触发了工具回灌。

流式请求为了稳定性不会发送原生 tools schema；需要流式时推荐 `JsonActions`，需要严格函数工具时推荐非流式 `NativeTools` 或 `ToolLoop`。

## 长期记忆与总结

月之屋现在内置“智脑式”长期记忆层，数据存在 `MoonHouseSave` 内：

- `memorySettings`: 长期记忆开关、自动总结间隔、保留最近楼层数、注入开关。
- `summaries`: 大总结版本库，默认可保留最近 3 版。
- `dynamicProfiles`: 角色动态人设。
- `lastSummaryMessageIndex`: 已总结到哪条消息。

前端可以手动触发总结：

```csharp
MoonHouseMemorySummaryResponse result = await runtime.RunMemorySummaryAsync(
    new MoonHouseMemorySummaryRequest
    {
        force = true
    });
```

也可以先判断是否到自动总结条件：

```csharp
if (runtime.ShouldRunMemorySummary())
{
    await runtime.RunMemorySummaryAsync();
}
```

默认策略参考“智脑”：

- 累计足够 AI 回复后触发总结。
- 总结时排除最新 4 条 AI 回复，避免刚发生的内容被过早压缩。
- 输出分三段：剧情摘要、角色记忆、动态人设。
- 角色记忆分为 `[核心]` 和 `[近期]`；后续总结会保留旧核心记忆，只滚动近期记忆。
- 生成提示词时会自动注入 `<grand_summary>`、`<dynamic_profiles>`、`<neural_chain>`。
- 如果 `excludeSummarizedHistory = true`，已经被总结覆盖的旧消息不会再进入普通聊天历史，由长期记忆承担上下文延续。

自动总结默认关闭，建议前端做成设置项。打开方式：

```csharp
runtime.SaveData.memorySettings.autoSummaryEnabled = true;
runtime.SaveData.memorySettings.summaryIntervalAssistantMessages = 10;
runtime.SaveData.memorySettings.preserveRecentAssistantMessages = 4;
```

相关事件：

- `memory.summary_started`
- `memory.summary_completed`
- `memory.summary_skipped`
- `memory.summary_failed`

## 流式输出

普通聊天回合可改用 `SendTurnStreamAsync`，或在 `MoonHouseTurnRequest.stream` 设为 true 后继续调用 `SendTurnAsync`。

```csharp
MoonHouseTurnResponse response = await runtime.SendTurnStreamAsync(
    new MoonHouseTurnRequest
    {
        playerInput = "我轻声问她今日是否安好。",
        gameState = currentGameState,
        saveToHistory = true,
        streamFlushIntervalMs = 50,
        streamFlushMinChars = 8
    },
    chunk =>
    {
        if (!chunk.isDone)
        {
            dialogueText.text = chunk.accumulatedText;
        }
    });
```

月之屋不是“一个字刷新一次”。底层会接收 API 的 SSE 小碎片，但默认会攒到一小段，或达到短时间间隔后再推给前端。`streamFlushMinChars` 越大，UI 刷新越少；`streamFlushIntervalMs` 越小，显示越跟手。结束时会强制 flush 最后一段。

`MoonHouseStreamChunk` 会携带 `elapsedMilliseconds` 和 `firstTokenLatencyMs`，最终的 `MoonHouseGenerationResult` 还会携带：
- `elapsedMilliseconds`: 本次成功请求耗时。
- `firstTokenLatencyMs`: 流式时首段文本到达时间；非流式接口无法真实知道首 token，默认等于总耗时。
- `outputCharacters` / `outputCharactersPerSecond`: 输出字数和字/秒。
- `outputTokensEstimate` / `outputTokensPerSecond`: 按当前 tokenizer 估算的输出 token 和 token/s。

## 取消、重试、超时

前端应给每次生成指定一个 `generationId`，这样玩家点“停止”时可以精确取消。

```csharp
string generationId = MoonHouseIds.Create("gen");

MoonHouseTurnRequest request = new MoonHouseTurnRequest
{
    generationId = generationId,
    playerInput = "我走近她，想问清楚刚才的事。",
    timeoutSeconds = 180,
    retryCount = 1,
    retryDelayMs = 750,
    saveToHistory = true
};

Task<MoonHouseTurnResponse> task = runtime.SendTurnAsync(request);

// 玩家点击停止按钮时：
runtime.CancelGeneration(generationId);
```

也可以取消全部正在运行的生成：

```csharp
runtime.CancelAllGenerations();
```

可用查询：

- `IsGenerationRunning(generationId)`
- `GetActiveGenerationIds()`

事件类型包括：

- `generation.retrying`: 发生 429、5xx、网络错误或超时后准备重试。
- `generation.cancelled`: 玩家或前端取消了生成。
- `generation.timeout`: 请求超过 `timeoutSeconds`。
- `generation.failed`: 重试后仍失败，或遇到不可重试错误。

默认值：`timeoutSeconds = 180`，`retryCount = 1`，`retryDelayMs = 750`。`retryCount = 1` 表示失败后最多再试一次。

## 作用域变量

月之屋变量不再只有一堆全局值，而是带作用域：

- `Save`: 当前存档长期保存，例如好感、任务阶段。
- `Global`: 全局共享，例如玩家账号级设置。
- `Character`: 绑定某个角色，`ownerId` 填角色 ID。
- `Turn`: 只在本次生成中生效，生成结束后自动清理。
- `Message`: 绑定某条消息，`ownerId` 填消息 ID。

```csharp
runtime.SetScopedVariable(
    new MoonHouseRuntimeVariable
    {
        key = "relationship.yuezhixing",
        label = "月之屋角色好感",
        kind = MoonHouseVariableKind.Number,
        numberValue = 42,
        exposeToPrompt = true
    },
    MoonHouseVariableScope.Character,
    "yuezhixing");

MoonHouseRuntimeVariable value = runtime.GetScopedVariable(
    "relationship.yuezhixing",
    MoonHouseVariableScope.Character,
    "yuezhixing");
```

只要 `exposeToPrompt` 为 true，这些变量会进入 `{{runtime_variables}}`，也能用 `{{var:key}}` 单独取值，并参与世界书扫描。

## Raw 生成

`GenerateRawAsync` 用于后台判定、隐藏总结、任务推进、战斗结算、剧情规划等“不是普通聊天回合”的模型调用。它不会默认套完整聊天预设和世界书流程，而是按前端给出的 `orderedPrompts` 与 `injects` 直接组装。

```csharp
MoonHouseTurnResponse result = await runtime.GenerateRawAsync(
    new MoonHouseGenerateRawRequest
    {
        userInput = "判断玩家是否能察觉她在隐瞒情绪。",
        orderedPrompts = new List<MoonHouseRawPromptPart>
        {
            new MoonHouseRawPromptPart
            {
                role = "system",
                content = "你是月之屋后台判定器。只输出 JSON。"
            }
        },
        gameState = currentGameState,
        runtimeVariables = variables,
        saveToHistory = false
    });
```

`saveToHistory: false` 适合后台判定；`saveToHistory: true` 会把本次输入和模型回复写入聊天历史。

## 分词器

`MoonHouseGenerationPreset.tokenizerKey` 支持：

- `best_match`: 按模型名自动选择，推荐默认使用。
- `openai`: OpenAI 系模型，会按模型名落到 `openai_o200k` 或 `openai_cl100k`。
- `openai_o200k`: GPT-4o、GPT-4.1、GPT-4.5、GPT-5、o 系、gpt-oss 一类。
- `openai_cl100k`: GPT-4、GPT-3.5、旧 OpenAI chat/text 模型一类。
- `claude`、`llama`、`llama3`、`mistral`、`yi`、`gemma`、`jamba`、`qwen2`、`command_r`、`command_a`、`nemo`、`deepseek`。
- `heuristic`: 保底估算。

月之屋当前使用 Unity 内置的离线 hybrid 估算器，不依赖酒馆的 tokenizer 模型文件。它会按模型族调整英文、中文、标点、emoji 的估算权重，并额外计算 chat message 的 role/padding 开销。这样 Windows、Android、iOS 都能稳定运行。

前端需要显示可选分词器时，可调用：

```csharp
string[] keys = TokenCounterFactory.GetAvailableTokenizerKeys();
```

## 游戏状态

`MoonHouseGameState` 包含：

- `clock`: 日历、日期、时间、时段、季节、天气
- `location`: 地点 ID、地点名、区域、氛围、标签
- `scene`: 场景 ID、场景名、阶段、目标、情绪、危险度、标签
- `actors`: 在场角色、动作、态度、关系值、标签
- `facts`: 前端确认过的事实
- `rawSummary`: 前端额外摘要

这些内容会进入 `{{game_state}}` 宏，也会参与世界书扫描。

## 提示词宏

上下文块、提示节点、世界书内容可使用宏：

- `{{char}}`: 当前角色名
- `{{user}}`: 玩家名
- `{{input}}`: 本轮玩家行动
- `{{game_state}}`: 游戏状态摘要
- `{{runtime_variables}}`: 运行变量摘要
- `{{location}}`: 当前地点名
- `{{area}}`: 当前区域
- `{{scene}}`: 当前场景名
- `{{time}}`: 当前时间
- `{{weather}}`: 当前天气
- `{{present}}`: 在场人物
- `{{var:key}}`: 指定运行变量
- `{{actor:id}}`: 指定角色状态

## 内容包

月之屋支持纯 JSON 内容包，便于角色、世界书、预设和工坊内容流通。

```csharp
string json = runtime.ExportContentPackageJson(
    includeMessages: false,
    includeApiSecrets: false,
    packageName: "月之屋角色包");

MoonHouseImportReport report = runtime.ImportContentPackageJson(
    json,
    MoonHouseContentMergeMode.AppendOrUpdate);
```

可用导入导出：

- `ExportSaveJson` / `ImportSaveJson`
- `ExportContentPackageJson` / `ImportContentPackageJson`
- `ExportWorldbookPackageJson` / `ImportWorldbookPackageJson`
- `ExportPresetPackageJson` / `ImportPresetPackageJson`

默认不会导出 API Key。只有显式传入 `includeApiSecrets: true` 才会包含密钥。

## 世界书扫描

世界书条目可以分别选择扫描来源：

- 玩家本轮输入
- 最近聊天历史
- 游戏状态
- 运行变量
- 角色上下文块

世界书还支持递归、预算、概率、副关键词、黏性回合、冷却回合、延迟激活和分组竞争。前端不需要自己处理这些逻辑，只需要维护游戏事实。

常用高级字段：
- `group`: 同一组只选择优先级最高、order 最靠前的条目，避免相似设定一起挤爆上下文。
- `groupExclusive`: 设为 false 时，即使有 `group` 也不参与排他竞争。
- `delayRounds`: 命中后不立刻注入，而是排队等待若干回合后自动激活，适合伏笔、状态缓发和剧情后效。
- `stickyRounds`: 激活后维持若干回合。
- `cooldownRounds`: 激活后进入冷却，避免反复刷同一条设定。
- `WorldbookScanSettings.groupCompetition`: 总开关，默认开启。
