# Unity 布置步骤

我在这台机器上没有检测到 `unity` 命令，也没有在 `C:\Program Files\Unity\Hub\Editor` 找到编辑器，所以这里先按“未安装 Unity”来布置。

## 1. 安装 Unity

按 Unity 官方文档，先安装 Unity Hub，再通过 Hub 安装 Editor。Unity 官方 release 页面显示 Unity 6.3 LTS 支持到 2027 年 12 月，所以新项目建议用 Unity 6.3 LTS；如果你已有团队版本，就用同一 LTS。

参考：

- [Install the Unity Hub](https://docs.unity.com/en-us/hub/install-hub)
- [Download and install the Unity Editor](https://docs.unity.com/en-us/hub/add-editor)
- [Unity 6 releases and support](https://unity.com/releases/release-overview)

安装模块建议：

- Windows/PC：默认模块即可，加 Visual Studio 或 Rider 支持。
- Android：勾选 Android Build Support、Android SDK & NDK Tools、OpenJDK。
- iOS：Unity 里勾选 iOS Build Support，但最终出 iOS 包需要 macOS + Xcode。

## 2. 打开当前工程

在 Unity Hub 里选择 `Add project from disk`，路径填：

```text
C:\Users\三明月\Desktop\Unity_Airp
```

如果 Hub 提示版本不完全一致，用你安装的 Unity 6.3 LTS 打开即可。第一次打开会导入 `Packages/manifest.json` 里的 Newtonsoft JSON 包。

## 3. 创建月之屋配置

在 Unity Project 面板里：

1. 右键 `Assets`。
2. 选择 `Create > 月之屋 > Runtime Config`。
3. 命名为 `MoonHouseConfig`。
4. 选中它，在 Inspector 右上角齿轮菜单或右键菜单执行 `填充月之屋示例配置`。

然后设置 `Generation Preset`：

```text
Endpoint Base Url: http://localhost:11434/v1
Model: qwen2.5:7b
Use Chat Completions: true
Temperature: 0.85
Top P: 0.9
Context Tokens: 8192
```

如果你用云 API，先在 `Api Provider` 里选择接口类型：
- `openai_compatible`：填对应的 `/v1` 根地址，并填 `Api Key`。
- `gemini`：可留空 `Endpoint Base Url` 使用默认 Gemini 地址，也可填 `https://generativelanguage.googleapis.com/v1beta`。
- `claude`：可留空 `Endpoint Base Url` 使用默认 Claude 地址，也可填 `https://api.anthropic.com/v1`。

如果接口支持模型列表，在 `MoonHouseConfig` Inspector 底部点击：

```text
刷新模型列表
```

刷新成功后会出现 `选择模型` 下拉框，选中后会自动写回 `Generation Preset > Model`。如果第三方接口不支持 `/v1/models`，继续手动填写模型名即可。

## 4. 场景里挂载后端

1. 新建空物体：`GameObject > Create Empty`。
2. 命名为 `MoonHouseBackend`。
3. Add Component：`MoonHouseBackend`。
4. 把 `MoonHouseConfig` 拖到组件的 `Config` 字段。
5. 可选：同一个物体再 Add Component：`MoonHouseDevConsole`，在 Inspector 里右键执行 `预览月之屋提示词` 或 `发送一次月之屋请求`。
6. 可选：同一个物体再 Add Component：`MoonHouseDemoUI`，点击 Play 后会自动生成聊天界面。

调用示例：

```csharp
using Mingyue.YueZhiWu;
using UnityEngine;

public class StoryButton : MonoBehaviour
{
    public MoonHouseBackend backend;

    public async void Send()
    {
        MoonHouseGenerationResult result =
            await backend.GenerateStoryAsync("玩家操作：走进灵庭，看看她今天的状态。");
        Debug.Log(result.text);
    }
}
```

## 5. 关于电脑、安卓、iOS

PC 单机最简单：玩家本机跑 Ollama、LM Studio、llama.cpp server，Unity 只连 `localhost` 或局域网。

Android/iOS 可以直连云端 OpenAI-compatible、Gemini 或 Claude API，但不要把商业 API key 硬编码进包里。正式发行时建议二选一：

- 玩家自己填写 API key，存到本机安全存储。
- 你做一个很薄的授权中转服务，Unity 客户端不直接暴露主 key。

月之屋目前是“纯 Unity 本地后端”，适合先把 AIRP 玩法跑通。未来要做账号、云存档、角色工坊审核和付费分发时，再把这些外部服务作为可选模块接入。
