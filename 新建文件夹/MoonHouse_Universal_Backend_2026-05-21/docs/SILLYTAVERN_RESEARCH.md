# SillyTavern 参考点与协议边界

## 协议

本地路径 `E:\SillyTavern\SillyTavern\LICENSE` 是 GNU Affero General Public License v3.0。

这意味着：如果直接复制、修改、合并 SillyTavern 的服务端/前端实现，并把它作为网络服务或分发软件的一部分使用，通常需要按 AGPL-3.0 开放对应源代码。这里不是法律意见，但工程上建议月之屋保持自写实现，只参考行为、数据边界和交互模式。

## 分词器

参考文件：

- `E:\SillyTavern\SillyTavern\src\endpoints\tokenizers.js`
- `E:\SillyTavern\SillyTavern\public\scripts\tokenizers.js`

SillyTavern 的形态：

- 本地 tokenizer：Llama、Mistral、Yi、Gemma、Jamba、Llama3、Qwen2、Command-R、Nemo、DeepSeek 等。
- 远端 tokenizer：Kobold、Text Generation WebUI 等后端可提供 token count。
- OpenAI/chat 类计数：走服务端 tokenizer endpoint。
- 失败回退：按字符数估算，比例约 `3.35 chars/token`。

月之屋第一版：

- `ITokenCounter` 接口先定好。
- `HeuristicTokenCounter` 用估算保证离线可运行。
- `TokenCounterFactory` 根据模型名做 best-match。
- 后续可加 `RemoteTokenizerCounter` 或接入 C# BPE/SentencePiece 库，不影响世界书和预设层。

月之屋第二步升级：

- 学习 SillyTavern 的 tokenizer 分层，但不复制它的 AGPL tokenizer 资源文件。
- `best_match` 现在会按模型名分到 OpenAI o200k/cl100k、Claude、Llama/Llama3、Mistral、Yi、Gemma/Gemini、Jamba、Qwen2/Qwen3、Command-R/A、Nemo/Pixtral、DeepSeek 等模型族。
- `ITokenCounter` 不只算文本，也算 chat message 的 role、name 和请求 padding 开销，更接近聊天补全接口的实际预算。
- Unity 端保持离线 hybrid 估算，优先保证 Windows、Android、iOS 可运行；以后需要更精确时，可以在不改 PromptComposer/WorldbookScanner 的前提下接远端或原生 tokenizer。

## 世界书

参考文件：

- `E:\SillyTavern\SillyTavern\src\endpoints\worldinfo.js`
- `E:\SillyTavern\SillyTavern\public\scripts\world-info.js`

SillyTavern 的成熟点：

- 条目可常驻激活或按关键词激活。
- 扫描最近聊天，也能扫描角色描述、玩家资料、场景等全局文本。
- 支持主关键词、二级关键词、AND/NOT 逻辑。
- 支持递归：激活条目的内容可以继续触发其他条目。
- 有概率、预算、冷却、sticky、delay、角色过滤、分组竞争和不同插入位置。

月之屋第一版已实现稳定子集：

- 常驻与关键词激活。
- 主关键词、二级关键词、AND_ANY、AND_ALL、NOT_ANY、NOT_ALL。
- case sensitive、whole word、概率、递归、预算裁剪。
- sticky/cooldown/delay 回合状态，存入 `MoonHouseSave.worldbookStates`。
- 分组竞争：同组条目默认只选择优先级最高、order 最靠前的一条。
- 槽位注入：`world_info_before`、`char_description`、`persona_description`、`char_personality`、`scenario`、`world_info_after`、`runtime_context`。

暂不做的复杂项：

- 向量检索。
- SillyTavern UI 编辑器兼容。

这些可以等 Unity 端 AIRP 主循环稳定后再补。

## 聊天预设

参考文件：

- `E:\SillyTavern\SillyTavern\src\endpoints\presets.js`
- `E:\SillyTavern\SillyTavern\public\scripts\preset-manager.js`
- `E:\SillyTavern\SillyTavern\public\scripts\textgen-settings.js`

SillyTavern 的预设层覆盖很多 API 后端与 sampler 参数。月之屋第一版先收敛为：

- `apiProvider = openai_compatible`：OpenAI-compatible chat/completions。
- `apiProvider = gemini`：Gemini 原生 `generateContent` / `streamGenerateContent?alt=sse`。
- `apiProvider = claude`：Claude 原生 `/messages`。
- completion prompt 模式预留。
- temperature、top_p、max_tokens、stop、contextTokens、historyMessageLimit。
- adapter：`mingyue_qiuqing_bad_end` 和普通 inject 两类。

这样可以先承接你旧项目里最关键的 `generate.injects` 思路，同时覆盖最常见的 OpenAI 兼容网关、Gemini 和 Claude。后续再逐步补 Ollama、llama.cpp、KoboldCpp、OpenRouter 的特殊字段。

## 提示词后处理 / NOASS

参考路径：

- `C:\Users\三明月\Desktop\三明月\我的预设\明月秋青Synapse Memory Yield.json`

这个预设里最值得学习的不是某个脚本名字，而是它解决的问题：

- 把多条 system/user/assistant 消息折叠成一条大消息，减少模型被角色边界打断的概率。
- 用 `Human`、`Assistant`、`SYSTEM` 这类前缀保留原始角色信息。
- 用 `<regex order=...>` 做提示词后处理。
- 用 `<@n>...</@n>` 把被世界书或预设插歪的片段移动到更接近目标历史的位置。
- 清理 `<|join|>`、`<|space|>`、`<|curtail|>` 这类控制符。

月之屋已内置对应能力：

- `promptPostProcessor = Default`：保留常规多消息结构。
- `promptPostProcessor = SingleUserMessage`：全部折叠成一条 user。
- `promptPostProcessor = NoAssLike`：执行 NOASS 风格折叠、regex、depth insertion 和控制符清理。

这样前端作者不需要再写酒馆脚本，也不用依赖酒馆的消息后处理环境；预设只需要暴露几个开关。

## Agent / 工具调用

参考路径：

- `C:\Users\三明月\Desktop\三明月\src\wtc`

WTC 的核心价值是“工具注册表 + 参数 schema + 权限/回滚 + 把酒馆世界书、角色卡、预设映射成可编辑对象”。月之屋不需要复刻酒馆 hook 层，因为 Unity 后端自己就是权威环境；我们直接把工具层做成内置运行时。

月之屋第一版 Agent 已支持：

- `JsonActions`：模型把状态修改写进隐藏 `<moonhouse_actions>`，月之屋单次解析并更新存档。
- `NativeTools`：OpenAI-compatible、Gemini、Claude 请求可附带函数 schema，让支持工具调用的模型直接返回 tool calls。
- tool-only 原生函数返回：如果模型只返回工具调用没有正文，月之屋会执行工具并追加一次工具结果回灌请求，让模型补最终可见回复。
- `ToolLoop`：支持有限多轮工具执行，默认最多 2 轮；轮数用完后强制关闭原生 tools，要求模型输出最终回复。
- 工具结果进入 `MoonHouseGenerationResult.toolResults` 和 `agent.tool_executed` / `agent.tool_failed` 事件。
- 内置工具覆盖事实、地点、场景、NPC 状态、运行变量、上下文块、世界书条目。

当前仍不把工具循环做成默认：AIRP 游戏里“前端/Unity 规则权威”更重要，单次隐藏动作适合正文和状态一起回来，避免每次对话都追加第二次 API 调用。真正需要函数模型时，再把预设切到 `NativeTools` 或 `ToolLoop`。

## 智脑 / 长期记忆

参考路径：

- `C:\Users\三明月\Desktop\三明月\src\明月秋青脚本`

智脑的关键经验：

- 不只做一段摘要，而是拆成“剧情摘要 + 角色记忆 + 动态人设”。
- 总结时排除最新 4 条 AI 回复，避免刚发生的内容被过早压缩。
- 角色记忆分 `[核心]` 和 `[近期]`，后续总结保留核心、滚动近期。
- 神经链记忆按当前在场角色激活，而不是把所有角色记忆一次全塞进上下文。
- 已总结的旧楼层可以从普通聊天上下文里移出，靠长期记忆维持连续性。

月之屋已内置：

- `MoonHouseMemoryRuntime`: 总结触发判断、总结请求构建、AI 输出解析、记忆层合并。
- `MoonHouseSave.summaries`: 大总结版本库。
- `MoonHouseSave.dynamicProfiles`: 角色动态人设。
- `MoonHouseSave.memorySettings`: 自动总结、注入、历史裁剪开关。
- `RunMemorySummaryAsync`: 手动或自动触发大总结。
- 提示词注入：`<grand_summary>`、`<dynamic_profiles>`、`<neural_chain>`。
- `excludeSummarizedHistory`: 已总结旧消息不再挤占普通聊天历史。

## 流式输出

SillyTavern 的成熟点：

- 请求层支持 `stream: true`。
- SSE 小包会被持续读取，但 UI 层有自己的 streaming processor。
- 可以停止正在生成的流。
- 统计首 token 时间、生成耗时和速度。

月之屋已完成的子集：

- `MoonHouseApiClient.GenerateStreamAsync` 支持 OpenAI-compatible SSE、Gemini SSE 和 Claude SSE。
- `IMoonHouseRuntime.SendTurnStreamAsync` 用于普通聊天回合流式生成。
- `MoonHouseTurnRequest.stream` 可让 `SendTurnAsync` 自动走流式路径。
- 默认不按单字刷新 UI，而是按 `streamFlushIntervalMs` 和 `streamFlushMinChars` 做缓冲节流，结束时强制 flush。
- 生成完成后仍按完整文本写入聊天历史，前端不用自己拼存档。
- `MoonHouseGenerationResult` 记录总耗时、首段延迟、估算输出 token 和输出速度。

后续要补：

- 更细的分段测速与 UI 展示约定。

## 取消、重试、超时

SillyTavern 的成熟点：

- 前端持有 `AbortController`，停止生成时直接 abort。
- 流式处理器有 `isStopped` 状态，不把中止当成普通成功。
- 服务器端转发流式请求时，客户端连接断开会触发 abort。
- 部分状态检查和外部请求使用 timeout，避免界面永久等待。

月之屋已完成的子集：

- 每次生成可设置 `generationId`，前端可调用 `CancelGeneration(generationId)`。
- 支持 `CancelAllGenerations()`、`IsGenerationRunning()`、`GetActiveGenerationIds()`。
- `MoonHouseTurnRequest` 与 `MoonHouseGenerateRawRequest` 都支持 `timeoutSeconds`、`retryCount`、`retryDelayMs`。
- `MoonHouseApiClient` 在超时、429、408、409、425、5xx 或无响应码时可重试。
- 取消会调用 `UnityWebRequest.Abort()`，并发出 `generation.cancelled` 事件。
- 超时发出 `generation.timeout`，重试发出 `generation.retrying`。

后续要补：

- 更细的“手动取消不弹错误提示”前端约定。

## 你的旧项目迁移点

参考路径：

- `C:\Users\三明月\Desktop\三明月\src\我的养成仙子女友\core\promptComposer.ts`
- `C:\Users\三明月\Desktop\三明月\src\我的养成仙子女友\core\narration.ts`
- `C:\Users\三明月\Desktop\三明月\src\我的养成仙子女友\core\worldbook.ts`

最值得继承的是这条链：

```text
前端/游戏权威结算
-> ActionFactPacket
-> prompt_slot 分槽
-> generate.injects
-> user_input 只放 player_action
-> 正文返回后解析隐藏奖励/状态块
```

月之屋已经按这个方向建模，下一步可以把 `GameSave`、养成结算、背包解析和动态人设从 TypeScript 逐块迁到 C#。
