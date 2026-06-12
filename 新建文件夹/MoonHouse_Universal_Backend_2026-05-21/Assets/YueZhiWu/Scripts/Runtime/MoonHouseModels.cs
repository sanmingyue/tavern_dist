using System;
using System.Collections.Generic;
using System.Threading;

namespace Mingyue.YueZhiWu
{
    public static class MoonHouseConstants
    {
        public const string BackendName = "月之屋";
        public const int SaveSchemaVersion = 7;
        public const string DefaultPresetAdapter = "mingyue_qiuqing_bad_end";
    }

    public static class MoonHouseApiProviders
    {
        public const string OpenAiCompatible = "openai_compatible";
        public const string Gemini = "gemini";
        public const string Claude = "claude";
    }

    public enum PromptSlot
    {
        WorldInfoBefore,
        CharDescription,
        PersonaDescription,
        CharPersonality,
        Scenario,
        WorldInfoAfter,
        RuntimeContext
    }

    public enum WorldbookActivationMode
    {
        Constant,
        Keyword
    }

    public enum WorldbookSecondaryLogic
    {
        AndAny,
        AndAll,
        NotAny,
        NotAll
    }

    public enum MoonHouseVariableKind
    {
        Text,
        Number,
        Boolean
    }

    public enum MoonHousePromptInjectionPosition
    {
        PromptStack,
        InChat
    }

    public enum MoonHouseContentMergeMode
    {
        AppendOrUpdate,
        Replace
    }

    public enum MoonHousePromptPostProcessorMode
    {
        Default,
        SingleUserMessage,
        NoAssLike
    }

    public enum MoonHouseAgentMode
    {
        Disabled,
        JsonActions,
        NativeTools,
        ToolLoop
    }

    public enum MoonHouseVariableScope
    {
        Save,
        Global,
        Character,
        Turn,
        Message
    }

    public enum MoonHouseGameTurnKind
    {
        Scene,
        NpcDialogue,
        PlayerAction,
        Raw
    }

    public static class MoonHouseEventTypes
    {
        public const string BackendLoaded = "backend.loaded";
        public const string SaveChanged = "save.changed";
        public const string GameStateChanged = "game_state.changed";
        public const string RuntimeVariableChanged = "runtime_variable.changed";
        public const string PromptAssembled = "prompt.assembled";
        public const string GenerationStarted = "generation.started";
        public const string GenerationStreamDelta = "generation.stream_delta";
        public const string GenerationRetrying = "generation.retrying";
        public const string GenerationCancelled = "generation.cancelled";
        public const string GenerationTimeout = "generation.timeout";
        public const string GenerationCompleted = "generation.completed";
        public const string GenerationFailed = "generation.failed";
        public const string AgentToolExecuted = "agent.tool_executed";
        public const string AgentToolFailed = "agent.tool_failed";
        public const string MemorySummaryStarted = "memory.summary_started";
        public const string MemorySummaryCompleted = "memory.summary_completed";
        public const string MemorySummarySkipped = "memory.summary_skipped";
        public const string MemorySummaryFailed = "memory.summary_failed";
        public const string MemoryBankChanged = "memory.bank_changed";
        public const string UserPersonaChanged = "user_persona.changed";
        public const string UserPersonaAnalysisStarted = "user_persona.analysis_started";
        public const string UserPersonaAnalysisCompleted = "user_persona.analysis_completed";
        public const string UserPersonaAnalysisFailed = "user_persona.analysis_failed";
        public const string EcosystemAdvanced = "ecosystem.advanced";
        public const string EcosystemDigestBuilt = "ecosystem.digest_built";
        public const string EcosystemCognitiveStarted = "ecosystem.cognitive_started";
        public const string EcosystemCognitiveCompleted = "ecosystem.cognitive_completed";
        public const string EcosystemCognitiveSkipped = "ecosystem.cognitive_skipped";
        public const string EcosystemCognitiveFailed = "ecosystem.cognitive_failed";
        public const string OutputParsed = "output.parsed";
        public const string StatePatchApplied = "state_patch.applied";
        public const string MessageAdded = "message.added";
        public const string WorldbookActivated = "worldbook.activated";
        public const string ContentImported = "content.imported";
        public const string ModelListRefreshed = "model_list.refreshed";
    }

    public static class PromptSlotExtensions
    {
        public static string ToSlotId(this PromptSlot slot)
        {
            switch (slot)
            {
                case PromptSlot.WorldInfoBefore:
                    return "world_info_before";
                case PromptSlot.CharDescription:
                    return "char_description";
                case PromptSlot.PersonaDescription:
                    return "persona_description";
                case PromptSlot.CharPersonality:
                    return "char_personality";
                case PromptSlot.Scenario:
                    return "scenario";
                case PromptSlot.WorldInfoAfter:
                    return "world_info_after";
                case PromptSlot.RuntimeContext:
                    return "runtime_context";
                default:
                    return "runtime_context";
            }
        }

        public static string ToLabel(this PromptSlot slot)
        {
            switch (slot)
            {
                case PromptSlot.WorldInfoBefore:
                    return "World Info (before)";
                case PromptSlot.CharDescription:
                    return "Character Description";
                case PromptSlot.PersonaDescription:
                    return "Persona Description";
                case PromptSlot.CharPersonality:
                    return "Character Personality";
                case PromptSlot.Scenario:
                    return "Scenario";
                case PromptSlot.WorldInfoAfter:
                    return "World Info (after)";
                case PromptSlot.RuntimeContext:
                    return "Runtime Context";
                default:
                    return "Runtime Context";
            }
        }
    }

    [Serializable]
    public class MoonHouseGenerationPreset
    {
        public string presetName = "默认 OpenAI 兼容";
        public string endpointBaseUrl = "http://localhost:11434/v1";
        public string apiKey = "";
        public string apiProvider = MoonHouseApiProviders.OpenAiCompatible;
        public string model = "qwen2.5:7b";
        [UnityEngine.HideInInspector]
        public List<string> availableModels = new List<string>();
        [UnityEngine.HideInInspector]
        public int selectedModelIndex = -1;
        [UnityEngine.HideInInspector]
        public string lastModelRefreshAtIso = "";
        [UnityEngine.HideInInspector]
        public string lastModelRefreshError = "";
        public bool useChatCompletions = true;
        public float temperature = 0.85f;
        public float topP = 0.9f;
        public int maxTokens = 900;
        public int contextTokens = 8192;
        public int reservedOutputTokens = 1200;
        public int historyMessageLimit = 24;
        public string tokenizerKey = "best_match";
        public string presetAdapter = MoonHouseConstants.DefaultPresetAdapter;
        public MoonHousePromptPostProcessorMode promptPostProcessor = MoonHousePromptPostProcessorMode.Default;
        public string noAssSquashRole = "assistant";
        public string noAssUserPrefix = "Human";
        public string noAssAssistantPrefix = "Assistant";
        public string noAssSystemPrefix = "SYSTEM";
        public string noAssSeparator = "";
        public bool enableFunctionTools = false;
        public MoonHouseAgentMode agentMode = MoonHouseAgentMode.Disabled;
        public int maxToolRounds = 0;
        public MoonHouseOutputParserSettings outputParsing = new MoonHouseOutputParserSettings();
        public List<string> stop = new List<string>();
    }

    [Serializable]
    public class MoonHouseContextTemplate
    {
        public string id = "default_context";
        public string name = "默认上下文模板";
        public string storyString = "{{world_info_before}}\n{{char_description}}\n{{persona_description}}\n{{char_personality}}\n{{scenario}}\n{{world_info_after}}\n{{runtime_context}}";
        public string playerActionTemplate = "<player_action>\n{{input}}\n</player_action>";
        public bool includeNames = true;
    }

    [Serializable]
    public class MoonHouseInstructTemplate
    {
        public string id = "chatml";
        public string name = "ChatML / OpenAI 兼容";
        public string systemSequence = "";
        public string userSequence = "";
        public string assistantSequence = "";
        public string systemSuffix = "";
        public string userSuffix = "";
        public string assistantSuffix = "";
        public bool sequencesAsStopStrings;
    }

    [Serializable]
    public class MoonHouseSystemPromptPreset
    {
        public string id = "immersive_roleplay";
        public string name = "沉浸式角色扮演";
        public string content = "只写角色对玩家本轮行动的回应。不要代替玩家决定行动。保持场景、时间、人物和游戏状态连续。";
        public string postHistory = "";
        public bool enabled = true;
    }

    [Serializable]
    public class MoonHouseReasoningPreset
    {
        public string id = "hidden_reasoning";
        public string name = "隐藏结算";
        public string instruction = "如需内部判断，只在心中完成；正文不要展示推理过程。";
        public bool enabled = true;
    }

    [Serializable]
    public class MoonHousePresetLibrary
    {
        public List<MoonHouseGenerationPreset> generationPresets = new List<MoonHouseGenerationPreset>();
        public List<MoonHouseContextTemplate> contextTemplates = new List<MoonHouseContextTemplate>();
        public List<MoonHouseInstructTemplate> instructTemplates = new List<MoonHouseInstructTemplate>();
        public List<MoonHouseSystemPromptPreset> systemPrompts = new List<MoonHouseSystemPromptPreset>();
        public List<MoonHouseReasoningPreset> reasoningPresets = new List<MoonHouseReasoningPreset>();
        public string activeGenerationPresetId = "";
        public string activeContextTemplateId = "default_context";
        public string activeInstructTemplateId = "chatml";
        public string activeSystemPromptId = "immersive_roleplay";
        public string activeReasoningPresetId = "hidden_reasoning";
    }

    [Serializable]
    public class MoonHousePromptNode
    {
        public string identifier = "";
        public string name = "";
        public bool enabled = true;
        public bool marker;
        public string role = "system";
        public PromptSlot slot = PromptSlot.RuntimeContext;
        public MoonHousePromptInjectionPosition injectionPosition = MoonHousePromptInjectionPosition.PromptStack;
        public int injectionDepth;
        public int injectionOrder = 100;
        public int priority = 100;
        public string source = "moon_house";
        public string content = "";
        public bool allowOverride = true;
        public bool scanForWorldbook;
    }

    [Serializable]
    public class MoonHousePromptStack
    {
        public List<MoonHousePromptNode> nodes = new List<MoonHousePromptNode>();
    }

    [Serializable]
    public class MoonHouseMessage
    {
        public string id = "";
        public string role = "user";
        public string content = "";
        public string createdAtIso = "";

        public MoonHouseMessage()
        {
        }

        public MoonHouseMessage(string role, string content)
        {
            id = MoonHouseIds.Create("msg");
            this.role = role;
            this.content = content;
            createdAtIso = DateTime.UtcNow.ToString("O");
        }
    }

    [Serializable]
    public class MoonHouseMemorySettings
    {
        public bool enabled = true;
        public bool autoSummaryEnabled = false;
        public bool injectGrandSummary = true;
        public bool injectCharacterMemories = true;
        public bool injectDynamicProfiles = true;
        public bool injectUserPersona = true;
        public bool injectMemoryBank = true;
        public bool excludeSummarizedHistory = true;
        public bool useDedicatedApi = false;
        public MoonHouseGenerationPreset dedicatedApiPreset = new MoonHouseGenerationPreset
        {
            presetName = "Moon House Cognitive API",
            temperature = 0.2f,
            maxTokens = 2200,
            historyMessageLimit = 0,
            promptPostProcessor = MoonHousePromptPostProcessorMode.Default,
            enableFunctionTools = false,
            agentMode = MoonHouseAgentMode.Disabled
        };
        public int summaryIntervalAssistantMessages = 10;
        public int preserveRecentAssistantMessages = 4;
        public int maxSummaryVersions = 3;
        public int summaryMaxTokens = 2200;
        public float summaryTemperature = 0.2f;
        public int personaAnalysisMaxTokens = 1600;
        public float personaAnalysisTemperature = 0.1f;
        public int memoryBankMaxItems = 8;
        public int memoryBankMaxCharacters = 2600;
        public float memoryBankMinScore = 0.25f;
        public bool ecosystemEnabled = true;
        public bool injectEcosystemDigest = true;
        public bool ecosystemUseDedicatedApi = true;
        public int ecosystemHeartbeatMinutes = 60;
        public int ecosystemMaxActiveActors = 8;
        public int ecosystemMaxDigestEvents = 8;
        public int ecosystemCognitiveMaxTokens = 1600;
        public float ecosystemCognitiveTemperature = 0.25f;
    }

    [Serializable]
    public class MoonHouseUserPersona
    {
        public string id = "";
        public string name = "";
        public string rawInput = "";
        public string analyzedProfile = "";
        public string source = "frontend";
        public bool injectToPrompt = true;
        public List<MoonHouseUserPersonaField> capturedFields = new List<MoonHouseUserPersonaField>();
        public string createdAtIso = "";
        public string updatedAtIso = "";
        public string lastAnalyzedAtIso = "";
        public List<string> tags = new List<string>();
    }

    [Serializable]
    public class MoonHouseUserPersonaField
    {
        public string key = "";
        public string label = "";
        public string value = "";
        public string source = "frontend";
        public bool exposeToPrompt = true;
        public int priority = 100;
        public string updatedAtIso = "";
    }

    [Serializable]
    public class MoonHouseTimelineEvent
    {
        public string time = "";
        public string eventText = "";
        public string details = "";
        public string actions = "";
    }

    [Serializable]
    public class MoonHouseMemoryItem
    {
        public string id = "";
        public string kind = "manual";
        public string title = "";
        public string content = "";
        public string source = "manual";
        public string sourceId = "";
        public int sourceVersion;
        public bool enabled = true;
        public float importance = 1f;
        public int priority = 100;
        public List<string> actors = new List<string>();
        public List<string> locations = new List<string>();
        public List<string> tags = new List<string>();
        public List<string> keywords = new List<string>();
        public List<string> relatedMessageIds = new List<string>();
        public string createdAtIso = "";
        public string updatedAtIso = "";
        public string lastAccessedAtIso = "";
        public int accessCount;
    }

    [Serializable]
    public class MoonHouseMemorySearchRequest
    {
        public string query = "";
        public int limit = 8;
        public float minScore = -1f;
        public bool updateAccessStats = false;
        public List<string> actors = new List<string>();
        public List<string> locations = new List<string>();
        public List<string> tags = new List<string>();
    }

    public class MoonHouseMemoryMatch
    {
        public MoonHouseMemoryItem item;
        public float score;
        public string reason = "";
    }

    public class MoonHouseMemorySearchResult
    {
        public List<MoonHouseMemoryMatch> matches = new List<MoonHouseMemoryMatch>();
        public string injectionText = "";
    }

    [Serializable]
    public class MoonHouseCharacterMemory
    {
        public string characterName = "";
        public List<string> aliases = new List<string>();
        public string attitude = "neutral";
        public List<string> keywords = new List<string>();
        public List<string> coreMemories = new List<string>();
        public List<string> recentMemories = new List<string>();
    }

    [Serializable]
    public class MoonHouseCharacterEntry
    {
        public string name = "";
        public List<string> aliases = new List<string>();
        public string identity = "";
        public string relationship = "";
        public string status = "";
    }

    [Serializable]
    public class MoonHouseDynamicProfile
    {
        public string characterName = "";
        public string dynamicContent = "";
        public string lastUpdatedAtIso = "";
        public int basedOnSummaryVersion;
    }

    [Serializable]
    public class MoonHouseGrandSummary
    {
        public int version;
        public string generatedAtIso = "";
        public int fromMessageIndex;
        public int upToMessageIndex;
        public List<string> coveredMessageIds = new List<string>();
        public List<MoonHouseTimelineEvent> timeline = new List<MoonHouseTimelineEvent>();
        public List<MoonHouseCharacterMemory> characterMemories = new List<MoonHouseCharacterMemory>();
        public List<MoonHouseCharacterEntry> characterTable = new List<MoonHouseCharacterEntry>();
        public List<MoonHouseDynamicProfile> dynamicProfiles = new List<MoonHouseDynamicProfile>();
        public string rawText = "";
    }

    [Serializable]
    public class MoonHouseContextBlock
    {
        public string id = "";
        public PromptSlot slot = PromptSlot.WorldInfoAfter;
        public string tagName = "context";
        public int index = 1;
        public string label = "";
        public string content = "";
        public string source = "built_in";
        public string matchReason = "常驻上下文";
        public int priority = 100;
        public bool preserveContent = false;
        public string wrapTag = "";
    }

    [Serializable]
    public class WorldbookEntry
    {
        public string id = "";
        public string title = "";
        public bool enabled = true;
        public WorldbookActivationMode activation = WorldbookActivationMode.Keyword;
        public PromptSlot slot = PromptSlot.WorldInfoAfter;
        public string tagName = "world_info";
        public int index = 1;
        public string content = "";
        public string source = "built_in";
        public List<string> primaryKeys = new List<string>();
        public List<string> secondaryKeys = new List<string>();
        public WorldbookSecondaryLogic secondaryLogic = WorldbookSecondaryLogic.AndAny;
        public int scanDepth = 4;
        public int priority = 100;
        public int order = 100;
        public string group = "";
        public bool groupExclusive = true;
        public float probability = 100f;
        public bool caseSensitive = false;
        public bool matchWholeWords = false;
        public bool allowRecursion = true;
        public bool preventRecursion = false;
        public bool ignoreBudget = false;
        public bool matchPlayerInput = true;
        public bool matchRecentMessages = true;
        public bool matchGameState = true;
        public bool matchRuntimeVariables = true;
        public bool matchContextBlocks = false;
        public int delayRounds = 0;
        public int stickyRounds = 0;
        public int cooldownRounds = 0;
        public List<string> tags = new List<string>();
    }

    [Serializable]
    public class WorldbookScanSettings
    {
        public int maxContextTokens = 8192;
        public int budgetPercent = 25;
        public int budgetCapTokens = 0;
        public int defaultScanDepth = 4;
        public bool recursive = true;
        public int maxRecursionSteps = 2;
        public bool groupCompetition = true;
        public int randomSeed = 0;
        public int minActivations = 0;
        public int minActivationDepthMax = 0;
    }

    public class WorldbookScanContext
    {
        public string publicOperation = "";
        public List<MoonHouseMessage> recentMessages = new List<MoonHouseMessage>();
        public List<string> extraScanTexts = new List<string>();
        public string gameStateText = "";
        public string runtimeVariableText = "";
        public string contextBlockText = "";
        public Dictionary<string, WorldbookRuntimeState> worldbookStates = new Dictionary<string, WorldbookRuntimeState>();
    }

    public class ActivatedWorldbookEntry
    {
        public WorldbookEntry entry;
        public string reason;
        public int estimatedTokens;
        public int recursionRound;
        public bool delayedActivation;
    }

    public class WorldbookScanTrace
    {
        public string entryId = "";
        public string title = "";
        public PromptSlot slot = PromptSlot.WorldInfoAfter;
        public bool activated;
        public bool budgetSkipped;
        public bool groupSkipped;
        public bool delayQueued;
        public string reason = "";
        public int estimatedTokens;
        public int recursionRound;
    }

    public class WorldbookScanResult
    {
        public List<ActivatedWorldbookEntry> activatedEntries = new List<ActivatedWorldbookEntry>();
        public List<ActivatedWorldbookEntry> delayedEntries = new List<ActivatedWorldbookEntry>();
        public List<WorldbookScanTrace> traces = new List<WorldbookScanTrace>();
        public Dictionary<PromptSlot, string> slotText = new Dictionary<PromptSlot, string>();
        public int budgetTokens;
        public int usedTokens;
        public bool budgetOverflowed;
    }

    [Serializable]
    public class WorldbookRuntimeState
    {
        public string entryId = "";
        public int stickyTurnsRemaining;
        public int cooldownTurnsRemaining;
        public int delayTurnsRemaining;
        public bool delayActivationQueued;
        public int lastActivatedTurn = -1;
    }

    public class PromptBudgetReport
    {
        public string tokenizerKey = "";
        public string tokenizerName = "";
        public int contextTokens;
        public int reservedOutputTokens;
        public int availablePromptTokens;
        public int injectTokens;
        public int historyTokens;
        public int userInputTokens;
        public int totalPromptTokens;
        public int selectedHistoryMessages;
        public int droppedHistoryMessages;
    }

    public class PromptInjection
    {
        public string id = "";
        public string position = "in_chat";
        public int depth = 0;
        public string role = "system";
        public string content = "";
        public bool shouldScan = false;
    }

    public class PromptAssembly
    {
        public string adapter = MoonHouseConstants.DefaultPresetAdapter;
        public string publicOperation = "";
        public string taggedUserInput = "";
        public string promptText = "";
        public string injectionText = "";
        public List<PromptInjection> injects = new List<PromptInjection>();
        public List<MoonHouseMessage> apiMessages = new List<MoonHouseMessage>();
        public WorldbookScanResult worldbookScan = new WorldbookScanResult();
        public PromptBudgetReport budget = new PromptBudgetReport();
        public string debugSummary = "";
        public string worldbookDebug = "";
        public string tokenDebug = "";
        public string gameStateDebug = "";
    }

    public class PromptComposeOptions
    {
        public List<PromptInjection> temporaryInjects = new List<PromptInjection>();
        public bool includePromptStack = true;
        public bool includeContextBlocks = true;
        public bool includeWorldbook = true;
        public bool includeRuntimeState = true;
        public bool includeHistory = true;
        public bool evaluateMacros = true;
    }

    [Serializable]
    public class MoonHouseRuntimeVariable
    {
        public string key = "";
        public string label = "";
        public MoonHouseVariableScope scope = MoonHouseVariableScope.Save;
        public string ownerId = "";
        public MoonHouseVariableKind kind = MoonHouseVariableKind.Text;
        public string stringValue = "";
        public float numberValue;
        public bool boolValue;
        public bool exposeToPrompt = true;
        public int priority = 100;
    }

    [Serializable]
    public class MoonHouseRawPromptPart
    {
        public string role = "system";
        public string content = "";
        public bool evaluateMacros = true;
    }

    [Serializable]
    public class MoonHouseGenerateRawRequest
    {
        public string userInput = "";
        public List<MoonHouseRawPromptPart> orderedPrompts = new List<MoonHouseRawPromptPart>();
        public List<PromptInjection> injects = new List<PromptInjection>();
        public MoonHouseGenerationPreset presetOverride;
        public MoonHouseGameState gameState;
        public List<MoonHouseRuntimeVariable> runtimeVariables = new List<MoonHouseRuntimeVariable>();
        public MoonHouseOutputParserSettings outputParsing = new MoonHouseOutputParserSettings { enabled = false };
        public bool appendUserInput = true;
        public bool evaluateMacros = true;
        public bool saveToHistory = false;
        public string generationId = "";
        public int timeoutSeconds = 180;
        public int retryCount = 1;
        public int retryDelayMs = 750;
    }

    [Serializable]
    public class MoonHouseOutputParserSettings
    {
        public bool enabled = true;
        public bool stripHiddenBlocksFromAssistantText = true;
        public bool applyStatePatchesToSave = false;
        public bool includeContractInstruction = false;
        public bool parseChoices = true;
        public bool parseImagePrompts = true;
        public bool parseMemoryHints = true;
    }

    [Serializable]
    public class MoonHouseOutputChoice
    {
        public string id = "";
        public string label = "";
        public string description = "";
        public string playerInput = "";
        public List<string> tags = new List<string>();
    }

    [Serializable]
    public class MoonHouseStatePatch
    {
        public string id = "";
        public string operation = "";
        public string key = "";
        public string value = "";
        public string valueType = "";
        public string scope = "";
        public string ownerId = "";
        public string rawJson = "";
        public string source = "output_parser";
        public bool actorPresentSpecified;
        public MoonHouseGameClock clock;
        public MoonHouseLocationState location;
        public MoonHouseSceneState scene;
        public MoonHouseActorState actor;
        public MoonHouseRuntimeVariable variable;
        public MoonHouseMemoryItem memoryItem;
        public List<string> facts = new List<string>();
        public List<string> tags = new List<string>();
    }

    public class MoonHouseStatePatchResult
    {
        public string patchId = "";
        public string operation = "";
        public bool success;
        public bool mutatedSave;
        public string message = "";
        public MoonHouseStatePatch patch;
    }

    public class MoonHouseParsedOutput
    {
        public string rawText = "";
        public string visibleText = "";
        public string storyText = "";
        public string thoughtText = "";
        public bool hadStructuredData;
        public List<MoonHouseOutputChoice> choices = new List<MoonHouseOutputChoice>();
        public List<MoonHouseStatePatch> statePatches = new List<MoonHouseStatePatch>();
        public List<string> memoryHints = new List<string>();
        public List<string> imagePrompts = new List<string>();
        public List<string> hiddenBlocks = new List<string>();
        public List<string> parseErrors = new List<string>();
    }

    [Serializable]
    public class MoonHouseGameTurnRequest
    {
        public MoonHouseGameTurnKind kind = MoonHouseGameTurnKind.Scene;
        public string playerInput = "";
        public string locationId = "";
        public string locationName = "";
        public string sceneId = "";
        public string sceneName = "";
        public string npcId = "";
        public string npcName = "";
        public string actionId = "";
        public string actionLabel = "";
        public string frontendOutcome = "";
        public bool saveToHistory = true;
        public bool stream;
        public string generationId = "";
        public int timeoutSeconds = 180;
        public int retryCount = 1;
        public int retryDelayMs = 750;
        public int historyMessageLimitOverride = -1;
        public MoonHouseGenerationPreset presetOverride;
        public MoonHouseGameState gameState;
        public List<MoonHouseRuntimeVariable> runtimeVariables = new List<MoonHouseRuntimeVariable>();
        public List<PromptInjection> temporaryInjects = new List<PromptInjection>();
        public MoonHouseOutputParserSettings outputParsing = new MoonHouseOutputParserSettings
        {
            enabled = true,
            stripHiddenBlocksFromAssistantText = true,
            applyStatePatchesToSave = false,
            includeContractInstruction = true
        };
    }

    public class MoonHouseGameTurnResponse
    {
        public MoonHouseTurnResponse turn = new MoonHouseTurnResponse();
        public MoonHouseParsedOutput parsedOutput = new MoonHouseParsedOutput();
        public List<MoonHouseStatePatchResult> patchResults = new List<MoonHouseStatePatchResult>();
    }

    public class MoonHouseEvent
    {
        public string eventType = "";
        public string eventId = "";
        public string generationId = "";
        public string createdAtIso = "";
        public string message = "";
        public string error = "";
        public MoonHouseMessage chatMessage;
        public PromptAssembly prompt;
        public MoonHouseStreamChunk streamChunk;
        public MoonHouseRetryInfo retryInfo;
        public MoonHouseGenerationResult generationResult;
        public MoonHouseImportReport importReport;
        public MoonHouseRuntimeVariable runtimeVariable;
        public MoonHouseGameState gameState;
        public MoonHouseToolExecutionResult toolResult;
        public MoonHouseParsedOutput parsedOutput;
        public MoonHouseStatePatchResult statePatchResult;
        public MoonHouseGrandSummary memorySummary;
        public MoonHouseMemoryItem memoryItem;
        public MoonHouseMemorySearchResult memorySearchResult;
        public MoonHouseUserPersona userPersona;
        public MoonHouseEcosystemState ecosystem;
        public MoonHouseEcosystemDigest ecosystemDigest;
        public MoonHouseEcosystemAdvanceResult ecosystemAdvanceResult;
        public List<WorldbookScanTrace> worldbookTraces = new List<WorldbookScanTrace>();
    }

    [Serializable]
    public class MoonHouseGameClock
    {
        public string calendarName = "默认历";
        public string dateText = "";
        public int day = 1;
        public int hour = 8;
        public int minute = 0;
        public string timeOfDay = "清晨";
        public string season = "";
        public string weather = "";
    }

    [Serializable]
    public class MoonHouseLocationState
    {
        public string locationId = "";
        public string locationName = "";
        public string areaName = "";
        public string ambience = "";
        public List<string> tags = new List<string>();
    }

    [Serializable]
    public class MoonHouseSceneState
    {
        public string sceneId = "";
        public string sceneName = "";
        public string phase = "";
        public string objective = "";
        public string mood = "";
        public int dangerLevel;
        public List<string> tags = new List<string>();
    }

    [Serializable]
    public class MoonHouseActorState
    {
        public string actorId = "";
        public string displayName = "";
        public string role = "npc";
        public string locationId = "";
        public bool present = true;
        public string activity = "";
        public string attitude = "";
        public float relationship;
        public List<string> tags = new List<string>();
    }

    [Serializable]
    public class MoonHouseGameState
    {
        public MoonHouseGameClock clock = new MoonHouseGameClock();
        public MoonHouseLocationState location = new MoonHouseLocationState();
        public MoonHouseSceneState scene = new MoonHouseSceneState();
        public List<MoonHouseActorState> actors = new List<MoonHouseActorState>();
        public List<string> facts = new List<string>();
        public string rawSummary = "";
    }

    [Serializable]
    public class MoonHouseEcosystemState
    {
        public bool enabled = true;
        public string worldId = "";
        public string worldName = "";
        public int currentDay = 1;
        public int currentHour = 8;
        public int currentMinute;
        public List<MoonHouseEcosystemLocation> locations = new List<MoonHouseEcosystemLocation>();
        public List<MoonHouseEcosystemFaction> factions = new List<MoonHouseEcosystemFaction>();
        public List<MoonHouseEcosystemActor> actors = new List<MoonHouseEcosystemActor>();
        public List<MoonHouseEcosystemRelationship> relationships = new List<MoonHouseEcosystemRelationship>();
        public List<MoonHouseEcosystemEvent> events = new List<MoonHouseEcosystemEvent>();
        public List<MoonHouseBehaviorTree> behaviorTrees = new List<MoonHouseBehaviorTree>();
        public string lastAdvancedAtIso = "";
        public string lastCognitiveRunAtIso = "";
        public MoonHouseEcosystemDigest lastDigest = new MoonHouseEcosystemDigest();
    }

    [Serializable]
    public class MoonHouseEcosystemLocation
    {
        public string locationId = "";
        public string displayName = "";
        public string areaName = "";
        public string parentLocationId = "";
        public bool active = true;
        public List<string> tags = new List<string>();
        public List<string> facts = new List<string>();
    }

    [Serializable]
    public class MoonHouseEcosystemFaction
    {
        public string factionId = "";
        public string displayName = "";
        public string type = "";
        public string homeLocationId = "";
        public bool active = true;
        public List<string> tags = new List<string>();
        public List<string> facts = new List<string>();
    }

    [Serializable]
    public class MoonHouseEcosystemActor
    {
        public string actorId = "";
        public string displayName = "";
        public string role = "npc";
        public string factionId = "";
        public string locationId = "";
        public string homeLocationId = "";
        public bool active = true;
        public bool visibleToPlayer;
        public float relationshipToPlayer;
        public string status = "";
        public string activity = "";
        public string mood = "";
        public string goalId = "";
        public int lodTier = 1;
        public List<string> tags = new List<string>();
        public List<string> facts = new List<string>();
        public List<MoonHouseEcosystemRoutine> routines = new List<MoonHouseEcosystemRoutine>();
        public List<MoonHouseEcosystemGoal> goals = new List<MoonHouseEcosystemGoal>();
        public List<string> memoryHints = new List<string>();
        public string lastUpdatedAtIso = "";
    }

    [Serializable]
    public class MoonHouseEcosystemRoutine
    {
        public string routineId = "";
        public string label = "";
        public string locationId = "";
        public int startHour;
        public int startMinute;
        public int endHour = 23;
        public int endMinute = 59;
        public int priority = 100;
        public List<int> daysOfWeek = new List<int>();
        public List<string> tags = new List<string>();
    }

    [Serializable]
    public class MoonHouseEcosystemGoal
    {
        public string goalId = "";
        public string label = "";
        public string description = "";
        public int priority = 100;
        public float progress;
        public string status = "active";
        public string targetActorId = "";
        public string targetLocationId = "";
        public string targetFactionId = "";
        public List<string> tags = new List<string>();
    }

    [Serializable]
    public class MoonHouseEcosystemRelationship
    {
        public string subjectActorId = "";
        public string targetActorId = "";
        public string relationship = "";
        public float affinity;
        public float tension;
        public List<string> facts = new List<string>();
        public string updatedAtIso = "";
    }

    [Serializable]
    public class MoonHouseEcosystemEvent
    {
        public string eventId = "";
        public string type = "";
        public string title = "";
        public string description = "";
        public string locationId = "";
        public List<string> actorIds = new List<string>();
        public int day;
        public int hour;
        public int minute;
        public float importance = 0.5f;
        public bool consumed;
        public string source = "runtime";
        public List<string> tags = new List<string>();
        public string createdAtIso = "";
    }

    [Serializable]
    public class MoonHouseBehaviorTree
    {
        public string treeId = "";
        public string label = "";
        public string actorId = "";
        public string fallbackAction = "";
        public List<MoonHouseBehaviorNode> nodes = new List<MoonHouseBehaviorNode>();
    }

    [Serializable]
    public class MoonHouseBehaviorNode
    {
        public string nodeId = "";
        public string parentId = "";
        public string nodeType = "action";
        public string conditionKey = "";
        public string conditionValue = "";
        public string actionId = "";
        public string label = "";
        public int priority = 100;
        public List<string> tags = new List<string>();
    }

    [Serializable]
    public class MoonHouseEcosystemAdvanceRequest
    {
        public int minutes = -1;
        public string reason = "";
        public string playerLocationId = "";
        public string locationId = "";
        public bool runBehaviorTrees = true;
        public bool generateEvents = true;
    }

    [Serializable]
    public class MoonHouseEcosystemAdvanceResult
    {
        public bool advanced;
        public int minutes;
        public int previousDay;
        public int previousHour;
        public int previousMinute;
        public int currentDay;
        public int currentHour;
        public int currentMinute;
        public List<MoonHouseEcosystemActor> movedActors = new List<MoonHouseEcosystemActor>();
        public List<MoonHouseEcosystemEvent> generatedEvents = new List<MoonHouseEcosystemEvent>();
        public MoonHouseEcosystemDigest digest = new MoonHouseEcosystemDigest();
    }

    [Serializable]
    public class MoonHouseEcosystemQuery
    {
        public string locationId = "";
        public string actorId = "";
        public bool includeNearby = true;
        public int maxActors = -1;
        public int maxEvents = -1;
        public string publicOperation = "";
    }

    [Serializable]
    public class MoonHouseEcosystemDigest
    {
        public MoonHouseEcosystemQuery query = new MoonHouseEcosystemQuery();
        public string text = "";
        public List<MoonHouseEcosystemActor> actors = new List<MoonHouseEcosystemActor>();
        public List<MoonHouseEcosystemEvent> events = new List<MoonHouseEcosystemEvent>();
        public string builtAtIso = "";
    }

    [Serializable]
    public class MoonHouseEcosystemCognitiveRequest
    {
        public bool force = true;
        public string generationId = "";
        public int timeoutSeconds = 240;
        public int retryCount = 1;
        public int retryDelayMs = 750;
        public MoonHouseGenerationPreset presetOverride;
        public MoonHouseEcosystemQuery query = new MoonHouseEcosystemQuery();
        public string instructionHint = "";
    }

    public class MoonHouseEcosystemCognitiveResponse
    {
        public bool ran;
        public string reason = "";
        public int appliedPatchCount;
        public MoonHouseEcosystemDigest digest;
        public PromptAssembly prompt;
        public MoonHouseGenerationResult generationResult;
        public MoonHouseSave save;
    }

    public class MoonHouseEcosystemPatch
    {
        public List<MoonHouseEcosystemActor> actors = new List<MoonHouseEcosystemActor>();
        public List<MoonHouseEcosystemLocation> locations = new List<MoonHouseEcosystemLocation>();
        public List<MoonHouseEcosystemFaction> factions = new List<MoonHouseEcosystemFaction>();
        public List<MoonHouseEcosystemRelationship> relationships = new List<MoonHouseEcosystemRelationship>();
        public List<MoonHouseEcosystemEvent> events = new List<MoonHouseEcosystemEvent>();
        public List<string> facts = new List<string>();
        public string rawJson = "";
    }

    [Serializable]
    public class MoonHouseSave
    {
        public int schemaVersion = MoonHouseConstants.SaveSchemaVersion;
        public string saveId = "";
        public string createdAtIso = "";
        public string updatedAtIso = "";
        public string characterName = "未命名角色";
        public string playerName = "玩家";
        public int turnIndex;
        public MoonHouseGameState gameState = new MoonHouseGameState();
        public MoonHouseEcosystemState ecosystem = new MoonHouseEcosystemState();
        public List<MoonHouseMessage> messages = new List<MoonHouseMessage>();
        public MoonHousePresetLibrary presetLibrary = new MoonHousePresetLibrary();
        public List<MoonHouseRuntimeVariable> runtimeVariables = new List<MoonHouseRuntimeVariable>();
        public List<WorldbookRuntimeState> worldbookStates = new List<WorldbookRuntimeState>();
        public MoonHousePromptStack promptStack = new MoonHousePromptStack();
        public List<MoonHouseContextBlock> contextBlocks = new List<MoonHouseContextBlock>();
        public List<WorldbookEntry> worldbookEntries = new List<WorldbookEntry>();
        public MoonHouseMemorySettings memorySettings = new MoonHouseMemorySettings();
        public List<MoonHouseGrandSummary> summaries = new List<MoonHouseGrandSummary>();
        public List<MoonHouseDynamicProfile> dynamicProfiles = new List<MoonHouseDynamicProfile>();
        public List<MoonHouseMemoryItem> memoryBank = new List<MoonHouseMemoryItem>();
        public List<MoonHouseUserPersona> userPersonas = new List<MoonHouseUserPersona>();
        public string activeUserPersonaId = "";
        public int lastSummaryMessageIndex;
        public string activeChatPresetId = "";
    }

    [Serializable]
    public class MoonHouseContentPackage
    {
        public int schemaVersion = MoonHouseConstants.SaveSchemaVersion;
        public string packageType = "moon_house_content";
        public string packageName = "";
        public string exportedAtIso = "";
        public string characterName = "";
        public string playerName = "";
        public MoonHousePresetLibrary presetLibrary;
        public MoonHousePromptStack promptStack;
        public WorldbookScanSettings worldbookScanSettings;
        public MoonHouseGameState gameState;
        public MoonHouseEcosystemState ecosystem;
        public List<MoonHouseRuntimeVariable> runtimeVariables = new List<MoonHouseRuntimeVariable>();
        public List<MoonHouseContextBlock> contextBlocks = new List<MoonHouseContextBlock>();
        public List<WorldbookEntry> worldbookEntries = new List<WorldbookEntry>();
        public MoonHouseMemorySettings memorySettings;
        public List<MoonHouseGrandSummary> summaries = new List<MoonHouseGrandSummary>();
        public List<MoonHouseDynamicProfile> dynamicProfiles = new List<MoonHouseDynamicProfile>();
        public List<MoonHouseMemoryItem> memoryBank = new List<MoonHouseMemoryItem>();
        public List<MoonHouseUserPersona> userPersonas = new List<MoonHouseUserPersona>();
        public string activeUserPersonaId = "";
        public List<MoonHouseMessage> messages = new List<MoonHouseMessage>();
        public bool includesPresetLibrary;
        public bool includesPromptStack;
        public bool includesWorldbookScanSettings;
        public bool includesGameState;
        public bool includesEcosystem;
        public bool includesRuntimeVariables;
        public bool includesContextBlocks;
        public bool includesWorldbookEntries;
        public bool includesMemorySettings;
        public bool includesSummaries;
        public bool includesDynamicProfiles;
        public bool includesMemoryBank;
        public bool includesUserPersonas;
        public bool includesMessages;
        public bool includesApiSecrets;
        public string note = "";
    }

    public class MoonHouseImportReport
    {
        public string sourceType = "";
        public MoonHouseContentMergeMode mergeMode = MoonHouseContentMergeMode.AppendOrUpdate;
        public int contextBlocksAdded;
        public int contextBlocksUpdated;
        public int worldbookEntriesAdded;
        public int worldbookEntriesUpdated;
        public int promptNodesAdded;
        public int promptNodesUpdated;
        public int generationPresetsAdded;
        public int generationPresetsUpdated;
        public int contextTemplatesAdded;
        public int contextTemplatesUpdated;
        public int instructTemplatesAdded;
        public int instructTemplatesUpdated;
        public int systemPromptsAdded;
        public int systemPromptsUpdated;
        public int reasoningPresetsAdded;
        public int reasoningPresetsUpdated;
        public int runtimeVariablesAdded;
        public int runtimeVariablesUpdated;
        public int messagesAdded;
        public int summariesAdded;
        public int dynamicProfilesAdded;
        public int memoryItemsAdded;
        public int memoryItemsUpdated;
        public int userPersonasAdded;
        public int userPersonasUpdated;
        public bool gameStateReplaced;
        public bool ecosystemReplaced;
        public bool memorySettingsReplaced;
        public bool userPersonasReplaced;
        public bool saveReplaced;
        public string message = "";
    }

    public class MoonHouseGenerationResult
    {
        public string text = "";
        public string rawJson = "";
        public string model = "";
        public string createdAtIso = "";
        public string promptDebugSummary = "";
        public List<MoonHouseToolCall> toolCalls = new List<MoonHouseToolCall>();
        public List<MoonHouseToolExecutionResult> toolResults = new List<MoonHouseToolExecutionResult>();
        public MoonHouseParsedOutput parsedOutput;
        public List<MoonHouseStatePatchResult> statePatchResults = new List<MoonHouseStatePatchResult>();
        public bool usedToolLoop;
        public int toolLoopRounds;
        public long elapsedMilliseconds;
        public long firstTokenLatencyMs;
        public int outputCharacters;
        public int outputTokensEstimate;
        public float outputCharactersPerSecond;
        public float outputTokensPerSecond;
    }

    public class MoonHouseModelListResult
    {
        public List<string> modelIds = new List<string>();
        public string rawJson = "";
        public string refreshedAtIso = "";
    }

    public class MoonHouseStreamChunk
    {
        public string generationId = "";
        public string deltaText = "";
        public string accumulatedText = "";
        public string rawJson = "";
        public string createdAtIso = "";
        public long elapsedMilliseconds;
        public long firstTokenLatencyMs;
        public bool isDone;
    }

    public class MoonHouseRetryInfo
    {
        public string generationId = "";
        public int attempt;
        public int maxAttempts;
        public int nextDelayMs;
        public string errorMessage = "";
    }

    [Serializable]
    public class MoonHouseToolCall
    {
        public string id = "";
        public string name = "";
        public string argumentsJson = "{}";
        public string source = "";
    }

    [Serializable]
    public class MoonHouseToolExecutionResult
    {
        public string callId = "";
        public string name = "";
        public bool success;
        public bool mutatedSave;
        public string message = "";
        public string resultJson = "{}";
    }

    [Serializable]
    public class MoonHouseToolDefinition
    {
        public string name = "";
        public string description = "";
        public string parametersJson = "{}";
    }

    public class MoonHouseRequestOptions
    {
        public int timeoutSeconds = 180;
        public int retryCount = 1;
        public int retryDelayMs = 750;
        public CancellationToken cancellationToken = CancellationToken.None;
        public Action<MoonHouseRetryInfo> onRetry;
    }

    public static class MoonHouseIds
    {
        public static string Create(string prefix)
        {
            return string.Format("{0}_{1:N}", prefix, Guid.NewGuid());
        }
    }
}
