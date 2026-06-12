# 大世界玩法模块 1-10

本目录说明当前核心脚本已经落下的十个大世界玩法模块。它们都运行在酒馆/Tavern Helper 的浏览器环境内，不依赖 Node、Unity、文件系统或运行时网络请求。

权威状态保存在当前存档槽的 `GameSave` 中。AI 正文只负责叙述、补足细节和生成可读内容；时间、地点、角色位置、任务、事件、关系、经营、战斗、证据与记忆以脚本存档为准。

## 1. 地图与移动模块

文件：

- `types/map.ts`
- `engine/map.ts`
- `engine/travel.ts`

职责：

- 维护地图节点 `world.mapLocations`。
- 维护路线节点 `world.mapRoutes`。
- 生成行路计划 `world.lastTravelPlan`。
- 执行移动后推进时间、切换地点、更新区域、标记已探索与已访问。
- 兼容旧 `TRAVEL` 动作；若已登记路线则走新地图路线，否则保留旧直达移动。

边界：

- 当前不负责地图 UI。
- 图片、线条、光点、区域高亮属于后续前端表现层。
- 移动能否发生，以路线是否存在、是否封锁、移动方式是否允许、解锁旗标是否满足为准。

主要动作：

- `MAP_LOCATION_UPSERT`
- `MAP_ROUTE_UPSERT`
- `MAP_TRAVEL_PLAN`
- `MAP_TRAVEL_EXECUTE`
- `TRAVEL`

## 2. 固定角色索引模块

文件：

- `types/characters.ts`
- `engine/characters.ts`

职责：

- 登记已经确定的固定角色基础信息。
- 维护固定角色当前位置、生死、是否已见、是否已发现。
- 按地点、势力、标签重建 NPC 索引。
- 支持前端按地点拉取当前可见或潜在可交互角色。

边界：

- 不写详细性格。
- 不生成随机美女或随机人设。
- 详细人设、调色盘、台词语料仍由后续人物文件维护。

主要动作：

- `FIXED_CHARACTER_UPSERT`
- `FIXED_CHARACTER_MOVE`
- `FIXED_CHARACTER_DISCOVER`

## 3. 场景模块

文件：

- `types/scene.ts`
- `engine/scene.ts`

职责：

- 创建当前场景。
- 关闭当前场景。
- 维护场景中的在场角色、可说话、可行动、是否可见。
- 将场景类别同步给正文类别模块。

边界：

- 场景不是章节。
- 场景用于限制“谁在场、谁能说话、谁能行动”，避免 AI 让不在现场的人乱入。

主要动作：

- `SCENE_START`
- `SCENE_END`
- `SCENE_PRESENCE_SET`

## 4. 任务链模块

文件：

- `types/quest.ts`
- `engine/quest.ts`

职责：

- 登记任务定义。
- 接取任务。
- 推进任务步骤。
- 记录证据和线索。
- 维护 active/completed/failed 三类任务状态。

边界：

- 主线不强绑定玩家，但任务链记录玩家已经接触、已经推进、已经错过或失败的事实。
- 暗线可以只记录碎片证据，不要求立刻形成完整任务。
- 支线可以长期存在，并允许后续事件继续改变地方状态。

主要动作：

- `QUEST_DEFINITION_UPSERT`
- `QUEST_ACCEPT`
- `QUEST_ADVANCE`
- `QUEST_EVIDENCE_RECORD`

## 5. 关系与声望模块

文件：

- `types/relation.ts`
- `engine/relation.ts`

职责：

- 调整 NPC 关系。
- 调整势力关系。
- 调整世界声望。
- 记录近期关系变化，供 AI 索引和前端提示使用。

边界：

- 关系变化必须由事件、对话、行为或任务后果触发。
- 不因为角色存在就默认绑定主角。
- 门派、世家、官府、外邦都可以保持独立，不必自动围绕 `{{user}}` 转。

主要动作：

- `RELATION_NPC_ADJUST`
- `RELATION_FACTION_ADJUST`
- `REPUTATION_ADJUST`

## 6. 角色台词调度模块

文件：

- `types/dialogue.ts`
- `engine/dialogue.ts`

职责：

- 根据当前场景、地点角色、允许说话者、优先说话者生成台词计划。
- 限制本轮可发言角色。
- 决定是否允许角色内心话。

边界：

- 台词调度不写台词内容。
- 台词内容由 AI 按人物设定生成。
- 角色内心话默认可以进入计划，但前端显示时应折叠或遮盖，由用户点击查看。

主要动作：

- `DIALOGUE_PLAN_BUILD`

## 7. AI 索引组装模块

文件：

- `types/aiIndex.ts`
- `services/aiIndexBuilder.ts`
- `services/contextBuilder.ts`

职责：

- 组装本轮 AI 需要知道的权威状态。
- 组装公式书候选索引。
- 组装当前场景、在场角色、活跃任务、已知线索、活跃事件、近期关系变化、角色记忆索引。

边界：

- 只给 AI “该看什么”和“当前状态是什么”。
- 不把全量公式书、全量角色、全量存档一次性塞进上下文。
- 不让 AI 自行裁决脚本已经维护的状态。

公开接口：

- `aiIndex.buildBundle(save, request)`
- `aiIndex.buildText(save, request)`
- `context.buildState(save)`
- `context.buildScan(save, action)`

## 8. 事件生成与后果模块

文件：

- `types/events.ts`
- `engine/events.ts`
- `engine/consequence.ts`

职责：

- 登记事件模板。
- 按地点、区域、标签生成地方事件。
- 激活手写事件。
- 结算事件为 resolved 或 expired。
- 与行动后果模块共同记录杀人、救人、得罪官府、欠人情、泄露身份、错过时机等长期后果。

边界：

- 事件不是一次性小插曲。
- 事件解决或失败后，后果应通过关系、声望、任务、证据、通缉、经营风险或角色记忆继续存在。

主要动作：

- `EVENT_TEMPLATE_UPSERT`
- `EVENT_GENERATE`
- `EVENT_ACTIVATE`
- `EVENT_RESOLVE`
- `CONSEQUENCE_ADD`

## 9. 固定角色记忆模块

文件：

- `types/characterMemory.ts`
- `engine/characterMemory.ts`

职责：

- 为固定角色或重要生成角色保存摘要记忆。
- 追加重要互动。
- 给 AI 索引提供当前在场角色的记忆文本。

边界：

- 不保存 AI 正文全文。
- 不替代酒馆聊天记录。
- 只保存能维持角色一致性的摘要、重要事件和索引。

主要动作：

- `CHARACTER_MEMORY_SET`
- `CHARACTER_MEMORY_APPEND`

## 10. 女性栏目、后宫与亲密CG模块

文件：

- `types/intimacy.ts`
- `engine/intimacy.ts`

职责：

- 维护统一女性栏目 `intimacy.roster`。
- 记录交谈、AIRP对话、正文互动、送礼、同行、相助、诗会、任务、经营安排等好感互动。
- 好感度达到 100 后，标记为可收入后宫。
- 收入后宫时记录位分、收入路径、所在位置和后宫状态。
- 后宫内支持闲谈、赠礼、私约同行、独处、亲密邀请、CG亲密、留宿、安抚、安排职司、状态调整等互动入口。
- CG模式记录当前活动CG、素材ID、场景状态和已解锁相册。
- 预留越界判定占位记录，只存占位和风险提示，不展开剧情，不接入CG模式。

边界：

- 未满 100 好感不能收入后宫。
- 未收入后宫不能开启后宫亲密CG模式。
- CG模式只记录玩法状态、素材索引、场景开关和相册解锁，前端展示以后再做。
- 互动内容由 AIRP 正文或台词调度承接；脚本只裁定状态。

主要动作：

- `INTIMACY_ROSTER_REGISTER`
- `INTIMACY_AFFECTION_INTERACT`
- `HAREM_ADMIT`
- `HAREM_RANK_SET`
- `HAREM_INTERACTION_RECORD`
- `HAREM_CG_START`
- `HAREM_CG_END`
- `HAREM_BOUNDARY_PLACEHOLDER`

## 统一入口

所有模块都已经进入 `GameAction` 联合类型，并通过 `dispatcher.ts` 统一处理。前端或其他脚本优先调用：

```ts
window.GufengWorld.action.dispatch({ type: 'SCENE_START', payload: { title: '钱塘红尘酒家', participantNpcIds: [] } });
```

也可以在已有存档对象上只演算不落盘：

```ts
window.GufengWorld.action.dispatchWithoutSaving(save, action);
```

模块函数也已通过 `window.GufengWorld` 分组暴露：

- `map`
- `characters`
- `scene`
- `quest`
- `relation`
- `dialogue`
- `aiIndex`
- `events`
- `characterMemory`
- `intimacy`
