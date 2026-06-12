# 正文类别模块说明

## 模块定位

`narrative` 负责 AIRP 正文输出方式的底层分类，不直接写聊天预设，也不替 AI 生成正文。

它记录当前存档应使用哪种正文形态：

- `staged_dialogue`：分镜台词模式。
- `classic_airp`：传统 AIRP 正文模式。
- `auto`：自动模式，根据场景类别和用户输入判定实际模式。

## 两种输出形态

`staged_dialogue` 用于主线、暗线、关键支线、审问、谈判、拜访 NPC、多角色对话等场景。

它的预期呈现是：

- 正文描写负责场景、动作、环境、后果。
- 角色台词负责谁说了什么。
- 角色心声默认折叠，由前端点击查看。

`classic_airp` 用于旅行、日常、经营、长期陪伴、亲密关系等场景。

它保留正常 AIRP 的完整正文，不强拆成台词块。

## 用户输入解析

`parseNarrativeUserInput` 会按以下规则拆分用户输入：

- `“……”` 或 `"..."`：`{{user}}` 说出口的话。
- `*……*`：`{{user}}` 的内心话，默认私密。
- 其他文本：行动、描写、旁白式补充或意图。

解析结果写入 `save.narrative.lastInputParse`，供预设桥接、前端和后续模块读取。

## 自动模式判定

`auto` 模式下，模块根据 `sceneCategory`、动作类型和用户输入信号判定实际模式。

倾向 `staged_dialogue` 的类别：

- `mainline`
- `hiddenline`
- `sidequest`
- `npc_dialogue`
- `investigation`
- `court`
- `combat`

倾向 `classic_airp` 的类别：

- `travel`
- `daily`
- `business`
- `intimacy`
- `strategy`
- `free`

用户输入中有明确说出口的话时，自由场景会倾向分镜台词模式。

## 防止 AI 作为角色发言

`validateNarrativeOutputBlocks` 用于后续前端或预设桥接校验结构化输出块。

基础规则：

- `dialogue` 和 `character_thought` 必须有合法 `speakerId`。
- `speakerId` 必须来自当前场景允许角色列表。
- 不允许 `AI`、`助手`、`系统`、`旁白君` 等作为说话人。
- `dialogue` 应是纯语言，不写动作描写。
- `character_thought` 默认必须是 `collapsed`。

这个校验层只负责拦截明显结构错误，不负责判断剧情质量。

## 存档字段

字段位于 `save.narrative`：

- `outputMode`：用户偏好，`auto`、`staged_dialogue` 或 `classic_airp`。
- `currentSceneCategory`：当前正文类别。
- `currentSceneTags`：当前正文辅助标签。
- `lastEffectiveOutputMode`：最近一次实际判定模式。
- `lastInputParse`：最近一次用户输入解析。
- `lastModeDecision`：最近一次模式判定。
- `outputRulesVersion`：正文类别规则版本。

## 调度动作

- `NARRATIVE_OUTPUT_MODE_SET`：切换输出偏好。
- `NARRATIVE_SCENE_CATEGORY_SET`：切换当前正文类别。
- `NARRATIVE_USER_INPUT_PARSE`：解析用户输入并写入存档。
- `NARRATIVE_MODE_DECIDE`：根据当前状态判定实际正文模式。

## 前端接口

`window.GufengWorld.narrative` 暴露：

- `setOutputMode`
- `setSceneCategory`
- `parseUserInput`
- `parseAndStoreUserInput`
- `decideMode`
- `decideAndStoreMode`
- `validateOutputBlocks`

正式游玩写存档时优先走 `window.GufengWorld.action.dispatch`。

