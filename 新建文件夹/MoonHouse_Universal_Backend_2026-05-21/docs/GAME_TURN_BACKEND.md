# 月之屋游戏回合后端接口

月之屋不是本地酒馆界面，而是 Unity 独立游戏里的 AI 回合后端。作者负责提供预设、世界书和前端玩法；月之屋负责把前端事实组装成一次模型请求，再把模型回复解析成游戏可用数据。

## 前端优先调用

普通剧情场景：

```csharp
MoonHouseGameTurnResponse response = await runtime.RunSceneTurnAsync(
    new MoonHouseGameTurnRequest
    {
        playerInput = "我走进灵庭，观察她今天的状态。",
        gameState = currentGameState,
        runtimeVariables = currentVariables,
        saveToHistory = true
    });
```

NPC 对话：

```csharp
MoonHouseGameTurnResponse response = await runtime.RunNpcDialogueAsync(
    new MoonHouseGameTurnRequest
    {
        npcId = "yuezhixing",
        npcName = "月之屋角色",
        playerInput = "你今天看起来有些安静。",
        gameState = currentGameState,
        saveToHistory = true
    });
```

玩法结算后的正文反馈：

```csharp
MoonHouseGameTurnResponse response = await runtime.RunPlayerActionAsync(
    new MoonHouseGameTurnRequest
    {
        actionId = "cultivation_meditate",
        actionLabel = "打坐修炼",
        playerInput = "我陪她完成今日修炼。",
        frontendOutcome = "前端已结算：灵力 +3，好感 +1，轻微疲劳。",
        gameState = currentGameState,
        runtimeVariables = currentVariables,
        saveToHistory = true
    });
```

## 输出解析协议

模型可以只返回普通正文。若预设作者愿意，也可以让模型在正文后追加隐藏块：

```xml
<state_patch>
{"patches":[
  {"op":"set_actor_state","args":{"actorId":"yuezhixing","attitude":"softened","relationship":43}},
  {"op":"set_runtime_variable","args":{"key":"quest.first_meeting","kind":"Text","value":"advanced"}}
]}
</state_patch>

<choices>
[
  {"id":"ask_cultivation","label":"询问修炼","playerInput":"我问她修炼是否顺利。"},
  {"id":"sit_quietly","label":"安静陪伴","playerInput":"我在她身旁安静坐下。"}
]
</choices>

<memory_hint>
玩家在灵庭主动关心了她的状态，她的态度明显柔和。
</memory_hint>
```

月之屋会把隐藏块从可见正文里移除，并填入：

- `response.turn.assistantText`
- `response.parsedOutput.choices`
- `response.parsedOutput.statePatches`
- `response.parsedOutput.memoryHints`
- `response.patchResults`

默认状态补丁只作为建议返回给前端，不强行修改存档。需要月之屋直接落库时，把：

```csharp
outputParsing.applyStatePatchesToSave = true;
```

## 预设与世界书边界

月之屋不会抢预设的工作。预设仍然负责写作风格、提示词结构、宏布局、后处理模式和是否启用工具。月之屋只暴露接口：

- `ImportPresetPackageJson`
- `ImportWorldbookPackageJson`
- `ImportSillyTavernPresetJson`
- `ImportSillyTavernWorldbookJson`
- `ImportSillyTavernCharacterCardJson`

兼容导入会把酒馆 JSON 转成月之屋自己的内容包。常见酒馆宏如 `{{char}}`、`{{user}}`、`{{input}}`、`{{setvar::...}}`、`{{getvar::...}}`、`{{trim}}` 会在月之屋宏层做安全处理。

## 本地独立游戏原则

API Key 由玩家自己在游戏设置中填写，并保存在本地存档路径。游戏包不内置作者 Key。角色、世界书、预设、初始内容可以作为本地内容包随游戏发布，玩家存档、记忆、画像和设置写入 `Application.persistentDataPath`。
