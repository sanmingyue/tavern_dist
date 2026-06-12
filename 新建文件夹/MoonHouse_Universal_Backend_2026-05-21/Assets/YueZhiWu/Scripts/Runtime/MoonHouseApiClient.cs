using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.Networking;

namespace Mingyue.YueZhiWu
{
    public sealed class MoonHouseApiClient
    {
        [Serializable]
        private class OpenAiModelListResponse
        {
            public List<OpenAiModelItem> data = new List<OpenAiModelItem>();
            public List<OpenAiModelItem> models = new List<OpenAiModelItem>();
        }

        [Serializable]
        private class OpenAiModelItem
        {
            public string id = "";
            public string name = "";
            public string displayName = "";
        }

        private sealed class MoonHouseApiRequestException : Exception
        {
            public readonly long responseCode;

            public MoonHouseApiRequestException(long responseCode, string message)
                : base(message)
            {
                this.responseCode = responseCode;
            }
        }

        private sealed class StreamingDownloadHandler : DownloadHandlerScript
        {
            private readonly Decoder decoder = Encoding.UTF8.GetDecoder();
            private readonly StringBuilder pendingText = new StringBuilder();
            private readonly StringBuilder rawText = new StringBuilder();
            private readonly StringBuilder accumulatedText = new StringBuilder();
            private readonly string generationId;
            private readonly Action<MoonHouseStreamChunk> onChunk;
            private readonly DateTime startedAtUtc;
            private DateTime? firstChunkAtUtc;

            public string RawText => rawText.ToString();
            public string AccumulatedText => accumulatedText.ToString();
            public long FirstTokenLatencyMs => firstChunkAtUtc.HasValue
                ? Math.Max(0, (long)(firstChunkAtUtc.Value - startedAtUtc).TotalMilliseconds)
                : -1;

            public StreamingDownloadHandler(
                string generationId,
                Action<MoonHouseStreamChunk> onChunk,
                DateTime startedAtUtc)
                : base(new byte[8192])
            {
                this.generationId = generationId ?? "";
                this.onChunk = onChunk;
                this.startedAtUtc = startedAtUtc;
            }

            protected override bool ReceiveData(byte[] data, int dataLength)
            {
                if (data == null || dataLength <= 0)
                {
                    return true;
                }

                int charCount = decoder.GetCharCount(data, 0, dataLength, false);
                char[] chars = new char[charCount];
                decoder.GetChars(data, 0, dataLength, chars, 0, false);
                string text = new string(chars);
                rawText.Append(text);
                pendingText.Append(text);
                ProcessPendingLines();
                return true;
            }

            protected override void CompleteContent()
            {
                if (pendingText.Length > 0)
                {
                    ProcessLine(pendingText.ToString());
                    pendingText.Length = 0;
                }
            }

            private void ProcessPendingLines()
            {
                while (true)
                {
                    string current = pendingText.ToString();
                    int newlineIndex = current.IndexOf('\n');
                    if (newlineIndex < 0)
                    {
                        return;
                    }

                    string line = current.Substring(0, newlineIndex).TrimEnd('\r');
                    pendingText.Remove(0, newlineIndex + 1);
                    ProcessLine(line);
                }
            }

            private void ProcessLine(string line)
            {
                if (string.IsNullOrWhiteSpace(line))
                {
                    return;
                }

                string payload = line.Trim();
                if (payload.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
                {
                    payload = payload.Substring(5).TrimStart();
                }
                else if (!payload.StartsWith("{", StringComparison.Ordinal))
                {
                    return;
                }

                if (payload == "[DONE]")
                {
                    return;
                }

                string delta = ExtractStreamDelta(payload);
                if (string.IsNullOrEmpty(delta))
                {
                    return;
                }

                accumulatedText.Append(delta);
                DateTime now = DateTime.UtcNow;
                if (!firstChunkAtUtc.HasValue)
                {
                    firstChunkAtUtc = now;
                }

                EmitChunk(new MoonHouseStreamChunk
                {
                    generationId = generationId,
                    deltaText = delta,
                    accumulatedText = accumulatedText.ToString(),
                    rawJson = payload,
                    createdAtIso = now.ToString("O"),
                    elapsedMilliseconds = Math.Max(0, (long)(now - startedAtUtc).TotalMilliseconds),
                    firstTokenLatencyMs = FirstTokenLatencyMs,
                    isDone = false
                });
            }

            private void EmitChunk(MoonHouseStreamChunk chunk)
            {
                try
                {
                    onChunk?.Invoke(chunk);
                }
                catch (Exception error)
                {
                    Debug.LogException(error);
                }
            }
        }

        public async Task<MoonHouseGenerationResult> GenerateAsync(
            MoonHouseGenerationPreset preset,
            PromptAssembly assembly)
        {
            if (preset == null)
            {
                throw new ArgumentNullException("preset");
            }

            if (assembly == null)
            {
                throw new ArgumentNullException("assembly");
            }

            string endpoint = BuildGenerationEndpoint(preset, false);
            string payload = BuildGenerationPayload(preset, assembly, false);
            DateTime startedAtUtc = DateTime.UtcNow;

            using (UnityWebRequest request = new UnityWebRequest(endpoint, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(payload);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Content-Type", "application/json");

                ApplyAuthenticationHeaders(request, preset);

                await SendAsync(request);

                string responseText = request.downloadHandler.text;
                if (request.result != UnityWebRequest.Result.Success)
                {
                    throw new InvalidOperationException(
                        "月之屋 API 请求失败: " + request.responseCode + "\n" + responseText);
                }

                MoonHouseGenerationResult result = ParseGenerationResult(responseText, preset, assembly);
                ApplyGenerationMetrics(result, preset, startedAtUtc, -1);
                return result;
            }
        }

        public async Task<MoonHouseGenerationResult> GenerateStreamAsync(
            MoonHouseGenerationPreset preset,
            PromptAssembly assembly,
            Action<MoonHouseStreamChunk> onChunk = null,
            string generationId = "")
        {
            if (preset == null)
            {
                throw new ArgumentNullException("preset");
            }

            if (assembly == null)
            {
                throw new ArgumentNullException("assembly");
            }

            string endpoint = BuildGenerationEndpoint(preset, true);
            string payload = BuildGenerationPayload(preset, assembly, true);
            DateTime startedAtUtc = DateTime.UtcNow;

            StreamingDownloadHandler streamHandler = new StreamingDownloadHandler(generationId, onChunk, startedAtUtc);
            using (UnityWebRequest request = new UnityWebRequest(endpoint, "POST"))
            {
                byte[] bodyRaw = Encoding.UTF8.GetBytes(payload);
                request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                request.downloadHandler = streamHandler;
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Accept", "text/event-stream");

                ApplyAuthenticationHeaders(request, preset);

                await SendAsync(request);

                string responseText = streamHandler.RawText;
                if (request.result != UnityWebRequest.Result.Success)
                {
                    throw new InvalidOperationException(
                        "月之屋流式 API 请求失败: " + request.responseCode + "\n" + responseText);
                }

                string text = streamHandler.AccumulatedText.Trim();
                List<MoonHouseToolCall> toolCalls = new List<MoonHouseToolCall>();
                if (string.IsNullOrWhiteSpace(text))
                {
                    MoonHouseGenerationResult bufferedResult = ParseGenerationResult(responseText, preset, assembly);
                    text = bufferedResult.text;
                    toolCalls = bufferedResult.toolCalls ?? new List<MoonHouseToolCall>();
                }

                MoonHouseGenerationResult result = new MoonHouseGenerationResult
                {
                    text = text,
                    rawJson = responseText,
                    model = preset.model,
                    createdAtIso = DateTime.UtcNow.ToString("O"),
                    promptDebugSummary = assembly.debugSummary,
                    toolCalls = toolCalls
                };
                ApplyGenerationMetrics(result, preset, startedAtUtc, streamHandler.FirstTokenLatencyMs);

                try
                {
                    onChunk?.Invoke(new MoonHouseStreamChunk
                    {
                        generationId = generationId ?? "",
                        deltaText = "",
                        accumulatedText = result.text,
                        rawJson = "",
                        createdAtIso = result.createdAtIso,
                        elapsedMilliseconds = result.elapsedMilliseconds,
                        firstTokenLatencyMs = result.firstTokenLatencyMs,
                        isDone = true
                    });
                }
                catch (Exception error)
                {
                    Debug.LogException(error);
                }

                return result;
            }
        }

        public async Task<MoonHouseGenerationResult> GenerateAsync(
            MoonHouseGenerationPreset preset,
            PromptAssembly assembly,
            MoonHouseRequestOptions options)
        {
            if (preset == null)
            {
                throw new ArgumentNullException("preset");
            }

            if (assembly == null)
            {
                throw new ArgumentNullException("assembly");
            }

            string endpoint = BuildGenerationEndpoint(preset, false);
            string payload = BuildGenerationPayload(preset, assembly, false);

            return await ExecuteWithRetryAsync(options, async attempt =>
            {
                DateTime startedAtUtc = DateTime.UtcNow;
                using (UnityWebRequest request = new UnityWebRequest(endpoint, "POST"))
                {
                    byte[] bodyRaw = Encoding.UTF8.GetBytes(payload);
                    request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                    request.downloadHandler = new DownloadHandlerBuffer();
                    request.SetRequestHeader("Content-Type", "application/json");
                    ApplyRequestTimeout(request, options);

                    ApplyAuthenticationHeaders(request, preset);

                    await SendAsync(request, options);

                    string responseText = request.downloadHandler.text;
                    if (request.result != UnityWebRequest.Result.Success)
                    {
                        throw new MoonHouseApiRequestException(
                            request.responseCode,
                            "月之屋 API 请求失败: " + request.responseCode + "\n" + responseText);
                    }

                    MoonHouseGenerationResult result = ParseGenerationResult(responseText, preset, assembly);
                    ApplyGenerationMetrics(result, preset, startedAtUtc, -1);
                    return result;
                }
            });
        }

        public async Task<MoonHouseGenerationResult> GenerateStreamAsync(
            MoonHouseGenerationPreset preset,
            PromptAssembly assembly,
            Action<MoonHouseStreamChunk> onChunk,
            string generationId,
            MoonHouseRequestOptions options)
        {
            if (preset == null)
            {
                throw new ArgumentNullException("preset");
            }

            if (assembly == null)
            {
                throw new ArgumentNullException("assembly");
            }

            string endpoint = BuildGenerationEndpoint(preset, true);
            string payload = BuildGenerationPayload(preset, assembly, true);

            return await ExecuteWithRetryAsync(options, async attempt =>
            {
                DateTime startedAtUtc = DateTime.UtcNow;
                StreamingDownloadHandler streamHandler = new StreamingDownloadHandler(generationId, onChunk, startedAtUtc);
                using (UnityWebRequest request = new UnityWebRequest(endpoint, "POST"))
                {
                    byte[] bodyRaw = Encoding.UTF8.GetBytes(payload);
                    request.uploadHandler = new UploadHandlerRaw(bodyRaw);
                    request.downloadHandler = streamHandler;
                    request.SetRequestHeader("Content-Type", "application/json");
                    request.SetRequestHeader("Accept", "text/event-stream");
                    ApplyRequestTimeout(request, options);

                    ApplyAuthenticationHeaders(request, preset);

                    await SendAsync(request, options);

                    string responseText = streamHandler.RawText;
                    if (request.result != UnityWebRequest.Result.Success)
                    {
                        throw new MoonHouseApiRequestException(
                            request.responseCode,
                            "月之屋流式 API 请求失败: " + request.responseCode + "\n" + responseText);
                    }

                    string text = streamHandler.AccumulatedText.Trim();
                    List<MoonHouseToolCall> toolCalls = new List<MoonHouseToolCall>();
                    if (string.IsNullOrWhiteSpace(text))
                    {
                        MoonHouseGenerationResult bufferedResult = ParseGenerationResult(responseText, preset, assembly);
                        text = bufferedResult.text;
                        toolCalls = bufferedResult.toolCalls ?? new List<MoonHouseToolCall>();
                    }

                    MoonHouseGenerationResult result = new MoonHouseGenerationResult
                    {
                        text = text,
                        rawJson = responseText,
                        model = preset.model,
                        createdAtIso = DateTime.UtcNow.ToString("O"),
                        promptDebugSummary = assembly.debugSummary,
                        toolCalls = toolCalls
                    };
                    ApplyGenerationMetrics(result, preset, startedAtUtc, streamHandler.FirstTokenLatencyMs);

                    try
                    {
                        onChunk?.Invoke(new MoonHouseStreamChunk
                        {
                            generationId = generationId ?? "",
                            deltaText = "",
                            accumulatedText = result.text,
                            rawJson = "",
                            createdAtIso = result.createdAtIso,
                            elapsedMilliseconds = result.elapsedMilliseconds,
                            firstTokenLatencyMs = result.firstTokenLatencyMs,
                            isDone = true
                        });
                    }
                    catch (Exception error)
                    {
                        Debug.LogException(error);
                    }

                    return result;
                }
            });
        }

        public async Task<MoonHouseModelListResult> FetchModelsAsync(MoonHouseGenerationPreset preset)
        {
            if (preset == null)
            {
                throw new ArgumentNullException("preset");
            }

            string endpoint = BuildModelsEndpoint(preset);
            using (UnityWebRequest request = UnityWebRequest.Get(endpoint))
            {
                request.downloadHandler = new DownloadHandlerBuffer();
                request.SetRequestHeader("Accept", "application/json");

                ApplyAuthenticationHeaders(request, preset);

                await SendAsync(request);

                string responseText = request.downloadHandler.text;
                if (request.result != UnityWebRequest.Result.Success)
                {
                    throw new InvalidOperationException(
                        "月之屋获取模型列表失败: " + request.responseCode + "\n" + responseText);
                }

                return ParseModelListResult(responseText, NormalizeApiProvider(preset.apiProvider));
            }
        }

        private static string BuildGenerationEndpoint(MoonHouseGenerationPreset preset, bool stream)
        {
            string provider = NormalizeApiProvider(preset.apiProvider);
            if (provider == MoonHouseApiProviders.Gemini)
            {
                return BuildGeminiEndpoint(preset, stream);
            }

            if (provider == MoonHouseApiProviders.Claude)
            {
                return BuildClaudeEndpoint(preset.endpointBaseUrl);
            }

            return BuildOpenAiEndpoint(preset);
        }

        private static string BuildOpenAiEndpoint(MoonHouseGenerationPreset preset)
        {
            string baseUrl = (preset.endpointBaseUrl ?? string.Empty).Trim().TrimEnd('/');
            if (string.IsNullOrEmpty(baseUrl))
            {
                throw new InvalidOperationException("endpointBaseUrl 不能为空");
            }

            if (baseUrl.EndsWith("/chat/completions", StringComparison.OrdinalIgnoreCase) ||
                baseUrl.EndsWith("/completions", StringComparison.OrdinalIgnoreCase))
            {
                return baseUrl;
            }

            return baseUrl + (preset.useChatCompletions ? "/chat/completions" : "/completions");
        }

        private static string BuildGeminiEndpoint(MoonHouseGenerationPreset preset, bool stream)
        {
            string baseUrl = GetGeminiBaseUrl(preset.endpointBaseUrl);
            string modelPath = (preset.model ?? string.Empty).Trim().Trim('/');
            if (string.IsNullOrWhiteSpace(modelPath))
            {
                throw new InvalidOperationException("Gemini model 不能为空");
            }

            if (!modelPath.StartsWith("models/", StringComparison.OrdinalIgnoreCase))
            {
                modelPath = "models/" + modelPath;
            }

            string action = stream ? "streamGenerateContent" : "generateContent";
            string endpoint = baseUrl + "/" + modelPath + ":" + action;
            if (stream)
            {
                endpoint = AddQueryParameter(endpoint, "alt", "sse");
            }

            if (!string.IsNullOrWhiteSpace(preset.apiKey))
            {
                endpoint = AddQueryParameter(endpoint, "key", preset.apiKey.Trim());
            }

            return endpoint;
        }

        private static string BuildClaudeEndpoint(string endpointBaseUrl)
        {
            string baseUrl = GetClaudeBaseUrl(endpointBaseUrl);
            if (baseUrl.EndsWith("/messages", StringComparison.OrdinalIgnoreCase))
            {
                return baseUrl;
            }

            return baseUrl + "/messages";
        }

        private static string BuildModelsEndpoint(MoonHouseGenerationPreset preset)
        {
            string provider = NormalizeApiProvider(preset.apiProvider);
            if (provider == MoonHouseApiProviders.Gemini)
            {
                string endpoint = GetGeminiBaseUrl(preset.endpointBaseUrl) + "/models";
                if (!string.IsNullOrWhiteSpace(preset.apiKey))
                {
                    endpoint = AddQueryParameter(endpoint, "key", preset.apiKey.Trim());
                }

                return endpoint;
            }

            if (provider == MoonHouseApiProviders.Claude)
            {
                return GetClaudeBaseUrl(preset.endpointBaseUrl) + "/models";
            }

            return BuildOpenAiModelsEndpoint(preset.endpointBaseUrl);
        }

        private static string BuildOpenAiModelsEndpoint(string endpointBaseUrl)
        {
            string baseUrl = (endpointBaseUrl ?? string.Empty).Trim().TrimEnd('/');
            if (string.IsNullOrEmpty(baseUrl))
            {
                throw new InvalidOperationException("endpointBaseUrl 不能为空");
            }

            const string chatCompletions = "/chat/completions";
            const string completions = "/completions";

            if (baseUrl.EndsWith(chatCompletions, StringComparison.OrdinalIgnoreCase))
            {
                baseUrl = baseUrl.Substring(0, baseUrl.Length - chatCompletions.Length);
            }
            else if (baseUrl.EndsWith(completions, StringComparison.OrdinalIgnoreCase))
            {
                baseUrl = baseUrl.Substring(0, baseUrl.Length - completions.Length);
            }

            if (baseUrl.EndsWith("/models", StringComparison.OrdinalIgnoreCase))
            {
                return baseUrl;
            }

            return baseUrl + "/models";
        }

        private static string GetGeminiBaseUrl(string endpointBaseUrl)
        {
            string baseUrl = (endpointBaseUrl ?? string.Empty).Trim().TrimEnd('/');
            if (string.IsNullOrEmpty(baseUrl))
            {
                return "https://generativelanguage.googleapis.com/v1beta";
            }

            int queryIndex = baseUrl.IndexOf("?", StringComparison.Ordinal);
            if (queryIndex >= 0)
            {
                baseUrl = baseUrl.Substring(0, queryIndex);
            }

            int generateIndex = baseUrl.IndexOf(":generateContent", StringComparison.OrdinalIgnoreCase);
            if (generateIndex >= 0)
            {
                baseUrl = baseUrl.Substring(0, generateIndex);
            }

            int streamIndex = baseUrl.IndexOf(":streamGenerateContent", StringComparison.OrdinalIgnoreCase);
            if (streamIndex >= 0)
            {
                baseUrl = baseUrl.Substring(0, streamIndex);
            }

            int modelIndex = baseUrl.IndexOf("/models/", StringComparison.OrdinalIgnoreCase);
            if (modelIndex >= 0)
            {
                baseUrl = baseUrl.Substring(0, modelIndex);
            }
            else if (baseUrl.EndsWith("/models", StringComparison.OrdinalIgnoreCase))
            {
                baseUrl = baseUrl.Substring(0, baseUrl.Length - "/models".Length);
            }

            return baseUrl.TrimEnd('/');
        }

        private static string GetClaudeBaseUrl(string endpointBaseUrl)
        {
            string baseUrl = (endpointBaseUrl ?? string.Empty).Trim().TrimEnd('/');
            if (string.IsNullOrEmpty(baseUrl))
            {
                return "https://api.anthropic.com/v1";
            }

            int queryIndex = baseUrl.IndexOf("?", StringComparison.Ordinal);
            if (queryIndex >= 0)
            {
                baseUrl = baseUrl.Substring(0, queryIndex);
            }

            if (baseUrl.EndsWith("/messages", StringComparison.OrdinalIgnoreCase))
            {
                baseUrl = baseUrl.Substring(0, baseUrl.Length - "/messages".Length);
            }

            return baseUrl.TrimEnd('/');
        }

        private static string AddQueryParameter(string url, string key, string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return url;
            }

            string separator = url.IndexOf("?", StringComparison.Ordinal) >= 0 ? "&" : "?";
            return url + separator + Uri.EscapeDataString(key) + "=" + Uri.EscapeDataString(value);
        }

        private static string BuildGenerationPayload(MoonHouseGenerationPreset preset, PromptAssembly assembly, bool stream)
        {
            string provider = NormalizeApiProvider(preset.apiProvider);
            if (provider == MoonHouseApiProviders.Gemini)
            {
                return BuildGeminiPayload(preset, assembly, stream);
            }

            if (provider == MoonHouseApiProviders.Claude)
            {
                return BuildClaudePayload(preset, assembly, stream);
            }

            return preset.useChatCompletions
                ? BuildChatPayload(preset, assembly, stream)
                : BuildCompletionPayload(preset, assembly, stream);
        }

        private static string BuildGeminiPayload(MoonHouseGenerationPreset preset, PromptAssembly assembly, bool stream)
        {
            StringBuilder systemBuilder = new StringBuilder();
            List<Dictionary<string, object>> contents = new List<Dictionary<string, object>>();

            foreach (MoonHouseMessage message in assembly.apiMessages)
            {
                string role = NormalizeRole(message.role);
                string content = message.content ?? string.Empty;
                if (string.IsNullOrWhiteSpace(content))
                {
                    continue;
                }

                if (role == "system")
                {
                    AppendBlock(systemBuilder, content);
                    continue;
                }

                contents.Add(BuildGeminiContent(role == "assistant" ? "model" : "user", content));
            }

            if (contents.Count == 0 && !string.IsNullOrWhiteSpace(assembly.promptText))
            {
                contents.Add(BuildGeminiContent("user", assembly.promptText));
            }

            Dictionary<string, object> generationConfig = new Dictionary<string, object>
            {
                { "temperature", preset.temperature },
                { "topP", preset.topP },
                { "maxOutputTokens", preset.maxTokens }
            };

            if (preset.stop != null && preset.stop.Count > 0)
            {
                generationConfig["stopSequences"] = preset.stop;
            }

            Dictionary<string, object> payload = new Dictionary<string, object>
            {
                { "contents", contents },
                { "generationConfig", generationConfig }
            };

            List<object> tools = MoonHouseAgentRuntime.BuildGeminiTools(preset, stream);
            if (tools != null && tools.Count > 0)
            {
                payload["tools"] = tools;
            }

            if (systemBuilder.Length > 0)
            {
                payload["systemInstruction"] = new Dictionary<string, object>
                {
                    {
                        "parts",
                        new List<Dictionary<string, string>>
                        {
                            new Dictionary<string, string>
                            {
                                { "text", systemBuilder.ToString() }
                            }
                        }
                    }
                };
            }

            return JsonConvert.SerializeObject(payload);
        }

        private static Dictionary<string, object> BuildGeminiContent(string role, string text)
        {
            return new Dictionary<string, object>
            {
                { "role", role },
                {
                    "parts",
                    new List<Dictionary<string, string>>
                    {
                        new Dictionary<string, string>
                        {
                            { "text", text }
                        }
                    }
                }
            };
        }

        private static string BuildClaudePayload(MoonHouseGenerationPreset preset, PromptAssembly assembly, bool stream)
        {
            StringBuilder systemBuilder = new StringBuilder();
            List<Dictionary<string, string>> messages = new List<Dictionary<string, string>>();

            foreach (MoonHouseMessage message in assembly.apiMessages)
            {
                string role = NormalizeRole(message.role);
                string content = message.content ?? string.Empty;
                if (string.IsNullOrWhiteSpace(content))
                {
                    continue;
                }

                if (role == "system")
                {
                    AppendBlock(systemBuilder, content);
                    continue;
                }

                messages.Add(new Dictionary<string, string>
                {
                    { "role", role == "assistant" ? "assistant" : "user" },
                    { "content", content }
                });
            }

            if (messages.Count == 0 && !string.IsNullOrWhiteSpace(assembly.promptText))
            {
                messages.Add(new Dictionary<string, string>
                {
                    { "role", "user" },
                    { "content", assembly.promptText }
                });
            }

            Dictionary<string, object> payload = new Dictionary<string, object>
            {
                { "model", preset.model },
                { "max_tokens", Math.Max(1, preset.maxTokens) },
                { "messages", messages },
                { "temperature", preset.temperature },
                { "top_p", preset.topP },
                { "stream", stream }
            };

            if (systemBuilder.Length > 0)
            {
                payload["system"] = systemBuilder.ToString();
            }

            if (preset.stop != null && preset.stop.Count > 0)
            {
                payload["stop_sequences"] = preset.stop;
            }

            List<object> tools = MoonHouseAgentRuntime.BuildClaudeTools(preset, stream);
            if (tools != null && tools.Count > 0)
            {
                payload["tools"] = tools;
            }

            return JsonConvert.SerializeObject(payload);
        }

        private static void AppendBlock(StringBuilder builder, string text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return;
            }

            if (builder.Length > 0)
            {
                builder.AppendLine();
                builder.AppendLine();
            }

            builder.Append(text.Trim());
        }

        private static void ApplyAuthenticationHeaders(UnityWebRequest request, MoonHouseGenerationPreset preset)
        {
            string apiKey = preset.apiKey ?? string.Empty;
            string provider = NormalizeApiProvider(preset.apiProvider);
            if (provider == MoonHouseApiProviders.Claude)
            {
                request.SetRequestHeader("anthropic-version", "2023-06-01");
                if (!string.IsNullOrWhiteSpace(apiKey))
                {
                    request.SetRequestHeader("x-api-key", apiKey.Trim());
                }

                return;
            }

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                return;
            }

            apiKey = apiKey.Trim();
            if (provider == MoonHouseApiProviders.Gemini)
            {
                request.SetRequestHeader("x-goog-api-key", apiKey);
                return;
            }

            request.SetRequestHeader("Authorization", "Bearer " + apiKey);
        }

        private static string BuildChatPayload(MoonHouseGenerationPreset preset, PromptAssembly assembly, bool stream)
        {
            List<Dictionary<string, string>> messages = new List<Dictionary<string, string>>();
            foreach (MoonHouseMessage message in assembly.apiMessages)
            {
                messages.Add(new Dictionary<string, string>
                {
                    { "role", NormalizeRole(message.role) },
                    { "content", message.content ?? string.Empty }
                });
            }

            Dictionary<string, object> payload = new Dictionary<string, object>
            {
                { "model", preset.model },
                { "messages", messages },
                { "temperature", preset.temperature },
                { "top_p", preset.topP },
                { "max_tokens", preset.maxTokens },
                { "stream", stream }
            };

            if (preset.stop != null && preset.stop.Count > 0)
            {
                payload["stop"] = preset.stop;
            }

            List<object> tools = MoonHouseAgentRuntime.BuildOpenAiTools(preset, stream);
            if (tools != null && tools.Count > 0)
            {
                payload["tools"] = tools;
                payload["tool_choice"] = "auto";
            }

            return JsonConvert.SerializeObject(payload);
        }

        private static string BuildCompletionPayload(MoonHouseGenerationPreset preset, PromptAssembly assembly, bool stream)
        {
            Dictionary<string, object> payload = new Dictionary<string, object>
            {
                { "model", preset.model },
                { "prompt", assembly.promptText },
                { "temperature", preset.temperature },
                { "top_p", preset.topP },
                { "max_tokens", preset.maxTokens },
                { "stream", stream }
            };

            if (preset.stop != null && preset.stop.Count > 0)
            {
                payload["stop"] = preset.stop;
            }

            return JsonConvert.SerializeObject(payload);
        }

        private static void ApplyGenerationMetrics(
            MoonHouseGenerationResult result,
            MoonHouseGenerationPreset preset,
            DateTime startedAtUtc,
            long firstTokenLatencyMs)
        {
            if (result == null)
            {
                return;
            }

            long elapsedMs = Math.Max(0, (long)(DateTime.UtcNow - startedAtUtc).TotalMilliseconds);
            string text = result.text ?? string.Empty;
            int outputCharacters = text.Length;
            int outputTokens = 0;

            try
            {
                ITokenCounter counter = TokenCounterFactory.Create(preset.tokenizerKey, preset.model);
                outputTokens = Math.Max(0, counter.CountText(text));
            }
            catch (Exception error)
            {
                Debug.LogException(error);
            }

            double seconds = Math.Max(0.001d, elapsedMs / 1000d);
            result.elapsedMilliseconds = elapsedMs;
            result.firstTokenLatencyMs = firstTokenLatencyMs >= 0 ? firstTokenLatencyMs : elapsedMs;
            result.outputCharacters = outputCharacters;
            result.outputTokensEstimate = outputTokens;
            result.outputCharactersPerSecond = (float)(outputCharacters / seconds);
            result.outputTokensPerSecond = (float)(outputTokens / seconds);
        }

        private static async Task SendAsync(UnityWebRequest request)
        {
            AsyncOperation operation = request.SendWebRequest();
            while (!operation.isDone)
            {
                await Task.Yield();
            }
        }

        private static async Task SendAsync(UnityWebRequest request, MoonHouseRequestOptions options)
        {
            MoonHouseRequestOptions resolved = options ?? new MoonHouseRequestOptions();
            DateTime deadlineUtc = resolved.timeoutSeconds > 0
                ? DateTime.UtcNow.AddSeconds(resolved.timeoutSeconds)
                : DateTime.MaxValue;

            AsyncOperation operation = request.SendWebRequest();
            while (!operation.isDone)
            {
                if (resolved.cancellationToken.IsCancellationRequested)
                {
                    request.Abort();
                    throw new OperationCanceledException("月之屋 API 请求已取消。", resolved.cancellationToken);
                }

                if (resolved.timeoutSeconds > 0 && DateTime.UtcNow >= deadlineUtc)
                {
                    request.Abort();
                    throw new TimeoutException("月之屋 API 请求超时: " + resolved.timeoutSeconds + " 秒。");
                }

                await Task.Yield();
            }

            if (resolved.cancellationToken.IsCancellationRequested)
            {
                request.Abort();
                throw new OperationCanceledException("月之屋 API 请求已取消。", resolved.cancellationToken);
            }
        }

        private static void ApplyRequestTimeout(UnityWebRequest request, MoonHouseRequestOptions options)
        {
            int timeoutSeconds = options != null ? options.timeoutSeconds : 0;
            if (timeoutSeconds > 0)
            {
                request.timeout = Math.Max(1, timeoutSeconds);
            }
        }

        private static async Task<T> ExecuteWithRetryAsync<T>(
            MoonHouseRequestOptions options,
            Func<int, Task<T>> operation)
        {
            MoonHouseRequestOptions resolved = options ?? new MoonHouseRequestOptions();
            int maxAttempts = Math.Max(1, Math.Max(0, resolved.retryCount) + 1);
            Exception lastError = null;

            for (int attempt = 1; attempt <= maxAttempts; attempt += 1)
            {
                if (resolved.cancellationToken.IsCancellationRequested)
                {
                    throw new OperationCanceledException("月之屋 API 请求已取消。", resolved.cancellationToken);
                }

                try
                {
                    return await operation(attempt);
                }
                catch (Exception error)
                {
                    if (IsCancellation(error))
                    {
                        throw;
                    }

                    lastError = error;
                    if (attempt >= maxAttempts || !IsRetryable(error))
                    {
                        throw;
                    }

                    int delayMs = Math.Max(0, resolved.retryDelayMs);
                    try
                    {
                        resolved.onRetry?.Invoke(new MoonHouseRetryInfo
                        {
                            attempt = attempt,
                            maxAttempts = maxAttempts,
                            nextDelayMs = delayMs,
                            errorMessage = error.Message
                        });
                    }
                    catch (Exception callbackError)
                    {
                        Debug.LogException(callbackError);
                    }

                    if (delayMs > 0)
                    {
                        await Task.Delay(delayMs, resolved.cancellationToken);
                    }
                }
            }

            throw lastError ?? new InvalidOperationException("月之屋 API 请求失败。");
        }

        private static bool IsCancellation(Exception error)
        {
            return error is OperationCanceledException || error is TaskCanceledException;
        }

        private static bool IsRetryable(Exception error)
        {
            if (error is TimeoutException)
            {
                return true;
            }

            MoonHouseApiRequestException apiError = error as MoonHouseApiRequestException;
            if (apiError == null)
            {
                return false;
            }

            long code = apiError.responseCode;
            return code == 0 ||
                   code == 408 ||
                   code == 409 ||
                   code == 425 ||
                   code == 429 ||
                   code >= 500;
        }

        private static string ExtractStreamDelta(string payload)
        {
            try
            {
                JObject json = JObject.Parse(payload);
                return
                    ExtractText(json.SelectToken("choices[0].delta.content")) ??
                    ExtractText(json.SelectToken("choices[0].delta.text")) ??
                    ExtractText(json.SelectToken("choices[0].text")) ??
                    ExtractText(json.SelectToken("delta.text")) ??
                    ExtractText(json.SelectToken("content_block_delta.delta.text")) ??
                    ExtractText(json.SelectToken("candidates[0].content.parts")) ??
                    ExtractText(json.SelectToken("candidates[0].content.parts[0].text")) ??
                    ExtractText(json.SelectToken("output_text")) ??
                    string.Empty;
            }
            catch
            {
                return string.Empty;
            }
        }

        private static MoonHouseGenerationResult ParseGenerationResult(
            string responseText,
            MoonHouseGenerationPreset preset,
            PromptAssembly assembly)
        {
            JObject json = JObject.Parse(responseText);
            List<MoonHouseToolCall> toolCalls = MoonHouseAgentRuntime.ExtractNativeToolCalls(json);
            string text =
                ExtractText(json.SelectToken("choices[0].message.content")) ??
                ExtractText(json.SelectToken("choices[0].message.parts")) ??
                ExtractText(json.SelectToken("choices[0].text")) ??
                ExtractText(json.SelectToken("content")) ??
                ExtractText(json.SelectToken("candidates[0].content.parts")) ??
                ExtractText(json.SelectToken("output_text")) ??
                string.Empty;

            text = text.Trim();
            if (string.IsNullOrWhiteSpace(text) && toolCalls.Count == 0)
            {
                string reason =
                    ExtractText(json.SelectToken("choices[0].finish_reason")) ??
                    ExtractText(json.SelectToken("promptFeedback.blockReason")) ??
                    ExtractText(json.SelectToken("error.message")) ??
                    "接口返回成功，但正文为空";
                throw new InvalidOperationException("月之屋 API 返回了空回复: " + reason);
            }

            return new MoonHouseGenerationResult
            {
                text = text,
                rawJson = responseText,
                model = preset.model,
                createdAtIso = DateTime.UtcNow.ToString("O"),
                promptDebugSummary = assembly.debugSummary,
                toolCalls = toolCalls
            };
        }

        private static string ExtractText(JToken token)
        {
            if (token == null || token.Type == JTokenType.Null)
            {
                return null;
            }

            if (token.Type == JTokenType.String ||
                token.Type == JTokenType.Integer ||
                token.Type == JTokenType.Float ||
                token.Type == JTokenType.Boolean)
            {
                return token.ToString();
            }

            if (token.Type == JTokenType.Array)
            {
                StringBuilder builder = new StringBuilder();
                foreach (JToken item in token.Children())
                {
                    string itemText = ExtractText(item);
                    if (!string.IsNullOrWhiteSpace(itemText))
                    {
                        if (builder.Length > 0)
                        {
                            builder.AppendLine();
                        }

                        builder.Append(itemText.Trim());
                    }
                }

                return builder.Length > 0 ? builder.ToString() : null;
            }

            if (token.Type == JTokenType.Object)
            {
                return
                    ExtractText(token["text"]) ??
                    ExtractText(token["content"]) ??
                    ExtractText(token["output_text"]) ??
                    ExtractText(token["value"]);
            }

            return token.ToString();
        }

        private static MoonHouseModelListResult ParseModelListResult(string responseText, string provider)
        {
            OpenAiModelListResponse response = JsonConvert.DeserializeObject<OpenAiModelListResponse>(responseText);
            List<string> modelIds = new List<string>();

            AddModelIds(modelIds, response?.data, provider);
            AddModelIds(modelIds, response?.models, provider);

            modelIds.Sort(StringComparer.OrdinalIgnoreCase);

            return new MoonHouseModelListResult
            {
                modelIds = modelIds,
                rawJson = responseText,
                refreshedAtIso = DateTime.UtcNow.ToString("O")
            };
        }

        private static void AddModelIds(List<string> target, List<OpenAiModelItem> items, string provider)
        {
            if (items == null)
            {
                return;
            }

            foreach (OpenAiModelItem item in items)
            {
                string id = !string.IsNullOrWhiteSpace(item?.id)
                    ? item.id.Trim()
                    : !string.IsNullOrWhiteSpace(item?.name)
                        ? item.name.Trim()
                        : item?.displayName?.Trim();

                if (provider == MoonHouseApiProviders.Gemini &&
                    !string.IsNullOrWhiteSpace(id) &&
                    id.StartsWith("models/", StringComparison.OrdinalIgnoreCase))
                {
                    id = id.Substring("models/".Length);
                }

                if (!string.IsNullOrWhiteSpace(id) && !target.Contains(id))
                {
                    target.Add(id);
                }
            }
        }

        private static string NormalizeApiProvider(string provider)
        {
            string value = (provider ?? string.Empty).Trim().ToLowerInvariant();
            if (value == MoonHouseApiProviders.Gemini ||
                value == "google" ||
                value == "makersuite" ||
                value == "google_ai")
            {
                return MoonHouseApiProviders.Gemini;
            }

            if (value == MoonHouseApiProviders.Claude ||
                value == "anthropic")
            {
                return MoonHouseApiProviders.Claude;
            }

            return MoonHouseApiProviders.OpenAiCompatible;
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
    }
}
