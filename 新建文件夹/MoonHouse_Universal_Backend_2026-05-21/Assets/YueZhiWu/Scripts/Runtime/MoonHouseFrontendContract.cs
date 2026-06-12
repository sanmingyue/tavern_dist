using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Mingyue.YueZhiWu
{
    [Serializable]
    public class MoonHouseTurnRequest
    {
        public string playerInput = "";
        public bool saveToHistory = true;
        public bool silent;
        public bool stream;
        public int streamFlushIntervalMs = 50;
        public int streamFlushMinChars = 8;
        public string generationId = "";
        public int timeoutSeconds = 180;
        public int retryCount = 1;
        public int retryDelayMs = 750;
        public int historyMessageLimitOverride = -1;
        public MoonHouseGenerationPreset presetOverride;
        public MoonHouseGameState gameState;
        public List<MoonHouseRuntimeVariable> runtimeVariables = new List<MoonHouseRuntimeVariable>();
        public List<PromptInjection> temporaryInjects = new List<PromptInjection>();
        public MoonHouseOutputParserSettings outputParsing;
    }

    public class MoonHouseTurnResponse
    {
        public string playerMessageId = "";
        public string assistantMessageId = "";
        public string assistantText = "";
        public string model = "";
        public string createdAtIso = "";
        public PromptAssembly prompt = new PromptAssembly();
        public MoonHouseParsedOutput parsedOutput = new MoonHouseParsedOutput();
        public List<MoonHouseStatePatchResult> patchResults = new List<MoonHouseStatePatchResult>();
        public MoonHouseSave save = new MoonHouseSave();
    }

    [Serializable]
    public class MoonHouseMemorySummaryRequest
    {
        public bool force;
        public string generationId = "";
        public int timeoutSeconds = 240;
        public int retryCount = 1;
        public int retryDelayMs = 750;
        public MoonHouseGenerationPreset presetOverride;
    }

    public class MoonHouseMemorySummaryResponse
    {
        public bool ran;
        public string reason = "";
        public MoonHouseGrandSummary summary;
        public PromptAssembly prompt;
        public MoonHouseGenerationResult generationResult;
        public MoonHouseSave save;
    }

    [Serializable]
    public class MoonHouseUserPersonaCaptureRequest
    {
        public string personaId = "";
        public string name = "";
        public string rawInput = "";
        public string source = "frontend";
        public bool setActive = true;
        public bool replaceRawInput = false;
        public bool replaceFields = false;
        public List<MoonHouseUserPersonaField> fields = new List<MoonHouseUserPersonaField>();
        public List<string> tags = new List<string>();
    }

    public class MoonHouseUserPersonaCaptureResponse
    {
        public bool captured;
        public string reason = "";
        public MoonHouseUserPersona persona;
        public MoonHouseSave save;
    }

    [Serializable]
    public class MoonHouseUserPersonaAnalyzeRequest
    {
        public string personaId = "";
        public string name = "";
        public string rawInput = "";
        public bool createIfMissing = true;
        public bool setActive = true;
        public bool force = true;
        public string generationId = "";
        public int timeoutSeconds = 240;
        public int retryCount = 1;
        public int retryDelayMs = 750;
        public MoonHouseGenerationPreset presetOverride;
    }

    public class MoonHouseUserPersonaAnalyzeResponse
    {
        public bool ran;
        public string reason = "";
        public MoonHouseUserPersona persona;
        public PromptAssembly prompt;
        public MoonHouseGenerationResult generationResult;
        public MoonHouseSave save;
    }

    public interface IMoonHouseRuntime
    {
        MoonHouseSave SaveData { get; }
        PromptAssembly LastPromptAssembly { get; }
        MoonHouseGenerationResult LastGenerationResult { get; }
        event Action<MoonHouseMessage> MessageAdded;
        event Action SaveChanged;
        event Action<MoonHouseEvent> EventEmitted;

        PromptAssembly PreviewPrompt(string playerInput);
        Task<MoonHouseTurnResponse> SendTurnAsync(MoonHouseTurnRequest request);
        Task<MoonHouseTurnResponse> SendTurnStreamAsync(MoonHouseTurnRequest request, Action<MoonHouseStreamChunk> onChunk = null);
        Task<MoonHouseGameTurnResponse> RunSceneTurnAsync(MoonHouseGameTurnRequest request);
        Task<MoonHouseGameTurnResponse> RunNpcDialogueAsync(MoonHouseGameTurnRequest request);
        Task<MoonHouseGameTurnResponse> RunPlayerActionAsync(MoonHouseGameTurnRequest request);
        Task<MoonHouseTurnResponse> GenerateRawAsync(MoonHouseGenerateRawRequest request);
        MoonHouseParsedOutput ParseAssistantOutput(string text, MoonHouseOutputParserSettings settings = null);
        List<MoonHouseStatePatchResult> ApplyStatePatches(List<MoonHouseStatePatch> patches, bool saveAfter = true);
        bool ShouldRunMemorySummary();
        Task<MoonHouseMemorySummaryResponse> RunMemorySummaryAsync(MoonHouseMemorySummaryRequest request = null);
        MoonHouseGrandSummary GetLatestMemorySummary();
        List<MoonHouseUserPersona> GetUserPersonas();
        MoonHouseUserPersona GetActiveUserPersona();
        MoonHouseUserPersona UpsertUserPersona(MoonHouseUserPersona persona, bool setActive = true);
        MoonHouseUserPersonaCaptureResponse CaptureUserPersona(MoonHouseUserPersonaCaptureRequest request);
        bool SelectUserPersona(string personaId);
        Task<MoonHouseUserPersonaAnalyzeResponse> AnalyzeUserPersonaAsync(MoonHouseUserPersonaAnalyzeRequest request = null);
        List<MoonHouseMemoryItem> GetMemoryBank();
        MoonHouseMemoryItem UpsertMemoryItem(MoonHouseMemoryItem item);
        bool DeleteMemoryItem(string memoryId);
        MoonHouseMemorySearchResult SearchMemoryBank(MoonHouseMemorySearchRequest request = null);
        bool CancelGeneration(string generationId);
        int CancelAllGenerations();
        bool IsGenerationRunning(string generationId);
        List<string> GetActiveGenerationIds();
        Task<MoonHouseModelListResult> RefreshAvailableModelsAsync();
        Task<MoonHouseModelListResult> RefreshCognitiveModelsAsync();
        bool SelectCognitiveModel(string modelId);
        List<MoonHouseEvent> GetRecentEvents(int limit = 50);
        void ClearRecentEvents();
        void ClearMessages();
        void NewGameFromConfig();
        MoonHouseGameState GetGameState();
        MoonHouseEcosystemState GetEcosystemState();
        void SetEcosystemState(MoonHouseEcosystemState ecosystem);
        MoonHouseEcosystemActor UpsertEcosystemActor(MoonHouseEcosystemActor actor);
        bool DeleteEcosystemActor(string actorId);
        MoonHouseEcosystemEvent AddEcosystemEvent(MoonHouseEcosystemEvent ecosystemEvent);
        MoonHouseEcosystemAdvanceResult AdvanceEcosystem(MoonHouseEcosystemAdvanceRequest request = null);
        MoonHouseEcosystemDigest BuildEcosystemDigest(MoonHouseEcosystemQuery query = null);
        List<MoonHouseEcosystemActor> GetEcosystemActorsAtLocation(string locationId, int hour = -1, int minute = -1);
        Task<MoonHouseEcosystemCognitiveResponse> RunEcosystemCognitiveTickAsync(MoonHouseEcosystemCognitiveRequest request = null);
        void SetGameState(MoonHouseGameState gameState);
        void SetRuntimeVariable(MoonHouseRuntimeVariable variable);
        void SetRuntimeVariables(List<MoonHouseRuntimeVariable> variables);
        void SetScopedVariable(MoonHouseRuntimeVariable variable, MoonHouseVariableScope scope, string ownerId = "");
        MoonHouseRuntimeVariable GetScopedVariable(string key, MoonHouseVariableScope scope, string ownerId = "");
        List<MoonHouseRuntimeVariable> GetRuntimeVariables(MoonHouseVariableScope scope, string ownerId = "");
        int ClearRuntimeVariables(MoonHouseVariableScope scope, string ownerId = "");
        bool SelectModel(string modelId);
        bool SelectPreset(int index);
        string ExportSaveJson(bool includeApiSecrets = false);
        MoonHouseImportReport ImportSaveJson(string json, MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.Replace);
        string ExportContentPackageJson(bool includeMessages = false, bool includeApiSecrets = false, string packageName = "");
        MoonHouseImportReport ImportContentPackageJson(string json, MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate);
        string ExportWorldbookPackageJson(string packageName = "");
        MoonHouseImportReport ImportWorldbookPackageJson(string json, MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate);
        string ExportPresetPackageJson(bool includeApiSecrets = false, string packageName = "");
        MoonHouseImportReport ImportPresetPackageJson(string json, MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate);
        MoonHouseImportReport ImportSillyTavernWorldbookJson(string json, MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate);
        MoonHouseImportReport ImportSillyTavernPresetJson(string json, MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate, string packageName = "");
        MoonHouseImportReport ImportSillyTavernCharacterCardJson(string json, MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate, string sourceName = "sillytavern_character_card");
    }
}
