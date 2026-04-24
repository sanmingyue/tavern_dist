
// ============================================================
// 商城商品数据 — 所有商品预写在前端，AI 不参与
// 禁止使用 emoji，所有图标由 Vue 组件中的 SVG 渲染
// ============================================================

export type ShopCategory = 'enhance' | 'skin' | 'skill';
export type SkinType = '尾翼' | '花纹' | '灯组' | '排气' | '空力套件' | '轮毂' | '赛车服' | '核心配色';
export type SkillDirection = '持续微调' | '反噬缓和' | '充能辅助' | '附带光效';
export type Quality = '基础级' | '精密级' | '极品级';
export type Tier = 'T5' | 'T4' | 'T3' | 'T2' | 'T1' | 'T0';
export type PriceTier = '基础' | '精品' | '限定' | '定制';

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  type: string;
  price: number;
  unlockTier: Tier;
  description: string;
  priceTier?: PriceTier;
  quality?: Quality;
  dimension?: '加速度' | '极速' | '操控' | '漂移' | '耐久';
  effectDirection?: SkillDirection;
  isBlackMarket?: boolean;
  sideEffect?: string;
  repeatable: boolean;
}

// ============================================================
// 强化物品 (15个) — 可重复购买
// ============================================================

export const ENHANCE_ITEMS: ShopItem[] = [
  // --- 加速度 ACC ---
  { id: 'E-ACC-1', name: '涡轮增压芯片·基础型', category: 'enhance', type: '加速度', price: 500, unlockTier: 'T5', description: '标准工业级增压芯片，为核心加速模块提供基础强化能量', quality: '基础级', dimension: '加速度', repeatable: true },
  { id: 'E-ACC-2', name: '涡轮增压芯片·精密型', category: 'enhance', type: '加速度', price: 2000, unlockTier: 'T5', description: '高纯度增压芯片，经过精密校准，强化效率显著提升', quality: '精密级', dimension: '加速度', repeatable: true },
  { id: 'E-ACC-3', name: '涡轮增压芯片·极品型', category: 'enhance', type: '加速度', price: 5000, unlockTier: 'T5', description: '顶级赛事御用增压芯片，军工级精度，强化效率最大化', quality: '极品级', dimension: '加速度', repeatable: true },
  // --- 极速 SPD ---
  { id: 'E-SPD-1', name: '极速调谐模块·基础型', category: 'enhance', type: '极速', price: 500, unlockTier: 'T5', description: '通用调谐模块，用于校准核心的极速输出频率', quality: '基础级', dimension: '极速', repeatable: true },
  { id: 'E-SPD-2', name: '极速调谐模块·精密型', category: 'enhance', type: '极速', price: 2000, unlockTier: 'T5', description: '高频调谐模块，以纳米级精度优化极速通道', quality: '精密级', dimension: '极速', repeatable: true },
  { id: 'E-SPD-3', name: '极速调谐模块·极品型', category: 'enhance', type: '极速', price: 5000, unlockTier: 'T5', description: '竞赛级调谐模块，零误差校准，突破极速瓶颈', quality: '极品级', dimension: '极速', repeatable: true },
  // --- 操控 HDL ---
  { id: 'E-HDL-1', name: '操控稳定陀螺·基础型', category: 'enhance', type: '操控', price: 500, unlockTier: 'T5', description: '标准稳定陀螺，为核心的操控响应系统提供基础强化', quality: '基础级', dimension: '操控', repeatable: true },
  { id: 'E-HDL-2', name: '操控稳定陀螺·精密型', category: 'enhance', type: '操控', price: 2000, unlockTier: 'T5', description: '三轴精密陀螺，显著提升操控信号的传导精度', quality: '精密级', dimension: '操控', repeatable: true },
  { id: 'E-HDL-3', name: '操控稳定陀螺·极品型', category: 'enhance', type: '操控', price: 5000, unlockTier: 'T5', description: '量子级稳定陀螺，业界最高精度的操控强化', quality: '极品级', dimension: '操控', repeatable: true },
  // --- 漂移 DFT ---
  { id: 'E-DFT-1', name: '漂移校准棱镜·基础型', category: 'enhance', type: '漂移', price: 500, unlockTier: 'T5', description: '标准折射棱镜，校准核心的漂移角度感知回路', quality: '基础级', dimension: '漂移', repeatable: true },
  { id: 'E-DFT-2', name: '漂移校准棱镜·精密型', category: 'enhance', type: '漂移', price: 2000, unlockTier: 'T5', description: '高折射棱镜，精确优化漂移状态的感知灵敏度', quality: '精密级', dimension: '漂移', repeatable: true },
  { id: 'E-DFT-3', name: '漂移校准棱镜·极品型', category: 'enhance', type: '漂移', price: 5000, unlockTier: 'T5', description: '全息棱镜，极致的漂移回路强化，职业车手的首选', quality: '极品级', dimension: '漂移', repeatable: true },
  // --- 耐久 END ---
  { id: 'E-END-1', name: '耐久强化纤维·基础型', category: 'enhance', type: '耐久', price: 500, unlockTier: 'T5', description: '工业级碳纤维束，加固核心的耐久结构层', quality: '基础级', dimension: '耐久', repeatable: true },
  { id: 'E-END-2', name: '耐久强化纤维·精密型', category: 'enhance', type: '耐久', price: 2000, unlockTier: 'T5', description: '编织碳纤维束，多层交叉加固，耐久提升显著', quality: '精密级', dimension: '耐久', repeatable: true },
  { id: 'E-END-3', name: '耐久强化纤维·极品型', category: 'enhance', type: '耐久', price: 5000, unlockTier: 'T5', description: '纳米碳管纤维，最高强度的耐久强化材料', quality: '极品级', dimension: '耐久', repeatable: true },
];

// ============================================================
// 外形改件 (55个) — 一次性购买
// ============================================================

export const SKIN_ITEMS: ShopItem[] = [
  // --- 花纹 (12) ---
  { id: 'S-PTN-01', name: '竞速条纹', category: 'skin', type: '花纹', price: 200, unlockTier: 'T5', priceTier: '基础', description: '经典的双色平行条纹，简洁利落，新秀赛场常见的入门涂装', repeatable: false },
  { id: 'S-PTN-02', name: '碳纤维纹', category: 'skin', type: '花纹', price: 300, unlockTier: 'T5', priceTier: '基础', description: '仿碳纤维编织纹理，低调中透出专业感', repeatable: false },
  { id: 'S-PTN-03', name: '闪电裂纹', category: 'skin', type: '花纹', price: 500, unlockTier: 'T5', priceTier: '基础', description: '从车头延伸至车尾的锯齿闪电纹，充满速度感', repeatable: false },
  { id: 'S-PTN-04', name: '都市迷彩', category: 'skin', type: '花纹', price: 1200, unlockTier: 'T5', priceTier: '精品', description: '城市街道灵感的几何迷彩，灰蓝配色', repeatable: false },
  { id: 'S-PTN-05', name: '烈焰涂装', category: 'skin', type: '花纹', price: 1500, unlockTier: 'T5', priceTier: '精品', description: '从引擎盖蔓延的火焰纹样，红橙渐变', repeatable: false },
  { id: 'S-PTN-06', name: '星空渐变', category: 'skin', type: '花纹', price: 2000, unlockTier: 'T4', priceTier: '精品', description: '深蓝到紫色的星空渐变，夜赛中格外亮眼', repeatable: false },
  { id: 'S-PTN-07', name: '赛博线路', category: 'skin', type: '花纹', price: 2500, unlockTier: 'T4', priceTier: '精品', description: '模拟电路板的荧光线路纹样，科技感十足', repeatable: false },
  { id: 'S-PTN-08', name: '水墨山水', category: 'skin', type: '花纹', price: 5000, unlockTier: 'T3', priceTier: '限定', description: '东方水墨画风格的泼墨涂装，黑白灰三色挥洒', repeatable: false },
  { id: 'S-PTN-09', name: '极光流彩', category: 'skin', type: '花纹', price: 8000, unlockTier: 'T3', priceTier: '限定', description: '模拟北极光色彩的渐变涂装，角度不同色彩变化', repeatable: false },
  { id: 'S-PTN-10', name: '冰裂纹', category: 'skin', type: '花纹', price: 10000, unlockTier: 'T2', priceTier: '限定', description: '宛如冰面碎裂的纹理，银白与冰蓝交织', repeatable: false },
  { id: 'S-PTN-11', name: '龙鳞甲', category: 'skin', type: '花纹', price: 15000, unlockTier: 'T2', priceTier: '定制', description: '仿龙鳞的立体浮雕纹理，金属光泽随光线变幻', repeatable: false },
  { id: 'S-PTN-12', name: '虹光全息', category: 'skin', type: '花纹', price: 20000, unlockTier: 'T1', priceTier: '定制', description: '全息投影材质涂装，车身在阳光下折射出彩虹色', repeatable: false },

  // --- 尾翼 (8) ---
  { id: 'S-WNG-01', name: '低矮鸭尾', category: 'skin', type: '尾翼', price: 300, unlockTier: 'T5', priceTier: '基础', description: '贴合车身的小型鸭尾翼，低调内敛', repeatable: false },
  { id: 'S-WNG-02', name: '标准GT尾翼', category: 'skin', type: '尾翼', price: 500, unlockTier: 'T5', priceTier: '基础', description: '经典GT赛车造型尾翼，碳纤维哑光质感', repeatable: false },
  { id: 'S-WNG-03', name: '双层刀锋翼', category: 'skin', type: '尾翼', price: 1500, unlockTier: 'T4', priceTier: '精品', description: '上下双层刀片式尾翼，攻击性外观', repeatable: false },
  { id: 'S-WNG-04', name: '天鹅颈尾翼', category: 'skin', type: '尾翼', price: 2500, unlockTier: 'T4', priceTier: '精品', description: '高位天鹅颈支架尾翼，优雅与力量并存', repeatable: false },
  { id: 'S-WNG-05', name: '可变角度翼', category: 'skin', type: '尾翼', price: 6000, unlockTier: 'T3', priceTier: '限定', description: '外观上模拟可变角度的机构造型，层次丰富', repeatable: false },
  { id: 'S-WNG-06', name: '透明水晶翼', category: 'skin', type: '尾翼', price: 8000, unlockTier: 'T2', priceTier: '限定', description: '透明材质尾翼，内嵌LED灯带，夜间发光', repeatable: false },
  { id: 'S-WNG-07', name: '浮空光翼', category: 'skin', type: '尾翼', price: 12000, unlockTier: 'T2', priceTier: '定制', description: '看似悬浮的分体式尾翼，极具未来感', repeatable: false },
  { id: 'S-WNG-08', name: '凤羽展翼', category: 'skin', type: '尾翼', price: 15000, unlockTier: 'T1', priceTier: '定制', description: '仿凤凰羽翼造型的大型尾翼，金红配色', repeatable: false },

  // --- 灯组 (7) ---
  { id: 'S-LGT-01', name: '鹰眼日行灯', category: 'skin', type: '灯组', price: 500, unlockTier: 'T5', priceTier: '基础', description: '锐利的鹰眼造型LED日行灯，提升辨识度', repeatable: false },
  { id: 'S-LGT-02', name: '环形光圈灯', category: 'skin', type: '灯组', price: 800, unlockTier: 'T5', priceTier: '基础', description: '四环光圈造型灯组，经典而辨识度高', repeatable: false },
  { id: 'S-LGT-03', name: '矩阵LED灯', category: 'skin', type: '灯组', price: 2000, unlockTier: 'T4', priceTier: '精品', description: '像素矩阵式灯组，可显示简单图案', repeatable: false },
  { id: 'S-LGT-04', name: '激光刀灯', category: 'skin', type: '灯组', price: 3000, unlockTier: 'T4', priceTier: '精品', description: '极细的激光切割灯带，锐利如刀锋', repeatable: false },
  { id: 'S-LGT-05', name: '流水转向灯', category: 'skin', type: '灯组', price: 5000, unlockTier: 'T3', priceTier: '限定', description: '依次点亮的流水式转向灯，动态视觉效果', repeatable: false },
  { id: 'S-LGT-06', name: '全息投影灯', category: 'skin', type: '灯组', price: 8000, unlockTier: 'T2', priceTier: '限定', description: '灯组投射全息光影，在车前方形成光幕', repeatable: false },
  { id: 'S-LGT-07', name: '星瞳灯组', category: 'skin', type: '灯组', price: 10000, unlockTier: 'T1', priceTier: '定制', description: '模拟星空瞳孔的灯组，自带呼吸明灭效果', repeatable: false },

  // --- 排气 (6) ---
  { id: 'S-EXH-01', name: '双出圆管', category: 'skin', type: '排气', price: 300, unlockTier: 'T5', priceTier: '基础', description: '经典双圆管排气，抛光不锈钢材质', repeatable: false },
  { id: 'S-EXH-02', name: '四出方管', category: 'skin', type: '排气', price: 600, unlockTier: 'T5', priceTier: '基础', description: '四方管排气，钛合金烧蓝渐变色', repeatable: false },
  { id: 'S-EXH-03', name: '中置双出', category: 'skin', type: '排气', price: 1800, unlockTier: 'T4', priceTier: '精品', description: '中置布局的双排气管，赛道风格', repeatable: false },
  { id: 'S-EXH-04', name: '蓝焰排气', category: 'skin', type: '排气', price: 3000, unlockTier: 'T4', priceTier: '精品', description: '排气火焰为湛蓝色，高贵冷艳', repeatable: false },
  { id: 'S-EXH-05', name: '金焰排气', category: 'skin', type: '排气', price: 6000, unlockTier: 'T3', priceTier: '限定', description: '排气火焰为金色，华丽而张扬', repeatable: false },
  { id: 'S-EXH-06', name: '极光尾焰', category: 'skin', type: '排气', price: 8000, unlockTier: 'T2', priceTier: '定制', description: '排气尾焰呈现极光般的多彩渐变', repeatable: false },

  // --- 空力套件 (6) ---
  { id: 'S-AERO-01', name: '运动前唇', category: 'skin', type: '空力套件', price: 1000, unlockTier: 'T4', priceTier: '基础', description: '低矮的运动前唇，增加车头的攻击性', repeatable: false },
  { id: 'S-AERO-02', name: '宽体侧裙', category: 'skin', type: '空力套件', price: 2500, unlockTier: 'T4', priceTier: '精品', description: '加宽车身视觉效果的宽体侧裙套件', repeatable: false },
  { id: 'S-AERO-03', name: '碳纤维扩散器', category: 'skin', type: '空力套件', price: 4000, unlockTier: 'T3', priceTier: '精品', description: '后部碳纤维扩散器，暴露的碳纤维编织纹理', repeatable: false },
  { id: 'S-AERO-04', name: '全包围套件', category: 'skin', type: '空力套件', price: 8000, unlockTier: 'T3', priceTier: '限定', description: '前后包围加侧裙的完整空力套件', repeatable: false },
  { id: 'S-AERO-05', name: '赛道版套件', category: 'skin', type: '空力套件', price: 12000, unlockTier: 'T2', priceTier: '限定', description: '赛事级全包围套件，棱角分明的赛道风格', repeatable: false },
  { id: 'S-AERO-06', name: '概念车套件', category: 'skin', type: '空力套件', price: 15000, unlockTier: 'T1', priceTier: '定制', description: '未来概念车风格的流线型空力套件', repeatable: false },

  // --- 轮毂 (6) ---
  { id: 'S-WHL-01', name: '五辐经典', category: 'skin', type: '轮毂', price: 500, unlockTier: 'T5', priceTier: '基础', description: '经典五辐轮毂，银色抛光面', repeatable: false },
  { id: 'S-WHL-02', name: '十辐战斧', category: 'skin', type: '轮毂', price: 800, unlockTier: 'T5', priceTier: '基础', description: '十辐战斧造型，亚光黑配色', repeatable: false },
  { id: 'S-WHL-03', name: '旋风多辐', category: 'skin', type: '轮毂', price: 2000, unlockTier: 'T4', priceTier: '精品', description: '旋风式多辐轮毂，高速旋转时产生视觉漩涡', repeatable: false },
  { id: 'S-WHL-04', name: '碟面轮毂', category: 'skin', type: '轮毂', price: 3500, unlockTier: 'T4', priceTier: '精品', description: '封闭式碟面轮毂，极致的流线型外观', repeatable: false },
  { id: 'S-WHL-05', name: '锻造竞技轮', category: 'skin', type: '轮毂', price: 7000, unlockTier: 'T3', priceTier: '限定', description: '锻造工艺竞技轮毂，金色与黑色拼接', repeatable: false },
  { id: 'S-WHL-06', name: '全息投影轮', category: 'skin', type: '轮毂', price: 12000, unlockTier: 'T1', priceTier: '定制', description: '轮毂表面带有全息投影图案，旋转时显示不同图案', repeatable: false },

  // --- 赛车服 (6) ---
  { id: 'S-SUIT-01', name: '竞速黑红', category: 'skin', type: '赛车服', price: 800, unlockTier: 'T4', priceTier: '基础', description: '黑色底色配红色线条的经典赛车服配色', repeatable: false },
  { id: 'S-SUIT-02', name: '极地白蓝', category: 'skin', type: '赛车服', price: 800, unlockTier: 'T4', priceTier: '基础', description: '白色底色配冰蓝色纹样，清爽干练', repeatable: false },
  { id: 'S-SUIT-03', name: '暗夜紫金', category: 'skin', type: '赛车服', price: 3000, unlockTier: 'T3', priceTier: '精品', description: '深紫色底配金色装饰线，高贵而神秘', repeatable: false },
  { id: 'S-SUIT-04', name: '霓虹都市', category: 'skin', type: '赛车服', price: 5000, unlockTier: 'T3', priceTier: '精品', description: '赛博朋克风格的霓虹色赛车服，自带荧光线条', repeatable: false },
  { id: 'S-SUIT-05', name: '星辰战甲', category: 'skin', type: '赛车服', price: 12000, unlockTier: 'T2', priceTier: '限定', description: '深空色底配星光点缀，如同穿着星空', repeatable: false },
  { id: 'S-SUIT-06', name: '皇家定制', category: 'skin', type: '赛车服', price: 20000, unlockTier: 'T1', priceTier: '定制', description: '顶级手工定制赛车服，配色和纹样独一无二', repeatable: false },

  // --- 核心配色 (4) ---
  { id: 'S-CORE-01', name: '蓝焰核心', category: 'skin', type: '核心配色', price: 2000, unlockTier: 'T3', priceTier: '精品', description: '核心发光色调为冷蓝色，稳定柔和的光效', repeatable: false },
  { id: 'S-CORE-02', name: '猩红核心', category: 'skin', type: '核心配色', price: 3000, unlockTier: 'T3', priceTier: '精品', description: '核心发光色调为深红色，脉动式光效如同心跳', repeatable: false },
  { id: 'S-CORE-03', name: '极光核心', category: 'skin', type: '核心配色', price: 15000, unlockTier: 'T2', priceTier: '限定', description: '核心发光呈现极光般的多色渐变，缓慢流动', repeatable: false },
  { id: 'S-CORE-04', name: '虚空核心', category: 'skin', type: '核心配色', price: 30000, unlockTier: 'T1', priceTier: '定制', description: '核心发出近乎透明的暗光，边缘有微弱的光子溢散效果', repeatable: false },
];

// ============================================================
// 技能改件 — 正规品 (8个) + 黑市品 (4个)
// ============================================================

export const SKILL_ITEMS: ShopItem[] = [
  // --- 正规品 ---
  { id: 'K-DUR-1', name: '恒流维持器', category: 'skill', type: '持续微调', price: 5000, unlockTier: 'T1', effectDirection: '持续微调', description: '稳定核心输出频率，轻微延长共鸣技能持续时间（约+1秒）', repeatable: false },
  { id: 'K-DUR-2', name: '永恒回路', category: 'skill', type: '持续微调', price: 15000, unlockTier: 'T1', effectDirection: '持续微调', description: '高阶维持模块，优化共鸣能量的衰减曲线（约+2秒）', repeatable: false },
  { id: 'K-BCK-1', name: '缓冲隔离片', category: 'skill', type: '反噬缓和', price: 8000, unlockTier: 'T1', effectDirection: '反噬缓和', description: '在核心与神经回路之间增设缓冲层，略微降低技能反噬', repeatable: false },
  { id: 'K-BCK-2', name: '消散导流器', category: 'skill', type: '反噬缓和', price: 20000, unlockTier: 'T1', effectDirection: '反噬缓和', description: '将反噬能量导入散热通道消散，恢复期缩短约15%', repeatable: false },
  { id: 'K-CHG-1', name: '聚能谐振器', category: 'skill', type: '充能辅助', price: 10000, unlockTier: 'T1', effectDirection: '充能辅助', description: '加速共鸣值的自然积累，约提升10%充能速度', repeatable: false },
  { id: 'K-CHG-2', name: '量子蓄能环', category: 'skill', type: '充能辅助', price: 25000, unlockTier: 'T1', effectDirection: '充能辅助', description: '利用量子纠缠效应加速共鸣积累，约提升15%充能速度', repeatable: false },
  { id: 'K-VFX-1', name: '光效增幅棱镜', category: 'skill', type: '附带光效', price: 5000, unlockTier: 'T1', effectDirection: '附带光效', description: '技能发动时产生额外的光芒扩散效果', repeatable: false },
  { id: 'K-VFX-2', name: '全息演出模块', category: 'skill', type: '附带光效', price: 12000, unlockTier: 'T1', effectDirection: '附带光效', description: '技能发动时生成全息投影演出效果，观赏性极强', repeatable: false },
];

// ============================================================
// 黑市技能改件 (4个) — 需要剧情解锁
// ============================================================

export const BLACK_MARKET_ITEMS: ShopItem[] = [
  { id: 'BK-DUR', name: '超限延展器', category: 'skill', type: '持续微调', price: 3000, unlockTier: 'T1', effectDirection: '持续微调', isBlackMarket: true, description: '强行延长技能持续时间（约+4秒），效果远超正规品', sideEffect: '使用后核心持续钝痛2至3小时，长期使用缩短核心寿命', repeatable: false },
  { id: 'BK-BCK', name: '神经阻断片', category: 'skill', type: '反噬缓和', price: 2500, unlockTier: 'T1', effectDirection: '反噬缓和', isBlackMarket: true, description: '直接阻断反噬痛觉信号，几乎感觉不到反噬', sideEffect: '实际反噬仍在发生但感知不到，极易造成隐性损伤积累', repeatable: false },
  { id: 'BK-CHG', name: '过载充能器', category: 'skill', type: '充能辅助', price: 4000, unlockTier: 'T1', effectDirection: '充能辅助', isBlackMarket: true, description: '强制加速共鸣值积累（约+40%），远超正规品', sideEffect: '核心过热风险，极端情况下可能导致核心裂纹', repeatable: false },
  { id: 'BK-VFX', name: '幻象发生器', category: 'skill', type: '附带光效', price: 1500, unlockTier: 'T1', effectDirection: '附带光效', isBlackMarket: true, description: '产生极其炫目的幻象光效，甚至可能干扰对手视线', sideEffect: '严格意义上属于违规（影响他人），被发现永久禁赛', repeatable: false },
];

// ============================================================
// 汇总
// ============================================================

/** 所有正规商品 */
export const ALL_SHOP_ITEMS: ShopItem[] = [...ENHANCE_ITEMS, ...SKIN_ITEMS, ...SKILL_ITEMS];

/** 所有商品（含黑市） */
export const ALL_ITEMS: ShopItem[] = [...ALL_SHOP_ITEMS, ...BLACK_MARKET_ITEMS];

/** 根据 ID 查找商品 */
export function findItemById(id: string): ShopItem | undefined {
  return ALL_ITEMS.find(item => item.id === id);
}

/** 赛事等级排序值 */
const TIER_ORDER: Record<Tier, number> = { T5: 0, T4: 1, T3: 2, T2: 3, T1: 4, T0: 5 };

/** 检查是否已解锁 */
export function isUnlocked(itemTier: Tier, playerTier: Tier): boolean {
  return TIER_ORDER[playerTier] >= TIER_ORDER[itemTier];
}
