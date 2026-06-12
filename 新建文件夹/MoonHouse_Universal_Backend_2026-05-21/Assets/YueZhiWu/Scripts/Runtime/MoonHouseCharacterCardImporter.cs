using System;
using System.Collections.Generic;
using Newtonsoft.Json.Linq;

namespace Mingyue.YueZhiWu
{
    public class MoonHouseCharacterImportResult
    {
        public string characterName = "";
        public List<MoonHouseContextBlock> contextBlocks = new List<MoonHouseContextBlock>();
        public List<WorldbookEntry> worldbookEntries = new List<WorldbookEntry>();
        public string report = "";
    }

    public static class MoonHouseCharacterCardImporter
    {
        public static MoonHouseCharacterImportResult ImportFromJson(string json, string sourceName = "character_card")
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                throw new ArgumentException("角色卡 JSON 不能为空", "json");
            }

            JObject root = JObject.Parse(json);
            JToken data = root["data"] ?? root;
            MoonHouseCharacterImportResult result = new MoonHouseCharacterImportResult();
            string source = string.IsNullOrWhiteSpace(sourceName) ? "character_card" : sourceName;

            result.characterName = ReadString(data, "name", "char_name", "character_name");

            AddContext(result, PromptSlot.CharDescription, "char_description", "角色描述", ReadString(data, "description", "char_persona"), source, 950);
            AddContext(result, PromptSlot.CharPersonality, "char_personality", "角色性格", ReadString(data, "personality"), source, 850);
            AddContext(result, PromptSlot.Scenario, "scenario", "初始场景", ReadString(data, "scenario"), source, 760);
            AddContext(result, PromptSlot.RuntimeContext, "first_message", "开场白参考", ReadString(data, "first_mes", "first_message"), source, 640);
            AddContext(result, PromptSlot.RuntimeContext, "example_dialogue", "示例对话", ReadString(data, "mes_example", "example_dialogue"), source, 600);
            AddContext(result, PromptSlot.RuntimeContext, "system_prompt", "角色卡系统提示", ReadString(data, "system_prompt"), source, 900);
            AddContext(result, PromptSlot.RuntimeContext, "post_history", "历史后提示", ReadString(data, "post_history_instructions"), source, 700);
            AddContext(result, PromptSlot.RuntimeContext, "creator_notes", "作者备注", ReadString(data, "creator_notes", "creatorcomment"), source, 520);
            AddAlternateGreetings(result, data["alternate_greetings"], source);
            AddDepthPrompt(result, data["extensions"]?["depth_prompt"], source);

            ImportCharacterBook(result, data["character_book"] ?? data["world_book"] ?? data["extensions"]?["world"], source);

            result.report = "导入角色卡: " +
                            (string.IsNullOrWhiteSpace(result.characterName) ? "未命名角色" : result.characterName) +
                            "，上下文块 " + result.contextBlocks.Count +
                            "，世界书 " + result.worldbookEntries.Count;
            return result;
        }

        private static void AddContext(
            MoonHouseCharacterImportResult result,
            PromptSlot slot,
            string tagName,
            string label,
            string content,
            string source,
            int priority)
        {
            if (string.IsNullOrWhiteSpace(content))
            {
                return;
            }

            result.contextBlocks.Add(new MoonHouseContextBlock
            {
                id = MoonHouseIds.Create("card_ctx"),
                slot = slot,
                tagName = tagName,
                index = result.contextBlocks.Count + 1,
                label = label,
                content = content.Trim(),
                source = source,
                matchReason = "角色卡导入",
                priority = priority
            });
        }

        private static void AddAlternateGreetings(MoonHouseCharacterImportResult result, JToken greetings, string source)
        {
            if (greetings == null || greetings.Type != JTokenType.Array)
            {
                return;
            }

            int index = 1;
            foreach (JToken greeting in greetings.Children())
            {
                string text = greeting.ToString().Trim();
                if (string.IsNullOrWhiteSpace(text))
                {
                    continue;
                }

                AddContext(
                    result,
                    PromptSlot.RuntimeContext,
                    "alternate_greeting",
                    "备用开场白 " + index,
                    text,
                    source,
                    560);
                index += 1;
            }
        }

        private static void AddDepthPrompt(MoonHouseCharacterImportResult result, JToken depthPrompt, string source)
        {
            string prompt = ReadString(depthPrompt, "prompt");
            if (string.IsNullOrWhiteSpace(prompt))
            {
                return;
            }

            AddContext(
                result,
                PromptSlot.RuntimeContext,
                "depth_prompt",
                "深度提示",
                prompt,
                source,
                720);
        }

        private static void ImportCharacterBook(MoonHouseCharacterImportResult result, JToken book, string source)
        {
            if (book == null || book.Type == JTokenType.Null || book.Type == JTokenType.String)
            {
                return;
            }

            IEnumerable<JToken> entries = ReadEntries(book?["entries"]);
            if (entries == null)
            {
                return;
            }

            int index = 1;
            foreach (JToken token in entries)
            {
                string content = ReadString(token, "content", "entry");
                if (string.IsNullOrWhiteSpace(content))
                {
                    continue;
                }

                List<string> primaryKeys = ReadStringList(token, "keys", "key", "primary_keys", "primaryKeys");
                bool disabled = ReadBool(token, false, "disable", "disabled");
                bool constant = ReadBool(token, false, "constant", "always_active", "alwaysActive");
                bool preventRecursion = ReadBool(token, false, "prevent_recursion", "preventRecursion");

                WorldbookEntry entry = new WorldbookEntry
                {
                    id = ReadString(token, "id", "uid"),
                    title = ReadString(token, "comment", "name", "title"),
                    enabled = ReadBool(token, !disabled, "enabled"),
                    activation = constant || primaryKeys.Count == 0
                        ? WorldbookActivationMode.Constant
                        : WorldbookActivationMode.Keyword,
                    slot = ResolveWorldbookSlot(token),
                    tagName = "card_world_info",
                    index = index,
                    content = content.Trim(),
                    primaryKeys = primaryKeys,
                    secondaryKeys = ReadStringList(token, "secondary_keys", "secondaryKeys", "secondary_keys_regex", "secondaryKeysRegex"),
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
                    matchPlayerInput = ReadBool(token, true, "match_player_input", "matchPlayerInput"),
                    matchRecentMessages = ReadBool(token, true, "match_recent_messages", "matchRecentMessages"),
                    matchGameState = ReadBool(token, true, "match_game_state", "matchGameState"),
                    matchRuntimeVariables = ReadBool(token, true, "match_runtime_variables", "matchRuntimeVariables"),
                    matchContextBlocks = ReadBool(token, false, "match_character_description", "match_character_personality", "match_scenario", "matchContextBlocks"),
                    delayRounds = ReadInt(token, 0, "delay", "delayRounds", "delay_rounds"),
                    stickyRounds = ReadInt(token, 0, "sticky", "stickyRounds", "sticky_rounds"),
                    cooldownRounds = ReadInt(token, 0, "cooldown", "cooldownRounds", "cooldown_rounds"),
                    source = source
                };

                if (string.IsNullOrWhiteSpace(entry.id))
                {
                    entry.id = MoonHouseIds.Create("card_wi");
                }

                if (string.IsNullOrWhiteSpace(entry.title))
                {
                    entry.title = "角色卡世界书 " + index;
                }

                result.worldbookEntries.Add(entry);
                index += 1;
            }
        }

        private static IEnumerable<JToken> ReadEntries(JToken entries)
        {
            if (entries == null || entries.Type == JTokenType.Null)
            {
                return null;
            }

            if (entries.Type == JTokenType.Array)
            {
                return entries.Children();
            }

            if (entries.Type == JTokenType.Object)
            {
                List<JToken> result = new List<JToken>();
                foreach (JProperty property in entries.Children<JProperty>())
                {
                    result.Add(property.Value);
                }

                return result;
            }

            return null;
        }

        private static PromptSlot ResolveWorldbookSlot(JToken token)
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

        private static string ReadString(JToken token, params string[] names)
        {
            foreach (string name in names)
            {
                JToken value = token?[name];
                if (value != null && value.Type != JTokenType.Null)
                {
                    string text = value.ToString();
                    if (!string.IsNullOrWhiteSpace(text))
                    {
                        return text.Trim();
                    }
                }
            }

            return "";
        }

        private static bool ReadBool(JToken token, bool fallback, params string[] names)
        {
            foreach (string name in names)
            {
                JToken value = token?[name];
                if (value != null && value.Type != JTokenType.Null)
                {
                    return value.Value<bool>();
                }
            }

            return fallback;
        }

        private static int ReadInt(JToken token, int fallback, params string[] names)
        {
            foreach (string name in names)
            {
                JToken value = token?[name];
                if (value != null && value.Type != JTokenType.Null && int.TryParse(value.ToString(), out int result))
                {
                    return result;
                }
            }

            return fallback;
        }

        private static float ReadFloat(JToken token, float fallback, params string[] names)
        {
            foreach (string name in names)
            {
                JToken value = token?[name];
                if (value != null && value.Type != JTokenType.Null && float.TryParse(value.ToString(), out float result))
                {
                    return result;
                }
            }

            return fallback;
        }

        private static List<string> ReadStringList(JToken token, params string[] names)
        {
            List<string> result = new List<string>();
            foreach (string name in names)
            {
                JToken value = token?[name];
                if (value == null || value.Type == JTokenType.Null)
                {
                    continue;
                }

                if (value.Type == JTokenType.Array)
                {
                    foreach (JToken item in value.Children())
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
                    string text = value.ToString().Trim();
                    if (!string.IsNullOrWhiteSpace(text) && !result.Contains(text))
                    {
                        result.Add(text);
                    }
                }
            }

            return result;
        }
    }
}
