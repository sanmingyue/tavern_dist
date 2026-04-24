import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

/** 调色盘颜色项 */
export interface PaletteColor {
  name: string;
  desc: string;
}

/** 机娘调色盘人格 */
export interface MechPalette {
  底色: PaletteColor;
  主色调: PaletteColor[];
  点缀: PaletteColor;
  衍生色: string[];
}

/** 五维数据 */
export interface FiveDimensions {
  加速度: number;
  极速: number;
  操控: number;
  漂移: number;
  耐久: number;
}

/** 共鸣技能 */
export interface ResonanceSkill {
  name: string;
  desc: string;
}

/** 机娘基础信息 */
export interface MechGirlInfo {
  name: string;
  carModel: string;
  carType: string;
  height: string;
  appearance: string;
}

/** 预设机娘数据 */
export interface PresetMechGirl {
  name: string;
  carModel: string;
  carType: string;
  height: string;
  intro: string;
  stats: FiveDimensions;
  skill: ResonanceSkill;
  personality: string;
}

/** 预设的六位机娘 */
export const PRESET_MECH_GIRLS: PresetMechGirl[] = [
  {
    name: '兰月明',
    carModel: '兰博基尼Veneno',
    carType: 'V12 6.5L 自然吸气',
    height: '168cm',
    intro:
      '直道女王。V12自然吸气的暴力美学，加速度和极速都是顶级。但操控和漂移是致命短板，弯道对她来说是煎熬。骄傲、要强，嘴上不饶人但其实比谁都在乎。',
    stats: { 加速度: 99, 极速: 95, 操控: 30, 漂移: 15, 耐久: 55 },
    skill: {
      name: '直道唯一的女王',
      desc: '共鸣触发后，V12全力爆发，十秒内加速度和极速突破自身上限，代价是操控和漂移归零。',
    },
    personality: '主色调：骄傲、要强 | 底色：脆弱 | 点缀：别扭的温柔',
  },
  {
    name: '星月',
    carModel: 'Apollo IE',
    carType: 'V12 6.3L 自然吸气',
    height: '165cm',
    intro:
      '全能型天才。五维均衡到可怕，没有明显短板也没有绝对巅峰。冷静克制，像把手术刀一样精准。真正的危险藏在那层平静之下。',
    stats: { 加速度: 92, 极速: 88, 操控: 85, 漂移: 78, 耐久: 70 },
    skill: {
      name: '流星',
      desc: '共鸣触发后，核心极限运转，十秒内完全接管操控，五维全面提升。代价是结束后强制冷却。',
    },
    personality: '主色调：冷静、克制 | 底色：孤独 | 点缀：隐藏的炽热',
  },
  {
    name: '氤',
    carModel: '保时捷918 Spyder',
    carType: 'V8 4.6L + 双电机混动',
    height: '163cm',
    intro:
      '混动系统的极致。V8和双电机的组合让她在操控上几乎无敌，加速度也接近天花板。沉默寡言，看起来冷淡但其实一直在观察。咖啡重度依赖者。',
    stats: { 加速度: 98, 极速: 90, 操控: 97, 漂移: 74, 耐久: 84 },
    skill: {
      name: '红区超载',
      desc: '共鸣触发后，V8和双电机突破安全转速上限，十秒内加速度拉到110+。代价是结束后核心需要散热冷却。',
    },
    personality: '主色调：沉默、专注 | 底色：疲惫 | 点缀：咖啡和偶尔的毒舌',
  },
  {
    name: '红雪',
    carModel: 'Nismo GT3-R35',
    carType: 'VR38DETT 双涡轮增压',
    height: '170cm',
    intro:
      '四驱之王。VR38DETT双涡轮增压的GT-R，加速和耐久都是高水准，四驱系统在出弯弹射时无人能敌。开朗幽默，是队里的气氛担当，但她的温柔藏得很深。',
    stats: { 加速度: 96, 极速: 85, 操控: 82, 漂移: 50, 耐久: 88 },
    skill: {
      name: '高转哀泣',
      desc: '共鸣触发后，VR38DETT突破进气限制全力输出，十秒内加速度和极速大幅提升。代价是涡轮和引擎严重超负荷。',
    },
    personality: '主色调：开朗、幽默 | 底色：温柔 | 点缀：无条件兜底',
  },
  {
    name: '阿芙佳朵',
    carModel: '道奇战斧VGT',
    carType: '全电驱动四轮独立电机阵列',
    height: '175cm',
    intro:
      '不该存在的机娘。从设计师的手稿中诞生，从未被制造过的概念赛车。五维总和433分，远超常规。但耐久只有60，核心是未经验证的实验品。极度沉默，对人类社交毫无经验。私下戴猫耳发箍。',
    stats: { 加速度: 99, 极速: 99, 操控: 90, 漂移: 85, 耐久: 60 },
    skill: {
      name: '黑色天使（未觉醒）',
      desc: '共鸣触发后，导流板切换为升力模式，推进系统全功率让赛车短暂脱离地面。此技能从未使用过，没有人触碰过她的核心。',
    },
    personality: '主色调：冷厉、凶狠 | 底色：戒备 | 点缀：皮肤饥渴',
  },
  {
    name: '璃音',
    carModel: '保时捷911 GT3',
    carType: '水平对置六缸 4.0L 自然吸气',
    height: '152cm',
    intro:
      '弯道之王。操控满分，漂移接近天花板。但直道上就是个笑话，加速度和耐久都是灾难。永远在笑的猫耳少女，没心没肺的快乐背后藏着说不出口的不甘心。',
    stats: { 加速度: 55, 极速: 80, 操控: 100, 漂移: 96, 耐久: 30 },
    skill: {
      name: '星坠反转',
      desc: '共鸣触发后，十秒内漂移/操控与加速/极速数值临时对调。弯道之王变成直线暴徒，代价是暂时失去弯道能力。',
    },
    personality: '主色调：没心没肺的快乐 | 底色：不甘心 | 点缀：猫',
  },
];

/** 固定的初始时间 */
const FIXED_INITIAL_TIME = '2025-04-04 14:30';

export const useCreationStore = defineStore('creation', () => {
  // 当前步骤
  const step = ref(0);

  // 创建模式: 'custom' 自捏机娘, 'preset' 选择已有机娘
  const creationMode = ref<'custom' | 'preset' | null>(null);

  // 自捏路径总步骤: 0欢迎 → 1车手 → 2机娘基础 → 3人格 → 4五维 → 5确认 (6步)
  // 选择路径总步骤: 0欢迎 → 1车手 → 2选择机娘 → 3确认开场白 (4步)
  const totalSteps = computed(() => (creationMode.value === 'preset' ? 4 : 6));

  // 步骤 1: 车手基本信息
  const driverTeam = ref('');
  const driverTeamType = ref<'独立' | '加入'>('独立');
  const initialCredits = ref(2000);
  const initialTier = ref<'T5' | 'T4' | 'T3' | 'T2' | 'T1' | 'T0'>('T5');

  // 开场状态选择
  const openingState = ref<'日常' | '赛前准备' | '比赛中'>('日常');

  // 步骤 2 (自捏): 机娘基础信息
  const mechGirl = ref<MechGirlInfo>({
    name: '',
    carModel: '',
    carType: '',
    height: '',
    appearance: '',
  });

  // 步骤 3 (自捏): 机娘调色盘人格
  const palette = ref<MechPalette>({
    底色: { name: '', desc: '' },
    主色调: [
      { name: '', desc: '' },
      { name: '', desc: '' },
    ],
    点缀: { name: '', desc: '' },
    衍生色: [''],
  });

  // 步骤 4 (自捏): 五维 + 共鸣技能
  const cheatMode = ref(false);
  const pointPool = computed(() => (cheatMode.value ? 500 : 350));
  const stats = ref<FiveDimensions>({
    加速度: 50,
    极速: 50,
    操控: 50,
    漂移: 50,
    耐久: 50,
  });
  const usedPoints = computed(() => {
    const s = stats.value;
    return s.加速度 + s.极速 + s.操控 + s.漂移 + s.耐久;
  });
  const remainingPoints = computed(() => pointPool.value - usedPoints.value);

  const skill = ref<ResonanceSkill>({
    name: '',
    desc: '',
  });

  // 步骤 2 (选择): 选中的预设机娘索引
  const selectedPresetIndex = ref<number | null>(null);
  const selectedPreset = computed(() =>
    selectedPresetIndex.value !== null ? PRESET_MECH_GIRLS[selectedPresetIndex.value] : null,
  );

  // 开场白方向
  const openingDirection = ref('');

  // 是否已提交
  const submitted = ref(false);

  // 验证
  const isStep1Valid = computed(() => {
    return driverTeamType.value === '独立' || driverTeam.value.trim().length > 0;
  });

  const isStep2Valid = computed(() => {
    return mechGirl.value.name.trim().length > 0 && mechGirl.value.carModel.trim().length > 0;
  });

  const isStep3Valid = computed(() => {
    return (
      palette.value.底色.name.trim().length > 0 &&
      palette.value.主色调.length >= 2 &&
      palette.value.主色调.every(c => c.name.trim().length > 0) &&
      palette.value.点缀.name.trim().length > 0
    );
  });

  const isStep4Valid = computed(() => {
    return skill.value.name.trim().length > 0 && skill.value.desc.trim().length > 0;
  });

  const isPresetSelected = computed(() => selectedPresetIndex.value !== null);

  // 步骤导航
  function nextStep() {
    if (step.value < totalSteps.value - 1) step.value++;
  }
  function prevStep() {
    if (step.value > 0) step.value--;
  }
  function goToStep(s: number) {
    if (s >= 0 && s < totalSteps.value) step.value = s;
  }

  // 选择创建模式并进入下一步
  function selectMode(mode: 'custom' | 'preset') {
    creationMode.value = mode;
    step.value = 1; // 进入车手信息步骤
  }

  // 调色盘操作
  function addMainColor() {
    if (palette.value.主色调.length < 4) {
      palette.value.主色调.push({ name: '', desc: '' });
    }
  }
  function removeMainColor(index: number) {
    if (palette.value.主色调.length > 2) {
      palette.value.主色调.splice(index, 1);
    }
  }
  function addDerived() {
    if (palette.value.衍生色.length < 5) {
      palette.value.衍生色.push('');
    }
  }
  function removeDerived(index: number) {
    if (palette.value.衍生色.length > 1) {
      palette.value.衍生色.splice(index, 1);
    }
  }

  // 五维调整（受点数池约束）
  function setStat(key: keyof FiveDimensions, value: number) {
    const clamped = Math.max(0, Math.min(100, value));
    const oldValue = stats.value[key];
    const delta = clamped - oldValue;

    // 如果增加点数，检查是否超出点数池
    if (delta > 0 && delta > remainingPoints.value) {
      // 只能分配剩余的点数
      stats.value[key] = oldValue + remainingPoints.value;
    } else {
      stats.value[key] = clamped;
    }
  }

  // 切换作弊模式
  function toggleCheatMode() {
    cheatMode.value = !cheatMode.value;
    // 如果切回正常模式且当前点数超出 350，需要按比例缩放
    if (!cheatMode.value && usedPoints.value > 350) {
      const ratio = 350 / usedPoints.value;
      const dims: (keyof FiveDimensions)[] = ['加速度', '极速', '操控', '漂移', '耐久'];
      dims.forEach(d => {
        stats.value[d] = Math.round(stats.value[d] * ratio);
      });
    }
  }

  /** 生成世界书条目内容（XML-wrapped YAML 格式）—— 仅自捏模式使用 */
  function generateWorldbookContent(): string {
    const name = mechGirl.value.name;
    const p = palette.value;
    const s = stats.value;

    const derivedLines = p.衍生色
      .filter(d => d.trim())
      .map((d, i) => `  衍生${i + 1}: ${d}`)
      .join('\n');

    const mainColorLines = p.主色调
      .map(c => `    ${c.name}: ${c.desc}`)
      .join('\n');

    const content = `<${name}>
---
基础信息:
  名称: ${name}
  原型: ${mechGirl.value.carModel}${mechGirl.value.carType ? `\n  赛车类型: ${mechGirl.value.carType}` : ''}${mechGirl.value.height ? `\n  身高: ${mechGirl.value.height}` : ''}${mechGirl.value.appearance ? `\n  外貌: ${mechGirl.value.appearance}` : ''}
  五维:
    加速度: ${s.加速度}
    极速: ${s.极速}
    操控: ${s.操控}
    漂移: ${s.漂移}
    耐久: ${s.耐久}
  共鸣技能: ${skill.value.name}

共鸣技能详情:
  技能名: ${skill.value.name}
  描述: ${skill.value.desc}

性格调色盘:
  底色: ${p.底色.name}
  底色描述: ${p.底色.desc}
  主色调:
${mainColorLines}
  点缀: ${p.点缀.name}
  点缀描述: ${p.点缀.desc}
${derivedLines ? `  衍生色:\n${derivedLines}` : ''}
</${name}>`;

    return content;
  }

  /** 构建 MVU stat_data */
  function buildStatData(
    mechName: string,
    mechCarModel: string,
    mechCarType: string,
    mechStats: FiveDimensions,
    mechSkill: ResonanceSkill,
  ): Record<string, any> {
    const teamName = driverTeamType.value === '独立' ? '独立' : driverTeam.value;

    return {
      世界: {
        当前时间: FIXED_INITIAL_TIME,
        当前地点: '晴空赛道 维修区',
        当前状态: openingState.value,
        天气: '晴',
      },
      主角: {
        车队: teamName,
        赛事等级: initialTier.value,
        赛季积分: 0,
        信用点数: initialCredits.value,
        改件仓库: [],
      },
      机娘库: {
        [mechName]: {
          _赛车型号: mechCarModel,
          _赛车类型: mechCarType,
          状态: '正常',
          五维: { ...mechStats },
          改装插槽: {
            槽位1: null,
            槽位2: null,
            槽位3: null,
          },
          共鸣: {
            技能名: mechSkill.name,
            技能描述: mechSkill.desc,
            已激活: false,
            当前共鸣值: 0,
            共鸣上限: 100,
          },
        },
      },
      当前比赛: {
        赛事名称: null,
        赛事类型: null,
        赛事级别: null,
        当前圈数: 0,
        总圈数: 0,
        当前排名: 0,
        搭档机娘: null,
        赛道状态: null,
        对手: {},
      },
    };
  }

  /** 将机娘信息写入世界书 + MVU 变量（自捏模式） */
  async function submitCustom() {
    const name = mechGirl.value.name;
    const content = generateWorldbookContent();

    // 获取角色卡绑定的世界书名称
    const charWorldbooks = getCharWorldbookNames('current');
    const worldbookName = charWorldbooks.primary;

    if (!worldbookName) {
      toastr.error('未找到角色卡绑定的世界书');
      return;
    }

    try {
      await deleteWorldbookEntries(worldbookName, entry => entry.name === name);
      await createWorldbookEntries(worldbookName, [
        {
          name: name,
          enabled: true,
          strategy: {
            type: 'constant',
            keys: [],
            keys_secondary: { logic: 'and_any', keys: [] },
            scan_depth: 'same_as_global',
          },
          position: {
            type: 'before_character_definition',
            role: 'system',
            depth: 0,
            order: 100,
          },
          content: content,
          probability: 100,
          recursion: {
            prevent_incoming: true,
            prevent_outgoing: true,
            delay_until: null,
          },
          effect: {
            sticky: null,
            cooldown: null,
            delay: null,
          },
        },
      ]);
      toastr.success(`机娘「${name}」档案已写入世界书！`);
    } catch (e) {
      console.error('写入世界书失败:', e);
      toastr.error('写入世界书失败，请检查角色卡绑定');
      return;
    }

    // 写入 MVU 变量
    try {
      await writeMvuData(
        name,
        mechGirl.value.carModel,
        mechGirl.value.carType,
        stats.value,
        skill.value,
      );
    } catch (e) {
      return;
    }

    submitted.value = true;
    await triggerOpening();
  }

  /** 将已有机娘信息写入 MVU 变量（选择模式），并启用对应世界书条目 */
  async function submitPreset() {
    const preset = selectedPreset.value;
    if (!preset) {
      toastr.error('请先选择一位机娘');
      return;
    }

    // 写入 MVU 变量
    try {
      await writeMvuData(preset.name, preset.carModel, preset.carType, preset.stats, preset.skill);
    } catch (e) {
      return;
    }

    // 启用选中机娘的世界书条目（必须在触发 AI 回复之前）
    try {
      await enableMechWorldbookEntry(preset.name);
    } catch (e) {
      // 即使启用失败也继续，已在函数内 toast 了错误
    }

    submitted.value = true;
    await triggerOpening();
  }

  /** 启用指定机娘的世界书条目 */
  async function enableMechWorldbookEntry(mechName: string) {
    const charWorldbooks = getCharWorldbookNames('current');
    const worldbookName = charWorldbooks.primary;

    if (!worldbookName) {
      toastr.error('未找到角色卡绑定的世界书，无法启用机娘条目');
      return;
    }

    try {
      await updateWorldbookWith(worldbookName, worldbook => {
        return worldbook.map(entry => {
          if (entry.name === mechName) {
            return { ...entry, enabled: true };
          }
          return entry;
        });
      });
      toastr.success(`机娘「${mechName}」世界书条目已启用！`);
      console.info(`[自捏开场] 已启用世界书条目: ${mechName}`);
    } catch (e) {
      console.error(`启用世界书条目「${mechName}」失败:`, e);
      toastr.error(`启用机娘「${mechName}」的世界书条目失败`);
      throw e;
    }
  }

  /** 写入 MVU 变量到最新楼层 */
  async function writeMvuData(
    mechName: string,
    mechCarModel: string,
    mechCarType: string,
    mechStats: FiveDimensions,
    mechSkill: ResonanceSkill,
  ) {
    try {
      await waitGlobalInitialized('Mvu');

      const messageId = getCurrentMessageId();
      const mvuData = Mvu.getMvuData({ type: 'message', message_id: messageId });

      const statData = buildStatData(mechName, mechCarModel, mechCarType, mechStats, mechSkill);
      _.set(mvuData, 'stat_data', statData);
      await Mvu.replaceMvuData(mvuData, { type: 'message', message_id: messageId });

      toastr.success('变量已写入当前楼层！');
      console.info(`[自捏开场] MVU 变量已写入楼层 ${messageId}，搭档: ${mechName}，状态: ${openingState.value}`);
    } catch (e) {
      console.error('写入 MVU 变量失败:', e);
      toastr.error('写入变量失败，请确认 MVU 变量框架已启用');
      throw e;
    }
  }

  /** 触发 AI 生成开场白 */
  async function triggerOpening() {
    if (openingDirection.value.trim()) {
      try {
        const userMessage = openingDirection.value.trim();
        await createChatMessages([{ role: 'user', message: userMessage }]);
        toastr.info('正在生成开场白…');
        await generate({ user_input: '', should_stream: true });
      } catch (e) {
        console.error('触发 AI 回复失败:', e);
        toastr.error('AI 回复生成失败');
      }
    }
  }

  // 兼容旧接口
  async function submitToWorldbook() {
    if (creationMode.value === 'preset') {
      await submitPreset();
    } else {
      await submitCustom();
    }
  }

  return {
    step,
    totalSteps,
    creationMode,
    driverTeam,
    driverTeamType,
    initialCredits,
    initialTier,
    openingState,
    mechGirl,
    palette,
    stats,
    skill,
    cheatMode,
    pointPool,
    usedPoints,
    remainingPoints,
    selectedPresetIndex,
    selectedPreset,
    openingDirection,
    submitted,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid,
    isPresetSelected,
    nextStep,
    prevStep,
    goToStep,
    selectMode,
    addMainColor,
    removeMainColor,
    addDerived,
    removeDerived,
    setStat,
    toggleCheatMode,
    generateWorldbookContent,
    submitToWorldbook,
    submitCustom,
    submitPreset,
  };
});
