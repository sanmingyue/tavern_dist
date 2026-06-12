using System;
using System.Threading.Tasks;
using UnityEditor;
using UnityEngine;

namespace Mingyue.YueZhiWu.Editor
{
    [CustomEditor(typeof(MoonHouseConfig))]
    public class MoonHouseConfigEditor : UnityEditor.Editor
    {
        private bool isRefreshingModels;
        private string refreshStatus = "";

        public override void OnInspectorGUI()
        {
            DrawDefaultInspector();

            MoonHouseConfig config = (MoonHouseConfig)target;
            MoonHouseGenerationPreset preset = config.generationPreset;
            if (preset == null)
            {
                return;
            }

            EditorGUILayout.Space(10);
            EditorGUILayout.LabelField("模型列表", EditorStyles.boldLabel);

            if (!string.IsNullOrWhiteSpace(preset.lastModelRefreshAtIso))
            {
                EditorGUILayout.LabelField("上次刷新", preset.lastModelRefreshAtIso);
            }

            if (!string.IsNullOrWhiteSpace(preset.lastModelRefreshError))
            {
                EditorGUILayout.HelpBox(preset.lastModelRefreshError, MessageType.Warning);
            }

            DrawModelDropdown(config, preset);

            using (new EditorGUI.DisabledScope(isRefreshingModels))
            {
                if (GUILayout.Button(isRefreshingModels ? "正在刷新模型列表..." : "刷新模型列表"))
                {
                    _ = RefreshModelsAsync(config);
                }
            }

            if (!string.IsNullOrWhiteSpace(refreshStatus))
            {
                EditorGUILayout.HelpBox(refreshStatus, MessageType.Info);
            }
        }

        private void DrawModelDropdown(MoonHouseConfig config, MoonHouseGenerationPreset preset)
        {
            if (preset.availableModels == null || preset.availableModels.Count == 0)
            {
                EditorGUILayout.HelpBox("还没有模型列表。点击“刷新模型列表”，或继续手动填写 Model。", MessageType.Info);
                return;
            }

            string[] options = preset.availableModels.ToArray();
            int currentIndex = preset.availableModels.IndexOf(preset.model);
            if (currentIndex < 0)
            {
                currentIndex = Mathf.Clamp(preset.selectedModelIndex, 0, options.Length - 1);
            }

            int nextIndex = EditorGUILayout.Popup("选择模型", currentIndex, options);
            if (nextIndex != currentIndex && nextIndex >= 0 && nextIndex < options.Length)
            {
                Undo.RecordObject(config, "Select Moon House Model");
                preset.selectedModelIndex = nextIndex;
                preset.model = options[nextIndex];
                EditorUtility.SetDirty(config);
                refreshStatus = "已选择模型: " + preset.model;
            }
        }

        private async Task RefreshModelsAsync(MoonHouseConfig config)
        {
            isRefreshingModels = true;
            refreshStatus = "";
            Repaint();

            try
            {
                MoonHouseApiClient client = new MoonHouseApiClient();
                MoonHouseModelListResult result = await client.FetchModelsAsync(config.generationPreset);

                Undo.RecordObject(config, "Refresh Moon House Models");
                config.generationPreset.availableModels = result.modelIds;
                config.generationPreset.lastModelRefreshAtIso = result.refreshedAtIso;
                config.generationPreset.lastModelRefreshError = "";
                config.generationPreset.selectedModelIndex =
                    config.generationPreset.availableModels.IndexOf(config.generationPreset.model);

                if (config.generationPreset.selectedModelIndex < 0 && result.modelIds.Count > 0)
                {
                    config.generationPreset.selectedModelIndex = 0;
                    config.generationPreset.model = result.modelIds[0];
                }

                EditorUtility.SetDirty(config);
                AssetDatabase.SaveAssets();
                refreshStatus = "已获取模型数量: " + result.modelIds.Count;
            }
            catch (Exception error)
            {
                Undo.RecordObject(config, "Refresh Moon House Models Failed");
                config.generationPreset.lastModelRefreshError = error.Message;
                EditorUtility.SetDirty(config);
                refreshStatus = "获取失败，仍可手动填写 Model。";
            }
            finally
            {
                isRefreshingModels = false;
                Repaint();
            }
        }
    }
}
