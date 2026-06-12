using System.Collections.Generic;

namespace Mingyue.YueZhiWu
{
    public static class MoonHouseDefaults
    {
        public static List<MoonHouseContextBlock> CreateStarterContextBlocks()
        {
            return new List<MoonHouseContextBlock>
            {
                new MoonHouseContextBlock
                {
                    id = "starter_response_rule",
                    slot = PromptSlot.RuntimeContext,
                    tagName = "response_rule",
                    index = 20,
                    label = "正文反馈规则",
                    priority = 1000,
                    source = "moon_house",
                    matchReason = "每轮固定约束",
                    content = string.Join("\n",
                        "规则:",
                        "  - 正文只回应玩家本轮公开操作，不展开后台结算过程。",
                        "  - 若需要写入可解析奖励，只在文末追加短小隐藏块。",
                        "  - 不覆盖前端已经确定的数值、背包、装备和状态。")
                },
                new MoonHouseContextBlock
                {
                    id = "starter_character",
                    slot = PromptSlot.CharDescription,
                    tagName = "heroine_base",
                    index = 1,
                    label = "角色根人设占位",
                    priority = 900,
                    source = "moon_house",
                    matchReason = "角色卡基础槽位",
                    content = string.Join("\n",
                        "女主:",
                        "  名称: {{char}}",
                        "  身份: 等待正式角色卡填入",
                        "  叙事重点: 保持细腻互动、状态连续、回应玩家本轮行动。")
                },
                new MoonHouseContextBlock
                {
                    id = "starter_player",
                    slot = PromptSlot.PersonaDescription,
                    tagName = "player_profile",
                    index = 1,
                    label = "玩家资料占位",
                    priority = 700,
                    source = "moon_house",
                    matchReason = "玩家长期资料槽位",
                    content = string.Join("\n",
                        "玩家:",
                        "  名称: {{user}}",
                        "  资料: 等待正式存档填入")
                }
            };
        }

        public static List<WorldbookEntry> CreateStarterWorldbookEntries()
        {
            return new List<WorldbookEntry>
            {
                new WorldbookEntry
                {
                    id = "starter_worldview",
                    title = "月之屋基础世界观",
                    activation = WorldbookActivationMode.Constant,
                    slot = PromptSlot.WorldInfoBefore,
                    tagName = "worldview",
                    index = 1,
                    priority = 1000,
                    content = string.Join("\n",
                        "世界观:",
                        "  后端: 月之屋",
                        "  运行方式: Unity 本地后端负责预设、世界书、存档和 API 调用",
                        "  内容边界: 正式世界观由角色卡或工坊模块继续扩展")
                },
                new WorldbookEntry
                {
                    id = "starter_scene_garden",
                    title = "灵庭场景",
                    activation = WorldbookActivationMode.Keyword,
                    slot = PromptSlot.Scenario,
                    tagName = "scene",
                    index = 10,
                    priority = 650,
                    primaryKeys = new List<string> { "灵庭", "庭院", "修炼" },
                    content = string.Join("\n",
                        "场景:",
                        "  名称: 灵庭",
                        "  氛围: 清静、适合修炼与交谈",
                        "  叙事提示: 可描写灵气、器物、衣摆与神色变化")
                }
            };
        }

        public static MoonHousePresetLibrary CreateStarterPresetLibrary(MoonHouseGenerationPreset generationPreset)
        {
            MoonHousePresetLibrary library = new MoonHousePresetLibrary();
            if (generationPreset != null)
            {
                library.generationPresets.Add(generationPreset);
                library.activeGenerationPresetId = generationPreset.presetName;
            }

            library.contextTemplates.Add(new MoonHouseContextTemplate());
            library.instructTemplates.Add(new MoonHouseInstructTemplate());
            library.systemPrompts.Add(new MoonHouseSystemPromptPreset());
            library.reasoningPresets.Add(new MoonHouseReasoningPreset());
            return library;
        }

        public static MoonHousePromptStack CreateStarterPromptStack()
        {
            MoonHousePromptStack stack = new MoonHousePromptStack();
            stack.nodes.Add(new MoonHousePromptNode
            {
                identifier = "system_prompt",
                name = "系统提示",
                slot = PromptSlot.RuntimeContext,
                priority = 1200,
                injectionOrder = 10,
                content = "{{system_prompt}}",
                source = "preset_library"
            });
            stack.nodes.Add(new MoonHousePromptNode
            {
                identifier = "reasoning_rule",
                name = "推理规则",
                slot = PromptSlot.RuntimeContext,
                priority = 1150,
                injectionOrder = 20,
                content = "{{reasoning_instruction}}",
                source = "preset_library"
            });
            stack.nodes.Add(new MoonHousePromptNode
            {
                identifier = "game_state",
                name = "Unity 游戏状态",
                slot = PromptSlot.RuntimeContext,
                priority = 1100,
                injectionOrder = 30,
                marker = true,
                content = "{{game_state}}",
                source = "unity_runtime"
            });
            return stack;
        }
    }
}
