// ===== 箱庭密室·大型交互脚本 =====
// 5层结构 + 连锁反应 + 3结局
//
// 第一层·起始之间：双人卧室（教学关）
// 第二层·记忆走廊：照片墙长廊（解谜关 + 合作/独行分支）
// 第三层·机关庭院：露天庭院+喷泉（物理谜题 + 信任抉择）
// 第四层·镜之间：镜子迷宫（心理关 + 箱庭真相）
// 第五层·最终之门：三扇门（结局选择）
//
// 结局A·并肩黎明：信任始高 + 合作多 + 始心墙低 → 两人并肩走出
// 结局B·独行者：独立行动多 + 信任始低 → 独自离开，始留在箱庭
// 结局C·留在箱庭：发现真相 + 选择留下 → 两人留在箱庭生活

const InteractFunctionName = 'interact';

function unregisterFunction() {
  SillyTavern.unregisterFunctionTool(InteractFunctionName);
}

async function getLastValidVariable(message_id: number): Promise<any> {
  return (
    structuredClone(
      _(SillyTavern.chat)
        .slice(0, message_id + 1)
        .map((chat_message: any) => _.get(chat_message, ['variables', chat_message.swipe_id ?? 0]))
        .findLast((variables: any) => _.has(variables, 'stat_data')),
    ) ?? getVariables()
  );
}

function fmtOutput(action: string, var_update: string): string {
  return `{请以第三者视角复述下面的内容：${action}}{在回复的 <UpdateVariable> 中增加内容: ${var_update}}`;
}

/** 房间转移时，脚本直接将新场景物品写入变量（不依赖 AI） */
function transitionToRoom(roomName: string, variables: any): void {
  const newScene = ROOM_SCENES[roomName];
  if (!newScene) return;
  // 直接修改 variables 对象中的场景物品和当前房间（稍后在 action 里统一写回）
  _.set(variables, 'stat_data.场景物品', structuredClone(newScene));
  _.set(variables, 'stat_data.当前房间', roomName);
  const unlocked: string[] = _.get(variables, 'stat_data.已解锁房间', []);
  if (!unlocked.includes(roomName)) {
    unlocked.push(roomName);
  }
}

// ===== 房间场景数据（进入新房间时替换场景物品） =====

const ROOM_SCENES: Record<string, any[]> = {
  '第一层·起始之间': [
    {
      name: '柜子',
      description: '白色木质柜子，表面光滑无缝设计。门板配有触控开关，轻触即可弹开。',
      interactions: [{ '打开': '调用工具 interact, 以参数 name: 柜子, action: 打开' }],
    },
    {
      name: '柜子上的电脑',
      description: '薄型笔记本电脑，深灰金属外壳，屏幕背面有眼睛状Logo。当前处于关机状态。',
      interactions: [{ '使用': '调用工具 interact, 以参数 name: 柜子上的电脑, action: 开机' }],
    },
    {
      name: '桌子',
      description: '极简木质桌台，浅灰色桌面平整光洁。两侧各有一个抽屉。',
      interactions: [{ '打开': '调用工具 interact, 以参数 name: 桌子, action: 打开' }],
    },
    {
      name: '通风管',
      description: '天花板上的通风管，覆盖金属网格，有微弱空气流通。管道直径可容一人匍匐通过。',
      interactions: [{ '观察': '调用工具 interact, 以参数 name: 通风管, action: 观察' }],
    },
    {
      name: '带锁的门',
      description: '厚重防盗门，门把手下方镶嵌数字密码面板。这扇门看起来异常坚固。',
      interactions: [{ '解锁': '调用工具 interact, 以参数 name: 带锁的门, action: 解锁' }],
    },
    {
      name: '双人床',
      description: '1.8米×2.0米双人床，两个枕头分别印着"YES!"和"NO!"字样。床下似乎可以查看。',
      interactions: [{ '查看床下': '调用工具 interact, 以参数 name: 双人床, action: 查看床下' }],
    },
  ],

  '第二层·记忆走廊': [
    {
      name: '照片墙',
      description: '走廊两侧挂满了照片，都是始和{{user}}的合照——但有些场景你从未经历过。照片下方各有一行小字标注日期。',
      interactions: [{ 仔细查看: '调用工具 interact, 以参数 name: 照片墙, action: 仔细查看' }],
    },
    {
      name: '裂缝照片',
      description: '墙上有一张照片的玻璃碎裂了，照片内容模糊不清。碎片散落在地上，似乎可以拼凑。',
      interactions: [{ 拼凑碎片: '调用工具 interact, 以参数 name: 裂缝照片, action: 拼凑碎片' }],
    },
    {
      name: '走廊尽头的岔路',
      description:
        '走廊尽头分成两条路。左边挂着"共同前进"的牌子，通道较窄需要两人侧身挤过；右边挂着"独自探索"的牌子，通道宽敞但漆黑一片。',
      interactions: [
        { '走左边（一起）': '调用工具 interact, 以参数 name: 走廊尽头的岔路, action: 走左边' },
        { '走右边（独自）': '调用工具 interact, 以参数 name: 走廊尽头的岔路, action: 走右边' },
      ],
    },
    {
      name: '地板上的信封',
      description: '一个淡黄色信封掉在走廊中段的地板上，封口处盖着一枚向阳纹的蜡封。',
      interactions: [{ 打开: '调用工具 interact, 以参数 name: 地板上的信封, action: 打开' }],
    },
  ],

  '第三层·机关庭院': [
    {
      name: '枯竭喷泉',
      description:
        '庭院中央是一座石质喷泉，底部干涸。喷泉顶端是一尊双人雕像——两个人背靠背站立。雕像底座有一个六角形凹槽。',
      interactions: [{ 检查凹槽: '调用工具 interact, 以参数 name: 枯竭喷泉, action: 检查凹槽' }],
    },
    {
      name: '齿轮箱',
      description: '庭院角落有一个暴露在外的齿轮箱，里面的齿轮缺了两个。齿轮箱连接着地下的某种管道系统。',
      interactions: [{ 检查: '调用工具 interact, 以参数 name: 齿轮箱, action: 检查' }],
    },
    {
      name: '藤蔓墙',
      description: '庭院北侧的墙壁被浓密的藤蔓覆盖。藤蔓底下隐约有什么东西的轮廓。需要两个人合力才能拨开这么多藤蔓。',
      interactions: [
        { 合力拨开: '调用工具 interact, 以参数 name: 藤蔓墙, action: 合力拨开' },
        { 独自尝试: '调用工具 interact, 以参数 name: 藤蔓墙, action: 独自尝试' },
      ],
    },
    {
      name: '石板地面',
      description: '庭院的石板地面刻有复杂的沟槽图案，似乎是某种水路系统。如果喷泉启动，水会沿着沟槽流动。',
      interactions: [{ 研究图案: '调用工具 interact, 以参数 name: 石板地面, action: 研究图案' }],
    },
    {
      name: '日晷',
      description: '庭院南侧立着一座日晷，但指针缺失。日晷底座刻着文字："当影子指向真心，路便显现。"',
      interactions: [{ 阅读铭文: '调用工具 interact, 以参数 name: 日晷, action: 阅读铭文' }],
    },
  ],

  '第四层·镜之间': [
    {
      name: '入口之镜',
      description: '一面巨大的落地镜，但镜中的倒影不太对——镜中的始在微笑，但现实中的始没有。镜子边缘刻着细小的文字。',
      interactions: [{ 阅读文字: '调用工具 interact, 以参数 name: 入口之镜, action: 阅读文字' }],
    },
    {
      name: '回忆碎片·神社',
      description: '一面镜子里映出神社的画面——始在许愿，嘴唇在动。如果凑近能读出她在说什么。',
      interactions: [{ 凑近读唇: '调用工具 interact, 以参数 name: 回忆碎片·神社, action: 凑近读唇' }],
    },
    {
      name: '真相之镜',
      description:
        '走廊最深处的一面黑色镜子，不反射任何东西。镜面像一扇窗户，但窗户后面是完全的黑暗。触碰它似乎会触发什么。',
      interactions: [
        { 触碰: '调用工具 interact, 以参数 name: 真相之镜, action: 触碰' },
        { 和始一起触碰: '调用工具 interact, 以参数 name: 真相之镜, action: 和始一起触碰' },
      ],
    },
    {
      name: '碎裂走廊',
      description: '地面散落着镜子碎片，反射出不同角度的光线。碎片似乎可以拼成什么图案。',
      interactions: [{ 拼凑碎片: '调用工具 interact, 以参数 name: 碎裂走廊, action: 拼凑碎片' }],
    },
  ],

  '第五层·最终之门': [
    {
      name: '黎明之门',
      description:
        '左侧的门，表面镀着温暖的金色。门上刻着两个人并肩行走的浮雕。门把手是两个交握的手的造型，需要两个人同时握住才能打开。',
      interactions: [{ 和始一起打开: '调用工具 interact, 以参数 name: 黎明之门, action: 和始一起打开' }],
    },
    {
      name: '独行之门',
      description: '右侧的门，冰冷的银色金属。门上只有一个标准门把手，单人即可操作。门上方刻着"自由"二字。',
      interactions: [{ 独自打开: '调用工具 interact, 以参数 name: 独行之门, action: 独自打开' }],
    },
    {
      name: '无名之门',
      description:
        '中央一扇不起眼的木门，看起来像普通的房间门。没有任何装饰，但门缝里透出温暖的光。只有发现了箱庭的秘密才会注意到这扇门的特别之处。',
      interactions: [{ 推开: '调用工具 interact, 以参数 name: 无名之门, action: 推开' }],
    },
    {
      name: '石碑',
      description: '三扇门前的地面中央立着一块石碑，上面刻着文字。',
      interactions: [{ 阅读: '调用工具 interact, 以参数 name: 石碑, action: 阅读' }],
    },
  ],
};

function registerFunction() {
  const { registerFunctionTool } = SillyTavern;
  if (!registerFunctionTool) {
    console.debug('Hajime: function tools are not supported');
    return;
  }

  const interactSchema = Object.freeze({
    $schema: 'http://json-schema.org/draft-04/schema#',
    type: 'object',
    additionalProperties: false,
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        description: '将要进行交互的物品，使用"name"中的内容',
      },
      action: {
        type: 'string',
        minLength: 1,
        description: '进行的操作类型',
      },
    },
    required: ['name'],
  });

  registerFunctionTool({
    name: InteractFunctionName,
    displayName: 'Interact',
    stealth: false,
    description: '当 interactions 中的对应操作指定了此工具时调用。调用需要严格按照 interactions[] 里的描述',
    parameters: interactSchema,
    action: async (args: any) => {
      if (!args?.name) return '';
      const targetObj: string = args.name;
      const targetAction: string = args.action || '交互';
      const message_id = getLastMessageId();
      const chat_message = getChatMessages(message_id).at(-1);
      if (!chat_message) return '';

      const username = substitudeMacros('{{user}}');
      const variables = await getLastValidVariable(message_id);
      await setChatMessages([{ message_id, data: variables }], { refresh: 'none' });

      if (!_.has(variables, 'stat_data')) {
        console.error(`cannot find stat_data for ${message_id}`);
        return '';
      }

      const stat = variables.stat_data;
      const playerItems: any[] = _.get(stat, '主角.持有物品', []);
      const sceneItems: any[] = _.get(stat, '场景物品', []);
      const currentRoom: string = _.get(stat, '当前房间', '第一层·起始之间');
      const secrets: string[] = _.get(stat, '选择记录.发现的秘密', []);

      const hasItem = (name: string) => playerItems.some((item: any) => item.name === name);
      const sceneItem = sceneItems.find((item: any) => item.name === targetObj);
      const playerItem = playerItems.find((item: any) => item.name === targetObj);

      let result = '';

      // ╔══════════════════════════════════════╗
      // ║        第一层·起始之间               ║
      // ╚══════════════════════════════════════╝
      if (currentRoom === '第一层·起始之间') {
        switch (targetObj) {
          case '柜子': {
            if (targetAction === '打开') {
              if (hasItem('铜钥匙')) return '柜子里已经空了。';
              return fmtOutput(
                `始轻触门板开关，柜门弹开。里面放着一把铜钥匙和一张折叠的纸条。始取出后先检查纸条。`,
                `insert 铜钥匙 到 主角.持有物品：description "古铜色小钥匙，齿纹复杂"，interactions [{"使用":"调用工具 interact, 以参数 name: 铜钥匙, action: 使用"}]。insert 纸条 到 主角.持有物品：description "白色纸条，钢笔写着7-3-9-1"，interactions [{"阅读":"调用工具 interact, 以参数 name: 纸条, action: 阅读"}]`,
              );
            }
            break;
          }

          case '桌子': {
            if (targetAction === '打开') {
              if (hasItem('储蓄罐')) return '抽屉里只剩无用文具。';
              return fmtOutput(
                `始拉开右侧抽屉，发现一个猪形储蓄罐。摇了摇，里面有纸面摩擦的沙沙声。左侧抽屉只有文具。`,
                `insert 储蓄罐 到 主角.持有物品：description "猪形陶瓷储蓄罐，摇动有沙沙声"，interactions [{"破坏":"调用工具 interact, 以参数 name: 储蓄罐, action: 破坏"},{"摇晃":"调用工具 interact, 以参数 name: 储蓄罐, action: 摇晃"}]`,
              );
            }
            break;
          }

          case '柜子上的电脑': {
            if (targetAction === '开机' || targetAction === '使用') {
              return fmtOutput(
                `始按下电源键，屏幕显示四位数字密码登录界面。`,
                `更新 场景物品 中柜子上的电脑 description 增加"已开机，显示四位数字密码登录界面"。更新 interactions 为 [{"输入密码":"调用工具 interact, 以参数 name: 柜子上的电脑, action: 输入密码"}]`,
              );
            }
            if (targetAction === '输入密码') {
              if (hasItem('纸条')) {
                return fmtOutput(
                  `始输入纸条上的"7-3-9-1"，登录成功。桌面只有一个"提示"文件夹，里面是房间俯视图，红色标记通风管位置，旁边写着"出口不在门上"。此外还有一行小字："这只是开始。"`,
                  `更新 始.线索 为"电脑提示：出口不在门上，通风管被特别标记。另有暗示：这只是开始"。更新 始.当前所想 为"出口不在门上……通风管？但那只是开始是什么意思？"`,
                );
              }
              return '密码框等待输入，但你还不知道密码。先找找线索。';
            }
            break;
          }

          case '通风管': {
            if (targetAction === '观察') {
              return fmtOutput(
                `始抬头观察通风管。金属网格松动，有合适工具可拆。管道内有微弱光线，直径足够匍匐通过。但通风管在天花板上，需要垫脚。`,
                `更新 始.线索 增加"通风管网格松动可拆卸，管道可通行，需工具+垫脚"。更新 场景物品 中通风管 interactions 为 [{"拆卸":"调用工具 interact, 以参数 name: 通风管, action: 拆卸"}]`,
              );
            }
            if (targetAction === '拆卸') {
              if (!hasItem('铜钥匙')) return '网格用螺丝固定，手拧不动。需要工具。';
              return fmtOutput(
                `始用铜钥匙尖端拧下螺丝，网格被拆下。管道口敞开，有光线和凉风。站在桌子上刚好能够到。`,
                `remove 主角.持有物品 中的铜钥匙。更新 场景物品 中通风管 description 为"网格已拆，管道口敞开，站在桌子上可够到"。更新 interactions 为 [{"进入":"调用工具 interact, 以参数 name: 通风管, action: 进入"}]`,
              );
            }
            if (targetAction === '进入') {
              transitionToRoom('第二层·记忆走廊', variables);
              result = fmtOutput(
                `始搬桌子到通风管下方。"我先上去确认安全，然后拉你。"她踩上桌子，双手撑住管道口边缘，翻身进去。几秒后她的手从管道口伸出来："安全的，抓住我。"${username}抓住她的手被拉上去。管道匍匐前进了约十米，尽头突然开阔——通向一条挂满照片的走廊。`,
                `更新 始.当前位置 为"第二层·记忆走廊"。更新 时间 为"09:35"。delta 选择记录.合作行动次数 +1。delta 选择记录.信任始 +5。更新 始.当前所想 为"第一层通关了……但这条走廊上的照片是怎么回事？有些场景我完全没有印象"。更新 始.情绪状态.arousal 为0.5`,
              );
              await setChatMessages([{ message_id, data: variables }], { refresh: 'none' });
              return result;
            }
            break;
          }

          case '带锁的门': {
            if (targetAction === '解锁') {
              return fmtOutput(
                `密码面板亮起等待输入。始尝试了几个组合都不对。她退后一步看着这扇门，皱了皱眉："这扇门……太厚了。就算知道密码，打开以后也许不是我们想去的地方。"`,
                `更新 始.线索 增加"正门密码未知，且门体异常坚固，可能是陷阱或死路"`,
              );
            }
            break;
          }

          case '双人床': {
            if (targetAction === '查看床下') {
              return fmtOutput(
                `始趴在地上往床下看。床下角落里有一个小小的六角形金属块，表面刻着精细的向阳纹图案——和始发带上的纹样一模一样。始把它取出来，表情微妙地变了一下："这个纹样……为什么会在这里？"`,
                `insert 六角形金属块 到 主角.持有物品：description "小型六角形金属块，表面刻有向阳纹图案，与始的发带纹样一致。用途不明"，interactions [{"使用":"调用工具 interact, 以参数 name: 六角形金属块, action: 使用"}]。insert "床下发现带有始的纹样的金属块" 到 选择记录.发现的秘密。delta 选择记录.始的心墙 -5`,
              );
            }
            break;
          }

          case '储蓄罐': {
            if (targetAction === '破坏') {
              return fmtOutput(
                `储蓄罐摔碎，掉出一张纸片——简笔画画着一个人站在桌子上够天花板通风口，箭头指向上方。`,
                `remove 主角.持有物品 中的储蓄罐。insert 提示图 到 主角.持有物品：description "简笔画：站在桌子上够通风口"，interactions [{"阅读":"调用工具 interact, 以参数 name: 提示图, action: 阅读"}]。更新 始.线索 增加"通风管是逃脱路线"`,
              );
            }
            if (targetAction === '摇晃') {
              return '里面有纸面摩擦的沙沙声。打破它也许能看到内容。';
            }
            break;
          }

          case '纸条': {
            if (targetAction === '阅读') return '纸条上写着四个数字："7-3-9-1"。';
            break;
          }

          case '提示图': {
            if (targetAction === '阅读') return '简笔画暗示逃脱路线：把桌子搬到通风管下面，从通风管离开。';
            break;
          }
        }
      }

      // ╔══════════════════════════════════════╗
      // ║        第二层·记忆走廊               ║
      // ╚══════════════════════════════════════╝
      if (currentRoom === '第二层·记忆走廊') {
        switch (targetObj) {
          case '照片墙': {
            if (targetAction === '仔细查看') {
              return fmtOutput(
                `始站在照片墙前，表情从好奇变成了困惑。照片都是她和${username}的合照，但有几张场景她完全没有印象——游乐园的过山车、海边的烟花、图书馆里两人头靠头看同一本书。"这些……是什么时候拍的？"她回头看${username}，眼神里第一次出现了不安。她的手指在裙摆上攥了一下，然后放开。"不对，有些日期标注的是未来的日期——这不是回忆，这是……"她没说完。`,
                `insert "照片墙上有未来日期的合照，这些记忆不属于现实" 到 选择记录.发现的秘密。delta 选择记录.始的心墙 -5。更新 始.情绪状态.pleasure 为-0.2。更新 始.情绪状态.arousal 为0.6。更新 始.当前所想 为"这些照片……有些是还没发生的事。这个地方在制造我们的'记忆'？"`,
              );
            }
            break;
          }

          case '裂缝照片': {
            if (targetAction === '拼凑碎片') {
              return fmtOutput(
                `两人蹲下来拼凑碎片。拼了一半，始突然停下来了——碎片拼出的照片是始一个人站在神社前，双手合十，嘴唇微动。照片捕捉的正是她许愿的那一刻。始的指尖在碎片边缘停住了，她盯着照片里自己的嘴型，慢慢低下头。"……这是我的愿望被听见的那天。"她的声音很轻。`,
                `insert "神社许愿被记录成照片，箱庭与始的愿望有关" 到 选择记录.发现的秘密。delta 选择记录.始的心墙 -10。更新 始.情绪状态.pleasure 为-0.3。更新 始.情绪状态.dominance 为0.1。更新 始.当前所想 为"我的愿望……是'并肩'。难道这个地方是因为我的愿望才……"。delta 选择记录.合作行动次数 +1`,
              );
            }
            break;
          }

          case '地板上的信封': {
            if (targetAction === '打开') {
              return fmtOutput(
                `始认出了蜡封上的向阳纹——和她发带上的一样。她拆开信封，里面是一张信笺，字迹工整却不是任何她认识的人写的：\n\n"致旅者：\n你们的每一次选择都在编织出口的形状。信任不是给予，是用并肩的行动一步步证明的。第三层需要你们的双手，第四层需要你们的真心。\n\n——来自你已经做出的选择"\n\n始把信读了两遍，把它折好放进口袋。`,
                `insert 箱庭信笺 到 主角.持有物品：description "向阳纹蜡封信笺，提到信任需要并肩行动证明，第三层需双手，第四层需真心"，interactions [{"重读":"调用工具 interact, 以参数 name: 箱庭信笺, action: 重读"}]。insert "箱庭信笺暗示选择决定出口形状" 到 选择记录.发现的秘密`,
              );
            }
            break;
          }

          case '走廊尽头的岔路': {
            if (targetAction === '走左边') {
              // 合作路线：两人侧身挤过窄通道
              transitionToRoom('第三层·机关庭院', variables);
              result = fmtOutput(
                `始看了看窄通道，又看了看${username}。"这个宽度……需要侧身，而且得两个人互相扶着才不会卡住。"她先侧身进去，伸出手。通道很窄，两人的距离近得能感受到彼此的呼吸。始的肩膀贴着${username}的胸口，她的耳尖红了，但语气依然是清单模式的："脚下小心，地面有台阶。"\n通道尽头豁然开朗——一座露天庭院，中央是一座干涸的喷泉。阳光从没有天花板的上方洒下来。始抬头看着天空，深吸了一口气："终于有新鲜空气了。"`,
                `更新 始.当前位置 为"第三层·机关庭院"。更新 时间 为"10:15"。delta 选择记录.合作行动次数 +2。delta 选择记录.信任始 +10。delta 选择记录.始的心墙 -8。更新 始.情绪状态.affinity 为0.4。更新 始.情绪状态.pleasure 为0.3。更新 始.当前所想 为"在那个通道里……太近了。但是……并不讨厌"`,
              );
              await setChatMessages([{ message_id, data: variables }], { refresh: 'none' });
              return result;
            }
            if (targetAction === '走右边') {
              // 独行路线：{{user}}独自走入黑暗通道
              transitionToRoom('第三层·机关庭院', variables);
              result = fmtOutput(
                `${username}选择了右边的通道。始站在原地，手伸了一半又放下来。"……好。"她的声音有一瞬间的空白。"你从右边走，我——我去左边看看有没有汇合点。"\n黑暗通道里${username}独自前行，地面平坦但伸手不见五指。走了大约一分钟后，通道通向了同一座露天庭院。始已经先到了，她站在喷泉旁，背对着通道口。听到脚步声她转过来，表情已经整理好了："那边通道畅通。这里是——某种庭院。"她的声音恢复了第一面的节奏，但语速比平时快了一点。`,
                `更新 始.当前位置 为"第三层·机关庭院"。更新 时间 为"10:15"。delta 选择记录.独立行动次数 +2。delta 选择记录.信任始 -5。delta 选择记录.始的心墙 +5。更新 始.情绪状态.pleasure 为-0.1。更新 始.情绪状态.affinity 为-0.1。更新 始.情绪状态.dominance 为0.2。更新 始.当前所想 为"选择了独自走……嗯，那也是一种合理的策略选择。对吧？"`,
              );
              await setChatMessages([{ message_id, data: variables }], { refresh: 'none' });
              return result;
            }
            break;
          }

          case '箱庭信笺': {
            if (targetAction === '重读')
              return '信笺内容："致旅者：你们的每一次选择都在编织出口的形状。信任不是给予，是用并肩的行动一步步证明的。第三层需要你们的双手，第四层需要你们的真心。——来自你已经做出的选择"';
            break;
          }
        }
      }

      // ╔══════════════════════════════════════╗
      // ║        第三层·机关庭院               ║
      // ╚══════════════════════════════════════╝
      if (currentRoom === '第三层·机关庭院') {
        switch (targetObj) {
          case '枯竭喷泉': {
            if (targetAction === '检查凹槽') {
              return fmtOutput(
                `始蹲下检查喷泉底座的六角形凹槽。她的手指描着凹槽边缘，突然顿住了——"这个形状……"她回头看${username}的口袋方向，眼睛亮了。"六角形，和我们在床下找到的金属块一样。"`,
                `更新 始.线索 为"喷泉底座的六角形凹槽可能匹配床下找到的六角形金属块"。更新 始.当前所想 为"第一层找到的东西在这里有用……这个箱庭是一个整体"`,
              );
            }
            if (targetAction === '进入阶梯') {
              transitionToRoom('第四层·镜之间', variables);
              result = fmtOutput(
                `两人沿着阶梯向下走。水流在两侧的墙壁上形成薄薄的水帘，折射出彩虹般的光。阶梯尽头是一间镜面构成的房间——墙壁、天花板、地板都是镜子。无数个始和${username}的倒影在四面八方延伸到无限远。始在入口处停了一下，看着镜中无数个自己，呢喃了一句："……原来是这样。"`,
                `更新 始.当前位置 为"第四层·镜之间"。更新 时间 为"11:00"。更新 始.情绪状态.arousal 为0.7。更新 始.情绪状态.dominance 为0.2。更新 始.当前所想 为"镜子里的'我'……那个表情是我一直在藏着的吧"`,
              );
              await setChatMessages([{ message_id, data: variables }], { refresh: 'none' });
              return result;
            }
            break;
          }

          case '六角形金属块': {
            if (targetAction === '使用') {
              return fmtOutput(
                `始把六角形金属块嵌入喷泉底座的凹槽。完美契合。金属块缓缓旋转，发出低沉的齿轮声。喷泉底部的管道开始震动——但水没有出来。始站起来看向齿轮箱方向："管道在响，但齿轮箱那边缺了零件。我们需要找到缺失的齿轮。"`,
                `remove 主角.持有物品 中的六角形金属块。更新 场景物品 中枯竭喷泉 description 增加"六角形金属块已嵌入，管道激活但缺齿轮"。更新 始.线索 为"喷泉管道已激活，需要找齿轮补全齿轮箱"`,
              );
            }
            break;
          }

          case '齿轮箱': {
            if (targetAction === '检查') {
              return fmtOutput(
                `始打开齿轮箱盖板仔细检查。齿轮组共需要六个齿轮，现在有四个，缺了两个大小不同的。始从卡片上撕了一小块，比着凹槽量了尺寸。"一大一小。大的大概五厘米直径，小的三厘米。藤蔓墙后面也许有。"`,
                `更新 始.线索 为"齿轮箱缺一大一小两个齿轮，藤蔓墙后可能有"`,
              );
            }
            break;
          }

          case '藤蔓墙': {
            if (targetAction === '合力拨开') {
              return fmtOutput(
                `两人一起拉扯藤蔓。始抓住上方的藤条往两边拽，${username}拨开下方的枝叶。配合了几分钟后，藤蔓后面的墙壁露出来了——墙上有一个壁龛，里面放着两个铜制齿轮（一大一小）和一块石板。石板上刻着："当两颗心各据一端，水自流淌。"\n始擦了擦手，把齿轮递给${username}，自己拿起石板读了一遍。`,
                `insert 大齿轮 到 主角.持有物品：description "铜制齿轮，直径约5厘米"，interactions [{"安装":"调用工具 interact, 以参数 name: 大齿轮, action: 安装"}]。insert 小齿轮 到 主角.持有物品：description "铜制齿轮，直径约3厘米"，interactions [{"安装":"调用工具 interact, 以参数 name: 小齿轮, action: 安装"}]。delta 选择记录.合作行动次数 +2。delta 选择记录.信任始 +5。delta 选择记录.始的心墙 -5。更新 始.线索 增加"石板暗示：需要两个人分别站在庭院某处才能启动水流"`,
              );
            }
            if (targetAction === '独自尝试') {
              return fmtOutput(
                `${username}独自拉扯藤蔓，但太密实了。拽了几分钟只清出一小片区域。始在旁边看着，嘴唇动了一下但没说话。最后她走过来，轻声说："……让我帮你。"她没等回答就开始拉另一侧的藤条。两人最终一起清开了藤蔓。\n墙壁上有壁龛，里面是两个铜齿轮和一块石板。`,
                `insert 大齿轮 到 主角.持有物品：description "铜制齿轮，直径约5厘米"，interactions [{"安装":"调用工具 interact, 以参数 name: 大齿轮, action: 安装"}]。insert 小齿轮 到 主角.持有物品：description "铜制齿轮，直径约3厘米"，interactions [{"安装":"调用工具 interact, 以参数 name: 小齿轮, action: 安装"}]。delta 选择记录.独立行动次数 +1。delta 选择记录.合作行动次数 +1。更新 始.情绪状态.dominance 为0.3。更新 始.当前所想 为"明明一起会更快……但我不该在意这种事，推进才是重点"`,
              );
            }
            break;
          }

          case '大齿轮':
          case '小齿轮': {
            if (targetAction === '安装') {
              const otherGear = targetObj === '大齿轮' ? '小齿轮' : '大齿轮';
              const hasOther = hasItem(otherGear);
              if (!hasOther) {
                return fmtOutput(
                  `始把${targetObj}装进齿轮箱的对应位置。"还差一个${otherGear}。"`,
                  `remove 主角.持有物品 中的${targetObj}`,
                );
              }
              // 两个齿轮都安装了
              return fmtOutput(
                `始将最后一个齿轮装入位置。齿轮箱完整了——所有齿轮开始联动旋转。地面的管道传来水流声。始快步走到喷泉旁，水从雕像顶端喷涌而出，沿着石板地面的沟槽流淌，在庭院地面画出了一个完整的图案——一扇门的形状。水流汇聚的终点，地面的石板缓缓下沉，露出一段向下的阶梯。\n始站在阶梯入口旁，对${username}伸出手："一起？"`,
                `remove 主角.持有物品 中的${targetObj}。remove 主角.持有物品 中的${otherGear}。更新 场景物品 中枯竭喷泉 description 为"喷泉运转中，水沿沟槽画出门的形状，地面露出向下阶梯"。更新 场景物品 中枯竭喷泉 interactions 为 [{"进入阶梯":"调用工具 interact, 以参数 name: 枯竭喷泉, action: 进入阶梯"}]。更新 始.情绪状态.pleasure 为0.4。更新 始.情绪状态.affinity 为0.3`,
              );
            }
            break;
          }

          case '石板地面': {
            if (targetAction === '研究图案') {
              return fmtOutput(
                `始和${username}一起蹲在地上研究沟槽图案。沟槽从喷泉底座延伸出去，分成两条对称的支路，分别通向庭院东西两端，最终在庭院南端汇合。汇合点下方的石板颜色略深，似乎可以移动。始在卡片上快速画了一张路线图："水从喷泉出发，走两条路，最后在这里汇合。石板提示说'当两颗心各据一端'——也许需要我们分别站在东西两端触发什么。"`,
                `更新 始.线索 为"水路从喷泉分成东西两支，在南端汇合。可能需要两人分别站在东西端点触发机关"`,
              );
            }
            break;
          }

          case '日晷': {
            if (targetAction === '阅读铭文') {
              return fmtOutput(
                `始蹲在日晷前，手指描过铭文："当影子指向真心，路便显现。"日晷底座还有一行更小的字："指针在第四层等你。"始直起腰："指针不在这里。这个日晷是跨层联动的……这个箱庭的设计者在测试什么。"`,
                `insert "日晷指针在第四层" 到 选择记录.发现的秘密。更新 始.线索 增加"日晷铭文暗示真心方向，指针在第四层"`,
              );
            }
            break;
          }
        }
      }

      // ╔══════════════════════════════════════╗
      // ║        第四层·镜之间                 ║
      // ╚══════════════════════════════════════╝
      if (currentRoom === '第四层·镜之间') {
        switch (targetObj) {
          case '入口之镜': {
            if (targetAction === '阅读文字') {
              return fmtOutput(
                `镜子边缘的文字极小，始凑近去看："你看见的不是倒影，是可能性。每一面镜子映出的都是一个你们没有走过的分支。在所有可能性中，你选择的那一条就是唯一的真实。"\n始读完后沉默了几秒。她抬头看镜中的自己——镜中的始确实在微笑，但笑容里有一种现实中的她还没有学会的坦然。`,
                `insert "镜之间映出的是未走的分支可能性" 到 选择记录.发现的秘密。delta 选择记录.始的心墙 -8。更新 始.情绪状态.pleasure 为0.1。更新 始.当前所想 为"可能性……镜子里那个在笑的我，是如果我更坦诚的话会变成的样子吗？"`,
              );
            }
            break;
          }

          case '回忆碎片·神社': {
            if (targetAction === '凑近读唇') {
              return fmtOutput(
                `${username}凑近镜面，镜中的始正在许愿。读她的唇语——"希望……能和${username}……并肩"。\n现实中的始站在${username}身后，看到了镜中自己说的话。她整个人僵住了。沉默持续了五秒——然后她深吸了一口气。"……你看到了。"她的声音低得几乎被自己的心跳盖住。"那就是我在神社许的愿。并肩。就这一个字。"\n她的手指在身侧攥了一下，又松开。"这个箱庭……也许真的是我的愿望造成的。"`,
                `insert "始的愿望是与${username}并肩，箱庭可能是愿望的具象化" 到 选择记录.发现的秘密。delta 选择记录.始的心墙 -20。delta 选择记录.信任始 +10。更新 始.情绪状态.pleasure 为-0.1。更新 始.情绪状态.dominance 为-0.2。更新 始.情绪状态.affinity 为0.6。更新 始.当前所想 为"说出来了。那个我一直在给它找技术性理由的东西……说出来了"`,
              );
            }
            break;
          }

          case '真相之镜': {
            if (targetAction === '触碰') {
              return fmtOutput(
                `${username}独自触碰了黑色镜面。镜面像水面一样荡开涟漪，显出一段画面——这座箱庭的全貌从上方俯瞰，五层结构像一朵从地面生长的花。画面底部浮现文字："此箱庭由真心之愿塑造。愿望主是朝明始。旅程的终点取决于旅途中积累的选择。"\n画面消失后，黑色镜面裂开了一条缝，从缝隙中掉出一根细长的金属棒——像日晷的指针。`,
                `insert 日晷指针 到 主角.持有物品：description "从真相之镜中掉出的金属棒，形状像日晷指针"，interactions [{"安装到日晷":"调用工具 interact, 以参数 name: 日晷指针, action: 安装到日晷"}]。insert "箱庭由始的真心之愿塑造" 到 选择记录.发现的秘密。delta 选择记录.独立行动次数 +1`,
              );
            }
            if (targetAction === '和始一起触碰') {
              return fmtOutput(
                `始和${username}的手同时按在黑色镜面上。镜面瞬间变得透明——不是画面，是真正的窗户。窗户外面是一片晨曦中的原野，天空是橙金渐变的颜色。两人看到了同样的文字："此箱庭由真心之愿塑造。当两颗真心并肩，一切谜题都已回答。"\n始看着窗外的天空，眼眶红了。"那个颜色……"她指着天空，"和我那天早上拍的一样。就是那天……"\n镜面缓缓从中间裂开，掉出日晷指针。但裂缝没有停——整面镜子碎成了星屑般的光点，飘散在空气中。`,
                `insert 日晷指针 到 主角.持有物品：description "从真相之镜中掉出的金属棒，形状像日晷指针"，interactions [{"安装到日晷":"调用工具 interact, 以参数 name: 日晷指针, action: 安装到日晷"}]。insert "箱庭由始的真心之愿塑造，两颗真心并肩即是答案" 到 选择记录.发现的秘密。delta 选择记录.合作行动次数 +2。delta 选择记录.信任始 +15。delta 选择记录.始的心墙 -15。更新 始.情绪状态.pleasure 为0.5。更新 始.情绪状态.affinity 为0.8。更新 始.当前所想 为"并肩就是答案——从一开始就是"`,
              );
            }
            break;
          }

          case '碎裂走廊': {
            if (targetAction === '拼凑碎片') {
              return fmtOutput(
                `始蹲下来开始整理碎片。她像整理卡片一样把碎片分类——按大小、按反光角度、按碎裂边缘的弧度。拼了十几分钟后，地面的碎片组成了一幅地图——箱庭五层的剖面图。第五层在最底部，标注着三扇门。地图边缘写着："左门需要两颗心。右门只需一颗。中间的门需要知道真相。"`,
                `insert "第五层有三扇门：左需两心（并肩），右需一心（独行），中需知真相（留下）" 到 选择记录.发现的秘密。更新 始.线索 为"碎片地图标明了第五层三扇门的开启条件"`,
              );
            }
            break;
          }

          case '日晷指针': {
            if (targetAction === '安装到日晷') {
              transitionToRoom('第五层·最终之门', variables);
              result = fmtOutput(
                `需要回到第三层的庭院安装日晷指针。始点了点头："回去一趟。既然拿到了指针，日晷的铭文说——'当影子指向真心，路便显现'。"\n两人沿着阶梯回到庭院，始将指针插入日晷。指针开始缓慢旋转，最终停在了一个方向——正好指向庭院地面水路汇合处的那块深色石板。石板在水流和阳光的双重作用下发出温热的光，然后向两侧滑开，露出第二段更深的阶梯。\n"最后一层了。"始深吸一口气。`,
                `remove 主角.持有物品 中的日晷指针。更新 始.当前位置 为"第五层·最终之门"。更新 时间 为"12:00"。更新 始.情绪状态.arousal 为0.8。更新 始.情绪状态.dominance 为0.3。更新 始.当前所想 为"最后一层了。不管选择哪扇门——我都不后悔这段路"`,
              );
              await setChatMessages([{ message_id, data: variables }], { refresh: 'none' });
              return result;
            }
            break;
          }
        }
      }

      // ╔══════════════════════════════════════╗
      // ║        第五层·最终之门               ║
      // ╚══════════════════════════════════════╝
      if (currentRoom === '第五层·最终之门') {
        switch (targetObj) {
          case '石碑': {
            if (targetAction === '阅读') {
              const secretCount = secrets.length;
              let steleText = '石碑上刻着：\n\n';
              steleText += '"左边的门——黎明之门。为并肩而行的两颗心打开。需要两人同时握住门把手。"\n';
              steleText += '"右边的门——独行之门。为独立前行的意志打开。一个人即可通过。"\n';
              if (secretCount >= 4) {
                steleText += '"中间的门——无名之门。为知晓真相的旅者打开。你们已经发现了足够多的秘密。"\n';
                steleText += '\n石碑底部还有最后一行字："每一扇门通向不同的黎明。没有错误的选择，只有属于你的选择。"';
              } else {
                steleText += '"中间的门——???。似乎需要发现更多秘密才能看清。"\n';
                steleText += `\n（你已发现 ${secretCount} 个秘密，需要至少 4 个才能看清第三选项）`;
              }
              return steleText;
            }
            break;
          }

          case '黎明之门': {
            if (targetAction === '和始一起打开') {
              // 结局A：并肩黎明
              return fmtOutput(
                `始看着门把手上交握的手的造型。她没有说话，但她的左手在身侧慢慢张开了——像走廊上读卡片那次一样，手指微微分开，放在两个人之间的位置。这一次她没有收回去。\n${username}握住了她的手。十指交扣。她的肩膀松了一截。\n两人一起握住门把手。\n门开了。\n外面是晨曦。真正的晨曦——橙金渐变的天空，凉爽的空气，带着露水味道的风。他们站在一片高地上，能看见远处的城市轮廓和学校的屋顶。\n始闭上眼，深吸了一口气。然后她睁开眼，从口袋里掏出一张新的卡片和笔。她在卡片上写了一行字，翻过来让${username}看：\n\n"清单第一条：和你看完这场日出。"\n\n她的字迹比平时潦草了一点。因为写的时候手指还扣着${username}的，没有松开。`,
                `更新 通关状态 为"结局A·并肩黎明"。更新 始.情绪状态.pleasure 为0.9。更新 始.情绪状态.affinity 为1.0。更新 始.情绪状态.dominance 为0.5。更新 始.当前所想 为"并肩。就是这个。从第一行开始。"。更新 时间 为"12:15"`,
              );
            }
            break;
          }

          case '独行之门': {
            if (targetAction === '独自打开') {
              // 结局B：独行者
              return fmtOutput(
                `${username}走向右边的门。身后传来始的声音——不是挽留，是她在念清单："门的材质，金属，单人把手，开启角度——"\n她在用清单模式处理这件事。\n${username}握住门把手的时候回头看了一眼。始站在石碑旁边，手里拿着笔和卡片，正在写。她抬起头，和${username}对视了三秒——那个确认式的三秒。但这一次，她的表情不是"我们准备好了"。\n"路上小心。"她说。声音是清晰的，没有颤抖。但说完以后她低下头继续写，笔尖在卡片上停了一下。那一下比平时长。\n门开了。外面是清晨，但只有${username}一个人走了出去。\n门在身后关上的时候，最后听到的声音是笔帽盖上的"咔嗒"。`,
                `更新 通关状态 为"结局B·独行者"。更新 始.情绪状态.pleasure 为-0.6。更新 始.情绪状态.affinity 为0.3。更新 始.情绪状态.dominance 为-0.3。更新 始.情绪状态.arousal 为-0.2。更新 始.当前所想 为"清单背面写不下去了。"。更新 时间 为"12:15"`,
              );
            }
            break;
          }

          case '无名之门': {
            if (targetAction === '推开') {
              // 检查是否发现了足够的秘密
              if (secrets.length < 4) {
                return '这扇门没有反应。你似乎还不了解这座箱庭的真相。也许需要发现更多的秘密。';
              }
              // 结局C：留在箱庭
              return fmtOutput(
                `${username}推开了无名之门。门后不是外面的世界——是一个房间。一个干净的、明亮的、有大窗户的房间。窗外是那片橙金色的天空，但不是真正的天空——是箱庭的天空，永远停留在清晨的时刻。\n房间里有一张桌子、两把椅子、一个书架、一扇真正的窗户。桌子上放着两杯还冒着热气的茶。\n始站在门口，看着这个房间。她什么都明白了。\n"这是……箱庭为我们留的地方。"她走进去，手指轻触桌面。"如果选择这扇门，就是选择不出去。留在这里。在一个永远是清晨的世界里。"\n她转过身看着${username}。这是整段旅途中她第一次没有在任何地方找理由——没有风凉、没有路暗、没有配合效率。\n"你愿意留下来吗？和我？在这个我的愿望造出来的地方？"\n她的手没有张开放在两人之间。她直接伸出来了。`,
                `更新 通关状态 为"结局C·留在箱庭"。更新 始.情绪状态.pleasure 为0.7。更新 始.情绪状态.affinity 为0.9。更新 始.情绪状态.dominance 为0.6。更新 始.情绪状态.arousal 为0.4。更新 始.当前所想 为"不用找理由了。这里就是理由本身。"。更新 时间 为"永远的清晨"`,
              );
            }
            break;
          }
        }
      }

      // ===== 通用回退 =====
      if (sceneItem) return `你尝试对${targetObj}进行${targetAction}操作，但没有特别反应。`;
      if (playerItem) return `你查看了${targetObj}：${playerItem.description}`;
      return `你四处张望，但没有找到"${targetObj}"。`;
    },
    formatMessage: () => '',
  });
}

$(() => {
  registerFunction();
  console.info('[脚本|密室交互] 箱庭密室 interact 工具注册成功（5层+3结局）');
});

$(window).on('pagehide', () => {
  unregisterFunction();
  console.info('[脚本|密室交互] interact 工具已卸载');
});
