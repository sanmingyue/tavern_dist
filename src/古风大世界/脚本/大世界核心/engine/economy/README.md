# 经营与资源模块说明

## 模块定位

`economy` 负责产业、资源、人员派驻、经营结算和资源转战略。它是大世界长期游玩的产出端：战斗和战争会消耗资源，经营负责让资源有来源、有风险、有人员安排。

模块只读写当前存档对象，不依赖 Unity、Node、文件系统或外部服务。

## 资源账本

经营资源与战争沙盘资源保持同一组字段：

- `silver`：银钱。
- `grain`：粮草。
- `arms`：军械。
- `horses`：马匹。
- `manpower`：人力。
- `intel`：情报。
- `medicine`：药材。

经营资源存放在 `save.economy.resources`。需要支援战争时，通过 `ECONOMY_TRANSFER_TO_STRATEGY` 转入 `save.strategy.resources`。

## 产业类型

已内置产业类型：

- `merchant_house`：商号。
- `manor`：庄园。
- `escort_agency`：镖局。
- `restaurant`：酒楼。
- `intelligence_post`：情报点。
- `pharmacy`：药铺。
- `horse_ranch`：马场。
- `workshop`：工坊。
- `warehouse`：仓储。
- `dock`：码头。
- `market_stall`：摊铺。
- `custom`：自定义产业。

每种产业有默认产出和维护消耗，也可以在创建/更新产业时传入 `baseYield` 与 `upkeep` 覆盖。

## 人员派驻

派驻记录存放在 `save.economy.assignments`。派驻人员可以是高手、管事、门客、美人或其他固定/生成 NPC。模块只记录 `npcId`、岗位、效率加成、风险修正和维护消耗，不写性格和详细人设。

已内置岗位：

- `manager`：管事。
- `accountant`：账房。
- `guard`：护卫。
- `artisan`：匠师。
- `scout`：探子。
- `broker`：掮客。
- `healer`：医者。
- `stable_master`：马师。
- `host`：主事招待。
- `trainer`：教头。
- `custom`：自定义岗位。

## 结算逻辑

单产业结算走 `BUSINESS_SETTLE`，批量结算走 `ECONOMY_SETTLE_ALL`。

结算会考虑：

- 产业等级。
- 地方繁荣度。
- 风险等级。
- 安保水平。
- 派驻人员效率加成。
- 派驻人员维护消耗。
- 产业自身维护消耗。

结算报告写入 `save.economy.recentReports`，最多保留 30 条。旧字段 `pendingIncome` 保留为兼容字段，只记录净增加银钱。

## 调度动作

- `ECONOMY_BUSINESS_UPSERT`：创建或更新产业。
- `ECONOMY_BUSINESS_REMOVE`：移除产业，并清理相关派驻。
- `ECONOMY_STAFF_ASSIGN`：派驻人员。
- `ECONOMY_STAFF_UNASSIGN`：撤出人员。
- `BUSINESS_SETTLE`：结算单个产业。
- `ECONOMY_SETTLE_ALL`：批量结算产业。
- `ECONOMY_RESOURCE_ADD`：经营资源直接入账。
- `ECONOMY_TRANSFER_TO_STRATEGY`：经营资源转入战略资源。

## 前端接口

`window.GufengWorld.economy` 暴露：

- `resourceIds`
- `createEmptyResources`
- `upsertBusiness`
- `removeBusiness`
- `assignStaff`
- `unassignStaff`
- `settleBusiness`
- `settleBusinessState`
- `settleAllBusinesses`
- `addResourcePatch`
- `transferToStrategy`
- `mergeResources`
- `canAfford`
- `spendResources`
- `addResources`

正式游玩写存档时优先走 `window.GufengWorld.action.dispatch`；纯函数和模块函数主要用于前端预览、调试和交接。

