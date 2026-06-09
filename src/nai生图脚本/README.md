# NAI 生图脚本

版本：0.0.3

这个脚本用于配合酒馆世界书：AI 正常输出正文，并在正文末尾额外输出 `<nai-image>`
提示词块。脚本捕获后会把提示词块保存到楼层
`data.nai_image_script`，再从楼层正文中移除它。玩家和后续 AI 都看不到提示词块，只有脚本可以读取它并用于生成或重新生成图片。

## 面板

加载脚本后可以点击脚本按钮 `NAI打开面板`，或点击悬浮按钮打开面板。

面板目前分为五页：

- `接口`：填写 NovelAI Persistent API Token，设置生图接口，测试实际生图链路，并查看最新一次日志。
- `生成`：控制是否启用脚本、是否自动处理新 AI 楼层、图片缓存方式、缓存清理和会员免费范围策略。
- `NAI设置`：配置模型、作者串、尺寸、步数、采样器、负面提示词、种子、SMEA 等核心参数。
- `提示词助手`：填写 OpenAI 兼容 API Key 和 Base
  URL，自动拉取模型后，在面板内和模型讨论 NAI 提示词写法。这一页是脚本面板自己的独立请求，会直接访问
  `Base URL + /models` 和
  `Base URL + /chat/completions`，不走酒馆正文聊天页面，也不会调用酒馆当前预设生成回复。助手请求已内置“明月秋青 NAI 提示词预设”的生图知识和完整输出保护。
- `日志`：只保留最新一次成功、警告或报错，并给出中文排查方案。

面板右上角有 `暖`、`冷` 两套主题和 `1`、`2`、`3` 三档界面大小。暖色主题是暖白底和深色文字，冷色主题是深冷底和白色文字。

## API 测试

`测试生图`
会用 512x512、28 步的轻量参数实际请求一次生图。它直接验证 token、生图接口、浏览器网络和代理是否能完成真实请求。是否消耗 Anlas 以 NovelAI 账号与官方规则为准；如果担心消耗，可以先把策略设为
`免费优先`。

脚本不再保留订阅接口测试。订阅接口和生图接口不是同一条浏览器请求链路，在酒馆脚本环境中容易被代理、跨域策略或扩展拦截；它失败并不代表生图不可用。

不要把 token 写进世界书、角色卡、公开预设或聊天正文。

## 图片缓存

图片本体默认保存到浏览器 IndexedDB 缓存中，默认保留 7 天，也可以在面板里调整为 1 到 30 天。楼层正文不会保存 data
URL，所以聊天文件不会被图片撑大。

楼层 `data.nai_image_script` 会保存：

- 原始 `<nai-image>` 块
- 解析后的参数
- seed、模型、尺寸
- 图片缓存 id，一个请求返回多张图时会保存多条
- 缓存过期时间

如果 7 天后图片被脚本清理，或浏览器提前清理缓存，楼层下方会显示缓存已过期，并保留 `重新生成` 按钮。

`保存图片`
按钮会优先尝试系统分享；不支持分享时改为浏览器下载。一次生成多张时，楼层下方会分别显示保存按钮。iOS 上如果分享或下载被 iframe 限制，仍可以长按图片走系统保存或分享。

面板中可以统计缓存数量、清理过期缓存或清空全部图片缓存。清空后聊天楼层仍会保留重新生成按钮。

浏览器脚本不能稳定写入用户指定的任意本地文件夹；如果以后要支持固定目录，需要配套本地服务或酒馆侧文件接口。

## 会员免费范围

脚本默认按 NovelAI
Opus 会员的免费生图范围保护，而不是按免费账号规则判断。脚本不会估算具体扣多少 Anlas，只判断当前参数是否可能离开会员免费范围。

以下情况会显示“当前参数已超出会员免费生图范围，生成可能消耗 Anlas”：

- 超过 28 步
- 分辨率超过约 1024x1024 总像素范围
- 一次生成多张
- 启用 SMEA 或动态 SMEA
- 后续接入底图、参考图、叠图、Vibe 等图片输入能力后，也会纳入判断

- `免费优先`：疑似消耗 Anlas 时阻止请求。
- `提醒后允许`：记录并弹出提醒，但继续请求。
- `直接允许`：只显示状态，不阻止请求。

进入可能消耗 Anlas 的状态时只提醒一次；参数改回会员免费范围后，提醒状态会重置。

## 世界书提示词建议

让你在正文末尾追加一个 YAML 块。脚本会把这个块转存到楼层 data，再从玩家可见正文和后续 AI 上下文中移除。

固定作者串、画风串、质量词放在面板的 `作者串` 中。世界书只负责让你根据本楼正文输出本楼独有的 `positive` 和
`negative_prompt`。发送给 NAI 时，脚本会自动拼成：

```text
作者串, 本楼 positive
```

多角色和站位由 `characters` 字段描述。可以写
`position: left`、`center`、`right`、`upper left`、`lower right`，也可以直接写 `x`、`y`，数值范围是 0 到 1。

```text
当本次回复适合配图时，在正文末尾追加一个 <nai-image> 块。
<nai-image> 内只写 YAML，不要写解释。positive 使用英文 NAI 提示词，negative_prompt 可省略。
不要把固定作者串写进 positive，固定作者串由脚本面板管理。

格式：
<nai-image>
positive: "1girl, sitting by the window, warm indoor light, looking at viewer"
negative_prompt: "lowres, bad anatomy, bad hands, text, watermark"
width: 832
height: 1216
steps: 28
scale: 5
seed: random
characters:
  - name: "Qiuqingzi"
    prompt: "1girl, long dark hair, gentle expression, white blouse"
    position: center
</nai-image>
```

双人构图示例：

```text
<nai-image>
positive: "2girls, quiet tea room, afternoon light, soft composition"
negative_prompt: "lowres, text, watermark, bad hands"
characters:
  - name: "left girl"
    prompt: "1girl, black hair, calm expression, holding a teacup"
    position: left
  - name: "right girl"
    prompt: "1girl, silver hair, gentle smile, leaning forward"
    position: right
</nai-image>
```

块内字段会临时覆盖面板里的同名参数；没有写的字段会沿用面板设置。点击 `重新生成`
时，脚本会继续使用楼层 data 中保存的提示词块。
