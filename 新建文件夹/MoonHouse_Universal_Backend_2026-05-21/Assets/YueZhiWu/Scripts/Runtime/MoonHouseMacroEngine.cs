using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace Mingyue.YueZhiWu
{
    public sealed class MoonHouseMacroContext
    {
        public MoonHouseSave save = new MoonHouseSave();
        public MoonHousePresetLibrary presetLibrary = new MoonHousePresetLibrary();
        public string playerInput = "";
        public Dictionary<string, string> macroVariables = new Dictionary<string, string>();
    }

    public static class MoonHouseMacroEngine
    {
        private static readonly Regex MacroRegex = new Regex(@"\{\{\s*([^{}]+?)\s*\}\}", RegexOptions.Compiled);

        public static string Evaluate(string text, MoonHouseMacroContext context)
        {
            if (string.IsNullOrEmpty(text))
            {
                return "";
            }

            MoonHouseMacroContext safeContext = context ?? new MoonHouseMacroContext();
            return MacroRegex.Replace(text, match => Resolve(match.Groups[1].Value.Trim(), safeContext));
        }

        public static string BuildGameStateText(MoonHouseSave save)
        {
            if (save == null || save.gameState == null)
            {
                return "";
            }

            MoonHouseGameState state = save.gameState;
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("游戏状态:");

            string time = FormatClock(state.clock);
            if (!string.IsNullOrWhiteSpace(time))
            {
                builder.AppendLine("  时间: " + time);
            }

            string location = FormatLocation(state.location);
            if (!string.IsNullOrWhiteSpace(location))
            {
                builder.AppendLine("  地点: " + location);
            }

            string scene = FormatScene(state.scene);
            if (!string.IsNullOrWhiteSpace(scene))
            {
                builder.AppendLine("  场景: " + scene);
            }

            List<string> actors = FormatActors(state.actors);
            if (actors.Count > 0)
            {
                builder.AppendLine("  在场人物:");
                foreach (string actor in actors)
                {
                    builder.AppendLine("    - " + actor);
                }
            }

            if (state.facts != null && state.facts.Count > 0)
            {
                builder.AppendLine("  已知事实:");
                foreach (string fact in state.facts.Where(item => !string.IsNullOrWhiteSpace(item)))
                {
                    builder.AppendLine("    - " + fact.Trim());
                }
            }

            if (!string.IsNullOrWhiteSpace(state.rawSummary))
            {
                builder.AppendLine("  前端摘要: " + state.rawSummary.Trim());
            }

            string result = builder.ToString().TrimEnd();
            return result == "游戏状态:" ? "" : result;
        }

        public static string BuildRuntimeVariableText(MoonHouseSave save)
        {
            if (save == null || save.runtimeVariables == null || save.runtimeVariables.Count == 0)
            {
                return "";
            }

            StringBuilder builder = new StringBuilder();
            builder.AppendLine("运行变量:");
            foreach (MoonHouseRuntimeVariable variable in save.runtimeVariables
                .Where(item => item != null && item.exposeToPrompt && !string.IsNullOrWhiteSpace(item.key))
                .Where(item => item.scope != MoonHouseVariableScope.Message || !string.IsNullOrWhiteSpace(item.ownerId))
                .OrderByDescending(item => item.priority)
                .ThenBy(item => item.scope)
                .ThenBy(item => item.key))
            {
                builder.AppendLine("  - " + FormatVariable(variable));
            }

            return builder.ToString().TrimEnd();
        }

        private static string Resolve(string macro, MoonHouseMacroContext context)
        {
            string key = macro.Trim();
            string lower = key.ToLowerInvariant();
            MoonHouseSave save = context.save ?? new MoonHouseSave();

            if (lower == "input")
            {
                return context.playerInput ?? "";
            }

            if (lower == "trim" || lower == "newline" || lower.StartsWith("//", StringComparison.Ordinal))
            {
                return lower == "newline" ? "\n" : "";
            }

            if (lower.StartsWith("setvar::", StringComparison.Ordinal))
            {
                SetMacroVariable(context, key.Substring("setvar::".Length), false);
                return "";
            }

            if (lower.StartsWith("addvar::", StringComparison.Ordinal))
            {
                SetMacroVariable(context, key.Substring("addvar::".Length), true);
                return "";
            }

            if (lower.StartsWith("getvar::", StringComparison.Ordinal))
            {
                return GetMacroVariable(context, key.Substring("getvar::".Length));
            }

            if (lower == "char" || lower == "character")
            {
                return save.characterName ?? "";
            }

            if (lower == "user" || lower == "player")
            {
                return save.playerName ?? "";
            }

            if (lower == "game_state")
            {
                return BuildGameStateText(save);
            }

            if (lower == "runtime_variables")
            {
                return BuildRuntimeVariableText(save);
            }

            if (lower == "location")
            {
                return save.gameState?.location?.locationName ?? "";
            }

            if (lower == "area")
            {
                return save.gameState?.location?.areaName ?? "";
            }

            if (lower == "scene")
            {
                return save.gameState?.scene?.sceneName ?? "";
            }

            if (lower == "time")
            {
                return FormatClock(save.gameState?.clock);
            }

            if (lower == "date")
            {
                return save.gameState?.clock?.dateText ?? "";
            }

            if (lower == "weather")
            {
                return save.gameState?.clock?.weather ?? "";
            }

            if (lower == "present")
            {
                return string.Join("、", (save.gameState?.actors ?? new List<MoonHouseActorState>())
                    .Where(actor => actor != null && actor.present)
                    .Select(actor => string.IsNullOrWhiteSpace(actor.displayName) ? actor.actorId : actor.displayName)
                    .Where(name => !string.IsNullOrWhiteSpace(name)));
            }

            if (lower == "system_prompt")
            {
                return ResolveSystemPrompt(context.presetLibrary);
            }

            if (lower == "reasoning_instruction")
            {
                return ResolveReasoningInstruction(context.presetLibrary);
            }

            if (lower.StartsWith("var:", StringComparison.Ordinal))
            {
                return ResolveVariable(save, key.Substring(4).Trim());
            }

            if (lower.StartsWith("actor:", StringComparison.Ordinal))
            {
                return ResolveActor(save, key.Substring(6).Trim());
            }

            return "{{" + macro + "}}";
        }

        private static void SetMacroVariable(MoonHouseMacroContext context, string body, bool append)
        {
            if (context.macroVariables == null)
            {
                context.macroVariables = new Dictionary<string, string>();
            }

            SplitMacroAssignment(body, out string name, out string value);
            if (string.IsNullOrWhiteSpace(name))
            {
                return;
            }

            if (append && context.macroVariables.TryGetValue(name, out string current) && !string.IsNullOrEmpty(current))
            {
                context.macroVariables[name] = current + value;
            }
            else
            {
                context.macroVariables[name] = value;
            }
        }

        private static string GetMacroVariable(MoonHouseMacroContext context, string name)
        {
            if (context.macroVariables == null || string.IsNullOrWhiteSpace(name))
            {
                return "";
            }

            return context.macroVariables.TryGetValue(name.Trim(), out string value) ? value : "";
        }

        private static void SplitMacroAssignment(string body, out string name, out string value)
        {
            name = "";
            value = "";
            if (string.IsNullOrWhiteSpace(body))
            {
                return;
            }

            int split = body.IndexOf("::", StringComparison.Ordinal);
            if (split < 0)
            {
                name = body.Trim();
                return;
            }

            name = body.Substring(0, split).Trim();
            value = body.Substring(split + 2);
        }

        private static string ResolveSystemPrompt(MoonHousePresetLibrary library)
        {
            if (library == null || library.systemPrompts == null)
            {
                return "";
            }

            MoonHouseSystemPromptPreset prompt = library.systemPrompts.FirstOrDefault(item =>
                item != null && item.enabled && item.id == library.activeSystemPromptId) ??
                library.systemPrompts.FirstOrDefault(item => item != null && item.enabled);
            return prompt != null ? prompt.content : "";
        }

        private static string ResolveReasoningInstruction(MoonHousePresetLibrary library)
        {
            if (library == null || library.reasoningPresets == null)
            {
                return "";
            }

            MoonHouseReasoningPreset preset = library.reasoningPresets.FirstOrDefault(item =>
                item != null && item.enabled && item.id == library.activeReasoningPresetId) ??
                library.reasoningPresets.FirstOrDefault(item => item != null && item.enabled);
            return preset != null ? preset.instruction : "";
        }

        private static string ResolveVariable(MoonHouseSave save, string key)
        {
            if (string.IsNullOrWhiteSpace(key) || save.runtimeVariables == null)
            {
                return "";
            }

            MoonHouseRuntimeVariable variable = save.runtimeVariables
                .Where(item => item != null && string.Equals(item.key, key, StringComparison.OrdinalIgnoreCase))
                .OrderBy(item => VariableScopeRank(item.scope))
                .ThenByDescending(item => item.priority)
                .FirstOrDefault();
            return variable == null ? "" : FormatVariableValue(variable);
        }

        private static string ResolveActor(MoonHouseSave save, string actorId)
        {
            if (string.IsNullOrWhiteSpace(actorId) || save.gameState?.actors == null)
            {
                return "";
            }

            MoonHouseActorState actor = save.gameState.actors.FirstOrDefault(item =>
                item != null &&
                (string.Equals(item.actorId, actorId, StringComparison.OrdinalIgnoreCase) ||
                 string.Equals(item.displayName, actorId, StringComparison.OrdinalIgnoreCase)));
            return actor == null ? "" : FormatActor(actor);
        }

        private static string FormatClock(MoonHouseGameClock clock)
        {
            if (clock == null)
            {
                return "";
            }

            List<string> parts = new List<string>();
            if (!string.IsNullOrWhiteSpace(clock.calendarName))
            {
                parts.Add(clock.calendarName);
            }

            if (!string.IsNullOrWhiteSpace(clock.dateText))
            {
                parts.Add(clock.dateText);
            }
            else if (clock.day > 0)
            {
                parts.Add("第 " + clock.day + " 日");
            }

            parts.Add(clock.hour.ToString("00") + ":" + clock.minute.ToString("00"));

            if (!string.IsNullOrWhiteSpace(clock.timeOfDay))
            {
                parts.Add(clock.timeOfDay);
            }

            if (!string.IsNullOrWhiteSpace(clock.season))
            {
                parts.Add(clock.season);
            }

            if (!string.IsNullOrWhiteSpace(clock.weather))
            {
                parts.Add(clock.weather);
            }

            return string.Join(" / ", parts);
        }

        private static string FormatLocation(MoonHouseLocationState location)
        {
            if (location == null)
            {
                return "";
            }

            List<string> parts = new List<string>();
            AddIfNotEmpty(parts, location.areaName);
            AddIfNotEmpty(parts, location.locationName);
            AddIfNotEmpty(parts, location.ambience);
            AddTags(parts, location.tags);
            return string.Join(" / ", parts);
        }

        private static string FormatScene(MoonHouseSceneState scene)
        {
            if (scene == null)
            {
                return "";
            }

            List<string> parts = new List<string>();
            AddIfNotEmpty(parts, scene.sceneName);
            AddIfNotEmpty(parts, scene.phase);
            AddIfNotEmpty(parts, scene.objective);
            AddIfNotEmpty(parts, scene.mood);
            if (scene.dangerLevel > 0)
            {
                parts.Add("危险度 " + scene.dangerLevel);
            }

            AddTags(parts, scene.tags);
            return string.Join(" / ", parts);
        }

        private static List<string> FormatActors(List<MoonHouseActorState> actors)
        {
            if (actors == null)
            {
                return new List<string>();
            }

            return actors
                .Where(actor => actor != null && actor.present)
                .Select(FormatActor)
                .Where(text => !string.IsNullOrWhiteSpace(text))
                .ToList();
        }

        private static string FormatActor(MoonHouseActorState actor)
        {
            if (actor == null)
            {
                return "";
            }

            List<string> parts = new List<string>();
            AddIfNotEmpty(parts, string.IsNullOrWhiteSpace(actor.displayName) ? actor.actorId : actor.displayName);
            AddIfNotEmpty(parts, actor.role);
            AddIfNotEmpty(parts, actor.activity);
            AddIfNotEmpty(parts, actor.attitude);
            if (Math.Abs(actor.relationship) > 0.001f)
            {
                parts.Add("关系值 " + actor.relationship);
            }

            AddTags(parts, actor.tags);
            return string.Join(" / ", parts);
        }

        private static string FormatVariable(MoonHouseRuntimeVariable variable)
        {
            string label = string.IsNullOrWhiteSpace(variable.label) ? variable.key : variable.label;
            string scope = variable.scope.ToString();
            string owner = string.IsNullOrWhiteSpace(variable.ownerId) ? "" : "/" + variable.ownerId;
            return label + "(" + scope + owner + ":" + variable.key + "): " + FormatVariableValue(variable);
        }

        private static int VariableScopeRank(MoonHouseVariableScope scope)
        {
            switch (scope)
            {
                case MoonHouseVariableScope.Turn:
                    return 0;
                case MoonHouseVariableScope.Message:
                    return 1;
                case MoonHouseVariableScope.Save:
                    return 2;
                case MoonHouseVariableScope.Character:
                    return 3;
                case MoonHouseVariableScope.Global:
                    return 4;
                default:
                    return 9;
            }
        }

        private static string FormatVariableValue(MoonHouseRuntimeVariable variable)
        {
            switch (variable.kind)
            {
                case MoonHouseVariableKind.Number:
                    return variable.numberValue.ToString("0.###");
                case MoonHouseVariableKind.Boolean:
                    return variable.boolValue ? "true" : "false";
                default:
                    return variable.stringValue ?? "";
            }
        }

        private static void AddTags(List<string> parts, List<string> tags)
        {
            if (tags == null || tags.Count == 0)
            {
                return;
            }

            string tagText = string.Join("、", tags.Where(tag => !string.IsNullOrWhiteSpace(tag)).Select(tag => tag.Trim()));
            AddIfNotEmpty(parts, tagText);
        }

        private static void AddIfNotEmpty(List<string> parts, string value)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                parts.Add(value.Trim());
            }
        }
    }
}
