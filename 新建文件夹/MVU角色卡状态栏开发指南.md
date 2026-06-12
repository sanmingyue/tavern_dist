# MVU 角色卡状态栏开发指南

基于「青春的果实」状态栏的完整开发经验总结。下次写类似的多角色 MVU 状态栏时，直接参考本文件。

---

## 一、项目结构

```
src/角色卡名/
├── schema.ts                    # zod 4 变量结构定义
├── schema.json                  # pnpm build 自动生成
├── 脚本/变量结构/index.ts        # 注册 MVU schema
├── 状态栏/
│   ├── index.ts                 # 脚本入口（挂载 Vue 到最新 AI 楼层）
│   ├── App.vue                  # 主组件（时间栏 + 角色列表 + 角色详情）
│   ├── store.ts                 # pinia store（读取 MVU 变量 + 角色元信息）
│   ├── immersive.ts             # PC 端沉浸模式（jQuery 操作酒馆 DOM）
│   ├── components/
│   │   ├── TimeBar.vue          # 时间/倒计时栏
│   │   ├── CharacterGrid.vue    # 角色卡片网格
│   │   ├── CharacterDetail.vue  # 角色详情（含内心剧场生成）
│   │   └── CharacterTheater.vue # PC 端内心剧场面板（fixed 定位）
│   └── theater/
│       ├── generator.ts         # AI 生成内心剧场逻辑
│       ├── profiles.ts          # 内置角色阶段人设数据
│       └── types.ts             # 类型定义
└── 世界书/
    ├── initvar.yaml             # 变量初始值
    ├── 变量更新规则.md           # AI 变量更新指导
    ├── 变量列表.md
    ├── 变量输出格式.md
    └── 各角色人设.md             # EJS 多阶段人设
```

---

## 二、核心机制

### 2.1 脚本入口 (index.ts)

```typescript
import { createScriptIdDiv, teleportStyle } from '@util/script';
import App from './App.vue';
import { cleanupImmersive, isImmersiveActive } from './immersive';

$(async () => {
  await waitGlobalInitialized('Mvu');

  let app, $container;
  const { destroy } = teleportStyle();

  function mountToLatestMessage() {
    if (app) { app.unmount(); app = null; }
    if ($container) { $container.remove(); $container = null; }

    const $lastAiMsg = $('#chat .mes:not([is_user="true"])').last();
    const $mesBlock = $lastAiMsg.find('.mes_block');
    if ($mesBlock.length === 0) return;

    $container = $('<div>').css({ width: '100%', display: 'flex', justifyContent: 'flex-end' }).appendTo($mesBlock);
    app = createApp(App).use(createPinia());
    app.mount($container[0]);
  }

  mountToLatestMessage();

  // 事件触发重新挂载（沉浸模式时跳过，已在最新楼层时跳过）
  const debouncedMount = _.debounce(() => {
    if (isImmersiveActive()) return;
    // 检查是否已在最新楼层...
    mountToLatestMessage();
  }, 500);

  eventOn(tavern_events.MESSAGE_RECEIVED, debouncedMount);
  eventOn(tavern_events.GENERATION_ENDED, debouncedMount);
  // ...

  // 定时自查（沉浸模式时跳过）
  setInterval(() => {
    if (isImmersiveActive()) return;
    // 检查楼层是否变化...
  }, 3000);

  $(window).on('pagehide', () => { cleanupImmersive(); destroy(); });
});
```

**关键教训：**
- 沉浸模式活跃时必须阻止所有重新挂载（自查 + 事件），否则 `app.unmount()` 会触发 `onUnmounted` → `cleanupImmersive()` 导致面板消失
- 已在最新楼层时跳过重复挂载，减少不必要的 DOM 操作

### 2.2 PC 端沉浸模式 (immersive.ts)

用 jQuery 在酒馆 body 上创建 DOM，不走 Vue 组件：

```typescript
// 背景覆盖层（z-index: 9990, opacity: 0.1）
$('<div>').attr('id', BACKDROP_ID).appendTo('body');

// 左侧面板（z-index: 9991）
$('<div>').attr('id', PANEL_ID).appendTo('body');

// 退出按钮（z-index: 9992）
$('<button>').appendTo('body');
```

**背景方案（v0.1.0 验证有效）：**
- 创建一个 `position: fixed; inset: 0; z-index: 9990` 的 div
- 设置角色图为 `background-image`，`opacity: 0.1`
- `pointer-events: none` 不阻挡点击
- 面板 z-index 比背景高（9991）

**不要用 `$('#bg1').css(...)` 或 `FORCE_SET_BACKGROUND`：**
- `$('#bg1').css(...)` 在某些情况下会被酒馆覆盖
- `FORCE_SET_BACKGROUND` 不支持外部 CDN URL（只支持酒馆本地 backgrounds 目录）

### 2.3 手机端方案

**绝对不要用 `position: fixed` 的抽屉面板！** 会因为以下原因失败：
- 定时自查触发重新挂载 → `onUnmounted` → 面板被移除
- CSS media query 被 inline style 覆盖
- 酒馆的 DOM 操作干扰

**正确方案：内联展开**

手机端点击角色时，在 Vue 组件内部切换视图（角色列表 → 角色详情），完全在消息楼层内显示：

```vue
<div v-if="!selectedCharacter" class="fruit-content">
  <CharacterGrid @select="onSelectCharacter" />
</div>
<div v-if="selectedCharacter && isMobileView" class="fruit-content">
  <CharacterDetail :name="selectedCharacter" @back="selectedCharacter = null" />
</div>
```

内心剧场也直接在 `CharacterDetail` 内部生成和显示，不切换组件。

### 2.4 变量结构 (schema.ts)

```typescript
const 角色状态 = z.object({
  好感度: z.coerce.number().prefault(0).transform(value => _.clamp(value, -100, 100)),
  关系状态: z.enum(['初识', '熟悉', '暧昧', '恋人', '决裂']).prefault('初识'),
  关键事件: z.record(z.string(), z.boolean()).prefault({}),
});
```

**好感度范围用 -100~100：**
- 进度条映射：`(favor + 100) / 200 * 100` → 0%~100%
- 变量更新规则：每次 ±(1~3)，上限 ±5
- 初始值根据人设合理设置（发小 60、追求者 40、陌生人 0、敌对 -10）

### 2.5 Store (store.ts)

```typescript
export const useStatusStore = defineStore('status-bar', () => {
  const data = ref(Schema.parse({}));

  async function init() {
    await waitGlobalInitialized('Mvu');
    refresh();
    eventOn(Mvu.events.VARIABLE_UPDATE_ENDED, refresh);
  }

  function refresh() {
    const variables = Mvu.getMvuData({ type: 'message', message_id: -1 });
    const stat_data = _.get(variables, 'stat_data', {});
    data.value = Schema.parse(stat_data);
  }

  function getCharacter(name: string) {
    return _.get(data.value, name) ?? { 好感度: 0, 关系状态: '初识', 关键事件: {} };
  }

  return { data, init, refresh, getCharacter };
});
```

### 2.6 角色元信息 (CHARACTER_LIST)

```typescript
export const CHARACTER_LIST: CharacterMeta[] = [
  { name: '角色名', identity: '身份', type: 'student', intro: '一句话介绍', color: '#1e3a5f', image: `${CDN_BASE}/xxx.jpg` },
  // ...
];
```

- `image` 用 CDN 链接（jsDelivr），不要用 base64 内联
- `color` 用于卡片背景渐变
- `intro` 显示在角色详情页

---

## 三、踩坑记录

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| 手机端面板"弹一下就消失" | 定时自查/事件触发 `mountToLatestMessage()` → `app.unmount()` → `onUnmounted` → `cleanupImmersive()` | 沉浸模式活跃时阻止所有重新挂载 |
| 手机端 fixed 面板不显示 | CSS media query 被 inline style 覆盖；`window.parent.innerWidth` 判断不准 | 放弃 fixed，改为内联展开 |
| PC 端背景不生效 | `FORCE_SET_BACKGROUND` 不支持外部 CDN URL | 用 z-index:9990 的覆盖层 div |
| 好感度进度条映射错误 | schema 范围 -100~1000 但进度条按 -100~100 映射 | 统一为 -100~100 |
| `CharacterGrid` 进度条不动 | `(favor + 100) / 1100` 应该是 `/200` | 修正映射公式 |

---

## 四、发布流程

```bash
# 构建 + 复制到发布仓库 + 推送
cd C:\Users\三明月\Desktop\三明月 && pnpm build
xcopy /Y "dist\角色卡名\状态栏\index.js" "C:\Users\三明月\Desktop\tavern_dist_repo\dist\角色卡名\状态栏\"
cd /d C:\Users\三明月\Desktop\tavern_dist_repo
git add . && git commit -m "角色卡名 vX.Y.Z" && git tag 前缀-vX.Y.Z && git push && git push origin 前缀-vX.Y.Z
```

CDN 链接格式：
```
https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@前缀-vX.Y.Z/dist/角色卡名/状态栏/index.js
```

---

## 五、文件模板快速开始

1. 复制 `初始模板/角色卡/` 到 `src/新角色卡名/`
2. 编写 `schema.ts`（定义角色和变量结构）
3. 编写 `store.ts`（CHARACTER_LIST + useStatusStore）
4. 编写 `App.vue`（TimeBar + CharacterGrid + CharacterDetail）
5. 编写 `immersive.ts`（PC 端沉浸模式，照抄青春的果实）
6. 编写 `theater/profiles.ts`（角色阶段人设数据）
7. 编写世界书（initvar.yaml + 变量更新规则 + 各角色人设）
8. `pnpm build` 验证无错误
9. 按发布流程推送 CDN
