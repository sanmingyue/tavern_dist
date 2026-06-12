// 全量第五层展开：读取每个第四层yaml，根据类型自动追加展开内容
import fs from 'fs';
import path from 'path';

const BASE = 'src/角色卡/XX市/世界书/地图';
let expanded = 0;
let skipped = 0;

// 随机姓名生成器
const surnames = ['陈','李','王','张','刘','赵','周','吴','孙','马','朱','胡','林','郭','何','高','罗','郑','梁','谢','宋','唐','韩','曹','许','邓','萧','冯','曾','程','蔡','彭','潘','袁','于','董','余','苏','叶','吕','魏','蒋','田','杜','丁','沈','姜','范','江','傅','钟','卢','汪','戴','崔','任','陆','廖','姚','方','金','邱','夏','贾','邹','石','熊','孟','秦','阎','薛','侯','雷','白','龙','段','郝','孔','邵','史','毛','常','万','顾','赖','武','康','贺','严','尹','钱','施','牛','洪','龚'];
const maleNames = ['强','伟','刚','勇','军','磊','涛','斌','鑫','峰','超','波','亮','明','辉','杰','飞','鹏','浩','宇','建','文','志','国','海','山','平','成','东','正','华','兴','荣','福','德','生'];
const femaleNames = ['芳','丽','娟','敏','静','秀','英','华','慧','巧','美','玲','桂','莉','蓉','梅','琴','兰','凤','洁','霞','珍','玉','萍','红','娜','婷','雪','燕','云','莲','馨','瑶','琳','欣','颖'];

function randName(gender) {
  const s = surnames[Math.floor(Math.random() * surnames.length)];
  const pool = gender === '女' ? femaleNames : maleNames;
  const n = pool[Math.floor(Math.random() * pool.length)];
  return s + n;
}
function randAge(min, max) { return min + Math.floor(Math.random() * (max - min)); }
function randItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// 根据类型生成展开内容
function generateExpansion(name, type, existingContent) {
  // 如果已经有很详细的内容（超过15行），跳过
  if (existingContent.split('\n').length > 20) return null;

  // 如果内容中已有"老板"/"店铺"/"摊位"/"楼层"/"设施详情"等，说明已展开
  if (/老板|老板娘|店铺详情|摊位详情|楼层详情|项目详情|园区详情|设施详情/.test(existingContent)) return null;

  const t = type.toLowerCase();

  // 便利店
  if (t.includes('便利店')) {
    const boss = randName('女');
    return `  店内详情:
    店员: ${boss}，${randAge(20,30)}岁，穿制服戴工牌，礼貌快速
    面积: 约40平方米
    商品: 饮料零食、便当饭团(8-15元)、关东煮(3-5元/串)、咖啡(8-12元)、日用品、充电线
    服务: 复印打印、代收快递、充值缴费、ATM机
    营业: 24小时`;
  }

  // 药房
  if (t.includes('药房') || t.includes('药店')) {
    const boss = randName('女');
    return `  店内详情:
    店长: ${boss}，${randAge(30,50)}岁，穿白大褂，耐心解答用药问题
    面积: 约60平方米
    经营: 常用药品(感冒药/止痛药/消炎药/创可贴)、保健品、医疗器械(血压计/体温计)、个护用品
    特色: 可刷医保卡，部分药品有执业药师指导
    营业: 8:00-22:00`;
  }

  // 银行网点
  if (t.includes('银行')) {
    return `  网点详情:
    大堂经理: ${randName('女')}，${randAge(25,40)}岁，穿行服佩工牌，主动引导客户
    窗口: 约3-4个柜台窗口
    自助区: ATM机2-3台、自助服务终端1台
    服务: 存取款、转账汇款、开卡销户、理财咨询、外币兑换
    工作时间: 9:00-17:00（周末10:00-16:00）
    等候区: 约15个座位，有饮水机和杂志`;
  }

  // 理发店
  if (t.includes('理发') || t.includes('快剪')) {
    const boss = randName('男');
    return `  店内详情:
    老板: ${boss}，${randAge(25,45)}岁，穿围裙戴耳麦，手法利落
    工位: 约${randAge(3,8)}个理发位
    价格: 快剪15元、洗剪吹30-50元、烫发/染发80-200元
    特色: ${randItem(['老客户可预约不排队','送头皮护理','学生凭证优惠5元','办卡充300送50'])}
    营业: 9:00-21:00`;
  }

  // 水果店
  if (t.includes('水果')) {
    const boss = randName(randItem(['男','女']));
    return `  店内详情:
    老板: ${boss}，${randAge(28,50)}岁，${randItem(['热情招呼可以试吃','安静等你自己挑','会帮你挑最甜的','推荐当季水果'])}
    面积: 约50平方米
    品类: 苹果/香蕉/橙子/葡萄/草莓/西瓜/芒果/荔枝(按季节)
    价格: 苹果5-8元/斤、香蕉3-5元/斤、草莓15-30元/斤(季节价)
    特色: ${randItem(['可以散装按个买','支持外卖配送','有切果盘服务10元起','买5斤送1斤'])}
    营业: 7:00-22:00`;
  }

  // 早餐店/早餐摊
  if (t.includes('早餐')) {
    const boss = randName(randItem(['男','女']));
    return `  店内详情:
    老板: ${boss}，${randAge(35,55)}岁，凌晨4点起来准备，${randItem(['手脚麻利话不多','热情大嗓门','安静做事偶尔抬头笑一下'])}
    菜单: 豆浆2元、油条2元/根、包子2元/个(鲜肉/菜包/豆沙)、煎饼果子6-8元、粢饭团4元、馄饨8元
    营业: 5:00-10:00
    氛围: 早高峰排队，蒸汽腾腾，豆浆香和油条香混合`;
  }

  // 面馆
  if (t.includes('面馆') || t.includes('面')) {
    if (t.includes('方') || t.includes('广')) return null;
    const boss = randName(randItem(['男','女']));
    return `  店内详情:
    老板: ${boss}，${randAge(35,55)}岁，${randItem(['山东人面条劲道','本地人汤底鲜美','四川人爱放辣椒','兰州人拉面一绝'])}
    座位: 约${randAge(6,15)}张桌子
    菜单: 片儿川15元、拌面8-10元、大排面22元、牛肉面18元、馄饨10元
    特色: ${randItem(['面条手擀的','汤底用猪骨熬8小时','加面不加钱','每桌免费小菜'])}
    营业: 6:00-20:00`;
  }

  // 奶茶店
  if (t.includes('奶茶')) {
    return `  店内详情:
    店员: 多为兼职大学生或年轻人，穿品牌统一制服
    热门: 珍珠奶茶、杨枝甘露、多肉葡萄、柠檬水
    价格: 均价8-18元
    等候: 高峰期(午间/放学后)等待约5-15分钟
    营业: 10:00-22:00`;
  }

  // 快递驿站/快递代收
  if (t.includes('快递')) {
    const boss = randName(randItem(['男','女']));
    return `  站点详情:
    负责人: ${boss}，${randAge(25,45)}岁，每天处理数百个包裹
    面积: 约30平方米
    货架: 约50-80个格位
    服务: 代收包裹、寄件(首重8-12元)、上门取件
    营业: 8:00-21:00
    高峰: 双11/618期间包裹堆满地`;
  }

  // 公交站
  if (t.includes('公交站')) {
    return `  站点详情:
    设施: 候车亭(有顶棚遮雨)、站牌(电子屏显示到站时间)、座椅2-3张
    周边: 垃圾桶、共享单车停放点
    高峰: 早7:00-8:30、晚17:00-18:30人最多`;
  }

  // 地铁站
  if (t.includes('地铁站')) {
    return `  站内详情:
    设施: 自动售票机约4台、安检通道2-3条、公共卫生间、无障碍电梯
    商业: 站内便利店1家(全家/罗森)、自动贩卖机2台
    出口: 通常A/B/C/D四个出口
    首末班: 首班约6:00-6:30，末班约22:00-22:30
    高峰间隔: 约3-5分钟，非高峰约8-10分钟`;
  }

  // 加油站
  if (t.includes('加油站')) {
    return `  站内详情:
    油枪: 约6-8台加油机
    油品: 92号(7.8元/升)、95号(8.3元/升)、98号(9.2元/升)
    附设: 便利店(饮料零食矿泉水)、洗车服务(25元/次)、充气服务(免费)
    营业: 24小时
    员工: 约4-6名加油员轮班`;
  }

  // 停车场
  if (t.includes('停车场') || t.includes('停车')) {
    return `  停车详情:
    类型: ${t.includes('地下') ? '地下停车场' : '地面/立体停车场'}
    收费: 首${randItem(['30分钟','1小时'])}免费，之后${randAge(5,10)}元/小时，${randAge(30,60)}元封顶/天
    支付: 支持微信/支付宝扫码、ETC、现金
    出入口: ${randAge(1,3)}个`;
  }

  // 派出所
  if (t.includes('派出所')) {
    return `  所内详情:
    值班民警: 24小时值班
    服务: 户籍办理(工作日9:00-17:00)、身份证补办、报案、治安调解
    设施: 办事大厅、调解室、监控室、临时留置室
    电话: 110报警、辖区服务热线`;
  }

  // 消防站
  if (t.includes('消防站') || t.includes('消防')) {
    return `  站内详情:
    值班人员: 24小时值班，约15-20名消防员
    车辆: 消防车2-3台、云梯车1台(大站配备)
    设施: 训练塔、器材库、值班室、休息室
    出警: 接警后60秒内出发`;
  }

  // 社区卫生中心
  if (t.includes('卫生中心') || t.includes('卫生服务') || t.includes('社区医院')) {
    const doc = randName(randItem(['男','女']));
    return `  中心详情:
    全科医生: ${doc}医生等${randAge(3,6)}名，可看常见病
    服务: 全科门诊、预防接种、慢病管理(高血压/糖尿病)、中医理疗、健康体检
    挂号费: 10元
    工作时间: 8:00-17:00（周末值班）
    特色: ${randItem(['老年人免费量血压','儿童疫苗接种','中医推拿针灸','家庭医生签约服务'])}`;
  }

  // 幼儿园
  if (t.includes('幼儿园')) {
    const principal = randName('女');
    return `  园内详情:
    园长: ${principal}，${randAge(35,50)}岁，${randItem(['温柔有耐心','严格但公正','经验丰富备受家长信赖'])}
    班级: ${randAge(6,15)}个班，每班约30名幼儿
    设施: 教室(配空调)、户外游乐区(滑梯/秋千/沙坑)、食堂、午睡室、舞蹈室
    伙食: 两餐两点(早点/午餐/午点/晚餐前加餐)，每月伙食费约400-600元
    学费: 公立约1000-1500元/月，私立约3000-8000元/月
    接送: 8:00-8:30入园，16:30-17:00离园，可延时托管至18:00(加收)`;
  }

  // 小学
  if (t.includes('小学')) {
    const principal = randName(randItem(['男','女']));
    return `  校内详情:
    校长: ${principal}，${randAge(40,55)}岁
    规模: 每年级${randAge(2,6)}个班，每班约40人
    设施: 教学楼、操场(200-300米跑道)、图书室、电脑室、音乐教室、美术教室
    上课时间: 8:00-15:30(低年级)、8:00-16:00(高年级)
    校门口: 上下学时段家长接送密集，有交通协管员维持秩序`;
  }

  // 中学/初中
  if (t.includes('初中') || t.includes('中学')) {
    if (t.includes('高中') || t.includes('职高')) return null; // 高中和职高单独处理
    const principal = randName(randItem(['男','女']));
    return `  校内详情:
    校长: ${principal}，${randAge(42,55)}岁
    规模: 每年级${randAge(4,10)}个班，每班约45人
    设施: 教学楼、实验楼(物理/化学/生物)、操场(400米跑道)、图书馆、食堂
    上课时间: 7:30-16:30，走读为主
    考试: 每学期期中期末考试，初三有中考模拟`;
  }

  // 公园
  if (t.includes('公园') && !t.includes('入口') && !t.includes('游乐')) {
    return `  园内详情:
    开放时间: ${randItem(['全天开放','6:00-22:00','6:00-21:00'])}
    门票: 免费
    设施: 步道、长椅、${randItem(['健身器材','儿童游乐区','篮球场','广场舞场地'])}、公共卫生间
    氛围: 早晨${randItem(['太极拳','晨跑','遛鸟'])}，傍晚${randItem(['广场舞','散步遛狗','老人下棋'])}，周末${randItem(['家庭野餐','儿童玩耍','情侣约会'])}`;
  }

  // 超市
  if (t.includes('超市')) {
    return `  店内详情:
    面积: 约${randAge(500,3000)}平方米
    分区: 蔬菜水果区、肉类水产区、乳制品区、零食饮料区、日用百货区、粮油调料区
    收银台: 约${randAge(4,12)}个，含自助收银
    特色: ${randItem(['生鲜每日特价','满100减10活动','会员卡积分','每周三会员日'])}
    营业: ${randItem(['7:00-22:00','8:00-22:00','24小时'])}`;
  }

  // 菜场/农贸市场
  if (t.includes('菜场') || t.includes('农贸')) {
    return `  市场详情:
    摊位: 约${randAge(30,80)}个
    分区: 蔬菜区、水果区、肉类区、水产区、豆制品区、熟食卤味区、干货粮油区
    特色: ${randItem(['凌晨5点开门最新鲜','有几个摊位祖传三代','熟食区下午3点出锅排队','本地菜农直卖'])}
    营业: 5:00-18:30
    氛围: 讨价还价声、剁肉声、水花声交织`;
  }

  // 住宅小区
  if (t.includes('住宅') || t.includes('小区') || t.includes('公寓') || t.includes('花园')) {
    if (t.includes('底商')) return null;
    const units = randAge(3,12);
    const floors = randAge(6,28);
    const households = units * floors * randAge(2,4);
    return `  小区详情:
    栋数: ${units}栋${floors > 8 ? '高层' : '多层'}
    总户数: 约${households}户
    户型: ${floors > 8 ? '一室(40-55m²)/两室(75-95m²)/三室(110-140m²)' : '两室(65-80m²)/三室(85-110m²)'}
    ${floors > 8 ? '电梯: 每栋2部电梯' : '楼梯: 无电梯步行楼梯'}
    物业费: ${(Math.random() * 2 + 1.5).toFixed(1)}元/m²/月
    停车: ${floors > 8 ? '地下车库' : '地面停车位'}，约${Math.floor(households * 0.6)}个车位
    配套: 小区花园、${randItem(['儿童游乐区','健身器材','篮球场半片','凉亭长椅'])}
    底商: ${randItem(['便利店、药房、水果店','早餐店、理发店、快递驿站','超市、面馆、洗衣店'])}`;
  }

  // 写字楼/商务
  if (t.includes('写字楼') || t.includes('商务')) {
    return `  大楼详情:
    楼层: ${randAge(12,30)}层
    电梯: ${randAge(4,8)}部
    租户: 各类企业约${randAge(30,100)}家
    物业: ${(Math.random() * 3 + 4).toFixed(1)}元/m²/月
    配套: 大堂前台、地下停车场、便利店、咖啡厅
    工作时间: 多数租户9:00-18:00`;
  }

  // 酒店/客栈/民宿
  if (t.includes('酒店') || t.includes('客栈') || t.includes('民宿') || t.includes('旅社')) {
    const front = randName('女');
    return `  住宿详情:
    前台: ${front}，${randAge(22,35)}岁，${randItem(['甜美笑容礼貌热情','干练高效','安静但细心'])}
    房型: 标间${randAge(150,400)}元/晚、大床房${randAge(180,500)}元/晚${t.includes('星') ? '、套房' + randAge(800,2000) + '元/晚' : ''}
    设施: 空调、WiFi、独立卫浴、${randItem(['电视','书桌','小冰箱'])}
    入住: 14:00后入住，12:00前退房
    ${t.includes('民宿') ? '特色: ' + randItem(['老板亲自泡茶聊天','有院子可以晒太阳','老房子改建很有味道','养了一只猫']) : ''}`;
  }

  // KTV
  if (t.includes('ktv') || t.includes('KTV')) {
    return `  店内详情:
    包间: 约${randAge(15,25)}个(小包/中包/大包/豪华包)
    价格: 下午场(14:00-18:00)人均38元、晚间场(18:00-凌晨)人均68元、买断(凌晨-次日6:00)人均30元
    设备: JBL音响、点歌系统(10万+曲库)
    酒水: 啤酒10元/瓶、果盘38元、小食拼盘28元
    营业: 12:00-凌晨6:00`;
  }

  // 网咖/网吧
  if (t.includes('网咖') || t.includes('网吧')) {
    return `  店内详情:
    机位: 约${randAge(60,150)}个
    配置: i7/RTX4060/27寸144Hz显示器
    分区: 普通区${randAge(3,5)}元/小时、电竞区${randAge(6,10)}元/小时、包间${randAge(15,25)}元/小时
    饮品: 咖啡8元、可乐5元、泡面6元
    营业: 24小时
    氛围: 键盘声鼠标声此起彼伏，偶尔爆发一声"好！"或"啊！"`;
  }

  // 健身房
  if (t.includes('健身')) {
    const coach = randName('男');
    return `  店内详情:
    面积: 约${randAge(200,600)}平方米
    器械: 跑步机${randAge(8,20)}台、椭圆机${randAge(4,10)}台、力量器械${randAge(10,25)}组、自由重量区
    课程: 瑜伽、操课、搏击操、普拉提
    教练: ${coach}等${randAge(3,8)}名教练，私教${randAge(150,300)}元/小时
    价格: 月卡${randAge(150,300)}元、年卡${randAge(1200,2500)}元
    营业: 7:00-23:00`;
  }

  // 电影院
  if (t.includes('电影院') || t.includes('影城')) {
    return `  影城详情:
    影厅: ${randAge(4,10)}个，含${randItem(['IMAX厅1个','杜比厅1个','4DX体感厅1个'])}
    座位: 约${randAge(600,1500)}座
    票价: 普通厅${randAge(35,50)}元、特殊厅${randAge(60,100)}元
    小食: 爆米花(小18元/大28元)、可乐12元、热狗15元
    营业: 9:00-凌晨${randItem(['0:00','1:00','2:00'])}
    优惠: ${randItem(['周二半价','学生证优惠','会员积分兑换','首映场赠海报'])}`;
  }

  // 书店
  if (t.includes('书店') || t.includes('书局') || t.includes('书城')) {
    const boss = randName(randItem(['男','女']));
    return `  店内详情:
    ${t.includes('独立') ? '老板: ' + boss + '，' + randAge(28,50) + '岁，' + randItem(['爱猫人士店里养了一只猫','会在书架边贴手写推荐语','每周办读书会','安静不打扰客人']) : '店员: 约' + randAge(3,8) + '名，穿统一制服'}
    面积: 约${randAge(100,500)}平方米
    分区: ${randItem(['文学/社科/教辅/儿童','畅销书/文创/咖啡区','旧书/古籍/线装书'])}
    特色: ${randItem(['可以坐着看书不买也没关系','有咖啡座可边喝边看','定期签售活动','二手书可以以旧换新'])}
    营业: ${randItem(['9:00-21:00','10:00-22:00','9:00-22:00'])}`;
  }

  // 景区入口/景点
  if (t.includes('景区') || t.includes('景点') || t.includes('古迹')) {
    return null; // 景区景点通常在第四层已经写够了
  }

  // 茶馆
  if (t.includes('茶馆') || t.includes('茶楼')) {
    const boss = randName(randItem(['男','女']));
    return `  店内详情:
    老板: ${boss}，${randAge(40,65)}岁，${randItem(['穿中式棉麻衣','戴老花镜泡茶慢条斯理','喜欢跟客人聊茶道','以前是茶叶厂的老师傅'])}
    茶品: 龙井茶(38-188元/壶)、九曲红梅(28-88元/壶)、铁观音(25-60元/壶)
    茶点: 花生米、瓜子、绿豆糕、桂花糕，茶点套餐${randAge(15,30)}元
    座位: 约${randAge(6,15)}张桌子
    氛围: ${randItem(['安静幽雅适合聊天','老人家打牌下棋','偶尔有茶艺表演','窗外就是风景'])}
    营业: ${randItem(['8:00-21:00','9:00-22:00','7:00-20:00'])}`;
  }

  // 咖啡馆
  if (t.includes('咖啡')) {
    const boss = randName(randItem(['男','女']));
    return `  店内详情:
    ${t.includes('连锁') || t.includes('星巴克') || t.includes('瑞幸') ? '店员: 穿品牌制服的咖啡师' : '老板: ' + boss + '，' + randAge(25,40) + '岁，' + randItem(['从大厂辞职开了咖啡店','留过学回来创业','自己烘焙咖啡豆','养了一只猫趴在吧台'])}
    座位: 约${randAge(15,40)}个
    价格: 美式${randAge(15,25)}元、拿铁${randAge(20,35)}元、卡布${randAge(22,35)}元
    特色: ${randItem(['手冲单品咖啡','拉花很好看','有露台座位','安静适合办公','甜品也不错'])}
    营业: ${randItem(['8:00-22:00','9:00-21:00','7:30-23:00'])}`;
  }

  // 烧烤/烤肉
  if (t.includes('烧烤') || t.includes('烤')) {
    if (t.includes('烤鸡') || t.includes('加油')) return null;
    const boss = randName('男');
    return `  店内详情:
    老板: ${boss}，${randAge(30,50)}岁，${randItem(['东北人豪爽大方','本地人实在厚道','新疆人烤串一绝'])}
    菜单: 羊肉串3元/串、牛肉串4元/串、鸡翅5元/个、烤茄子8元、烤生蚝5元/个、啤酒8元/瓶
    座位: 约${randAge(8,20)}张桌子(室内外)
    营业: 17:00-凌晨${randItem(['1:00','2:00','3:00'])}
    氛围: 烟火气十足，碰杯声和笑声此起彼伏`;
  }

  return null; // 其他类型暂不展开
}

function walkAndExpand(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAndExpand(fullPath);
    } else if (entry.name.endsWith('.yaml')) {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // 提取类型字段
      const typeMatch = content.match(/类型:\s*(.+)/);
      if (!typeMatch) continue;

      const type = typeMatch[1].trim();

      // 提取名称
      const nameMatch = content.match(/^<(.+?)>/);
      if (!nameMatch) continue;
      const name = nameMatch[1];

      // 生成展开
      const expansion = generateExpansion(name, type, content);
      if (!expansion) {
        skipped++;
        continue;
      }

      // 检查是否已有展开内容
      if (content.includes('店内详情') || content.includes('站内详情') || content.includes('店铺') || content.includes('老板:') || content.includes('园内详情') || content.includes('校内详情') || content.includes('所内详情') || content.includes('站点详情') || content.includes('网点详情') || content.includes('中心详情') || content.includes('小区详情') || content.includes('大楼详情') || content.includes('住宿详情') || content.includes('影城详情') || content.includes('停车详情') || content.includes('市场详情')) {
        skipped++;
        continue;
      }

      // 在关闭标签前插入展开内容
      const closeTag = `</${name}>`;
      if (content.includes(closeTag)) {
        const newContent = content.replace(closeTag, expansion + '\n' + closeTag);
        fs.writeFileSync(fullPath, newContent, 'utf-8');
        expanded++;
      }
    }
  }
}

walkAndExpand(BASE);
console.log(`展开了 ${expanded} 个建筑，跳过了 ${skipped} 个（已有详情或不需要展开）`);
