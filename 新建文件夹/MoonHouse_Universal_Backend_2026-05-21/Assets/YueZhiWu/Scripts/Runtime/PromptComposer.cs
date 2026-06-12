using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace Mingyue.YueZhiWu
{
    public sealed class PromptComposer
    {
        private static readonly PromptSlot[] SlotOrder =
        {
            PromptSlot.WorldInfoBefore,
            PromptSlot.CharDescription,
            PromptSlot.PersonaDescription,
            PromptSlot.CharPersonality,
            PromptSlot.Scenario,
            PromptSlot.WorldInfoAfter,
            PromptSlot.RuntimeContext
        };

        private readonly ITokenCounter tokenCounter;
        private readonly MoonHousePresetLibrary presetLibrary;
        private readonly MoonHousePromptStack configuredPromptStack;

        public PromptComposer(
            ITokenCounter tokenCounter,
            MoonHousePresetLibrary presetLibrary = null,
            MoonHousePromptStack promptStack = null)
        {
            this.tokenCounter = tokenCounter ?? new HeuristicTokenCounter();
            this.presetLibrary = presetLibrary;
            configuredPromptStack = promptStack;
        }

        public PromptAssembly Compose(
            MoonHouseSave save,
            MoonHouseGenerationPreset preset,
            WorldbookScanSettings scanSettings,
            string publicOperation,
            PromptComposeOptions options = null)
        {
            PromptComposeOptions composeOptions = options ?? new PromptComposeOptions();
            MoonHouseSave workingSave = save ?? new MoonHouseSave();
            EnsureSaveShape(workingSave);

            MoonHouseGenerationPreset generationPreset = preset ?? new MoonHouseGenerationPreset();
            string normalizedOperation = string.IsNullOrWhiteSpace(publicOperation)
                ? "观察她当前的状态。"
                : publicOperation.Trim();

            MoonHousePresetLibrary activeLibrary = ResolvePresetLibrary(generationPreset);
            MoonHouseContextTemplate contextTemplate = ResolveContextTemplate(activeLibrary);
            MoonHousePromptStack activePromptStack = ResolvePromptStack(workingSave);
            MoonHouseMacroContext macroContext = new MoonHouseMacroContext
            {
                save = workingSave,
                presetLibrary = activeLibrary,
                playerInput = normalizedOperation
            };

            string gameStateText = MoonHouseMacroEngine.BuildGameStateText(workingSave);
            string runtimeVariableText = MoonHouseMacroEngine.BuildRuntimeVariableText(workingSave);
            string contextBlockText = BuildContextBlockScanText(workingSave, macroContext);

            WorldbookScanSettings resolvedScanSettings = scanSettings ?? new WorldbookScanSettings();
            resolvedScanSettings.maxContextTokens = generationPreset.contextTokens;

            WorldbookScanContext scanContext = new WorldbookScanContext
            {
                publicOperation = normalizedOperation,
                recentMessages = workingSave.messages,
                gameStateText = gameStateText,
                runtimeVariableText = runtimeVariableText,
                contextBlockText = contextBlockText,
                worldbookStates = BuildWorldbookStateMap(workingSave),
                extraScanTexts = BuildTemporaryScanTexts(composeOptions, macroContext)
            };

            WorldbookScanResult worldbookScan;
            if (composeOptions.includeWorldbook)
            {
                WorldbookScanner scanner = new WorldbookScanner(
                    tokenCounter,
                    text => MoonHouseMacroEngine.Evaluate(text, macroContext));
                worldbookScan = scanner.Scan(
                    workingSave.worldbookEntries,
                    scanContext,
                    resolvedScanSettings);
            }
            else
            {
                worldbookScan = new WorldbookScanResult();
            }

            string adapter = string.IsNullOrWhiteSpace(generationPreset.presetAdapter)
                ? MoonHouseConstants.DefaultPresetAdapter
                : generationPreset.presetAdapter;

            PromptAssembly assembly = new PromptAssembly
            {
                adapter = adapter,
                publicOperation = normalizedOperation,
                taggedUserInput = WrapPublicOperationForPrompt(normalizedOperation, contextTemplate, macroContext),
                worldbookScan = worldbookScan,
                gameStateDebug = BuildGameStateDebug(gameStateText, runtimeVariableText)
            };

            List<PromptInjection> injects = BuildInjections(
                workingSave,
                adapter,
                worldbookScan,
                composeOptions.includePromptStack ? activePromptStack : new MoonHousePromptStack(),
                macroContext,
                composeOptions);

            PromptInjection agentInstruction = MoonHouseAgentRuntime.CreateAgentInstruction(generationPreset);
            if (agentInstruction != null)
            {
                injects.Add(agentInstruction);
            }

            assembly.injects = injects;
            assembly.injectionText = string.Join("\n\n", injects.Select(inject => inject.content));
            assembly.promptText = assembly.injectionText + "\n\n" + assembly.taggedUserInput;
            assembly.apiMessages = BuildApiMessages(
                workingSave,
                generationPreset,
                injects,
                assembly.taggedUserInput,
                composeOptions,
                out PromptBudgetReport budget);
            assembly.budget = budget;
            assembly.debugSummary = BuildDebugSummary(assembly);
            assembly.worldbookDebug = BuildWorldbookDebug(worldbookScan);
            assembly.tokenDebug = BuildTokenDebug(budget);

            return assembly;
        }

        public static string WrapPublicOperationForPrompt(string publicOperation)
        {
            return "<player_action>\n" + publicOperation + "\n</player_action>";
        }

        private static string WrapPublicOperationForPrompt(
            string publicOperation,
            MoonHouseContextTemplate contextTemplate,
            MoonHouseMacroContext macroContext)
        {
            string template = string.IsNullOrWhiteSpace(contextTemplate?.playerActionTemplate)
                ? "<player_action>\n{{input}}\n</player_action>"
                : contextTemplate.playerActionTemplate;

            macroContext.playerInput = publicOperation ?? "";
            string evaluated = MoonHouseMacroEngine.Evaluate(template, macroContext).Trim();
            return string.IsNullOrWhiteSpace(evaluated)
                ? WrapPublicOperationForPrompt(publicOperation)
                : evaluated;
        }

        private List<PromptInjection> BuildInjections(
            MoonHouseSave save,
            string adapter,
            WorldbookScanResult worldbookScan,
            MoonHousePromptStack promptStack,
            MoonHouseMacroContext macroContext,
            PromptComposeOptions options)
        {
            Dictionary<PromptSlot, List<SlotBlockCandidate>> slotBlocks =
                new Dictionary<PromptSlot, List<SlotBlockCandidate>>();

            foreach (PromptSlot slot in SlotOrder)
            {
                slotBlocks[slot] = new List<SlotBlockCandidate>();
            }

            if (options.includePromptStack)
            {
                foreach (MoonHousePromptNode node in (promptStack?.nodes ?? new List<MoonHousePromptNode>())
                    .Where(node => node != null && node.enabled && !string.IsNullOrWhiteSpace(node.content)))
                {
                    string evaluated = EvaluateMaybe(node.content, macroContext, options).Trim();
                    if (string.IsNullOrWhiteSpace(evaluated))
                    {
                        continue;
                    }

                    AddSlotBlock(
                        slotBlocks,
                        node.slot,
                        WrapPromptNode(node, evaluated),
                        node.priority,
                        node.injectionOrder);
                }
            }

            if (options.includeContextBlocks)
            {
                foreach (MoonHouseContextBlock block in (save.contextBlocks ?? new List<MoonHouseContextBlock>())
                    .Where(block => block != null && !string.IsNullOrWhiteSpace(block.content)))
                {
                    string evaluated = EvaluateMaybe(block.content, macroContext, options).Trim();
                    if (string.IsNullOrWhiteSpace(evaluated))
                    {
                        continue;
                    }

                    AddSlotBlock(
                        slotBlocks,
                        block.slot,
                        WrapContextBlock(block, evaluated),
                        block.priority,
                        block.index);
                }
            }

            if (options.includeRuntimeState)
            {
                string userPersona = MoonHouseMemoryRuntime.BuildUserPersonaInjection(save);
                if (!string.IsNullOrWhiteSpace(userPersona))
                {
                    AddSlotBlock(slotBlocks, PromptSlot.PersonaDescription, userPersona, 1200, 1800);
                }

                string grandSummary = MoonHouseMemoryRuntime.BuildGrandSummaryInjection(save);
                if (!string.IsNullOrWhiteSpace(grandSummary))
                {
                    AddSlotBlock(slotBlocks, PromptSlot.WorldInfoBefore, grandSummary, 1150, 2000);
                }

                string dynamicProfiles = MoonHouseMemoryRuntime.BuildDynamicProfileInjection(save);
                if (!string.IsNullOrWhiteSpace(dynamicProfiles))
                {
                    AddSlotBlock(slotBlocks, PromptSlot.CharPersonality, dynamicProfiles, 950, 2100);
                }

                string neuralChain = MoonHouseMemoryRuntime.BuildNeuralChainInjection(save, macroContext.playerInput);
                if (!string.IsNullOrWhiteSpace(neuralChain))
                {
                    AddSlotBlock(slotBlocks, PromptSlot.CharPersonality, neuralChain, 940, 2200);
                }

                string ecosystemDigest = MoonHouseEcosystemRuntime.BuildPromptInjection(save, macroContext.playerInput);
                if (!string.IsNullOrWhiteSpace(ecosystemDigest))
                {
                    AddSlotBlock(slotBlocks, PromptSlot.RuntimeContext, ecosystemDigest, 1120, 8800);
                }

                string runtimeStateBlock = BuildRuntimeStateBlock(save);
                if (!string.IsNullOrWhiteSpace(runtimeStateBlock))
                {
                    AddSlotBlock(slotBlocks, PromptSlot.RuntimeContext, runtimeStateBlock, 1050, 9000);
                }
            }

            if (options.includeWorldbook)
            {
                foreach (KeyValuePair<PromptSlot, string> item in worldbookScan.slotText)
                {
                    AddSlotBlock(slotBlocks, item.Key, item.Value, 800, 10000);
                }
            }

            List<PromptInjection> injects = new List<PromptInjection>();
            foreach (PromptSlot slot in SlotOrder)
            {
                string slotContent = string.Join(
                    "\n\n",
                    slotBlocks[slot]
                        .Where(item => !string.IsNullOrWhiteSpace(item.content))
                        .OrderByDescending(item => item.priority)
                        .ThenBy(item => item.order)
                        .Select(item => item.content));
                if (string.IsNullOrWhiteSpace(slotContent))
                {
                    continue;
                }

                string wrappedSlot = WrapPromptSlot(slot, slotContent);
                injects.Add(new PromptInjection
                {
                    position = "in_chat",
                    depth = 0,
                    role = "system",
                    content = AdaptSlot(adapter, wrappedSlot),
                    shouldScan = false
                });
            }

            injects.AddRange(BuildTemporaryInjections(options, macroContext));
            return injects;
        }

        private static void AddSlotBlock(
            Dictionary<PromptSlot, List<SlotBlockCandidate>> slotBlocks,
            PromptSlot slot,
            string content,
            int priority,
            int order)
        {
            if (!slotBlocks.ContainsKey(slot))
            {
                slotBlocks[slot] = new List<SlotBlockCandidate>();
            }

            slotBlocks[slot].Add(new SlotBlockCandidate
            {
                content = content,
                priority = priority,
                order = order
            });
        }

        private static string WrapPromptNode(MoonHousePromptNode node, string content)
        {
            string identifier = string.IsNullOrWhiteSpace(node.identifier) ? "prompt_node" : node.identifier;
            string label = string.IsNullOrWhiteSpace(node.name) ? identifier : node.name;
            string tag = node.marker ? "prompt_marker" : "prompt_node";
            return "<" + tag +
                   " id=\"" + EscapeAttribute(identifier) + "\"" +
                   " label=\"" + EscapeAttribute(label) + "\"" +
                   " source=\"" + EscapeAttribute(node.source) + "\">\n" +
                   content +
                   "\n</" + tag + ">";
        }

        private static string WrapContextBlock(MoonHouseContextBlock block, string content)
        {
            string tag = !string.IsNullOrWhiteSpace(block.wrapTag)
                ? block.wrapTag
                : block.tagName + "_idx" + block.index;

            if (block.preserveContent)
            {
                return "<" + tag + ">\n" + content + "\n</" + tag + ">";
            }

            StringBuilder builder = new StringBuilder();
            builder.AppendLine("<" + tag + ">");
            builder.AppendLine("块名: " + block.label);
            builder.AppendLine("模块槽: " + block.slot.ToSlotId());
            builder.AppendLine("来源: " + block.source);
            builder.AppendLine("用途: " + block.matchReason);
            builder.AppendLine("内容:");
            builder.AppendLine(content);
            builder.AppendLine("</" + tag + ">");
            return builder.ToString().TrimEnd();
        }

        private static string BuildRuntimeStateBlock(MoonHouseSave save)
        {
            string variableText = MoonHouseMacroEngine.BuildRuntimeVariableText(save);
            if (string.IsNullOrWhiteSpace(variableText))
            {
                return "";
            }

            StringBuilder builder = new StringBuilder();
            builder.AppendLine("<runtime_state_idx1>");
            builder.AppendLine("块名: 游戏运行变量");
            builder.AppendLine("模块槽: " + PromptSlot.RuntimeContext.ToSlotId());
            builder.AppendLine("来源: moon_house_save");
            builder.AppendLine("用途: 让模型遵守 Unity 已确定的数值、旗标和玩家状态。");
            builder.AppendLine("内容:");
            builder.AppendLine(variableText);
            builder.AppendLine("</runtime_state_idx1>");
            return builder.ToString().TrimEnd();
        }

        private static string WrapPromptSlot(PromptSlot slot, string content)
        {
            return "<prompt_slot id=\"" + slot.ToSlotId() + "\" label=\"" + slot.ToLabel() + "\">\n" +
                   content +
                   "\n</prompt_slot>";
        }

        private static string AdaptSlot(string adapter, string slotText)
        {
            if (adapter == MoonHouseConstants.DefaultPresetAdapter)
            {
                return "<observed_piece class=\"设定\">\n" + slotText + "\n</observed_piece>";
            }

            return slotText;
        }

        private List<MoonHouseMessage> BuildApiMessages(
            MoonHouseSave save,
            MoonHouseGenerationPreset preset,
            List<PromptInjection> injects,
            string taggedUserInput,
            PromptComposeOptions options,
            out PromptBudgetReport budget)
        {
            List<MoonHouseMessage> apiMessages = new List<MoonHouseMessage>();
            foreach (PromptInjection inject in injects)
            {
                apiMessages.Add(new MoonHouseMessage(inject.role, inject.content));
            }

            int availableTokens = Math.Max(512, preset.contextTokens - preset.reservedOutputTokens);
            int injectTokens = apiMessages.Sum(message => tokenCounter.CountMessage(message.role, message.content));
            int userInputTokens = tokenCounter.CountMessage("user", taggedUserInput);
            int currentTokens = tokenCounter.CountRequestOverhead() + injectTokens + userInputTokens;

            List<MoonHouseMessage> history = options.includeHistory
                ? MoonHouseMemoryRuntime.FilterHistoryForPrompt(save, save.messages ?? new List<MoonHouseMessage>())
                    .Where(message => message != null && !string.IsNullOrWhiteSpace(message.content))
                    .Reverse()
                    .Take(Math.Max(0, preset.historyMessageLimit))
                    .ToList()
                : new List<MoonHouseMessage>();

            history.Reverse();
            List<MoonHouseMessage> selectedHistory = new List<MoonHouseMessage>();
            int droppedHistoryMessages = 0;
            int historyTokens = 0;

            for (int i = history.Count - 1; i >= 0; i -= 1)
            {
                MoonHouseMessage message = history[i];
                int tokens = tokenCounter.CountMessage(message.role, message.content);
                if (currentTokens + tokens > availableTokens)
                {
                    droppedHistoryMessages += 1;
                    continue;
                }

                selectedHistory.Insert(0, message);
                currentTokens += tokens;
                historyTokens += tokens;
            }

            apiMessages.AddRange(selectedHistory);
            apiMessages.Add(new MoonHouseMessage("user", taggedUserInput));
            apiMessages = MoonHousePromptPostProcessor.Process(apiMessages, preset);
            currentTokens = tokenCounter.CountRequestOverhead() +
                            apiMessages.Sum(message => tokenCounter.CountMessage(message.role, message.content));

            budget = new PromptBudgetReport
            {
                tokenizerKey = TokenCounterFactory.ResolveTokenizerKey(preset.tokenizerKey, preset.model),
                tokenizerName = TokenCounterFactory.ResolveTokenizerLabel(preset.tokenizerKey, preset.model),
                contextTokens = preset.contextTokens,
                reservedOutputTokens = preset.reservedOutputTokens,
                availablePromptTokens = availableTokens,
                injectTokens = injectTokens,
                historyTokens = historyTokens,
                userInputTokens = userInputTokens,
                totalPromptTokens = currentTokens,
                selectedHistoryMessages = selectedHistory.Count,
                droppedHistoryMessages = droppedHistoryMessages
            };

            return apiMessages;
        }

        private static List<string> BuildTemporaryScanTexts(
            PromptComposeOptions options,
            MoonHouseMacroContext macroContext)
        {
            List<string> scanTexts = new List<string>();
            foreach (PromptInjection inject in options.temporaryInjects ?? new List<PromptInjection>())
            {
                if (inject == null || !inject.shouldScan || string.IsNullOrWhiteSpace(inject.content))
                {
                    continue;
                }

                string content = EvaluateMaybe(inject.content, macroContext, options).Trim();
                if (!string.IsNullOrWhiteSpace(content))
                {
                    scanTexts.Add(content);
                }
            }

            return scanTexts;
        }

        private static List<PromptInjection> BuildTemporaryInjections(
            PromptComposeOptions options,
            MoonHouseMacroContext macroContext)
        {
            List<PromptInjection> injects = new List<PromptInjection>();
            foreach (PromptInjection inject in options.temporaryInjects ?? new List<PromptInjection>())
            {
                if (inject == null ||
                    string.Equals(inject.position, "none", StringComparison.OrdinalIgnoreCase) ||
                    string.IsNullOrWhiteSpace(inject.content))
                {
                    continue;
                }

                string content = EvaluateMaybe(inject.content, macroContext, options).Trim();
                if (string.IsNullOrWhiteSpace(content))
                {
                    continue;
                }

                injects.Add(new PromptInjection
                {
                    id = string.IsNullOrWhiteSpace(inject.id) ? MoonHouseIds.Create("temp_inject") : inject.id,
                    position = string.IsNullOrWhiteSpace(inject.position) ? "in_chat" : inject.position,
                    depth = inject.depth,
                    role = string.IsNullOrWhiteSpace(inject.role) ? "system" : inject.role,
                    content = content,
                    shouldScan = inject.shouldScan
                });
            }

            return injects
                .OrderByDescending(inject => inject.depth)
                .ToList();
        }

        private static string EvaluateMaybe(
            string text,
            MoonHouseMacroContext macroContext,
            PromptComposeOptions options)
        {
            return options.evaluateMacros ? MoonHouseMacroEngine.Evaluate(text, macroContext) : (text ?? "");
        }

        private MoonHousePresetLibrary ResolvePresetLibrary(MoonHouseGenerationPreset generationPreset)
        {
            if (HasPresetLibraryContent(presetLibrary))
            {
                return presetLibrary;
            }

            return MoonHouseDefaults.CreateStarterPresetLibrary(generationPreset);
        }

        private static bool HasPresetLibraryContent(MoonHousePresetLibrary library)
        {
            return library != null &&
                   ((library.contextTemplates != null && library.contextTemplates.Count > 0) ||
                    (library.systemPrompts != null && library.systemPrompts.Count > 0) ||
                    (library.reasoningPresets != null && library.reasoningPresets.Count > 0));
        }

        private static MoonHouseContextTemplate ResolveContextTemplate(MoonHousePresetLibrary library)
        {
            if (library?.contextTemplates == null || library.contextTemplates.Count == 0)
            {
                return new MoonHouseContextTemplate();
            }

            return library.contextTemplates.FirstOrDefault(template =>
                       template != null && template.id == library.activeContextTemplateId) ??
                   library.contextTemplates.FirstOrDefault(template => template != null) ??
                   new MoonHouseContextTemplate();
        }

        private MoonHousePromptStack ResolvePromptStack(MoonHouseSave save)
        {
            if (save?.promptStack?.nodes != null && save.promptStack.nodes.Count > 0)
            {
                return save.promptStack;
            }

            if (configuredPromptStack?.nodes != null && configuredPromptStack.nodes.Count > 0)
            {
                return configuredPromptStack;
            }

            return MoonHouseDefaults.CreateStarterPromptStack();
        }

        private static string BuildContextBlockScanText(MoonHouseSave save, MoonHouseMacroContext macroContext)
        {
            if (save?.contextBlocks == null)
            {
                return "";
            }

            return string.Join(
                "\n\n",
                save.contextBlocks
                    .Where(block => block != null && !string.IsNullOrWhiteSpace(block.content))
                    .Select(block => MoonHouseMacroEngine.Evaluate(block.content, macroContext).Trim())
                    .Where(text => !string.IsNullOrWhiteSpace(text)));
        }

        private static Dictionary<string, WorldbookRuntimeState> BuildWorldbookStateMap(MoonHouseSave save)
        {
            Dictionary<string, WorldbookRuntimeState> map = new Dictionary<string, WorldbookRuntimeState>();
            if (save?.worldbookStates == null)
            {
                return map;
            }

            foreach (WorldbookRuntimeState state in save.worldbookStates)
            {
                if (state == null || string.IsNullOrWhiteSpace(state.entryId))
                {
                    continue;
                }

                map[state.entryId] = state;
            }

            return map;
        }

        private static string BuildGameStateDebug(string gameStateText, string runtimeVariableText)
        {
            List<string> chunks = new List<string>();
            if (!string.IsNullOrWhiteSpace(gameStateText))
            {
                chunks.Add(gameStateText);
            }

            if (!string.IsNullOrWhiteSpace(runtimeVariableText))
            {
                chunks.Add(runtimeVariableText);
            }

            return string.Join("\n\n", chunks);
        }

        private static void EnsureSaveShape(MoonHouseSave save)
        {
            if (save.messages == null)
            {
                save.messages = new List<MoonHouseMessage>();
            }

            if (save.runtimeVariables == null)
            {
                save.runtimeVariables = new List<MoonHouseRuntimeVariable>();
            }

            if (save.contextBlocks == null)
            {
                save.contextBlocks = new List<MoonHouseContextBlock>();
            }

            if (save.worldbookEntries == null)
            {
                save.worldbookEntries = new List<WorldbookEntry>();
            }

            if (save.worldbookStates == null)
            {
                save.worldbookStates = new List<WorldbookRuntimeState>();
            }

            if (save.promptStack == null)
            {
                save.promptStack = new MoonHousePromptStack();
            }

            if (save.promptStack.nodes == null)
            {
                save.promptStack.nodes = new List<MoonHousePromptNode>();
            }

            if (save.gameState == null)
            {
                save.gameState = new MoonHouseGameState();
            }

            save.memorySettings = save.memorySettings ?? new MoonHouseMemorySettings();
            save.memorySettings.dedicatedApiPreset = save.memorySettings.dedicatedApiPreset ?? new MoonHouseGenerationPreset();
            save.memoryBank = save.memoryBank ?? new List<MoonHouseMemoryItem>();
            save.userPersonas = save.userPersonas ?? new List<MoonHouseUserPersona>();
        }

        private static string BuildDebugSummary(PromptAssembly assembly)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("月之屋提示词装配");
            builder.AppendLine("adapter: " + assembly.adapter);
            builder.AppendLine("injects: " + assembly.injects.Count);
            builder.AppendLine("worldbook activated: " + assembly.worldbookScan.activatedEntries.Count);
            builder.AppendLine("worldbook budget: " + assembly.worldbookScan.usedTokens + "/" + assembly.worldbookScan.budgetTokens);
            builder.AppendLine("game state: " + (string.IsNullOrWhiteSpace(assembly.gameStateDebug) ? "empty" : "included"));
            builder.AppendLine("tokenizer: " + assembly.budget.tokenizerName);
            builder.AppendLine("prompt tokens: " + assembly.budget.totalPromptTokens + "/" + assembly.budget.availablePromptTokens);
            builder.AppendLine("history selected/dropped: " + assembly.budget.selectedHistoryMessages + "/" + assembly.budget.droppedHistoryMessages);

            foreach (ActivatedWorldbookEntry activated in assembly.worldbookScan.activatedEntries)
            {
                builder.AppendLine("- " + activated.entry.title + " (" + activated.reason + ")");
            }

            return builder.ToString().TrimEnd();
        }

        private static string BuildWorldbookDebug(WorldbookScanResult scan)
        {
            if (scan == null)
            {
                return "世界书调试: 无扫描结果";
            }

            StringBuilder builder = new StringBuilder();
            builder.AppendLine("世界书调试");
            builder.AppendLine("预算: " + scan.usedTokens + "/" + scan.budgetTokens + (scan.budgetOverflowed ? " (有条目因预算跳过)" : ""));
            builder.AppendLine("激活数量: " + scan.activatedEntries.Count);

            foreach (WorldbookScanTrace trace in scan.traces)
            {
                string state = trace.activated
                    ? "激活"
                    : trace.budgetSkipped
                        ? "预算跳过"
                        : trace.groupSkipped
                            ? "分组跳过"
                            : trace.delayQueued
                                ? "延迟等待"
                                : "未激活";
                builder.AppendLine("- [" + state + "] " + trace.title + " / " + trace.slot.ToSlotId() + " / " + trace.reason);
            }

            return builder.ToString().TrimEnd();
        }

        private static string BuildTokenDebug(PromptBudgetReport budget)
        {
            if (budget == null)
            {
                return "分词调试: 无预算报告";
            }

            StringBuilder builder = new StringBuilder();
            builder.AppendLine("分词与上下文预算");
            builder.AppendLine("tokenizer: " + budget.tokenizerName);
            builder.AppendLine("上下文: " + budget.contextTokens + "，预留输出: " + budget.reservedOutputTokens);
            builder.AppendLine("可用提示词预算: " + budget.availablePromptTokens);
            builder.AppendLine("设定注入: " + budget.injectTokens);
            builder.AppendLine("历史消息: " + budget.historyTokens + " (" + budget.selectedHistoryMessages + " 条)");
            builder.AppendLine("本轮输入: " + budget.userInputTokens);
            builder.AppendLine("总提示词估算: " + budget.totalPromptTokens);
            builder.AppendLine("丢弃历史: " + budget.droppedHistoryMessages + " 条");
            return builder.ToString().TrimEnd();
        }

        private static string EscapeAttribute(string value)
        {
            return (value ?? "")
                .Replace("&", "&amp;")
                .Replace("\"", "&quot;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;");
        }

        private sealed class SlotBlockCandidate
        {
            public string content = "";
            public int priority;
            public int order;
        }
    }
}
