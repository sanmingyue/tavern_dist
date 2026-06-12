using System;
using System.IO;
using Newtonsoft.Json;
using UnityEngine;

namespace Mingyue.YueZhiWu
{
    public sealed class MoonHouseStore
    {
        private readonly string folderPath;

        public MoonHouseStore(string folderPath = null)
        {
            this.folderPath = string.IsNullOrWhiteSpace(folderPath)
                ? Path.Combine(Application.persistentDataPath, "YueZhiWu")
                : folderPath;
        }

        public MoonHouseSave LoadOrCreate(string fileName, MoonHouseConfig config)
        {
            string path = ResolvePath(fileName);
            if (File.Exists(path))
            {
                try
                {
                    string json = File.ReadAllText(path);
                    MoonHouseSave loaded = JsonConvert.DeserializeObject<MoonHouseSave>(json);
                    return Normalize(loaded, config);
                }
                catch (Exception)
                {
                    BackupBrokenSave(path);
                }
            }

            MoonHouseSave created = CreateInitialSave(config);
            Save(fileName, created);
            return created;
        }

        public void Save(string fileName, MoonHouseSave save)
        {
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            save.updatedAtIso = DateTime.UtcNow.ToString("O");
            string path = ResolvePath(fileName);
            string tempPath = path + ".tmp";
            string json = JsonConvert.SerializeObject(save, Formatting.Indented);
            File.WriteAllText(tempPath, json);
            if (File.Exists(path))
            {
                File.Delete(path);
            }

            File.Move(tempPath, path);
        }

        private string ResolvePath(string fileName)
        {
            string safeName = string.IsNullOrWhiteSpace(fileName) ? "moon_house_save.json" : Path.GetFileName(fileName);
            if (string.IsNullOrWhiteSpace(safeName))
            {
                safeName = "moon_house_save.json";
            }

            return Path.Combine(folderPath, safeName);
        }

        private static void BackupBrokenSave(string path)
        {
            try
            {
                string folder = Path.GetDirectoryName(path);
                string name = Path.GetFileNameWithoutExtension(path);
                string extension = Path.GetExtension(path);
                string stamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                string backupPath = Path.Combine(folder, name + ".broken_" + stamp + extension);
                File.Copy(path, backupPath, true);
            }
            catch
            {
            }
        }

        private static MoonHouseSave Normalize(MoonHouseSave save, MoonHouseConfig config)
        {
            MoonHouseSave normalized = save ?? CreateInitialSave(config);
            normalized.schemaVersion = MoonHouseConstants.SaveSchemaVersion;

            if (string.IsNullOrWhiteSpace(normalized.saveId))
            {
                normalized.saveId = MoonHouseIds.Create("save");
            }

            if (string.IsNullOrWhiteSpace(normalized.createdAtIso))
            {
                normalized.createdAtIso = DateTime.UtcNow.ToString("O");
            }

            if (normalized.messages == null)
            {
                normalized.messages = new System.Collections.Generic.List<MoonHouseMessage>();
            }
            else
            {
                normalized.messages.RemoveAll(message =>
                    message != null &&
                    string.Equals(message.role, "assistant", StringComparison.OrdinalIgnoreCase) &&
                    string.IsNullOrWhiteSpace(message.content));
            }

            if (!HasPresetLibraryContent(normalized.presetLibrary))
            {
                normalized.presetLibrary = CreatePresetLibraryFromConfig(config);
            }

            if (normalized.presetLibrary != null)
            {
                if (string.IsNullOrWhiteSpace(normalized.activeChatPresetId) &&
                    !string.IsNullOrWhiteSpace(normalized.presetLibrary.activeGenerationPresetId))
                {
                    normalized.activeChatPresetId = normalized.presetLibrary.activeGenerationPresetId;
                }
                else if (string.IsNullOrWhiteSpace(normalized.presetLibrary.activeGenerationPresetId) &&
                         !string.IsNullOrWhiteSpace(normalized.activeChatPresetId))
                {
                    normalized.presetLibrary.activeGenerationPresetId = normalized.activeChatPresetId;
                }
            }

            if (normalized.runtimeVariables == null)
            {
                normalized.runtimeVariables = new System.Collections.Generic.List<MoonHouseRuntimeVariable>();
            }

            if (normalized.gameState == null)
            {
                normalized.gameState = new MoonHouseGameState();
            }

            EnsureGameStateShape(normalized.gameState);

            if (normalized.ecosystem == null)
            {
                normalized.ecosystem = new MoonHouseEcosystemState();
            }

            MoonHouseEcosystemRuntime.Ensure(normalized);

            if (normalized.worldbookStates == null)
            {
                normalized.worldbookStates = new System.Collections.Generic.List<WorldbookRuntimeState>();
            }

            if (normalized.memorySettings == null)
            {
                normalized.memorySettings = new MoonHouseMemorySettings();
            }

            if (normalized.memorySettings.dedicatedApiPreset == null)
            {
                normalized.memorySettings.dedicatedApiPreset = new MoonHouseGenerationPreset();
            }

            if (normalized.summaries == null)
            {
                normalized.summaries = new System.Collections.Generic.List<MoonHouseGrandSummary>();
            }

            if (normalized.dynamicProfiles == null)
            {
                normalized.dynamicProfiles = new System.Collections.Generic.List<MoonHouseDynamicProfile>();
            }

            if (normalized.memoryBank == null)
            {
                normalized.memoryBank = new System.Collections.Generic.List<MoonHouseMemoryItem>();
            }

            if (normalized.userPersonas == null)
            {
                normalized.userPersonas = new System.Collections.Generic.List<MoonHouseUserPersona>();
            }
            else
            {
                foreach (MoonHouseUserPersona persona in normalized.userPersonas)
                {
                    if (persona == null)
                    {
                        continue;
                    }

                    if (persona.tags == null)
                    {
                        persona.tags = new System.Collections.Generic.List<string>();
                    }

                    if (persona.capturedFields == null)
                    {
                        persona.capturedFields = new System.Collections.Generic.List<MoonHouseUserPersonaField>();
                    }
                }
            }

            if (normalized.promptStack == null ||
                normalized.promptStack.nodes == null ||
                normalized.promptStack.nodes.Count == 0)
            {
                normalized.promptStack = config != null && config.promptStack != null && config.promptStack.nodes != null && config.promptStack.nodes.Count > 0
                    ? ClonePromptStack(config.promptStack)
                    : MoonHouseDefaults.CreateStarterPromptStack();
            }

            if (normalized.contextBlocks == null || normalized.contextBlocks.Count == 0)
            {
                normalized.contextBlocks = config != null
                    ? new System.Collections.Generic.List<MoonHouseContextBlock>(config.contextBlocks)
                    : new System.Collections.Generic.List<MoonHouseContextBlock>();
            }

            if (normalized.worldbookEntries == null || normalized.worldbookEntries.Count == 0)
            {
                normalized.worldbookEntries = config != null
                    ? new System.Collections.Generic.List<WorldbookEntry>(config.worldbookEntries)
                    : new System.Collections.Generic.List<WorldbookEntry>();
            }

            return normalized;
        }

        private static MoonHouseSave CreateInitialSave(MoonHouseConfig config)
        {
            MoonHouseSave save = new MoonHouseSave
            {
                saveId = MoonHouseIds.Create("save"),
                createdAtIso = DateTime.UtcNow.ToString("O"),
                updatedAtIso = DateTime.UtcNow.ToString("O"),
                characterName = config != null ? config.characterName : "未命名角色",
                playerName = config != null ? config.playerName : "玩家",
                gameState = new MoonHouseGameState(),
                ecosystem = new MoonHouseEcosystemState(),
                presetLibrary = CreatePresetLibraryFromConfig(config),
                worldbookStates = new System.Collections.Generic.List<WorldbookRuntimeState>(),
                memorySettings = new MoonHouseMemorySettings(),
                summaries = new System.Collections.Generic.List<MoonHouseGrandSummary>(),
                dynamicProfiles = new System.Collections.Generic.List<MoonHouseDynamicProfile>(),
                memoryBank = new System.Collections.Generic.List<MoonHouseMemoryItem>(),
                userPersonas = new System.Collections.Generic.List<MoonHouseUserPersona>(),
                activeChatPresetId = config != null ? config.GetActivePreset().presetName : ""
            };

            if (config != null)
            {
                save.contextBlocks = new System.Collections.Generic.List<MoonHouseContextBlock>(config.contextBlocks);
                save.worldbookEntries = new System.Collections.Generic.List<WorldbookEntry>(config.worldbookEntries);
                save.promptStack = config.promptStack != null && config.promptStack.nodes != null && config.promptStack.nodes.Count > 0
                    ? ClonePromptStack(config.promptStack)
                    : MoonHouseDefaults.CreateStarterPromptStack();
            }
            else
            {
                save.promptStack = MoonHouseDefaults.CreateStarterPromptStack();
            }

            if (save.presetLibrary != null && !string.IsNullOrWhiteSpace(save.presetLibrary.activeGenerationPresetId))
            {
                save.activeChatPresetId = save.presetLibrary.activeGenerationPresetId;
            }

            return save;
        }

        private static void EnsureGameStateShape(MoonHouseGameState gameState)
        {
            if (gameState.clock == null)
            {
                gameState.clock = new MoonHouseGameClock();
            }

            if (gameState.location == null)
            {
                gameState.location = new MoonHouseLocationState();
            }

            if (gameState.scene == null)
            {
                gameState.scene = new MoonHouseSceneState();
            }

            if (gameState.actors == null)
            {
                gameState.actors = new System.Collections.Generic.List<MoonHouseActorState>();
            }

            if (gameState.facts == null)
            {
                gameState.facts = new System.Collections.Generic.List<string>();
            }
        }

        private static MoonHousePresetLibrary CreatePresetLibraryFromConfig(MoonHouseConfig config)
        {
            if (config != null && HasPresetLibraryContent(config.presetLibrary))
            {
                MoonHousePresetLibrary clone = ClonePresetLibrary(config.presetLibrary);
                return clone;
            }

            MoonHouseGenerationPreset activePreset = config != null
                ? config.GetActivePreset()
                : new MoonHouseGenerationPreset();
            return MoonHouseDefaults.CreateStarterPresetLibrary(activePreset);
        }

        private static bool HasPresetLibraryContent(MoonHousePresetLibrary library)
        {
            return library != null &&
                   ((library.generationPresets != null && library.generationPresets.Count > 0) ||
                    (library.contextTemplates != null && library.contextTemplates.Count > 0) ||
                    (library.instructTemplates != null && library.instructTemplates.Count > 0) ||
                    (library.systemPrompts != null && library.systemPrompts.Count > 0) ||
                    (library.reasoningPresets != null && library.reasoningPresets.Count > 0));
        }

        private static MoonHousePresetLibrary ClonePresetLibrary(MoonHousePresetLibrary source)
        {
            string json = JsonConvert.SerializeObject(source ?? new MoonHousePresetLibrary());
            MoonHousePresetLibrary clone = JsonConvert.DeserializeObject<MoonHousePresetLibrary>(json);
            return clone ?? new MoonHousePresetLibrary();
        }

        private static MoonHousePromptStack ClonePromptStack(MoonHousePromptStack source)
        {
            MoonHousePromptStack clone = new MoonHousePromptStack();
            if (source?.nodes == null)
            {
                return clone;
            }

            foreach (MoonHousePromptNode node in source.nodes)
            {
                if (node == null)
                {
                    continue;
                }

                clone.nodes.Add(new MoonHousePromptNode
                {
                    identifier = node.identifier,
                    name = node.name,
                    enabled = node.enabled,
                    marker = node.marker,
                    role = node.role,
                    slot = node.slot,
                    injectionPosition = node.injectionPosition,
                    injectionDepth = node.injectionDepth,
                    injectionOrder = node.injectionOrder,
                    priority = node.priority,
                    source = node.source,
                    content = node.content,
                    allowOverride = node.allowOverride,
                    scanForWorldbook = node.scanForWorldbook
                });
            }

            return clone;
        }
    }
}
