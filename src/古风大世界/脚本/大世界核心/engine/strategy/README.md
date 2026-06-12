# 战争沙盘模块说明

## 模块定位

`strategy` 负责战役、军令、攻城略地、行军补给、地方控制等大规模冲突，不处理个人几对几战斗。个人战斗交给 `combatAtb`，战争沙盘只在需要时把关键人物、高手、精锐军伍折算为军势数值。

模块运行时只处理存档对象和浏览器内存，不依赖 Unity、Node、文件系统或外部服务。

## 资源与经营玩法的关系

战争沙盘有独立资源账本：

- `silver`：银钱，用于募兵、打点、谈判、筑城。
- `grain`：粮草，用于行军、驻防、围城和每回合维护。
- `arms`：军械，用于募兵、攻城、强攻、驻防。
- `horses`：马匹，用于骑兵编制和机动力补充。
- `manpower`：人力，用于募兵、修筑、征发。
- `intel`：情报，用于侦察、围城、强攻、袭扰、谈判。
- `medicine`：药材，用于强攻后的伤兵维持与长期战损控制。

经营玩法不直接变成战争逻辑。推荐关系是：

- 商号、庄园、镖局、酒楼、情报点等经营系统产出资源。
- 前端或调度层把产出转入 `save.strategy.resources`。
- 战争沙盘消耗资源，并把战果、损失、地方秩序变化、路线风险等后果写回战役状态。

这样经营可以支撑战争，但经营系统本身仍保持独立。

## 核心对象

- `StrategyCampaignState`：一场战役的总状态。
- `StrategyForce`：军队、义勇、边军、精锐小队等可行动力量。
- `StrategyLocation`：城池、关隘、码头、绿洲、营寨等战略地点。
- `StrategyRoute`：地点之间的行军路线。
- `StrategyOrder`：军令。

## 已支持军令

- `recruit`：募兵。
- `fortify`：加固城防。
- `gather_intel`：搜集情报。
- `march`：行军。
- `defend`：驻防。
- `siege`：围城。
- `assault`：强攻。
- `raid_supply`：袭扰粮道。
- `escort`：护送。
- `suppress_unrest`：弹压地方动乱。
- `negotiate`：谈判。

## 存档接入

通过 `GameAction` 调度：

- `STRATEGY_CAMPAIGN_START`：建立战役并设为激活战役。
- `STRATEGY_ORDER_ENQUEUE`：把军令加入激活战役。
- `STRATEGY_TURN_RESOLVE`：结算本回合军令与粮草维护。

战役状态写入 `save.strategy.campaigns`，激活战役 ID 写入 `save.strategy.activeCampaignId`，资源账本写入 `save.strategy.resources`。

## 前端接口

`window.GufengWorld.strategy` 暴露纯逻辑函数：

- `resourceIds`
- `createEmptyResources`
- `createCampaign`
- `enqueueOrder`
- `resolveOrder`
- `resolveTurn`
- `mergeResources`
- `canAfford`
- `spendResources`
- `addResources`

正式游玩应优先走 `window.GufengWorld.action.dispatch`。纯逻辑函数用于前端预览资源消耗、展示军令结果、调试战役面板。

