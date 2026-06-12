using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace Mingyue.YueZhiWu
{
    public sealed class WorldbookScanner
    {
        private readonly ITokenCounter tokenCounter;
        private readonly Func<string, string> textProcessor;

        public WorldbookScanner(ITokenCounter tokenCounter, Func<string, string> textProcessor = null)
        {
            this.tokenCounter = tokenCounter ?? new HeuristicTokenCounter();
            this.textProcessor = textProcessor ?? (text => text ?? "");
        }

        public WorldbookScanResult Scan(
            IEnumerable<WorldbookEntry> entries,
            WorldbookScanContext context,
            WorldbookScanSettings settings)
        {
            WorldbookScanSettings scanSettings = settings ?? new WorldbookScanSettings();
            WorldbookScanContext scanContext = context ?? new WorldbookScanContext();
            List<WorldbookEntry> allEntries = (entries ?? Enumerable.Empty<WorldbookEntry>())
                .Where(entry => entry != null && entry.enabled)
                .OrderByDescending(entry => entry.priority)
                .ThenBy(entry => entry.order)
                .ToList();

            WorldbookScanResult result = new WorldbookScanResult();
            result.budgetTokens = ResolveBudget(scanSettings);

            HashSet<string> activatedIds = new HashSet<string>();
            List<string> recursionBuffer = new List<string>();
            int maxRounds = scanSettings.recursive ? Math.Max(1, scanSettings.maxRecursionSteps + 1) : 1;

            for (int round = 0; round < maxRounds; round += 1)
            {
                bool activatedThisRound = false;
                List<ActivatedWorldbookEntry> candidates = new List<ActivatedWorldbookEntry>();

                foreach (WorldbookEntry entry in allEntries)
                {
                    string entryKey = EntryKey(entry);
                    if (activatedIds.Contains(entryKey))
                    {
                        continue;
                    }

                    WorldbookRuntimeState runtimeState = ResolveRuntimeState(scanContext, entryKey);
                    if (runtimeState != null && runtimeState.delayActivationQueued)
                    {
                        if (runtimeState.delayTurnsRemaining > 0)
                        {
                            result.traces.Add(CreateTrace(
                                entry,
                                false,
                                false,
                                "延迟激活等待中，剩余 " + runtimeState.delayTurnsRemaining + " 轮",
                                0,
                                round,
                                delayQueued: true));
                            continue;
                        }

                        candidates.Add(CreateCandidate(entry, "延迟激活", round, true));
                        continue;
                    }

                    if (runtimeState != null && runtimeState.stickyTurnsRemaining > 0)
                    {
                        candidates.Add(CreateCandidate(entry, "黏性激活，剩余 " + runtimeState.stickyTurnsRemaining + " 轮", round));
                        continue;
                    }

                    if (runtimeState != null && runtimeState.cooldownTurnsRemaining > 0)
                    {
                        result.traces.Add(CreateTrace(
                            entry,
                            false,
                            false,
                            "冷却中，剩余 " + runtimeState.cooldownTurnsRemaining + " 轮",
                            0,
                            round));
                        continue;
                    }

                    string scanText = BuildScanText(entry, scanContext, scanSettings, recursionBuffer);
                    string reason;
                    if (!ShouldActivate(entry, scanText, scanSettings, round, out reason))
                    {
                        result.traces.Add(CreateTrace(entry, false, false, reason, 0, round));
                        continue;
                    }

                    if (entry.delayRounds > 0)
                    {
                        ActivatedWorldbookEntry delayed = CreateCandidate(
                            entry,
                            "命中后延迟 " + entry.delayRounds + " 轮激活: " + reason,
                            round);
                        result.delayedEntries.Add(delayed);
                        result.traces.Add(CreateTrace(
                            entry,
                            false,
                            false,
                            delayed.reason,
                            delayed.estimatedTokens,
                            round,
                            delayQueued: true));
                        continue;
                    }

                    candidates.Add(CreateCandidate(entry, reason, round));
                }

                foreach (ActivatedWorldbookEntry candidate in ApplyGroupCompetition(candidates, scanSettings, result))
                {
                    if (!candidate.entry.ignoreBudget &&
                        result.budgetTokens > 0 &&
                        result.usedTokens + candidate.estimatedTokens > result.budgetTokens)
                    {
                        result.budgetOverflowed = true;
                        result.traces.Add(CreateTrace(
                            candidate.entry,
                            false,
                            true,
                            "预算不足，跳过: " + candidate.reason,
                            candidate.estimatedTokens,
                            candidate.recursionRound));
                        continue;
                    }

                    result.usedTokens += candidate.estimatedTokens;
                    result.activatedEntries.Add(candidate);
                    activatedIds.Add(EntryKey(candidate.entry));
                    AppendSlotText(result, candidate.entry.slot, WrapWorldbookEntry(candidate.entry));
                    result.traces.Add(CreateTrace(
                        candidate.entry,
                        true,
                        false,
                        candidate.reason,
                        candidate.estimatedTokens,
                        candidate.recursionRound));
                    activatedThisRound = true;

                    if (scanSettings.recursive && candidate.entry.allowRecursion && !candidate.entry.preventRecursion)
                    {
                        recursionBuffer.Add(ProcessText(candidate.entry.content));
                    }
                }

                if (!scanSettings.recursive || !activatedThisRound || recursionBuffer.Count == 0)
                {
                    break;
                }
            }

            return result;
        }

        private ActivatedWorldbookEntry CreateCandidate(
            WorldbookEntry entry,
            string reason,
            int round,
            bool delayedActivation = false)
        {
            string processedContent = ProcessText(entry.content);
            return new ActivatedWorldbookEntry
            {
                entry = entry,
                reason = reason,
                estimatedTokens = tokenCounter.CountText(processedContent),
                recursionRound = round,
                delayedActivation = delayedActivation
            };
        }

        private static WorldbookRuntimeState ResolveRuntimeState(WorldbookScanContext context, string entryKey)
        {
            if (context?.worldbookStates == null || string.IsNullOrWhiteSpace(entryKey))
            {
                return null;
            }

            WorldbookRuntimeState state;
            return context.worldbookStates.TryGetValue(entryKey, out state) ? state : null;
        }

        private static WorldbookScanTrace CreateTrace(
            WorldbookEntry entry,
            bool activated,
            bool budgetSkipped,
            string reason,
            int estimatedTokens,
            int recursionRound,
            bool groupSkipped = false,
            bool delayQueued = false)
        {
            return new WorldbookScanTrace
            {
                entryId = EntryKey(entry),
                title = string.IsNullOrWhiteSpace(entry.title) ? "(未命名世界书)" : entry.title,
                slot = entry.slot,
                activated = activated,
                budgetSkipped = budgetSkipped,
                groupSkipped = groupSkipped,
                delayQueued = delayQueued,
                reason = string.IsNullOrWhiteSpace(reason) ? "未命中" : reason,
                estimatedTokens = estimatedTokens,
                recursionRound = recursionRound
            };
        }

        private static int ResolveBudget(WorldbookScanSettings settings)
        {
            int maxContext = Math.Max(1, settings.maxContextTokens);
            int percent = Math.Max(0, settings.budgetPercent);
            int budget = (int)Math.Round(maxContext * (percent / 100f));
            if (settings.budgetCapTokens > 0)
            {
                budget = Math.Min(budget, settings.budgetCapTokens);
            }

            return Math.Max(1, budget);
        }

        private static void AppendSlotText(WorldbookScanResult result, PromptSlot slot, string text)
        {
            string previous;
            result.slotText.TryGetValue(slot, out previous);
            result.slotText[slot] = string.IsNullOrEmpty(previous)
                ? text
                : previous + "\n\n" + text;
        }

        private static List<ActivatedWorldbookEntry> ApplyGroupCompetition(
            List<ActivatedWorldbookEntry> candidates,
            WorldbookScanSettings settings,
            WorldbookScanResult result)
        {
            List<ActivatedWorldbookEntry> ordered = (candidates ?? new List<ActivatedWorldbookEntry>())
                .Where(item => item?.entry != null)
                .OrderByDescending(item => item.entry.priority)
                .ThenBy(item => item.entry.order)
                .ToList();

            if (settings == null || !settings.groupCompetition)
            {
                return ordered;
            }

            List<ActivatedWorldbookEntry> selected = new List<ActivatedWorldbookEntry>();
            HashSet<string> claimedGroups = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (ActivatedWorldbookEntry candidate in ordered)
            {
                string group = (candidate.entry.group ?? string.Empty).Trim();
                if (string.IsNullOrWhiteSpace(group) || !candidate.entry.groupExclusive)
                {
                    selected.Add(candidate);
                    continue;
                }

                if (claimedGroups.Contains(group))
                {
                    result.traces.Add(CreateTrace(
                        candidate.entry,
                        false,
                        false,
                        "分组竞争跳过，同组已选择: " + group,
                        candidate.estimatedTokens,
                        candidate.recursionRound,
                        groupSkipped: true));
                    continue;
                }

                claimedGroups.Add(group);
                selected.Add(candidate);
            }

            return selected;
        }

        private static string BuildScanText(
            WorldbookEntry entry,
            WorldbookScanContext context,
            WorldbookScanSettings settings,
            List<string> recursionBuffer)
        {
            int depth = entry.scanDepth > 0 ? entry.scanDepth : Math.Max(0, settings.defaultScanDepth);
            if (settings.minActivations > 0 && settings.minActivationDepthMax > depth)
            {
                depth = settings.minActivationDepthMax;
            }

            List<string> chunks = new List<string>();

            if (entry.matchPlayerInput && !string.IsNullOrWhiteSpace(context.publicOperation))
            {
                chunks.Add(context.publicOperation);
            }

            if (entry.matchGameState && !string.IsNullOrWhiteSpace(context.gameStateText))
            {
                chunks.Add(context.gameStateText);
            }

            if (entry.matchRuntimeVariables && !string.IsNullOrWhiteSpace(context.runtimeVariableText))
            {
                chunks.Add(context.runtimeVariableText);
            }

            if (entry.matchContextBlocks && !string.IsNullOrWhiteSpace(context.contextBlockText))
            {
                chunks.Add(context.contextBlockText);
            }

            if (context.extraScanTexts != null)
            {
                chunks.AddRange(context.extraScanTexts.Where(text => !string.IsNullOrWhiteSpace(text)));
            }

            if (entry.matchRecentMessages && context.recentMessages != null && depth > 0)
            {
                chunks.AddRange(context.recentMessages
                    .Where(message => message != null && !string.IsNullOrWhiteSpace(message.content))
                    .Reverse()
                    .Take(depth)
                    .Select(message => message.role + "\n" + message.content));
            }

            if (recursionBuffer != null && recursionBuffer.Count > 0)
            {
                chunks.AddRange(recursionBuffer);
            }

            return string.Join("\n\n", chunks);
        }

        private static bool ShouldActivate(
            WorldbookEntry entry,
            string scanText,
            WorldbookScanSettings settings,
            int recursionRound,
            out string reason)
        {
            reason = "";

            if (entry.activation == WorldbookActivationMode.Constant)
            {
                reason = "常驻激活";
                return PassProbability(entry, settings, recursionRound);
            }

            if (entry.primaryKeys == null || entry.primaryKeys.Count == 0)
            {
                reason = "没有主关键词";
                return false;
            }

            string matchedPrimary = entry.primaryKeys.FirstOrDefault(key => Matches(scanText, key, entry));
            if (string.IsNullOrEmpty(matchedPrimary))
            {
                reason = "主关键词未命中";
                return false;
            }

            bool secondaryOk = SecondaryMatches(entry, scanText);
            if (!secondaryOk)
            {
                reason = "副关键词条件未通过";
                return false;
            }

            if (!PassProbability(entry, settings, recursionRound))
            {
                reason = "概率未通过";
                return false;
            }

            reason = "关键词命中: " + matchedPrimary;
            return true;
        }

        private static bool SecondaryMatches(WorldbookEntry entry, string scanText)
        {
            if (entry.secondaryKeys == null || entry.secondaryKeys.Count == 0)
            {
                return true;
            }

            List<bool> matches = entry.secondaryKeys
                .Where(key => !string.IsNullOrWhiteSpace(key))
                .Select(key => Matches(scanText, key, entry))
                .ToList();

            if (matches.Count == 0)
            {
                return true;
            }

            bool any = matches.Any(value => value);
            bool all = matches.All(value => value);

            switch (entry.secondaryLogic)
            {
                case WorldbookSecondaryLogic.AndAny:
                    return any;
                case WorldbookSecondaryLogic.AndAll:
                    return all;
                case WorldbookSecondaryLogic.NotAny:
                    return !any;
                case WorldbookSecondaryLogic.NotAll:
                    return !all;
                default:
                    return any;
            }
        }

        private static bool Matches(string haystack, string needle, WorldbookEntry entry)
        {
            if (string.IsNullOrEmpty(haystack) || string.IsNullOrWhiteSpace(needle))
            {
                return false;
            }

            StringComparison comparison = entry.caseSensitive
                ? StringComparison.Ordinal
                : StringComparison.OrdinalIgnoreCase;

            if (!entry.matchWholeWords || !IsAsciiWord(needle))
            {
                return haystack.IndexOf(needle, comparison) >= 0;
            }

            RegexOptions options = entry.caseSensitive ? RegexOptions.None : RegexOptions.IgnoreCase;
            return Regex.IsMatch(haystack, "\\b" + Regex.Escape(needle) + "\\b", options);
        }

        private static bool IsAsciiWord(string value)
        {
            return value.All(ch => ch <= 127 && (char.IsLetterOrDigit(ch) || ch == '_' || ch == '-'));
        }

        private static bool PassProbability(WorldbookEntry entry, WorldbookScanSettings settings, int recursionRound)
        {
            if (entry.probability >= 100f)
            {
                return true;
            }

            if (entry.probability <= 0f)
            {
                return false;
            }

            int hash = StableHash(settings.randomSeed + ":" + recursionRound + ":" + EntryKey(entry));
            float roll = Math.Abs(hash % 10000) / 100f;
            return roll <= entry.probability;
        }

        public static string EntryKey(WorldbookEntry entry)
        {
            if (entry == null)
            {
                return "";
            }

            if (!string.IsNullOrWhiteSpace(entry.id))
            {
                return entry.id;
            }

            return entry.title + ":" + entry.tagName + ":" + entry.index + ":" + StableHash(entry.content);
        }

        private static int StableHash(string text)
        {
            unchecked
            {
                int hash = (int)2166136261;
                for (int i = 0; i < (text ?? string.Empty).Length; i += 1)
                {
                    hash ^= text[i];
                    hash *= 16777619;
                }

                return hash;
            }
        }

        private string WrapWorldbookEntry(WorldbookEntry entry)
        {
            string tag = string.IsNullOrWhiteSpace(entry.tagName)
                ? "world_info_idx" + entry.index
                : entry.tagName + "_idx" + entry.index;

            return "<" + tag + ">\n" + ProcessText(entry.content) + "\n</" + tag + ">";
        }

        private string ProcessText(string text)
        {
            return textProcessor(text ?? "") ?? "";
        }
    }
}
