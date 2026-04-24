# 修仙世界状态栏 —— 完整功能分析与模块化重构计划

> 编写时间: 2026-04-17
> 状态栏路径: `src/修仙世界状态栏/`
> 角色卡路径: `src/修仙世界重置版/`

---

## 一、项目总体架构

状态栏是一个**脚本项目**（仅有 `index.ts`，无 `index.html`），以悬浮按钮(FAB) + 可拖拽面板的形式挂载在酒馆网页上，通过 MVU 变量框架读写最新楼层的 `stat_data`。

### 文件结构

```
src/修仙世界状态栏/
├── index.ts                    # 入口：等待MVU初始化→创建Vue应用→挂载到酒馆页面
├── App.vue                     # 壳层：FAB悬浮按钮 + 面板（6个Tab页）
├── store.ts                    # Pinia Store：MVU数据读写+UI状态+储物戒操作+百艺配置
├── schema.ts                   # zod变量结构定义 + 境界/寿元辅助函数
├── storageUtils.ts             # 储物戒解析/扣除工具函数
├── characterPortraits.ts       # 角色名→立绘URL映射表（约140个角色）
├── schema.json                 # 由schema.ts生成的JSON Schema
├── types/
│   └── map.ts                  # 地图类型定义
└── components/
    ├── TabBasic.vue            # Tab1: 基础信息（位置/身份/时间/在场角色）
    ├── TabRealm.vue            # Tab2: 境界修炼（修炼/突破/功法/术法/寿元/心魔）
    ├── TabArtsList.vue         # Tab3: 百艺列表（已学会的百艺入口）
    ├── ArtPage.vue             # Tab3: 百艺子页面路由
    ├── TabItems.vue            # Tab4: 物品系统（灵石/装备/储物戒/钓鱼）
    ├── TabFishing.vue          # Tab4子: 钓鱼系统（嵌套在TabItems中）
    ├── TabRelations.vue        # Tab5: 关系系统（角色关系列表）
    ├── TabMap.vue              # Tab6: 地图系统（三层地图+传送阵）
    ├── mapData.ts              # 地图标记数据
    ├── StoragePicker.vue       # 通用：储物戒物品选择器
    ├── PortraitViewer.vue      # 通用：角色立绘查看器
    └── arts/                   # 百艺子页面（9个）
        ├── ArtAlchemy.vue      # 炼丹
        ├── ArtForging.vue      # 炼器
        ├── ArtFormation.vue    # 阵法
        ├── ArtTalisman.vue     # 符箓
        ├── ArtBeast.vue        # 驭兽
        ├── ArtMedical.vue      # 医术
        ├── ArtPuppet.vue       # 傀儡术
        ├── ArtHerb.vue         # 种植采药
        └── ArtSword.vue        # 剑心
```

### 关联的角色卡文件

```
src/修仙世界重置版/
├── DESIGN.md                   # 玩法体系重构技术方案（核心参考文档）
├── 脚本/schema.ts              # 角色卡端的zod变量结构定义（zod 4.x风格）
├── 世界书/变量/                 # 变量初始化+变量更新规则（约20个yaml文件）
├── 世界书/EJS控制器/            # EJS控制器（根据状态加载不同变量规则）
└── ...                         # 世界观、修炼、心魔、钓鱼等世界书条目
```

---

## 二、完整功能模块清单

### 模块 0: 入口与壳层

**文件**: `index.ts`, `App.vue`

**功能**:
- 等待 MVU 初始化后创建 Vue+Pinia 应用
- 使用 `createScriptIdDiv` 挂载到酒馆页面 body
- 使用 `teleportStyle` 将样式传送到酒馆页面 head
- 聊天切换时自动 reload (`reloadOnChatChange`)
- FAB 悬浮按钮：可拖动、移动端自动吸附边缘半隐藏、呼吸动画
- 面板：6个Tab页切换（基础/境界/百艺/物品/关系/地图）
- 主题切换：浅色/深色双主题，持久化到 localStorage
- PC端面板可拖动位置
- 移动端(≤500px)面板全屏
- 顶栏实时显示修炼状态和当前境界
- PC/移动端使用不同背景图(postimg.cc外链)

**问题**:
1. FAB 位置 clamp 逻辑中 `FAB_SIZE=52` 是硬编码常量（store.ts），但 App.vue 中 `FAB_SIZE` 是响应式计算(PC=60/手机=52)，两处不一致
2. 面板 `.panel-inner` 的 margin 在 `.is-mobile` class 和 `@media` query 中有两处定义，可能冲突
3. 背景图使用外部链接，可能加载慢或失败

---

### 模块 1: 数据层

**文件**: `store.ts`, `schema.ts`, `storageUtils.ts`

**功能**:

#### 1.1 MVU 数据读写
- `loadData()`: 从最新楼层读取 MVU 变量，用 `Schema.parse()` 解析到 `data` ref
- `saveData()`: 将 `data.value` 写回最新楼层的 MVU 变量
- 5秒轮询兜底 (`useIntervalFn`)
- 监听 `Mvu.events.VARIABLE_UPDATE_ENDED` 事件自动刷新数据

#### 1.2 Schema 定义
- A类变量（AI自由更新）: 位置、身份、时间、功法、灵石、储物戒、关系、境界、百艺境界、百艺装备、心魔、钓鱼结果
- B类变量（前端/脚本控制，AI只读）: 修炼状态、寿元系统、装备栏、钓鱼系统、百艺经验/熟练度
- 辅助函数: `get寿元上限()`, `get大境界()`, `境界寿元映射`

#### 1.3 脚本层事件处理 (VARIABLE_UPDATE_ENDED)
- **灵根锁定**: 读取第0楼灵根值，检测并还原被AI篡改的灵根
- **寿元自动映射**: 根据 `当前境界` 设置 `_寿元上限`
- **阴阳历→寿元扣除**: 追踪阴阳历年份变化，年份增加则扣除对应寿元。寿元低于阈值触发状态变化(衰老初期/灵力枯竭/油尽灯枯/寿终正寝→轮回)
- **百艺学习信号**: AI写入 `习得百艺` 后，脚本消费信号并设置对应百艺入门境界

#### 1.4 储物戒操作 (storageUtils.ts)
- `parseStorage()`: 解析储物戒字符串为结构化数组 `StorageItem[]`
- `filterByCategory()`: 按分类筛选
- `removeStorageItem()`: 从储物戒扣除指定物品
- `getStorageCategories()`: 获取所有分类列表
- 14种分类: 药材/矿石/丹药/符纸/灵墨/符箓/灵材/阵旗/饲料/傀儡件/种子/鱼获/成品/杂物
- 每种分类有对应颜色和SVG图标

#### 1.5 装备操作
- `equipItem(slot, itemName)`: 从 `未装备_xxx` 取出物品装备到 `_装备_xxx`
- `unequipItem(slot)`: 卸下装备放回 `未装备_xxx`
- 3个装备槽: 武器/防具/饰品

#### 1.6 计算属性
- 境界显示、寿元百分比/颜色、灵石总量(折算下品)、钓鱼成功率、修炼状态颜色、道途颜色
- 已学会百艺列表 (`learnedArts`)

**问题**:
1. **schema 两端不一致**: 状态栏 `schema.ts` 使用 `z.xxx().default()`（zod 3.x风格），角色卡 `脚本/schema.ts` 使用 `z.xxx().prefault()` + `z.transform()`（zod 4.x风格）。类型定义也有差异（如 `_当前百艺` 状态栏用enum、角色卡用string）
2. **store.ts 过于臃肿**(636行): 混合了UI状态管理、MVU数据操作、储物戒操作、装备操作、百艺配置(ARTS/TABS常量)、计算属性、事件处理等。应拆分为多个模块
3. **寿元年份计算bug**: `parseYearFromYinYangLi` 只匹配 `(\d+)年`，但阴阳历格式 `3转7纪482元·816年` 中如果跨元（482元→483元），年份会从如816"回退"到如1，导致不扣寿元或负数扣除
4. **装备操作分隔符**: `equipItem` 中解析 `未装备_xxx` 用 `、` 分隔，但部分逻辑也检查 `*` 分隔符，与储物戒的 `×` 不统一
5. **saveData 时序**: 多处先调 `saveData()` (async) 再 `triggerSlash()`，但 triggerSlash 是同步执行的，AI可能读到旧变量值

---

### 模块 2: Tab1 基础信息

**文件**: `components/TabBasic.vue`

**功能**:
- **当前位置**: 大区域/子区域/具体地点三级显示
- **在场角色**: 解析 `在场角色` 字段（按 `、，,；;` 分隔），显示为头像横排列表。有立绘的角色显示头像图片(可点击查看大图 PortraitViewer)，无立绘的显示首字母
- **身份信息**: 灵根(金色高亮)、道途(带颜色)、所属势力、宗门地位
- **时间**: 阴阳历日期 + 时辰(金色标签)

**问题**:
1. 功能相对简单，问题较少
2. 在场角色分隔符支持多种但角色名可能包含特殊字符导致误分割

---

### 模块 3: Tab2 境界修炼

**文件**: `components/TabRealm.vue`

**功能**:

#### 3.1 境界卡片
- 当前境界名称、修炼进度条(0-100%)
- 修炼状态标签（空闲/修炼中/突破中/渡劫中，各有颜色）
- 心魔状态标签（无/潜伏/活跃/对峙中，各有颜色）

#### 3.2 修炼面板
- 6种修炼方式：闭关打坐/服丹修炼/灵地修炼/实战淬炼/双修合道/悟道参禅
- 辅助丹药：从储物戒[丹药]分类中用 StoragePicker 选择（可选）
- 修炼地点：当前地点 / 自定义输入
- 额外补充：自由文本
- 内容预览：实时预览将发送给AI的内容
- 确认修炼：前端扣除丹药 → 设 `_修炼状态='修炼中'` → `saveData()` → `triggerSlash('/send ...')`

#### 3.3 突破/渡劫面板
- 触发条件：修炼进度 ≥ 100 且未在突破/渡劫中
- 渡劫判定：`当前境界` 严格等于 `渡劫期大圆满` 或 `渡劫大圆满` 时显示渡劫按钮
- 突破丹药：从储物戒选择（可选）
- 额外准备：自由文本
- 渡劫警告提示
- 确认：前端扣丹药 → 设 `_修炼状态='突破中'/'渡劫中'` → 发送

#### 3.4 主修功法
- 功法名称、品级、层数进度(已修/总层数)

#### 3.5 习得术法
- 解析 `习得术法` 字段（`术法名(等级)` 格式），标签式展示

#### 3.6 寿元
- 寿元进度条(带颜色变化)、剩余/上限、状态标签

#### 3.7 异火
- 条件显示异火列表（有异火时才显示区域）

#### 3.8 心魔详情
- 条件显示（心魔状态非"无"且有心魔名时）
- 心魔名、态度(6种颜色)、执念、记忆列表

**问题**:
1. **修炼时序**: `confirmCultivation` 中 `await store.saveData()` 后同步调 `triggerSlash`，但 saveData 写入 MVU 变量可能需要时间才能被 AI 侧的 EJS 控制器读取到
2. **停止修炼**: 只清空 `_修炼状态`，没有调 `saveData()` 后立即同步
3. **突破境界匹配**: 渡劫判定用严格等于 `渡劫期大圆满/渡劫大圆满`，AI若输出略有不同的格式（如"渡劫期·大圆满"）就无法匹配
4. **修炼方式选择**: UI 用方块按钮，移动端可能 3x2 grid 排列紧凑

---

### 模块 4: Tab3 百艺系统

**文件**: `components/TabArtsList.vue`, `components/ArtPage.vue`, `components/arts/*.vue`

**功能**:

#### 4.1 百艺列表 (TabArtsList.vue)
- 展示已学会的百艺（判断条件：对应百艺的境界字段非空）
- 9种百艺的卡片列表，每个卡片有图标(SVG)、名称、当前境界、箭头
- 空状态提示

#### 4.2 百艺子页面路由 (ArtPage.vue)
- 根据 `store.artsPage` 值渲染对应百艺组件
- 进入百艺时 `openArtsPage(art)` 写 `_当前百艺`（触发EJS控制器加载变量规则）
- 退出百艺时 `closeArtsPage()` 清空 `_当前百艺`

#### 4.3 九个百艺子页面

每个百艺页面的**通用结构**（以 ArtAlchemy.vue 为代表）:
1. 顶部导航栏：返回按钮("收起百艺") + 百艺名称+图标
2. 境界信息：当前百艺境界标签
3. 熟练度/经验值：双进度条
4. 工具信息：显示当前装备的工具（丹炉/锻造台/符笔等）
5. 操作区域：
   - 产物名称输入
   - 从 StoragePicker 选择主要材料
   - 从 StoragePicker 选择辅助材料（可选）
   - 操作方式选择（按钮组，各百艺不同）
   - 额外补充文本
   - 内容预览
   - 发送按钮
6. 发送逻辑：前端扣除材料 → saveData → triggerSlash

**各百艺特有配置**:

| 百艺 | 消耗分类 | 产出 | 工具 | 操作方式选项 |
|------|---------|------|------|-------------|
| 炼丹 | [药材] | [丹药] | 丹炉 | 火焰(凡火/地火/灵火/异火/三昧真火)、火候(文火/中火/武火/先文后武等) |
| 炼器 | [矿石][灵材] | [成品] | 锻造台 | 锻造方式、材质选择等 |
| 符箓 | [符纸][灵墨] | [符箓] | 符笔 | 绘制方式等 |
| 阵法 | [灵材][阵旗] | 阵法→阵盘 | 阵盘 | 阵法类型等 |
| 驭兽 | [饲料] | 灵兽状态提升 | 灵兽 | 训练/喂养/契约等 |
| 医术 | [药材][丹药] | 治疗效果 | 药箱 | 诊治/配药等 |
| 傀儡术 | [傀儡件][矿石] | 傀儡状态提升 | 傀儡 | 制造/修复/改装等 |
| 种植采药 | [种子](种植)/无(采药) | [药材][种子] | 一寸地 | 种植/采药/培育等 |
| 剑心 | 无 | 无 | 无 | 剑道感悟（特殊，无材料消耗） |

**问题**:
1. **9个百艺组件代码高度重复**: 每个组件的导航栏、境界显示、进度条、工具卡片、操作区结构、发送逻辑几乎相同，差异仅在操作参数和材料分类。应提取 `ArtPageLayout.vue` 通用框架
2. **`_当前百艺` 写入未 saveData**: `openArtsPage()` 中写入 `data.value._当前百艺 = art` 但没有 `await saveData()`，EJS控制器可能读不到新值
3. **`closeArtsPage()` 同理**: 清空 `_当前百艺` 但没有 saveData
4. **剑心没有熟练度/经验值字段**: 配置中 `熟练度字段/经验值字段` 为空字符串，但通用渲染逻辑可能报错

---

### 模块 5: Tab4 物品系统

**文件**: `components/TabItems.vue`, `components/TabFishing.vue`

**功能**:

#### 5.1 灵石 (TabItems.vue)
- 四品灵石(下/中/上/极)分格显示
- 折合下品总量

#### 5.2 已装备 (TabItems.vue)
- 武器/防具/饰品三栏
- 每栏显示当前装备名，有卸下(✕)和更换(⇄)按钮
- 更换弹窗：列出 `未装备_xxx` 中的可选装备

#### 5.3 储物戒 (TabItems.vue)
- 物品总数统计
- 分类筛选标签（动态生成，只显示有物品的分类）
- 搜索框
- 按分类分组显示，每组有分类图标+颜色+物品数量
- 物品标签：名称 + 数量(×N)

#### 5.4 凡俗货币 (TabItems.vue)
- 条件显示

#### 5.5 钓鱼系统 (TabFishing.vue，嵌套在TabItems中)

**钓鱼装备**:
- 4个装备槽：鱼竿/鱼饵/渔网/钓箱
- 点击弹出编辑弹窗(手动输入名称)

**钓鱼统计**:
- 钓鱼次数/成功次数/成功率
- 鱼获记录/最高记录

**钓鱼操作区**:
- 选择钓鱼地点（当前地点/自定义）
- 选择鱼饵（从储物戒[鱼饵]分类解析 + 手动输入）
- 开始钓鱼按钮

**QTE钓鱼界面**:
- 水波SVG动画 + 浮标
- 3轮随机上钩：等待(2-6秒) → 预警(0.8-1.5秒) → 上钩(限时1.5-2.5秒提竿)
- 状态文字提示 + 3个圆点记录成功/失败
- 提竿按钮（上钩时可点击，记录反应时间）
- 取消钓鱼按钮
- 3轮结束后：前端扣鱼饵+更新钓鱼次数 → 组装详细内容（地点/装备/鱼饵/提竿表现） → `triggerSlash('/send ...')` 发给AI判定钓到什么

**问题**:
1. **装备弹窗**: `availableEquips` 从 `未装备_xxx` 按 `、` 分隔，与储物戒格式(按`|`分隔)不同，是两套独立体系
2. **钓鱼鱼饵扣除**: `removeBaitFromStorage` 使用 `includes` 模糊匹配而非精确匹配 `parseItemText`，可能误删（如"灵蚯蚓"会匹配到"金灵蚯蚓"）
3. **钓鱼取消不改状态**: `cancelFishing` 不改 `_钓鱼状态`，状态仍为"钓鱼中"，提醒条持续显示
4. **TabFishing嵌套在TabItems**: 钓鱼是独立玩法，但嵌套在物品Tab中导致物品Tab内容过长；且钓鱼状态提醒条在物品Tab滚动时可能不可见
5. **钓鱼装备与战斗装备体系分离**: 钓鱼装备(鱼竿/鱼饵/渔网/钓箱)没有 `_` 前缀，不属于前端控制的只读变量

---

### 模块 6: Tab5 关系系统

**文件**: `components/TabRelations.vue`

**功能**:
- 解析 `关系列表` (Record<string, string>)，值格式 `性别|修为|所属|关系态度|重要事件`
- 头像显示：有立绘→图片头像(可点击查看大图)，无立绘→首字母圆形
- 态度光环：根据关系态度显示不同颜色边框(友好系=绿，敌对系=红，道侣=粉等)
- 卡片内容：名称+态度标签、性别/修为/所属标签、重要事件列表(按`;`分隔)
- 搜索：按名称搜索
- 分页：每页5条

**问题**:
1. **搜索只搜名称**: 不支持按修为、所属、态度等搜索
2. **态度映射不全**: `getAttitudeClass` 只映射11种态度(陌生/警惕/敌对/中立/好感/信任/敬畏/仇恨/挚友/师徒/道侣)，AI可能输出其他态度描述

---

### 模块 7: Tab6 地图系统

**文件**: `components/TabMap.vue`, `components/mapData.ts`, `types/map.ts`

**功能**:

#### 7.1 三层地图结构
- **一层**: 阴阳大陆全图（9个大区域标记点）
- **二层**: 大区域内部图（子区域标记点），9张区域地图
- **三层**: 子区域内具体地点（文字卡片列表，非地图）

#### 7.2 地图交互
- 面包屑导航：层级间切换
- 一层/二层为图片地图：
  - 拖拽平移(鼠标+触屏)
  - 滚轮/双指缩放（以鼠标/双指中点为中心）
  - 自动适配容器大小 (`fitImageToContainer`)
  - 标记点：可配置大小(tiny/small/normal/large)、颜色、标签位置(above/below/left/right)
  - 控制按钮：放大/缩小/重置
  - 当前位置指示（左下角）
- 三层为卡片列表：
  - 颜色条+名称+类型标签+势力+简介+角色列表
  - 当前位置标记
  - "前往"按钮

#### 7.3 地点详情面板
- 右侧滑出(PC)或底部弹出(移动端)
- 简介/势力(带颜色标签)/角色列表/钓鱼资源
- 操作按钮：进入区域(下钻到下一层)、前往此处(打开移动确认)

#### 7.4 移动系统
- 移动方式：御剑飞行/御空飞行/传送阵/步行/骑乘/乘船
- 路线显示：从→至
- 移动描述（可选自由文本）
- 内容预览
- 确认后发送给AI描写移动过程（不直接改位置变量，由AI的MVU命令更新）

#### 7.5 传送阵系统
- **传送阵地点白名单**: 约50个大型城市/商业枢纽
- **禁止传送区域**: 大魔国(洞天隐匿)/东瀛(结界封锁)/阴曹地府(冥界)
- **宗门禁地**: 约50个宗门/势力地点，外人不能传送进入
- **双向检查**: 出发地和目的地都需有传送阵
- **费用计算**:
  - 同子区域内: 50下品灵石
  - 同大区域跨子区域: 200
  - 相邻大区域: 500
  - 较远大区域: 1000
  - 对角大区域: 2000
  - 大区域间距离矩阵(6×6)
- **灵石扣除**: 前端直接扣除（优先下品→中品→上品→极品，自动找零）
- **跨区域提示**: 跨大区域移动时显示提醒

**问题**:
1. **mapData.ts 数据量**: 未详细阅读，地图标记数据可能很大
2. **传送阵扣费找零**: `deductSpiritStones` 逻辑中，中品灵石换算为100下品但 `Math.ceil(remaining/100)` 可能多扣1枚中品
3. **位置不直接更新**: 移动后位置由AI更新，如果AI忘记更新位置变量，地图显示不会变
4. **地图图片**: 使用 postimg.cc 外部链接（共10张地图），加载可能慢
5. **三层没有地图图片**: 使用父区域地图图片作为三层底图（但三层其实是列表视图不用地图）

---

### 模块 8: 通用组件

#### StoragePicker.vue
- Props: title, categories(分类过滤), multiple(单选/多选), maxItems
- 功能：搜索、按分类筛选、点选物品、已选列表、确认
- 被修炼面板(选丹药)、所有百艺(选材料)使用

#### PortraitViewer.vue
- Props: visible, url, name, attitude
- 功能：全屏遮罩层显示角色立绘大图
- 被 TabBasic(在场角色)、TabRelations(关系列表)使用

#### characterPortraits.ts
- 约140个角色的名字→立绘URL映射
- 图片托管在 catbox.moe
- `getPortraitUrl(name)`, `hasPortrait(name)` 两个导出函数

---

## 三、Schema 对比分析

### 状态栏 schema.ts vs 角色卡 脚本/schema.ts

| 差异项 | 状态栏 (schema.ts) | 角色卡 (脚本/schema.ts) | 说明 |
|--------|-------------------|------------------------|------|
| zod 风格 | `z.xxx().default()` | `z.xxx().prefault()` | 状态栏用zod3风格，角色卡用zod4风格 |
| transform | 无 | `z.transform(v => Math.max(0, v))` 等 | 角色卡有数值保护 |
| `_当前百艺` | `z.enum(['', '炼丹', ...])` | `z.string().prefault('')` | 类型不一致 |
| `_修炼状态` | `z.enum(['', '修炼中', ...])` | `z.string().prefault('')` | 类型不一致 |
| `心魔状态` | `z.enum(['无', '潜伏', ...])` | `z.string().prefault('无')` | 类型不一致 |
| `_寿元状态` | `z.enum([...])` | `z.string().prefault('正常')` | 类型不一致 |
| `_轮回状态` | `z.enum([...])` | `z.string().prefault('正常')` | 类型不一致 |
| `_钓鱼状态` | `z.enum([...])` | `z.string().prefault('空闲')` | 类型不一致 |
| `道途` | `z.enum([...])` | `z.string().prefault('')` | 类型不一致 |
| `时辰` | `z.enum([...])` | `z.enum([...]).prefault()` | 基本一致 |
| `关系列表` | `z.record().default({})` | `z.record().transform().prefault({})` | 角色卡有transform |
| 数值字段 | `z.coerce.number().min(0).default(0)` | `z.coerce.number().transform(v=>Math.max(0,v)).prefault(0)` | 角色卡用transform代替min |
| `registerMvuSchema` | 无 | 有（在文件末尾） | 状态栏不需要注册 |
| 辅助函数 | `get寿元上限()`, `get大境界()`, `境界寿元映射` | 无 | 仅状态栏有 |

**核心问题**: 状态栏的 schema 应以角色卡 schema 为准（因为角色卡schema是注册到MVU的权威定义），但状态栏不需要 `registerMvuSchema`，也不需要 `prefault`（状态栏只是解析已有数据，不需要提供默认值给MVU框架）。

---

## 四、模块化重构计划

### Phase 0: Schema 对齐 [P0]

**目标**: 确保状态栏 schema 与角色卡 schema 类型完全一致

**改动**:
1. 状态栏 `schema.ts` 直接从角色卡 `脚本/schema.ts` 导入或复制 Schema 定义
2. 去掉状态栏 schema 中的 enum 限制，改为与角色卡一致的 `z.string()`
3. 保留状态栏特有的辅助函数(`get寿元上限`等)
4. 确认 `export type Schema = z.output<typeof Schema>` 两端一致

### Phase 1: Store 拆分 [P0]

**目标**: 将636行的 store.ts 拆分为职责清晰的模块

**拆分方案**:
```
store.ts (主Store, ~150行)
├── stores/
│   ├── dataStore.ts      # MVU 数据读写 + 事件处理（灵根锁定/寿元/百艺学习）
│   ├── uiStore.ts        # UI 状态（isOpen/activeTab/artsPage/theme/fabPosition）
│   ├── storageStore.ts   # 储物戒操作（解析/筛选/扣除）→ 可直接复用 storageUtils.ts
│   └── equipStore.ts     # 装备操作（穿戴/卸下）
├── constants/
│   ├── arts.ts           # 百艺配置常量（ARTS/ARTS_MAP/ARTS_PAGE_MAP）
│   └── tabs.ts           # Tab 配置常量
└── composables/
    └── useLifespan.ts    # 寿元计算逻辑
```

### Phase 2: 百艺组件提取公共框架 [P1]

**目标**: 将9个高度重复的百艺组件提取公共框架

**方案**: 创建 `ArtPageLayout.vue` 通用框架组件

```vue
<!-- ArtPageLayout.vue -->
<template>
  <div class="art-page" :style="{ '--art-color': color }">
    <!-- 顶部导航栏 -->
    <div class="page-topbar">
      <button @click="$emit('close')">收起百艺</button>
      <div class="page-title">
        <slot name="icon" />
        <span>{{ name }}</span>
      </div>
    </div>
    <!-- 境界+进度 -->
    <div class="realm-section">
      <div class="realm-badge">{{ realm }}</div>
      <ProgressBar label="熟练度" :value="proficiency" :color="color" />
      <ProgressBar label="经验值" :value="experience" :max="100" :color="color" />
    </div>
    <!-- 工具 -->
    <div class="tools-section" v-if="toolLabel">
      <div class="tool-card">
        <div class="tool-label">{{ toolLabel }}</div>
        <div class="tool-value">{{ toolValue || '未装备' }}</div>
      </div>
    </div>
    <!-- 操作区（由各百艺自定义） -->
    <div class="operation-area">
      <slot />
    </div>
  </div>
</template>
```

各百艺组件只需要提供操作区的 slot 内容和特定配置。

### Phase 3: 钓鱼模块修复 [P1]

**改动**:
1. 修复 `removeBaitFromStorage` 使用精确匹配
2. 修复 `cancelFishing` 恢复 `_钓鱼状态='空闲'`
3. 考虑将钓鱼从 TabItems 中独立（可作为 TabItems 内的折叠区域或独立子Tab）

### Phase 4: saveData 时序修复 [P1]

**改动**:
所有先 `saveData()` 再 `triggerSlash()` 的地方，确保 await saveData 完成后再发送：
- `TabRealm.vue`: `confirmCultivation`, `confirmBreakthrough`
- `ArtAlchemy.vue` 等百艺组件: `handleSend`
- `TabMap.vue`: `confirmTravel`
- `store.ts`: `openArtsPage`, `closeArtsPage` 需要加 `saveData`

### Phase 5: 寿元年份计算修复 [P2]

**改动**:
修改 `parseYearFromYinYangLi` 提取完整的 `转+纪+元+年` 计算绝对年份，而非只取年份数字。

### Phase 6: UI/样式优化 [P3]

**改动**:
1. 统一 FAB_SIZE 常量
2. 修复 panel-inner margin 冲突
3. 关系搜索增强（支持搜态度/所属等）
4. 态度映射扩展

---

## 五、按模块实施的工作项清单

以下是建议的实施顺序，每个工作项可作为一个独立的聊天任务：

| # | 模块 | 工作项 | 优先级 | 难度 |
|---|------|--------|--------|------|
| 1 | Schema | 对齐状态栏schema与角色卡schema | P0 | 低 |
| 2 | Store | 拆分store.ts为多个模块 | P0 | 中 |
| 3 | 百艺 | 提取ArtPageLayout通用框架，重构9个百艺组件 | P1 | 高 |
| 4 | 钓鱼 | 修复鱼饵扣除/取消状态/模块独立 | P1 | 中 |
| 5 | 时序 | 修复所有saveData+triggerSlash时序问题 | P1 | 低 |
| 6 | 寿元 | 修复阴阳历年份解析跨元bug | P2 | 低 |
| 7 | 装备 | 统一装备分隔符逻辑 | P2 | 低 |
| 8 | 地图 | 验证传送阵扣费找零逻辑 | P2 | 低 |
| 9 | 关系 | 搜索增强+态度映射扩展 | P3 | 低 |
| 10 | UI | FAB尺寸统一/margin修复/样式优化 | P3 | 低 |

---

## 六、核心设计原则（来自 DESIGN.md）

- **前端负责"扣除"，AI负责"产出"**: 前端不加经验值，AI不扣材料
- **前端控制操作触发/材料扣除/状态切换**: 通过 `_修炼状态`/`_当前百艺` 等前缀变量
- **AI控制过程描述/成功失败判定/产出物品**: 通过 MVU 命令更新变量
- **EJS控制器按状态加载**: 根据 `_修炼状态`/`_当前百艺`/`_钓鱼状态` 动态加载不同变量规则
- **储物戒分类体系**: 14种分类前缀，`[分类]物品名×数量|物品名×数量` 格式
