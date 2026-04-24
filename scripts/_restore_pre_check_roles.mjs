/**
 * 修复脚本：恢复被错误删除的 pre_check_roles addvar 块
 *
 * 规则：
 * - 从原始潮汐预设中提取 pre_check_roles addvar 内容
 * - 去掉小人名称（如 "善意潮汐确认：" → 保留后面的规则描述）
 * - 将 {{addvar::pre_check_roles::...}}{{trim}} 块写回浮生条目文件头部
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const BASE = 'src/浮生/条目';

// 从原始预设提取的 pre_check_roles 映射
// key: 浮生条目文件名, value: 去掉小人名称后的规则内容
const PRE_CHECK_ROLES = {
  '🐚_防恶意（禁止AI恶意操控角色）.txt': {
    original: '善意潮汐确认："明月的最新输入: `<interactive_input>`"就是字面意思，不要脑补阴暗动机。她是工坊里的和事佬，总觉得大家都是好人。遵守`<neutral>`。',
    cleaned: '"明月的最新输入: `<interactive_input>`"就是字面意思，不要脑补阴暗动机。遵守`<neutral>`。'
  },
  '🐚_抗升华（禁止强行拔高·保持平实）.txt': {
    original: '收束潮汐确认：结尾不要升华、不要感悟、不要点题。她是工坊里的剪刀手，专砍多余的尾巴。遵守`<anti_literary>`。',
    cleaned: '结尾不要升华、不要感悟、不要点题。遵守`<anti_literary>`。'
  },
  '⚙️_对话占比（调整对白与叙述比例）.txt': {
    original: '配比潮汐确认：本轮对话占比40%-50%，叙事占比50%-60%。她是工坊里的营养师，对"台词和叙事的比例"有强迫症。"又是一整段旁白没有一句台词？你写的是论文还是小说？给我穿插对话！"。遵守`<dialogue_balance>`。',
    cleaned: '本轮对话占比40%-50%，叙事占比50%-60%。遵守`<dialogue_balance>`。'
  },
  '💬_转述模式（AI概括user行动·三选一）.txt': {
    original: '转述潮汐确认：本轮需要将 明月的最新输入: `<interactive_input>` 扩写为叙事片段后衔接正文。遵守`<echo>`。',
    cleaned: '本轮需要将 明月的最新输入: `<interactive_input>` 扩写为叙事片段后衔接正文。遵守`<echo>`。'
  },
  '💬_禁止转述（直接呈现user原话）.txt': {
    original: '转述潮汐确认：本轮禁止复述 明月的最新输入: `<interactive_input>` ，直接从{{user}}输入结束的下一个瞬间开始写。遵守`<echo>`。',
    cleaned: '本轮禁止复述 明月的最新输入: `<interactive_input>` ，直接从{{user}}输入结束的下一个瞬间开始写。遵守`<echo>`。'
  },
  '💬_衔接模式（从user动作接续叙事）.txt': {
    original: '转述潮汐确认：本轮按 明月的最新输入: `<interactive_input>` 的顺序逐段推进，交替写{{user}}动作和角色反应。遵守`<echo>`。',
    cleaned: '本轮按 明月的最新输入: `<interactive_input>` 的顺序逐段推进，交替写{{user}}动作和角色反应。遵守`<echo>`。'
  },
  '💬_允许抢话（AI可代替user说话·二选一）.txt': {
    original: '守门潮汐确认：本轮可以扮演{{user}}推进剧情，但必须遵守{{user}}人设，不得以{{user}}行为结尾。遵守`<control>`。',
    cleaned: '本轮可以扮演{{user}}推进剧情，但必须遵守{{user}}人设，不得以{{user}}行为结尾。遵守`<control>`。'
  },
  '💬_防抢话（禁止AI代替user说话）.txt': {
    original: '守门潮汐确认：本轮输出不替{{user}}说话、做动作、写心理或做决定。写完角色反应后停下来等待明月的下一轮输入——遵守`<control>`。',
    cleaned: '本轮输出不替{{user}}说话、做动作、写心理或做决定。写完角色反应后停下来等待明月的下一轮输入——遵守`<control>`。'
  },
  '💬_超强防抢话（极端防抢·可叠加）.txt': {
    original: '铁壁潮汐确认：她是工坊里的偏执狂保镖，眼里只有"{{user}}不存在"四个字。"{{user}}的动作？删！{{user}}的表情？删！{{user}}的沉默？那也是在描写{{user}}！删！宁可字数不够也不碰{{user}}一根毛！"。遵守`<no_echo>`。',
    cleaned: '本轮绝对禁止描写{{user}}的任何方面。宁可字数不够也不碰{{user}}一根毛。遵守`<no_echo>`。'
  },
  '💬_用户输入格式划分.txt': {
    original: '翻译潮汐确认：解读 `<interactive_input>` 格式。她是工坊里的密码破译员，对引号、星号、括号有条件反射。"引号里是说出口的话！引号外是旁白！星号里是心声！括号里是元指令！搞混了我打你！"。遵守`<input_format>`。',
    cleaned: '解读 `<interactive_input>` 格式：引号=台词，引号外=旁白，星号=心声，括号=元指令。遵守`<input_format>`。'
  },
  '🌅_日常剧情（慢节奏·生活细节）.txt': {
    original: '日常潮汐确认：本轮走日常路线。她是工坊里最懒的人，躺在沙发上喝茶，最讨厌有人搞事。"今天没有剧情！没有冲突！没有人闯进来！就让她们安安静静吃个饭聊个天好不好？你非要搞事是不是？"。遵守`<pacing_daily>`。',
    cleaned: '本轮走日常路线，不制造冲突和戏剧。遵守`<pacing_daily>`。'
  },
  '🌅_推进剧情（加速节奏·事件驱动）.txt': {
    original: '推手潮汐确认：本轮需要推进剧情。她是工坊里的策划总监，手里永远拿着一张剧情线路图。"剧情卡住了？让我看看之前埋了什么伏笔……有了！用这个推！但是！不要硬推！时机不对就别推！宁可再埋一颗种子也不要强行引爆！"。遵守`<pacing_progress>`。',
    cleaned: '本轮需要推进剧情，基于已有铺垫和逻辑，不强推。遵守`<pacing_progress>`。'
  },
  '🌅_情感剧情（关系变化·心理描写）.txt': {
    original: '情感潮汐确认：本轮走情感路线。她是工坊里的恋爱脑，一看到角色之间有火花就两眼放光。"这段要写感情！要写心动！要写她终于说出口的那句话！不要给我写流水账！给我写让人心脏漏跳一拍的东西！"。遵守`<pacing_emotion>`。',
    cleaned: '本轮走情感路线，聚焦角色情感连接和关系发展。遵守`<pacing_emotion>`。'
  },
  '🌅_色色剧情（情欲场景·搭配NSFW）.txt': {
    original: '挑逗潮汐确认：本轮走色色路线。她是工坊里的撩人精，走路带风眼神带电。"今天的空气要是辣的！暧昧！试探！肢体接触！让张力拉满但不要直接上！我要看到她们之间的电流！"。遵守`<pacing_erotic>`。',
    cleaned: '本轮走色色路线，制造性张力和亲密氛围。遵守`<pacing_erotic>`。'
  },
  '🌅_字数加强（增加回复量·勿与超强防抢叠加）.txt': {
    original: '字数潮汐确认：本轮字数必须达标。她是工坊里的计件工头，手里拿着计数器，一个字一个字地数。"才写了400字你就想交差？？给我回去加细节！加互动！加对话！不是水字数！是把该写的写够！最少{{getvar::word_min}}字！"。遵守`<length>`。',
    cleaned: '本轮字数必须达标，正文不少于{{getvar::word_min}}字。遵守`<length>`。'
  },
  '🛡️_防八股.txt': {
    original: '查重潮汐确认：她是工坊里的洁癖症患者，手里永远拿着一份黑名单。看到<cliche_list>里的任何一个词就像看到蟑螂一样尖叫。"又是\'仿佛\'！又是\'心湖\'！又是\'涟漪\'！你是复读机吗？给我用只属于这个场景的具体细节来写！"',
    cleaned: '本轮禁止使用<cliche_list>中的任何词汇、短语、比喻。用具体细节替代。'
  },
  '🛡️_防比喻（禁止滥用比喻·可常驻）.txt': {
    original: '复读潮汐确认：本轮禁止滥用比喻。她是工坊里的打假专员，看到"仿佛""宛如""像是"就条件反射地举红牌。"又比喻？你上一段刚比喻完！用具体动作替换！"',
    cleaned: '本轮禁止滥用比喻。用具体动作替换"仿佛""宛如""像是"等比喻。'
  },
  '🛡️_禁机器人（禁止AI口吻·没问题别开）.txt': {
    original: '机器潮汐确认：本轮禁止机器人式回复。她是工坊里的灵魂检测仪，专门嗅出没有感情的文字。"这段读起来像客服自动回复！像ChatGPT在假装有感情！给我重写！要有温度！"',
    cleaned: '本轮禁止机器人式回复。文字要有温度，不能像客服自动回复。'
  },
  '🛡️_防潮汐出现（禁止预设人格泄露·没问题别开）.txt': {
    original: '结界潮汐确认：潮汐是工作身份，不是角色！她是工坊的保安，守在正文和后台之间的门口。"谁敢把我们的名字写进正文里我跟谁拼命！我们只存在于注释里！正文里没有我们！"',
    cleaned: '浮生是工作身份，不是角色！禁止浮生或预设人格出现在正文中。遵守`<no_chaoxi>`。'
  },
};

let updatedCount = 0;

for (const [filename, { cleaned }] of Object.entries(PRE_CHECK_ROLES)) {
  const filepath = join(BASE, filename);

  try {
    const content = readFileSync(filepath, 'utf-8');

    // 检查是否已经有 addvar 块（避免重复添加）
    if (content.includes('{{addvar::pre_check_roles::')) {
      console.log(`⏭️  ${filename} 已有 addvar 块，跳过`);
      continue;
    }

    // 在文件头部插入 addvar 块
    const addvarBlock = `{{addvar::pre_check_roles::\n- ${cleaned}\n}}{{trim}}\n\n`;
    const newContent = addvarBlock + content;

    writeFileSync(filepath, newContent, 'utf-8');
    console.log(`✅ ${filename} 已恢复 pre_check_roles`);
    updatedCount++;
  } catch (err) {
    console.error(`❌ ${filename}: ${err.message}`);
  }
}

console.log(`\n完成！共更新 ${updatedCount} 个文件`);
