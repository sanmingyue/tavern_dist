# 月之屋智脑：后台 NPC 生态链

本模块把“智脑”扩展成第二条后台工作线：它不直接写正文，而是维护世界状态、NPC 位置、日程、目标、关系和后台事件。正文生成只读取已经整理好的摘要，所以不会因为 NPC 调度再多等一次主 AI。

## 核心原则

- 主 AI 负责玩家眼前的正文、角色口吻和互动反馈。
- 智脑负责后台生态：谁在什么时间在哪里、正在做什么、目标有什么变化、最近发生了什么。
- 前端可以直接写入或读取生态状态，不需要把一切都塞进提示词。
- 生态模型是通用的，不绑定古风。鬼谷、JRPG、现代校园、科幻舰队都用同一套 Actor / Location / Faction / Routine / Goal / Event。

## 新增数据

`MoonHouseSave.ecosystem` 保存后台生态：

- `locations`：地点。
- `factions`：组织、阵营、家族、公会、宗门等。
- `actors`：NPC 或后台角色。
- `relationships`：角色之间的关系。
- `events`：后台事件队列。
- `behaviorTrees`：轻量树状行为逻辑。
- `lastDigest`：最近一次注入正文的生态摘要。

存档版本已升级到 `7`。

## 前端可调用接口

`MoonHouseBackend` / `IMoonHouseRuntime` 新增：

- `GetEcosystemState()`：读取完整生态状态。
- `SetEcosystemState(ecosystem)`：替换完整生态状态。
- `UpsertEcosystemActor(actor)`：新增或更新一个 NPC / 后台角色。
- `DeleteEcosystemActor(actorId)`：删除一个后台角色。
- `AddEcosystemEvent(event)`：写入一条后台事件。
- `AdvanceEcosystem(request)`：按时间片推进后台生态。
- `BuildEcosystemDigest(query)`：为正文构建可注入摘要。
- `GetEcosystemActorsAtLocation(locationId, hour, minute)`：查询某地点某时刻有哪些角色。
- `RunEcosystemCognitiveTickAsync(request)`：让智脑 API 异步整理后台状态，并把 JSON patch 写回本地。

正文生成时，`PromptComposer` 会自动注入 `<moon_house_ecosystem_digest>`，主 AI 只看到压缩后的有效信息。

## 推荐调用节奏

1. 玩家执行一个玩法动作，例如移动、修炼、打坐、交易。
2. 前端先更新确定性状态，例如玩家当前位置、当前时间、资源变化。
3. 调用 `AdvanceEcosystem` 推进 10 分钟、1 小时或 1 天。
4. 如果玩家进入关键地点，调用 `BuildEcosystemDigest` 或 `GetEcosystemActorsAtLocation`。
5. 主正文生成直接调用原来的 `SendTurnAsync` / `RunSceneTurnAsync`。
6. 空闲时、切场景时、过日结算时，再异步调用 `RunEcosystemCognitiveTickAsync`，让第二 API 补全更复杂的后台变化。

这样主流程不会变成“后台 AI 一次 + 正文 AI 一次”的串行等待。

## 智脑 Patch 格式

智脑 API 应输出：

```text
<moon_house_ecosystem_patch>
{
  "actors": [
    {
      "actorId": "npc_lan",
      "displayName": "Lan",
      "locationId": "training_hall",
      "activity": "cultivating",
      "mood": "focused",
      "visibleToPlayer": true,
      "tags": ["disciple"]
    }
  ],
  "events": [
    {
      "type": "routine",
      "title": "Lan moved to training hall",
      "description": "Lan started morning practice.",
      "locationId": "training_hall",
      "actorIds": ["npc_lan"],
      "importance": 0.4
    }
  ],
  "facts": [
    "The training hall is active in the morning."
  ]
}
</moon_house_ecosystem_patch>
```

后端会自动解析并写回本地存档。

## 给鬼谷式玩法的接法

鬼谷八荒式前端可以把玩法层数据转成通用生态：

- 宗门、城镇、秘境：`locations`
- 门派、家族、商会、妖族：`factions`
- NPC、仇敌、师父、道侣、路人：`actors`
- 日程：`routines`
- 机缘、仇恨、突破、交易、寻仇：`goals`
- 后台传闻、遭遇、移动、闭关完成：`events`

前端只需要负责“玩法规则和 UI”，月之屋负责把这些状态变成 AI 可读的上下文。
