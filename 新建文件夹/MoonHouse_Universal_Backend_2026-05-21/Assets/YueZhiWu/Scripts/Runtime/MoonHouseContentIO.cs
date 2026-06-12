using System;
using System.Collections.Generic;
using System.Linq;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Mingyue.YueZhiWu
{
    public static class MoonHouseContentIO
    {
        private static readonly JsonSerializerSettings JsonSettings = new JsonSerializerSettings
        {
            Formatting = Formatting.Indented,
            NullValueHandling = NullValueHandling.Ignore
        };

        public static string ExportSave(MoonHouseSave save, bool includeApiSecrets = false)
        {
            MoonHouseSave clone = Clone(save ?? new MoonHouseSave());
            NormalizeSave(clone);
            if (!includeApiSecrets)
            {
                SanitizeApiSecrets(clone);
            }

            return JsonConvert.SerializeObject(clone, JsonSettings);
        }

        public static MoonHouseSave ReadSave(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                throw new ArgumentException("存档 JSON 不能为空", "json");
            }

            MoonHouseSave save = JsonConvert.DeserializeObject<MoonHouseSave>(json);
            NormalizeSave(save);
            return save;
        }

        public static string ExportContentPackage(
            MoonHouseSave save,
            MoonHousePresetLibrary presetLibrary,
            MoonHousePromptStack promptStack,
            WorldbookScanSettings scanSettings,
            string packageName,
            bool includeMessages,
            bool includeApiSecrets)
        {
            MoonHouseContentPackage package = CreateBasePackage(save, packageName, includeApiSecrets);
            package.presetLibrary = Clone(presetLibrary);
            package.promptStack = Clone(promptStack);
            package.worldbookScanSettings = Clone(scanSettings);
            package.gameState = Clone(save?.gameState);
            package.ecosystem = Clone(save?.ecosystem);
            package.runtimeVariables = CloneList(save?.runtimeVariables);
            package.contextBlocks = CloneList(save?.contextBlocks);
            package.worldbookEntries = CloneList(save?.worldbookEntries);
            package.memorySettings = Clone(save?.memorySettings);
            package.summaries = CloneList(save?.summaries);
            package.dynamicProfiles = CloneList(save?.dynamicProfiles);
            package.memoryBank = CloneList(save?.memoryBank);
            package.userPersonas = CloneList(save?.userPersonas);
            package.activeUserPersonaId = save?.activeUserPersonaId ?? "";
            package.messages = includeMessages ? CloneList(save?.messages) : new List<MoonHouseMessage>();
            package.includesPresetLibrary = package.presetLibrary != null;
            package.includesPromptStack = package.promptStack != null;
            package.includesWorldbookScanSettings = package.worldbookScanSettings != null;
            package.includesGameState = package.gameState != null;
            package.includesEcosystem = package.ecosystem != null;
            package.includesRuntimeVariables = true;
            package.includesContextBlocks = true;
            package.includesWorldbookEntries = true;
            package.includesMemorySettings = package.memorySettings != null;
            package.includesSummaries = package.summaries != null && package.summaries.Count > 0;
            package.includesDynamicProfiles = package.dynamicProfiles != null && package.dynamicProfiles.Count > 0;
            package.includesMemoryBank = package.memoryBank != null && package.memoryBank.Count > 0;
            package.includesUserPersonas = package.userPersonas != null && package.userPersonas.Count > 0;
            package.includesMessages = includeMessages;

            if (!includeApiSecrets)
            {
                SanitizeApiSecrets(package);
            }

            return JsonConvert.SerializeObject(package, JsonSettings);
        }

        public static string ExportWorldbookPackage(
            MoonHouseSave save,
            WorldbookScanSettings scanSettings,
            string packageName)
        {
            MoonHouseContentPackage package = CreateBasePackage(save, packageName, false);
            package.packageType = "moon_house_worldbook";
            package.worldbookScanSettings = Clone(scanSettings);
            package.worldbookEntries = CloneList(save?.worldbookEntries);
            package.includesWorldbookScanSettings = package.worldbookScanSettings != null;
            package.includesWorldbookEntries = true;
            return JsonConvert.SerializeObject(package, JsonSettings);
        }

        public static string ExportPresetPackage(
            MoonHousePresetLibrary presetLibrary,
            MoonHousePromptStack promptStack,
            WorldbookScanSettings scanSettings,
            string packageName,
            bool includeApiSecrets)
        {
            MoonHouseContentPackage package = CreateBasePackage(null, packageName, includeApiSecrets);
            package.packageType = "moon_house_preset";
            package.presetLibrary = Clone(presetLibrary);
            package.promptStack = Clone(promptStack);
            package.worldbookScanSettings = Clone(scanSettings);
            package.includesPresetLibrary = package.presetLibrary != null;
            package.includesPromptStack = package.promptStack != null;
            package.includesWorldbookScanSettings = package.worldbookScanSettings != null;

            if (!includeApiSecrets)
            {
                SanitizeApiSecrets(package);
            }

            return JsonConvert.SerializeObject(package, JsonSettings);
        }

        public static MoonHouseContentPackage ReadContentPackage(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                throw new ArgumentException("内容包 JSON 不能为空", "json");
            }

            JObject root = JObject.Parse(json);
            MoonHouseContentPackage package;
            if (root["packageType"] != null || root["worldbookEntries"] != null || root["presetLibrary"] != null)
            {
                package = root.ToObject<MoonHouseContentPackage>();
            }
            else
            {
                MoonHouseSave save = root.ToObject<MoonHouseSave>();
                NormalizeSave(save);
                package = CreatePackageFromSave(save, true, false);
                package.packageType = "moon_house_save";
            }

            NormalizePackage(package);
            return package;
        }

        public static MoonHouseContentPackage CreatePackageFromSave(
            MoonHouseSave save,
            bool includeMessages,
            bool includeApiSecrets)
        {
            MoonHouseContentPackage package = CreateBasePackage(save, save?.characterName, includeApiSecrets);
            package.packageType = "moon_house_save";
            package.gameState = Clone(save?.gameState);
            package.ecosystem = Clone(save?.ecosystem);
            package.presetLibrary = Clone(save?.presetLibrary);
            package.runtimeVariables = CloneList(save?.runtimeVariables);
            package.promptStack = Clone(save?.promptStack);
            package.contextBlocks = CloneList(save?.contextBlocks);
            package.worldbookEntries = CloneList(save?.worldbookEntries);
            package.memorySettings = Clone(save?.memorySettings);
            package.summaries = CloneList(save?.summaries);
            package.dynamicProfiles = CloneList(save?.dynamicProfiles);
            package.memoryBank = CloneList(save?.memoryBank);
            package.userPersonas = CloneList(save?.userPersonas);
            package.activeUserPersonaId = save?.activeUserPersonaId ?? "";
            package.messages = includeMessages ? CloneList(save?.messages) : new List<MoonHouseMessage>();
            package.includesGameState = package.gameState != null;
            package.includesEcosystem = package.ecosystem != null;
            package.includesPresetLibrary = package.presetLibrary != null;
            package.includesRuntimeVariables = true;
            package.includesPromptStack = package.promptStack != null;
            package.includesContextBlocks = true;
            package.includesWorldbookEntries = true;
            package.includesMemorySettings = package.memorySettings != null;
            package.includesSummaries = package.summaries != null && package.summaries.Count > 0;
            package.includesDynamicProfiles = package.dynamicProfiles != null && package.dynamicProfiles.Count > 0;
            package.includesMemoryBank = package.memoryBank != null && package.memoryBank.Count > 0;
            package.includesUserPersonas = package.userPersonas != null && package.userPersonas.Count > 0;
            package.includesMessages = includeMessages;
            return package;
        }

        public static MoonHouseImportReport ApplyPackage(
            MoonHouseSave target,
            MoonHouseContentPackage package,
            MoonHouseContentMergeMode mergeMode)
        {
            if (target == null)
            {
                throw new ArgumentNullException("target");
            }

            NormalizeSave(target);
            NormalizePackage(package);

            MoonHouseImportReport report = new MoonHouseImportReport
            {
                sourceType = package.packageType,
                mergeMode = mergeMode
            };

            if (!string.IsNullOrWhiteSpace(package.characterName))
            {
                target.characterName = package.characterName;
            }

            if (!string.IsNullOrWhiteSpace(package.playerName))
            {
                target.playerName = package.playerName;
            }

            if (PackageIncludes(package.includesGameState, package.gameState))
            {
                target.gameState = Clone(package.gameState) ?? new MoonHouseGameState();
                report.gameStateReplaced = true;
            }

            if (PackageIncludes(package.includesEcosystem, package.ecosystem))
            {
                target.ecosystem = Clone(package.ecosystem) ?? new MoonHouseEcosystemState();
                MoonHouseEcosystemRuntime.Ensure(target);
                report.ecosystemReplaced = true;
            }

            if (PackageIncludes(package.includesRuntimeVariables, package.runtimeVariables))
            {
                MergeRuntimeVariables(target, package.runtimeVariables, mergeMode, report);
            }

            if (PackageIncludes(package.includesPresetLibrary, package.presetLibrary))
            {
                target.presetLibrary = target.presetLibrary ?? new MoonHousePresetLibrary();
                ApplyPresetPackageToLibrary(target.presetLibrary, package, mergeMode, report);
                if (!string.IsNullOrWhiteSpace(package.presetLibrary?.activeGenerationPresetId))
                {
                    target.activeChatPresetId = package.presetLibrary.activeGenerationPresetId;
                }
            }

            if (PackageIncludes(package.includesPromptStack, package.promptStack))
            {
                MergePromptStack(target, package.promptStack, mergeMode, report);
            }

            if (PackageIncludes(package.includesContextBlocks, package.contextBlocks))
            {
                MergeContextBlocks(target, package.contextBlocks, mergeMode, report);
            }

            if (PackageIncludes(package.includesWorldbookEntries, package.worldbookEntries))
            {
                MergeWorldbookEntries(target, package.worldbookEntries, mergeMode, report);
            }

            if (PackageIncludes(package.includesMemorySettings, package.memorySettings))
            {
                target.memorySettings = Clone(package.memorySettings) ?? new MoonHouseMemorySettings();
                report.memorySettingsReplaced = true;
            }

            if (PackageIncludes(package.includesSummaries, package.summaries))
            {
                if (mergeMode == MoonHouseContentMergeMode.Replace)
                {
                    target.summaries = new List<MoonHouseGrandSummary>();
                }

                foreach (MoonHouseGrandSummary summary in package.summaries ?? new List<MoonHouseGrandSummary>())
                {
                    if (summary == null || string.IsNullOrWhiteSpace(summary.rawText))
                    {
                        continue;
                    }

                    target.summaries.Add(Clone(summary));
                    report.summariesAdded += 1;
                }
            }

            if (PackageIncludes(package.includesDynamicProfiles, package.dynamicProfiles))
            {
                if (mergeMode == MoonHouseContentMergeMode.Replace)
                {
                    target.dynamicProfiles = new List<MoonHouseDynamicProfile>();
                }

                foreach (MoonHouseDynamicProfile profile in package.dynamicProfiles ?? new List<MoonHouseDynamicProfile>())
                {
                    if (profile == null || string.IsNullOrWhiteSpace(profile.characterName))
                    {
                        continue;
                    }

                    target.dynamicProfiles.Add(Clone(profile));
                    report.dynamicProfilesAdded += 1;
                }
            }

            if (PackageIncludes(package.includesMemoryBank, package.memoryBank))
            {
                MergeMemoryBank(target, package.memoryBank, mergeMode, report);
            }

            if (PackageIncludes(package.includesUserPersonas, package.userPersonas))
            {
                MergeUserPersonas(target, package.userPersonas, package.activeUserPersonaId, mergeMode, report);
            }

            if (PackageIncludes(package.includesMessages, package.messages))
            {
                if (mergeMode == MoonHouseContentMergeMode.Replace)
                {
                    target.messages = new List<MoonHouseMessage>();
                }

                foreach (MoonHouseMessage message in package.messages)
                {
                    if (message == null || string.IsNullOrWhiteSpace(message.content))
                    {
                        continue;
                    }

                    EnsureMessageId(message);
                    target.messages.Add(Clone(message));
                    report.messagesAdded += 1;
                }
            }

            report.message = FormatReportMessage(report);
            return report;
        }

        public static string FormatReportMessage(MoonHouseImportReport report)
        {
            if (report == null)
            {
                return "";
            }

            return "导入完成: 上下文 +" + report.contextBlocksAdded + "/" + report.contextBlocksUpdated +
                   "，世界书 +" + report.worldbookEntriesAdded + "/" + report.worldbookEntriesUpdated +
                   "，提示节点 +" + report.promptNodesAdded + "/" + report.promptNodesUpdated +
                   "，预设 +" + report.generationPresetsAdded + "/" + report.generationPresetsUpdated +
                   "，变量 +" + report.runtimeVariablesAdded + "/" + report.runtimeVariablesUpdated +
                   "，总结 +" + report.summariesAdded +
                   "，动态人设 +" + report.dynamicProfilesAdded +
                   "，消息 +" + report.messagesAdded;
        }

        public static void ApplyPresetPackageToLibrary(
            MoonHousePresetLibrary targetLibrary,
            MoonHouseContentPackage package,
            MoonHouseContentMergeMode mergeMode,
            MoonHouseImportReport report)
        {
            if (targetLibrary == null || package?.presetLibrary == null)
            {
                return;
            }

            NormalizePresetLibrary(targetLibrary);
            NormalizePresetLibrary(package.presetLibrary);

            if (mergeMode == MoonHouseContentMergeMode.Replace)
            {
                targetLibrary.generationPresets.Clear();
                targetLibrary.contextTemplates.Clear();
                targetLibrary.instructTemplates.Clear();
                targetLibrary.systemPrompts.Clear();
                targetLibrary.reasoningPresets.Clear();
            }

            MergeGenerationPresets(targetLibrary, package.presetLibrary.generationPresets, report);
            MergeById(
                targetLibrary.contextTemplates,
                package.presetLibrary.contextTemplates,
                template => template.id,
                (template, id) => template.id = id,
                "context_template",
                () => report.contextTemplatesAdded += 1,
                () => report.contextTemplatesUpdated += 1);
            MergeById(
                targetLibrary.instructTemplates,
                package.presetLibrary.instructTemplates,
                template => template.id,
                (template, id) => template.id = id,
                "instruct_template",
                () => report.instructTemplatesAdded += 1,
                () => report.instructTemplatesUpdated += 1);
            MergeById(
                targetLibrary.systemPrompts,
                package.presetLibrary.systemPrompts,
                prompt => prompt.id,
                (prompt, id) => prompt.id = id,
                "system_prompt",
                () => report.systemPromptsAdded += 1,
                () => report.systemPromptsUpdated += 1);
            MergeById(
                targetLibrary.reasoningPresets,
                package.presetLibrary.reasoningPresets,
                preset => preset.id,
                (preset, id) => preset.id = id,
                "reasoning_preset",
                () => report.reasoningPresetsAdded += 1,
                () => report.reasoningPresetsUpdated += 1);

            CopyActivePresetIds(targetLibrary, package.presetLibrary);
        }

        public static void NormalizeSave(MoonHouseSave save)
        {
            if (save == null)
            {
                return;
            }

            save.schemaVersion = MoonHouseConstants.SaveSchemaVersion;
            if (string.IsNullOrWhiteSpace(save.saveId))
            {
                save.saveId = MoonHouseIds.Create("save");
            }

            if (string.IsNullOrWhiteSpace(save.createdAtIso))
            {
                save.createdAtIso = DateTime.UtcNow.ToString("O");
            }

            save.gameState = save.gameState ?? new MoonHouseGameState();
            save.messages = save.messages ?? new List<MoonHouseMessage>();
            save.presetLibrary = save.presetLibrary ?? new MoonHousePresetLibrary();
            NormalizePresetLibrary(save.presetLibrary);
            save.runtimeVariables = save.runtimeVariables ?? new List<MoonHouseRuntimeVariable>();
            save.worldbookStates = save.worldbookStates ?? new List<WorldbookRuntimeState>();
            save.promptStack = save.promptStack ?? new MoonHousePromptStack();
            save.promptStack.nodes = save.promptStack.nodes ?? new List<MoonHousePromptNode>();
            save.contextBlocks = save.contextBlocks ?? new List<MoonHouseContextBlock>();
            save.worldbookEntries = save.worldbookEntries ?? new List<WorldbookEntry>();
            save.ecosystem = save.ecosystem ?? new MoonHouseEcosystemState();
            MoonHouseEcosystemRuntime.Ensure(save);
            save.memorySettings = save.memorySettings ?? new MoonHouseMemorySettings();
            save.memorySettings.dedicatedApiPreset = save.memorySettings.dedicatedApiPreset ?? new MoonHouseGenerationPreset();
            save.summaries = save.summaries ?? new List<MoonHouseGrandSummary>();
            save.dynamicProfiles = save.dynamicProfiles ?? new List<MoonHouseDynamicProfile>();
            save.memoryBank = save.memoryBank ?? new List<MoonHouseMemoryItem>();
            save.userPersonas = save.userPersonas ?? new List<MoonHouseUserPersona>();
            foreach (MoonHouseUserPersona persona in save.userPersonas)
            {
                if (persona != null)
                {
                    EnsureUserPersonaId(persona);
                }
            }
        }

        private static MoonHouseContentPackage CreateBasePackage(
            MoonHouseSave save,
            string packageName,
            bool includeApiSecrets)
        {
            return new MoonHouseContentPackage
            {
                schemaVersion = MoonHouseConstants.SaveSchemaVersion,
                packageName = string.IsNullOrWhiteSpace(packageName) ? MoonHouseConstants.BackendName : packageName,
                exportedAtIso = DateTime.UtcNow.ToString("O"),
                characterName = save?.characterName ?? "",
                playerName = save?.playerName ?? "",
                includesApiSecrets = includeApiSecrets,
                note = "Moon House backend content package."
            };
        }

        private static void NormalizePackage(MoonHouseContentPackage package)
        {
            if (package == null)
            {
                throw new ArgumentNullException("package");
            }

            package.schemaVersion = MoonHouseConstants.SaveSchemaVersion;
            package.packageType = string.IsNullOrWhiteSpace(package.packageType)
                ? "moon_house_content"
                : package.packageType;
            package.runtimeVariables = package.runtimeVariables ?? new List<MoonHouseRuntimeVariable>();
            package.contextBlocks = package.contextBlocks ?? new List<MoonHouseContextBlock>();
            package.worldbookEntries = package.worldbookEntries ?? new List<WorldbookEntry>();
            package.summaries = package.summaries ?? new List<MoonHouseGrandSummary>();
            package.dynamicProfiles = package.dynamicProfiles ?? new List<MoonHouseDynamicProfile>();
            package.memoryBank = package.memoryBank ?? new List<MoonHouseMemoryItem>();
            package.userPersonas = package.userPersonas ?? new List<MoonHouseUserPersona>();
            package.messages = package.messages ?? new List<MoonHouseMessage>();
            if (package.memorySettings != null)
            {
                package.memorySettings.dedicatedApiPreset = package.memorySettings.dedicatedApiPreset ?? new MoonHouseGenerationPreset();
            }
            if (package.ecosystem != null)
            {
                package.ecosystem.locations = package.ecosystem.locations ?? new List<MoonHouseEcosystemLocation>();
                package.ecosystem.factions = package.ecosystem.factions ?? new List<MoonHouseEcosystemFaction>();
                package.ecosystem.actors = package.ecosystem.actors ?? new List<MoonHouseEcosystemActor>();
                package.ecosystem.relationships = package.ecosystem.relationships ?? new List<MoonHouseEcosystemRelationship>();
                package.ecosystem.events = package.ecosystem.events ?? new List<MoonHouseEcosystemEvent>();
                package.ecosystem.behaviorTrees = package.ecosystem.behaviorTrees ?? new List<MoonHouseBehaviorTree>();
            }
            if (package.promptStack != null)
            {
                package.promptStack.nodes = package.promptStack.nodes ?? new List<MoonHousePromptNode>();
            }
        }

        private static void NormalizePresetLibrary(MoonHousePresetLibrary library)
        {
            library.generationPresets = library.generationPresets ?? new List<MoonHouseGenerationPreset>();
            library.contextTemplates = library.contextTemplates ?? new List<MoonHouseContextTemplate>();
            library.instructTemplates = library.instructTemplates ?? new List<MoonHouseInstructTemplate>();
            library.systemPrompts = library.systemPrompts ?? new List<MoonHouseSystemPromptPreset>();
            library.reasoningPresets = library.reasoningPresets ?? new List<MoonHouseReasoningPreset>();
        }

        private static void MergeRuntimeVariables(
            MoonHouseSave target,
            List<MoonHouseRuntimeVariable> variables,
            MoonHouseContentMergeMode mergeMode,
            MoonHouseImportReport report)
        {
            if (mergeMode == MoonHouseContentMergeMode.Replace)
            {
                target.runtimeVariables = new List<MoonHouseRuntimeVariable>();
            }

            foreach (MoonHouseRuntimeVariable variable in variables ?? new List<MoonHouseRuntimeVariable>())
            {
                if (variable == null || string.IsNullOrWhiteSpace(variable.key))
                {
                    continue;
                }

                int index = target.runtimeVariables.FindIndex(item =>
                    item != null && string.Equals(item.key, variable.key, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    target.runtimeVariables[index] = Clone(variable);
                    report.runtimeVariablesUpdated += 1;
                }
                else
                {
                    target.runtimeVariables.Add(Clone(variable));
                    report.runtimeVariablesAdded += 1;
                }
            }
        }

        private static void MergeUserPersonas(
            MoonHouseSave target,
            List<MoonHouseUserPersona> personas,
            string activeUserPersonaId,
            MoonHouseContentMergeMode mergeMode,
            MoonHouseImportReport report)
        {
            target.userPersonas = target.userPersonas ?? new List<MoonHouseUserPersona>();
            if (mergeMode == MoonHouseContentMergeMode.Replace)
            {
                target.userPersonas = new List<MoonHouseUserPersona>();
                target.activeUserPersonaId = "";
                report.userPersonasReplaced = true;
            }

            foreach (MoonHouseUserPersona persona in personas ?? new List<MoonHouseUserPersona>())
            {
                if (persona == null ||
                    (string.IsNullOrWhiteSpace(persona.rawInput) &&
                     string.IsNullOrWhiteSpace(persona.analyzedProfile) &&
                     string.IsNullOrWhiteSpace(persona.name)))
                {
                    continue;
                }

                EnsureUserPersonaId(persona);
                int index = target.userPersonas.FindIndex(item =>
                    item != null && string.Equals(item.id, persona.id, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    target.userPersonas[index] = Clone(persona);
                    report.userPersonasUpdated += 1;
                }
                else
                {
                    target.userPersonas.Add(Clone(persona));
                    report.userPersonasAdded += 1;
                }
            }

            if (!string.IsNullOrWhiteSpace(activeUserPersonaId) &&
                target.userPersonas.Any(item => item != null && item.id == activeUserPersonaId))
            {
                target.activeUserPersonaId = activeUserPersonaId;
            }
            else if (string.IsNullOrWhiteSpace(target.activeUserPersonaId) && target.userPersonas.Count > 0)
            {
                target.activeUserPersonaId = target.userPersonas[0].id;
            }
        }

        private static void MergeMemoryBank(
            MoonHouseSave target,
            List<MoonHouseMemoryItem> memoryItems,
            MoonHouseContentMergeMode mergeMode,
            MoonHouseImportReport report)
        {
            target.memoryBank = target.memoryBank ?? new List<MoonHouseMemoryItem>();
            if (mergeMode == MoonHouseContentMergeMode.Replace)
            {
                target.memoryBank = new List<MoonHouseMemoryItem>();
            }

            foreach (MoonHouseMemoryItem item in memoryItems ?? new List<MoonHouseMemoryItem>())
            {
                if (item == null || string.IsNullOrWhiteSpace(item.content))
                {
                    continue;
                }

                if (string.IsNullOrWhiteSpace(item.id))
                {
                    item.id = MoonHouseIds.Create("mem");
                }

                item.actors = item.actors ?? new List<string>();
                item.locations = item.locations ?? new List<string>();
                item.tags = item.tags ?? new List<string>();
                item.keywords = item.keywords ?? new List<string>();
                item.relatedMessageIds = item.relatedMessageIds ?? new List<string>();
                if (string.IsNullOrWhiteSpace(item.createdAtIso))
                {
                    item.createdAtIso = DateTime.UtcNow.ToString("O");
                }

                item.updatedAtIso = DateTime.UtcNow.ToString("O");
                int index = target.memoryBank.FindIndex(existing =>
                    existing != null && string.Equals(existing.id, item.id, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    target.memoryBank[index] = Clone(item);
                    report.memoryItemsUpdated += 1;
                }
                else
                {
                    target.memoryBank.Add(Clone(item));
                    report.memoryItemsAdded += 1;
                }
            }
        }

        private static void MergePromptStack(
            MoonHouseSave target,
            MoonHousePromptStack promptStack,
            MoonHouseContentMergeMode mergeMode,
            MoonHouseImportReport report)
        {
            target.promptStack = target.promptStack ?? new MoonHousePromptStack();
            target.promptStack.nodes = target.promptStack.nodes ?? new List<MoonHousePromptNode>();

            if (mergeMode == MoonHouseContentMergeMode.Replace)
            {
                target.promptStack.nodes.Clear();
            }

            foreach (MoonHousePromptNode node in promptStack?.nodes ?? new List<MoonHousePromptNode>())
            {
                if (node == null || string.IsNullOrWhiteSpace(node.content))
                {
                    continue;
                }

                EnsurePromptNodeId(node);
                int index = target.promptStack.nodes.FindIndex(item =>
                    item != null && string.Equals(item.identifier, node.identifier, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    target.promptStack.nodes[index] = Clone(node);
                    report.promptNodesUpdated += 1;
                }
                else
                {
                    target.promptStack.nodes.Add(Clone(node));
                    report.promptNodesAdded += 1;
                }
            }
        }

        private static void MergeContextBlocks(
            MoonHouseSave target,
            List<MoonHouseContextBlock> blocks,
            MoonHouseContentMergeMode mergeMode,
            MoonHouseImportReport report)
        {
            if (mergeMode == MoonHouseContentMergeMode.Replace)
            {
                target.contextBlocks = new List<MoonHouseContextBlock>();
            }

            foreach (MoonHouseContextBlock block in blocks ?? new List<MoonHouseContextBlock>())
            {
                if (block == null || string.IsNullOrWhiteSpace(block.content))
                {
                    continue;
                }

                EnsureContextBlockId(block);
                int index = target.contextBlocks.FindIndex(item =>
                    item != null && string.Equals(item.id, block.id, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    target.contextBlocks[index] = Clone(block);
                    report.contextBlocksUpdated += 1;
                }
                else
                {
                    target.contextBlocks.Add(Clone(block));
                    report.contextBlocksAdded += 1;
                }
            }
        }

        private static void MergeWorldbookEntries(
            MoonHouseSave target,
            List<WorldbookEntry> entries,
            MoonHouseContentMergeMode mergeMode,
            MoonHouseImportReport report)
        {
            if (mergeMode == MoonHouseContentMergeMode.Replace)
            {
                target.worldbookEntries = new List<WorldbookEntry>();
                target.worldbookStates = new List<WorldbookRuntimeState>();
            }

            foreach (WorldbookEntry entry in entries ?? new List<WorldbookEntry>())
            {
                if (entry == null || string.IsNullOrWhiteSpace(entry.content))
                {
                    continue;
                }

                EnsureWorldbookEntryId(entry);
                int index = target.worldbookEntries.FindIndex(item =>
                    item != null && string.Equals(item.id, entry.id, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    target.worldbookEntries[index] = Clone(entry);
                    report.worldbookEntriesUpdated += 1;
                }
                else
                {
                    target.worldbookEntries.Add(Clone(entry));
                    report.worldbookEntriesAdded += 1;
                }
            }
        }

        private static void MergeGenerationPresets(
            MoonHousePresetLibrary targetLibrary,
            List<MoonHouseGenerationPreset> presets,
            MoonHouseImportReport report)
        {
            foreach (MoonHouseGenerationPreset preset in presets ?? new List<MoonHouseGenerationPreset>())
            {
                if (preset == null)
                {
                    continue;
                }

                if (string.IsNullOrWhiteSpace(preset.presetName))
                {
                    preset.presetName = "导入预设 " + MoonHouseIds.Create("preset");
                }

                int index = targetLibrary.generationPresets.FindIndex(item =>
                    item != null && string.Equals(item.presetName, preset.presetName, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    MoonHouseGenerationPreset existing = targetLibrary.generationPresets[index];
                    MoonHouseGenerationPreset merged = Clone(preset);
                    PreserveLocalPresetRuntimeFields(existing, merged);
                    targetLibrary.generationPresets[index] = merged;
                    report.generationPresetsUpdated += 1;
                }
                else
                {
                    targetLibrary.generationPresets.Add(Clone(preset));
                    report.generationPresetsAdded += 1;
                }
            }
        }

        private static void PreserveLocalPresetRuntimeFields(
            MoonHouseGenerationPreset existing,
            MoonHouseGenerationPreset incoming)
        {
            if (existing == null || incoming == null)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(incoming.apiKey) && !string.IsNullOrWhiteSpace(existing.apiKey))
            {
                incoming.apiKey = existing.apiKey;
            }

            if ((incoming.availableModels == null || incoming.availableModels.Count == 0) &&
                existing.availableModels != null &&
                existing.availableModels.Count > 0)
            {
                incoming.availableModels = new List<string>(existing.availableModels);
                incoming.selectedModelIndex = existing.selectedModelIndex;
                incoming.lastModelRefreshAtIso = existing.lastModelRefreshAtIso;
                incoming.lastModelRefreshError = existing.lastModelRefreshError;
            }
        }

        private static void MergeById<T>(
            List<T> target,
            List<T> source,
            Func<T, string> getId,
            Action<T, string> setId,
            string prefix,
            Action added,
            Action updated)
        {
            foreach (T item in source ?? new List<T>())
            {
                if (item == null)
                {
                    continue;
                }

                string id = getId(item);
                if (string.IsNullOrWhiteSpace(id))
                {
                    id = MoonHouseIds.Create(prefix);
                    setId(item, id);
                }

                int index = target.FindIndex(existing =>
                    existing != null && string.Equals(getId(existing), id, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    target[index] = Clone(item);
                    updated();
                }
                else
                {
                    target.Add(Clone(item));
                    added();
                }
            }
        }

        private static void CopyActivePresetIds(MoonHousePresetLibrary target, MoonHousePresetLibrary source)
        {
            if (!string.IsNullOrWhiteSpace(source.activeGenerationPresetId))
            {
                target.activeGenerationPresetId = source.activeGenerationPresetId;
            }

            if (!string.IsNullOrWhiteSpace(source.activeContextTemplateId))
            {
                target.activeContextTemplateId = source.activeContextTemplateId;
            }

            if (!string.IsNullOrWhiteSpace(source.activeInstructTemplateId))
            {
                target.activeInstructTemplateId = source.activeInstructTemplateId;
            }

            if (!string.IsNullOrWhiteSpace(source.activeSystemPromptId))
            {
                target.activeSystemPromptId = source.activeSystemPromptId;
            }

            if (!string.IsNullOrWhiteSpace(source.activeReasoningPresetId))
            {
                target.activeReasoningPresetId = source.activeReasoningPresetId;
            }
        }

        private static bool PackageIncludes<T>(bool flag, T value) where T : class
        {
            return flag || value != null;
        }

        private static bool PackageIncludes<T>(bool flag, List<T> value)
        {
            return flag || (value != null && value.Count > 0);
        }

        private static void EnsureContextBlockId(MoonHouseContextBlock block)
        {
            if (string.IsNullOrWhiteSpace(block.id))
            {
                block.id = MoonHouseIds.Create("ctx");
            }
        }

        private static void EnsureWorldbookEntryId(WorldbookEntry entry)
        {
            if (string.IsNullOrWhiteSpace(entry.id))
            {
                entry.id = MoonHouseIds.Create("wi");
            }
        }

        private static void EnsurePromptNodeId(MoonHousePromptNode node)
        {
            if (string.IsNullOrWhiteSpace(node.identifier))
            {
                node.identifier = MoonHouseIds.Create("prompt_node");
            }
        }

        private static void EnsureMessageId(MoonHouseMessage message)
        {
            if (string.IsNullOrWhiteSpace(message.id))
            {
                message.id = MoonHouseIds.Create("msg");
            }

            if (string.IsNullOrWhiteSpace(message.createdAtIso))
            {
                message.createdAtIso = DateTime.UtcNow.ToString("O");
            }
        }

        private static void EnsureUserPersonaId(MoonHouseUserPersona persona)
        {
            if (string.IsNullOrWhiteSpace(persona.id))
            {
                persona.id = MoonHouseIds.Create("persona");
            }

            if (persona.tags == null)
            {
                persona.tags = new List<string>();
            }

            if (persona.capturedFields == null)
            {
                persona.capturedFields = new List<MoonHouseUserPersonaField>();
            }

            foreach (MoonHouseUserPersonaField field in persona.capturedFields)
            {
                if (field != null && string.IsNullOrWhiteSpace(field.updatedAtIso))
                {
                    field.updatedAtIso = DateTime.UtcNow.ToString("O");
                }
            }

            if (string.IsNullOrWhiteSpace(persona.createdAtIso))
            {
                persona.createdAtIso = DateTime.UtcNow.ToString("O");
            }

            if (string.IsNullOrWhiteSpace(persona.updatedAtIso))
            {
                persona.updatedAtIso = persona.createdAtIso;
            }
        }

        private static void SanitizeApiSecrets(MoonHouseSave save)
        {
            if (save?.memorySettings?.dedicatedApiPreset != null)
            {
                save.memorySettings.dedicatedApiPreset.apiKey = "";
            }

            if (save?.presetLibrary?.generationPresets != null)
            {
                foreach (MoonHouseGenerationPreset preset in save.presetLibrary.generationPresets)
                {
                    if (preset != null)
                    {
                        preset.apiKey = "";
                    }
                }
            }
        }

        private static void SanitizeApiSecrets(MoonHouseContentPackage package)
        {
            if (package?.memorySettings?.dedicatedApiPreset != null)
            {
                package.memorySettings.dedicatedApiPreset.apiKey = "";
            }

            if (package?.presetLibrary?.generationPresets == null)
            {
                return;
            }

            foreach (MoonHouseGenerationPreset preset in package.presetLibrary.generationPresets)
            {
                if (preset != null)
                {
                    preset.apiKey = "";
                }
            }
        }

        private static T Clone<T>(T value)
        {
            if (value == null)
            {
                return default;
            }

            string json = JsonConvert.SerializeObject(value, JsonSettings);
            return JsonConvert.DeserializeObject<T>(json);
        }

        private static List<T> CloneList<T>(List<T> source)
        {
            return source == null ? new List<T>() : Clone(source);
        }
    }
}
