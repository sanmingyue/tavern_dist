# 月之屋通用后端包

这份包是给未来 Unity AIRP / JRPG / 养成游戏复用的后端底座。

它不是一个完整游戏，也不是本地酒馆复制品。它负责把角色卡、预设、世界书、记忆、变量、Agent 工具、API 调用和本地存档串起来。以后你做新前端时，只需要写玩法、UI、地图、战斗、养成、演出，再调用月之屋接口即可。

## 包里有什么

- `Assets/YueZhiWu`：月之屋 Unity 后端源码。
- `docs`：架构、设置、审计、接口说明。
- `Packages/manifest.json`：需要的 Unity 包依赖参考。

## 包里不包含什么

- 不包含 Unity 编辑器。
- 不包含 `Library`、`Temp`、`Logs` 等缓存目录。
- 不内置玩家 API Key。
- 不内置你的商业/私有角色内容。

## 推荐导入方式

1. 新建或打开一个 Unity 6 项目。
2. 把本包里的 `Assets/YueZhiWu` 复制到目标项目的 `Assets` 目录下。
3. 检查目标项目 `Packages/manifest.json`，至少需要：

```json
{
  "dependencies": {
    "com.unity.nuget.newtonsoft-json": "3.2.2",
    "com.unity.modules.unitywebrequest": "1.0.0",
    "com.unity.ugui": "2.0.0"
  }
}
```

4. 回到 Unity，等待编译完成。
5. 在 Project 面板中右键创建 `月之屋/Runtime Config`。
6. 新建一个空 GameObject，挂载 `MoonHouseBackend`。
7. 把 Runtime Config 拖到 `MoonHouseBackend.config`。
8. 前端玩法代码通过 `MoonHouseBackend` 或 `IMoonHouseRuntime` 调用后端。

## 玩家侧逻辑

玩家在游戏内填写自己的 API 地址、API Key 和模型。月之屋会把这些设置存在本地存档里，不需要作者内置 Key。

## 作者侧逻辑

作者提供：

- 角色卡。
- 世界书。
- 预设。
- 初始变量。
- 前端玩法。

月之屋提供：

- 提示词组装。
- 世界书扫描。
- 多模型 API 调用。
- 流式与非流式生成。
- 长期记忆和大总结。
- 用户画像。
- Agent 工具调用。
- 输出解析和状态补丁。
- 本地存档。
- SillyTavern 世界书、预设、角色卡导入入口。

## 明天迁移角色卡时

优先把真实角色卡、世界书、预设导入进来跑一轮。真实内容会暴露字段兼容问题，后端再按实际格式补齐即可。
