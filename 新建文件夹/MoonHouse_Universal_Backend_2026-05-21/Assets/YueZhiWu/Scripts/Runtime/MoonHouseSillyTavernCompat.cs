using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace Mingyue.YueZhiWu
{
    public static class MoonHouseSillyTavernCompat
    {
        public static MoonHouseContentPackage ReadWorldbookPackage(string json, string packageName = "")
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                throw new ArgumentException("SillyTavern worldbook JSON is empty.", "json");
            }

            JObject root = JObject.Parse(json);
            JToken data = root["data"] ?? root;
            MoonHouseContentPackage package = CreateBasePackage(
                "sillytavern_worldbook",
                string.IsNullOrWhiteSpace(packageName) ? ReadString(data, "name", "bookName") : packageName);

            package.includesWorldbookEntries = true;
            package.includesWorldbookScanSettings = true;
            package.worldbookScanSettings = new WorldbookScanSettings();

            int index = 1;
            foreach (JToken token in ReadEntries(data["entries"] ?? data["world_entries"] ?? data["worldEntries"]))
            {
                WorldbookEntry entry = ReadWorldbookEntry(token, index, "sillytavern_worldbook");
                if (entry != null)
                {
                    package.worldbookEntries.Add(entry);
                    index += 1;
                }
            }

            return package;
        }

        public static MoonHouseContentPackage ReadPresetPackage(string json, string packageName = "")
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                throw new ArgumentException("SillyTavern preset JSON is empty.", "json");
            }

            JObject root = JObject.Parse(json);
            string name = string.IsNullOrWhiteSpace(packageName)
                ? ReadString(root, "name", "preset_name", "presetName")
                : packageName;
            if (string.IsNullOrWhiteSpace(name))
            {
                name = "SillyTavern Preset";
            }

            MoonHouseContentPackage package = CreateBasePackage("sillytavern_preset", name);
            package.includesPresetLibrary = true;
            package.includesPromptStack = true;
            package.includesWorldbookScanSettings = true;
            package.presetLibrary = new MoonHousePresetLibrary();
            package.promptStack = new MoonHousePromptStack();
            package.worldbookScanSettings = new WorldbookScanSettings();

            MoonHouseGenerationPreset generationPreset = ReadGenerationPreset(root, name);
            package.presetLibrary.generationPresets.Add(generationPreset);
            package.presetLibrary.activeGenerationPresetId = generationPreset.presetName;
            package.presetLibrary.contextTemplates.Add(new MoonHouseContextTemplate
            {
                id = "sillytavern_context",
                name = "SillyTavern Compatible Context"
            });
            package.presetLibrary.instructTemplates.Add(new MoonHouseInstructTemplate
            {
                id = "sillytavern_instruct",
                name = "SillyTavern Compatible Instruct"
            });
            package.presetLibrary.systemPrompts.Add(new MoonHouseSystemPromptPreset
            {
                id = "sillytavern_empty_system",
                name = "SillyTavern Preset System",
                content = "",
                enabled = false
            });
            package.presetLibrary.reasoningPresets.Add(new MoonHouseReasoningPreset
            {
                id = "sillytavern_empty_reasoning",
                name = "SillyTavern Preset Reasoning",
                instruction = "",
                enabled = false
            });
            package.presetLibrary.activeContextTemplateId = "sillytavern_context";
            package.presetLibrary.activeInstructTemplateId = "sillytavern_instruct";
            package.presetLibrary.activeSystemPromptId = "sillytavern_empty_system";
            package.presetLibrary.activeReasoningPresetId = "sillytavern_empty_reasoning";

            int index = 1;
            foreach (JToken prompt in ChildrenOf(root["prompts"]))
            {
                MoonHousePromptNode node = ReadPromptNode(prompt, index);
                if (node != null)
                {
                    package.promptStack.nodes.Add(node);
                    index += 1;
                }
            }

            return package;
        }

        public static MoonHouseContentPackage ReadCharacterCardPackage(string json, string sourceName = "sillytavern_character_card")
        {
            MoonHouseCharacterImportResult imported = MoonHouseCharacterCardImporter.ImportFromJson(json, sourceName);
            MoonHouseContentPackage package = CreateBasePackage("sillytavern_character_card", imported.characterName);
            package.characterName = imported.characterName;
            package.contextBlocks = imported.contextBlocks ?? new List<MoonHouseContextBlock>();
            package.worldbookEntries = imported.worldbookEntries ?? new List<WorldbookEntry>();
            package.includesContextBlocks = package.contextBlocks.Count > 0;
            package.includesWorldbookEntries = package.worldbookEntries.Count > 0;
            return package;
        }

        private static MoonHouseContentPackage CreateBasePackage(string packageType, string packageName)
        {
            return new MoonHouseContentPackage
            {
                schemaVersion = MoonHouseConstants.SaveSchemaVersion,
                packageType = packageType,
                packageName = string.IsNullOrWhiteSpace(packageName) ? packageType : packageName,
                exportedAtIso = DateTime.UtcNow.ToString("O"),
                includesApiSecrets = false
            };
        }

        private static MoonHouseGenerationPreset ReadGenerationPreset(JToken root, string name)
        {
            MoonHouseGenerationPreset preset = new MoonHouseGenerationPreset
            {
                presetName = name,
                temperature = ReadFloat(root, 0.85f, "temperature", "temp"),
                topP = ReadFloat(root, 0.9f, "top_p", "topP"),
                maxTokens = ReadInt(root, 900, "openai_max_tokens", "max_tokens", "max_new_tokens"),
                contextTokens = ReadInt(root, 8192, "openai_max_context", "max_context", "context_length"),
                historyMessageLimit = ReadInt(root, 24, "chat_completion_history", "historyMessageLimit"),
                presetAdapter = "sillytavern_compatible",
                promptPostProcessor = MoonHousePromptPostProcessorMode.Default,
                enableFunctionTools = ReadBool(root, false, "enable_function_calling", "enableFunctionCalling"),
                agentMode = MoonHouseAgentMode.Disabled
            };

            if (preset.maxTokens <= 0)
            {
                preset.maxTokens = 900;
            }

            if (preset.contextTokens <= 0)
            {
                preset.contextTokens = 8192;
            }

            preset.reservedOutputTokens = Math.Max(512, Math.Min(preset.maxTokens, 4096));
            preset.stop = ReadStringList(root["stop"] ?? root["stop_strings"] ?? root["custom_stopping_strings"]);
            return preset;
        }

        private static MoonHousePromptNode ReadPromptNode(JToken token, int index)
        {
            string content = ReadString(token, "content");
            string identifier = ReadString(token, "identifier", "id");
            string name = ReadString(token, "name");
            if (string.IsNullOrWhiteSpace(content) && string.IsNullOrWhiteSpace(name) && string.IsNullOrWhiteSpace(identifier))
            {
                return null;
            }

            bool enabled = ReadBool(token, true, "enabled");
            bool marker = ReadBool(token, false, "marker");
            int order = ReadInt(token, index * 10, "injection_order", "injectionOrder", "order");
            return new MoonHousePromptNode
            {
                identifier = string.IsNullOrWhiteSpace(identifier) ? "st_prompt_" + index : identifier,
                name = string.IsNullOrWhiteSpace(name) ? "SillyTavern Prompt " + index : name,
                enabled = enabled,
                marker = marker,
                role = NormalizeRole(ReadString(token, "role")),
                slot = PromptSlot.RuntimeContext,
                injectionPosition = ReadInt(token, 0, "injection_position", "injectionPosition") == 0
                    ? MoonHousePromptInjectionPosition.PromptStack
                    : MoonHousePromptInjectionPosition.InChat,
                injectionDepth = ReadInt(token, 0, "injection_depth", "injectionDepth"),
                injectionOrder = order,
                priority = 1000 - Math.Min(900, index),
                source = "sillytavern_preset",
                content = content ?? "",
                allowOverride = !ReadBool(token, false, "forbid_overrides", "forbidOverrides"),
                scanForWorldbook = false
            };
        }

        private static WorldbookEntry ReadWorldbookEntry(JToken token, int index, string source)
        {
            if (token == null || token.Type == JTokenType.Null)
            {
                return null;
            }

            string content = ReadString(token, "content", "entry");
            if (string.IsNullOrWhiteSpace(content))
            {
                return null;
            }

            List<string> primaryKeys = ReadStringList(token["keys"] ?? token["key"] ?? token["primaryKeys"] ?? token["primary_keys"]);
            List<string> secondaryKeys = ReadStringList(token["keysecondary"] ?? token["secondary_keys"] ?? token["secondaryKeys"]);
            bool disabled = ReadBool(token, false, "disable", "disabled");
            bool constant = ReadBool(token, false, "constant", "always_active", "alwaysActive");
            bool preventRecursion = ReadBool(token, false, "prevent_recursion", "preventRecursion", "excludeRecursion");

            WorldbookEntry entry = new WorldbookEntry
            {
                id = ReadString(token, "id", "uid"),
                title = ReadString(token, "comment", "name", "title"),
                enabled = !disabled && ReadBool(token, true, "enabled"),
                activation = constant || primaryKeys.Count == 0
                    ? WorldbookActivationMode.Constant
                    : WorldbookActivationMode.Keyword,
                slot = ResolveSlot(token),
                tagName = "world_info",
                index = index,
                content = content.Trim(),
                source = source,
                primaryKeys = primaryKeys,
                secondaryKeys = secondaryKeys,
                secondaryLogic = ResolveSecondaryLogic(token),
                scanDepth = ReadInt(token, 4, "scanDepth", "scan_depth", "depth"),
                priority = ReadInt(token, 100, "priority"),
                order = ReadInt(token, 100, "order", "insertion_order"),
                group = ReadString(token, "group", "groupId", "group_id"),
                groupExclusive = !ReadBool(token, false, "group_override", "groupOverride", "groupNonExclusive"),
                probability = ReadFloat(token, 100f, "probability"),
                caseSensitive = ReadBool(token, false, "case_sensitive", "caseSensitive"),
                matchWholeWords = ReadBool(token, false, "match_whole_words", "matchWholeWords"),
                allowRecursion = !preventRecursion,
                preventRecursion = preventRecursion,
                ignoreBudget = ReadBool(token, false, "ignore_budget", "ignoreBudget"),
                matchPlayerInput = true,
                matchRecentMessages = true,
                matchGameState = true,
                matchRuntimeVariables = true,
                matchContextBlocks = false,
                delayRounds = ReadInt(token, 0, "delay", "delayRounds", "delay_rounds"),
                stickyRounds = ReadInt(token, 0, "sticky", "stickyRounds", "sticky_rounds"),
                cooldownRounds = ReadInt(token, 0, "cooldown", "cooldownRounds", "cooldown_rounds"),
                tags = ReadStringList(token["tags"])
            };

            if (string.IsNullOrWhiteSpace(entry.id))
            {
                entry.id = MoonHouseIds.Create("st_wi");
            }

            if (string.IsNullOrWhiteSpace(entry.title))
            {
                entry.title = "SillyTavern Worldbook " + index;
            }

            return entry;
        }

        private static PromptSlot ResolveSlot(JToken token)
        {
            string position = ReadString(token, "position", "insertion_position", "insertionPosition").ToLowerInvariant();
            int numeric = ReadInt(token, int.MinValue, "position", "insertion_position", "insertionPosition");
            if (position.Contains("before") || numeric == 0)
            {
                return PromptSlot.WorldInfoBefore;
            }

            if (position.Contains("char") || position.Contains("description"))
            {
                return PromptSlot.CharDescription;
            }

            if (position.Contains("scenario"))
            {
                return PromptSlot.Scenario;
            }

            return PromptSlot.WorldInfoAfter;
        }

        private static WorldbookSecondaryLogic ResolveSecondaryLogic(JToken token)
        {
            string value = ReadString(token, "secondary_logic", "secondaryLogic", "selectiveLogic").ToLowerInvariant();
            int numeric = ReadInt(token, -1, "secondary_logic", "secondaryLogic", "selectiveLogic");
            if (value.Contains("all") || numeric == 1)
            {
                return WorldbookSecondaryLogic.AndAll;
            }

            if (value.Contains("not_any") || value.Contains("not any") || numeric == 2)
            {
                return WorldbookSecondaryLogic.NotAny;
            }

            if (value.Contains("not_all") || value.Contains("not all") || numeric == 3)
            {
                return WorldbookSecondaryLogic.NotAll;
            }

            return WorldbookSecondaryLogic.AndAny;
        }

        private static IEnumerable<JToken> ReadEntries(JToken entries)
        {
            if (entries == null || entries.Type == JTokenType.Null)
            {
                yield break;
            }

            if (entries.Type == JTokenType.Array)
            {
                foreach (JToken item in entries.Children())
                {
                    yield return item;
                }
            }
            else if (entries.Type == JTokenType.Object)
            {
                foreach (JProperty property in entries.Children<JProperty>())
                {
                    yield return property.Value;
                }
            }
        }

        private static IEnumerable<JToken> ChildrenOf(JToken token)
        {
            if (token == null || token.Type == JTokenType.Null)
            {
                yield break;
            }

            if (token.Type == JTokenType.Array)
            {
                foreach (JToken item in token.Children())
                {
                    yield return item;
                }
            }
            else
            {
                yield return token;
            }
        }

        private static string NormalizeRole(string role)
        {
            string value = (role ?? "").Trim().ToLowerInvariant();
            if (value == "assistant" || value == "user" || value == "system")
            {
                return value;
            }

            return "system";
        }

        private static string ReadString(JToken token, params string[] names)
        {
            foreach (string name in names)
            {
                JToken value = token?[name];
                if (value != null && value.Type != JTokenType.Null)
                {
                    return value.Type == JTokenType.String ? value.ToString().Trim() : value.ToString();
                }
            }

            return "";
        }

        private static bool ReadBool(JToken token, bool fallback, params string[] names)
        {
            foreach (string name in names)
            {
                JToken value = token?[name];
                if (value != null && value.Type != JTokenType.Null && bool.TryParse(value.ToString(), out bool parsed))
                {
                    return parsed;
                }
            }

            return fallback;
        }

        private static int ReadInt(JToken token, int fallback, params string[] names)
        {
            foreach (string name in names)
            {
                JToken value = token?[name];
                if (value != null && int.TryParse(value.ToString(), NumberStyles.Integer, CultureInfo.InvariantCulture, out int parsed))
                {
                    return parsed;
                }
            }

            return fallback;
        }

        private static float ReadFloat(JToken token, float fallback, params string[] names)
        {
            foreach (string name in names)
            {
                JToken value = token?[name];
                if (value != null && float.TryParse(value.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out float parsed))
                {
                    return parsed;
                }
            }

            return fallback;
        }

        private static List<string> ReadStringList(JToken token)
        {
            List<string> result = new List<string>();
            if (token == null || token.Type == JTokenType.Null)
            {
                return result;
            }

            if (token.Type == JTokenType.Array)
            {
                foreach (JToken item in token.Children())
                {
                    string text = item.ToString().Trim();
                    if (!string.IsNullOrWhiteSpace(text) && !result.Contains(text))
                    {
                        result.Add(text);
                    }
                }
            }
            else
            {
                string text = token.ToString().Trim();
                if (!string.IsNullOrWhiteSpace(text) && !result.Contains(text))
                {
                    result.Add(text);
                }
            }

            return result;
        }
    }
}
