using UnityEngine;

namespace Mingyue.YueZhiWu
{
    public class MoonHouseDevConsole : MonoBehaviour
    {
        public MoonHouseBackend backend;

        [TextArea(2, 6)]
        public string playerInput = "玩家操作：走进灵庭，看看她今天的状态。";

        [TextArea(6, 16)]
        public string lastPromptDebug = "";

        [TextArea(6, 16)]
        public string lastReply = "";

        public int modelIndexToSelect = 0;

        [TextArea(4, 10)]
        public string lastModelList = "";

        [ContextMenu("预览月之屋提示词")]
        public void PreviewPrompt()
        {
            MoonHouseBackend target = ResolveBackend();
            if (target == null)
            {
                lastPromptDebug = "没有找到 MoonHouseBackend。";
                return;
            }

            PromptAssembly assembly = target.PreviewPrompt(playerInput);
            lastPromptDebug = assembly.debugSummary + "\n\n" + assembly.injectionText;
        }

        [ContextMenu("发送一次月之屋请求")]
        public async void SendOnce()
        {
            MoonHouseBackend target = ResolveBackend();
            if (target == null)
            {
                lastReply = "没有找到 MoonHouseBackend。";
                return;
            }

            MoonHouseGenerationResult result = await target.GenerateStoryAsync(playerInput);
            lastPromptDebug = result.promptDebugSummary;
            lastReply = result.text;
        }

        [ContextMenu("刷新模型列表")]
        public async void RefreshModels()
        {
            MoonHouseBackend target = ResolveBackend();
            if (target == null)
            {
                lastModelList = "没有找到 MoonHouseBackend。";
                return;
            }

            try
            {
                MoonHouseModelListResult result = await target.RefreshAvailableModelsAsync();
                lastModelList = result.modelIds.Count == 0
                    ? "接口返回成功，但没有发现模型 id。"
                    : string.Join("\n", result.modelIds);
            }
            catch (System.Exception error)
            {
                lastModelList = error.Message;
            }
        }

        [ContextMenu("按序号选择模型")]
        public void SelectModelByIndex()
        {
            MoonHouseBackend target = ResolveBackend();
            if (target == null || target.config == null)
            {
                lastModelList = "没有找到 MoonHouseBackend 或 Config。";
                return;
            }

            MoonHouseGenerationPreset preset = target.config.generationPreset;
            if (preset.availableModels == null || preset.availableModels.Count == 0)
            {
                lastModelList = "还没有模型列表，请先刷新模型列表。";
                return;
            }

            int index = Mathf.Clamp(modelIndexToSelect, 0, preset.availableModels.Count - 1);
            string modelId = preset.availableModels[index];
            target.SelectModel(modelId);
            lastModelList = "已选择模型: " + modelId;
        }

        private MoonHouseBackend ResolveBackend()
        {
            if (backend != null)
            {
                return backend;
            }

            backend = GetComponent<MoonHouseBackend>();
            return backend;
        }
    }
}
