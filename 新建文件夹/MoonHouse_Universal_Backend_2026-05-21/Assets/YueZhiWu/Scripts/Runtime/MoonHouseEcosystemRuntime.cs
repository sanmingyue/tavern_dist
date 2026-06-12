using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace Mingyue.YueZhiWu
{
    public static class MoonHouseEcosystemRuntime
    {
        private const int MaxStoredEvents = 240;

        public static MoonHouseEcosystemState Ensure(MoonHouseSave save)
        {
            if (save == null)
            {
                return new MoonHouseEcosystemState();
            }

            save.ecosystem = save.ecosystem ?? new MoonHouseEcosystemState();
            MoonHouseEcosystemState state = save.ecosystem;
            MoonHouseMemorySettings settings = ResolveSettings(save);
            state.enabled = state.enabled && settings.ecosystemEnabled;
            state.locations = state.locations ?? new List<MoonHouseEcosystemLocation>();
            state.factions = state.factions ?? new List<MoonHouseEcosystemFaction>();
            state.actors = state.actors ?? new List<MoonHouseEcosystemActor>();
            state.relationships = state.relationships ?? new List<MoonHouseEcosystemRelationship>();
            state.events = state.events ?? new List<MoonHouseEcosystemEvent>();
            state.behaviorTrees = state.behaviorTrees ?? new List<MoonHouseBehaviorTree>();
            state.lastDigest = state.lastDigest ?? new MoonHouseEcosystemDigest();

            if (state.currentDay <= 0)
            {
                state.currentDay = save.gameState?.clock?.day > 0 ? save.gameState.clock.day : 1;
            }

            if (state.currentHour < 0 || state.currentHour > 23)
            {
                state.currentHour = save.gameState?.clock != null ? Clamp(save.gameState.clock.hour, 0, 23) : 8;
            }

            if (state.currentMinute < 0 || state.currentMinute > 59)
            {
                state.currentMinute = save.gameState?.clock != null ? Clamp(save.gameState.clock.minute, 0, 59) : 0;
            }

            MirrorGameStateIntoEcosystem(save);
            NormalizeLocations(state);
            NormalizeActors(state);
            NormalizeRelationships(state);
            NormalizeEvents(state);
            NormalizeBehaviorTrees(state);
            return state;
        }

        public static MoonHouseEcosystemAdvanceResult Advance(
            MoonHouseSave save,
            MoonHouseEcosystemAdvanceRequest request = null)
        {
            MoonHouseEcosystemState state = Ensure(save);
            MoonHouseMemorySettings settings = ResolveSettings(save);
            MoonHouseEcosystemAdvanceRequest advanceRequest = request ?? new MoonHouseEcosystemAdvanceRequest();

            MoonHouseEcosystemAdvanceResult result = new MoonHouseEcosystemAdvanceResult
            {
                previousDay = state.currentDay,
                previousHour = state.currentHour,
                previousMinute = state.currentMinute
            };

            if (!state.enabled || !settings.ecosystemEnabled)
            {
                result.digest = BuildDigest(save, CreateQueryFromRequest(advanceRequest));
                return result;
            }

            int minutes = advanceRequest.minutes > 0
                ? advanceRequest.minutes
                : Math.Max(1, settings.ecosystemHeartbeatMinutes);
            result.minutes = minutes;
            MoveClock(state, minutes);
            SyncClockToGameState(save, state);

            if (advanceRequest.runBehaviorTrees)
            {
                ApplyBehaviorTrees(state);
            }

            foreach (MoonHouseEcosystemActor actor in state.actors.Where(item => item != null && item.active))
            {
                string beforeLocation = actor.locationId ?? "";
                string beforeActivity = actor.activity ?? "";
                MoonHouseEcosystemRoutine routine = SelectRoutine(actor, state.currentDay, state.currentHour, state.currentMinute);
                if (routine != null)
                {
                    if (!string.IsNullOrWhiteSpace(routine.locationId))
                    {
                        actor.locationId = routine.locationId.Trim();
                    }

                    if (!string.IsNullOrWhiteSpace(routine.label))
                    {
                        actor.activity = routine.label.Trim();
                    }
                }

                if (!string.Equals(beforeLocation, actor.locationId ?? "", StringComparison.OrdinalIgnoreCase) ||
                    !string.Equals(beforeActivity, actor.activity ?? "", StringComparison.OrdinalIgnoreCase))
                {
                    actor.lastUpdatedAtIso = DateTime.UtcNow.ToString("O");
                    result.movedActors.Add(actor);
                    if (advanceRequest.generateEvents)
                    {
                        result.generatedEvents.Add(CreateActorEvent(
                            state,
                            "actor_routine",
                            actor.displayName + " routine updated",
                            BuildActorRoutineDescription(actor, beforeLocation, beforeActivity),
                            actor.locationId,
                            actor.actorId,
                            "runtime"));
                    }
                }
            }

            if (result.generatedEvents.Count > 0)
            {
                state.events.AddRange(result.generatedEvents);
                TrimEvents(state);
            }

            state.lastAdvancedAtIso = DateTime.UtcNow.ToString("O");
            SyncActorsToGameState(save, state);
            result.currentDay = state.currentDay;
            result.currentHour = state.currentHour;
            result.currentMinute = state.currentMinute;
            result.advanced = true;
            result.digest = BuildDigest(save, CreateQueryFromRequest(advanceRequest));
            state.lastDigest = result.digest;
            return result;
        }

        public static List<MoonHouseEcosystemActor> GetActorsAtLocation(
            MoonHouseSave save,
            string locationId,
            int hour = -1,
            int minute = -1)
        {
            MoonHouseEcosystemState state = Ensure(save);
            string target = NormalizeId(locationId);
            if (string.IsNullOrWhiteSpace(target))
            {
                target = NormalizeId(save?.gameState?.location?.locationId);
            }

            int queryHour = hour >= 0 ? Clamp(hour, 0, 23) : state.currentHour;
            int queryMinute = minute >= 0 ? Clamp(minute, 0, 59) : state.currentMinute;
            return state.actors
                .Where(actor => actor != null && actor.active)
                .Where(actor =>
                {
                    string actorLocation = actor.locationId ?? "";
                    MoonHouseEcosystemRoutine routine = SelectRoutine(actor, state.currentDay, queryHour, queryMinute);
                    if (routine != null && !string.IsNullOrWhiteSpace(routine.locationId))
                    {
                        actorLocation = routine.locationId;
                    }

                    return string.IsNullOrWhiteSpace(target) ||
                           string.Equals(NormalizeId(actorLocation), target, StringComparison.OrdinalIgnoreCase);
                })
                .OrderByDescending(actor => actor.visibleToPlayer)
                .ThenBy(actor => actor.lodTier)
                .ThenBy(actor => actor.displayName)
                .ToList();
        }

        public static MoonHouseEcosystemDigest BuildDigest(
            MoonHouseSave save,
            MoonHouseEcosystemQuery query = null)
        {
            MoonHouseEcosystemState state = Ensure(save);
            MoonHouseMemorySettings settings = ResolveSettings(save);
            MoonHouseEcosystemQuery resolved = query ?? new MoonHouseEcosystemQuery();
            string locationId = !string.IsNullOrWhiteSpace(resolved.locationId)
                ? resolved.locationId
                : save?.gameState?.location?.locationId ?? "";
            string actorId = resolved.actorId ?? "";
            int maxActors = resolved.maxActors > 0 ? resolved.maxActors : Math.Max(1, settings.ecosystemMaxActiveActors);
            int maxEvents = resolved.maxEvents > 0 ? resolved.maxEvents : Math.Max(1, settings.ecosystemMaxDigestEvents);

            List<MoonHouseEcosystemActor> actors = SelectDigestActors(state, locationId, actorId, maxActors);
            List<MoonHouseEcosystemEvent> events = SelectDigestEvents(state, locationId, actorId, maxEvents);
            string text = BuildDigestText(save, state, resolved, actors, events);

            MoonHouseEcosystemDigest digest = new MoonHouseEcosystemDigest
            {
                query = resolved,
                text = text,
                actors = actors,
                events = events,
                builtAtIso = DateTime.UtcNow.ToString("O")
            };
            state.lastDigest = digest;
            return digest;
        }

        public static string BuildPromptInjection(MoonHouseSave save, string playerInput = "")
        {
            MoonHouseMemorySettings settings = ResolveSettings(save);
            if (!settings.enabled || !settings.ecosystemEnabled || !settings.injectEcosystemDigest)
            {
                return "";
            }

            MoonHouseEcosystemDigest digest = BuildDigest(save, new MoonHouseEcosystemQuery
            {
                publicOperation = playerInput ?? ""
            });
            return digest.text ?? "";
        }

        public static MoonHouseGenerateRawRequest BuildCognitiveRawRequest(
            MoonHouseSave save,
            MoonHouseGenerationPreset basePreset,
            MoonHouseEcosystemCognitiveRequest request)
        {
            MoonHouseMemorySettings settings = ResolveSettings(save);
            MoonHouseEcosystemCognitiveRequest cognitiveRequest = request ?? new MoonHouseEcosystemCognitiveRequest();
            MoonHouseGenerationPreset preset = CloneEcosystemPreset(
                settings.ecosystemUseDedicatedApi && settings.useDedicatedApi
                    ? settings.dedicatedApiPreset
                    : basePreset);

            preset.temperature = settings.ecosystemCognitiveTemperature;
            preset.maxTokens = settings.ecosystemCognitiveMaxTokens;
            preset.historyMessageLimit = 0;
            preset.promptPostProcessor = MoonHousePromptPostProcessorMode.Default;
            preset.enableFunctionTools = false;
            preset.agentMode = MoonHouseAgentMode.Disabled;
            preset.outputParsing = new MoonHouseOutputParserSettings { enabled = false };

            MoonHouseEcosystemDigest digest = BuildDigest(save, cognitiveRequest.query);
            return new MoonHouseGenerateRawRequest
            {
                generationId = cognitiveRequest.generationId,
                presetOverride = preset,
                appendUserInput = true,
                evaluateMacros = false,
                saveToHistory = false,
                timeoutSeconds = cognitiveRequest.timeoutSeconds,
                retryCount = cognitiveRequest.retryCount,
                retryDelayMs = cognitiveRequest.retryDelayMs,
                outputParsing = new MoonHouseOutputParserSettings { enabled = false },
                orderedPrompts = new List<MoonHouseRawPromptPart>
                {
                    new MoonHouseRawPromptPart
                    {
                        role = "system",
                        evaluateMacros = false,
                        content = BuildCognitiveSystemInstruction()
                    }
                },
                userInput = BuildCognitiveUserInput(save, digest, cognitiveRequest.instructionHint)
            };
        }

        public static int ParseAndApplyCognitivePatch(MoonHouseSave save, string text)
        {
            if (save == null || string.IsNullOrWhiteSpace(text))
            {
                return 0;
            }

            string json = ExtractPatchJson(text);
            if (string.IsNullOrWhiteSpace(json))
            {
                return 0;
            }

            JObject root;
            try
            {
                root = JObject.Parse(json);
            }
            catch
            {
                return 0;
            }

            MoonHouseEcosystemState state = Ensure(save);
            int applied = 0;
            applied += ApplyLocationPatches(state, root["locations"] as JArray);
            applied += ApplyFactionPatches(state, root["factions"] as JArray);
            applied += ApplyActorPatches(state, root["actors"] as JArray);
            applied += ApplyRelationshipPatches(state, root["relationships"] as JArray);
            applied += ApplyEventPatches(state, root["events"] as JArray);
            applied += ApplyFactPatches(save, root["facts"] as JArray);
            TrimEvents(state);
            state.lastCognitiveRunAtIso = DateTime.UtcNow.ToString("O");
            SyncActorsToGameState(save, state);
            return applied;
        }

        private static MoonHouseMemorySettings ResolveSettings(MoonHouseSave save)
        {
            if (save == null)
            {
                return new MoonHouseMemorySettings();
            }

            save.memorySettings = save.memorySettings ?? new MoonHouseMemorySettings();
            save.memorySettings.dedicatedApiPreset = save.memorySettings.dedicatedApiPreset ?? new MoonHouseGenerationPreset();
            return save.memorySettings;
        }

        private static void MirrorGameStateIntoEcosystem(MoonHouseSave save)
        {
            if (save?.gameState == null || save.ecosystem == null)
            {
                return;
            }

            MoonHouseEcosystemState state = save.ecosystem;
            if (save.gameState.clock != null)
            {
                if (state.currentDay <= 0)
                {
                    state.currentDay = Math.Max(1, save.gameState.clock.day);
                }

                state.currentHour = Clamp(state.currentHour, 0, 23);
                state.currentMinute = Clamp(state.currentMinute, 0, 59);
            }

            string locationId = save.gameState.location?.locationId ?? "";
            string locationName = save.gameState.location?.locationName ?? "";
            if (!string.IsNullOrWhiteSpace(locationId) || !string.IsNullOrWhiteSpace(locationName))
            {
                UpsertLocation(state, new MoonHouseEcosystemLocation
                {
                    locationId = string.IsNullOrWhiteSpace(locationId) ? NormalizeId(locationName) : locationId,
                    displayName = string.IsNullOrWhiteSpace(locationName) ? locationId : locationName,
                    areaName = save.gameState.location?.areaName ?? "",
                    active = true
                });
            }

            foreach (MoonHouseActorState actorState in save.gameState.actors ?? new List<MoonHouseActorState>())
            {
                if (actorState == null)
                {
                    continue;
                }

                string actorId = string.IsNullOrWhiteSpace(actorState.actorId)
                    ? NormalizeId(actorState.displayName)
                    : actorState.actorId;
                if (string.IsNullOrWhiteSpace(actorId))
                {
                    continue;
                }

                MoonHouseEcosystemActor existing = state.actors.FirstOrDefault(actor =>
                    actor != null && string.Equals(actor.actorId, actorId, StringComparison.OrdinalIgnoreCase));
                if (existing != null)
                {
                    continue;
                }

                state.actors.Add(new MoonHouseEcosystemActor
                {
                    actorId = actorId,
                    displayName = actorState.displayName ?? actorId,
                    role = string.IsNullOrWhiteSpace(actorState.role) ? "npc" : actorState.role,
                    locationId = actorState.locationId ?? "",
                    active = true,
                    visibleToPlayer = actorState.present,
                    activity = actorState.activity ?? "",
                    status = actorState.attitude ?? "",
                    relationshipToPlayer = actorState.relationship,
                    tags = actorState.tags ?? new List<string>()
                });
            }
        }

        private static void NormalizeLocations(MoonHouseEcosystemState state)
        {
            for (int i = state.locations.Count - 1; i >= 0; i -= 1)
            {
                MoonHouseEcosystemLocation location = state.locations[i];
                if (location == null)
                {
                    state.locations.RemoveAt(i);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(location.locationId))
                {
                    location.locationId = NormalizeId(location.displayName);
                }

                location.displayName = string.IsNullOrWhiteSpace(location.displayName)
                    ? location.locationId
                    : location.displayName.Trim();
                location.tags = location.tags ?? new List<string>();
                location.facts = location.facts ?? new List<string>();
            }
        }

        private static void NormalizeActors(MoonHouseEcosystemState state)
        {
            for (int i = state.actors.Count - 1; i >= 0; i -= 1)
            {
                MoonHouseEcosystemActor actor = state.actors[i];
                if (actor == null)
                {
                    state.actors.RemoveAt(i);
                    continue;
                }

                if (string.IsNullOrWhiteSpace(actor.actorId))
                {
                    actor.actorId = NormalizeId(actor.displayName);
                }

                actor.displayName = string.IsNullOrWhiteSpace(actor.displayName) ? actor.actorId : actor.displayName.Trim();
                actor.role = string.IsNullOrWhiteSpace(actor.role) ? "npc" : actor.role.Trim();
                actor.tags = actor.tags ?? new List<string>();
                actor.facts = actor.facts ?? new List<string>();
                actor.routines = actor.routines ?? new List<MoonHouseEcosystemRoutine>();
                actor.goals = actor.goals ?? new List<MoonHouseEcosystemGoal>();
                actor.memoryHints = actor.memoryHints ?? new List<string>();
                actor.lodTier = Math.Max(0, actor.lodTier);

                foreach (MoonHouseEcosystemRoutine routine in actor.routines)
                {
                    if (routine == null)
                    {
                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(routine.routineId))
                    {
                        routine.routineId = MoonHouseIds.Create("routine");
                    }

                    routine.daysOfWeek = routine.daysOfWeek ?? new List<int>();
                    routine.tags = routine.tags ?? new List<string>();
                }

                foreach (MoonHouseEcosystemGoal goal in actor.goals)
                {
                    if (goal == null)
                    {
                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(goal.goalId))
                    {
                        goal.goalId = MoonHouseIds.Create("goal");
                    }

                    goal.status = string.IsNullOrWhiteSpace(goal.status) ? "active" : goal.status.Trim();
                    goal.tags = goal.tags ?? new List<string>();
                    goal.progress = Clamp01(goal.progress);
                }
            }
        }

        private static void NormalizeRelationships(MoonHouseEcosystemState state)
        {
            state.relationships.RemoveAll(item => item == null);
            foreach (MoonHouseEcosystemRelationship relationship in state.relationships)
            {
                relationship.facts = relationship.facts ?? new List<string>();
            }
        }

        private static void NormalizeEvents(MoonHouseEcosystemState state)
        {
            state.events.RemoveAll(item => item == null);
            foreach (MoonHouseEcosystemEvent evt in state.events)
            {
                if (string.IsNullOrWhiteSpace(evt.eventId))
                {
                    evt.eventId = MoonHouseIds.Create("eco_evt");
                }

                evt.actorIds = evt.actorIds ?? new List<string>();
                evt.tags = evt.tags ?? new List<string>();
                if (string.IsNullOrWhiteSpace(evt.createdAtIso))
                {
                    evt.createdAtIso = DateTime.UtcNow.ToString("O");
                }
            }

            TrimEvents(state);
        }

        private static void NormalizeBehaviorTrees(MoonHouseEcosystemState state)
        {
            state.behaviorTrees.RemoveAll(item => item == null);
            foreach (MoonHouseBehaviorTree tree in state.behaviorTrees)
            {
                if (string.IsNullOrWhiteSpace(tree.treeId))
                {
                    tree.treeId = MoonHouseIds.Create("btree");
                }

                tree.nodes = tree.nodes ?? new List<MoonHouseBehaviorNode>();
                foreach (MoonHouseBehaviorNode node in tree.nodes)
                {
                    if (node == null)
                    {
                        continue;
                    }

                    if (string.IsNullOrWhiteSpace(node.nodeId))
                    {
                        node.nodeId = MoonHouseIds.Create("bnode");
                    }

                    node.nodeType = string.IsNullOrWhiteSpace(node.nodeType) ? "action" : node.nodeType.Trim();
                    node.tags = node.tags ?? new List<string>();
                }
            }
        }

        private static void MoveClock(MoonHouseEcosystemState state, int minutes)
        {
            int total = Math.Max(0, state.currentMinute + minutes);
            state.currentMinute = total % 60;
            int hourCarry = total / 60;
            int newHour = state.currentHour + hourCarry;
            state.currentDay += newHour / 24;
            state.currentHour = newHour % 24;
        }

        private static void SyncClockToGameState(MoonHouseSave save, MoonHouseEcosystemState state)
        {
            if (save == null)
            {
                return;
            }

            save.gameState = save.gameState ?? new MoonHouseGameState();
            save.gameState.clock = save.gameState.clock ?? new MoonHouseGameClock();
            save.gameState.clock.day = state.currentDay;
            save.gameState.clock.hour = state.currentHour;
            save.gameState.clock.minute = state.currentMinute;
        }

        private static void SyncActorsToGameState(MoonHouseSave save, MoonHouseEcosystemState state)
        {
            if (save == null)
            {
                return;
            }

            save.gameState = save.gameState ?? new MoonHouseGameState();
            save.gameState.actors = save.gameState.actors ?? new List<MoonHouseActorState>();
            foreach (MoonHouseEcosystemActor actor in state.actors.Where(item => item != null && item.active))
            {
                MoonHouseActorState actorState = save.gameState.actors.FirstOrDefault(item =>
                    item != null && string.Equals(item.actorId, actor.actorId, StringComparison.OrdinalIgnoreCase));
                if (actorState == null)
                {
                    actorState = new MoonHouseActorState { actorId = actor.actorId };
                    save.gameState.actors.Add(actorState);
                }

                actorState.displayName = actor.displayName;
                actorState.role = actor.role;
                actorState.locationId = actor.locationId;
                actorState.present = actor.visibleToPlayer;
                actorState.activity = actor.activity;
                actorState.attitude = actor.status;
                actorState.relationship = actor.relationshipToPlayer;
                actorState.tags = actor.tags ?? new List<string>();
            }
        }

        private static void ApplyBehaviorTrees(MoonHouseEcosystemState state)
        {
            foreach (MoonHouseBehaviorTree tree in state.behaviorTrees)
            {
                if (tree == null || string.IsNullOrWhiteSpace(tree.actorId))
                {
                    continue;
                }

                MoonHouseEcosystemActor actor = state.actors.FirstOrDefault(item =>
                    item != null && string.Equals(item.actorId, tree.actorId, StringComparison.OrdinalIgnoreCase));
                if (actor == null || !actor.active)
                {
                    continue;
                }

                MoonHouseBehaviorNode action = tree.nodes
                    .Where(node => node != null && string.Equals(node.nodeType, "action", StringComparison.OrdinalIgnoreCase))
                    .OrderBy(node => node.priority)
                    .FirstOrDefault();
                string actionLabel = action != null && !string.IsNullOrWhiteSpace(action.label)
                    ? action.label
                    : tree.fallbackAction;
                if (!string.IsNullOrWhiteSpace(actionLabel) && string.IsNullOrWhiteSpace(actor.activity))
                {
                    actor.activity = actionLabel.Trim();
                }
            }
        }

        private static MoonHouseEcosystemRoutine SelectRoutine(
            MoonHouseEcosystemActor actor,
            int day,
            int hour,
            int minute)
        {
            if (actor?.routines == null || actor.routines.Count == 0)
            {
                return null;
            }

            int dayOfWeek = ((Math.Max(1, day) - 1) % 7) + 1;
            int time = hour * 60 + minute;
            return actor.routines
                .Where(routine => routine != null &&
                                  (routine.daysOfWeek == null ||
                                   routine.daysOfWeek.Count == 0 ||
                                   routine.daysOfWeek.Contains(dayOfWeek)) &&
                                  RoutineContainsTime(routine, time))
                .OrderBy(routine => routine.priority)
                .ThenBy(routine => routine.startHour * 60 + routine.startMinute)
                .FirstOrDefault();
        }

        private static bool RoutineContainsTime(MoonHouseEcosystemRoutine routine, int time)
        {
            int start = Clamp(routine.startHour, 0, 23) * 60 + Clamp(routine.startMinute, 0, 59);
            int end = Clamp(routine.endHour, 0, 23) * 60 + Clamp(routine.endMinute, 0, 59);
            if (start <= end)
            {
                return time >= start && time <= end;
            }

            return time >= start || time <= end;
        }

        private static MoonHouseEcosystemQuery CreateQueryFromRequest(MoonHouseEcosystemAdvanceRequest request)
        {
            return new MoonHouseEcosystemQuery
            {
                locationId = !string.IsNullOrWhiteSpace(request?.playerLocationId)
                    ? request.playerLocationId
                    : request?.locationId ?? "",
                publicOperation = request?.reason ?? ""
            };
        }

        private static List<MoonHouseEcosystemActor> SelectDigestActors(
            MoonHouseEcosystemState state,
            string locationId,
            string actorId,
            int maxActors)
        {
            string normalizedLocation = NormalizeId(locationId);
            string normalizedActor = NormalizeId(actorId);
            IEnumerable<MoonHouseEcosystemActor> query = state.actors.Where(actor => actor != null && actor.active);
            if (!string.IsNullOrWhiteSpace(normalizedActor))
            {
                query = query.Where(actor => string.Equals(NormalizeId(actor.actorId), normalizedActor, StringComparison.OrdinalIgnoreCase));
            }
            else if (!string.IsNullOrWhiteSpace(normalizedLocation))
            {
                query = query.Where(actor => string.Equals(NormalizeId(actor.locationId), normalizedLocation, StringComparison.OrdinalIgnoreCase));
            }

            return query
                .OrderByDescending(actor => actor.visibleToPlayer)
                .ThenBy(actor => actor.lodTier)
                .ThenByDescending(actor => actor.relationshipToPlayer)
                .ThenBy(actor => actor.displayName)
                .Take(Math.Max(1, maxActors))
                .ToList();
        }

        private static List<MoonHouseEcosystemEvent> SelectDigestEvents(
            MoonHouseEcosystemState state,
            string locationId,
            string actorId,
            int maxEvents)
        {
            string normalizedLocation = NormalizeId(locationId);
            string normalizedActor = NormalizeId(actorId);
            return state.events
                .Where(evt => evt != null && !evt.consumed)
                .Where(evt =>
                    string.IsNullOrWhiteSpace(normalizedLocation) ||
                    string.Equals(NormalizeId(evt.locationId), normalizedLocation, StringComparison.OrdinalIgnoreCase) ||
                    (evt.actorIds ?? new List<string>()).Any(id =>
                        state.actors.Any(actor =>
                            actor != null &&
                            string.Equals(NormalizeId(actor.actorId), NormalizeId(id), StringComparison.OrdinalIgnoreCase) &&
                            string.Equals(NormalizeId(actor.locationId), normalizedLocation, StringComparison.OrdinalIgnoreCase))))
                .Where(evt =>
                    string.IsNullOrWhiteSpace(normalizedActor) ||
                    (evt.actorIds ?? new List<string>()).Any(id => string.Equals(NormalizeId(id), normalizedActor, StringComparison.OrdinalIgnoreCase)))
                .OrderByDescending(evt => evt.day)
                .ThenByDescending(evt => evt.hour)
                .ThenByDescending(evt => evt.minute)
                .ThenByDescending(evt => evt.importance)
                .Take(Math.Max(1, maxEvents))
                .ToList();
        }

        private static string BuildDigestText(
            MoonHouseSave save,
            MoonHouseEcosystemState state,
            MoonHouseEcosystemQuery query,
            List<MoonHouseEcosystemActor> actors,
            List<MoonHouseEcosystemEvent> events)
        {
            if ((actors == null || actors.Count == 0) && (events == null || events.Count == 0))
            {
                return "";
            }

            StringBuilder builder = new StringBuilder();
            builder.AppendLine("<moon_house_ecosystem_digest>");
            builder.AppendLine("clock: day " + state.currentDay + " " + FormatTime(state.currentHour, state.currentMinute));
            string locationId = !string.IsNullOrWhiteSpace(query?.locationId) ? query.locationId : save?.gameState?.location?.locationId ?? "";
            if (!string.IsNullOrWhiteSpace(locationId))
            {
                MoonHouseEcosystemLocation location = state.locations.FirstOrDefault(item =>
                    item != null && string.Equals(NormalizeId(item.locationId), NormalizeId(locationId), StringComparison.OrdinalIgnoreCase));
                builder.AppendLine("focus_location: " + (location != null ? DisplayLocation(location) : locationId));
            }

            if (!string.IsNullOrWhiteSpace(query?.publicOperation))
            {
                builder.AppendLine("current_player_operation: " + query.publicOperation.Trim());
            }

            if (actors != null && actors.Count > 0)
            {
                builder.AppendLine("relevant_actors:");
                foreach (MoonHouseEcosystemActor actor in actors)
                {
                    builder.AppendLine("- " + DisplayActor(actor, state));
                }
            }

            if (events != null && events.Count > 0)
            {
                builder.AppendLine("recent_background_events:");
                foreach (MoonHouseEcosystemEvent evt in events)
                {
                    builder.AppendLine("- " + DisplayEvent(evt));
                }
            }

            builder.AppendLine("</moon_house_ecosystem_digest>");
            return builder.ToString().Trim();
        }

        private static string BuildCognitiveSystemInstruction()
        {
            return string.Join("\n", new[]
            {
                "You are Moon House background ecosystem brain.",
                "Your job is to update off-screen actors, locations, goals, routines, relationships, and events without writing prose for the player.",
                "Keep changes small, factual, game-state oriented, and compatible with any genre.",
                "Do not invent huge plot twists unless the input explicitly implies them.",
                "Output only one JSON object wrapped in <moon_house_ecosystem_patch> tags.",
                "Allowed keys: locations, factions, actors, relationships, events, facts.",
                "Each actor should use actorId, displayName, role, factionId, locationId, homeLocationId, active, visibleToPlayer, relationshipToPlayer, status, activity, mood, goalId, tags, facts, routines, goals, memoryHints, lodTier.",
                "Each event should use type, title, description, locationId, actorIds, importance, source, tags."
            });
        }

        private static string BuildCognitiveUserInput(
            MoonHouseSave save,
            MoonHouseEcosystemDigest digest,
            string instructionHint)
        {
            StringBuilder builder = new StringBuilder();
            builder.AppendLine("## Save");
            builder.AppendLine("characterName: " + (save?.characterName ?? ""));
            builder.AppendLine("playerName: " + (save?.playerName ?? ""));
            builder.AppendLine();
            builder.AppendLine("## Current Digest");
            builder.AppendLine(digest?.text ?? "");
            builder.AppendLine();
            builder.AppendLine("## Current Ecosystem JSON");
            builder.AppendLine(JsonConvert.SerializeObject(save?.ecosystem ?? new MoonHouseEcosystemState(), Formatting.None));
            if (!string.IsNullOrWhiteSpace(instructionHint))
            {
                builder.AppendLine();
                builder.AppendLine("## Frontend Hint");
                builder.AppendLine(instructionHint.Trim());
            }

            builder.AppendLine();
            builder.AppendLine("Return patch JSON only.");
            return builder.ToString().Trim();
        }

        private static int ApplyLocationPatches(MoonHouseEcosystemState state, JArray array)
        {
            int applied = 0;
            foreach (JToken token in array ?? new JArray())
            {
                MoonHouseEcosystemLocation location = token.ToObject<MoonHouseEcosystemLocation>();
                if (location == null)
                {
                    continue;
                }

                JObject obj = token as JObject;
                if (obj == null || obj["active"] == null)
                {
                    location.active = true;
                }

                UpsertLocation(state, location);
                applied += 1;
            }

            return applied;
        }

        private static int ApplyFactionPatches(MoonHouseEcosystemState state, JArray array)
        {
            int applied = 0;
            foreach (JToken token in array ?? new JArray())
            {
                MoonHouseEcosystemFaction faction = token.ToObject<MoonHouseEcosystemFaction>();
                if (faction == null)
                {
                    continue;
                }

                JObject obj = token as JObject;
                if (obj == null || obj["active"] == null)
                {
                    faction.active = true;
                }

                if (string.IsNullOrWhiteSpace(faction.factionId))
                {
                    faction.factionId = NormalizeId(faction.displayName);
                }

                if (string.IsNullOrWhiteSpace(faction.factionId))
                {
                    continue;
                }

                int index = state.factions.FindIndex(item =>
                    item != null && string.Equals(item.factionId, faction.factionId, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    MergeFaction(state.factions[index], faction);
                }
                else
                {
                    state.factions.Add(faction);
                }

                applied += 1;
            }

            return applied;
        }

        private static int ApplyActorPatches(MoonHouseEcosystemState state, JArray array)
        {
            int applied = 0;
            foreach (JToken token in array ?? new JArray())
            {
                MoonHouseEcosystemActor actor = token.ToObject<MoonHouseEcosystemActor>();
                if (actor == null)
                {
                    continue;
                }

                if (string.IsNullOrWhiteSpace(actor.actorId))
                {
                    actor.actorId = NormalizeId(actor.displayName);
                }

                if (string.IsNullOrWhiteSpace(actor.actorId))
                {
                    continue;
                }

                actor.lastUpdatedAtIso = DateTime.UtcNow.ToString("O");
                int index = state.actors.FindIndex(item =>
                    item != null && string.Equals(item.actorId, actor.actorId, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    JObject obj = token as JObject;
                    if (obj == null || obj["active"] == null)
                    {
                        actor.active = state.actors[index].active;
                    }

                    if (obj == null || obj["visibleToPlayer"] == null)
                    {
                        actor.visibleToPlayer = state.actors[index].visibleToPlayer;
                    }

                    if (obj == null || obj["lodTier"] == null)
                    {
                        actor.lodTier = state.actors[index].lodTier;
                    }

                    MergeActor(state.actors[index], actor);
                }
                else
                {
                    JObject obj = token as JObject;
                    if (obj == null || obj["active"] == null)
                    {
                        actor.active = true;
                    }

                    state.actors.Add(actor);
                }

                applied += 1;
            }

            NormalizeActors(state);
            return applied;
        }

        private static int ApplyRelationshipPatches(MoonHouseEcosystemState state, JArray array)
        {
            int applied = 0;
            foreach (JToken token in array ?? new JArray())
            {
                MoonHouseEcosystemRelationship relationship = token.ToObject<MoonHouseEcosystemRelationship>();
                if (relationship == null ||
                    string.IsNullOrWhiteSpace(relationship.subjectActorId) ||
                    string.IsNullOrWhiteSpace(relationship.targetActorId))
                {
                    continue;
                }

                relationship.updatedAtIso = DateTime.UtcNow.ToString("O");
                int index = state.relationships.FindIndex(item =>
                    item != null &&
                    string.Equals(item.subjectActorId, relationship.subjectActorId, StringComparison.OrdinalIgnoreCase) &&
                    string.Equals(item.targetActorId, relationship.targetActorId, StringComparison.OrdinalIgnoreCase));
                if (index >= 0)
                {
                    state.relationships[index] = relationship;
                }
                else
                {
                    state.relationships.Add(relationship);
                }

                applied += 1;
            }

            return applied;
        }

        private static int ApplyEventPatches(MoonHouseEcosystemState state, JArray array)
        {
            int applied = 0;
            foreach (JToken token in array ?? new JArray())
            {
                MoonHouseEcosystemEvent evt = token.ToObject<MoonHouseEcosystemEvent>();
                if (evt == null)
                {
                    continue;
                }

                if (string.IsNullOrWhiteSpace(evt.eventId))
                {
                    evt.eventId = MoonHouseIds.Create("eco_evt");
                }

                evt.day = evt.day <= 0 ? state.currentDay : evt.day;
                evt.hour = evt.hour < 0 || evt.hour > 23 ? state.currentHour : evt.hour;
                evt.minute = evt.minute < 0 || evt.minute > 59 ? state.currentMinute : evt.minute;
                evt.createdAtIso = string.IsNullOrWhiteSpace(evt.createdAtIso) ? DateTime.UtcNow.ToString("O") : evt.createdAtIso;
                evt.actorIds = evt.actorIds ?? new List<string>();
                evt.tags = evt.tags ?? new List<string>();
                state.events.Add(evt);
                applied += 1;
            }

            return applied;
        }

        private static int ApplyFactPatches(MoonHouseSave save, JArray array)
        {
            if (save == null)
            {
                return 0;
            }

            save.gameState = save.gameState ?? new MoonHouseGameState();
            save.gameState.facts = save.gameState.facts ?? new List<string>();
            int applied = 0;
            foreach (JToken token in array ?? new JArray())
            {
                string fact = token.Type == JTokenType.String
                    ? token.ToString()
                    : token["text"]?.ToString();
                if (string.IsNullOrWhiteSpace(fact))
                {
                    continue;
                }

                fact = fact.Trim();
                if (save.gameState.facts.Any(item => string.Equals(item, fact, StringComparison.OrdinalIgnoreCase)))
                {
                    continue;
                }

                save.gameState.facts.Add(fact);
                applied += 1;
            }

            return applied;
        }

        private static void UpsertLocation(MoonHouseEcosystemState state, MoonHouseEcosystemLocation location)
        {
            if (location == null)
            {
                return;
            }

            if (string.IsNullOrWhiteSpace(location.locationId))
            {
                location.locationId = NormalizeId(location.displayName);
            }

            if (string.IsNullOrWhiteSpace(location.locationId))
            {
                return;
            }

            int index = state.locations.FindIndex(item =>
                item != null && string.Equals(item.locationId, location.locationId, StringComparison.OrdinalIgnoreCase));
            if (index >= 0)
            {
                MergeLocation(state.locations[index], location);
            }
            else
            {
                state.locations.Add(location);
            }
        }

        private static void MergeLocation(MoonHouseEcosystemLocation target, MoonHouseEcosystemLocation patch)
        {
            if (!string.IsNullOrWhiteSpace(patch.displayName)) target.displayName = patch.displayName;
            if (!string.IsNullOrWhiteSpace(patch.areaName)) target.areaName = patch.areaName;
            if (!string.IsNullOrWhiteSpace(patch.parentLocationId)) target.parentLocationId = patch.parentLocationId;
            target.active = patch.active;
            target.tags = MergeStringLists(target.tags, patch.tags);
            target.facts = MergeStringLists(target.facts, patch.facts);
        }

        private static void MergeFaction(MoonHouseEcosystemFaction target, MoonHouseEcosystemFaction patch)
        {
            if (!string.IsNullOrWhiteSpace(patch.displayName)) target.displayName = patch.displayName;
            if (!string.IsNullOrWhiteSpace(patch.type)) target.type = patch.type;
            if (!string.IsNullOrWhiteSpace(patch.homeLocationId)) target.homeLocationId = patch.homeLocationId;
            target.active = patch.active;
            target.tags = MergeStringLists(target.tags, patch.tags);
            target.facts = MergeStringLists(target.facts, patch.facts);
        }

        private static void MergeActor(MoonHouseEcosystemActor target, MoonHouseEcosystemActor patch)
        {
            if (!string.IsNullOrWhiteSpace(patch.displayName)) target.displayName = patch.displayName;
            if (!string.IsNullOrWhiteSpace(patch.role)) target.role = patch.role;
            if (!string.IsNullOrWhiteSpace(patch.factionId)) target.factionId = patch.factionId;
            if (!string.IsNullOrWhiteSpace(patch.locationId)) target.locationId = patch.locationId;
            if (!string.IsNullOrWhiteSpace(patch.homeLocationId)) target.homeLocationId = patch.homeLocationId;
            target.active = patch.active;
            target.visibleToPlayer = patch.visibleToPlayer;
            if (Math.Abs(patch.relationshipToPlayer) > 0.0001f) target.relationshipToPlayer = patch.relationshipToPlayer;
            if (!string.IsNullOrWhiteSpace(patch.status)) target.status = patch.status;
            if (!string.IsNullOrWhiteSpace(patch.activity)) target.activity = patch.activity;
            if (!string.IsNullOrWhiteSpace(patch.mood)) target.mood = patch.mood;
            if (!string.IsNullOrWhiteSpace(patch.goalId)) target.goalId = patch.goalId;
            if (patch.lodTier >= 0) target.lodTier = patch.lodTier;
            target.tags = MergeStringLists(target.tags, patch.tags);
            target.facts = MergeStringLists(target.facts, patch.facts);
            target.memoryHints = MergeStringLists(target.memoryHints, patch.memoryHints);
            if (patch.routines != null && patch.routines.Count > 0) target.routines = patch.routines;
            if (patch.goals != null && patch.goals.Count > 0) target.goals = patch.goals;
            target.lastUpdatedAtIso = string.IsNullOrWhiteSpace(patch.lastUpdatedAtIso)
                ? DateTime.UtcNow.ToString("O")
                : patch.lastUpdatedAtIso;
        }

        private static List<string> MergeStringLists(List<string> target, List<string> patch)
        {
            List<string> result = target ?? new List<string>();
            foreach (string value in patch ?? new List<string>())
            {
                if (string.IsNullOrWhiteSpace(value))
                {
                    continue;
                }

                string trimmed = value.Trim();
                if (!result.Any(item => string.Equals(item, trimmed, StringComparison.OrdinalIgnoreCase)))
                {
                    result.Add(trimmed);
                }
            }

            return result;
        }

        private static MoonHouseEcosystemEvent CreateActorEvent(
            MoonHouseEcosystemState state,
            string type,
            string title,
            string description,
            string locationId,
            string actorId,
            string source)
        {
            return new MoonHouseEcosystemEvent
            {
                eventId = MoonHouseIds.Create("eco_evt"),
                type = type,
                title = title ?? type,
                description = description ?? "",
                locationId = locationId ?? "",
                actorIds = string.IsNullOrWhiteSpace(actorId) ? new List<string>() : new List<string> { actorId },
                day = state.currentDay,
                hour = state.currentHour,
                minute = state.currentMinute,
                importance = 0.35f,
                source = source,
                createdAtIso = DateTime.UtcNow.ToString("O")
            };
        }

        private static string BuildActorRoutineDescription(
            MoonHouseEcosystemActor actor,
            string beforeLocation,
            string beforeActivity)
        {
            return (actor.displayName ?? actor.actorId) +
                   " changed from location=" + (beforeLocation ?? "") +
                   ", activity=" + (beforeActivity ?? "") +
                   " to location=" + (actor.locationId ?? "") +
                   ", activity=" + (actor.activity ?? "") + ".";
        }

        private static void TrimEvents(MoonHouseEcosystemState state)
        {
            if (state.events.Count <= MaxStoredEvents)
            {
                return;
            }

            state.events = state.events
                .OrderByDescending(evt => evt.day)
                .ThenByDescending(evt => evt.hour)
                .ThenByDescending(evt => evt.minute)
                .ThenByDescending(evt => evt.importance)
                .Take(MaxStoredEvents)
                .ToList();
        }

        private static string ExtractPatchJson(string text)
        {
            string value = text ?? "";
            const string open = "<moon_house_ecosystem_patch>";
            const string close = "</moon_house_ecosystem_patch>";
            int openIndex = value.IndexOf(open, StringComparison.OrdinalIgnoreCase);
            int closeIndex = value.IndexOf(close, StringComparison.OrdinalIgnoreCase);
            if (openIndex >= 0 && closeIndex > openIndex)
            {
                int start = openIndex + open.Length;
                return value.Substring(start, closeIndex - start).Trim();
            }

            int firstBrace = value.IndexOf('{');
            int lastBrace = value.LastIndexOf('}');
            if (firstBrace >= 0 && lastBrace > firstBrace)
            {
                return value.Substring(firstBrace, lastBrace - firstBrace + 1).Trim();
            }

            return "";
        }

        private static MoonHouseGenerationPreset CloneEcosystemPreset(MoonHouseGenerationPreset source)
        {
            string json = JsonConvert.SerializeObject(source ?? new MoonHouseGenerationPreset());
            return JsonConvert.DeserializeObject<MoonHouseGenerationPreset>(json) ?? new MoonHouseGenerationPreset();
        }

        private static string DisplayActor(MoonHouseEcosystemActor actor, MoonHouseEcosystemState state)
        {
            string location = actor.locationId ?? "";
            MoonHouseEcosystemLocation locationState = state.locations.FirstOrDefault(item =>
                item != null && string.Equals(NormalizeId(item.locationId), NormalizeId(location), StringComparison.OrdinalIgnoreCase));
            if (locationState != null)
            {
                location = DisplayLocation(locationState);
            }

            List<string> parts = new List<string>
            {
                (actor.displayName ?? actor.actorId) + " (" + actor.actorId + ")",
                "role=" + (actor.role ?? "npc"),
                "location=" + location
            };
            if (!string.IsNullOrWhiteSpace(actor.activity)) parts.Add("activity=" + actor.activity);
            if (!string.IsNullOrWhiteSpace(actor.status)) parts.Add("status=" + actor.status);
            if (!string.IsNullOrWhiteSpace(actor.mood)) parts.Add("mood=" + actor.mood);
            if (!string.IsNullOrWhiteSpace(actor.goalId)) parts.Add("goal=" + actor.goalId);
            return string.Join("; ", parts);
        }

        private static string DisplayLocation(MoonHouseEcosystemLocation location)
        {
            if (location == null)
            {
                return "";
            }

            if (!string.IsNullOrWhiteSpace(location.displayName) &&
                !string.Equals(location.displayName, location.locationId, StringComparison.OrdinalIgnoreCase))
            {
                return location.displayName + " (" + location.locationId + ")";
            }

            return location.locationId ?? "";
        }

        private static string DisplayEvent(MoonHouseEcosystemEvent evt)
        {
            return "[day " + evt.day + " " + FormatTime(evt.hour, evt.minute) + "] " +
                   (string.IsNullOrWhiteSpace(evt.title) ? evt.type : evt.title) +
                   (string.IsNullOrWhiteSpace(evt.description) ? "" : ": " + evt.description);
        }

        private static string FormatTime(int hour, int minute)
        {
            return Clamp(hour, 0, 23).ToString("00") + ":" + Clamp(minute, 0, 59).ToString("00");
        }

        private static string NormalizeId(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return "";
            }

            StringBuilder builder = new StringBuilder();
            foreach (char ch in value.Trim())
            {
                if (char.IsLetterOrDigit(ch))
                {
                    builder.Append(char.ToLowerInvariant(ch));
                }
                else if (ch == '_' || ch == '-' || char.IsWhiteSpace(ch))
                {
                    builder.Append('_');
                }
            }

            return builder.ToString().Trim('_');
        }

        private static int Clamp(int value, int min, int max)
        {
            if (value < min) return min;
            if (value > max) return max;
            return value;
        }

        private static float Clamp01(float value)
        {
            if (value < 0f) return 0f;
            if (value > 1f) return 1f;
            return value;
        }
    }
}
