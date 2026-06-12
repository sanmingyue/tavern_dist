# 通信协议草案

此文件定义酒馆桥接脚本、本地服务、独立 UI 之间的第一版消息格式。

## 基础消息

```ts
interface BridgeMessage<T = unknown> {
  id: string;
  type: string;
  source: 'tavern' | 'server' | 'client';
  target: 'tavern' | 'server' | 'client' | 'broadcast';
  timestamp: number;
  payload: T;
}
```

## 连接握手

### `bridge.hello`

酒馆桥接脚本或 UI 连接服务后发送。

```ts
interface HelloPayload {
  role: 'tavern-bridge' | 'phone-client';
  version: string;
  token?: string;
  deviceName?: string;
}
```

### `bridge.ready`

服务确认连接。

```ts
interface ReadyPayload {
  serverVersion: string;
  sessionId: string;
  tavernConnected: boolean;
  phoneClients: number;
}
```

## 酒馆事件

### `tavern.chat.changed`

```ts
interface TavernChatChangedPayload {
  chatId: string;
  characterName?: string;
  userName?: string;
}
```

### `tavern.message.received`

```ts
interface TavernMessageReceivedPayload {
  chatId: string;
  messageId: number;
  role: 'system' | 'user' | 'assistant';
  name?: string;
  content: string;
  createdAt?: number;
}
```

### `tavern.generation.before`

```ts
interface TavernGenerationBeforePayload {
  chatId: string;
  dryRun: boolean;
}
```

### `tavern.generation.after`

```ts
interface TavernGenerationAfterPayload {
  chatId: string;
  messageId?: number;
}
```

## 发给酒馆的命令

### `tavern.input.append`

把文本追加到酒馆输入框。

```ts
interface TavernInputAppendPayload {
  text: string;
}
```

### `tavern.chat.read`

读取聊天楼层。

```ts
interface TavernChatReadPayload {
  range: string | number;
  role?: 'all' | 'user' | 'assistant' | 'system';
}
```

### `tavern.generate.raw`

请求酒馆使用当前上下文生成一段内容。

```ts
interface TavernGenerateRawPayload {
  userInput: string;
  systemPrompt?: string;
  shouldStream?: boolean;
  appId?: string;
}
```

### `tavern.prompt.inject`

生成前注入小手机记忆。

```ts
interface TavernPromptInjectPayload {
  id: string;
  content: string;
  role: 'system' | 'user' | 'assistant';
  position: 'in_chat' | 'before_prompt' | 'after_prompt';
  depth?: number;
  once?: boolean;
}
```

## UI 与服务事件

### `phone.state.request`

UI 请求当前小手机状态。

```ts
interface PhoneStateRequestPayload {
  chatId?: string;
}
```

### `phone.state.patch`

服务向 UI 推送局部状态更新。

```ts
interface PhoneStatePatchPayload {
  chatId: string;
  patch: unknown;
}
```

### `phone.action`

UI 发起用户操作。

```ts
interface PhoneActionPayload {
  chatId: string;
  appId: string;
  action: string;
  data: unknown;
}
```

## 错误

### `bridge.error`

```ts
interface BridgeErrorPayload {
  requestId?: string;
  code: string;
  message: string;
  detail?: unknown;
}
```

## 第一条链路目标

最小可用链路：

```text
酒馆桥接脚本连接服务
  -> 服务确认 bridge.ready
  -> 酒馆新消息触发 tavern.message.received
  -> 服务记录事件并广播 phone.state.patch
  -> 独立 UI 立即显示事件
```

