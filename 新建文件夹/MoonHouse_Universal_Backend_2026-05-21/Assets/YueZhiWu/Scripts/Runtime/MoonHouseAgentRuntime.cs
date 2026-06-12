using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Mingyue.YueZhiWu
{
    public static class MoonHouseAgentRuntime
    {
        private static readonly List<MoonHouseToolDefinition> BuiltInTools = new List<MoonHouseToolDefinition>
        {
            Tool(
                "add_fact",
                "Add a confirmed world fact to the current save.",
                "{\"type\":\"object\",\"properties\":{\"text\":{\"type\":\"string\"}},\"required\":[\"text\"]}"),
            Tool(
                "set_location",
                "Update current location state.",
                "{\"type\":\"object\",\"properties\":{\"locationId\":{\"type\":\"string\"},\"locationName\":{\"type\":\"string\"},\"areaName\":{\"type\":\"string\"},\"ambience\":{\"type\":\"string\"},\"tags\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}}}"),
            Tool(
                "set_scene",
                "Update current scene state.",
                "{\"type\":\"object\",\"properties\":{\"sceneId\":{\"type\":\"string\"},\"sceneName\":{\"type\":\"string\"},\"phase\":{\"type\":\"string\"},\"objective\":{\"type\":\"string\"},\"mood\":{\"type\":\"string\"},\"dangerLevel\":{\"type\":\"integer\"},\"tags\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}}}"),
            Tool(
                "set_actor_state",
                "Create or update one actor state.",
                "{\"type\":\"object\",\"properties\":{\"actorId\":{\"type\":\"string\"},\"displayName\":{\"type\":\"string\"},\"role\":{\"type\":\"string\"},\"locationId\":{\"type\":\"string\"},\"present\":{\"type\":\"boolean\"},\"activity\":{\"type\":\"string\"},\"attitude\":{\"type\":\"string\"},\"relationship\":{\"type\":\"number\"},\"tags\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}}},\"required\":[\"actorId\"]}"),
            Tool(
                "set_runtime_variable",
                "Create or update a MoonHouse runtime variable.",
                "{\"type\":\"object\",\"properties\":{\"key\":{\"type\":\"string\"},\"label\":{\"type\":\"string\"},\"scope\":{\"type\":\"string\"},\"ownerId\":{\"type\":\"string\"},\"kind\":{\"type\":\"string\",\"enum\":[\"Text\",\"Number\",\"Boolean\"]},\"stringValue\":{\"type\":\"string\"},\"numberValue\":{\"type\":\"number\"},\"boolValue\":{\"type\":\"boolean\"},\"exposeToPrompt\":{\"type\":\"boolean\"},\"priority\":{\"type\":\"integer\"}},\"required\":[\"key\"]}"),
            Tool(
                "add_context_block",
                "Add a long-lived context block.",
                "{\"type\":\"object\",\"properties\":{\"id\":{\"type\":\"string\"},\"label\":{\"type\":\"string\"},\"slot\":{\"type\":\"string\"},\"content\":{\"type\":\"string\"},\"priority\":{\"type\":\"integer\"},\"source\":{\"type\":\"string\"}},\"required\":[\"content\"]}"),
            Tool(
                "add_worldbook_entry",
                "Add a worldbook entry to the current save.",
                "{\"type\":\"object\",\"properties\":{\"id\":{\"type\":\"string\"},\"title\":{\"type\":\"string\"},\"content\":{\"type\":\"string\"},\"primaryKeys\":{\"type\":\"array\",\"items\":{\"type\":\"string\"}},\"slot\":{\"type\":\"string\"},\"priority\":{\"type\":\"integer\"},\"group\":{\"type\":\"string\"}},\"required\":[\"content\"]}")
        };

        public static bool IsAgentEnabled(MoonHouseGenerationPreset preset)
        {
            return preset != null && preset.agentMode != MoonHouseAgentMode.Disabled;
        }

        public static bool ShouldSendNativeTools(MoonHouseGenerationPreset preset)
        {
            return preset != null &&
                   preset.enableFunctionTools &&
                   (preset.agentMode == MoonHouseAgentMode.NativeTools ||
                    preset.agentMode == MoonHouseAgentMode.ToolLoop);
        }

        public static PromptInjection CreateAgentInstruction(MoonHouseGenerationPreset preset)
        {
            if (!IsAgentEnabled(preset))
            {
                return null;
            }

            StringBuilder builder = new StringBuilder();
            builder.AppendLine("<moonhouse_agent>");
            builder.AppendLine("You are inside a Unity AIRP backend named MoonHouse.");
            builder.AppendLine("Write the visible story reply normally.");
            builder.AppendLine("If game state should change, append exactly one hidden action block:");
            builder.AppendLine("<moonhouse_actions>{\"actions\":[{\"tool\":\"add_fact\",\"args\":{\"text\":\"...\"}}]}</moonhouse_actions>");
            builder.AppendLine("Never show the action block as prose. Keep actions factual and minimal.");
            builder.AppendLine("Available tools:");

            foreach (MoonHouseToolDefinition tool in BuiltInTools)
            {
                builder.AppendLine("- " + tool.name + ": " + tool.description);
            }

            if (preset.agentMode == MoonHouseAgentMode.NativeTools ||
                preset.agentMode == MoonHouseAgentMode.ToolLoop)
            {
                builder.AppendLine("Native function calling may also be available. If you use native tools in single-call mode, still include a visible story reply when possible.");
            }

            builder.AppendLine("</moonhouse_agent>");

            return new PromptInjection
            {
                id = "moonhouse_agent_instruction",
                role = "system",
                position = "prompt_stack",
                depth = 0,
                content = builder.ToString().Trim(),
                shouldScan = false
            };
        }

        public static List<object> BuildOpenAiTools(MoonHouseGenerationPreset preset, bool stream = false)
        {
            if (stream || !ShouldSendNativeTools(preset))
            {
                return null;
            }

            return BuiltInTools
                .Select(tool => (object)new Dictionary<string, object>
                {
                    { "type", "function" },
                    {
                        "function",
                        new Dictionary<string, object>
                        {
                            { "name", tool.name },
                            { "description", tool.description },
                            { "parameters", JObject.Parse(tool.parametersJson) }
                        }
                    }
                })
                .ToList();
        }

        public static List<object> BuildGeminiTools(MoonHouseGenerationPreset preset, bool stream = false)
        {
            if (stream || !ShouldSendNativeTools(preset))
            {
                return null;
            }

            List<object> declarations = BuiltInTools
                .Select(tool => (object)new Dictionary<string, object>
                {
                    { "name", tool.name },
                    { "description", tool.description },
                    { "parameters", JObject.Parse(tool.parametersJson) }
                })
                .ToList();

            return new List<object>
            {
                new Dictionary<string, object>
                {
                    { "functionDeclarations", declarations }
                }
            };
        }

        public static List<object> BuildClaudeTools(MoonHouseGenerationPreset preset, bool stream = false)
        {
            if (stream || !ShouldSendNativeTools(preset))
            {
                return null;
            }

            return BuiltInTools
                .Select(tool => (object)new Dictionary<string, object>
                {
                    { "name", tool.name },
                    { "description", tool.description },
                    { "input_schema", JObject.Parse(tool.parametersJson) }
                })
                .ToList();
        }

        public static List<MoonHouseToolCall> ExtractNativeToolCalls(JObject json)
        {
            List<MoonHouseToolCall> calls = new List<MoonHouseToolCall>();
            if (json == null)
            {
                return calls;
            }

            ExtractOpenAiToolCalls(json, calls);
            ExtractGeminiToolCalls(json, calls);
            ExtractClaudeToolCalls(json, calls);
            return calls;
        }

        public static void ApplySingleCallActions(
            MoonHouseSave save,
            MoonHouseGenerationResult result,
            MoonHouseGenerationPreset preset,
            bool executeTools = true)
        {
            if (save == null || result == null || !IsAgentEnabled(preset))
            {
                return;
            }

            List<MoonHouseToolCall> calls = new List<MoonHouseToolCall>();
            if (result.toolCalls != null)
            {
                calls.AddRange(result.toolCalls);
            }

            string visibleText = ExtractJsonActionCalls(result.text, calls);
            result.text = visibleText.Trim();
            result.toolCalls = calls;
            if (!executeTools)
            {
                return;
            }

            foreach (MoonHouseToolCall call in calls)
            {
                MoonHouseToolExecutionResult toolResult = ExecuteTool(save, call);
                result.toolResults.Add(toolResult);
            }
        }

        private static string ExtractJsonActionCalls(string text, List<MoonHouseToolCall> calls)
        {
            string content = text ?? string.Empty;
            content = Regex.Replace(
                content,
                "<moonhouse_actions>(.*?)</moonhouse_actions>",
                match =>
                {
                    AddCallsFromActionJson(match.Groups[1].Value, calls);
                    return "";
                },
                RegexOptions.Singleline | RegexOptions.IgnoreCase);

            string trimmed = content.Trim();
            if (trimmed.StartsWith("{", StringComparison.Ordinal) &&
                TryParseObject(trimmed, out JObject root) &&
                root["actions"] != null)
            {
                AddCallsFromActionJson(trimmed, calls);
                return ReadString(root, "narration", "reply", "text", "content");
            }

            return content;
        }

        private static void AddCallsFromActionJson(string json, List<MoonHouseToolCall> calls)
        {
            if (!TryParseObject(json, out JObject root))
            {
                return;
            }

            JArray actions = root["actions"] as JArray;
            if (actions == null)
            {
                return;
            }

            foreach (JToken token in actions)
            {
                string name = ReadString(token, "tool", "name", "function");
                if (string.IsNullOrWhiteSpace(name))
                {
                    continue;
                }

                JToken args = token["args"] ?? token["arguments"] ?? new JObject();
                calls.Add(new MoonHouseToolCall
                {
                    id = ReadString(token, "id"),
                    name = name.Trim(),
                    argumentsJson = args.Type == JTokenType.String ? args.ToString() : args.ToString(Formatting.None),
                    source = "json_actions"
                });
            }
        }

        private static MoonHouseToolExecutionResult ExecuteTool(MoonHouseSave save, MoonHouseToolCall call)
        {
            try
            {
                EnsureSaveShape(save);
                JObject args = ParseArguments(call.argumentsJson);
                string name = NormalizeToolName(call.name);

                switch (name)
                {
                    case "add_fact":
                        return AddFact(save, call, args);
                    case "set_location":
                        return SetLocation(save, call, args);
                    case "set_scene":
                        return SetScene(save, call, args);
                    case "set_actor_state":
                        return SetActorState(save, call, args);
                    case "set_runtime_variable":
                        return SetRuntimeVariable(save, call, args);
                    case "add_context_block":
                        return AddContextBlock(save, call, args);
                    case "add_worldbook_entry":
                        return AddWorldbookEntry(save, call, args);
                    default:
                        return ToolFailure(call, "Unknown tool: " + call.name);
                }
            }
            catch (Exception error)
            {
                return ToolFailure(call, error.Message);
            }
        }

        private static MoonHouseToolExecutionResult AddFact(MoonHouseSave save, MoonHouseToolCall call, JObject args)
        {
            string text = ReadString(args, "text", "fact").Trim();
            if (string.IsNullOrWhiteSpace(text))
            {
                return ToolFailure(call, "fact text is empty");
            }

            if (!save.gameState.facts.Contains(text))
            {
                save.gameState.facts.Add(text);
            }

            return ToolSuccess(call, "fact added");
        }

        private static MoonHouseToolExecutionResult SetLocation(MoonHouseSave save, MoonHouseToolCall call, JObject args)
        {
            save.gameState.location.locationId = ReadStringOrCurrent(args, save.gameState.location.locationId, "locationId", "id");
            save.gameState.location.locationName = ReadStringOrCurrent(args, save.gameState.location.locationName, "locationName", "name");
            save.gameState.location.areaName = ReadStringOrCurrent(args, save.gameState.location.areaName, "areaName", "area");
            save.gameState.location.ambience = ReadStringOrCurrent(args, save.gameState.location.ambience, "ambience", "atmosphere");
            List<string> tags = ReadStringList(args["tags"]);
            if (tags.Count > 0)
            {
                save.gameState.location.tags = tags;
            }

            return ToolSuccess(call, "location updated");
        }

        private static MoonHouseToolExecutionResult SetScene(MoonHouseSave save, MoonHouseToolCall call, JObject args)
        {
            save.gameState.scene.sceneId = ReadStringOrCurrent(args, save.gameState.scene.sceneId, "sceneId", "id");
            save.gameState.scene.sceneName = ReadStringOrCurrent(args, save.gameState.scene.sceneName, "sceneName", "name");
            save.gameState.scene.phase = ReadStringOrCurrent(args, save.gameState.scene.phase, "phase");
            save.gameState.scene.objective = ReadStringOrCurrent(args, save.gameState.scene.objective, "objective", "goal");
            save.gameState.scene.mood = ReadStringOrCurrent(args, save.gameState.scene.mood, "mood");
            int danger = ReadInt(args, save.gameState.scene.dangerLevel, "dangerLevel", "danger");
            save.gameState.scene.dangerLevel = danger;
            List<string> tags = ReadStringList(args["tags"]);
            if (tags.Count > 0)
            {
                save.gameState.scene.tags = tags;
            }

            return ToolSuccess(call, "scene updated");
        }

        private static MoonHouseToolExecutionResult SetActorState(MoonHouseSave save, MoonHouseToolCall call, JObject args)
        {
            string actorId = ReadString(args, "actorId", "id").Trim();
            if (string.IsNullOrWhiteSpace(actorId))
            {
                return ToolFailure(call, "actorId is empty");
            }

            MoonHouseActorState actor = save.gameState.actors.FirstOrDefault(item => item != null && item.actorId == actorId);
            if (actor == null)
            {
                actor = new MoonHouseActorState { actorId = actorId };
                save.gameState.actors.Add(actor);
            }

            actor.displayName = ReadStringOrCurrent(args, actor.displayName, "displayName", "name");
            actor.role = ReadStringOrCurrent(args, actor.role, "role");
            actor.locationId = ReadStringOrCurrent(args, actor.locationId, "locationId");
            actor.present = ReadBool(args, actor.present, "present");
            actor.activity = ReadStringOrCurrent(args, actor.activity, "activity", "action");
            actor.attitude = ReadStringOrCurrent(args, actor.attitude, "attitude", "mood");
            actor.relationship = ReadFloat(args, actor.relationship, "relationship", "relationshipValue");
            List<string> tags = ReadStringList(args["tags"]);
            if (tags.Count > 0)
            {
                actor.tags = tags;
            }

            return ToolSuccess(call, "actor updated");
        }

        private static MoonHouseToolExecutionResult SetRuntimeVariable(MoonHouseSave save, MoonHouseToolCall call, JObject args)
        {
            string key = ReadString(args, "key").Trim();
            if (string.IsNullOrWhiteSpace(key))
            {
                return ToolFailure(call, "variable key is empty");
            }

            MoonHouseVariableScope scope = ParseScope(ReadString(args, "scope"), MoonHouseVariableScope.Save);
            string ownerId = ReadString(args, "ownerId");
            MoonHouseRuntimeVariable variable = save.runtimeVariables.FirstOrDefault(item =>
                item != null && item.key == key && item.scope == scope && (item.ownerId ?? "") == ownerId);
            if (variable == null)
            {
                variable = new MoonHouseRuntimeVariable { key = key, scope = scope, ownerId = ownerId };
                save.runtimeVariables.Add(variable);
            }

            variable.label = ReadStringOrCurrent(args, variable.label, "label");
            variable.kind = ParseVariableKind(ReadString(args, "kind"), variable.kind);
            variable.stringValue = ReadStringOrCurrent(args, variable.stringValue, "stringValue", "value");
            variable.numberValue = ReadFloat(args, variable.numberValue, "numberValue");
            variable.boolValue = ReadBool(args, variable.boolValue, "boolValue");
            variable.exposeToPrompt = ReadBool(args, variable.exposeToPrompt, "exposeToPrompt");
            variable.priority = ReadInt(args, variable.priority, "priority");
            return ToolSuccess(call, "runtime variable updated");
        }

        private static MoonHouseToolExecutionResult AddContextBlock(MoonHouseSave save, MoonHouseToolCall call, JObject args)
        {
            string content = ReadString(args, "content").Trim();
            if (string.IsNullOrWhiteSpace(content))
            {
                return ToolFailure(call, "context content is empty");
            }

            string id = ReadString(args, "id");
            if (string.IsNullOrWhiteSpace(id))
            {
                id = MoonHouseIds.Create("ctx");
            }

            save.contextBlocks.Add(new MoonHouseContextBlock
            {
                id = id,
                label = ReadString(args, "label", "name"),
                slot = ParsePromptSlot(ReadString(args, "slot"), PromptSlot.RuntimeContext),
                content = content,
                priority = ReadInt(args, 100, "priority"),
                source = ReadStringOrCurrent(args, "agent", "source")
            });

            return ToolSuccess(call, "context block added");
        }

        private static MoonHouseToolExecutionResult AddWorldbookEntry(MoonHouseSave save, MoonHouseToolCall call, JObject args)
        {
            string content = ReadString(args, "content").Trim();
            if (string.IsNullOrWhiteSpace(content))
            {
                return ToolFailure(call, "worldbook content is empty");
            }

            save.worldbookEntries.Add(new WorldbookEntry
            {
                id = string.IsNullOrWhiteSpace(ReadString(args, "id")) ? MoonHouseIds.Create("wi") : ReadString(args, "id"),
                title = ReadString(args, "title", "name"),
                content = content,
                primaryKeys = ReadStringList(args["primaryKeys"] ?? args["keys"]),
                slot = ParsePromptSlot(ReadString(args, "slot"), PromptSlot.WorldInfoAfter),
                priority = ReadInt(args, 100, "priority"),
                group = ReadString(args, "group"),
                source = "agent"
            });

            return ToolSuccess(call, "worldbook entry added");
        }

        private static void ExtractOpenAiToolCalls(JObject json, List<MoonHouseToolCall> calls)
        {
            foreach (JToken token in json.SelectTokens("choices[*].message.tool_calls[*]"))
            {
                string id = ReadString(token, "id");
                string name = ReadString(token["function"], "name");
                string args = ReadString(token["function"], "arguments");
                if (!string.IsNullOrWhiteSpace(name))
                {
                    calls.Add(new MoonHouseToolCall
                    {
                        id = id,
                        name = name,
                        argumentsJson = string.IsNullOrWhiteSpace(args) ? "{}" : args,
                        source = "openai_tool_calls"
                    });
                }
            }
        }

        private static void ExtractGeminiToolCalls(JObject json, List<MoonHouseToolCall> calls)
        {
            foreach (JToken token in json.SelectTokens("candidates[*].content.parts[*].functionCall"))
            {
                string name = ReadString(token, "name");
                JToken args = token["args"] ?? new JObject();
                if (!string.IsNullOrWhiteSpace(name))
                {
                    calls.Add(new MoonHouseToolCall
                    {
                        id = MoonHouseIds.Create("tool"),
                        name = name,
                        argumentsJson = args.ToString(Formatting.None),
                        source = "gemini_function_call"
                    });
                }
            }
        }

        private static void ExtractClaudeToolCalls(JObject json, List<MoonHouseToolCall> calls)
        {
            foreach (JToken token in json.SelectTokens("content[?(@.type == 'tool_use')]"))
            {
                string name = ReadString(token, "name");
                JToken args = token["input"] ?? new JObject();
                if (!string.IsNullOrWhiteSpace(name))
                {
                    calls.Add(new MoonHouseToolCall
                    {
                        id = ReadString(token, "id"),
                        name = name,
                        argumentsJson = args.ToString(Formatting.None),
                        source = "claude_tool_use"
                    });
                }
            }
        }

        private static MoonHouseToolDefinition Tool(string name, string description, string parametersJson)
        {
            return new MoonHouseToolDefinition
            {
                name = name,
                description = description,
                parametersJson = parametersJson
            };
        }

        private static MoonHouseToolExecutionResult ToolSuccess(MoonHouseToolCall call, string message)
        {
            return new MoonHouseToolExecutionResult
            {
                callId = call.id,
                name = call.name,
                success = true,
                mutatedSave = true,
                message = message,
                resultJson = "{\"ok\":true,\"message\":" + JsonConvert.ToString(message) + "}"
            };
        }

        private static MoonHouseToolExecutionResult ToolFailure(MoonHouseToolCall call, string message)
        {
            return new MoonHouseToolExecutionResult
            {
                callId = call.id,
                name = call.name,
                success = false,
                mutatedSave = false,
                message = message,
                resultJson = "{\"ok\":false,\"message\":" + JsonConvert.ToString(message) + "}"
            };
        }

        private static JObject ParseArguments(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new JObject();
            }

            JToken token = JToken.Parse(json);
            if (token.Type == JTokenType.String)
            {
                return ParseArguments(token.ToString());
            }

            return token as JObject ?? new JObject();
        }

        private static bool TryParseObject(string json, out JObject value)
        {
            value = null;
            try
            {
                value = JObject.Parse(json);
                return true;
            }
            catch
            {
                return false;
            }
        }

        private static void EnsureSaveShape(MoonHouseSave save)
        {
            save.gameState = save.gameState ?? new MoonHouseGameState();
            save.gameState.location = save.gameState.location ?? new MoonHouseLocationState();
            save.gameState.scene = save.gameState.scene ?? new MoonHouseSceneState();
            save.gameState.actors = save.gameState.actors ?? new List<MoonHouseActorState>();
            save.gameState.facts = save.gameState.facts ?? new List<string>();
            save.runtimeVariables = save.runtimeVariables ?? new List<MoonHouseRuntimeVariable>();
            save.contextBlocks = save.contextBlocks ?? new List<MoonHouseContextBlock>();
            save.worldbookEntries = save.worldbookEntries ?? new List<WorldbookEntry>();
            save.memoryBank = save.memoryBank ?? new List<MoonHouseMemoryItem>();
        }

        private static string NormalizeToolName(string name)
        {
            return (name ?? string.Empty).Trim().ToLowerInvariant();
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
                if (value != null && value.Type != JTokenType.Null)
                {
                    return value.Type == JTokenType.String ? value.ToString() : value.ToString(Formatting.None);
                }
            }

            return "";
        }

        private static string ReadStringOrCurrent(JObject obj, string current, params string[] names)
        {
            string value = ReadString(obj, names);
            return string.IsNullOrWhiteSpace(value) ? current ?? "" : value;
        }

        private static int ReadInt(JObject obj, int current, params string[] names)
        {
            foreach (string name in names)
            {
                JToken value = obj[name];
                if (value != null && int.TryParse(value.ToString(), out int parsed))
                {
                    return parsed;
                }
            }

            return current;
        }

        private static float ReadFloat(JObject obj, float current, params string[] names)
        {
            foreach (string name in names)
            {
                JToken value = obj[name];
                if (value != null && float.TryParse(value.ToString(), out float parsed))
                {
                    return parsed;
                }
            }

            return current;
        }

        private static bool ReadBool(JObject obj, bool current, params string[] names)
        {
            foreach (string name in names)
            {
                JToken value = obj[name];
                if (value != null && bool.TryParse(value.ToString(), out bool parsed))
                {
                    return parsed;
                }
            }

            return current;
        }

        private static List<string> ReadStringList(JToken token)
        {
            if (token == null || token.Type == JTokenType.Null)
            {
                return new List<string>();
            }

            if (token.Type == JTokenType.Array)
            {
                return token.Children()
                    .Select(child => child.ToString())
                    .Where(value => !string.IsNullOrWhiteSpace(value))
                    .ToList();
            }

            string scalar = token.ToString();
            return string.IsNullOrWhiteSpace(scalar)
                ? new List<string>()
                : new List<string> { scalar };
        }

        private static MoonHouseVariableKind ParseVariableKind(string value, MoonHouseVariableKind fallback)
        {
            if (Enum.TryParse(value, true, out MoonHouseVariableKind parsed))
            {
                return parsed;
            }

            return fallback;
        }

        private static MoonHouseVariableScope ParseScope(string value, MoonHouseVariableScope fallback)
        {
            if (Enum.TryParse(value, true, out MoonHouseVariableScope parsed))
            {
                return parsed;
            }

            return fallback;
        }

        private static PromptSlot ParsePromptSlot(string value, PromptSlot fallback)
        {
            if (Enum.TryParse(value, true, out PromptSlot parsed))
            {
                return parsed;
            }

            string normalized = (value ?? string.Empty).Trim().ToLowerInvariant();
            foreach (PromptSlot slot in Enum.GetValues(typeof(PromptSlot)))
            {
                if (slot.ToSlotId() == normalized)
                {
                    return slot;
                }
            }

            return fallback;
        }
    }
}
