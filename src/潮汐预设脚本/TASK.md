# 潮汐预设条目控制器 v2 — 完整重写任务说明

## 项目概述

重写 `src/潮汐预设脚本/` 下的 `index.ts` 和 `App.vue`，将当前的简单条目开关面板升级为完整的预设编辑器。

## 项目类型

**脚本项目**（只有 `index.ts`，没有 `index.html`），通过 `createScriptIdDiv` + `teleportStyle` 挂载到酒馆网页 body 上。

## 核心文件

- `src/潮汐预设脚本/index.ts` — 入口文件
- `src/潮汐预设脚本/App.vue` — 主组件（需要重写）

## 参考文件

- `src/切换脚本/App.vue` — 悬浮按钮+面板的UI参考
- `src/修仙世界状态栏/` — PC+手机适配参考
- `@types/function/preset.d.ts` — 酒馆预设API完整类型定义

## 双页面架构

### 页面1：预设原始视图（Preset View）

按预设 `prompts` 数组的**实际顺序**显示所有条目，这是预设的真实结构。

**功能：**
- 显示所有条目（包括普通提示词和系统提示词，排除占位符提示词）
- 每个条目：名称（去emoji前缀）、开关Toggle、展开箭头
- 展开后：编辑content（textarea）、保存按钮
- 如果条目没有content（如占位符），显示灰色提示文字
- **新建条目**按钮：在列表末尾或指定位置创建新的普通提示词
- **删除条目**按钮：删除选中的条目（需要确认弹窗）
- **移动条目**：每个条目旁边有上下箭头按钮，点击将条目在prompts数组中上移/下移一位
- **重命名**：双击条目名称可编辑
- **搜索框**：在顶部，输入关键字过滤条目

**实现：**
```typescript
// 读取所有条目
const preset = getPreset('in_use');
const prompts = preset.prompts.filter(p => isPresetNormalPrompt(p) || isPresetSystemPrompt(p));

// 切换开关
await updatePresetWith('in_use', preset => {
  const p = preset.prompts.find(p => p.name === name);
  if (p) p.enabled = !p.enabled;
  return preset;
});

// 新建条目
await updatePresetWith('in_use', preset => {
  preset.prompts.push({
    id: `custom_${Date.now()}`,
    name: '新条目',
    enabled: true,
    position: { type: 'relative' },
    role: 'system',
    content: '',
  });
  return preset;
});

// 删除条目
await updatePresetWith('in_use', preset => {
  const idx = preset.prompts.findIndex(p => p.name === name);
  if (idx >= 0) preset.prompts.splice(idx, 1);
  return preset;
});

// 移动条目（上移）
await updatePresetWith('in_use', preset => {
  const idx = preset.prompts.findIndex(p => p.name === name);
  if (idx > 0) {
    [preset.prompts[idx - 1], preset.prompts[idx]] = [preset.prompts[idx], preset.prompts[idx - 1]];
  }
  return preset;
});

// 编辑内容
await updatePresetWith('in_use', preset => {
  const p = preset.prompts.find(p => p.name === name);
  if (p && 'content' in p) p.content = newContent;
  return preset;
});
```

### 页面2：用户自定义视图（Custom View）

用户可以创建自己的分组（文件夹），将条目归类到不同分组中，**不改变预设结构**。

**功能：**
- 新建分组（用户命名）
- 删除分组
- 将条目添加到分组中（同一条目可在多个分组中）
- 从分组中移除条目
- 分组内的条目显示开关Toggle（直接控制预设中对应条目的enabled状态）
- 搜索框

**分组数据存储：**
存在预设的 `extensions` 字段中，键名 `chaoxi_groups`：
```typescript
// 读取
const groups = getPreset('in_use').extensions?.chaoxi_groups || [];

// 保存
await updatePresetWith('in_use', preset => {
  preset.extensions.chaoxi_groups = groups;
  return preset;
});
```

分组数据结构：
```typescript
interface CustomGroup {
  id: string;        // 唯一ID
  name: string;      // 分组名称
  promptNames: string[];  // 该分组包含的条目名称列表
}
```

## UI设计

### 配色主题（深海夜光）
- 面板背景：`#050810`
- 主色：`#4dc9f6`（淡蓝）
- 激活色/选中Tab：`rgba(77, 201, 246, 0.15)`
- 开启状态：`#34d399`（绿色）
- 危险操作（删除）：`#f87171`（红色）
- 文字：`rgba(255,255,255,0.88)`
- 次要文字：`rgba(255,255,255,0.4)`
- 边框：`rgba(77, 201, 246, 0.15)`

### 布局结构
```
┌─────────────────────────────────────┐
│ 顶栏：标题 | 预设名称 | 关闭按钮    │
├─────────────────────────────────────┤
│ 页面切换：[预设视图] [自定义视图]    │
├─────────────────────────────────────┤
│ 搜索框                              │
├─────────────────────────────────────┤
│                                     │
│ 条目列表（可滚动）                   │
│  ┌─────────────────────────────┐    │
│  │ ▸ 条目名称          [开关]  │    │
│  ├─────────────────────────────┤    │
│  │ ▾ 条目名称（展开）   [开关]  │    │
│  │   [↑] [↓] [删除]            │    │
│  │   ┌──────────────────────┐  │    │
│  │   │ textarea 编辑区域     │  │    │
│  │   └──────────────────────┘  │    │
│  │   [保存]                    │    │
│  └─────────────────────────────┘    │
│                                     │
│ [+ 新建条目]                        │
└─────────────────────────────────────┘
```

自定义视图（页面2）：
```
┌─────────────────────────────────────┐
│ 顶栏                                │
├─────────────────────────────────────┤
│ [预设视图] [自定义视图]              │
├─────────────────────────────────────┤
│ 搜索框                              │
├─────────────────────────────────────┤
│ Tab导航（用户分组）：               │
│ [分组A] [分组B] [分组C] [+新建]     │
├─────────────────────────────────────┤
│                                     │
│ 当前分组下的条目列表                 │
│  ┌─────────────────────────────┐    │
│  │ 条目名称          [开关] [×] │    │
│  └─────────────────────────────┘    │
│                                     │
│ [+ 添加条目到分组]                   │
│ （弹出预设中所有条目供选择）         │
└─────────────────────────────────────┘
```

### 尺寸
- PC：400×560px，可拖拽定位
- 手机（≤768px）：全屏

### 悬浮按钮
- 44×44px圆形，可拖拽，位置持久化到localStorage
- 点击展开面板，再次点击收起

## 样式注意事项

- 所有CSS类名使用 `chaoxi-` 前缀，避免与酒馆冲突
- **不使用tailwindcss**（因为挂载在酒馆页面上）
- 使用 `<style scoped>` 但注意scoped在teleport到parent DOM时可能不生效，所以用前缀更稳
- Tab导航使用 `flex-wrap: wrap` 两行布局（12个Tab一行放不下）

## 打包和发布

修改完成后：
1. `cd C:\Users\三明月\Desktop\三明月 && pnpm build`
2. `xcopy /Y "dist\潮汐预设脚本\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\潮汐预设脚本\"`
3. `cd C:\Users\三明月\Desktop\tavern_dist && git add . && git commit -m "v2: 双页面预设编辑器" && git tag v1.1.7 && git push && git push origin v1.1.7`

## 酒馆中使用
```javascript
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@v1.1.7/dist/潮汐预设脚本/index.js'
