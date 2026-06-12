using System.Collections.Generic;
using UnityEngine;

namespace Mingyue.YueZhiWu
{
    [CreateAssetMenu(menuName = "月之屋/Runtime Config", fileName = "MoonHouseConfig")]
    public class MoonHouseConfig : ScriptableObject
    {
        public string characterName = "月之屋角色";
        public string playerName = "三明月";
        public MoonHouseGenerationPreset generationPreset = new MoonHouseGenerationPreset();
        public List<MoonHouseGenerationPreset> chatPresets = new List<MoonHouseGenerationPreset>();
        public int activePresetIndex = -1;
        public MoonHousePresetLibrary presetLibrary = new MoonHousePresetLibrary();
        public MoonHousePromptStack promptStack = new MoonHousePromptStack();
        public WorldbookScanSettings worldbookScanSettings = new WorldbookScanSettings();
        public List<MoonHouseContextBlock> contextBlocks = new List<MoonHouseContextBlock>();
        public List<WorldbookEntry> worldbookEntries = new List<WorldbookEntry>();

        public MoonHouseGenerationPreset GetActivePreset()
        {
            if (chatPresets != null &&
                activePresetIndex >= 0 &&
                activePresetIndex < chatPresets.Count &&
                chatPresets[activePresetIndex] != null)
            {
                return chatPresets[activePresetIndex];
            }

            return generationPreset ?? new MoonHouseGenerationPreset();
        }

        [ContextMenu("填充月之屋示例配置")]
        public void FillStarterDefaults()
        {
            if (contextBlocks == null || contextBlocks.Count == 0)
            {
                contextBlocks = MoonHouseDefaults.CreateStarterContextBlocks();
            }

            if (worldbookEntries == null || worldbookEntries.Count == 0)
            {
                worldbookEntries = MoonHouseDefaults.CreateStarterWorldbookEntries();
            }

            if (chatPresets == null)
            {
                chatPresets = new List<MoonHouseGenerationPreset>();
            }

            if (chatPresets.Count == 0 && generationPreset != null)
            {
                chatPresets.Add(generationPreset);
                activePresetIndex = 0;
            }

            if (presetLibrary == null ||
                presetLibrary.contextTemplates == null ||
                presetLibrary.contextTemplates.Count == 0)
            {
                presetLibrary = MoonHouseDefaults.CreateStarterPresetLibrary(generationPreset);
            }

            if (promptStack == null || promptStack.nodes == null || promptStack.nodes.Count == 0)
            {
                promptStack = MoonHouseDefaults.CreateStarterPromptStack();
            }
        }
    }
}
