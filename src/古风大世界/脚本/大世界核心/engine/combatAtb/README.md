# ATB战斗模块说明

## 模块定位

`combatAtb` 负责个人、护卫、小队规模的即时条战斗结算。它参考 Unity 项目的战斗骨架，但运行时只依赖浏览器内存与存档对象，不依赖 Unity、Node、文件系统或后端服务。

旧项目里的境界锁定已改为本世界适用的强者牵制锁。判断字段是 `powerTier`、`lockPower`、`canExertStrengthLock`，用于表达高手、精锐护卫、军中强者互相牵制的战斗边界。

## 核心输入

开战使用 `BattleSetup`：

- `objective`：战斗目标，如击败全部、撑过若干 tick、逃脱、保护目标。
- `playerUnits/enemyUnits/allyUnits/neutralUnits`：参战单位快照。
- `strengthLock`：强者牵制规则开关与参数。

参战单位使用 `BattleUnitSnapshot`：

- `maxHealth/maxInnerPower`：气血与内力。
- `attack/defense/speed/awareness/technique/morale`：战斗基础数值。
- `powerTier/lockPower`：战力层级与牵制能力。
- `methodIds/itemIds/longTermStateIds`：给后续技能、物品、长期状态系统预留。

## 存档接入

通过 `GameAction` 调度：

- `ATB_BATTLE_START`：建立战斗并写入 `save.combat.activeBattle`。
- `ATB_BATTLE_TICK`：推进行动条。
- `ATB_BATTLE_COMMAND`：执行玩家或前端指定指令。
- `ATB_BATTLE_AUTO`：自动推进若干步。

战斗结束后生成 `BattleReportSummary`，写入 `save.combat.recentBattleReports`，并清空激活战斗。

## 前端接口

`window.GufengWorld.combatAtb` 暴露纯逻辑函数：

- `createBattleState`
- `tick`
- `getReadyActor`
- `getLegalTargets`
- `validateCommand`
- `resolveCommand`
- `autoAdvance`
- `finalizeResult`
- `findUnit`
- `getAliveUnits`

正式游玩应优先走 `window.GufengWorld.action.dispatch`，纯逻辑函数用于前端预览、合法目标检查、调试与战斗面板局部推演。

