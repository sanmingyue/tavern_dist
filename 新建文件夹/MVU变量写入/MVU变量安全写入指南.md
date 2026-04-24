# MVU 变量安全写入指南

## 一、为什么变量会被重置

MVU 变量框架在内部维护了一些关键字段，这些字段存储在 `MvuData` 对象中，与 `stat_data` 并列存在：

- `initialized_lorebooks`：记录哪些世界书条目已经完成了变量初始化
- 其他 MVU 内部管理字段

**问题的根源：** 如果你用 `Mvu.replaceMvuData({ stat_data: ... })` 直接构建一个只包含 `stat_data` 的对象去覆盖，会导致 `initialized_lorebooks` 等内部字段丢失。MVU 在下一轮消息处理时检测到 `initialized_lorebooks` 缺失，会认为该楼层尚未初始化，从而重新执行 `[initvar]` 条目的初始化流程，将你的变量重置为空值或默认值。

**简单来说：** MVU 数据 ≠ `stat_data`，它还包含 MVU 自身的管理信息。覆盖写入会丢失这些管理信息，进而触发重新初始化。

---

## 二、正确的写入模式：读取-修改-写回

核心原则：**永远先读取该楼层完整的 MVU 数据，只修改 `stat_data` 部分，再整体写回。**

```javascript
// ✅ 正确做法：先读取完整数据，再只修改 stat_data
var existingData = Mvu.getMvuData({ type: 'message', message_id: 0 }) || {};
existingData.stat_data = myStatData;
await Mvu.replaceMvuData(existingData, { type: 'message', message_id: 0 });
```

```javascript
// ❌ 错误做法：直接构建 payload 覆盖
var payload = { stat_data: myStatData };
await Mvu.replaceMvuData(payload, { type: 'message', message_id: 0 });
// 这会丢失 initialized_lorebooks 等内部字段！
```

---

## 三、各场景代码片段

### 场景 1：在正则 HTML 的 `<script>` 中写入变量（如开场白）

典型场景：角色卡开场白中的正则 HTML 代码块，需要在页面加载时初始化变量。

```html
<div id="init-container"></div>
<script>
(async function() {
  // 等待 MVU 就绪
  await waitGlobalInitialized('Mvu');

  // 目标楼层（通常是第 0 楼，即开场白楼层）
  var messageId = 0;
  var option = { type: 'message', message_id: messageId };

  // 构建你想写入的 stat_data
  var myStatData = {
    角色名: '测试角色',
    好感度: 50,
    物品栏: {}
  };

  // ✅ 安全写入：先读取完整数据
  var existingData = Mvu.getMvuData(option) || {};
  existingData.stat_data = myStatData;
  await Mvu.replaceMvuData(existingData, option);

  console.info('[开场白] 变量初始化完成');

  // 可选：清空楼层中的脚本内容，避免重复执行导致卡顿
  var $container = $('#init-container');
  $container.closest('.mes_text').find('script').remove();
})();
</script>
```

### 场景 2：在酒馆助手脚本中写入变量

#### 2.1 使用 `Mvu.replaceMvuData` 直接写入

```typescript
import { waitGlobalInitialized } from '@anthropic/types';

$(() => {
  (async () => {
    // 确保 MVU 就绪
    await waitGlobalInitialized('Mvu');

    var option = { type: 'message', message_id: 'latest' };

    // ✅ 安全写入
    var existingData = Mvu.getMvuData(option) || {};
    existingData.stat_data = {
      好感度: 80,
      场景: '花园'
    };
    await Mvu.replaceMvuData(existingData, option);
  })();
});
```

#### 2.2 监听 `VARIABLE_UPDATE_ENDED` 事件修改变量

```typescript
$(() => {
  (async () => {
    await waitGlobalInitialized('Mvu');

    // 监听变量更新结束事件，在此时修改变量
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, (new_variables, old_variables) => {
      // 直接修改 new_variables 即可，MVU 会自动写回
      // 注意：这里修改的是 MVU 传入的对象引用，不需要手动调用 replaceMvuData
      var好感度 = _.get(new_variables, 'stat_data.好感度', 0);
      _.set(new_variables, 'stat_data.好感度', _.clamp(好感度, 0, 100));
    });
  })();
});
```

#### 2.3 用 `Mvu.parseMessage` + `Mvu.replaceMvuData` 自行处理

```typescript
$(() => {
  (async () => {
    await waitGlobalInitialized('Mvu');

    var messageId = getLastMessageId();
    var option = { type: 'message', message_id: messageId };

    // 获取旧变量
    var oldData = Mvu.getMvuData(option);

    // 请求 AI 生成（AI 输出中可能包含 MVU 命令）
    var aiReply = await generate({ user_input: '你好' });

    // 解析 AI 回复中的 MVU 命令，得到更新后的数据
    var newData = await Mvu.parseMessage(aiReply, oldData);

    // ✅ 将解析结果安全写回（parseMessage 返回的 newData 已经包含完整结构）
    await Mvu.replaceMvuData(newData, option);
  })();
});
```

### 场景 3：创建新楼层并附带变量

使用 `createChatMessages` 创建新楼层时，`data` 参数必须包含**完整的 MVU 数据**（不仅仅是 `stat_data`）。

```typescript
$(() => {
  (async () => {
    await waitGlobalInitialized('Mvu');

    // 构建 stat_data
    var myStatData = {
      好感度: 60,
      场景: '酒馆'
    };

    // ✅ 从第 0 楼（或最近一楼）读取完整 MVU 数据结构，替换 stat_data
    var fullData = Mvu.getMvuData({ type: 'message', message_id: 0 }) || {};
    fullData.stat_data = myStatData;

    // 创建新楼层
    await createChatMessages([{
      role: 'assistant',
      message: '欢迎来到酒馆！',
      data: fullData  // ✅ 传入完整数据
    }]);

    console.info('[创建楼层] 已创建带变量的新楼层');
  })();
});
```

**错误示范：**

```typescript
// ❌ 只传 stat_data，丢失内部字段
await createChatMessages([{
  role: 'assistant',
  message: '欢迎来到酒馆！',
  data: { stat_data: myStatData }  // 缺少 initialized_lorebooks 等字段！
}]);
```

---

## 四、工具函数说明

项目提供了 [`mvu-safe-write.js`](mvu-safe-write.js) 工具函数文件，封装了安全写入的常用操作：

| 函数 | 说明 |
|------|------|
| `mvuSafeWrite(statData, option)` | 安全写入：读取完整数据 → 替换 `stat_data` → 写回 |
| `mvuSafeMerge(partialStatData, option)` | 安全合并：读取完整数据 → 合并部分字段到 `stat_data` → 写回 |
| `mvuGetFullData(option, statData)` | 获取完整 MVU 数据，可选替换 `stat_data`，用于传递给 `createChatMessages` |
| `mvuCreateMessage(role, message, statData, createOption)` | 创建带 MVU 变量的新楼层（自动从第 0 楼获取完整数据结构） |

### 使用示例

```javascript
// 安全写入变量
await mvuSafeWrite(
  { 好感度: 80, 场景: '花园' },
  { type: 'message', message_id: 0 }
);

// 安全合并部分字段（不会覆盖其他 stat_data 字段）
await mvuSafeMerge(
  { 好感度: 90 },
  { type: 'message', message_id: 0 }
);

// 获取完整数据用于 createChatMessages
var fullData = mvuGetFullData(
  { type: 'message', message_id: 0 },
  { 好感度: 60, 场景: '酒馆' }
);

// 一步创建带变量的新楼层
await mvuCreateMessage('assistant', '你好！', { 好感度: 50 });
```

---

## 五、常见陷阱

### 1. 不要在 MVU 初始化之前调用写入

```javascript
// ❌ 错误：MVU 可能还未就绪
var data = Mvu.getMvuData({ type: 'message', message_id: 0 });

// ✅ 正确：等待 MVU 初始化完成
await waitGlobalInitialized('Mvu');
var data = Mvu.getMvuData({ type: 'message', message_id: 0 });
```

### 2. `createChatMessages` 的 `data` 也需要完整数据

`createChatMessages` 的 `data` 参数会直接作为新楼层的变量数据存储。如果只传 `{ stat_data: ... }`，新楼层同样会缺少 MVU 内部字段，导致后续初始化重置。

### 3. `setChatMessages` 修改楼层消息内容不影响变量

`setChatMessages` 只修改楼层的消息文本内容（如 `message` 字段），不会触及变量数据。如果你需要同时修改消息和变量，需要分别调用 `setChatMessages`（修改消息）和 `Mvu.replaceMvuData`（修改变量）。

### 4. 写入变量后触发 `generate` 的注意事项

写入变量后如果要触发 `generate` 请求 AI 生成，变量已经保存在楼层中了，AI 回复时 MVU 会正常从上一楼继承变量并根据 AI 输出中的 MVU 命令进行更新，不需要额外处理。

### 5. 避免在短时间内多次写入

如果需要对同一楼层进行多次修改，建议先读取一次数据，修改完所有字段后再写回一次，而不是每修改一个字段就写回一次：

```javascript
// ❌ 低效：多次读写
await mvuSafeMerge({ 好感度: 80 }, option);
await mvuSafeMerge({ 场景: '花园' }, option);
await mvuSafeMerge({ 时间: '黄昏' }, option);

// ✅ 高效：一次读写
await mvuSafeMerge({ 好感度: 80, 场景: '花园', 时间: '黄昏' }, option);
// 或者
await mvuSafeWrite({ 好感度: 80, 场景: '花园', 时间: '黄昏' }, option);
