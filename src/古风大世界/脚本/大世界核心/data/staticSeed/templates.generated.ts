import type { WorldEventTemplate } from '../../types/events';
import type { QuestDefinition } from '../../types/quest';

export const GENERATED_SIDE_EVENT_TEMPLATES: WorldEventTemplate[] = [
  {
    "templateId": "event_side_2_1_16jt3ry",
    "title": "画舫旧账",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "qixiu_fang",
      "jiangnan_qiantang",
      "jiangnan_xizihu"
    ],
    "regionIds": [
      "daxia_jiangnan"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_高绛婷",
      "npc_温琢玉",
      "npc_袁知春"
    ],
    "consequenceType": "custom",
    "summary": "一名画舫乐人携带旧账失踪，权贵宴席互相推责；可得内容：贵人宴席名单、旧相案前后江南权贵往来、某名伪证人改名记录；余波：七秀名声、江南权贵态度、书院诗会风向都会变化"
  },
  {
    "templateId": "event_side_2_2_1cx4jx0",
    "title": "漕船夜沉",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_jianghuai"
    ],
    "regionIds": [
      "daxia_jianghuai"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_崔季明",
      "npc_蒋横舟",
      "npc_罗青芦"
    ],
    "consequenceType": "custom",
    "summary": "一艘粮船夜里沉没，船工被说成贪货自沉；可得内容：双船册、仓钥副印、失踪船工证言；余波：漕运船价、州府税粮、江淮追索都会被影响"
  },
  {
    "templateId": "event_side_2_3_1nzbqtz",
    "title": "盐商嫁女",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "jiangnan_qiantang",
      "daxia_jianghuai"
    ],
    "regionIds": [
      "daxia_jiangnan",
      "daxia_jianghuai"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_柳观澜",
      "npc_陆怀账",
      "npc_袁知春"
    ],
    "consequenceType": "custom",
    "summary": "盐商嫁女，嫁妆账被人争夺；可得内容：嫁妆暗账、盐引暗供、神京权贵外宅名目；余波：江南商帮分裂，世家婚盟重排，钱粮线可开新口"
  },
  {
    "templateId": "event_side_3_1_1gjve2s",
    "title": "天牢换值",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_shenjing"
    ],
    "regionIds": [
      "daxia_jingji"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_惊鸿卷护行者",
      "npc_杜怀璧",
      "npc_何槐序",
      "npc_宋沉舟"
    ],
    "consequenceType": "custom",
    "summary": "天牢看守突然换值，旧相探视路断；可得内容：天牢移送口令、宫门换防时辰、密令来源异常；余波：宫禁警觉上升，凌雪阁内部密令分歧加重"
  },
  {
    "templateId": "event_side_3_2_pjkj96",
    "title": "御史未发弹章",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_shenjing"
    ],
    "regionIds": [
      "daxia_jingji"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_裴照微",
      "npc_温琢玉",
      "npc_程砺"
    ],
    "consequenceType": "custom",
    "summary": "一份未发弹章被盗，书肆掌柜被捕；可得内容：弹章底稿、旧相案风闻来源、新相门生名单；余波：士林清议升温，神京追索加重"
  },
  {
    "templateId": "event_side_3_3_17ro408",
    "title": "太府副册",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_shenjing"
    ],
    "regionIds": [
      "daxia_jingji"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_何槐序",
      "npc_韩照夜",
      "npc_袁知春"
    ],
    "consequenceType": "custom",
    "summary": "太府寺库吏暴毙，库中赏赐副册缺页；可得内容：贡品缺项、仓钥重启、宫中赏赐去向；余波：宫禁线与钱粮线开始交叠"
  },
  {
    "templateId": "event_side_4_1_19hcock",
    "title": "军令骑缝",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_dongdu"
    ],
    "regionIds": [
      "daxia_heluoguan"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_裴照微",
      "npc_程砺",
      "npc_杨宁"
    ],
    "consequenceType": "custom",
    "summary": "一份旧军令被拿来追责退役军校；可得内容：天策副符、军语破绽、调令骑缝伪迹；余波：军府对{{user}}态度改变，兵部线被惊动"
  },
  {
    "templateId": "event_side_4_2_1324o6k",
    "title": "嵩岳无名客",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_songyue"
    ],
    "regionIds": [
      "daxia_heluoguan"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_罗青芦",
      "npc_谷之岚",
      "npc_玄正"
    ],
    "consequenceType": "custom",
    "summary": "一名无名客在寺外被刺，身上藏半页誓书；可得内容：佛寺隐誓、旧证人口供、刺客来路；余波：少林是否愿意出面担保，会影响江湖名声"
  },
  {
    "templateId": "event_side_4_3_a4ii10",
    "title": "华山伪牒",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_huashan"
    ],
    "regionIds": [
      "daxia_guanzhong"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_裴照微",
      "npc_温琢玉",
      "npc_于睿"
    ],
    "consequenceType": "custom",
    "summary": "一道祥瑞牒文在香客间流传，指旧相逆天乱政；可得内容：谶纬伪牒、印坊假牒、神京传令痕迹；余波：储位与垂帘议论升温，暗线警觉上升"
  },
  {
    "templateId": "event_side_5_1_ckfeee",
    "title": "马市失马",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "hanbei_jinting"
    ],
    "regionIds": [
      "hanbei"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_阿史那乌勒",
      "npc_纪无戈",
      "npc_马庭山"
    ],
    "consequenceType": "custom",
    "summary": "一批良马失踪，大夏边军与瀚北商人互相指责；可得内容：马市银路、担保木牌、私马钱去向；余波：边境互市开闭、瀚北态度、军证线都会变化"
  },
  {
    "templateId": "event_side_5_2_1tyz1pd",
    "title": "苍云旧功",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "cangyun_bao",
      "daxia_beijing"
    ],
    "regionIds": [
      "daxia_beijing"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_纪无戈",
      "npc_马庭山",
      "npc_杨宁"
    ],
    "consequenceType": "custom",
    "summary": "一名旧卒祭拜战友时被捕，罪名为泄露军机；可得内容：封狼副册、被夺军功、边镇旧怨；余波：苍云是否信任{{user}}，取决于是否尊重边军旧痛"
  },
  {
    "templateId": "event_side_5_3_9ycm53",
    "title": "青峡断粮",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "xueling_yaoshan"
    ],
    "regionIds": [
      "xueling"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_柏岚山",
      "npc_马庭山",
      "npc_桑吉洛"
    ],
    "consequenceType": "custom",
    "summary": "青峡关主拒放一批大夏军粮，边军欲强攻；可得内容：山口军粮税册、军粮转道记录、旧相门生被栽赃的旁证；余波：小邦对大夏信任、边军粮价与北境军证线都会受影响"
  },
  {
    "templateId": "event_side_6_1_1g4l65c",
    "title": "楼兰护经",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "loulan_city"
    ],
    "regionIds": [
      "loulan"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_贺兰辞",
      "npc_莎罗真",
      "npc_乌弥多"
    ],
    "consequenceType": "custom",
    "summary": "寺院求大夏护经，藏书楼夜里失火；可得内容：楼兰原文、双译本、古城旧约；余波：楼兰是否信任大夏，决定外邦线能否公开作证"
  },
  {
    "templateId": "event_side_6_2_3apnum",
    "title": "玉门缺印",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_hexi"
    ],
    "regionIds": [
      "daxia_hexi"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_阿弥沙",
      "npc_贺兰辞",
      "npc_乌弥多"
    ],
    "consequenceType": "custom",
    "summary": "一批商货通关文书缺印，驼队被扣；可得内容：玉门缺印、驼牌行程、水井印；余波：河西商路开闭，楼兰使团去留，外邦线证据能否入夏"
  },
  {
    "templateId": "event_side_6_3_b0angq",
    "title": "火祠旧录",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "mingjiao_huoci",
      "loulan_city"
    ],
    "regionIds": [
      "loulan"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_袁知春",
      "npc_莎罗真",
      "npc_乌弥多"
    ],
    "consequenceType": "custom",
    "summary": "火祠旧录被商团争夺，明教弟子被诬为劫货；可得内容：火祠旧约、流沙商团账、边镇护送旧例；余波：明教是否愿意开放火祠记录，会影响外邦与暗线"
  },
  {
    "templateId": "event_side_7_1_1ixncxl",
    "title": "剑阁封箱",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "tangmen_baopu"
    ],
    "regionIds": [
      "daxia_shuzhong"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_蒋横舟",
      "npc_唐无乐",
      "npc_阮明珰"
    ],
    "consequenceType": "custom",
    "summary": "一只旧贡箱在山道被劫，劫匪死于机关；可得内容：机关封箱痕、贡箱开封时辰、商帮改道记录；余波：唐门名声与商路安全同时受影响"
  },
  {
    "templateId": "event_side_7_2_rv3fyn",
    "title": "银月矿契",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "dali_erdu"
    ],
    "regionIds": [
      "dali"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_阿幼朵",
      "npc_段青岚",
      "npc_赵银簿"
    ],
    "consequenceType": "custom",
    "summary": "银矿矿契一夜易主，矿工暴动；可得内容：银月暗契、神京赌债、矿银流向；余波：大理与大夏边境关系、银路财赋与山寨态度都会变化"
  },
  {
    "templateId": "event_side_7_3_1ds38j2",
    "title": "毒源错案",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "wudu_shanlin",
      "dali_erdu"
    ],
    "regionIds": [
      "daxia_xinan",
      "dali"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_谷之岚",
      "npc_阿幼朵",
      "npc_岑药奴"
    ],
    "consequenceType": "custom",
    "summary": "一名证人死于毒物，官面指向五毒；可得内容：毒源错认、南海混毒、证人死亡真因；余波：五毒名声、南海香药线与伪证人死亡线都会变化"
  },
  {
    "templateId": "event_side_8_1_p2y95r",
    "title": "贡舶缺项",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_lingnan"
    ],
    "regionIds": [
      "daxia_lingnan"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_林海市",
      "npc_摩罗悉",
      "npc_阮明珰"
    ],
    "consequenceType": "custom",
    "summary": "贡舶入港后，副单缺项被说成商人私吞；可得内容：贡舶缺项、船籍副单、太府寺入库差异；余波：南海商路、贡品入京与外邦线采信都会改变"
  },
  {
    "templateId": "event_side_8_2_cr65bc",
    "title": "雾罗药路",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_lingnan"
    ],
    "regionIds": [
      "daxia_lingnan"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_阿幼朵",
      "npc_岑药奴",
      "npc_摩罗悉"
    ],
    "consequenceType": "custom",
    "summary": "采药人被祭司扣押，商帮声称其偷药；可得内容：雾罗药路、混毒采买、南海香药真伪；余波：岭南药价、五毒名声、南海外邦医者处境都会变化"
  },
  {
    "templateId": "event_side_8_3_rhgvoi",
    "title": "海道改令",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_lingnan"
    ],
    "regionIds": [
      "daxia_lingnan"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_林海市",
      "npc_阮明珰",
      "npc_郑潮生"
    ],
    "consequenceType": "custom",
    "summary": "一名海道军书吏被指私改护航令；可得内容：海道改令、船坞出入、星门旧旗；余波：海道军立场与南海、东海两线相连"
  },
  {
    "templateId": "event_side_9_1_1qzb8cp",
    "title": "沉船铜筒",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "penglai_island",
      "daxia_donghai"
    ],
    "regionIds": [
      "daxia_donghai"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_方有崖",
      "npc_金允成",
      "npc_郑潮生"
    ],
    "consequenceType": "custom",
    "summary": "一艘旧贡舶残骸被发现，各方争夺船木；可得内容：沉船铜筒、贡舶副本、海图差异；余波：海东使团是否愿作证，取决于沉船责任如何处理"
  },
  {
    "templateId": "event_side_9_2_150vzn3",
    "title": "刀剑换名",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "haidong_ports"
    ],
    "regionIds": [
      "haidong"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_方有崖",
      "npc_沈罗介",
      "npc_叶晖"
    ],
    "consequenceType": "custom",
    "summary": "玄济入贡刀剑出现在暗市，被当作私购军器；可得内容：入贡刀剑名册、军器伪证、暗市兵器流向；余波：军证线可得到替代证据，海东商馆名声受影响"
  },
  {
    "templateId": "event_side_9_3_1ihgri6",
    "title": "星门灯灭",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "haidong_ports"
    ],
    "regionIds": [
      "haidong"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_方有崖",
      "npc_林海市",
      "npc_郑潮生"
    ],
    "consequenceType": "custom",
    "summary": "灯塔一夜熄灭，贡船触礁，港税吏被迫担责；可得内容：船籍担保、旧旗、海盗与正规船路勾连；余波：东海与岭南海道军线合并"
  },
  {
    "templateId": "event_side_10_1_tlyyvl",
    "title": "雪岭护卷",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "xueling_yaoshan"
    ],
    "regionIds": [
      "xueling"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_柏岚山",
      "npc_桑吉洛",
      "npc_玄正"
    ],
    "consequenceType": "custom",
    "summary": "寺寨拒交一名大夏逃人，边军欲索人；可得内容：雪岭庇护誓书、旧证人去向、追杀者名目；余波：雪岭对大夏官面态度会改变"
  },
  {
    "templateId": "event_side_10_2_9u6yr6",
    "title": "乌泉水印",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "loulan_city"
    ],
    "regionIds": [
      "loulan"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_阿弥沙",
      "npc_莎罗真",
      "npc_乌弥多"
    ],
    "consequenceType": "custom",
    "summary": "水井印被盗，驼队互相指盗；可得内容：乌泉水印、水簿、河西货箱时辰；余波：河西商路水井信用受损，楼兰线更难走"
  },
  {
    "templateId": "event_side_10_3_w9bqo2",
    "title": "药泉病亡录",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "xueling_yaoshan"
    ],
    "regionIds": [
      "xueling"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_谷之岚",
      "npc_桑吉洛",
      "npc_仁钦"
    ],
    "consequenceType": "custom",
    "summary": "一名病亡者被认成逃犯，寺邦被要求交尸；可得内容：病亡录、半句证词、证人非灭口的替代证据；余波：伪证人线可得替代证据，寺邦庇护名声受影响"
  },
  {
    "templateId": "event_side_11_1_684zvd",
    "title": "一个故事一壶酒",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "jiangnan_qiantang",
      "daxia_hexi",
      "daxia_lingnan",
      "daxia_shenjing",
      "hongchen_jiujia_qiantang"
    ],
    "regionIds": [
      "daxia_jiangnan",
      "daxia_hexi",
      "daxia_lingnan",
      "daxia_jingji"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_韩照夜",
      "npc_袁知春",
      "npc_乌弥多",
      "npc_阮明珰"
    ],
    "consequenceType": "custom",
    "summary": "不同分号收到同一故事的不同版本；可得内容：同一暗号、多地酒账、伪证人改名、商路旧客；余波：红尘酒家消息网会因信任或失信而开合"
  },
  {
    "templateId": "event_side_11_2_xg9s4k",
    "title": "渡浮沉旧客",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "hongchen_jiujia_qiantang"
    ],
    "regionIds": [
      "daxia_jiangnan"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_杜怀璧",
      "npc_罗青芦",
      "npc_袁知春"
    ],
    "consequenceType": "custom",
    "summary": "一名旧客饮下渡浮沉后不愿再认旧名；可得内容：旧名、债契、伪证人线、暗市胁迫；余波：若强逼旧客，红尘酒家未必再信{{user}}；若放走旧客，主线证据可能延后"
  },
  {
    "templateId": "event_side_12_1_11wlzoz",
    "title": "金帐裂誓",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "hanbei_jinting"
    ],
    "regionIds": [
      "hanbei"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_阿史那绯云",
      "npc_阿史那青烈",
      "npc_阿史那乌勒"
    ],
    "consequenceType": "custom",
    "summary": "汗庭诸部争一份旧誓书，阿史那绯云与阿史那青烈分别代表不同部族说法；可得内容：金帐裂誓、马市银路、瀚北诸部对大夏正朔的真实态度；余波：瀚北互市、北境军马、草原王女入夏态度都会变化"
  },
  {
    "templateId": "event_side_12_2_11lz5hb",
    "title": "苍洱婚书",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "dali_shenjian_gong",
      "dali_erdu"
    ],
    "regionIds": [
      "dali"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_段俭魏",
      "npc_段青岚",
      "npc_段慎思",
      "npc_段月仪"
    ],
    "consequenceType": "custom",
    "summary": "段月仪的婚书被人调换，王族与神剑宫互相追责；可得内容：苍洱婚书、大理朝贡副册、茶马银路；余波：大理是否信任大夏、段氏是否开放使团副册，都会受影响"
  },
  {
    "templateId": "event_side_12_3_z1g2lw",
    "title": "楼兰水权",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "loulan_city"
    ],
    "regionIds": [
      "loulan"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_弥兰真珠",
      "npc_阿弥沙",
      "npc_莎罗真",
      "npc_乌弥多"
    ],
    "consequenceType": "custom",
    "summary": "绿洲水权书被盗，楼兰、乌泉和商团互指对方断水；可得内容：绿洲水权书、乌泉水印、火祠司灯名册；余波：流沙商路是否畅通，楼兰寺院是否愿作证，会随处理变化"
  },
  {
    "templateId": "event_side_12_4_1y5qnwx",
    "title": "海东礼位",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_donghai",
      "haidong_ports",
      "daxia_shenjing"
    ],
    "regionIds": [
      "daxia_donghai",
      "haidong",
      "daxia_jingji"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_辰罗素真",
      "npc_方有崖",
      "npc_金允成",
      "npc_沈罗介"
    ],
    "consequenceType": "custom",
    "summary": "辰罗、玄济、东岚三国使团为礼位争执，鸿胪馆压下原文；可得内容：礼位三稿、玄济刀契、东岚海雾图；余波：海东诸国是否承认大夏新解释，会受此事影响"
  },
  {
    "templateId": "event_side_12_5_1g9x3ya",
    "title": "南海贡珠",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_lingnan",
      "nanhai_ports"
    ],
    "regionIds": [
      "daxia_lingnan",
      "nanhai"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_离珠明玑",
      "npc_林海市",
      "npc_摩罗悉",
      "npc_阮明珰"
    ],
    "consequenceType": "custom",
    "summary": "离珠贡珠失窃，离珠明玑被迫留在岭南等查；可得内容：贡珠双匣、真陀医方夹页、槟罗佣兵契；余波：南海诸舶国对大夏港路信用的判断会改变"
  },
  {
    "templateId": "event_side_12_6_vs3nvt",
    "title": "雪岭护灯",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "xueling_yaoshan"
    ],
    "regionIds": [
      "xueling"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_桑吉洛",
      "npc_玄正",
      "npc_陈月",
      "npc_仁钦"
    ],
    "consequenceType": "custom",
    "summary": "寺寨护灯誓被撕毁，边镇要求交出旧案证人；可得内容：白塔会盟印、药宗救治录、寺寨护灯誓；余波：雪岭诸部、药宗、少林与边镇之间的信任会改变"
  },
  {
    "templateId": "event_side_12_7_5ashfo",
    "title": "青峡质子",
    "kind": "quest_hook",
    "weight": 5,
    "locationIds": [
      "daxia_shenjing",
      "xueling_yaoshan"
    ],
    "regionIds": [
      "daxia_jingji",
      "xueling"
    ],
    "requiredTags": [
      "sidequest"
    ],
    "relatedNpcIds": [
      "npc_柏岚山",
      "npc_阿弥沙",
      "npc_郑潮生",
      "npc_青檀"
    ],
    "consequenceType": "custom",
    "summary": "青峡国王女青檀收到质子旧函，函中称鸿胪馆有人逼小邦改认印信；可得内容：质子旧函、井印换手、星门港灯契；余波：夹缝诸邦是否愿承认新秩序，会从此线开始变化"
  }
];

export const GENERATED_SIDE_QUEST_TEMPLATES: QuestDefinition[] = [
  {
    "questId": "side_2_1_16jt3ry",
    "title": "画舫旧账",
    "kind": "sidequest",
    "startStepId": "side_2_1_16jt3ry_start",
    "relatedNpcIds": [
      "npc_高绛婷",
      "npc_温琢玉",
      "npc_袁知春"
    ],
    "relatedLocationIds": [
      "qixiu_fang",
      "jiangnan_qiantang",
      "jiangnan_xizihu"
    ],
    "tags": [
      "sidequest",
      "region_2"
    ],
    "steps": [
      {
        "stepId": "side_2_1_16jt3ry_start",
        "title": "接触事件",
        "description": "一名画舫乐人携带旧账失踪，权贵宴席互相推责",
        "relatedNpcIds": [
          "npc_高绛婷",
          "npc_温琢玉",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "qixiu_fang",
          "jiangnan_qiantang",
          "jiangnan_xizihu"
        ],
        "nextStepIds": [
          "side_2_1_16jt3ry_investigate"
        ]
      },
      {
        "stepId": "side_2_1_16jt3ry_investigate",
        "title": "查证牵连",
        "description": "地方层次：乐坊、书院、州府、权贵家眷、暗市牙人；可得内容：贵人宴席名单、旧相案前后江南权贵往来、某名伪证人改名记录",
        "relatedNpcIds": [
          "npc_高绛婷",
          "npc_温琢玉",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "qixiu_fang",
          "jiangnan_qiantang",
          "jiangnan_xizihu"
        ],
        "nextStepIds": [
          "side_2_1_16jt3ry_settle"
        ]
      },
      {
        "stepId": "side_2_1_16jt3ry_settle",
        "title": "收束余波",
        "description": "收束方向：可护乐人离城，可交州府查案，可用账册换取士林声援，也可暂存红尘酒家；余波：七秀名声、江南权贵态度、书院诗会风向都会变化",
        "relatedNpcIds": [
          "npc_高绛婷",
          "npc_温琢玉",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "qixiu_fang",
          "jiangnan_qiantang",
          "jiangnan_xizihu"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_2_2_1cx4jx0",
    "title": "漕船夜沉",
    "kind": "sidequest",
    "startStepId": "side_2_2_1cx4jx0_start",
    "relatedNpcIds": [
      "npc_崔季明",
      "npc_蒋横舟",
      "npc_罗青芦"
    ],
    "relatedLocationIds": [
      "daxia_jianghuai"
    ],
    "tags": [
      "sidequest",
      "region_2"
    ],
    "steps": [
      {
        "stepId": "side_2_2_1cx4jx0_start",
        "title": "接触事件",
        "description": "一艘粮船夜里沉没，船工被说成贪货自沉",
        "relatedNpcIds": [
          "npc_崔季明",
          "npc_蒋横舟",
          "npc_罗青芦"
        ],
        "relatedLocationIds": [
          "daxia_jianghuai"
        ],
        "nextStepIds": [
          "side_2_2_1cx4jx0_investigate"
        ]
      },
      {
        "stepId": "side_2_2_1cx4jx0_investigate",
        "title": "查证牵连",
        "description": "地方层次：漕运、仓城、船帮、州府、丐帮、市井百姓；可得内容：双船册、仓钥副印、失踪船工证言",
        "relatedNpcIds": [
          "npc_崔季明",
          "npc_蒋横舟",
          "npc_罗青芦"
        ],
        "relatedLocationIds": [
          "daxia_jianghuai"
        ],
        "nextStepIds": [
          "side_2_2_1cx4jx0_settle"
        ]
      },
      {
        "stepId": "side_2_2_1cx4jx0_settle",
        "title": "收束余波",
        "description": "收束方向：救船工，查仓城，压漕帮，或借水路先送证人离开；余波：漕运船价、州府税粮、江淮追索都会被影响",
        "relatedNpcIds": [
          "npc_崔季明",
          "npc_蒋横舟",
          "npc_罗青芦"
        ],
        "relatedLocationIds": [
          "daxia_jianghuai"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_2_3_1nzbqtz",
    "title": "盐商嫁女",
    "kind": "sidequest",
    "startStepId": "side_2_3_1nzbqtz_start",
    "relatedNpcIds": [
      "npc_柳观澜",
      "npc_陆怀账",
      "npc_袁知春"
    ],
    "relatedLocationIds": [
      "jiangnan_qiantang",
      "daxia_jianghuai"
    ],
    "tags": [
      "sidequest",
      "region_2"
    ],
    "steps": [
      {
        "stepId": "side_2_3_1nzbqtz_start",
        "title": "接触事件",
        "description": "盐商嫁女，嫁妆账被人争夺",
        "relatedNpcIds": [
          "npc_柳观澜",
          "npc_陆怀账",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "jiangnan_qiantang",
          "daxia_jianghuai"
        ],
        "nextStepIds": [
          "side_2_3_1nzbqtz_investigate"
        ]
      },
      {
        "stepId": "side_2_3_1nzbqtz_investigate",
        "title": "查证牵连",
        "description": "地方层次：盐商、世家、州府、女眷宴席、暗市；可得内容：嫁妆暗账、盐引暗供、神京权贵外宅名目",
        "relatedNpcIds": [
          "npc_柳观澜",
          "npc_陆怀账",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "jiangnan_qiantang",
          "daxia_jianghuai"
        ],
        "nextStepIds": [
          "side_2_3_1nzbqtz_settle"
        ]
      },
      {
        "stepId": "side_2_3_1nzbqtz_settle",
        "title": "收束余波",
        "description": "收束方向：保婚、毁婚、换账、公开账目或暗中留副本；余波：江南商帮分裂，世家婚盟重排，钱粮线可开新口",
        "relatedNpcIds": [
          "npc_柳观澜",
          "npc_陆怀账",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "jiangnan_qiantang",
          "daxia_jianghuai"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_3_1_1gjve2s",
    "title": "天牢换值",
    "kind": "sidequest",
    "startStepId": "side_3_1_1gjve2s_start",
    "relatedNpcIds": [
      "npc_惊鸿卷护行者",
      "npc_杜怀璧",
      "npc_何槐序",
      "npc_宋沉舟"
    ],
    "relatedLocationIds": [
      "daxia_shenjing"
    ],
    "tags": [
      "sidequest",
      "region_3"
    ],
    "steps": [
      {
        "stepId": "side_3_1_1gjve2s_start",
        "title": "接触事件",
        "description": "天牢看守突然换值，旧相探视路断",
        "relatedNpcIds": [
          "npc_惊鸿卷护行者",
          "npc_杜怀璧",
          "npc_何槐序",
          "npc_宋沉舟"
        ],
        "relatedLocationIds": [
          "daxia_shenjing"
        ],
        "nextStepIds": [
          "side_3_1_1gjve2s_investigate"
        ]
      },
      {
        "stepId": "side_3_1_1gjve2s_investigate",
        "title": "查证牵连",
        "description": "地方层次：禁军、大理寺、内廷、凌雪阁、旧相府旧人；可得内容：天牢移送口令、宫门换防时辰、密令来源异常",
        "relatedNpcIds": [
          "npc_惊鸿卷护行者",
          "npc_杜怀璧",
          "npc_何槐序",
          "npc_宋沉舟"
        ],
        "relatedLocationIds": [
          "daxia_shenjing"
        ],
        "nextStepIds": [
          "side_3_1_1gjve2s_settle"
        ]
      },
      {
        "stepId": "side_3_1_1gjve2s_settle",
        "title": "收束余波",
        "description": "收束方向：递信、换探视名目、保住看守旧人、或以证据逼大理寺暂缓移送；余波：宫禁警觉上升，凌雪阁内部密令分歧加重",
        "relatedNpcIds": [
          "npc_惊鸿卷护行者",
          "npc_杜怀璧",
          "npc_何槐序",
          "npc_宋沉舟"
        ],
        "relatedLocationIds": [
          "daxia_shenjing"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_3_2_pjkj96",
    "title": "御史未发弹章",
    "kind": "sidequest",
    "startStepId": "side_3_2_pjkj96_start",
    "relatedNpcIds": [
      "npc_裴照微",
      "npc_温琢玉",
      "npc_程砺"
    ],
    "relatedLocationIds": [
      "daxia_shenjing"
    ],
    "tags": [
      "sidequest",
      "region_3"
    ],
    "steps": [
      {
        "stepId": "side_3_2_pjkj96_start",
        "title": "接触事件",
        "description": "一份未发弹章被盗，书肆掌柜被捕",
        "relatedNpcIds": [
          "npc_裴照微",
          "npc_温琢玉",
          "npc_程砺"
        ],
        "relatedLocationIds": [
          "daxia_shenjing"
        ],
        "nextStepIds": [
          "side_3_2_pjkj96_investigate"
        ]
      },
      {
        "stepId": "side_3_2_pjkj96_investigate",
        "title": "查证牵连",
        "description": "地方层次：御史台、书肆、士林、暗市、旧臣门生；可得内容：弹章底稿、旧相案风闻来源、新相门生名单",
        "relatedNpcIds": [
          "npc_裴照微",
          "npc_温琢玉",
          "npc_程砺"
        ],
        "relatedLocationIds": [
          "daxia_shenjing"
        ],
        "nextStepIds": [
          "side_3_2_pjkj96_settle"
        ]
      },
      {
        "stepId": "side_3_2_pjkj96_settle",
        "title": "收束余波",
        "description": "收束方向：追回弹章，保书肆，递给清流御史，或让程砺转向查案；余波：士林清议升温，神京追索加重",
        "relatedNpcIds": [
          "npc_裴照微",
          "npc_温琢玉",
          "npc_程砺"
        ],
        "relatedLocationIds": [
          "daxia_shenjing"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_3_3_17ro408",
    "title": "太府副册",
    "kind": "sidequest",
    "startStepId": "side_3_3_17ro408_start",
    "relatedNpcIds": [
      "npc_何槐序",
      "npc_韩照夜",
      "npc_袁知春"
    ],
    "relatedLocationIds": [
      "daxia_shenjing"
    ],
    "tags": [
      "sidequest",
      "region_3"
    ],
    "steps": [
      {
        "stepId": "side_3_3_17ro408_start",
        "title": "接触事件",
        "description": "太府寺库吏暴毙，库中赏赐副册缺页",
        "relatedNpcIds": [
          "npc_何槐序",
          "npc_韩照夜",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "daxia_shenjing"
        ],
        "nextStepIds": [
          "side_3_3_17ro408_investigate"
        ]
      },
      {
        "stepId": "side_3_3_17ro408_investigate",
        "title": "查证牵连",
        "description": "地方层次：太府寺、宫禁、权贵外宅、商帮、暗站；可得内容：贡品缺项、仓钥重启、宫中赏赐去向",
        "relatedNpcIds": [
          "npc_何槐序",
          "npc_韩照夜",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "daxia_shenjing"
        ],
        "nextStepIds": [
          "side_3_3_17ro408_settle"
        ]
      },
      {
        "stepId": "side_3_3_17ro408_settle",
        "title": "收束余波",
        "description": "收束方向：查尸、找缺页、护库吏家眷、或以红尘酒账追外宅；余波：宫禁线与钱粮线开始交叠",
        "relatedNpcIds": [
          "npc_何槐序",
          "npc_韩照夜",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "daxia_shenjing"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_4_1_19hcock",
    "title": "军令骑缝",
    "kind": "sidequest",
    "startStepId": "side_4_1_19hcock_start",
    "relatedNpcIds": [
      "npc_裴照微",
      "npc_程砺",
      "npc_杨宁"
    ],
    "relatedLocationIds": [
      "daxia_dongdu"
    ],
    "tags": [
      "sidequest",
      "region_4"
    ],
    "steps": [
      {
        "stepId": "side_4_1_19hcock_start",
        "title": "接触事件",
        "description": "一份旧军令被拿来追责退役军校",
        "relatedNpcIds": [
          "npc_裴照微",
          "npc_程砺",
          "npc_杨宁"
        ],
        "relatedLocationIds": [
          "daxia_dongdu"
        ],
        "nextStepIds": [
          "side_4_1_19hcock_investigate"
        ]
      },
      {
        "stepId": "side_4_1_19hcock_investigate",
        "title": "查证牵连",
        "description": "地方层次：军府、兵部书吏、退役军人、州县差役；可得内容：天策副符、军语破绽、调令骑缝伪迹",
        "relatedNpcIds": [
          "npc_裴照微",
          "npc_程砺",
          "npc_杨宁"
        ],
        "relatedLocationIds": [
          "daxia_dongdu"
        ],
        "nextStepIds": [
          "side_4_1_19hcock_settle"
        ]
      },
      {
        "stepId": "side_4_1_19hcock_settle",
        "title": "收束余波",
        "description": "收束方向：求杨宁验令，查书吏，求天策外署验令，或转入北境查边功；余波：军府对{{user}}态度改变，兵部线被惊动",
        "relatedNpcIds": [
          "npc_裴照微",
          "npc_程砺",
          "npc_杨宁"
        ],
        "relatedLocationIds": [
          "daxia_dongdu"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_4_2_1324o6k",
    "title": "嵩岳无名客",
    "kind": "sidequest",
    "startStepId": "side_4_2_1324o6k_start",
    "relatedNpcIds": [
      "npc_罗青芦",
      "npc_谷之岚",
      "npc_玄正"
    ],
    "relatedLocationIds": [
      "daxia_songyue"
    ],
    "tags": [
      "sidequest",
      "region_4"
    ],
    "steps": [
      {
        "stepId": "side_4_2_1324o6k_start",
        "title": "接触事件",
        "description": "一名无名客在寺外被刺，身上藏半页誓书",
        "relatedNpcIds": [
          "npc_罗青芦",
          "npc_谷之岚",
          "npc_玄正"
        ],
        "relatedLocationIds": [
          "daxia_songyue"
        ],
        "nextStepIds": [
          "side_4_2_1324o6k_investigate"
        ]
      },
      {
        "stepId": "side_4_2_1324o6k_investigate",
        "title": "查证牵连",
        "description": "地方层次：寺院、江湖刺客、医者、丐帮线人、地方官面；可得内容：佛寺隐誓、旧证人口供、刺客来路",
        "relatedNpcIds": [
          "npc_罗青芦",
          "npc_谷之岚",
          "npc_玄正"
        ],
        "relatedLocationIds": [
          "daxia_songyue"
        ],
        "nextStepIds": [
          "side_4_2_1324o6k_settle"
        ]
      },
      {
        "stepId": "side_4_2_1324o6k_settle",
        "title": "收束余波",
        "description": "收束方向：验伤、查刺客、求少林调停、护无名客家眷；余波：少林是否愿意出面担保，会影响江湖名声",
        "relatedNpcIds": [
          "npc_罗青芦",
          "npc_谷之岚",
          "npc_玄正"
        ],
        "relatedLocationIds": [
          "daxia_songyue"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_4_3_a4ii10",
    "title": "华山伪牒",
    "kind": "sidequest",
    "startStepId": "side_4_3_a4ii10_start",
    "relatedNpcIds": [
      "npc_裴照微",
      "npc_温琢玉",
      "npc_于睿"
    ],
    "relatedLocationIds": [
      "daxia_huashan"
    ],
    "tags": [
      "sidequest",
      "region_4"
    ],
    "steps": [
      {
        "stepId": "side_4_3_a4ii10_start",
        "title": "接触事件",
        "description": "一道祥瑞牒文在香客间流传，指旧相逆天乱政",
        "relatedNpcIds": [
          "npc_裴照微",
          "npc_温琢玉",
          "npc_于睿"
        ],
        "relatedLocationIds": [
          "daxia_huashan"
        ],
        "nextStepIds": [
          "side_4_3_a4ii10_investigate"
        ]
      },
      {
        "stepId": "side_4_3_a4ii10_investigate",
        "title": "查证牵连",
        "description": "地方层次：道门、书院、香客、州府、暗市印坊；可得内容：谶纬伪牒、印坊假牒、神京传令痕迹",
        "relatedNpcIds": [
          "npc_裴照微",
          "npc_温琢玉",
          "npc_于睿"
        ],
        "relatedLocationIds": [
          "daxia_huashan"
        ],
        "nextStepIds": [
          "side_4_3_a4ii10_settle"
        ]
      },
      {
        "stepId": "side_4_3_a4ii10_settle",
        "title": "收束余波",
        "description": "收束方向：破伪牒，保道观名声，查印坊，或让士林公开辩伪；余波：储位与垂帘议论升温，暗线警觉上升",
        "relatedNpcIds": [
          "npc_裴照微",
          "npc_温琢玉",
          "npc_于睿"
        ],
        "relatedLocationIds": [
          "daxia_huashan"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_5_1_ckfeee",
    "title": "马市失马",
    "kind": "sidequest",
    "startStepId": "side_5_1_ckfeee_start",
    "relatedNpcIds": [
      "npc_阿史那乌勒",
      "npc_纪无戈",
      "npc_马庭山"
    ],
    "relatedLocationIds": [
      "hanbei_jinting"
    ],
    "tags": [
      "sidequest",
      "region_5"
    ],
    "steps": [
      {
        "stepId": "side_5_1_ckfeee_start",
        "title": "接触事件",
        "description": "一批良马失踪，大夏边军与瀚北商人互相指责",
        "relatedNpcIds": [
          "npc_阿史那乌勒",
          "npc_纪无戈",
          "npc_马庭山"
        ],
        "relatedLocationIds": [
          "hanbei_jinting"
        ],
        "nextStepIds": [
          "side_5_1_ckfeee_investigate"
        ]
      },
      {
        "stepId": "side_5_1_ckfeee_investigate",
        "title": "查证牵连",
        "description": "地方层次：互市监、边军、瀚北商人、马贼、暗市；可得内容：马市银路、担保木牌、私马钱去向",
        "relatedNpcIds": [
          "npc_阿史那乌勒",
          "npc_纪无戈",
          "npc_马庭山"
        ],
        "relatedLocationIds": [
          "hanbei_jinting"
        ],
        "nextStepIds": [
          "side_5_1_ckfeee_settle"
        ]
      },
      {
        "stepId": "side_5_1_ckfeee_settle",
        "title": "收束余波",
        "description": "收束方向：追回马群，保互市，查担保，或借马市进入瀚北使团；余波：边境互市开闭、瀚北态度、军证线都会变化",
        "relatedNpcIds": [
          "npc_阿史那乌勒",
          "npc_纪无戈",
          "npc_马庭山"
        ],
        "relatedLocationIds": [
          "hanbei_jinting"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_5_2_1tyz1pd",
    "title": "苍云旧功",
    "kind": "sidequest",
    "startStepId": "side_5_2_1tyz1pd_start",
    "relatedNpcIds": [
      "npc_纪无戈",
      "npc_马庭山",
      "npc_杨宁"
    ],
    "relatedLocationIds": [
      "cangyun_bao",
      "daxia_beijing"
    ],
    "tags": [
      "sidequest",
      "region_5"
    ],
    "steps": [
      {
        "stepId": "side_5_2_1tyz1pd_start",
        "title": "接触事件",
        "description": "一名旧卒祭拜战友时被捕，罪名为泄露军机",
        "relatedNpcIds": [
          "npc_纪无戈",
          "npc_马庭山",
          "npc_杨宁"
        ],
        "relatedLocationIds": [
          "cangyun_bao",
          "daxia_beijing"
        ],
        "nextStepIds": [
          "side_5_2_1tyz1pd_investigate"
        ]
      },
      {
        "stepId": "side_5_2_1tyz1pd_investigate",
        "title": "查证牵连",
        "description": "地方层次：苍云旧军、边镇军府、军户家眷、兵部；可得内容：封狼副册、被夺军功、边镇旧怨",
        "relatedNpcIds": [
          "npc_纪无戈",
          "npc_马庭山",
          "npc_杨宁"
        ],
        "relatedLocationIds": [
          "cangyun_bao",
          "daxia_beijing"
        ],
        "nextStepIds": [
          "side_5_2_1tyz1pd_settle"
        ]
      },
      {
        "stepId": "side_5_2_1tyz1pd_settle",
        "title": "收束余波",
        "description": "收束方向：救旧卒，换军功副册，查夺功者，或带证入东都；余波：苍云是否信任{{user}}，取决于是否尊重边军旧痛",
        "relatedNpcIds": [
          "npc_纪无戈",
          "npc_马庭山",
          "npc_杨宁"
        ],
        "relatedLocationIds": [
          "cangyun_bao",
          "daxia_beijing"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_5_3_9ycm53",
    "title": "青峡断粮",
    "kind": "sidequest",
    "startStepId": "side_5_3_9ycm53_start",
    "relatedNpcIds": [
      "npc_柏岚山",
      "npc_马庭山",
      "npc_桑吉洛"
    ],
    "relatedLocationIds": [
      "xueling_yaoshan"
    ],
    "tags": [
      "sidequest",
      "region_5"
    ],
    "steps": [
      {
        "stepId": "side_5_3_9ycm53_start",
        "title": "接触事件",
        "description": "青峡关主拒放一批大夏军粮，边军欲强攻",
        "relatedNpcIds": [
          "npc_柏岚山",
          "npc_马庭山",
          "npc_桑吉洛"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": [
          "side_5_3_9ycm53_investigate"
        ]
      },
      {
        "stepId": "side_5_3_9ycm53_investigate",
        "title": "查证牵连",
        "description": "地方层次：小邦关主、边军、商队、寺寨、山民；可得内容：山口军粮税册、军粮转道记录、旧相门生被栽赃的旁证",
        "relatedNpcIds": [
          "npc_柏岚山",
          "npc_马庭山",
          "npc_桑吉洛"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": [
          "side_5_3_9ycm53_settle"
        ]
      },
      {
        "stepId": "side_5_3_9ycm53_settle",
        "title": "收束余波",
        "description": "收束方向：谈判放粮，查税册，护山民，或揭出边军私账；余波：小邦对大夏信任、边军粮价与北境军证线都会受影响",
        "relatedNpcIds": [
          "npc_柏岚山",
          "npc_马庭山",
          "npc_桑吉洛"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_6_1_1g4l65c",
    "title": "楼兰护经",
    "kind": "sidequest",
    "startStepId": "side_6_1_1g4l65c_start",
    "relatedNpcIds": [
      "npc_贺兰辞",
      "npc_莎罗真",
      "npc_乌弥多"
    ],
    "relatedLocationIds": [
      "loulan_city"
    ],
    "tags": [
      "sidequest",
      "region_6"
    ],
    "steps": [
      {
        "stepId": "side_6_1_1g4l65c_start",
        "title": "接触事件",
        "description": "寺院求大夏护经，藏书楼夜里失火",
        "relatedNpcIds": [
          "npc_贺兰辞",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "loulan_city"
        ],
        "nextStepIds": [
          "side_6_1_1g4l65c_investigate"
        ]
      },
      {
        "stepId": "side_6_1_1g4l65c_investigate",
        "title": "查证牵连",
        "description": "地方层次：寺院、城主、都护府、商团、明教火祠；可得内容：楼兰原文、双译本、古城旧约",
        "relatedNpcIds": [
          "npc_贺兰辞",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "loulan_city"
        ],
        "nextStepIds": [
          "side_6_1_1g4l65c_settle"
        ]
      },
      {
        "stepId": "side_6_1_1g4l65c_settle",
        "title": "收束余波",
        "description": "收束方向：救经，查火，护书吏，或追失窃译本入玉门；余波：楼兰是否信任大夏，决定外邦线能否公开作证",
        "relatedNpcIds": [
          "npc_贺兰辞",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "loulan_city"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_6_2_3apnum",
    "title": "玉门缺印",
    "kind": "sidequest",
    "startStepId": "side_6_2_3apnum_start",
    "relatedNpcIds": [
      "npc_阿弥沙",
      "npc_贺兰辞",
      "npc_乌弥多"
    ],
    "relatedLocationIds": [
      "daxia_hexi"
    ],
    "tags": [
      "sidequest",
      "region_6"
    ],
    "steps": [
      {
        "stepId": "side_6_2_3apnum_start",
        "title": "接触事件",
        "description": "一批商货通关文书缺印，驼队被扣",
        "relatedNpcIds": [
          "npc_阿弥沙",
          "npc_贺兰辞",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "daxia_hexi"
        ],
        "nextStepIds": [
          "side_6_2_3apnum_investigate"
        ]
      },
      {
        "stepId": "side_6_2_3apnum_investigate",
        "title": "查证牵连",
        "description": "地方层次：都护府、驼队、互市监、关吏、暗市；可得内容：玉门缺印、驼牌行程、水井印",
        "relatedNpcIds": [
          "npc_阿弥沙",
          "npc_贺兰辞",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "daxia_hexi"
        ],
        "nextStepIds": [
          "side_6_2_3apnum_settle"
        ]
      },
      {
        "stepId": "side_6_2_3apnum_settle",
        "title": "收束余波",
        "description": "收束方向：保驼队，查关吏，换取水簿，或使都护府重新验印；余波：河西商路开闭，楼兰使团去留，外邦线证据能否入夏",
        "relatedNpcIds": [
          "npc_阿弥沙",
          "npc_贺兰辞",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "daxia_hexi"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_6_3_b0angq",
    "title": "火祠旧录",
    "kind": "sidequest",
    "startStepId": "side_6_3_b0angq_start",
    "relatedNpcIds": [
      "npc_袁知春",
      "npc_莎罗真",
      "npc_乌弥多"
    ],
    "relatedLocationIds": [
      "mingjiao_huoci",
      "loulan_city"
    ],
    "tags": [
      "sidequest",
      "region_6"
    ],
    "steps": [
      {
        "stepId": "side_6_3_b0angq_start",
        "title": "接触事件",
        "description": "火祠旧录被商团争夺，明教弟子被诬为劫货",
        "relatedNpcIds": [
          "npc_袁知春",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "mingjiao_huoci",
          "loulan_city"
        ],
        "nextStepIds": [
          "side_6_3_b0angq_investigate"
        ]
      },
      {
        "stepId": "side_6_3_b0angq_investigate",
        "title": "查证牵连",
        "description": "地方层次：明教、商团、驼队、暗市、都护府；可得内容：火祠旧约、流沙商团账、边镇护送旧例",
        "relatedNpcIds": [
          "npc_袁知春",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "mingjiao_huoci",
          "loulan_city"
        ],
        "nextStepIds": [
          "side_6_3_b0angq_settle"
        ]
      },
      {
        "stepId": "side_6_3_b0angq_settle",
        "title": "收束余波",
        "description": "收束方向：还明教清白，查商团，或以旧录换取流沙路保护；余波：明教是否愿意开放火祠记录，会影响外邦与暗线",
        "relatedNpcIds": [
          "npc_袁知春",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "mingjiao_huoci",
          "loulan_city"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_7_1_1ixncxl",
    "title": "剑阁封箱",
    "kind": "sidequest",
    "startStepId": "side_7_1_1ixncxl_start",
    "relatedNpcIds": [
      "npc_蒋横舟",
      "npc_唐无乐",
      "npc_阮明珰"
    ],
    "relatedLocationIds": [
      "tangmen_baopu"
    ],
    "tags": [
      "sidequest",
      "region_7"
    ],
    "steps": [
      {
        "stepId": "side_7_1_1ixncxl_start",
        "title": "接触事件",
        "description": "一只旧贡箱在山道被劫，劫匪死于机关",
        "relatedNpcIds": [
          "npc_蒋横舟",
          "npc_唐无乐",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "tangmen_baopu"
        ],
        "nextStepIds": [
          "side_7_1_1ixncxl_investigate"
        ]
      },
      {
        "stepId": "side_7_1_1ixncxl_investigate",
        "title": "查证牵连",
        "description": "地方层次：唐门、山道镖局、商帮、州县、暗市；可得内容：机关封箱痕、贡箱开封时辰、商帮改道记录",
        "relatedNpcIds": [
          "npc_蒋横舟",
          "npc_唐无乐",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "tangmen_baopu"
        ],
        "nextStepIds": [
          "side_7_1_1ixncxl_settle"
        ]
      },
      {
        "stepId": "side_7_1_1ixncxl_settle",
        "title": "收束余波",
        "description": "收束方向：查机关，保镖局，追回贡箱，或入唐门问封箱旧制；余波：唐门名声与商路安全同时受影响",
        "relatedNpcIds": [
          "npc_蒋横舟",
          "npc_唐无乐",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "tangmen_baopu"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_7_2_rv3fyn",
    "title": "银月矿契",
    "kind": "sidequest",
    "startStepId": "side_7_2_rv3fyn_start",
    "relatedNpcIds": [
      "npc_阿幼朵",
      "npc_段青岚",
      "npc_赵银簿"
    ],
    "relatedLocationIds": [
      "dali_erdu"
    ],
    "tags": [
      "sidequest",
      "region_7"
    ],
    "steps": [
      {
        "stepId": "side_7_2_rv3fyn_start",
        "title": "接触事件",
        "description": "银矿矿契一夜易主，矿工暴动",
        "relatedNpcIds": [
          "npc_阿幼朵",
          "npc_段青岚",
          "npc_赵银簿"
        ],
        "relatedLocationIds": [
          "dali_erdu"
        ],
        "nextStepIds": [
          "side_7_2_rv3fyn_investigate"
        ]
      },
      {
        "stepId": "side_7_2_rv3fyn_investigate",
        "title": "查证牵连",
        "description": "地方层次：大理王族、矿主、茶马商帮、山寨、矿工；可得内容：银月暗契、神京赌债、矿银流向",
        "relatedNpcIds": [
          "npc_阿幼朵",
          "npc_段青岚",
          "npc_赵银簿"
        ],
        "relatedLocationIds": [
          "dali_erdu"
        ],
        "nextStepIds": [
          "side_7_2_rv3fyn_settle"
        ]
      },
      {
        "stepId": "side_7_2_rv3fyn_settle",
        "title": "收束余波",
        "description": "收束方向：平矿乱，护账房，查矿契，或用大理王族名分压商帮；余波：大理与大夏边境关系、银路财赋与山寨态度都会变化",
        "relatedNpcIds": [
          "npc_阿幼朵",
          "npc_段青岚",
          "npc_赵银簿"
        ],
        "relatedLocationIds": [
          "dali_erdu"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_7_3_1ds38j2",
    "title": "毒源错案",
    "kind": "sidequest",
    "startStepId": "side_7_3_1ds38j2_start",
    "relatedNpcIds": [
      "npc_谷之岚",
      "npc_阿幼朵",
      "npc_岑药奴"
    ],
    "relatedLocationIds": [
      "wudu_shanlin",
      "dali_erdu"
    ],
    "tags": [
      "sidequest",
      "region_7"
    ],
    "steps": [
      {
        "stepId": "side_7_3_1ds38j2_start",
        "title": "接触事件",
        "description": "一名证人死于毒物，官面指向五毒",
        "relatedNpcIds": [
          "npc_谷之岚",
          "npc_阿幼朵",
          "npc_岑药奴"
        ],
        "relatedLocationIds": [
          "wudu_shanlin",
          "dali_erdu"
        ],
        "nextStepIds": [
          "side_7_3_1ds38j2_investigate"
        ]
      },
      {
        "stepId": "side_7_3_1ds38j2_investigate",
        "title": "查证牵连",
        "description": "地方层次：五毒、药铺、边寨、官面、南海香药商；可得内容：毒源错认、南海混毒、证人死亡真因",
        "relatedNpcIds": [
          "npc_谷之岚",
          "npc_阿幼朵",
          "npc_岑药奴"
        ],
        "relatedLocationIds": [
          "wudu_shanlin",
          "dali_erdu"
        ],
        "nextStepIds": [
          "side_7_3_1ds38j2_settle"
        ]
      },
      {
        "stepId": "side_7_3_1ds38j2_settle",
        "title": "收束余波",
        "description": "收束方向：验毒，保五毒医者，查香药来路，或送医案入万花；余波：五毒名声、南海香药线与伪证人死亡线都会变化",
        "relatedNpcIds": [
          "npc_谷之岚",
          "npc_阿幼朵",
          "npc_岑药奴"
        ],
        "relatedLocationIds": [
          "wudu_shanlin",
          "dali_erdu"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_8_1_p2y95r",
    "title": "贡舶缺项",
    "kind": "sidequest",
    "startStepId": "side_8_1_p2y95r_start",
    "relatedNpcIds": [
      "npc_林海市",
      "npc_摩罗悉",
      "npc_阮明珰"
    ],
    "relatedLocationIds": [
      "daxia_lingnan"
    ],
    "tags": [
      "sidequest",
      "region_8"
    ],
    "steps": [
      {
        "stepId": "side_8_1_p2y95r_start",
        "title": "接触事件",
        "description": "贡舶入港后，副单缺项被说成商人私吞",
        "relatedNpcIds": [
          "npc_林海市",
          "npc_摩罗悉",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "daxia_lingnan"
        ],
        "nextStepIds": [
          "side_8_1_p2y95r_investigate"
        ]
      },
      {
        "stepId": "side_8_1_p2y95r_investigate",
        "title": "查证牵连",
        "description": "地方层次：市舶司、香舶会、海道军、外邦使团、港口暗市；可得内容：贡舶缺项、船籍副单、太府寺入库差异",
        "relatedNpcIds": [
          "npc_林海市",
          "npc_摩罗悉",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "daxia_lingnan"
        ],
        "nextStepIds": [
          "side_8_1_p2y95r_settle"
        ]
      },
      {
        "stepId": "side_8_1_p2y95r_settle",
        "title": "收束余波",
        "description": "收束方向：查仓，护掌柜，验外邦贡品，或让海道军重开护航令；余波：南海商路、贡品入京与外邦线采信都会改变",
        "relatedNpcIds": [
          "npc_林海市",
          "npc_摩罗悉",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "daxia_lingnan"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_8_2_cr65bc",
    "title": "雾罗药路",
    "kind": "sidequest",
    "startStepId": "side_8_2_cr65bc_start",
    "relatedNpcIds": [
      "npc_阿幼朵",
      "npc_岑药奴",
      "npc_摩罗悉"
    ],
    "relatedLocationIds": [
      "daxia_lingnan"
    ],
    "tags": [
      "sidequest",
      "region_8"
    ],
    "steps": [
      {
        "stepId": "side_8_2_cr65bc_start",
        "title": "接触事件",
        "description": "采药人被祭司扣押，商帮声称其偷药",
        "relatedNpcIds": [
          "npc_阿幼朵",
          "npc_岑药奴",
          "npc_摩罗悉"
        ],
        "relatedLocationIds": [
          "daxia_lingnan"
        ],
        "nextStepIds": [
          "side_8_2_cr65bc_investigate"
        ]
      },
      {
        "stepId": "side_8_2_cr65bc_investigate",
        "title": "查证牵连",
        "description": "地方层次：药山、祭司、香药商、山寨、外邦医者；可得内容：雾罗药路、混毒采买、南海香药真伪",
        "relatedNpcIds": [
          "npc_阿幼朵",
          "npc_岑药奴",
          "npc_摩罗悉"
        ],
        "relatedLocationIds": [
          "daxia_lingnan"
        ],
        "nextStepIds": [
          "side_8_2_cr65bc_settle"
        ]
      },
      {
        "stepId": "side_8_2_cr65bc_settle",
        "title": "收束余波",
        "description": "收束方向：救采药人，谈祭司，断商帮假药路，或把医方送往万花；余波：岭南药价、五毒名声、南海外邦医者处境都会变化",
        "relatedNpcIds": [
          "npc_阿幼朵",
          "npc_岑药奴",
          "npc_摩罗悉"
        ],
        "relatedLocationIds": [
          "daxia_lingnan"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_8_3_rhgvoi",
    "title": "海道改令",
    "kind": "sidequest",
    "startStepId": "side_8_3_rhgvoi_start",
    "relatedNpcIds": [
      "npc_林海市",
      "npc_阮明珰",
      "npc_郑潮生"
    ],
    "relatedLocationIds": [
      "daxia_lingnan"
    ],
    "tags": [
      "sidequest",
      "region_8"
    ],
    "steps": [
      {
        "stepId": "side_8_3_rhgvoi_start",
        "title": "接触事件",
        "description": "一名海道军书吏被指私改护航令",
        "relatedNpcIds": [
          "npc_林海市",
          "npc_阮明珰",
          "npc_郑潮生"
        ],
        "relatedLocationIds": [
          "daxia_lingnan"
        ],
        "nextStepIds": [
          "side_8_3_rhgvoi_investigate"
        ]
      },
      {
        "stepId": "side_8_3_rhgvoi_investigate",
        "title": "查证牵连",
        "description": "地方层次：海道军、市舶司、香舶会、海盗、港税吏；可得内容：海道改令、船坞出入、星门旧旗",
        "relatedNpcIds": [
          "npc_林海市",
          "npc_阮明珰",
          "npc_郑潮生"
        ],
        "relatedLocationIds": [
          "daxia_lingnan"
        ],
        "nextStepIds": [
          "side_8_3_rhgvoi_settle"
        ]
      },
      {
        "stepId": "side_8_3_rhgvoi_settle",
        "title": "收束余波",
        "description": "收束方向：保书吏，查船坞，追旧旗，或揭出海盗船籍担保；余波：海道军立场与南海、东海两线相连",
        "relatedNpcIds": [
          "npc_林海市",
          "npc_阮明珰",
          "npc_郑潮生"
        ],
        "relatedLocationIds": [
          "daxia_lingnan"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_9_1_1qzb8cp",
    "title": "沉船铜筒",
    "kind": "sidequest",
    "startStepId": "side_9_1_1qzb8cp_start",
    "relatedNpcIds": [
      "npc_方有崖",
      "npc_金允成",
      "npc_郑潮生"
    ],
    "relatedLocationIds": [
      "penglai_island",
      "daxia_donghai"
    ],
    "tags": [
      "sidequest",
      "region_9"
    ],
    "steps": [
      {
        "stepId": "side_9_1_1qzb8cp_start",
        "title": "接触事件",
        "description": "一艘旧贡舶残骸被发现，各方争夺船木",
        "relatedNpcIds": [
          "npc_方有崖",
          "npc_金允成",
          "npc_郑潮生"
        ],
        "relatedLocationIds": [
          "penglai_island",
          "daxia_donghai"
        ],
        "nextStepIds": [
          "side_9_1_1qzb8cp_investigate"
        ]
      },
      {
        "stepId": "side_9_1_1qzb8cp_investigate",
        "title": "查证牵连",
        "description": "地方层次：蓬莱、明州港、海东商馆、港税、海盗；可得内容：沉船铜筒、贡舶副本、海图差异",
        "relatedNpcIds": [
          "npc_方有崖",
          "npc_金允成",
          "npc_郑潮生"
        ],
        "relatedLocationIds": [
          "penglai_island",
          "daxia_donghai"
        ],
        "nextStepIds": [
          "side_9_1_1qzb8cp_settle"
        ]
      },
      {
        "stepId": "side_9_1_1qzb8cp_settle",
        "title": "收束余波",
        "description": "收束方向：打捞铜筒，护船匠，查海盗旗，或让海东译官验副本；余波：海东使团是否愿作证，取决于沉船责任如何处理",
        "relatedNpcIds": [
          "npc_方有崖",
          "npc_金允成",
          "npc_郑潮生"
        ],
        "relatedLocationIds": [
          "penglai_island",
          "daxia_donghai"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_9_2_150vzn3",
    "title": "刀剑换名",
    "kind": "sidequest",
    "startStepId": "side_9_2_150vzn3_start",
    "relatedNpcIds": [
      "npc_方有崖",
      "npc_沈罗介",
      "npc_叶晖"
    ],
    "relatedLocationIds": [
      "haidong_ports"
    ],
    "tags": [
      "sidequest",
      "region_9"
    ],
    "steps": [
      {
        "stepId": "side_9_2_150vzn3_start",
        "title": "接触事件",
        "description": "玄济入贡刀剑出现在暗市，被当作私购军器",
        "relatedNpcIds": [
          "npc_方有崖",
          "npc_沈罗介",
          "npc_叶晖"
        ],
        "relatedLocationIds": [
          "haidong_ports"
        ],
        "nextStepIds": [
          "side_9_2_150vzn3_investigate"
        ]
      },
      {
        "stepId": "side_9_2_150vzn3_investigate",
        "title": "查证牵连",
        "description": "地方层次：海东商馆、藏剑外署、暗市、港口官面；可得内容：入贡刀剑名册、军器伪证、暗市兵器流向",
        "relatedNpcIds": [
          "npc_方有崖",
          "npc_沈罗介",
          "npc_叶晖"
        ],
        "relatedLocationIds": [
          "haidong_ports"
        ],
        "nextStepIds": [
          "side_9_2_150vzn3_settle"
        ]
      },
      {
        "stepId": "side_9_2_150vzn3_settle",
        "title": "收束余波",
        "description": "收束方向：验刀，保刀师，查暗市，或通藏剑山庄；余波：军证线可得到替代证据，海东商馆名声受影响",
        "relatedNpcIds": [
          "npc_方有崖",
          "npc_沈罗介",
          "npc_叶晖"
        ],
        "relatedLocationIds": [
          "haidong_ports"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_9_3_1ihgri6",
    "title": "星门灯灭",
    "kind": "sidequest",
    "startStepId": "side_9_3_1ihgri6_start",
    "relatedNpcIds": [
      "npc_方有崖",
      "npc_林海市",
      "npc_郑潮生"
    ],
    "relatedLocationIds": [
      "haidong_ports"
    ],
    "tags": [
      "sidequest",
      "region_9"
    ],
    "steps": [
      {
        "stepId": "side_9_3_1ihgri6_start",
        "title": "接触事件",
        "description": "灯塔一夜熄灭，贡船触礁，港税吏被迫担责",
        "relatedNpcIds": [
          "npc_方有崖",
          "npc_林海市",
          "npc_郑潮生"
        ],
        "relatedLocationIds": [
          "haidong_ports"
        ],
        "nextStepIds": [
          "side_9_3_1ihgri6_investigate"
        ]
      },
      {
        "stepId": "side_9_3_1ihgri6_investigate",
        "title": "查证牵连",
        "description": "地方层次：港主、税吏、船主、海道军、海盗旧旗；可得内容：船籍担保、旧旗、海盗与正规船路勾连",
        "relatedNpcIds": [
          "npc_方有崖",
          "npc_林海市",
          "npc_郑潮生"
        ],
        "relatedLocationIds": [
          "haidong_ports"
        ],
        "nextStepIds": [
          "side_9_3_1ihgri6_settle"
        ]
      },
      {
        "stepId": "side_9_3_1ihgri6_settle",
        "title": "收束余波",
        "description": "收束方向：修灯塔，查旧旗，保税吏，或追回被藏的船籍册；余波：东海与岭南海道军线合并",
        "relatedNpcIds": [
          "npc_方有崖",
          "npc_林海市",
          "npc_郑潮生"
        ],
        "relatedLocationIds": [
          "haidong_ports"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_10_1_tlyyvl",
    "title": "雪岭护卷",
    "kind": "sidequest",
    "startStepId": "side_10_1_tlyyvl_start",
    "relatedNpcIds": [
      "npc_柏岚山",
      "npc_桑吉洛",
      "npc_玄正"
    ],
    "relatedLocationIds": [
      "xueling_yaoshan"
    ],
    "tags": [
      "sidequest",
      "region_10"
    ],
    "steps": [
      {
        "stepId": "side_10_1_tlyyvl_start",
        "title": "接触事件",
        "description": "寺寨拒交一名大夏逃人，边军欲索人",
        "relatedNpcIds": [
          "npc_柏岚山",
          "npc_桑吉洛",
          "npc_玄正"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": [
          "side_10_1_tlyyvl_investigate"
        ]
      },
      {
        "stepId": "side_10_1_tlyyvl_investigate",
        "title": "查证牵连",
        "description": "地方层次：寺寨、边军、山民、商队、佛寺调停；可得内容：雪岭庇护誓书、旧证人去向、追杀者名目",
        "relatedNpcIds": [
          "npc_柏岚山",
          "npc_桑吉洛",
          "npc_玄正"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": [
          "side_10_1_tlyyvl_settle"
        ]
      },
      {
        "stepId": "side_10_1_tlyyvl_settle",
        "title": "收束余波",
        "description": "收束方向：保寺寨，换誓书，调停边军，或护证人下山；余波：雪岭对大夏官面态度会改变",
        "relatedNpcIds": [
          "npc_柏岚山",
          "npc_桑吉洛",
          "npc_玄正"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_10_2_9u6yr6",
    "title": "乌泉水印",
    "kind": "sidequest",
    "startStepId": "side_10_2_9u6yr6_start",
    "relatedNpcIds": [
      "npc_阿弥沙",
      "npc_莎罗真",
      "npc_乌弥多"
    ],
    "relatedLocationIds": [
      "loulan_city"
    ],
    "tags": [
      "sidequest",
      "region_10"
    ],
    "steps": [
      {
        "stepId": "side_10_2_9u6yr6_start",
        "title": "接触事件",
        "description": "水井印被盗，驼队互相指盗",
        "relatedNpcIds": [
          "npc_阿弥沙",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "loulan_city"
        ],
        "nextStepIds": [
          "side_10_2_9u6yr6_investigate"
        ]
      },
      {
        "stepId": "side_10_2_9u6yr6_investigate",
        "title": "查证牵连",
        "description": "地方层次：小邦守印人、驼队、城主、商团、暗市；可得内容：乌泉水印、水簿、河西货箱时辰",
        "relatedNpcIds": [
          "npc_阿弥沙",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "loulan_city"
        ],
        "nextStepIds": [
          "side_10_2_9u6yr6_settle"
        ]
      },
      {
        "stepId": "side_10_2_9u6yr6_settle",
        "title": "收束余波",
        "description": "收束方向：找印，保守印人，查假水簿，或让楼兰寺院作证；余波：河西商路水井信用受损，楼兰线更难走",
        "relatedNpcIds": [
          "npc_阿弥沙",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "loulan_city"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_10_3_w9bqo2",
    "title": "药泉病亡录",
    "kind": "sidequest",
    "startStepId": "side_10_3_w9bqo2_start",
    "relatedNpcIds": [
      "npc_谷之岚",
      "npc_桑吉洛",
      "npc_仁钦"
    ],
    "relatedLocationIds": [
      "xueling_yaoshan"
    ],
    "tags": [
      "sidequest",
      "region_10"
    ],
    "steps": [
      {
        "stepId": "side_10_3_w9bqo2_start",
        "title": "接触事件",
        "description": "一名病亡者被认成逃犯，寺邦被要求交尸",
        "relatedNpcIds": [
          "npc_谷之岚",
          "npc_桑吉洛",
          "npc_仁钦"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": [
          "side_10_3_w9bqo2_investigate"
        ]
      },
      {
        "stepId": "side_10_3_w9bqo2_investigate",
        "title": "查证牵连",
        "description": "地方层次：寺邦、医僧、边镇、逃亡者、旧案证人；可得内容：病亡录、半句证词、证人非灭口的替代证据",
        "relatedNpcIds": [
          "npc_谷之岚",
          "npc_桑吉洛",
          "npc_仁钦"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": [
          "side_10_3_w9bqo2_settle"
        ]
      },
      {
        "stepId": "side_10_3_w9bqo2_settle",
        "title": "收束余波",
        "description": "收束方向：验尸，护病亡录，调停边镇，或将医录送万花；余波：伪证人线可得替代证据，寺邦庇护名声受影响",
        "relatedNpcIds": [
          "npc_谷之岚",
          "npc_桑吉洛",
          "npc_仁钦"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_11_1_684zvd",
    "title": "一个故事一壶酒",
    "kind": "sidequest",
    "startStepId": "side_11_1_684zvd_start",
    "relatedNpcIds": [
      "npc_韩照夜",
      "npc_袁知春",
      "npc_乌弥多",
      "npc_阮明珰"
    ],
    "relatedLocationIds": [
      "jiangnan_qiantang",
      "daxia_hexi",
      "daxia_lingnan",
      "daxia_shenjing",
      "hongchen_jiujia_qiantang"
    ],
    "tags": [
      "sidequest",
      "region_11"
    ],
    "steps": [
      {
        "stepId": "side_11_1_684zvd_start",
        "title": "接触事件",
        "description": "不同分号收到同一故事的不同版本",
        "relatedNpcIds": [
          "npc_韩照夜",
          "npc_袁知春",
          "npc_乌弥多",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "jiangnan_qiantang",
          "daxia_hexi",
          "daxia_lingnan",
          "daxia_shenjing",
          "hongchen_jiujia_qiantang"
        ],
        "nextStepIds": [
          "side_11_1_684zvd_investigate"
        ]
      },
      {
        "stepId": "side_11_1_684zvd_investigate",
        "title": "查证牵连",
        "description": "可得内容：同一暗号、多地酒账、伪证人改名、商路旧客",
        "relatedNpcIds": [
          "npc_韩照夜",
          "npc_袁知春",
          "npc_乌弥多",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "jiangnan_qiantang",
          "daxia_hexi",
          "daxia_lingnan",
          "daxia_shenjing",
          "hongchen_jiujia_qiantang"
        ],
        "nextStepIds": [
          "side_11_1_684zvd_settle"
        ]
      },
      {
        "stepId": "side_11_1_684zvd_settle",
        "title": "收束余波",
        "description": "收束方向：比对酒账，找讲故事的人，或以故事换取藏身；余波：红尘酒家消息网会因信任或失信而开合",
        "relatedNpcIds": [
          "npc_韩照夜",
          "npc_袁知春",
          "npc_乌弥多",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "jiangnan_qiantang",
          "daxia_hexi",
          "daxia_lingnan",
          "daxia_shenjing",
          "hongchen_jiujia_qiantang"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_11_2_xg9s4k",
    "title": "渡浮沉旧客",
    "kind": "sidequest",
    "startStepId": "side_11_2_xg9s4k_start",
    "relatedNpcIds": [
      "npc_杜怀璧",
      "npc_罗青芦",
      "npc_袁知春"
    ],
    "relatedLocationIds": [
      "hongchen_jiujia_qiantang"
    ],
    "tags": [
      "sidequest",
      "region_11"
    ],
    "steps": [
      {
        "stepId": "side_11_2_xg9s4k_start",
        "title": "接触事件",
        "description": "一名旧客饮下渡浮沉后不愿再认旧名",
        "relatedNpcIds": [
          "npc_杜怀璧",
          "npc_罗青芦",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "hongchen_jiujia_qiantang"
        ],
        "nextStepIds": [
          "side_11_2_xg9s4k_investigate"
        ]
      },
      {
        "stepId": "side_11_2_xg9s4k_investigate",
        "title": "查证牵连",
        "description": "可得内容：旧名、债契、伪证人线、暗市胁迫",
        "relatedNpcIds": [
          "npc_杜怀璧",
          "npc_罗青芦",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "hongchen_jiujia_qiantang"
        ],
        "nextStepIds": [
          "side_11_2_xg9s4k_settle"
        ]
      },
      {
        "stepId": "side_11_2_xg9s4k_settle",
        "title": "收束余波",
        "description": "收束方向：保旧客，逼其作证，查债契，或放其远走；余波：若强逼旧客，红尘酒家未必再信{{user}}；若放走旧客，主线证据可能延后",
        "relatedNpcIds": [
          "npc_杜怀璧",
          "npc_罗青芦",
          "npc_袁知春"
        ],
        "relatedLocationIds": [
          "hongchen_jiujia_qiantang"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_12_1_11wlzoz",
    "title": "金帐裂誓",
    "kind": "sidequest",
    "startStepId": "side_12_1_11wlzoz_start",
    "relatedNpcIds": [
      "npc_阿史那绯云",
      "npc_阿史那青烈",
      "npc_阿史那乌勒"
    ],
    "relatedLocationIds": [
      "hanbei_jinting"
    ],
    "tags": [
      "sidequest",
      "region_12"
    ],
    "steps": [
      {
        "stepId": "side_12_1_11wlzoz_start",
        "title": "接触事件",
        "description": "汗庭诸部争一份旧誓书，阿史那绯云与阿史那青烈分别代表不同部族说法",
        "relatedNpcIds": [
          "npc_阿史那绯云",
          "npc_阿史那青烈",
          "npc_阿史那乌勒"
        ],
        "relatedLocationIds": [
          "hanbei_jinting"
        ],
        "nextStepIds": [
          "side_12_1_11wlzoz_investigate"
        ]
      },
      {
        "stepId": "side_12_1_11wlzoz_investigate",
        "title": "查证牵连",
        "description": "地方层次：汗庭王帐、诸部贵族、巫祝、马市商人、大夏边军；可得内容：金帐裂誓、马市银路、瀚北诸部对大夏正朔的真实态度",
        "relatedNpcIds": [
          "npc_阿史那绯云",
          "npc_阿史那青烈",
          "npc_阿史那乌勒"
        ],
        "relatedLocationIds": [
          "hanbei_jinting"
        ],
        "nextStepIds": [
          "side_12_1_11wlzoz_settle"
        ]
      },
      {
        "stepId": "side_12_1_11wlzoz_settle",
        "title": "收束余波",
        "description": "收束方向：调停会盟，护送誓书，支持某一部说法，或只保马市不问汗庭内争；余波：瀚北互市、北境军马、草原王女入夏态度都会变化",
        "relatedNpcIds": [
          "npc_阿史那绯云",
          "npc_阿史那青烈",
          "npc_阿史那乌勒"
        ],
        "relatedLocationIds": [
          "hanbei_jinting"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_12_2_11lz5hb",
    "title": "苍洱婚书",
    "kind": "sidequest",
    "startStepId": "side_12_2_11lz5hb_start",
    "relatedNpcIds": [
      "npc_段俭魏",
      "npc_段青岚",
      "npc_段慎思",
      "npc_段月仪"
    ],
    "relatedLocationIds": [
      "dali_shenjian_gong",
      "dali_erdu"
    ],
    "tags": [
      "sidequest",
      "region_12"
    ],
    "steps": [
      {
        "stepId": "side_12_2_11lz5hb_start",
        "title": "接触事件",
        "description": "段月仪的婚书被人调换，王族与神剑宫互相追责",
        "relatedNpcIds": [
          "npc_段俭魏",
          "npc_段青岚",
          "npc_段慎思",
          "npc_段月仪"
        ],
        "relatedLocationIds": [
          "dali_shenjian_gong",
          "dali_erdu"
        ],
        "nextStepIds": [
          "side_12_2_11lz5hb_investigate"
        ]
      },
      {
        "stepId": "side_12_2_11lz5hb_investigate",
        "title": "查证牵连",
        "description": "地方层次：大理王族、神剑宫、佛寺、茶马商帮、山寨诸部；可得内容：苍洱婚书、大理朝贡副册、茶马银路",
        "relatedNpcIds": [
          "npc_段俭魏",
          "npc_段青岚",
          "npc_段慎思",
          "npc_段月仪"
        ],
        "relatedLocationIds": [
          "dali_shenjian_gong",
          "dali_erdu"
        ],
        "nextStepIds": [
          "side_12_2_11lz5hb_settle"
        ]
      },
      {
        "stepId": "side_12_2_11lz5hb_settle",
        "title": "收束余波",
        "description": "收束方向：查婚书来源，保段氏名分，调停山寨，或追银路入神京；余波：大理是否信任大夏、段氏是否开放使团副册，都会受影响",
        "relatedNpcIds": [
          "npc_段俭魏",
          "npc_段青岚",
          "npc_段慎思",
          "npc_段月仪"
        ],
        "relatedLocationIds": [
          "dali_shenjian_gong",
          "dali_erdu"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_12_3_z1g2lw",
    "title": "楼兰水权",
    "kind": "sidequest",
    "startStepId": "side_12_3_z1g2lw_start",
    "relatedNpcIds": [
      "npc_弥兰真珠",
      "npc_阿弥沙",
      "npc_莎罗真",
      "npc_乌弥多"
    ],
    "relatedLocationIds": [
      "loulan_city"
    ],
    "tags": [
      "sidequest",
      "region_12"
    ],
    "steps": [
      {
        "stepId": "side_12_3_z1g2lw_start",
        "title": "接触事件",
        "description": "绿洲水权书被盗，楼兰、乌泉和商团互指对方断水",
        "relatedNpcIds": [
          "npc_弥兰真珠",
          "npc_阿弥沙",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "loulan_city"
        ],
        "nextStepIds": [
          "side_12_3_z1g2lw_investigate"
        ]
      },
      {
        "stepId": "side_12_3_z1g2lw_investigate",
        "title": "查证牵连",
        "description": "地方层次：楼兰寺院、绿洲城主、守印人、驼队、流沙商团；可得内容：绿洲水权书、乌泉水印、火祠司灯名册",
        "relatedNpcIds": [
          "npc_弥兰真珠",
          "npc_阿弥沙",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "loulan_city"
        ],
        "nextStepIds": [
          "side_12_3_z1g2lw_settle"
        ]
      },
      {
        "stepId": "side_12_3_z1g2lw_settle",
        "title": "收束余波",
        "description": "收束方向：找回水权书，保水井信用，查商团，或请明教出面验火祠旧录；余波：流沙商路是否畅通，楼兰寺院是否愿作证，会随处理变化",
        "relatedNpcIds": [
          "npc_弥兰真珠",
          "npc_阿弥沙",
          "npc_莎罗真",
          "npc_乌弥多"
        ],
        "relatedLocationIds": [
          "loulan_city"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_12_4_1y5qnwx",
    "title": "海东礼位",
    "kind": "sidequest",
    "startStepId": "side_12_4_1y5qnwx_start",
    "relatedNpcIds": [
      "npc_辰罗素真",
      "npc_方有崖",
      "npc_金允成",
      "npc_沈罗介"
    ],
    "relatedLocationIds": [
      "daxia_donghai",
      "haidong_ports",
      "daxia_shenjing"
    ],
    "tags": [
      "sidequest",
      "region_12"
    ],
    "steps": [
      {
        "stepId": "side_12_4_1y5qnwx_start",
        "title": "接触事件",
        "description": "辰罗、玄济、东岚三国使团为礼位争执，鸿胪馆压下原文",
        "relatedNpcIds": [
          "npc_辰罗素真",
          "npc_方有崖",
          "npc_金允成",
          "npc_沈罗介"
        ],
        "relatedLocationIds": [
          "daxia_donghai",
          "haidong_ports",
          "daxia_shenjing"
        ],
        "nextStepIds": [
          "side_12_4_1y5qnwx_investigate"
        ]
      },
      {
        "stepId": "side_12_4_1y5qnwx_investigate",
        "title": "查证牵连",
        "description": "地方层次：鸿胪馆、海东使团、海商、蓬莱船路、暗市刀坊；可得内容：礼位三稿、玄济刀契、东岚海雾图",
        "relatedNpcIds": [
          "npc_辰罗素真",
          "npc_方有崖",
          "npc_金允成",
          "npc_沈罗介"
        ],
        "relatedLocationIds": [
          "daxia_donghai",
          "haidong_ports",
          "daxia_shenjing"
        ],
        "nextStepIds": [
          "side_12_4_1y5qnwx_settle"
        ]
      },
      {
        "stepId": "side_12_4_1y5qnwx_settle",
        "title": "收束余波",
        "description": "收束方向：调停礼位，保护译官，查刀契，或追沉船海图；余波：海东诸国是否承认大夏新解释，会受此事影响",
        "relatedNpcIds": [
          "npc_辰罗素真",
          "npc_方有崖",
          "npc_金允成",
          "npc_沈罗介"
        ],
        "relatedLocationIds": [
          "daxia_donghai",
          "haidong_ports",
          "daxia_shenjing"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_12_5_1g9x3ya",
    "title": "南海贡珠",
    "kind": "sidequest",
    "startStepId": "side_12_5_1g9x3ya_start",
    "relatedNpcIds": [
      "npc_离珠明玑",
      "npc_林海市",
      "npc_摩罗悉",
      "npc_阮明珰"
    ],
    "relatedLocationIds": [
      "daxia_lingnan",
      "nanhai_ports"
    ],
    "tags": [
      "sidequest",
      "region_12"
    ],
    "steps": [
      {
        "stepId": "side_12_5_1g9x3ya_start",
        "title": "接触事件",
        "description": "离珠贡珠失窃，离珠明玑被迫留在岭南等查",
        "relatedNpcIds": [
          "npc_离珠明玑",
          "npc_林海市",
          "npc_摩罗悉",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "daxia_lingnan",
          "nanhai_ports"
        ],
        "nextStepIds": [
          "side_12_5_1g9x3ya_investigate"
        ]
      },
      {
        "stepId": "side_12_5_1g9x3ya_investigate",
        "title": "查证牵连",
        "description": "地方层次：南海王族、香舶会、市舶司、海道军、港口暗市；可得内容：贡珠双匣、真陀医方夹页、槟罗佣兵契",
        "relatedNpcIds": [
          "npc_离珠明玑",
          "npc_林海市",
          "npc_摩罗悉",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "daxia_lingnan",
          "nanhai_ports"
        ],
        "nextStepIds": [
          "side_12_5_1g9x3ya_settle"
        ]
      },
      {
        "stepId": "side_12_5_1g9x3ya_settle",
        "title": "收束余波",
        "description": "收束方向：查贡珠，保贡使，追海盗，或打开海道军护航令；余波：南海诸舶国对大夏港路信用的判断会改变",
        "relatedNpcIds": [
          "npc_离珠明玑",
          "npc_林海市",
          "npc_摩罗悉",
          "npc_阮明珰"
        ],
        "relatedLocationIds": [
          "daxia_lingnan",
          "nanhai_ports"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_12_6_vs3nvt",
    "title": "雪岭护灯",
    "kind": "sidequest",
    "startStepId": "side_12_6_vs3nvt_start",
    "relatedNpcIds": [
      "npc_桑吉洛",
      "npc_玄正",
      "npc_陈月",
      "npc_仁钦"
    ],
    "relatedLocationIds": [
      "xueling_yaoshan"
    ],
    "tags": [
      "sidequest",
      "region_12"
    ],
    "steps": [
      {
        "stepId": "side_12_6_vs3nvt_start",
        "title": "接触事件",
        "description": "寺寨护灯誓被撕毁，边镇要求交出旧案证人",
        "relatedNpcIds": [
          "npc_桑吉洛",
          "npc_玄正",
          "npc_陈月",
          "npc_仁钦"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": [
          "side_12_6_vs3nvt_investigate"
        ]
      },
      {
        "stepId": "side_12_6_vs3nvt_investigate",
        "title": "查证牵连",
        "description": "地方层次：寺寨、药宗、医僧、山民、边镇军府；可得内容：白塔会盟印、药宗救治录、寺寨护灯誓",
        "relatedNpcIds": [
          "npc_桑吉洛",
          "npc_玄正",
          "npc_陈月",
          "npc_仁钦"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": [
          "side_12_6_vs3nvt_settle"
        ]
      },
      {
        "stepId": "side_12_6_vs3nvt_settle",
        "title": "收束余波",
        "description": "收束方向：护证人，调停边镇，送医录入万花，或保寺寨不被定为藏匿逃犯；余波：雪岭诸部、药宗、少林与边镇之间的信任会改变",
        "relatedNpcIds": [
          "npc_桑吉洛",
          "npc_玄正",
          "npc_陈月",
          "npc_仁钦"
        ],
        "relatedLocationIds": [
          "xueling_yaoshan"
        ],
        "nextStepIds": []
      }
    ]
  },
  {
    "questId": "side_12_7_5ashfo",
    "title": "青峡质子",
    "kind": "sidequest",
    "startStepId": "side_12_7_5ashfo_start",
    "relatedNpcIds": [
      "npc_柏岚山",
      "npc_阿弥沙",
      "npc_郑潮生",
      "npc_青檀"
    ],
    "relatedLocationIds": [
      "daxia_shenjing",
      "xueling_yaoshan"
    ],
    "tags": [
      "sidequest",
      "region_12"
    ],
    "steps": [
      {
        "stepId": "side_12_7_5ashfo_start",
        "title": "接触事件",
        "description": "青峡国王女青檀收到质子旧函，函中称鸿胪馆有人逼小邦改认印信",
        "relatedNpcIds": [
          "npc_柏岚山",
          "npc_阿弥沙",
          "npc_郑潮生",
          "npc_青檀"
        ],
        "relatedLocationIds": [
          "daxia_shenjing",
          "xueling_yaoshan"
        ],
        "nextStepIds": [
          "side_12_7_5ashfo_investigate"
        ]
      },
      {
        "stepId": "side_12_7_5ashfo_investigate",
        "title": "查证牵连",
        "description": "地方层次：小邦王室、关主、鸿胪馆、船籍港、守印人；可得内容：质子旧函、井印换手、星门港灯契",
        "relatedNpcIds": [
          "npc_柏岚山",
          "npc_阿弥沙",
          "npc_郑潮生",
          "npc_青檀"
        ],
        "relatedLocationIds": [
          "daxia_shenjing",
          "xueling_yaoshan"
        ],
        "nextStepIds": [
          "side_12_7_5ashfo_settle"
        ]
      },
      {
        "stepId": "side_12_7_5ashfo_settle",
        "title": "收束余波",
        "description": "收束方向：保青檀入夏，护质子旧函，查鸿胪馆旧人，或先稳青峡关税；余波：夹缝诸邦是否愿承认新秩序，会从此线开始变化",
        "relatedNpcIds": [
          "npc_柏岚山",
          "npc_阿弥沙",
          "npc_郑潮生",
          "npc_青檀"
        ],
        "relatedLocationIds": [
          "daxia_shenjing",
          "xueling_yaoshan"
        ],
        "nextStepIds": []
      }
    ]
  }
];
