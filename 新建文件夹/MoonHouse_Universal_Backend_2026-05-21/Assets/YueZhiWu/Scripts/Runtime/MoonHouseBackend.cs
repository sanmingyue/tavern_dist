using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using UnityEngine;

namespace Mingyue.YueZhiWu
{
    public class MoonHouseBackend : MonoBehaviour, IMoonHouseRuntime
    {
        public MoonHouseConfig config;
        public string saveFileName = "moon_house_save.json";
        public bool loadOnAwake = true;

        public MoonHouseSave SaveData { get; private set; }
        public PromptAssembly LastPromptAssembly { get; private set; }
        public MoonHouseGenerationResult LastGenerationResult { get; private set; }

        public event Action<MoonHouseMessage> MessageAdded;
        public event Action SaveChanged;
        public event Action<MoonHouseEvent> EventEmitted;

        private MoonHouseStore store;
        private MoonHouseApiClient apiClient;
        private readonly List<MoonHouseEvent> recentEvents = new List<MoonHouseEvent>();
        private readonly Dictionary<string, CancellationTokenSource> activeGenerations =
            new Dictionary<string, CancellationTokenSource>();

        private sealed class StreamChunkEmitter
        {
            private readonly string generationId;
            private readonly int flushIntervalMs;
            private readonly int flushMinChars;
            private readonly Action<MoonHouseStreamChunk> emit;
            private readonly StringBuilder pendingDelta = new StringBuilder();
            private DateTime lastFlushUtc = DateTime.UtcNow;
            private string accumulatedText = "";
            private string rawJson = "";
            private long elapsedMilliseconds;
            private long firstTokenLatencyMs;
            private bool doneEmitted;

            public StreamChunkEmitter(
                string generationId,
                int flushIntervalMs,
                int flushMinChars,
                Action<MoonHouseStreamChunk> emit)
            {
                this.generationId = generationId ?? "";
                this.flushIntervalMs = Math.Max(0, flushIntervalMs);
                this.flushMinChars = Math.Max(1, flushMinChars);
                this.emit = emit;
            }

            public void Push(MoonHouseStreamChunk chunk)
            {
                if (chunk == null)
                {
                    return;
                }

                accumulatedText = chunk.accumulatedText ?? accumulatedText;
                rawJson = chunk.rawJson ?? rawJson;
                elapsedMilliseconds = Math.Max(elapsedMilliseconds, chunk.elapsedMilliseconds);
                if (chunk.firstTokenLatencyMs > 0)
                {
                    firstTokenLatencyMs = firstTokenLatencyMs > 0
                        ? Math.Min(firstTokenLatencyMs, chunk.firstTokenLatencyMs)
                        : chunk.firstTokenLatencyMs;
                }

                if (!string.IsNullOrEmpty(chunk.deltaText))
                {
                    pendingDelta.Append(chunk.deltaText);
                }

                if (chunk.isDone)
                {
                    FlushDone(accumulatedText);
                    return;
                }

                if (ShouldFlush())
                {
                    Flush(false, accumulatedText);
                }
            }

            public void FlushDone(string finalText)
            {
                if (doneEmitted && pendingDelta.Length == 0)
                {
                    return;
                }

                if (!string.IsNullOrWhiteSpace(finalText))
                {
                    accumulatedText = finalText;
                }

                doneEmitted = true;
                Flush(true, accumulatedText);
            }

            private bool ShouldFlush()
            {
                if (pendingDelta.Length >= flushMinChars)
                {
                    return true;
                }

                if (flushIntervalMs <= 0)
                {
                    return true;
                }

                int timedFlushChars = Math.Min(3, flushMinChars);
                return pendingDelta.Length >= timedFlushChars &&
                       (DateTime.UtcNow - lastFlushUtc).TotalMilliseconds >= flushIntervalMs;
            }

            private void Flush(bool isDone, string currentText)
            {
                if (pendingDelta.Length == 0 && !isDone)
                {
                    return;
                }

                MoonHouseStreamChunk chunk = new MoonHouseStreamChunk
                {
                    generationId = generationId,
                    deltaText = pendingDelta.ToString(),
                    accumulatedText = currentText ?? "",
                    rawJson = rawJson,
                    createdAtIso = DateTime.UtcNow.ToString("O"),
                    elapsedMilliseconds = elapsedMilliseconds,
                    firstTokenLatencyMs = firstTokenLatencyMs,
                    isDone = isDone
                };

                pendingDelta.Length = 0;
                lastFlushUtc = DateTime.UtcNow;
                emit?.Invoke(chunk);
            }
        }

        private void Awake()
        {
            store = new MoonHouseStore();
            apiClient = new MoonHouseApiClient();

            if (loadOnAwake)
            {
                Load();
            }
        }

        public void Load()
        {
            SaveData = store.LoadOrCreate(saveFileName, config);
            SaveChanged?.Invoke();
            EmitEvent(MoonHouseEventTypes.BackendLoaded, "月之屋存档已加载。");
        }

        public void Save()
        {
            EnsureLoaded();
            store.Save(saveFileName, SaveData);
            SaveChanged?.Invoke();
            EmitEvent(MoonHouseEventTypes.SaveChanged, "月之屋存档已保存。");
        }

        public PromptAssembly PreviewPrompt(string playerInput)
        {
            EnsureLoaded();
            MoonHouseGenerationPreset preset = ResolvePreset();
            ITokenCounter counter = TokenCounterFactory.Create(preset.tokenizerKey, preset.model);
            PromptComposer composer = new PromptComposer(counter, ResolvePresetLibrary(), ResolvePromptStack());
            LastPromptAssembly = composer.Compose(
                SaveData,
                preset,
                ResolveScanSettings(preset),
                playerInput);
            EmitPromptEvents(LastPromptAssembly, "");
            return LastPromptAssembly;
        }

        public async Task<MoonHouseGenerationResult> GenerateStoryAsync(string playerInput)
        {
            MoonHouseTurnResponse response = await SendTurnAsync(new MoonHouseTurnRequest
            {
                playerInput = playerInput,
                saveToHistory = true
            });
            return LastGenerationResult;
        }

        public async Task<MoonHouseTurnResponse> GenerateRawAsync(MoonHouseGenerateRawRequest request)
        {
            EnsureLoaded();

            MoonHouseGenerateRawRequest rawRequest = request ?? new MoonHouseGenerateRawRequest();
            string generationId = ResolveGenerationId(rawRequest.generationId);
            MoonHouseGenerationPreset preset = ResolvePresetForRequest(rawRequest.presetOverride, -1);
            PromptAssembly assembly = null;
            MoonHouseGenerationResult result = null;
            CancellationTokenSource generationCts = BeginGeneration(generationId);
            MoonHouseRequestOptions requestOptions = CreateRequestOptions(rawRequest, generationId, generationCts.Token);

            try
            {
                ApplyRawRequestState(rawRequest);
                EmitEvent(MoonHouseEventTypes.GenerationStarted, "月之屋 Raw 生成开始。", generationId);
                assembly = BuildRawAssembly(rawRequest, preset);
                LastPromptAssembly = assembly;
                EmitPromptEvents(assembly, generationId);

                result = await apiClient.GenerateAsync(preset, assembly, requestOptions);
                result = await FinalizeAgentResultAsync(
                    result,
                    preset,
                    assembly,
                    requestOptions,
                    generationId,
                    rawRequest.saveToHistory,
                    true);
                ApplyOutputParsing(result, rawRequest.outputParsing, preset, rawRequest.saveToHistory, generationId);
                if (result == null || string.IsNullOrWhiteSpace(result.text))
                {
                    throw new InvalidOperationException("月之屋 Raw API 返回了空回复。");
                }
            }
            catch (Exception error)
            {
                CleanupTurnScopedVariables();
                EmitGenerationException(error, generationId);
                throw;
            }
            finally
            {
                EndGeneration(generationId, generationCts);
            }

            MoonHouseMessage playerMessage = string.IsNullOrWhiteSpace(rawRequest.userInput)
                ? new MoonHouseMessage("user", "")
                : new MoonHouseMessage("user", rawRequest.userInput.Trim());
            MoonHouseMessage assistantMessage = new MoonHouseMessage("assistant", result.text);

            if (rawRequest.saveToHistory)
            {
                if (!string.IsNullOrWhiteSpace(playerMessage.content))
                {
                    SaveData.messages.Add(playerMessage);
                    MessageAdded?.Invoke(playerMessage);
                    EmitMessageAdded(playerMessage, generationId);
                }

                SaveData.messages.Add(assistantMessage);
                MessageAdded?.Invoke(assistantMessage);
                EmitMessageAdded(assistantMessage, generationId);
                CleanupTurnScopedVariables();
                SaveData.turnIndex += 1;
                store.Save(saveFileName, SaveData);
                SaveChanged?.Invoke();
                EmitEvent(MoonHouseEventTypes.SaveChanged, "Raw 生成已写入存档。", generationId);
            }
            else
            {
                CleanupTurnScopedVariables();
            }

            LastGenerationResult = result;
            EmitGenerationCompleted(result, assembly, generationId);

            return new MoonHouseTurnResponse
            {
                playerMessageId = playerMessage.id,
                assistantMessageId = assistantMessage.id,
                assistantText = result.text,
                model = result.model,
                createdAtIso = result.createdAtIso,
                prompt = assembly,
                parsedOutput = result.parsedOutput ?? new MoonHouseParsedOutput(),
                patchResults = result.statePatchResults ?? new List<MoonHouseStatePatchResult>(),
                save = SaveData
            };
        }

        public async Task<MoonHouseTurnResponse> SendTurnAsync(MoonHouseTurnRequest request)
        {
            EnsureLoaded();

            MoonHouseTurnRequest turnRequest = request ?? new MoonHouseTurnRequest();
            if (turnRequest.stream)
            {
                return await SendTurnStreamAsync(turnRequest);
            }

            string generationId = ResolveGenerationId(turnRequest.generationId);
            MoonHouseGenerationPreset preset = ResolvePresetForRequest(turnRequest.presetOverride, turnRequest.historyMessageLimitOverride);
            PromptAssembly assembly = null;
            MoonHouseGenerationResult result = null;
            CancellationTokenSource generationCts = BeginGeneration(generationId);
            MoonHouseRequestOptions requestOptions = CreateRequestOptions(turnRequest, generationId, generationCts.Token);

            try
            {
                ApplyTurnRequestState(turnRequest, false);
                EmitEvent(MoonHouseEventTypes.GenerationStarted, "月之屋生成开始。", generationId);
                assembly = BuildPromptForTurn(turnRequest, preset);
                EmitPromptEvents(assembly, generationId);

                result = await apiClient.GenerateAsync(preset, assembly, requestOptions);
                result = await FinalizeAgentResultAsync(
                    result,
                    preset,
                    assembly,
                    requestOptions,
                    generationId,
                    turnRequest.saveToHistory,
                    true);
                ApplyOutputParsing(result, turnRequest.outputParsing, preset, turnRequest.saveToHistory, generationId);
                if (result == null || string.IsNullOrWhiteSpace(result.text))
                {
                    throw new InvalidOperationException("月之屋 API 返回了空回复，已取消写入聊天历史。");
                }
            }
            catch (Exception error)
            {
                CleanupTurnScopedVariables();
                EmitGenerationException(error, generationId);
                throw;
            }
            finally
            {
                EndGeneration(generationId, generationCts);
            }

            MoonHouseMessage playerMessage = new MoonHouseMessage("user", assembly.taggedUserInput);
            MoonHouseMessage assistantMessage = new MoonHouseMessage("assistant", result.text);

            if (turnRequest.saveToHistory)
            {
                SaveData.messages.Add(playerMessage);
                SaveData.messages.Add(assistantMessage);
                ApplyWorldbookRuntimeEffects(assembly);
                CleanupTurnScopedVariables();
                SaveData.turnIndex += 1;
                store.Save(saveFileName, SaveData);
                SaveChanged?.Invoke();
                EmitEvent(MoonHouseEventTypes.SaveChanged, "本轮生成已写入存档。", generationId);
                await TryAutoMemorySummaryAsync(preset, generationId);
            }
            else
            {
                CleanupTurnScopedVariables();
            }

            LastGenerationResult = result;
            if (!turnRequest.silent)
            {
                MessageAdded?.Invoke(playerMessage);
                MessageAdded?.Invoke(assistantMessage);
                EmitMessageAdded(playerMessage, generationId);
                EmitMessageAdded(assistantMessage, generationId);
            }

            EmitGenerationCompleted(result, assembly, generationId);

            return new MoonHouseTurnResponse
            {
                playerMessageId = playerMessage.id,
                assistantMessageId = assistantMessage.id,
                assistantText = result.text,
                model = result.model,
                createdAtIso = result.createdAtIso,
                prompt = assembly,
                parsedOutput = result.parsedOutput ?? new MoonHouseParsedOutput(),
                patchResults = result.statePatchResults ?? new List<MoonHouseStatePatchResult>(),
                save = SaveData
            };
        }

        public async Task<MoonHouseTurnResponse> SendTurnStreamAsync(
            MoonHouseTurnRequest request,
            Action<MoonHouseStreamChunk> onChunk = null)
        {
            EnsureLoaded();

            MoonHouseTurnRequest turnRequest = request ?? new MoonHouseTurnRequest();
            string generationId = ResolveGenerationId(turnRequest.generationId);
            MoonHouseGenerationPreset preset = ResolvePresetForRequest(turnRequest.presetOverride, turnRequest.historyMessageLimitOverride);
            PromptAssembly assembly = null;
            MoonHouseGenerationResult result = null;
            CancellationTokenSource generationCts = BeginGeneration(generationId);
            MoonHouseRequestOptions requestOptions = CreateRequestOptions(turnRequest, generationId, generationCts.Token);
            StreamChunkEmitter emitter = new StreamChunkEmitter(
                generationId,
                turnRequest.streamFlushIntervalMs,
                turnRequest.streamFlushMinChars,
                chunk =>
                {
                    try
                    {
                        onChunk?.Invoke(chunk);
                    }
                    catch (Exception error)
                    {
                        Debug.LogException(error);
                    }

                    EmitStreamDelta(chunk, generationId);
                });

            try
            {
                ApplyTurnRequestState(turnRequest, false);
                EmitEvent(MoonHouseEventTypes.GenerationStarted, "月之屋流式生成开始。", generationId);
                assembly = BuildPromptForTurn(turnRequest, preset);
                EmitPromptEvents(assembly, generationId);

                result = await apiClient.GenerateStreamAsync(
                    preset,
                    assembly,
                    emitter.Push,
                    generationId,
                    requestOptions);

                result = await FinalizeAgentResultAsync(
                    result,
                    preset,
                    assembly,
                    requestOptions,
                    generationId,
                    turnRequest.saveToHistory,
                    false);
                ApplyOutputParsing(result, turnRequest.outputParsing, preset, turnRequest.saveToHistory, generationId);
                if (result == null || string.IsNullOrWhiteSpace(result.text))
                {
                    throw new InvalidOperationException("月之屋流式 API 返回了空回复，已取消写入聊天历史。");
                }
            }
            catch (Exception error)
            {
                CleanupTurnScopedVariables();
                EmitGenerationException(error, generationId);
                throw;
            }
            finally
            {
                if (result != null)
                {
                    emitter.FlushDone(result.text);
                }

                EndGeneration(generationId, generationCts);
            }

            MoonHouseMessage playerMessage = new MoonHouseMessage("user", assembly.taggedUserInput);
            MoonHouseMessage assistantMessage = new MoonHouseMessage("assistant", result.text);

            if (turnRequest.saveToHistory)
            {
                SaveData.messages.Add(playerMessage);
                SaveData.messages.Add(assistantMessage);
                ApplyWorldbookRuntimeEffects(assembly);
                CleanupTurnScopedVariables();
                SaveData.turnIndex += 1;
                store.Save(saveFileName, SaveData);
                SaveChanged?.Invoke();
                EmitEvent(MoonHouseEventTypes.SaveChanged, "本轮流式生成已写入存档。", generationId);
                await TryAutoMemorySummaryAsync(preset, generationId);
            }
            else
            {
                CleanupTurnScopedVariables();
            }

            LastGenerationResult = result;
            if (!turnRequest.silent)
            {
                MessageAdded?.Invoke(playerMessage);
                MessageAdded?.Invoke(assistantMessage);
                EmitMessageAdded(playerMessage, generationId);
                EmitMessageAdded(assistantMessage, generationId);
            }

            EmitGenerationCompleted(result, assembly, generationId);

            return new MoonHouseTurnResponse
            {
                playerMessageId = playerMessage.id,
                assistantMessageId = assistantMessage.id,
                assistantText = result.text,
                model = result.model,
                createdAtIso = result.createdAtIso,
                prompt = assembly,
                parsedOutput = result.parsedOutput ?? new MoonHouseParsedOutput(),
                patchResults = result.statePatchResults ?? new List<MoonHouseStatePatchResult>(),
                save = SaveData
            };
        }

        public async Task<MoonHouseGameTurnResponse> RunSceneTurnAsync(MoonHouseGameTurnRequest request)
        {
            return await RunGameTurnAsync(request, MoonHouseGameTurnKind.Scene);
        }

        public async Task<MoonHouseGameTurnResponse> RunNpcDialogueAsync(MoonHouseGameTurnRequest request)
        {
            return await RunGameTurnAsync(request, MoonHouseGameTurnKind.NpcDialogue);
        }

        public async Task<MoonHouseGameTurnResponse> RunPlayerActionAsync(MoonHouseGameTurnRequest request)
        {
            return await RunGameTurnAsync(request, MoonHouseGameTurnKind.PlayerAction);
        }

        public MoonHouseParsedOutput ParseAssistantOutput(string text, MoonHouseOutputParserSettings settings = null)
        {
            return MoonHouseOutputParser.Parse(text, settings ?? new MoonHouseOutputParserSettings());
        }

        public List<MoonHouseStatePatchResult> ApplyStatePatches(
            List<MoonHouseStatePatch> patches,
            bool saveAfter = true)
        {
            EnsureLoaded();
            List<MoonHouseStatePatchResult> results = MoonHouseStatePatchRuntime.Apply(SaveData, patches);
            foreach (MoonHouseStatePatchResult result in results)
            {
                EmitStatePatchResult(result, "");
            }

            if (saveAfter && results.Any(result => result.mutatedSave))
            {
                Save();
            }

            return results;
        }

        private async Task<MoonHouseGameTurnResponse> RunGameTurnAsync(
            MoonHouseGameTurnRequest request,
            MoonHouseGameTurnKind kind)
        {
            MoonHouseGameTurnRequest gameRequest = request ?? new MoonHouseGameTurnRequest();
            gameRequest.kind = kind;

            MoonHouseTurnResponse turn = await SendTurnAsync(new MoonHouseTurnRequest
            {
                playerInput = BuildGameTurnInput(gameRequest),
                saveToHistory = gameRequest.saveToHistory,
                stream = gameRequest.stream,
                generationId = gameRequest.generationId,
                timeoutSeconds = gameRequest.timeoutSeconds,
                retryCount = gameRequest.retryCount,
                retryDelayMs = gameRequest.retryDelayMs,
                historyMessageLimitOverride = gameRequest.historyMessageLimitOverride,
                presetOverride = gameRequest.presetOverride,
                gameState = gameRequest.gameState,
                runtimeVariables = gameRequest.runtimeVariables,
                temporaryInjects = gameRequest.temporaryInjects,
                outputParsing = gameRequest.outputParsing ?? new MoonHouseOutputParserSettings()
            });

            return new MoonHouseGameTurnResponse
            {
                turn = turn,
                parsedOutput = turn.parsedOutput,
                patchResults = turn.patchResults
            };
        }

        private static string BuildGameTurnInput(MoonHouseGameTurnRequest request)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("<moonhouse_game_turn kind=\"" + EscapeXml(request.kind.ToString()) + "\">");
            AppendXmlLine(builder, "player_input", request.playerInput);
            AppendXmlLine(builder, "location_id", request.locationId);
            AppendXmlLine(builder, "location_name", request.locationName);
            AppendXmlLine(builder, "scene_id", request.sceneId);
            AppendXmlLine(builder, "scene_name", request.sceneName);
            AppendXmlLine(builder, "npc_id", request.npcId);
            AppendXmlLine(builder, "npc_name", request.npcName);
            AppendXmlLine(builder, "action_id", request.actionId);
            AppendXmlLine(builder, "action_label", request.actionLabel);
            AppendXmlLine(builder, "frontend_outcome", request.frontendOutcome);
            builder.AppendLine("</moonhouse_game_turn>");
            return builder.ToString().Trim();
        }

        private static void AppendXmlLine(StringBuilder builder, string tag, string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return;
            }

            builder.Append('<').Append(tag).Append('>');
            builder.Append(EscapeXml(value.Trim()));
            builder.Append("</").Append(tag).AppendLine(">");
        }

        private static string EscapeXml(string text)
        {
            return (text ?? "")
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;");
        }

        public async Task<MoonHouseModelListResult> RefreshAvailableModelsAsync()
        {
            EnsureLoaded();

            MoonHouseGenerationPreset preset = ResolvePreset();
            try
            {
                MoonHouseModelListResult result = await apiClient.FetchModelsAsync(preset);
                preset.availableModels = result.modelIds;
                preset.lastModelRefreshAtIso = result.refreshedAtIso;
                preset.lastModelRefreshError = "";
                preset.selectedModelIndex = preset.availableModels.IndexOf(preset.model);
                EmitEvent(MoonHouseEventTypes.ModelListRefreshed, "模型列表已刷新。");
                return result;
            }
            catch (Exception error)
            {
                preset.lastModelRefreshError = error.Message;
                throw;
            }
        }

        public async Task<MoonHouseModelListResult> RefreshCognitiveModelsAsync()
        {
            EnsureLoaded();

            MoonHouseGenerationPreset preset = ResolveCognitivePreset();
            try
            {
                MoonHouseModelListResult result = await apiClient.FetchModelsAsync(preset);
                preset.availableModels = result.modelIds;
                preset.lastModelRefreshAtIso = result.refreshedAtIso;
                preset.lastModelRefreshError = "";
                preset.selectedModelIndex = preset.availableModels.IndexOf(preset.model);
                Save();
                EmitEvent(MoonHouseEventTypes.ModelListRefreshed, "智脑模型列表已刷新。");
                return result;
            }
            catch (Exception error)
            {
                preset.lastModelRefreshError = error.Message;
                throw;
            }
        }

        public bool SelectModel(string modelId)
        {
            EnsureLoaded();
            MoonHouseGenerationPreset preset = ResolvePreset();
            if (string.IsNullOrWhiteSpace(modelId))
            {
                return false;
            }

            preset.model = modelId.Trim();
            preset.selectedModelIndex = preset.availableModels != null
                ? preset.availableModels.IndexOf(preset.model)
                : -1;
            SaveChanged?.Invoke();
            EmitEvent(MoonHouseEventTypes.SaveChanged, "已选择模型: " + preset.model);
            return true;
        }

        public bool SelectCognitiveModel(string modelId)
        {
            EnsureLoaded();
            if (string.IsNullOrWhiteSpace(modelId))
            {
                return false;
            }

            MoonHouseGenerationPreset preset = ResolveCognitivePreset();
            preset.model = modelId.Trim();
            preset.selectedModelIndex = preset.availableModels != null
                ? preset.availableModels.IndexOf(preset.model)
                : -1;
            Save();
            EmitEvent(MoonHouseEventTypes.SaveChanged, "已选择智脑模型: " + preset.model);
            return true;
        }

        public bool SelectPreset(int index)
        {
            EnsureLoaded();

            List<MoonHouseGenerationPreset> savedPresets = SaveData?.presetLibrary?.generationPresets;
            if (savedPresets != null && index >= 0 && index < savedPresets.Count)
            {
                MoonHouseGenerationPreset selected = savedPresets[index];
                if (selected == null)
                {
                    return false;
                }

                string selectedId = string.IsNullOrWhiteSpace(selected.presetName)
                    ? "preset_" + index
                    : selected.presetName;
                selected.presetName = selectedId;
                SaveData.activeChatPresetId = selectedId;
                SaveData.presetLibrary.activeGenerationPresetId = selectedId;
                if (config != null)
                {
                    config.activePresetIndex = index;
                    if (config.presetLibrary != null)
                    {
                        config.presetLibrary.activeGenerationPresetId = selectedId;
                    }
                }

                Save();
                return true;
            }

            if (config == null || config.chatPresets == null || index < 0 || index >= config.chatPresets.Count)
            {
                return false;
            }

            config.activePresetIndex = index;
            SaveData.activeChatPresetId = config.chatPresets[index].presetName;
            if (config.presetLibrary != null)
            {
                config.presetLibrary.activeGenerationPresetId = SaveData.activeChatPresetId;
            }

            Save();
            return true;
        }

        public void ClearMessages()
        {
            EnsureLoaded();
            SaveData.messages.Clear();
            Save();
        }

        public void NewGameFromConfig()
        {
            EnsureLoaded();
            SaveData = CreateSaveFromConfig();
            Save();
        }

        public List<MoonHouseEvent> GetRecentEvents(int limit = 50)
        {
            int count = Mathf.Clamp(limit, 0, 500);
            return recentEvents
                .Skip(Math.Max(0, recentEvents.Count - count))
                .ToList();
        }

        public void ClearRecentEvents()
        {
            recentEvents.Clear();
        }

        public bool CancelGeneration(string generationId)
        {
            EnsureLoaded();
            if (string.IsNullOrWhiteSpace(generationId))
            {
                return false;
            }

            if (!activeGenerations.TryGetValue(generationId, out CancellationTokenSource source))
            {
                return false;
            }

            source.Cancel();
            EmitEvent(MoonHouseEventTypes.GenerationCancelled, "已请求取消生成。", generationId);
            return true;
        }

        public int CancelAllGenerations()
        {
            EnsureLoaded();
            List<string> generationIds = activeGenerations.Keys.ToList();
            foreach (string generationId in generationIds)
            {
                CancelGeneration(generationId);
            }

            return generationIds.Count;
        }

        public bool IsGenerationRunning(string generationId)
        {
            return !string.IsNullOrWhiteSpace(generationId) && activeGenerations.ContainsKey(generationId);
        }

        public List<string> GetActiveGenerationIds()
        {
            return activeGenerations.Keys.ToList();
        }

        public MoonHouseGameState GetGameState()
        {
            EnsureLoaded();
            return SaveData.gameState;
        }

        public MoonHouseEcosystemState GetEcosystemState()
        {
            EnsureLoaded();
            return MoonHouseEcosystemRuntime.Ensure(SaveData);
        }

        public void SetEcosystemState(MoonHouseEcosystemState ecosystem)
        {
            EnsureLoaded();
            SaveData.ecosystem = ecosystem ?? new MoonHouseEcosystemState();
            MoonHouseEcosystemRuntime.Ensure(SaveData);
            Save();
            EmitEvent(
                MoonHouseEventTypes.EcosystemAdvanced,
                "Ecosystem state replaced.",
                ecosystem: SaveData.ecosystem);
        }

        public MoonHouseEcosystemActor UpsertEcosystemActor(MoonHouseEcosystemActor actor)
        {
            EnsureLoaded();
            if (actor == null)
            {
                return null;
            }

            MoonHouseEcosystemState state = MoonHouseEcosystemRuntime.Ensure(SaveData);
            if (string.IsNullOrWhiteSpace(actor.actorId))
            {
                actor.actorId = MoonHouseIds.Create("actor");
            }

            if (string.IsNullOrWhiteSpace(actor.displayName))
            {
                actor.displayName = actor.actorId;
            }

            int index = state.actors.FindIndex(item =>
                item != null && string.Equals(item.actorId, actor.actorId, StringComparison.OrdinalIgnoreCase));
            if (index >= 0)
            {
                state.actors[index] = actor;
            }
            else
            {
                state.actors.Add(actor);
            }

            MoonHouseEcosystemRuntime.Ensure(SaveData);
            Save();
            EmitEvent(
                MoonHouseEventTypes.EcosystemAdvanced,
                "Ecosystem actor upserted.",
                ecosystem: SaveData.ecosystem);
            return actor;
        }

        public bool DeleteEcosystemActor(string actorId)
        {
            EnsureLoaded();
            if (string.IsNullOrWhiteSpace(actorId))
            {
                return false;
            }

            MoonHouseEcosystemState state = MoonHouseEcosystemRuntime.Ensure(SaveData);
            int removed = state.actors.RemoveAll(actor =>
                actor != null && string.Equals(actor.actorId, actorId, StringComparison.OrdinalIgnoreCase));
            if (removed <= 0)
            {
                return false;
            }

            Save();
            EmitEvent(
                MoonHouseEventTypes.EcosystemAdvanced,
                "Ecosystem actor deleted.",
                ecosystem: SaveData.ecosystem);
            return true;
        }

        public MoonHouseEcosystemEvent AddEcosystemEvent(MoonHouseEcosystemEvent ecosystemEvent)
        {
            EnsureLoaded();
            if (ecosystemEvent == null)
            {
                return null;
            }

            MoonHouseEcosystemState state = MoonHouseEcosystemRuntime.Ensure(SaveData);
            if (string.IsNullOrWhiteSpace(ecosystemEvent.eventId))
            {
                ecosystemEvent.eventId = MoonHouseIds.Create("eco_evt");
            }

            if (ecosystemEvent.day <= 0)
            {
                ecosystemEvent.day = state.currentDay;
            }

            if (ecosystemEvent.hour < 0 || ecosystemEvent.hour > 23)
            {
                ecosystemEvent.hour = state.currentHour;
            }

            if (ecosystemEvent.minute < 0 || ecosystemEvent.minute > 59)
            {
                ecosystemEvent.minute = state.currentMinute;
            }

            ecosystemEvent.actorIds = ecosystemEvent.actorIds ?? new List<string>();
            ecosystemEvent.tags = ecosystemEvent.tags ?? new List<string>();
            ecosystemEvent.createdAtIso = string.IsNullOrWhiteSpace(ecosystemEvent.createdAtIso)
                ? DateTime.UtcNow.ToString("O")
                : ecosystemEvent.createdAtIso;
            state.events.Add(ecosystemEvent);
            MoonHouseEcosystemRuntime.Ensure(SaveData);
            Save();
            EmitEvent(
                MoonHouseEventTypes.EcosystemAdvanced,
                "Ecosystem event added.",
                ecosystem: SaveData.ecosystem);
            return ecosystemEvent;
        }

        public MoonHouseEcosystemAdvanceResult AdvanceEcosystem(MoonHouseEcosystemAdvanceRequest request = null)
        {
            EnsureLoaded();
            MoonHouseEcosystemAdvanceResult result = MoonHouseEcosystemRuntime.Advance(SaveData, request);
            Save();
            EmitEvent(
                MoonHouseEventTypes.EcosystemAdvanced,
                "Ecosystem advanced.",
                ecosystem: SaveData.ecosystem,
                ecosystemDigest: result.digest,
                ecosystemAdvanceResult: result);
            return result;
        }

        public MoonHouseEcosystemDigest BuildEcosystemDigest(MoonHouseEcosystemQuery query = null)
        {
            EnsureLoaded();
            MoonHouseEcosystemDigest digest = MoonHouseEcosystemRuntime.BuildDigest(SaveData, query);
            EmitEvent(
                MoonHouseEventTypes.EcosystemDigestBuilt,
                "Ecosystem digest built.",
                ecosystem: SaveData.ecosystem,
                ecosystemDigest: digest);
            return digest;
        }

        public List<MoonHouseEcosystemActor> GetEcosystemActorsAtLocation(
            string locationId,
            int hour = -1,
            int minute = -1)
        {
            EnsureLoaded();
            return MoonHouseEcosystemRuntime.GetActorsAtLocation(SaveData, locationId, hour, minute);
        }

        public async Task<MoonHouseEcosystemCognitiveResponse> RunEcosystemCognitiveTickAsync(
            MoonHouseEcosystemCognitiveRequest request = null)
        {
            EnsureLoaded();
            MoonHouseEcosystemCognitiveRequest cognitiveRequest = request ?? new MoonHouseEcosystemCognitiveRequest();
            MoonHouseEcosystemState state = MoonHouseEcosystemRuntime.Ensure(SaveData);
            if (!state.enabled && !cognitiveRequest.force)
            {
                EmitEvent(MoonHouseEventTypes.EcosystemCognitiveSkipped, "Ecosystem cognitive tick skipped.");
                return new MoonHouseEcosystemCognitiveResponse
                {
                    ran = false,
                    reason = "ecosystem_disabled",
                    save = SaveData
                };
            }

            string generationId = ResolveGenerationId(cognitiveRequest.generationId);
            MoonHouseGenerationPreset basePreset = ResolvePresetForRequest(cognitiveRequest.presetOverride, -1);
            MoonHouseGenerateRawRequest rawRequest = MoonHouseEcosystemRuntime.BuildCognitiveRawRequest(
                SaveData,
                basePreset,
                cognitiveRequest);
            rawRequest.generationId = generationId;

            MoonHouseGenerationPreset ecosystemPreset = rawRequest.presetOverride ?? basePreset;
            PromptAssembly assembly = null;
            MoonHouseGenerationResult result = null;
            CancellationTokenSource generationCts = BeginGeneration(generationId);
            MoonHouseRequestOptions requestOptions = CreateRequestOptions(cognitiveRequest, generationId, generationCts.Token);

            try
            {
                EmitEvent(
                    MoonHouseEventTypes.EcosystemCognitiveStarted,
                    "Ecosystem cognitive tick started.",
                    generationId,
                    ecosystem: SaveData.ecosystem);
                assembly = BuildRawAssembly(rawRequest, ecosystemPreset);
                result = await apiClient.GenerateAsync(ecosystemPreset, assembly, requestOptions);
                if (result == null || string.IsNullOrWhiteSpace(result.text))
                {
                    throw new InvalidOperationException("Ecosystem cognitive tick returned empty content.");
                }

                int applied = MoonHouseEcosystemRuntime.ParseAndApplyCognitivePatch(SaveData, result.text);
                if (SaveData.ecosystem != null)
                {
                    SaveData.ecosystem.lastCognitiveRunAtIso = DateTime.UtcNow.ToString("O");
                }

                MoonHouseEcosystemDigest digest = MoonHouseEcosystemRuntime.BuildDigest(SaveData, cognitiveRequest.query);
                store.Save(saveFileName, SaveData);
                SaveChanged?.Invoke();
                EmitEvent(
                    MoonHouseEventTypes.EcosystemCognitiveCompleted,
                    "Ecosystem cognitive tick completed.",
                    generationId,
                    prompt: assembly,
                    generationResult: result,
                    ecosystem: SaveData.ecosystem,
                    ecosystemDigest: digest);

                return new MoonHouseEcosystemCognitiveResponse
                {
                    ran = true,
                    appliedPatchCount = applied,
                    digest = digest,
                    prompt = assembly,
                    generationResult = result,
                    save = SaveData
                };
            }
            catch (Exception error)
            {
                EmitEvent(
                    MoonHouseEventTypes.EcosystemCognitiveFailed,
                    error.Message,
                    generationId,
                    error: error.Message,
                    prompt: assembly,
                    generationResult: result,
                    ecosystem: SaveData.ecosystem);
                throw;
            }
            finally
            {
                EndGeneration(generationId, generationCts);
            }
        }

        public bool ShouldRunMemorySummary()
        {
            EnsureLoaded();
            return MoonHouseMemoryRuntime.ShouldRunSummary(SaveData);
        }

        public MoonHouseGrandSummary GetLatestMemorySummary()
        {
            EnsureLoaded();
            return MoonHouseMemoryRuntime.GetLatestSummary(SaveData);
        }

        public List<MoonHouseUserPersona> GetUserPersonas()
        {
            EnsureLoaded();
            SaveData.userPersonas = SaveData.userPersonas ?? new List<MoonHouseUserPersona>();
            return SaveData.userPersonas;
        }

        public MoonHouseUserPersona GetActiveUserPersona()
        {
            EnsureLoaded();
            return MoonHouseMemoryRuntime.GetActiveUserPersona(SaveData);
        }

        public MoonHouseUserPersona UpsertUserPersona(MoonHouseUserPersona persona, bool setActive = true)
        {
            EnsureLoaded();
            MoonHouseUserPersona saved = UpsertUserPersonaInternal(persona, setActive);
            Save();
            EmitEvent(
                MoonHouseEventTypes.UserPersonaChanged,
                "玩家画像已更新。",
                userPersona: saved);
            return saved;
        }

        public MoonHouseUserPersonaCaptureResponse CaptureUserPersona(MoonHouseUserPersonaCaptureRequest request)
        {
            EnsureLoaded();
            MoonHouseUserPersonaCaptureRequest captureRequest = request ?? new MoonHouseUserPersonaCaptureRequest();
            MoonHouseUserPersona persona = ResolvePersonaForCapture(captureRequest);
            if (persona == null)
            {
                return new MoonHouseUserPersonaCaptureResponse
                {
                    captured = false,
                    reason = "persona_not_found",
                    save = SaveData
                };
            }

            bool changed = ApplyPersonaCapture(persona, captureRequest);
            if (!changed)
            {
                return new MoonHouseUserPersonaCaptureResponse
                {
                    captured = false,
                    reason = "empty_capture",
                    persona = persona,
                    save = SaveData
                };
            }

            UpsertUserPersonaInternal(persona, captureRequest.setActive);
            Save();
            EmitEvent(
                MoonHouseEventTypes.UserPersonaChanged,
                "前端采集的玩家画像资料已写入。",
                userPersona: persona);

            return new MoonHouseUserPersonaCaptureResponse
            {
                captured = true,
                persona = persona,
                save = SaveData
            };
        }

        public bool SelectUserPersona(string personaId)
        {
            EnsureLoaded();
            if (string.IsNullOrWhiteSpace(personaId) || SaveData.userPersonas == null)
            {
                return false;
            }

            MoonHouseUserPersona persona = SaveData.userPersonas.FirstOrDefault(item =>
                item != null && string.Equals(item.id, personaId, StringComparison.OrdinalIgnoreCase));
            if (persona == null)
            {
                return false;
            }

            SaveData.activeUserPersonaId = persona.id;
            Save();
            EmitEvent(
                MoonHouseEventTypes.UserPersonaChanged,
                "已切换玩家画像。",
                userPersona: persona);
            return true;
        }

        public async Task<MoonHouseUserPersonaAnalyzeResponse> AnalyzeUserPersonaAsync(
            MoonHouseUserPersonaAnalyzeRequest request = null)
        {
            EnsureLoaded();

            MoonHouseUserPersonaAnalyzeRequest analyzeRequest = request ?? new MoonHouseUserPersonaAnalyzeRequest();
            MoonHouseUserPersona persona = ResolvePersonaForAnalysis(analyzeRequest);
            if (persona == null)
            {
                return new MoonHouseUserPersonaAnalyzeResponse
                {
                    ran = false,
                    reason = "persona_not_found",
                    save = SaveData
                };
            }

            if (!analyzeRequest.force &&
                !string.IsNullOrWhiteSpace(persona.analyzedProfile) &&
                string.Equals(persona.updatedAtIso, persona.lastAnalyzedAtIso, StringComparison.OrdinalIgnoreCase))
            {
                return new MoonHouseUserPersonaAnalyzeResponse
                {
                    ran = false,
                    reason = "persona_not_changed",
                    persona = persona,
                    save = SaveData
                };
            }

            string generationId = ResolveGenerationId(analyzeRequest.generationId);
            MoonHouseGenerationPreset basePreset = ResolvePresetForRequest(analyzeRequest.presetOverride, -1);
            MoonHouseGenerateRawRequest rawRequest = MoonHouseMemoryRuntime.BuildUserPersonaAnalysisRawRequest(
                SaveData,
                basePreset,
                persona,
                generationId);
            rawRequest.timeoutSeconds = analyzeRequest.timeoutSeconds;
            rawRequest.retryCount = analyzeRequest.retryCount;
            rawRequest.retryDelayMs = analyzeRequest.retryDelayMs;

            MoonHouseGenerationPreset analysisPreset = rawRequest.presetOverride ?? basePreset;
            PromptAssembly assembly = null;
            MoonHouseGenerationResult result = null;
            CancellationTokenSource generationCts = BeginGeneration(generationId);
            MoonHouseRequestOptions requestOptions = CreateRequestOptions(analyzeRequest, generationId, generationCts.Token);

            try
            {
                EmitEvent(
                    MoonHouseEventTypes.UserPersonaAnalysisStarted,
                    "智脑玩家画像整理开始。",
                    generationId,
                    userPersona: persona);
                assembly = BuildRawAssembly(rawRequest, analysisPreset);
                result = await apiClient.GenerateAsync(analysisPreset, assembly, requestOptions);
                if (result == null || string.IsNullOrWhiteSpace(result.text))
                {
                    throw new InvalidOperationException("玩家画像整理返回了空内容。");
                }

                persona.analyzedProfile = MoonHouseMemoryRuntime.ParseUserPersonaProfile(result.text);
                persona.lastAnalyzedAtIso = DateTime.UtcNow.ToString("O");
                persona.updatedAtIso = persona.lastAnalyzedAtIso;
                UpsertUserPersonaInternal(persona, analyzeRequest.setActive);
                store.Save(saveFileName, SaveData);
                SaveChanged?.Invoke();
                EmitEvent(
                    MoonHouseEventTypes.UserPersonaAnalysisCompleted,
                    "智脑玩家画像整理完成。",
                    generationId,
                    prompt: assembly,
                    generationResult: result,
                    userPersona: persona);

                return new MoonHouseUserPersonaAnalyzeResponse
                {
                    ran = true,
                    persona = persona,
                    prompt = assembly,
                    generationResult = result,
                    save = SaveData
                };
            }
            catch (Exception error)
            {
                EmitEvent(
                    MoonHouseEventTypes.UserPersonaAnalysisFailed,
                    error.Message,
                    generationId,
                    error: error.Message,
                    prompt: assembly,
                    generationResult: result,
                    userPersona: persona);
                throw;
            }
            finally
            {
                EndGeneration(generationId, generationCts);
            }
        }

        public List<MoonHouseMemoryItem> GetMemoryBank()
        {
            EnsureLoaded();
            SaveData.memoryBank = SaveData.memoryBank ?? new List<MoonHouseMemoryItem>();
            return SaveData.memoryBank;
        }

        public MoonHouseMemoryItem UpsertMemoryItem(MoonHouseMemoryItem item)
        {
            EnsureLoaded();
            MoonHouseMemoryItem saved = MoonHouseMemoryRuntime.UpsertMemoryItem(SaveData, item);
            if (saved != null)
            {
                Save();
                EmitEvent(
                    MoonHouseEventTypes.MemoryBankChanged,
                    "本地记忆条目已更新。",
                    memoryItem: saved);
            }

            return saved;
        }

        public bool DeleteMemoryItem(string memoryId)
        {
            EnsureLoaded();
            bool removed = MoonHouseMemoryRuntime.DeleteMemoryItem(SaveData, memoryId);
            if (removed)
            {
                Save();
                EmitEvent(MoonHouseEventTypes.MemoryBankChanged, "本地记忆条目已删除。");
            }

            return removed;
        }

        public MoonHouseMemorySearchResult SearchMemoryBank(MoonHouseMemorySearchRequest request = null)
        {
            EnsureLoaded();
            MoonHouseMemorySearchResult result = MoonHouseMemoryRuntime.SearchMemoryBank(SaveData, request);
            if (request != null && request.updateAccessStats)
            {
                Save();
            }

            EmitEvent(
                MoonHouseEventTypes.MemoryBankChanged,
                "本地记忆已检索。",
                memorySearchResult: result);
            return result;
        }

        public async Task<MoonHouseMemorySummaryResponse> RunMemorySummaryAsync(
            MoonHouseMemorySummaryRequest request = null)
        {
            EnsureLoaded();

            MoonHouseMemorySummaryRequest summaryRequest = request ?? new MoonHouseMemorySummaryRequest();
            if (!summaryRequest.force && !MoonHouseMemoryRuntime.ShouldRunSummary(SaveData))
            {
                EmitEvent(MoonHouseEventTypes.MemorySummarySkipped, "长期记忆总结条件未满足。");
                return new MoonHouseMemorySummaryResponse
                {
                    ran = false,
                    reason = "summary_not_due",
                    save = SaveData
                };
            }

            List<MoonHouseMessage> coveredMessages = MoonHouseMemoryRuntime.GetSummarizableMessages(SaveData);
            if (coveredMessages.Count == 0)
            {
                EmitEvent(MoonHouseEventTypes.MemorySummarySkipped, "没有可总结的聊天历史。");
                return new MoonHouseMemorySummaryResponse
                {
                    ran = false,
                    reason = "no_messages",
                    save = SaveData
                };
            }

            string generationId = ResolveGenerationId(summaryRequest.generationId);
            MoonHouseGenerationPreset basePreset = ResolvePresetForRequest(summaryRequest.presetOverride, -1);
            MoonHouseGenerateRawRequest rawRequest = MoonHouseMemoryRuntime.BuildSummaryRawRequest(
                SaveData,
                basePreset,
                generationId);
            rawRequest.timeoutSeconds = summaryRequest.timeoutSeconds;
            rawRequest.retryCount = summaryRequest.retryCount;
            rawRequest.retryDelayMs = summaryRequest.retryDelayMs;

            MoonHouseGenerationPreset summaryPreset = rawRequest.presetOverride ?? basePreset;
            PromptAssembly assembly = null;
            MoonHouseGenerationResult result = null;
            CancellationTokenSource generationCts = BeginGeneration(generationId);
            MoonHouseRequestOptions requestOptions = CreateRequestOptions(summaryRequest, generationId, generationCts.Token);

            try
            {
                EmitEvent(MoonHouseEventTypes.MemorySummaryStarted, "长期记忆总结开始。", generationId);
                assembly = BuildRawAssembly(rawRequest, summaryPreset);
                result = await apiClient.GenerateAsync(summaryPreset, assembly, requestOptions);
                if (result == null || string.IsNullOrWhiteSpace(result.text))
                {
                    throw new InvalidOperationException("长期记忆总结返回了空内容。");
                }

                MoonHouseGrandSummary summary = MoonHouseMemoryRuntime.ParseSummary(result.text, SaveData, coveredMessages);
                MoonHouseMemoryRuntime.AddSummaryToSave(SaveData, summary);
                store.Save(saveFileName, SaveData);
                SaveChanged?.Invoke();
                EmitEvent(
                    MoonHouseEventTypes.MemorySummaryCompleted,
                    "长期记忆总结完成 v" + summary.version + "。",
                    generationId,
                    prompt: assembly,
                    generationResult: result,
                    memorySummary: summary);

                return new MoonHouseMemorySummaryResponse
                {
                    ran = true,
                    summary = summary,
                    prompt = assembly,
                    generationResult = result,
                    save = SaveData
                };
            }
            catch (Exception error)
            {
                EmitEvent(
                    MoonHouseEventTypes.MemorySummaryFailed,
                    error.Message,
                    generationId,
                    error: error.Message,
                    prompt: assembly,
                    generationResult: result);
                throw;
            }
            finally
            {
                EndGeneration(generationId, generationCts);
            }
        }

        public void SetGameState(MoonHouseGameState gameState)
        {
            EnsureLoaded();
            SaveData.gameState = gameState ?? new MoonHouseGameState();
            Save();
            EmitEvent(MoonHouseEventTypes.GameStateChanged, "游戏状态已更新。", gameState: SaveData.gameState);
        }

        public void SetRuntimeVariable(MoonHouseRuntimeVariable variable)
        {
            EnsureLoaded();
            if (SetRuntimeVariableInternal(variable))
            {
                Save();
            }
        }

        public void SetRuntimeVariables(List<MoonHouseRuntimeVariable> variables)
        {
            EnsureLoaded();
            ApplyRuntimeVariables(variables);
            Save();
        }

        public MoonHouseRuntimeVariable GetRuntimeVariable(string key)
        {
            EnsureLoaded();
            return GetScopedVariable(key, MoonHouseVariableScope.Save);
        }

        public void SetScopedVariable(
            MoonHouseRuntimeVariable variable,
            MoonHouseVariableScope scope,
            string ownerId = "")
        {
            EnsureLoaded();
            if (variable == null)
            {
                return;
            }

            variable.scope = scope;
            variable.ownerId = ownerId ?? "";
            if (SetRuntimeVariableInternal(variable))
            {
                Save();
            }
        }

        public MoonHouseRuntimeVariable GetScopedVariable(
            string key,
            MoonHouseVariableScope scope,
            string ownerId = "")
        {
            EnsureLoaded();
            return SaveData.runtimeVariables.FirstOrDefault(item =>
                item != null &&
                string.Equals(item.key, key, StringComparison.OrdinalIgnoreCase) &&
                item.scope == scope &&
                string.Equals(item.ownerId ?? "", ownerId ?? "", StringComparison.OrdinalIgnoreCase));
        }

        public List<MoonHouseRuntimeVariable> GetRuntimeVariables(
            MoonHouseVariableScope scope,
            string ownerId = "")
        {
            EnsureLoaded();
            return SaveData.runtimeVariables
                .Where(item =>
                    item != null &&
                    item.scope == scope &&
                    string.Equals(item.ownerId ?? "", ownerId ?? "", StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        public int ClearRuntimeVariables(MoonHouseVariableScope scope, string ownerId = "")
        {
            EnsureLoaded();
            int removed = SaveData.runtimeVariables.RemoveAll(item =>
                item != null &&
                item.scope == scope &&
                string.Equals(item.ownerId ?? "", ownerId ?? "", StringComparison.OrdinalIgnoreCase));
            if (removed > 0)
            {
                Save();
            }

            return removed;
        }

        public MoonHouseCharacterImportResult ImportCharacterCardJson(string json, string sourceName = "character_card")
        {
            EnsureLoaded();
            MoonHouseCharacterImportResult result = MoonHouseCharacterCardImporter.ImportFromJson(json, sourceName);
            if (!string.IsNullOrWhiteSpace(result.characterName))
            {
                SaveData.characterName = result.characterName;
            }

            SaveData.contextBlocks.AddRange(result.contextBlocks);
            SaveData.worldbookEntries.AddRange(result.worldbookEntries);
            Save();
            EmitEvent(MoonHouseEventTypes.ContentImported, result.report);
            return result;
        }

        public void AddContextBlock(MoonHouseContextBlock block)
        {
            EnsureLoaded();
            if (block == null)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(block.id))
            {
                block.id = MoonHouseIds.Create("ctx");
            }

            SaveData.contextBlocks.Add(block);
            Save();
        }

        public void AddWorldbookEntry(WorldbookEntry entry)
        {
            EnsureLoaded();
            if (entry == null)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(entry.id))
            {
                entry.id = MoonHouseIds.Create("wi");
            }

            SaveData.worldbookEntries.Add(entry);
            Save();
        }

        public string ExportSaveJson(bool includeApiSecrets = false)
        {
            EnsureLoaded();
            return MoonHouseContentIO.ExportSave(SaveData, includeApiSecrets);
        }

        public MoonHouseImportReport ImportSaveJson(
            string json,
            MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.Replace)
        {
            EnsureLoaded();
            MoonHouseSave imported = MoonHouseContentIO.ReadSave(json);
            MoonHouseImportReport report = new MoonHouseImportReport
            {
                sourceType = "moon_house_save",
                mergeMode = mergeMode
            };

            if (mergeMode == MoonHouseContentMergeMode.Replace)
            {
                SaveData = imported;
                report.saveReplaced = true;
                report.message = "已替换当前月之屋存档。";
            }
            else
            {
                MoonHouseContentPackage package = MoonHouseContentIO.CreatePackageFromSave(imported, true, false);
                report = MoonHouseContentIO.ApplyPackage(SaveData, package, mergeMode);
            }

            Save();
            EmitEvent(MoonHouseEventTypes.ContentImported, report.message, importReport: report);
            return report;
        }

        public string ExportContentPackageJson(
            bool includeMessages = false,
            bool includeApiSecrets = false,
            string packageName = "")
        {
            EnsureLoaded();
            return MoonHouseContentIO.ExportContentPackage(
                SaveData,
                ResolvePresetLibrary(),
                ResolvePromptStack(),
                ResolveScanSettings(ResolvePreset()),
                string.IsNullOrWhiteSpace(packageName) ? SaveData.characterName : packageName,
                includeMessages,
                includeApiSecrets);
        }

        public MoonHouseImportReport ImportContentPackageJson(
            string json,
            MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate)
        {
            EnsureLoaded();
            MoonHouseContentPackage package = MoonHouseContentIO.ReadContentPackage(json);
            MoonHouseImportReport report = MoonHouseContentIO.ApplyPackage(SaveData, package, mergeMode);
            ApplyPackageToConfig(package, mergeMode, report);
            report.message = MoonHouseContentIO.FormatReportMessage(report);
            Save();
            EmitEvent(MoonHouseEventTypes.ContentImported, report.message, importReport: report);
            return report;
        }

        public string ExportWorldbookPackageJson(string packageName = "")
        {
            EnsureLoaded();
            return MoonHouseContentIO.ExportWorldbookPackage(
                SaveData,
                ResolveScanSettings(ResolvePreset()),
                string.IsNullOrWhiteSpace(packageName) ? SaveData.characterName + " 世界书" : packageName);
        }

        public MoonHouseImportReport ImportWorldbookPackageJson(
            string json,
            MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate)
        {
            return ImportContentPackageJson(json, mergeMode);
        }

        public string ExportPresetPackageJson(bool includeApiSecrets = false, string packageName = "")
        {
            EnsureLoaded();
            return MoonHouseContentIO.ExportPresetPackage(
                ResolvePresetLibrary(),
                ResolvePromptStack(),
                ResolveScanSettings(ResolvePreset()),
                string.IsNullOrWhiteSpace(packageName) ? "月之屋预设包" : packageName,
                includeApiSecrets);
        }

        public MoonHouseImportReport ImportPresetPackageJson(
            string json,
            MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate)
        {
            EnsureLoaded();
            MoonHouseContentPackage package = MoonHouseContentIO.ReadContentPackage(json);
            MoonHouseImportReport report = MoonHouseContentIO.ApplyPackage(SaveData, package, mergeMode);
            ApplyPackageToConfig(package, mergeMode, report);
            report.message = MoonHouseContentIO.FormatReportMessage(report);
            Save();
            EmitEvent(MoonHouseEventTypes.ContentImported, report.message, importReport: report);
            if (string.IsNullOrWhiteSpace(report.message))
            {
                report.message = "已导入月之屋预设包。";
            }

            return report;
        }

        public MoonHouseImportReport ImportSillyTavernWorldbookJson(
            string json,
            MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate)
        {
            EnsureLoaded();
            MoonHouseContentPackage package = MoonHouseSillyTavernCompat.ReadWorldbookPackage(json);
            MoonHouseImportReport report = MoonHouseContentIO.ApplyPackage(SaveData, package, mergeMode);
            ApplyPackageToConfig(package, mergeMode, report);
            report.message = MoonHouseContentIO.FormatReportMessage(report);
            Save();
            EmitEvent(MoonHouseEventTypes.ContentImported, report.message, importReport: report);
            return report;
        }

        public MoonHouseImportReport ImportSillyTavernPresetJson(
            string json,
            MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate,
            string packageName = "")
        {
            EnsureLoaded();
            MoonHouseContentPackage package = MoonHouseSillyTavernCompat.ReadPresetPackage(json, packageName);
            MoonHouseImportReport report = MoonHouseContentIO.ApplyPackage(SaveData, package, mergeMode);
            ApplyPackageToConfig(package, mergeMode, report);
            report.message = MoonHouseContentIO.FormatReportMessage(report);
            Save();
            EmitEvent(MoonHouseEventTypes.ContentImported, report.message, importReport: report);
            return report;
        }

        public MoonHouseImportReport ImportSillyTavernCharacterCardJson(
            string json,
            MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate,
            string sourceName = "sillytavern_character_card")
        {
            EnsureLoaded();
            MoonHouseContentPackage package = MoonHouseSillyTavernCompat.ReadCharacterCardPackage(json, sourceName);
            MoonHouseImportReport report = MoonHouseContentIO.ApplyPackage(SaveData, package, mergeMode);
            ApplyPackageToConfig(package, mergeMode, report);
            report.message = MoonHouseContentIO.FormatReportMessage(report);
            Save();
            EmitEvent(MoonHouseEventTypes.ContentImported, report.message, importReport: report);
            return report;
        }

        private PromptAssembly BuildPromptForTurn(
            MoonHouseTurnRequest turnRequest,
            MoonHouseGenerationPreset preset)
        {
            ITokenCounter counter = TokenCounterFactory.Create(preset.tokenizerKey, preset.model);
            PromptComposer composer = new PromptComposer(counter, ResolvePresetLibrary(), ResolvePromptStack());
            List<PromptInjection> temporaryInjects = new List<PromptInjection>(turnRequest.temporaryInjects ?? new List<PromptInjection>());
            MoonHouseOutputParserSettings outputSettings = ResolveOutputParserSettings(turnRequest.outputParsing, preset);
            if (outputSettings.enabled && outputSettings.includeContractInstruction)
            {
                temporaryInjects.Add(MoonHouseOutputContract.CreateInstruction(outputSettings.applyStatePatchesToSave));
            }

            PromptComposeOptions options = new PromptComposeOptions
            {
                temporaryInjects = temporaryInjects
            };

            LastPromptAssembly = composer.Compose(
                SaveData,
                preset,
                ResolveScanSettings(preset),
                turnRequest.playerInput,
                options);
            return LastPromptAssembly;
        }

        private PromptAssembly BuildRawAssembly(
            MoonHouseGenerateRawRequest request,
            MoonHouseGenerationPreset preset)
        {
            ITokenCounter counter = TokenCounterFactory.Create(preset.tokenizerKey, preset.model);
            MoonHouseMacroContext macroContext = new MoonHouseMacroContext
            {
                save = SaveData,
                presetLibrary = ResolvePresetLibrary(),
                playerInput = request.userInput ?? ""
            };

            List<MoonHouseMessage> messages = new List<MoonHouseMessage>();
            List<PromptInjection> injects = new List<PromptInjection>();

            foreach (PromptInjection inject in request.injects ?? new List<PromptInjection>())
            {
                if (inject == null ||
                    string.Equals(inject.position, "none", StringComparison.OrdinalIgnoreCase) ||
                    string.IsNullOrWhiteSpace(inject.content))
                {
                    continue;
                }

                string content = request.evaluateMacros
                    ? MoonHouseMacroEngine.Evaluate(inject.content, macroContext)
                    : inject.content;
                if (string.IsNullOrWhiteSpace(content))
                {
                    continue;
                }

                PromptInjection normalized = new PromptInjection
                {
                    id = string.IsNullOrWhiteSpace(inject.id) ? MoonHouseIds.Create("raw_inject") : inject.id,
                    position = string.IsNullOrWhiteSpace(inject.position) ? "in_chat" : inject.position,
                    depth = inject.depth,
                    role = NormalizeRole(inject.role),
                    content = content.Trim(),
                    shouldScan = inject.shouldScan
                };
                injects.Add(normalized);
                messages.Add(new MoonHouseMessage(normalized.role, normalized.content));
            }

            foreach (MoonHouseRawPromptPart part in request.orderedPrompts ?? new List<MoonHouseRawPromptPart>())
            {
                if (part == null || string.IsNullOrWhiteSpace(part.content))
                {
                    continue;
                }

                string content = request.evaluateMacros && part.evaluateMacros
                    ? MoonHouseMacroEngine.Evaluate(part.content, macroContext)
                    : part.content;
                if (!string.IsNullOrWhiteSpace(content))
                {
                    messages.Add(new MoonHouseMessage(NormalizeRole(part.role), content.Trim()));
                }
            }

            if (request.appendUserInput && !string.IsNullOrWhiteSpace(request.userInput))
            {
                messages.Add(new MoonHouseMessage("user", request.userInput.Trim()));
            }

            PromptBudgetReport budget = BuildRawBudget(counter, preset, messages);
            string promptText = BuildRawPromptText(messages);

            return new PromptAssembly
            {
                adapter = string.IsNullOrWhiteSpace(preset.presetAdapter)
                    ? MoonHouseConstants.DefaultPresetAdapter
                    : preset.presetAdapter,
                publicOperation = request.userInput ?? "",
                taggedUserInput = request.userInput ?? "",
                promptText = promptText,
                injectionText = string.Join("\n\n", injects.Select(item => item.content)),
                injects = injects,
                apiMessages = messages,
                worldbookScan = new WorldbookScanResult(),
                budget = budget,
                debugSummary = "月之屋 Raw 提示词装配\nmessages: " + messages.Count + "\nprompt tokens: " + budget.totalPromptTokens + "/" + budget.availablePromptTokens,
                worldbookDebug = "Raw 生成未运行世界书扫描。",
                tokenDebug = BuildRawTokenDebug(budget),
                gameStateDebug = MoonHouseMacroEngine.BuildGameStateText(SaveData)
            };
        }

        private static PromptBudgetReport BuildRawBudget(
            ITokenCounter counter,
            MoonHouseGenerationPreset preset,
            List<MoonHouseMessage> messages)
        {
            int availableTokens = Math.Max(512, preset.contextTokens - preset.reservedOutputTokens);
            int total = counter.CountRequestOverhead();
            foreach (MoonHouseMessage message in messages)
            {
                total += counter.CountMessage(message.role, message.content);
            }

            return new PromptBudgetReport
            {
                tokenizerKey = TokenCounterFactory.ResolveTokenizerKey(preset.tokenizerKey, preset.model),
                tokenizerName = TokenCounterFactory.ResolveTokenizerLabel(preset.tokenizerKey, preset.model),
                contextTokens = preset.contextTokens,
                reservedOutputTokens = preset.reservedOutputTokens,
                availablePromptTokens = availableTokens,
                injectTokens = total,
                historyTokens = 0,
                userInputTokens = 0,
                totalPromptTokens = total,
                selectedHistoryMessages = 0,
                droppedHistoryMessages = 0
            };
        }

        private static string BuildRawPromptText(List<MoonHouseMessage> messages)
        {
            StringBuilder builder = new StringBuilder();
            foreach (MoonHouseMessage message in messages)
            {
                if (builder.Length > 0)
                {
                    builder.AppendLine();
                    builder.AppendLine();
                }

                builder.AppendLine("[" + NormalizeRole(message.role) + "]");
                builder.Append(message.content);
            }

            return builder.ToString();
        }

        private static string BuildRawTokenDebug(PromptBudgetReport budget)
        {
            return "Raw 分词与上下文预算\n" +
                   "tokenizer: " + budget.tokenizerName + "\n" +
                   "上下文: " + budget.contextTokens + "，预留输出: " + budget.reservedOutputTokens + "\n" +
                   "总提示词估算: " + budget.totalPromptTokens + "/" + budget.availablePromptTokens;
        }

        private void ApplyPackageToConfig(
            MoonHouseContentPackage package,
            MoonHouseContentMergeMode mergeMode,
            MoonHouseImportReport report)
        {
            if (config == null || package == null)
            {
                return;
            }

            if (package.presetLibrary != null || package.includesPresetLibrary)
            {
                if (config.presetLibrary == null)
                {
                    config.presetLibrary = new MoonHousePresetLibrary();
                }

                MoonHouseContentIO.ApplyPresetPackageToLibrary(
                    config.presetLibrary,
                    package,
                    mergeMode,
                    report);
                SyncConfigChatPresetsFromLibrary();
            }

            if (package.promptStack != null || package.includesPromptStack)
            {
                config.promptStack = ClonePromptStack(SaveData.promptStack);
            }

            if (package.worldbookScanSettings != null || package.includesWorldbookScanSettings)
            {
                config.worldbookScanSettings = package.worldbookScanSettings ?? new WorldbookScanSettings();
            }

            if (package.includesContextBlocks || (package.contextBlocks != null && package.contextBlocks.Count > 0))
            {
                config.contextBlocks = new List<MoonHouseContextBlock>(SaveData.contextBlocks);
            }

            if (package.includesWorldbookEntries || (package.worldbookEntries != null && package.worldbookEntries.Count > 0))
            {
                config.worldbookEntries = new List<WorldbookEntry>(SaveData.worldbookEntries);
            }
        }

        private void SyncConfigChatPresetsFromLibrary()
        {
            if (config == null || config.presetLibrary?.generationPresets == null)
            {
                return;
            }

            List<MoonHouseGenerationPreset> imported = config.presetLibrary.generationPresets
                .Where(preset => preset != null)
                .Select(CloneGenerationPreset)
                .ToList();
            if (imported.Count == 0)
            {
                return;
            }

            config.chatPresets = imported;
            int activeIndex = imported.FindIndex(preset =>
                string.Equals(preset.presetName, config.presetLibrary.activeGenerationPresetId, StringComparison.OrdinalIgnoreCase));
            config.activePresetIndex = activeIndex >= 0 ? activeIndex : 0;
            config.generationPreset = CloneGenerationPreset(config.chatPresets[config.activePresetIndex]);
            SaveData.activeChatPresetId = config.chatPresets[config.activePresetIndex].presetName;
        }

        private MoonHouseUserPersona ResolvePersonaForCapture(MoonHouseUserPersonaCaptureRequest request)
        {
            SaveData.userPersonas = SaveData.userPersonas ?? new List<MoonHouseUserPersona>();
            if (!string.IsNullOrWhiteSpace(request?.personaId))
            {
                MoonHouseUserPersona existing = SaveData.userPersonas.FirstOrDefault(item =>
                    item != null && string.Equals(item.id, request.personaId, StringComparison.OrdinalIgnoreCase));
                if (existing != null)
                {
                    return CloneUserPersona(existing);
                }
            }

            MoonHouseUserPersona active = MoonHouseMemoryRuntime.GetActiveUserPersona(SaveData);
            if (active != null)
            {
                return CloneUserPersona(active);
            }

            return new MoonHouseUserPersona
            {
                id = string.IsNullOrWhiteSpace(request?.personaId) ? MoonHouseIds.Create("persona") : request.personaId.Trim(),
                name = string.IsNullOrWhiteSpace(request?.name) ? SaveData.playerName : request.name.Trim(),
                source = string.IsNullOrWhiteSpace(request?.source) ? "frontend" : request.source.Trim()
            };
        }

        private MoonHouseUserPersona ResolvePersonaForAnalysis(MoonHouseUserPersonaAnalyzeRequest request)
        {
            SaveData.userPersonas = SaveData.userPersonas ?? new List<MoonHouseUserPersona>();
            MoonHouseUserPersona persona = null;
            if (!string.IsNullOrWhiteSpace(request?.personaId))
            {
                persona = SaveData.userPersonas.FirstOrDefault(item =>
                    item != null && string.Equals(item.id, request.personaId, StringComparison.OrdinalIgnoreCase));
            }

            persona = persona ?? MoonHouseMemoryRuntime.GetActiveUserPersona(SaveData);
            if (persona == null && request != null && request.createIfMissing)
            {
                persona = new MoonHouseUserPersona
                {
                    id = string.IsNullOrWhiteSpace(request.personaId) ? MoonHouseIds.Create("persona") : request.personaId.Trim(),
                    name = string.IsNullOrWhiteSpace(request.name) ? SaveData.playerName : request.name.Trim(),
                    rawInput = request.rawInput ?? "",
                    source = "analysis_request"
                };
                return UpsertUserPersonaInternal(persona, request.setActive);
            }

            if (persona == null)
            {
                return null;
            }

            MoonHouseUserPersona clone = CloneUserPersona(persona);
            bool changed = false;
            if (!string.IsNullOrWhiteSpace(request?.name))
            {
                clone.name = request.name.Trim();
                changed = true;
            }

            if (!string.IsNullOrWhiteSpace(request?.rawInput))
            {
                clone.rawInput = request.rawInput.Trim();
                changed = true;
            }

            return changed ? UpsertUserPersonaInternal(clone, request.setActive) : clone;
        }

        private bool ApplyPersonaCapture(MoonHouseUserPersona persona, MoonHouseUserPersonaCaptureRequest request)
        {
            if (persona == null || request == null)
            {
                return false;
            }

            bool changed = false;
            persona.name = string.IsNullOrWhiteSpace(request.name) ? persona.name : request.name.Trim();
            persona.source = string.IsNullOrWhiteSpace(request.source) ? persona.source : request.source.Trim();
            persona.tags = persona.tags ?? new List<string>();
            persona.capturedFields = persona.capturedFields ?? new List<MoonHouseUserPersonaField>();

            if (request.tags != null)
            {
                foreach (string tag in request.tags.Where(tag => !string.IsNullOrWhiteSpace(tag)))
                {
                    string value = tag.Trim();
                    if (!persona.tags.Any(item => string.Equals(item, value, StringComparison.OrdinalIgnoreCase)))
                    {
                        persona.tags.Add(value);
                        changed = true;
                    }
                }
            }

            if (request.replaceRawInput)
            {
                persona.rawInput = (request.rawInput ?? "").Trim();
                changed = changed || !string.IsNullOrWhiteSpace(persona.rawInput);
            }
            else if (!string.IsNullOrWhiteSpace(request.rawInput))
            {
                string addition = request.rawInput.Trim();
                if (string.IsNullOrWhiteSpace(persona.rawInput))
                {
                    persona.rawInput = addition;
                }
                else if (!persona.rawInput.Contains(addition))
                {
                    persona.rawInput = persona.rawInput.TrimEnd() + "\n" + addition;
                }

                changed = true;
            }

            if (request.replaceFields)
            {
                persona.capturedFields = new List<MoonHouseUserPersonaField>();
                changed = true;
            }

            foreach (MoonHouseUserPersonaField field in request.fields ?? new List<MoonHouseUserPersonaField>())
            {
                if (field == null || string.IsNullOrWhiteSpace(field.value))
                {
                    continue;
                }

                MoonHouseUserPersonaField normalized = NormalizePersonaField(field, request.source);
                int index = persona.capturedFields.FindIndex(item =>
                    item != null &&
                    !string.IsNullOrWhiteSpace(item.key) &&
                    string.Equals(item.key, normalized.key, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    persona.capturedFields[index] = normalized;
                }
                else
                {
                    persona.capturedFields.Add(normalized);
                }

                changed = true;
            }

            if (string.IsNullOrWhiteSpace(persona.name))
            {
                persona.name = SaveData.playerName;
            }

            if (changed)
            {
                persona.updatedAtIso = DateTime.UtcNow.ToString("O");
            }

            return changed;
        }

        private MoonHouseUserPersona UpsertUserPersonaInternal(MoonHouseUserPersona persona, bool setActive)
        {
            SaveData.userPersonas = SaveData.userPersonas ?? new List<MoonHouseUserPersona>();
            MoonHouseUserPersona normalized = NormalizePersona(persona);
            int index = SaveData.userPersonas.FindIndex(item =>
                item != null && string.Equals(item.id, normalized.id, StringComparison.OrdinalIgnoreCase));
            if (index >= 0)
            {
                SaveData.userPersonas[index] = normalized;
            }
            else
            {
                SaveData.userPersonas.Add(normalized);
            }

            if (setActive || string.IsNullOrWhiteSpace(SaveData.activeUserPersonaId))
            {
                SaveData.activeUserPersonaId = normalized.id;
            }

            return normalized;
        }

        private static MoonHouseUserPersona NormalizePersona(MoonHouseUserPersona persona)
        {
            MoonHouseUserPersona normalized = CloneUserPersona(persona ?? new MoonHouseUserPersona());
            if (string.IsNullOrWhiteSpace(normalized.id))
            {
                normalized.id = MoonHouseIds.Create("persona");
            }

            normalized.name = normalized.name ?? "";
            normalized.rawInput = normalized.rawInput ?? "";
            normalized.analyzedProfile = normalized.analyzedProfile ?? "";
            normalized.source = string.IsNullOrWhiteSpace(normalized.source) ? "frontend" : normalized.source.Trim();
            normalized.tags = normalized.tags ?? new List<string>();
            normalized.capturedFields = normalized.capturedFields ?? new List<MoonHouseUserPersonaField>();
            string now = DateTime.UtcNow.ToString("O");
            if (string.IsNullOrWhiteSpace(normalized.createdAtIso))
            {
                normalized.createdAtIso = now;
            }

            if (string.IsNullOrWhiteSpace(normalized.updatedAtIso))
            {
                normalized.updatedAtIso = now;
            }

            for (int i = 0; i < normalized.capturedFields.Count; i += 1)
            {
                normalized.capturedFields[i] = NormalizePersonaField(normalized.capturedFields[i], normalized.source);
            }

            normalized.capturedFields.RemoveAll(field => field == null || string.IsNullOrWhiteSpace(field.value));
            return normalized;
        }

        private static MoonHouseUserPersonaField NormalizePersonaField(
            MoonHouseUserPersonaField field,
            string fallbackSource)
        {
            MoonHouseUserPersonaField normalized = field ?? new MoonHouseUserPersonaField();
            normalized.key = string.IsNullOrWhiteSpace(normalized.key)
                ? SanitizeKey(normalized.label)
                : SanitizeKey(normalized.key);
            normalized.label = normalized.label ?? normalized.key;
            normalized.value = normalized.value?.Trim() ?? "";
            normalized.source = string.IsNullOrWhiteSpace(normalized.source)
                ? (string.IsNullOrWhiteSpace(fallbackSource) ? "frontend" : fallbackSource.Trim())
                : normalized.source.Trim();
            normalized.updatedAtIso = string.IsNullOrWhiteSpace(normalized.updatedAtIso)
                ? DateTime.UtcNow.ToString("O")
                : normalized.updatedAtIso;
            return normalized;
        }

        private static string SanitizeKey(string value)
        {
            string key = new string((value ?? "field")
                .Select(ch => char.IsLetterOrDigit(ch) || ch == '_' ? ch : '_')
                .ToArray());
            key = key.Trim('_');
            return string.IsNullOrWhiteSpace(key) ? "field" : key;
        }

        private static MoonHouseUserPersona CloneUserPersona(MoonHouseUserPersona persona)
        {
            if (persona == null)
            {
                return null;
            }

            string json = JsonConvert.SerializeObject(persona);
            return JsonConvert.DeserializeObject<MoonHouseUserPersona>(json) ?? new MoonHouseUserPersona();
        }

        private bool SetRuntimeVariableInternal(MoonHouseRuntimeVariable variable)
        {
            if (variable == null || string.IsNullOrWhiteSpace(variable.key))
            {
                return false;
            }

            if (SaveData.runtimeVariables == null)
            {
                SaveData.runtimeVariables = new List<MoonHouseRuntimeVariable>();
            }

            variable.ownerId = variable.ownerId ?? "";
            int index = SaveData.runtimeVariables.FindIndex(item =>
                item != null &&
                string.Equals(item.key, variable.key, StringComparison.OrdinalIgnoreCase) &&
                item.scope == variable.scope &&
                string.Equals(item.ownerId ?? "", variable.ownerId, StringComparison.OrdinalIgnoreCase));
            if (index >= 0)
            {
                SaveData.runtimeVariables[index] = variable;
            }
            else
            {
                SaveData.runtimeVariables.Add(variable);
            }

            EmitEvent(
                MoonHouseEventTypes.RuntimeVariableChanged,
                "变量已更新: " + variable.key,
                runtimeVariable: variable);
            return true;
        }

        private void ApplyTurnRequestState(MoonHouseTurnRequest request, bool saveAfter)
        {
            if (request == null)
            {
                return;
            }

            if (request.gameState != null)
            {
                SaveData.gameState = request.gameState;
            }

            ApplyRuntimeVariables(request.runtimeVariables);

            if (saveAfter)
            {
                Save();
            }
        }

        private void ApplyRawRequestState(MoonHouseGenerateRawRequest request)
        {
            if (request == null)
            {
                return;
            }

            if (request.gameState != null)
            {
                SaveData.gameState = request.gameState;
                EmitEvent(MoonHouseEventTypes.GameStateChanged, "Raw 请求更新了游戏状态。", gameState: SaveData.gameState);
            }

            ApplyRuntimeVariables(request.runtimeVariables);
        }

        private void ApplyRuntimeVariables(IEnumerable<MoonHouseRuntimeVariable> variables)
        {
            if (variables == null)
            {
                return;
            }

            foreach (MoonHouseRuntimeVariable variable in variables)
            {
                SetRuntimeVariableInternal(variable);
            }
        }

        private void CleanupTurnScopedVariables()
        {
            if (SaveData?.runtimeVariables == null)
            {
                return;
            }

            SaveData.runtimeVariables.RemoveAll(variable =>
                variable != null && variable.scope == MoonHouseVariableScope.Turn);
        }

        private void ApplyWorldbookRuntimeEffects(PromptAssembly assembly)
        {
            if (SaveData.worldbookStates == null)
            {
                SaveData.worldbookStates = new List<WorldbookRuntimeState>();
            }

            foreach (WorldbookRuntimeState state in SaveData.worldbookStates)
            {
                if (state == null)
                {
                    continue;
                }

                state.stickyTurnsRemaining = Math.Max(0, state.stickyTurnsRemaining - 1);
                state.cooldownTurnsRemaining = Math.Max(0, state.cooldownTurnsRemaining - 1);
                if (state.delayActivationQueued)
                {
                    state.delayTurnsRemaining = Math.Max(0, state.delayTurnsRemaining - 1);
                }
            }

            if (assembly?.worldbookScan?.activatedEntries != null)
            {
                foreach (ActivatedWorldbookEntry activated in assembly.worldbookScan.activatedEntries)
                {
                    if (activated?.entry == null)
                    {
                        continue;
                    }

                    string entryId = WorldbookScanner.EntryKey(activated.entry);
                    WorldbookRuntimeState state = GetOrCreateWorldbookState(entryId);
                    state.lastActivatedTurn = SaveData.turnIndex;
                    if (activated.delayedActivation)
                    {
                        state.delayActivationQueued = false;
                        state.delayTurnsRemaining = 0;
                    }

                    bool stickyActivation = (activated.reason ?? "").StartsWith("黏性激活", StringComparison.Ordinal);
                    if (!stickyActivation)
                    {
                        state.stickyTurnsRemaining = Math.Max(state.stickyTurnsRemaining, activated.entry.stickyRounds);
                        state.cooldownTurnsRemaining = Math.Max(state.cooldownTurnsRemaining, activated.entry.cooldownRounds);
                    }
                }
            }

            if (assembly?.worldbookScan?.delayedEntries != null)
            {
                foreach (ActivatedWorldbookEntry delayed in assembly.worldbookScan.delayedEntries)
                {
                    if (delayed?.entry == null)
                    {
                        continue;
                    }

                    string entryId = WorldbookScanner.EntryKey(delayed.entry);
                    WorldbookRuntimeState state = GetOrCreateWorldbookState(entryId);
                    state.delayActivationQueued = true;
                    state.delayTurnsRemaining = Math.Max(state.delayTurnsRemaining, delayed.entry.delayRounds);
                }
            }

            SaveData.worldbookStates.RemoveAll(state =>
                state == null ||
                string.IsNullOrWhiteSpace(state.entryId) ||
                (state.stickyTurnsRemaining <= 0 &&
                 state.cooldownTurnsRemaining <= 0 &&
                 state.delayTurnsRemaining <= 0 &&
                 !state.delayActivationQueued &&
                 state.lastActivatedTurn < 0));
        }

        private WorldbookRuntimeState GetOrCreateWorldbookState(string entryId)
        {
            WorldbookRuntimeState state = SaveData.worldbookStates.FirstOrDefault(item => item != null && item.entryId == entryId);
            if (state != null)
            {
                return state;
            }

            state = new WorldbookRuntimeState { entryId = entryId };
            SaveData.worldbookStates.Add(state);
            return state;
        }

        private void EmitPromptEvents(PromptAssembly assembly, string generationId)
        {
            if (assembly == null)
            {
                return;
            }

            EmitEvent(
                MoonHouseEventTypes.PromptAssembled,
                "提示词已组装。",
                generationId,
                prompt: assembly);

            if (assembly.worldbookScan?.activatedEntries != null && assembly.worldbookScan.activatedEntries.Count > 0)
            {
                EmitEvent(
                    MoonHouseEventTypes.WorldbookActivated,
                    "世界书已激活 " + assembly.worldbookScan.activatedEntries.Count + " 条。",
                    generationId,
                    prompt: assembly,
                    worldbookTraces: assembly.worldbookScan.traces);
            }
        }

        private void EmitMessageAdded(MoonHouseMessage message, string generationId)
        {
            EmitEvent(
                MoonHouseEventTypes.MessageAdded,
                "聊天消息已添加: " + message.role,
                generationId,
                chatMessage: message);
        }

        private void EmitStreamDelta(MoonHouseStreamChunk chunk, string generationId)
        {
            if (chunk == null || (string.IsNullOrEmpty(chunk.deltaText) && !chunk.isDone))
            {
                return;
            }

            EmitEvent(
                MoonHouseEventTypes.GenerationStreamDelta,
                chunk.isDone ? "流式片段已完成。" : "流式片段已更新。",
                generationId,
                streamChunk: chunk);
        }

        private void EmitGenerationCompleted(
            MoonHouseGenerationResult result,
            PromptAssembly assembly,
            string generationId)
        {
            EmitEvent(
                MoonHouseEventTypes.GenerationCompleted,
                "月之屋生成完成。",
                generationId,
                prompt: assembly,
                generationResult: result);
        }

        private async Task TryAutoMemorySummaryAsync(MoonHouseGenerationPreset preset, string parentGenerationId)
        {
            if (!MoonHouseMemoryRuntime.ShouldRunSummary(SaveData))
            {
                return;
            }

            try
            {
                await RunMemorySummaryAsync(new MoonHouseMemorySummaryRequest
                {
                    generationId = (parentGenerationId ?? MoonHouseIds.Create("gen")) + "_memory",
                    presetOverride = preset
                });
            }
            catch (Exception error)
            {
                Debug.LogException(error);
            }
        }

        private void ApplyOutputParsing(
            MoonHouseGenerationResult result,
            MoonHouseOutputParserSettings requestSettings,
            MoonHouseGenerationPreset preset,
            bool saveToHistory,
            string generationId)
        {
            if (result == null)
            {
                return;
            }

            MoonHouseOutputParserSettings settings = ResolveOutputParserSettings(requestSettings, preset);
            if (!settings.enabled)
            {
                result.parsedOutput = new MoonHouseParsedOutput
                {
                    rawText = result.text ?? "",
                    visibleText = result.text ?? "",
                    storyText = result.text ?? ""
                };
                return;
            }

            MoonHouseParsedOutput parsed = MoonHouseOutputParser.Parse(result.text, settings);
            result.parsedOutput = parsed;
            if (settings.stripHiddenBlocksFromAssistantText)
            {
                result.text = parsed.visibleText;
            }

            EmitEvent(
                MoonHouseEventTypes.OutputParsed,
                "MoonHouse output parsed.",
                generationId,
                generationResult: result,
                parsedOutput: parsed);

            if (settings.applyStatePatchesToSave && saveToHistory && parsed.statePatches.Count > 0)
            {
                result.statePatchResults = MoonHouseStatePatchRuntime.Apply(SaveData, parsed.statePatches);
                foreach (MoonHouseStatePatchResult patchResult in result.statePatchResults)
                {
                    EmitStatePatchResult(patchResult, generationId);
                }
            }
        }

        private MoonHouseOutputParserSettings ResolveOutputParserSettings(
            MoonHouseOutputParserSettings requestSettings,
            MoonHouseGenerationPreset preset)
        {
            MoonHouseOutputParserSettings source = requestSettings ?? preset?.outputParsing ?? new MoonHouseOutputParserSettings();
            return new MoonHouseOutputParserSettings
            {
                enabled = source.enabled,
                stripHiddenBlocksFromAssistantText = source.stripHiddenBlocksFromAssistantText,
                applyStatePatchesToSave = source.applyStatePatchesToSave,
                includeContractInstruction = source.includeContractInstruction,
                parseChoices = source.parseChoices,
                parseImagePrompts = source.parseImagePrompts,
                parseMemoryHints = source.parseMemoryHints
            };
        }

        private void EmitStatePatchResult(MoonHouseStatePatchResult patchResult, string generationId)
        {
            if (patchResult == null)
            {
                return;
            }

            EmitEvent(
                MoonHouseEventTypes.StatePatchApplied,
                patchResult.message,
                generationId,
                error: patchResult.success ? "" : patchResult.message,
                statePatchResult: patchResult);
        }

        private async Task<MoonHouseGenerationResult> FinalizeAgentResultAsync(
            MoonHouseGenerationResult result,
            MoonHouseGenerationPreset preset,
            PromptAssembly assembly,
            MoonHouseRequestOptions requestOptions,
            string generationId,
            bool executeTools,
            bool allowToolLoop)
        {
            if (result == null || !MoonHouseAgentRuntime.IsAgentEnabled(preset))
            {
                return result;
            }

            bool toolOnlyNativeResult =
                preset.agentMode == MoonHouseAgentMode.NativeTools &&
                string.IsNullOrWhiteSpace(result.text) &&
                result.toolCalls != null &&
                result.toolCalls.Count > 0;

            if (allowToolLoop &&
                executeTools &&
                (preset.agentMode == MoonHouseAgentMode.ToolLoop || toolOnlyNativeResult))
            {
                MoonHouseSave rollbackSave = CloneSaveForRollback(SaveData);
                try
                {
                    return await RunToolLoopAsync(result, preset, assembly, requestOptions, generationId);
                }
                catch
                {
                    SaveData = rollbackSave;
                    throw;
                }
            }

            bool canExecuteSingleCallTools = executeTools && !string.IsNullOrWhiteSpace(result.text);
            ApplyAgentActionsAndEmitEvents(result, preset, generationId, canExecuteSingleCallTools);
            return result;
        }

        private async Task<MoonHouseGenerationResult> RunToolLoopAsync(
            MoonHouseGenerationResult firstResult,
            MoonHouseGenerationPreset preset,
            PromptAssembly assembly,
            MoonHouseRequestOptions requestOptions,
            string generationId)
        {
            int maxRounds = preset.agentMode == MoonHouseAgentMode.NativeTools
                ? 1
                : (preset.maxToolRounds > 0 ? preset.maxToolRounds : 2);
            maxRounds = Math.Max(1, Math.Min(8, maxRounds));

            MoonHouseGenerationResult current = firstResult;
            List<MoonHouseToolCall> allCalls = new List<MoonHouseToolCall>();
            List<MoonHouseToolExecutionResult> allResults = new List<MoonHouseToolExecutionResult>();

            for (int round = 1; round <= maxRounds; round += 1)
            {
                ApplyAgentActionsAndEmitEvents(current, preset, generationId, true);
                AppendToolLoopState(current, allCalls, allResults);

                bool hasToolResults = current.toolResults != null && current.toolResults.Count > 0;
                bool hasVisibleText = !string.IsNullOrWhiteSpace(current.text);
                if (!hasToolResults || hasVisibleText)
                {
                    AttachToolLoopState(current, allCalls, allResults, round - 1);
                    return current;
                }

                if (round >= maxRounds)
                {
                    PromptAssembly finalAssembly = BuildToolLoopAssembly(assembly, allResults, round, 0, preset);
                    MoonHouseGenerationPreset finalPreset = CloneGenerationPreset(preset);
                    finalPreset.enableFunctionTools = false;
                    finalPreset.agentMode = MoonHouseAgentMode.JsonActions;
                    current = await apiClient.GenerateAsync(finalPreset, finalAssembly, requestOptions);
                    ApplyAgentActionsAndEmitEvents(current, finalPreset, generationId, true);
                    AppendToolLoopState(current, allCalls, allResults);
                    if (string.IsNullOrWhiteSpace(current.text))
                    {
                        current.text = BuildToolLoopFallbackText(allResults);
                    }

                    AttachToolLoopState(current, allCalls, allResults, round);
                    return current;
                }

                int remainingRounds = maxRounds - round;
                PromptAssembly toolAssembly = BuildToolLoopAssembly(assembly, allResults, round, remainingRounds, preset);
                MoonHouseGenerationPreset toolPreset = CloneGenerationPreset(preset);
                if (remainingRounds <= 0)
                {
                    toolPreset.enableFunctionTools = false;
                    toolPreset.agentMode = MoonHouseAgentMode.JsonActions;
                }

                current = await apiClient.GenerateAsync(toolPreset, toolAssembly, requestOptions);
            }

            AttachToolLoopState(current, allCalls, allResults, maxRounds);
            return current;
        }

        private PromptAssembly BuildToolLoopAssembly(
            PromptAssembly source,
            List<MoonHouseToolExecutionResult> toolResults,
            int round,
            int remainingRounds,
            MoonHouseGenerationPreset preset)
        {
            List<MoonHouseMessage> messages = CloneMessages(source?.apiMessages);
            string resultJson = JsonConvert.SerializeObject(new
            {
                round,
                remainingToolRounds = remainingRounds,
                results = toolResults ?? new List<MoonHouseToolExecutionResult>()
            });

            StringBuilder content = new StringBuilder();
            content.AppendLine("<moonhouse_tool_results>");
            content.AppendLine(resultJson);
            content.AppendLine("</moonhouse_tool_results>");
            content.AppendLine();
            content.AppendLine("请基于这些工具结果继续。");
            if (remainingRounds > 0)
            {
                content.AppendLine("如果仍缺少必须由工具确认的信息，可以继续调用工具；否则直接写最终可见回复。");
            }
            else
            {
                content.AppendLine("工具轮数已经用完，请直接写最终可见回复，不要再请求工具。");
            }

            messages.Add(new MoonHouseMessage("user", content.ToString().Trim()));

            ITokenCounter counter = TokenCounterFactory.Create(preset.tokenizerKey, preset.model);
            PromptBudgetReport budget = BuildRawBudget(counter, preset, messages);
            return new PromptAssembly
            {
                adapter = source != null ? source.adapter : MoonHouseConstants.DefaultPresetAdapter,
                publicOperation = source != null ? source.publicOperation : "",
                taggedUserInput = source != null ? source.taggedUserInput : "",
                promptText = BuildRawPromptText(messages),
                injectionText = source != null ? source.injectionText : "",
                injects = source != null ? source.injects : new List<PromptInjection>(),
                apiMessages = messages,
                worldbookScan = source != null ? source.worldbookScan : new WorldbookScanResult(),
                budget = budget,
                debugSummary = (source != null ? source.debugSummary : "月之屋提示词装配") +
                               "\nAgent ToolLoop round: " + round +
                               "\nAgent ToolLoop remaining: " + remainingRounds,
                worldbookDebug = source != null ? source.worldbookDebug : "",
                tokenDebug = BuildRawTokenDebug(budget),
                gameStateDebug = MoonHouseMacroEngine.BuildGameStateText(SaveData)
            };
        }

        private static List<MoonHouseMessage> CloneMessages(List<MoonHouseMessage> messages)
        {
            return (messages ?? new List<MoonHouseMessage>())
                .Where(message => message != null && !string.IsNullOrWhiteSpace(message.content))
                .Select(message => new MoonHouseMessage(NormalizeRole(message.role), message.content))
                .ToList();
        }

        private static void AppendToolLoopState(
            MoonHouseGenerationResult result,
            List<MoonHouseToolCall> allCalls,
            List<MoonHouseToolExecutionResult> allResults)
        {
            if (result?.toolCalls != null)
            {
                allCalls.AddRange(result.toolCalls);
            }

            if (result?.toolResults != null)
            {
                allResults.AddRange(result.toolResults);
            }
        }

        private static void AttachToolLoopState(
            MoonHouseGenerationResult result,
            List<MoonHouseToolCall> allCalls,
            List<MoonHouseToolExecutionResult> allResults,
            int rounds)
        {
            if (result == null)
            {
                return;
            }

            result.usedToolLoop = rounds > 0;
            result.toolLoopRounds = Math.Max(0, rounds);
            result.toolCalls = allCalls ?? new List<MoonHouseToolCall>();
            result.toolResults = allResults ?? new List<MoonHouseToolExecutionResult>();
        }

        private static string BuildToolLoopFallbackText(List<MoonHouseToolExecutionResult> results)
        {
            int count = results != null ? results.Count : 0;
            return "月之屋已完成 " + count + " 个工具动作，但模型没有返回可见回复。";
        }

        private static MoonHouseSave CloneSaveForRollback(MoonHouseSave save)
        {
            if (save == null)
            {
                return new MoonHouseSave();
            }

            string json = JsonConvert.SerializeObject(save);
            return JsonConvert.DeserializeObject<MoonHouseSave>(json) ?? new MoonHouseSave();
        }

        private void ApplyAgentActionsAndEmitEvents(
            MoonHouseGenerationResult result,
            MoonHouseGenerationPreset preset,
            string generationId,
            bool executeTools)
        {
            if (result == null || !MoonHouseAgentRuntime.IsAgentEnabled(preset))
            {
                return;
            }

            if (result.toolResults == null)
            {
                result.toolResults = new List<MoonHouseToolExecutionResult>();
            }

            int oldResultCount = result.toolResults.Count;
            MoonHouseAgentRuntime.ApplySingleCallActions(SaveData, result, preset, executeTools);

            for (int i = oldResultCount; i < result.toolResults.Count; i++)
            {
                MoonHouseToolExecutionResult toolResult = result.toolResults[i];
                EmitEvent(
                    toolResult.success ? MoonHouseEventTypes.AgentToolExecuted : MoonHouseEventTypes.AgentToolFailed,
                    toolResult.success ? "Agent 工具已执行: " + toolResult.name : "Agent 工具失败: " + toolResult.name,
                    generationId,
                    error: toolResult.success ? "" : toolResult.message,
                    toolResult: toolResult);
            }
        }

        private void EmitEvent(
            string eventType,
            string message,
            string generationId = "",
            string error = "",
            MoonHouseMessage chatMessage = null,
            PromptAssembly prompt = null,
            MoonHouseStreamChunk streamChunk = null,
            MoonHouseRetryInfo retryInfo = null,
            MoonHouseGenerationResult generationResult = null,
            MoonHouseImportReport importReport = null,
            MoonHouseRuntimeVariable runtimeVariable = null,
            MoonHouseGameState gameState = null,
            MoonHouseToolExecutionResult toolResult = null,
            MoonHouseParsedOutput parsedOutput = null,
            MoonHouseStatePatchResult statePatchResult = null,
            MoonHouseGrandSummary memorySummary = null,
            MoonHouseMemoryItem memoryItem = null,
            MoonHouseMemorySearchResult memorySearchResult = null,
            MoonHouseUserPersona userPersona = null,
            MoonHouseEcosystemState ecosystem = null,
            MoonHouseEcosystemDigest ecosystemDigest = null,
            MoonHouseEcosystemAdvanceResult ecosystemAdvanceResult = null,
            List<WorldbookScanTrace> worldbookTraces = null)
        {
            MoonHouseEvent evt = new MoonHouseEvent
            {
                eventType = eventType ?? "",
                eventId = MoonHouseIds.Create("evt"),
                generationId = generationId ?? "",
                createdAtIso = DateTime.UtcNow.ToString("O"),
                message = message ?? "",
                error = error ?? "",
                chatMessage = chatMessage,
                prompt = prompt,
                streamChunk = streamChunk,
                retryInfo = retryInfo,
                generationResult = generationResult,
                importReport = importReport,
                runtimeVariable = runtimeVariable,
                gameState = gameState,
                toolResult = toolResult,
                parsedOutput = parsedOutput,
                statePatchResult = statePatchResult,
                memorySummary = memorySummary,
                memoryItem = memoryItem,
                memorySearchResult = memorySearchResult,
                userPersona = userPersona,
                ecosystem = ecosystem,
                ecosystemDigest = ecosystemDigest,
                ecosystemAdvanceResult = ecosystemAdvanceResult,
                worldbookTraces = worldbookTraces ?? new List<WorldbookScanTrace>()
            };

            recentEvents.Add(evt);
            if (recentEvents.Count > 200)
            {
                recentEvents.RemoveRange(0, recentEvents.Count - 200);
            }

            EventEmitted?.Invoke(evt);
        }

        private static string ResolveGenerationId(string generationId)
        {
            return string.IsNullOrWhiteSpace(generationId)
                ? MoonHouseIds.Create("gen")
                : generationId;
        }

        private CancellationTokenSource BeginGeneration(string generationId)
        {
            if (activeGenerations.ContainsKey(generationId))
            {
                throw new InvalidOperationException("generationId 正在运行，请先取消或换一个新的 generationId: " + generationId);
            }

            CancellationTokenSource source = new CancellationTokenSource();
            activeGenerations[generationId] = source;
            return source;
        }

        private void EndGeneration(string generationId, CancellationTokenSource source)
        {
            if (source == null)
            {
                return;
            }

            if (activeGenerations.TryGetValue(generationId, out CancellationTokenSource activeSource) &&
                activeSource == source)
            {
                activeGenerations.Remove(generationId);
            }

            source.Dispose();
        }

        private MoonHouseRequestOptions CreateRequestOptions(
            MoonHouseTurnRequest request,
            string generationId,
            CancellationToken cancellationToken)
        {
            return new MoonHouseRequestOptions
            {
                timeoutSeconds = request != null ? request.timeoutSeconds : 180,
                retryCount = request != null ? request.retryCount : 1,
                retryDelayMs = request != null ? request.retryDelayMs : 750,
                cancellationToken = cancellationToken,
                onRetry = retry => EmitRetryEvent(generationId, retry)
            };
        }

        private MoonHouseRequestOptions CreateRequestOptions(
            MoonHouseGenerateRawRequest request,
            string generationId,
            CancellationToken cancellationToken)
        {
            return new MoonHouseRequestOptions
            {
                timeoutSeconds = request != null ? request.timeoutSeconds : 180,
                retryCount = request != null ? request.retryCount : 1,
                retryDelayMs = request != null ? request.retryDelayMs : 750,
                cancellationToken = cancellationToken,
                onRetry = retry => EmitRetryEvent(generationId, retry)
            };
        }

        private MoonHouseRequestOptions CreateRequestOptions(
            MoonHouseMemorySummaryRequest request,
            string generationId,
            CancellationToken cancellationToken)
        {
            return new MoonHouseRequestOptions
            {
                timeoutSeconds = request != null ? request.timeoutSeconds : 240,
                retryCount = request != null ? request.retryCount : 1,
                retryDelayMs = request != null ? request.retryDelayMs : 750,
                cancellationToken = cancellationToken,
                onRetry = retry => EmitRetryEvent(generationId, retry)
            };
        }

        private MoonHouseRequestOptions CreateRequestOptions(
            MoonHouseUserPersonaAnalyzeRequest request,
            string generationId,
            CancellationToken cancellationToken)
        {
            return new MoonHouseRequestOptions
            {
                timeoutSeconds = request != null ? request.timeoutSeconds : 240,
                retryCount = request != null ? request.retryCount : 1,
                retryDelayMs = request != null ? request.retryDelayMs : 750,
                cancellationToken = cancellationToken,
                onRetry = retry => EmitRetryEvent(generationId, retry)
            };
        }

        private MoonHouseRequestOptions CreateRequestOptions(
            MoonHouseEcosystemCognitiveRequest request,
            string generationId,
            CancellationToken cancellationToken)
        {
            return new MoonHouseRequestOptions
            {
                timeoutSeconds = request != null ? request.timeoutSeconds : 240,
                retryCount = request != null ? request.retryCount : 1,
                retryDelayMs = request != null ? request.retryDelayMs : 750,
                cancellationToken = cancellationToken,
                onRetry = retry => EmitRetryEvent(generationId, retry)
            };
        }

        private void EmitRetryEvent(string generationId, MoonHouseRetryInfo retry)
        {
            if (retry == null)
            {
                return;
            }

            retry.generationId = generationId ?? "";
            EmitEvent(
                MoonHouseEventTypes.GenerationRetrying,
                "生成请求失败，准备重试 " + retry.attempt + "/" + retry.maxAttempts + "。",
                generationId,
                retryInfo: retry);
        }

        private void EmitGenerationException(Exception error, string generationId)
        {
            if (error is OperationCanceledException || error is TaskCanceledException)
            {
                EmitEvent(MoonHouseEventTypes.GenerationCancelled, "生成已取消。", generationId, error: error.Message);
                return;
            }

            if (error is TimeoutException)
            {
                EmitEvent(MoonHouseEventTypes.GenerationTimeout, "生成已超时。", generationId, error: error.Message);
            }

            EmitEvent(MoonHouseEventTypes.GenerationFailed, error.Message, generationId, error: error.Message);
        }

        private void EnsureLoaded()
        {
            if (store == null)
            {
                store = new MoonHouseStore();
            }

            if (apiClient == null)
            {
                apiClient = new MoonHouseApiClient();
            }

            if (SaveData == null)
            {
                Load();
            }
        }

        private MoonHouseGenerationPreset ResolvePreset()
        {
            if (SaveData?.presetLibrary?.generationPresets != null &&
                SaveData.presetLibrary.generationPresets.Count > 0)
            {
                List<MoonHouseGenerationPreset> presets = SaveData.presetLibrary.generationPresets;
                MoonHouseGenerationPreset selected = null;
                if (!string.IsNullOrWhiteSpace(SaveData.activeChatPresetId))
                {
                    selected = presets.FirstOrDefault(preset =>
                        preset != null &&
                        string.Equals(preset.presetName, SaveData.activeChatPresetId, StringComparison.OrdinalIgnoreCase));
                }

                if (selected == null && !string.IsNullOrWhiteSpace(SaveData.presetLibrary.activeGenerationPresetId))
                {
                    selected = presets.FirstOrDefault(preset =>
                        preset != null &&
                        string.Equals(preset.presetName, SaveData.presetLibrary.activeGenerationPresetId, StringComparison.OrdinalIgnoreCase));
                }

                selected = selected ?? presets.FirstOrDefault(preset => preset != null);
                if (selected != null)
                {
                    return selected;
                }
            }

            if (config == null)
            {
                return new MoonHouseGenerationPreset();
            }

            return config.GetActivePreset();
        }

        private MoonHouseGenerationPreset ResolveCognitivePreset()
        {
            EnsureLoaded();
            SaveData.memorySettings = SaveData.memorySettings ?? new MoonHouseMemorySettings();
            SaveData.memorySettings.dedicatedApiPreset = SaveData.memorySettings.dedicatedApiPreset ?? new MoonHouseGenerationPreset();
            SaveData.memorySettings.useDedicatedApi = true;
            return SaveData.memorySettings.dedicatedApiPreset;
        }

        private MoonHouseGenerationPreset ResolvePresetForRequest(
            MoonHouseGenerationPreset overridePreset,
            int historyMessageLimitOverride)
        {
            MoonHouseGenerationPreset preset = CloneGenerationPreset(overridePreset ?? ResolvePreset());
            if (historyMessageLimitOverride >= 0)
            {
                preset.historyMessageLimit = historyMessageLimitOverride;
            }

            return preset;
        }

        private MoonHousePresetLibrary ResolvePresetLibrary()
        {
            if (HasPresetLibraryContent(SaveData?.presetLibrary))
            {
                return SaveData.presetLibrary;
            }

            if (config != null && HasPresetLibraryContent(config.presetLibrary))
            {
                return config.presetLibrary;
            }

            return MoonHouseDefaults.CreateStarterPresetLibrary(ResolvePreset());
        }

        private MoonHousePromptStack ResolvePromptStack()
        {
            if (SaveData?.promptStack?.nodes != null && SaveData.promptStack.nodes.Count > 0)
            {
                return SaveData.promptStack;
            }

            if (config?.promptStack?.nodes != null && config.promptStack.nodes.Count > 0)
            {
                return config.promptStack;
            }

            return MoonHouseDefaults.CreateStarterPromptStack();
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

        private WorldbookScanSettings ResolveScanSettings(MoonHouseGenerationPreset preset)
        {
            WorldbookScanSettings source = config != null && config.worldbookScanSettings != null
                ? config.worldbookScanSettings
                : new WorldbookScanSettings();

            WorldbookScanSettings settings = new WorldbookScanSettings
            {
                maxContextTokens = preset.contextTokens,
                budgetPercent = source.budgetPercent,
                budgetCapTokens = source.budgetCapTokens,
                defaultScanDepth = source.defaultScanDepth,
                recursive = source.recursive,
                maxRecursionSteps = source.maxRecursionSteps,
                groupCompetition = source.groupCompetition,
                randomSeed = source.randomSeed,
                minActivations = source.minActivations,
                minActivationDepthMax = source.minActivationDepthMax
            };

            return settings;
        }

        private MoonHouseSave CreateSaveFromConfig()
        {
            MoonHousePresetLibrary presetLibrary = CreatePresetLibraryFromConfig(config);
            MoonHouseGenerationPreset activePreset = ResolvePresetFromLibrary(presetLibrary)
                ?? (config != null ? config.GetActivePreset() : new MoonHouseGenerationPreset());
            MoonHouseSave save = new MoonHouseSave
            {
                saveId = MoonHouseIds.Create("save"),
                createdAtIso = DateTime.UtcNow.ToString("O"),
                updatedAtIso = DateTime.UtcNow.ToString("O"),
                characterName = config != null ? config.characterName : "未命名角色",
                playerName = config != null ? config.playerName : "玩家",
                gameState = new MoonHouseGameState(),
                presetLibrary = presetLibrary,
                worldbookStates = new List<WorldbookRuntimeState>(),
                memoryBank = new List<MoonHouseMemoryItem>(),
                promptStack = config != null && config.promptStack != null && config.promptStack.nodes != null && config.promptStack.nodes.Count > 0
                    ? ClonePromptStack(config.promptStack)
                    : MoonHouseDefaults.CreateStarterPromptStack(),
                activeChatPresetId = activePreset.presetName
            };

            if (save.presetLibrary != null)
            {
                if (string.IsNullOrWhiteSpace(save.activeChatPresetId) &&
                    !string.IsNullOrWhiteSpace(save.presetLibrary.activeGenerationPresetId))
                {
                    save.activeChatPresetId = save.presetLibrary.activeGenerationPresetId;
                }
                else if (string.IsNullOrWhiteSpace(save.presetLibrary.activeGenerationPresetId) &&
                         !string.IsNullOrWhiteSpace(save.activeChatPresetId))
                {
                    save.presetLibrary.activeGenerationPresetId = save.activeChatPresetId;
                }
            }

            if (config != null)
            {
                save.contextBlocks = new System.Collections.Generic.List<MoonHouseContextBlock>(config.contextBlocks);
                save.worldbookEntries = new System.Collections.Generic.List<WorldbookEntry>(config.worldbookEntries);
            }

            return save;
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

        private static string NormalizeRole(string role)
        {
            string value = (role ?? "user").ToLowerInvariant();
            if (value == "assistant" || value == "system" || value == "user")
            {
                return value;
            }

            return "user";
        }

        private static MoonHousePresetLibrary CreatePresetLibraryFromConfig(MoonHouseConfig sourceConfig)
        {
            if (sourceConfig != null && HasPresetLibraryContent(sourceConfig.presetLibrary))
            {
                return ClonePresetLibrary(sourceConfig.presetLibrary);
            }

            MoonHouseGenerationPreset activePreset = sourceConfig != null
                ? sourceConfig.GetActivePreset()
                : new MoonHouseGenerationPreset();
            return MoonHouseDefaults.CreateStarterPresetLibrary(activePreset);
        }

        private static MoonHouseGenerationPreset ResolvePresetFromLibrary(MoonHousePresetLibrary library)
        {
            if (library?.generationPresets == null || library.generationPresets.Count == 0)
            {
                return null;
            }

            if (!string.IsNullOrWhiteSpace(library.activeGenerationPresetId))
            {
                MoonHouseGenerationPreset selected = library.generationPresets.FirstOrDefault(preset =>
                    preset != null &&
                    string.Equals(preset.presetName, library.activeGenerationPresetId, StringComparison.OrdinalIgnoreCase));
                if (selected != null)
                {
                    return selected;
                }
            }

            return library.generationPresets.FirstOrDefault(preset => preset != null);
        }

        private static MoonHousePresetLibrary ClonePresetLibrary(MoonHousePresetLibrary source)
        {
            string json = JsonConvert.SerializeObject(source ?? new MoonHousePresetLibrary());
            MoonHousePresetLibrary clone = JsonConvert.DeserializeObject<MoonHousePresetLibrary>(json);
            return clone ?? new MoonHousePresetLibrary();
        }

        private static MoonHouseGenerationPreset CloneGenerationPreset(MoonHouseGenerationPreset source)
        {
            if (source == null)
            {
                return new MoonHouseGenerationPreset();
            }

            return new MoonHouseGenerationPreset
            {
                presetName = source.presetName,
                endpointBaseUrl = source.endpointBaseUrl,
                apiKey = source.apiKey,
                apiProvider = string.IsNullOrWhiteSpace(source.apiProvider)
                    ? MoonHouseApiProviders.OpenAiCompatible
                    : source.apiProvider,
                model = source.model,
                availableModels = source.availableModels != null
                    ? new List<string>(source.availableModels)
                    : new List<string>(),
                selectedModelIndex = source.selectedModelIndex,
                lastModelRefreshAtIso = source.lastModelRefreshAtIso,
                lastModelRefreshError = source.lastModelRefreshError,
                useChatCompletions = source.useChatCompletions,
                temperature = source.temperature,
                topP = source.topP,
                maxTokens = source.maxTokens,
                contextTokens = source.contextTokens,
                reservedOutputTokens = source.reservedOutputTokens,
                historyMessageLimit = source.historyMessageLimit,
                tokenizerKey = source.tokenizerKey,
                presetAdapter = source.presetAdapter,
                promptPostProcessor = source.promptPostProcessor,
                noAssSquashRole = source.noAssSquashRole,
                noAssUserPrefix = source.noAssUserPrefix,
                noAssAssistantPrefix = source.noAssAssistantPrefix,
                noAssSystemPrefix = source.noAssSystemPrefix,
                noAssSeparator = source.noAssSeparator,
                enableFunctionTools = source.enableFunctionTools,
                agentMode = source.agentMode,
                maxToolRounds = source.maxToolRounds,
                outputParsing = source.outputParsing != null
                    ? JsonConvert.DeserializeObject<MoonHouseOutputParserSettings>(
                        JsonConvert.SerializeObject(source.outputParsing))
                    : new MoonHouseOutputParserSettings(),
                stop = source.stop != null ? new List<string>(source.stop) : new List<string>()
            };
        }
    }
}
