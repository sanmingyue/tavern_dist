using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Mingyue.YueZhiWu
{
    public static class MoonHouseOutputContract
    {
        public const string InjectionId = "moonhouse_output_contract";

        public static PromptInjection CreateInstruction(bool allowStatePatch = true)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("<moonhouse_output_contract>");
            builder.AppendLine("Visible story text should be written normally.");
            builder.AppendLine("Optional hidden blocks may be appended after the visible story.");
            builder.AppendLine("Use <choices>[{\"id\":\"...\",\"label\":\"...\",\"playerInput\":\"...\"}]</choices> when the frontend needs suggested actions.");
            builder.AppendLine("Use <memory_hint>...</memory_hint> for important events that may enter long-term memory.");
            builder.AppendLine("Use <image_prompt>...</image_prompt> when the frontend may request an image prompt.");
            if (allowStatePatch)
            {
                builder.AppendLine("Use <state_patch>{\"patches\":[{\"op\":\"set_actor_state\",\"args\":{\"actorId\":\"...\",\"attitude\":\"...\"}}]}</state_patch> for optional game-state suggestions.");
                builder.AppendLine("State patches are suggestions for the Unity frontend/backend. Do not contradict confirmed frontend facts.");
            }

            builder.AppendLine("Never explain these hidden blocks in the visible story.");
            builder.AppendLine("</moonhouse_output_contract>");

            return new PromptInjection
            {
                id = InjectionId,
                role = "system",
                position = "prompt_stack",
                depth = 0,
                content = builder.ToString().Trim(),
                shouldScan = false
            };
        }
    }

    public static class MoonHouseOutputParser
    {
        private static readonly Regex StructuredBlockRegex = new Regex(
            @"<(?<tag>story|content|narration|reply|assistant_reply|thought|thinking|analysis|scratchpad|debug|moonhouse_internal|state_patch|game_state_patch|moonhouse_state|state|choices|moonhouse_choices|choice|memory_hint|memory|image_prompt|image)[^>]*>(?<body>.*?)</\k<tag>>",
            RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled);

        public static MoonHouseParsedOutput Parse(string text, MoonHouseOutputParserSettings settings = null)
        {
            MoonHouseOutputParserSettings resolved = settings ?? new MoonHouseOutputParserSettings();
            MoonHouseParsedOutput output = new MoonHouseParsedOutput
            {
                rawText = text ?? "",
                visibleText = text ?? ""
            };

            if (!resolved.enabled || string.IsNullOrEmpty(text))
            {
                return output;
            }

            string visible = StructuredBlockRegex.Replace(text, match =>
            {
                string tag = match.Groups["tag"].Value.ToLowerInvariant();
                string body = match.Groups["body"].Value.Trim();
                output.hadStructuredData = true;

                if (IsVisibleStoryTag(tag))
                {
                    AppendText(ref output.storyText, body);
                    return resolved.stripHiddenBlocksFromAssistantText ? body : match.Value;
                }

                if (IsThoughtTag(tag))
                {
                    AppendText(ref output.thoughtText, body);
                    output.hiddenBlocks.Add(match.Value);
                    return resolved.stripHiddenBlocksFromAssistantText ? "" : match.Value;
                }

                if (IsStateTag(tag))
                {
                    output.statePatches.AddRange(ParseStatePatches(body, output.parseErrors));
                    output.hiddenBlocks.Add(match.Value);
                    return resolved.stripHiddenBlocksFromAssistantText ? "" : match.Value;
                }

                if (IsChoiceTag(tag))
                {
                    if (resolved.parseChoices)
                    {
                        output.choices.AddRange(ParseChoices(body, output.parseErrors));
                    }

                    output.hiddenBlocks.Add(match.Value);
                    return resolved.stripHiddenBlocksFromAssistantText ? "" : match.Value;
                }

                if (IsMemoryTag(tag))
                {
                    if (resolved.parseMemoryHints && !string.IsNullOrWhiteSpace(body))
                    {
                        output.memoryHints.Add(body);
                    }

                    output.hiddenBlocks.Add(match.Value);
                    return resolved.stripHiddenBlocksFromAssistantText ? "" : match.Value;
                }

                if (IsImageTag(tag))
                {
                    if (resolved.parseImagePrompts && !string.IsNullOrWhiteSpace(body))
                    {
                        output.imagePrompts.Add(body);
                    }

                    output.hiddenBlocks.Add(match.Value);
                    return resolved.stripHiddenBlocksFromAssistantText ? "" : match.Value;
                }

                return match.Value;
            });

            output.visibleText = NormalizeVisibleText(visible);
            if (string.IsNullOrWhiteSpace(output.storyText))
            {
                output.storyText = output.visibleText;
            }

            return output;
        }

        private static bool IsVisibleStoryTag(string tag)
        {
            return tag == "story" ||
                   tag == "content" ||
                   tag == "narration" ||
                   tag == "reply" ||
                   tag == "assistant_reply";
        }

        private static bool IsThoughtTag(string tag)
        {
            return tag == "thought" ||
                   tag == "thinking" ||
                   tag == "analysis" ||
                   tag == "scratchpad" ||
                   tag == "debug" ||
                   tag == "moonhouse_internal";
        }

        private static bool IsStateTag(string tag)
        {
            return tag == "state_patch" ||
                   tag == "game_state_patch" ||
                   tag == "moonhouse_state" ||
                   tag == "state";
        }

        private static bool IsChoiceTag(string tag)
        {
            return tag == "choices" ||
                   tag == "moonhouse_choices" ||
                   tag == "choice";
        }

        private static bool IsMemoryTag(string tag)
        {
            return tag == "memory_hint" ||
                   tag == "memory";
        }

        private static bool IsImageTag(string tag)
        {
            return tag == "image_prompt" ||
                   tag == "image";
        }

        private static void AppendText(ref string target, string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return;
            }

            target = string.IsNullOrWhiteSpace(target) ? text.Trim() : target.TrimEnd() + "\n\n" + text.Trim();
        }

        private static string NormalizeVisibleText(string text)
        {
            string normalized = text ?? "";
            normalized = Regex.Replace(normalized, @"[ \t]+\r?\n", "\n");
            normalized = Regex.Replace(normalized, @"\n{3,}", "\n\n");
            return normalized.Trim();
        }

        private static List<MoonHouseOutputChoice> ParseChoices(string body, List<string> errors)
        {
            List<MoonHouseOutputChoice> choices = new List<MoonHouseOutputChoice>();
            if (string.IsNullOrWhiteSpace(body))
            {
                return choices;
            }

            if (TryParseJson(body, out JToken token))
            {
                JArray array = token as JArray;
                if (array == null && token.Type == JTokenType.Object)
                {
                    array = token["choices"] as JArray ?? token["options"] as JArray;
                    if (array == null)
                    {
                        choices.Add(ParseChoiceToken(token));
                        return choices;
                    }
                }

                if (array != null)
                {
                    foreach (JToken item in array)
                    {
                        MoonHouseOutputChoice choice = ParseChoiceToken(item);
                        if (!string.IsNullOrWhiteSpace(choice.label) || !string.IsNullOrWhiteSpace(choice.playerInput))
                        {
                            choices.Add(choice);
                        }
                    }

                    return choices;
                }
            }

            int index = 1;
            foreach (string rawLine in SplitNonEmptyLines(body))
            {
                string line = Regex.Replace(rawLine.Trim(), @"^[-*\d.、\s]+", "").Trim();
                if (string.IsNullOrWhiteSpace(line))
                {
                    continue;
                }

                string[] parts = line.Split(new[] { "||", "|" }, StringSplitOptions.None);
                choices.Add(new MoonHouseOutputChoice
                {
                    id = "choice_" + index,
                    label = parts.Length > 0 ? parts[0].Trim() : line,
                    description = parts.Length > 1 ? parts[1].Trim() : "",
                    playerInput = parts.Length > 2 ? parts[2].Trim() : line
                });
                index += 1;
            }

            return choices;
        }

        private static MoonHouseOutputChoice ParseChoiceToken(JToken token)
        {
            if (token == null)
            {
                return new MoonHouseOutputChoice();
            }

            if (token.Type == JTokenType.String)
            {
                string text = token.ToString().Trim();
                return new MoonHouseOutputChoice
                {
                    id = MoonHouseIds.Create("choice"),
                    label = text,
                    playerInput = text
                };
            }

            return new MoonHouseOutputChoice
            {
                id = ReadString(token, "id", "key"),
                label = ReadString(token, "label", "title", "text", "name"),
                description = ReadString(token, "description", "desc"),
                playerInput = ReadString(token, "playerInput", "input", "action", "value"),
                tags = ReadStringList(token["tags"])
            };
        }

        private static List<MoonHouseStatePatch> ParseStatePatches(string body, List<string> errors)
        {
            List<MoonHouseStatePatch> patches = new List<MoonHouseStatePatch>();
            if (string.IsNullOrWhiteSpace(body))
            {
                return patches;
            }

            if (!TryParseJson(body, out JToken token))
            {
                errors?.Add("state_patch is not valid JSON");
                patches.Add(new MoonHouseStatePatch
                {
                    id = MoonHouseIds.Create("patch"),
                    operation = "raw_note",
                    value = body.Trim(),
                    rawJson = JsonConvert.ToString(body.Trim())
                });
                return patches;
            }

            AddPatchesFromToken(token, patches);
            return patches;
        }

        private static void AddPatchesFromToken(JToken token, List<MoonHouseStatePatch> patches)
        {
            if (token == null || token.Type == JTokenType.Null)
            {
                return;
            }

            if (token.Type == JTokenType.Array)
            {
                foreach (JToken item in token.Children())
                {
                    AddPatchesFromToken(item, patches);
                }

                return;
            }

            if (token.Type != JTokenType.Object)
            {
                return;
            }

            JArray explicitPatches = token["patches"] as JArray ??
                                     token["statePatches"] as JArray ??
                                     token["state_patches"] as JArray ??
                                     token["updates"] as JArray;
            if (explicitPatches != null)
            {
                foreach (JToken patch in explicitPatches)
                {
                    AddPatchesFromToken(patch, patches);
                }
            }

            JArray actions = token["actions"] as JArray;
            if (actions != null)
            {
                foreach (JToken action in actions)
                {
                    patches.Add(ParsePatchToken(action));
                }
            }

            if (explicitPatches != null || actions != null)
            {
                AddStructuredObjectPatches(token, patches);
                return;
            }

            if (HasAny(token, "op", "operation", "tool", "name", "function"))
            {
                patches.Add(ParsePatchToken(token));
                return;
            }

            AddStructuredObjectPatches(token, patches);
        }

        private static void AddStructuredObjectPatches(JToken token, List<MoonHouseStatePatch> patches)
        {
            AddObjectPatch(token["clock"], "set_clock", patches);
            AddObjectPatch(token["location"], "set_location", patches);
            AddObjectPatch(token["scene"], "set_scene", patches);

            JToken actor = token["actor"] ?? token["npc"];
            AddObjectPatch(actor, "set_actor_state", patches);

            foreach (JToken item in ChildrenOf(token["actors"] ?? token["npcs"]))
            {
                AddObjectPatch(item, "set_actor_state", patches);
            }

            foreach (JToken item in ChildrenOf(token["variables"] ?? token["runtimeVariables"] ?? token["runtime_variables"]))
            {
                AddObjectPatch(item, "set_runtime_variable", patches);
            }

            foreach (string fact in ReadStringList(token["facts"]))
            {
                patches.Add(new MoonHouseStatePatch
                {
                    id = MoonHouseIds.Create("patch"),
                    operation = "add_fact",
                    facts = new List<string> { fact },
                    value = fact,
                    rawJson = JsonConvert.SerializeObject(new { op = "add_fact", text = fact })
                });
            }

            foreach (JToken item in ChildrenOf(token["memories"] ?? token["memory"]))
            {
                AddObjectPatch(item, "add_memory", patches);
            }
        }

        private static void AddObjectPatch(JToken token, string operation, List<MoonHouseStatePatch> patches)
        {
            if (token == null || token.Type == JTokenType.Null)
            {
                return;
            }

            JObject obj = token.Type == JTokenType.Object ? (JObject)token : new JObject { ["value"] = token };
            obj["op"] = obj["op"] ?? operation;
            patches.Add(ParsePatchToken(obj));
        }

        private static MoonHouseStatePatch ParsePatchToken(JToken token)
        {
            JToken args = token["args"] ?? token["arguments"] ?? token["input"] ?? token;
            string operation = ReadString(token, "op", "operation", "tool", "name", "function");
            if (string.IsNullOrWhiteSpace(operation))
            {
                operation = ReadString(args, "op", "operation", "tool", "name", "function");
            }

            operation = NormalizeOperation(operation);
            MoonHouseStatePatch patch = new MoonHouseStatePatch
            {
                id = ReadString(token, "id"),
                operation = operation,
                key = ReadString(args, "key", "path"),
                value = ReadString(args, "value", "text", "fact"),
                valueType = ReadString(args, "valueType", "kind", "type"),
                scope = ReadString(args, "scope"),
                ownerId = ReadString(args, "ownerId", "owner"),
                tags = ReadStringList(args["tags"]),
                rawJson = token.ToString(Formatting.None)
            };

            if (string.IsNullOrWhiteSpace(patch.id))
            {
                patch.id = MoonHouseIds.Create("patch");
            }

            if (operation == "set_clock")
            {
                patch.clock = ParseClock(args);
            }
            else if (operation == "set_location")
            {
                patch.location = ParseLocation(args);
            }
            else if (operation == "set_scene")
            {
                patch.scene = ParseScene(args);
            }
            else if (operation == "set_actor_state" || operation == "set_actor")
            {
                patch.operation = "set_actor_state";
                patch.actor = ParseActor(args);
                patch.actorPresentSpecified = args["present"] != null;
            }
            else if (operation == "set_runtime_variable" || operation == "set_variable")
            {
                patch.operation = "set_runtime_variable";
                patch.variable = ParseVariable(args);
            }
            else if (operation == "add_fact" || operation == "add_facts")
            {
                patch.operation = "add_fact";
                patch.facts = ReadStringList(args["facts"]);
                if (!string.IsNullOrWhiteSpace(patch.value) && !patch.facts.Contains(patch.value))
                {
                    patch.facts.Add(patch.value);
                }
            }
            else if (operation == "add_memory" || operation == "add_memory_item")
            {
                patch.operation = "add_memory";
                patch.memoryItem = ParseMemoryItem(args);
            }

            return patch;
        }

        private static string NormalizeOperation(string operation)
        {
            string value = (operation ?? "").Trim().ToLowerInvariant();
            if (value == "set_location_state")
            {
                return "set_location";
            }

            if (value == "set_scene_state")
            {
                return "set_scene";
            }

            if (value == "set_npc_state" || value == "update_actor" || value == "update_npc")
            {
                return "set_actor_state";
            }

            if (value == "set_var" || value == "update_variable")
            {
                return "set_runtime_variable";
            }

            return string.IsNullOrWhiteSpace(value) ? "unknown" : value;
        }

        private static MoonHouseGameClock ParseClock(JToken token)
        {
            return new MoonHouseGameClock
            {
                calendarName = ReadString(token, "calendarName", "calendar"),
                dateText = ReadString(token, "dateText", "date"),
                day = ReadInt(token, 0, "day"),
                hour = ReadInt(token, int.MinValue, "hour"),
                minute = ReadInt(token, int.MinValue, "minute"),
                timeOfDay = ReadString(token, "timeOfDay", "period"),
                season = ReadString(token, "season"),
                weather = ReadString(token, "weather")
            };
        }

        private static MoonHouseLocationState ParseLocation(JToken token)
        {
            return new MoonHouseLocationState
            {
                locationId = ReadString(token, "locationId", "id"),
                locationName = ReadString(token, "locationName", "name"),
                areaName = ReadString(token, "areaName", "area"),
                ambience = ReadString(token, "ambience", "atmosphere"),
                tags = ReadStringList(token["tags"])
            };
        }

        private static MoonHouseSceneState ParseScene(JToken token)
        {
            return new MoonHouseSceneState
            {
                sceneId = ReadString(token, "sceneId", "id"),
                sceneName = ReadString(token, "sceneName", "name"),
                phase = ReadString(token, "phase"),
                objective = ReadString(token, "objective", "goal"),
                mood = ReadString(token, "mood"),
                dangerLevel = ReadInt(token, int.MinValue, "dangerLevel", "danger"),
                tags = ReadStringList(token["tags"])
            };
        }

        private static MoonHouseActorState ParseActor(JToken token)
        {
            return new MoonHouseActorState
            {
                actorId = ReadString(token, "actorId", "id", "npcId"),
                displayName = ReadString(token, "displayName", "name", "npcName"),
                role = ReadString(token, "role"),
                locationId = ReadString(token, "locationId"),
                present = ReadBool(token, true, "present"),
                activity = ReadString(token, "activity", "action"),
                attitude = ReadString(token, "attitude", "mood"),
                relationship = ReadFloat(token, float.NaN, "relationship", "relationshipValue"),
                tags = ReadStringList(token["tags"])
            };
        }

        private static MoonHouseRuntimeVariable ParseVariable(JToken token)
        {
            string key = ReadString(token, "key", "path", "name");
            JToken valueToken = token["value"] ?? token["stringValue"] ?? token["numberValue"] ?? token["boolValue"];
            MoonHouseRuntimeVariable variable = new MoonHouseRuntimeVariable
            {
                key = key,
                label = ReadString(token, "label"),
                scope = ParseScope(ReadString(token, "scope")),
                ownerId = ReadString(token, "ownerId", "owner"),
                kind = ParseVariableKind(ReadString(token, "kind", "valueType", "type"), valueToken),
                exposeToPrompt = ReadBool(token, true, "exposeToPrompt"),
                priority = ReadInt(token, 100, "priority")
            };

            if (variable.kind == MoonHouseVariableKind.Boolean)
            {
                variable.boolValue = ReadBool(token, ReadBool(valueToken, false), "boolValue", "value");
            }
            else if (variable.kind == MoonHouseVariableKind.Number)
            {
                variable.numberValue = ReadFloat(token, ReadFloat(valueToken, 0f), "numberValue", "value");
            }
            else
            {
                variable.stringValue = ReadString(token, "stringValue", "value");
            }

            return variable;
        }

        private static MoonHouseMemoryItem ParseMemoryItem(JToken token)
        {
            string content = ReadString(token, "content", "text", "value", "memory");
            return new MoonHouseMemoryItem
            {
                id = ReadString(token, "id"),
                kind = ReadStringOrDefault(token, "event", "kind", "type"),
                title = ReadString(token, "title", "label"),
                content = content,
                source = ReadStringOrDefault(token, "output_parser", "source"),
                importance = ReadFloat(token, 1f, "importance"),
                priority = ReadInt(token, 100, "priority"),
                actors = ReadStringList(token["actors"]),
                locations = ReadStringList(token["locations"]),
                tags = ReadStringList(token["tags"]),
                keywords = ReadStringList(token["keywords"])
            };
        }

        private static IEnumerable<string> SplitNonEmptyLines(string text)
        {
            return (text ?? "")
                .Split(new[] { "\r\n", "\n" }, StringSplitOptions.None)
                .Select(line => line.Trim())
                .Where(line => !string.IsNullOrWhiteSpace(line));
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

        private static bool TryParseJson(string text, out JToken token)
        {
            token = null;
            try
            {
                token = JToken.Parse(text.Trim());
                return true;
            }
            catch
            {
                return false;
            }
        }

        private static bool HasAny(JToken token, params string[] names)
        {
            return names.Any(name => token[name] != null);
        }

        private static string ReadString(JToken token, params string[] names)
        {
            if (token == null)
            {
                return "";
            }

            if (names == null || names.Length == 0)
            {
                return token.Type == JTokenType.String ? token.ToString() : "";
            }

            foreach (string name in names)
            {
                JToken value = token[name];
                if (value == null || value.Type == JTokenType.Null)
                {
                    continue;
                }

                return value.Type == JTokenType.String ? value.ToString().Trim() : value.ToString(Formatting.None);
            }

            return "";
        }

        private static string ReadStringOrDefault(JToken token, string fallback, params string[] names)
        {
            string value = ReadString(token, names);
            return string.IsNullOrWhiteSpace(value) ? fallback : value;
        }

        private static List<string> ReadStringList(JToken token)
        {
            List<string> values = new List<string>();
            if (token == null || token.Type == JTokenType.Null)
            {
                return values;
            }

            if (token.Type == JTokenType.Array)
            {
                foreach (JToken item in token.Children())
                {
                    string value = item.Type == JTokenType.String ? item.ToString().Trim() : item.ToString(Formatting.None);
                    if (!string.IsNullOrWhiteSpace(value) && !values.Contains(value))
                    {
                        values.Add(value);
                    }
                }
            }
            else
            {
                string value = token.Type == JTokenType.String ? token.ToString().Trim() : token.ToString(Formatting.None);
                if (!string.IsNullOrWhiteSpace(value))
                {
                    values.Add(value);
                }
            }

            return values;
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
            if (names == null || names.Length == 0)
            {
                return token != null && float.TryParse(token.ToString(), NumberStyles.Float, CultureInfo.InvariantCulture, out float parsed)
                    ? parsed
                    : fallback;
            }

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

        private static bool ReadBool(JToken token, bool fallback, params string[] names)
        {
            if (names == null || names.Length == 0)
            {
                return token != null && bool.TryParse(token.ToString(), out bool parsed) ? parsed : fallback;
            }

            foreach (string name in names)
            {
                JToken value = token?[name];
                if (value != null && bool.TryParse(value.ToString(), out bool parsed))
                {
                    return parsed;
                }
            }

            return fallback;
        }

        private static MoonHouseVariableScope ParseScope(string scope)
        {
            if (Enum.TryParse(scope, true, out MoonHouseVariableScope parsed))
            {
                return parsed;
            }

            return MoonHouseVariableScope.Save;
        }

        private static MoonHouseVariableKind ParseVariableKind(string kind, JToken valueToken)
        {
            if (Enum.TryParse(kind, true, out MoonHouseVariableKind parsed))
            {
                return parsed;
            }

            if (valueToken != null)
            {
                if (valueToken.Type == JTokenType.Boolean)
                {
                    return MoonHouseVariableKind.Boolean;
                }

                if (valueToken.Type == JTokenType.Float || valueToken.Type == JTokenType.Integer)
                {
                    return MoonHouseVariableKind.Number;
                }
            }

            return MoonHouseVariableKind.Text;
        }
    }

    public static class MoonHouseStatePatchRuntime
    {
        public static List<MoonHouseStatePatchResult> Apply(MoonHouseSave save, List<MoonHouseStatePatch> patches)
        {
            EnsureSaveShape(save);
            List<MoonHouseStatePatchResult> results = new List<MoonHouseStatePatchResult>();
            foreach (MoonHouseStatePatch patch in patches ?? new List<MoonHouseStatePatch>())
            {
                results.Add(ApplyOne(save, patch));
            }

            return results;
        }

        private static MoonHouseStatePatchResult ApplyOne(MoonHouseSave save, MoonHouseStatePatch patch)
        {
            try
            {
                if (patch == null)
                {
                    return Failure(null, "patch is null");
                }

                string operation = (patch.operation ?? "").Trim().ToLowerInvariant();
                switch (operation)
                {
                    case "add_fact":
                        return AddFact(save, patch);
                    case "remove_fact":
                        return RemoveFact(save, patch);
                    case "set_clock":
                        return SetClock(save, patch);
                    case "set_location":
                        return SetLocation(save, patch);
                    case "set_scene":
                        return SetScene(save, patch);
                    case "set_actor_state":
                    case "set_actor":
                        return SetActor(save, patch);
                    case "set_runtime_variable":
                    case "set_variable":
                        return SetVariable(save, patch);
                    case "add_memory":
                    case "add_memory_item":
                        return AddMemory(save, patch);
                    case "raw_note":
                        return Success(patch, false, "raw note kept for frontend");
                    default:
                        return Failure(patch, "unknown patch operation: " + operation);
                }
            }
            catch (Exception error)
            {
                return Failure(patch, error.Message);
            }
        }

        private static MoonHouseStatePatchResult AddFact(MoonHouseSave save, MoonHouseStatePatch patch)
        {
            List<string> facts = patch.facts ?? new List<string>();
            if (!string.IsNullOrWhiteSpace(patch.value) && !facts.Contains(patch.value))
            {
                facts.Add(patch.value);
            }

            int added = 0;
            foreach (string fact in facts.Where(item => !string.IsNullOrWhiteSpace(item)))
            {
                string normalized = fact.Trim();
                if (!save.gameState.facts.Any(item => string.Equals(item, normalized, StringComparison.OrdinalIgnoreCase)))
                {
                    save.gameState.facts.Add(normalized);
                    added += 1;
                }
            }

            return Success(patch, added > 0, "facts added: " + added);
        }

        private static MoonHouseStatePatchResult RemoveFact(MoonHouseSave save, MoonHouseStatePatch patch)
        {
            string value = patch.value ?? "";
            int removed = save.gameState.facts.RemoveAll(item => string.Equals(item, value, StringComparison.OrdinalIgnoreCase));
            return Success(patch, removed > 0, "facts removed: " + removed);
        }

        private static MoonHouseStatePatchResult SetClock(MoonHouseSave save, MoonHouseStatePatch patch)
        {
            MoonHouseGameClock source = patch.clock;
            if (source == null)
            {
                return Failure(patch, "clock patch is empty");
            }

            MoonHouseGameClock target = save.gameState.clock ?? new MoonHouseGameClock();
            target.calendarName = Keep(target.calendarName, source.calendarName);
            target.dateText = Keep(target.dateText, source.dateText);
            if (source.day > 0) target.day = source.day;
            if (source.hour != int.MinValue) target.hour = source.hour;
            if (source.minute != int.MinValue) target.minute = source.minute;
            target.timeOfDay = Keep(target.timeOfDay, source.timeOfDay);
            target.season = Keep(target.season, source.season);
            target.weather = Keep(target.weather, source.weather);
            save.gameState.clock = target;
            return Success(patch, true, "clock updated");
        }

        private static MoonHouseStatePatchResult SetLocation(MoonHouseSave save, MoonHouseStatePatch patch)
        {
            MoonHouseLocationState source = patch.location;
            if (source == null)
            {
                return Failure(patch, "location patch is empty");
            }

            MoonHouseLocationState target = save.gameState.location ?? new MoonHouseLocationState();
            target.locationId = Keep(target.locationId, source.locationId);
            target.locationName = Keep(target.locationName, source.locationName);
            target.areaName = Keep(target.areaName, source.areaName);
            target.ambience = Keep(target.ambience, source.ambience);
            if (source.tags != null && source.tags.Count > 0) target.tags = Unique(source.tags);
            save.gameState.location = target;
            return Success(patch, true, "location updated");
        }

        private static MoonHouseStatePatchResult SetScene(MoonHouseSave save, MoonHouseStatePatch patch)
        {
            MoonHouseSceneState source = patch.scene;
            if (source == null)
            {
                return Failure(patch, "scene patch is empty");
            }

            MoonHouseSceneState target = save.gameState.scene ?? new MoonHouseSceneState();
            target.sceneId = Keep(target.sceneId, source.sceneId);
            target.sceneName = Keep(target.sceneName, source.sceneName);
            target.phase = Keep(target.phase, source.phase);
            target.objective = Keep(target.objective, source.objective);
            target.mood = Keep(target.mood, source.mood);
            if (source.dangerLevel != int.MinValue) target.dangerLevel = source.dangerLevel;
            if (source.tags != null && source.tags.Count > 0) target.tags = Unique(source.tags);
            save.gameState.scene = target;
            return Success(patch, true, "scene updated");
        }

        private static MoonHouseStatePatchResult SetActor(MoonHouseSave save, MoonHouseStatePatch patch)
        {
            MoonHouseActorState source = patch.actor;
            if (source == null)
            {
                return Failure(patch, "actor patch is empty");
            }

            string actorId = First(source.actorId, source.displayName);
            if (string.IsNullOrWhiteSpace(actorId))
            {
                return Failure(patch, "actor id is empty");
            }

            MoonHouseActorState target = save.gameState.actors.FirstOrDefault(item =>
                item != null &&
                (string.Equals(item.actorId, actorId, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(item.displayName, actorId, StringComparison.OrdinalIgnoreCase)));
            if (target == null)
            {
                target = new MoonHouseActorState { actorId = actorId };
                save.gameState.actors.Add(target);
            }

            target.displayName = Keep(target.displayName, source.displayName);
            target.role = Keep(target.role, source.role);
            target.locationId = Keep(target.locationId, source.locationId);
            if (patch.actorPresentSpecified)
            {
                target.present = source.present;
            }
            target.activity = Keep(target.activity, source.activity);
            target.attitude = Keep(target.attitude, source.attitude);
            if (!float.IsNaN(source.relationship)) target.relationship = source.relationship;
            if (source.tags != null && source.tags.Count > 0) target.tags = Unique(source.tags);
            return Success(patch, true, "actor updated");
        }

        private static MoonHouseStatePatchResult SetVariable(MoonHouseSave save, MoonHouseStatePatch patch)
        {
            MoonHouseRuntimeVariable variable = patch.variable;
            if (variable == null)
            {
                variable = new MoonHouseRuntimeVariable
                {
                    key = patch.key,
                    scope = ParseScope(patch.scope),
                    ownerId = patch.ownerId,
                    kind = ParseKind(patch.valueType),
                    stringValue = patch.value
                };
            }

            if (string.IsNullOrWhiteSpace(variable.key))
            {
                return Failure(patch, "variable key is empty");
            }

            MoonHouseRuntimeVariable existing = save.runtimeVariables.FirstOrDefault(item =>
                item != null &&
                string.Equals(item.key, variable.key, StringComparison.OrdinalIgnoreCase) &&
                item.scope == variable.scope &&
                string.Equals(item.ownerId ?? "", variable.ownerId ?? "", StringComparison.OrdinalIgnoreCase));
            if (existing == null)
            {
                save.runtimeVariables.Add(variable);
            }
            else
            {
                existing.label = Keep(existing.label, variable.label);
                existing.kind = variable.kind;
                existing.stringValue = variable.stringValue;
                existing.numberValue = variable.numberValue;
                existing.boolValue = variable.boolValue;
                existing.exposeToPrompt = variable.exposeToPrompt;
                existing.priority = variable.priority;
            }

            return Success(patch, true, "runtime variable updated");
        }

        private static MoonHouseStatePatchResult AddMemory(MoonHouseSave save, MoonHouseStatePatch patch)
        {
            MoonHouseMemoryItem item = patch.memoryItem;
            if (item == null)
            {
                item = new MoonHouseMemoryItem
                {
                    content = patch.value,
                    source = "output_parser"
                };
            }

            if (string.IsNullOrWhiteSpace(item.content))
            {
                return Failure(patch, "memory content is empty");
            }

            if (string.IsNullOrWhiteSpace(item.id))
            {
                item.id = MoonHouseIds.Create("mem");
            }

            string now = DateTime.UtcNow.ToString("O");
            item.createdAtIso = string.IsNullOrWhiteSpace(item.createdAtIso) ? now : item.createdAtIso;
            item.updatedAtIso = now;
            MoonHouseMemoryItem existing = save.memoryBank.FirstOrDefault(memory => memory != null && memory.id == item.id);
            if (existing == null)
            {
                save.memoryBank.Add(item);
            }
            else
            {
                int index = save.memoryBank.IndexOf(existing);
                save.memoryBank[index] = item;
            }

            return Success(patch, true, "memory item added");
        }

        private static MoonHouseStatePatchResult Success(MoonHouseStatePatch patch, bool mutated, string message)
        {
            return new MoonHouseStatePatchResult
            {
                patchId = patch?.id ?? "",
                operation = patch?.operation ?? "",
                success = true,
                mutatedSave = mutated,
                message = message,
                patch = patch
            };
        }

        private static MoonHouseStatePatchResult Failure(MoonHouseStatePatch patch, string message)
        {
            return new MoonHouseStatePatchResult
            {
                patchId = patch?.id ?? "",
                operation = patch?.operation ?? "",
                success = false,
                mutatedSave = false,
                message = message,
                patch = patch
            };
        }

        private static void EnsureSaveShape(MoonHouseSave save)
        {
            if (save == null)
            {
                return;
            }

            save.gameState = save.gameState ?? new MoonHouseGameState();
            save.gameState.clock = save.gameState.clock ?? new MoonHouseGameClock();
            save.gameState.location = save.gameState.location ?? new MoonHouseLocationState();
            save.gameState.scene = save.gameState.scene ?? new MoonHouseSceneState();
            save.gameState.actors = save.gameState.actors ?? new List<MoonHouseActorState>();
            save.gameState.facts = save.gameState.facts ?? new List<string>();
            save.runtimeVariables = save.runtimeVariables ?? new List<MoonHouseRuntimeVariable>();
            save.memoryBank = save.memoryBank ?? new List<MoonHouseMemoryItem>();
        }

        private static string Keep(string current, string next)
        {
            return string.IsNullOrWhiteSpace(next) ? current ?? "" : next.Trim();
        }

        private static string First(params string[] values)
        {
            return values.FirstOrDefault(value => !string.IsNullOrWhiteSpace(value)) ?? "";
        }

        private static List<string> Unique(IEnumerable<string> values)
        {
            return (values ?? new List<string>())
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

        private static MoonHouseVariableScope ParseScope(string scope)
        {
            if (Enum.TryParse(scope, true, out MoonHouseVariableScope parsed))
            {
                return parsed;
            }

            return MoonHouseVariableScope.Save;
        }

        private static MoonHouseVariableKind ParseKind(string kind)
        {
            if (Enum.TryParse(kind, true, out MoonHouseVariableKind parsed))
            {
                return parsed;
            }

            return MoonHouseVariableKind.Text;
        }
    }
}
