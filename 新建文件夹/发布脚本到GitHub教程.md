# 发布酒馆助手脚本到 GitHub + jsdelivr 教程

## 原理说明

通过将打包后的脚本上传到 GitHub 公开仓库，利用 [jsdelivr](https://www.jsdelivr.com/) 为 GitHub 文件提供的免费 CDN 功能，生成一个永久链接。玩家在酒馆助手中只需导入一行 `import` 代码即可加载脚本。

使用 **Git tag 版本号** 来管理版本。**不同项目使用不同的版本号前缀**，互不干扰。

---

## 版本号体系

| 项目 | 版本号前缀 | 示例 | 说明 |
|------|-----------|------|------|
| 修仙世界脚本 | `xw-v` | `xw-v1.1.3` | 状态栏 + CE脚本 |
| 潮汐预设脚本 | `cp-v` | `cp-v1.3.4` | 预设悬浮窗 + 预设仓库 |
| 翻译脚本 | `tl-v` | `tl-v1.0.0` | 异步翻译脚本 |
| 预设JSON文件 | `preset-v` | `preset-v1.0.0` | CDN分发的预设文件 |
| 机娘PC同层 | `mg-pc-v` | `mg-pc-v1.0.0` | 我的机娘是世界级的 PC同层前端 |
| 机娘手机同层 | `mg-mb-v` | `mg-mb-v1.0.0` | 我的机娘是世界级的 手机同层前端 |

> 每个项目的版本号独立递增，互不影响。

---

## 目录结构

```
C:\Users\三明月\Desktop\三明月\           ← 开发项目（源码，不上传）
├── src\修仙世界状态栏\                   ← 修仙世界状态栏源码
├── src\修仙世界重置版\脚本\CE脚本\       ← 修仙世界CE脚本源码
├── src\潮汐预设脚本\                     ← 潮汐预设脚本源码
├── src\翻译脚本\                         ← 异步翻译脚本源码
├── 我的预设\                             ← 预设JSON文件（源）
├── dist\修仙世界状态栏\                  ← 打包产物
├── dist\修仙世界重置版\脚本\CE脚本\      ← 打包产物
├── dist\潮汐预设脚本\                    ← 打包产物
└── dist\翻译脚本\                        ← 打包产物

C:\Users\三明月\Desktop\tavern_dist\     ← 发布仓库（只放打包产物）
├── dist\
│   ├── 修仙世界状态栏\index.js
│   ├── 修仙世界重置版\脚本\CE脚本\index.js
│   ├── 潮汐预设脚本\index.js
│   ├── 翻译脚本\index.js
│   ├── 我的机娘是世界级的\脚本\PC同层\index.js
│   ├── 我的机娘是世界级的\脚本\手机同层\index.js
│   └── presets\                         ← CDN分发的预设JSON
│       ├── 潮汐Plum blossom.json
│       ├── 潮汐Chaoxi .json
│       ├── ...
└── README.md
```

---

## 项目一：修仙世界脚本（版本号前缀 `xw-v`）

### CDN 链接

```javascript
// 状态栏
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@xw-v1.1.3/dist/修仙世界状态栏/index.js'

// CE脚本（变量修改器）
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@xw-v1.1.3/dist/修仙世界重置版/脚本/CE脚本/index.js'
```

### 更新流程

```bash
# 1. 打包
cd C:\Users\三明月\Desktop\三明月 && pnpm build

# 2. 复制产物
xcopy /Y "dist\修仙世界状态栏\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\修仙世界状态栏\"
xcopy /Y "dist\修仙世界重置版\脚本\CE脚本\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\修仙世界重置版\脚本\CE脚本\"

# 3. 推送（版本号替换为新版本）
cd C:\Users\三明月\Desktop\tavern_dist
git add .
git commit -m "修仙世界脚本更新"
git tag xw-v1.1.X
git push && git push origin xw-v1.1.X
```

### 一键命令

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && xcopy /Y "dist\修仙世界状态栏\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\修仙世界状态栏\" && xcopy /Y "dist\修仙世界重置版\脚本\CE脚本\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\修仙世界重置版\脚本\CE脚本\" && cd C:\Users\三明月\Desktop\tavern_dist && git add . && git commit -m "修仙世界脚本更新" && git tag xw-v1.1.X && git push && git push origin xw-v1.1.X
```

### 版本历史

| 版本号 | 日期 | 更新内容 |
|--------|------|----------|
| xw-v1.1.3 | 2026-04-19 | 修炼/突破按钮点击时立刻写入状态变量，修复EJS控制器时序问题 |
| xw-v1.1.2 | 2026-04-19 | 修复BUG |
| xw-v1.1.1 | 2026-04-18 | 地图前往两步操作 |
| xw-v1.1.0 | 2026-04-18 | 储物戒按分类拆分为16个独立顶层变量 |
| xw-v1.0.8 | 2026-04-18 | 开场白HTML托管到CDN |
| xw-v1.0.0 | 2026-04-18 | 初始发布 |

> 注：xw-v1.0.0 ~ xw-v1.1.3 对应旧版本号 v1.0.0 ~ v1.1.3（尚未迁移标签前缀）

---

## 项目二：潮汐预设脚本（版本号前缀 `cp-v`）

### CDN 链接

```javascript
// 预设悬浮窗脚本（内置在预设yaml中的import）
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@cp-v1.3.7/dist/潮汐预设脚本/index.js'
```

### 更新流程

```bash
# 1. 打包
cd C:\Users\三明月\Desktop\三明月 && pnpm build

# 2. 复制产物
xcopy /Y "dist\潮汐预设脚本\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\潮汐预设脚本\"

# 3. 推送
cd C:\Users\三明月\Desktop\tavern_dist
git add .
git commit -m "潮汐预设脚本更新"
git tag cp-v1.3.X
git push && git push origin cp-v1.3.X
```

### 一键命令

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && xcopy /Y "dist\潮汐预设脚本\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\潮汐预设脚本\" && cd C:\Users\三明月\Desktop\tavern_dist && git add . && git commit -m "潮汐预设脚本更新" && git tag cp-v1.3.X && git push && git push origin cp-v1.3.X
```

### 版本历史

| 版本号 | 日期 | 更新内容 |
|--------|------|----------|
| cp-v1.3.7 | 2026-04-24 | 新增浮生Soul预设 + 浮生关键词彩蛋 |
| cp-v1.3.6 | - | （已发布版本） |
| cp-v1.3.5 | - | （已发布版本） |
| cp-v1.3.4 | 2026-04-22 | 新增预设仓库（7个预设CDN分发） |
| cp-v1.3.2 | 2026-04-22 | 三明月预设背景改为cover填满 |
| cp-v1.3.1 | 2026-04-22 | 详情头部按钮加深色底 |
| cp-v1.3.0 | 2026-04-22 | 新增nemo预设彩蛋 |
| cp-v1.2.0 | 2026-04-22 | 初始发布（含预设悬浮窗） |

> 注：cp-v1.2.0 ~ cp-v1.3.4 对应旧版本号 v1.2.0 ~ v1.3.4（尚未迁移标签前缀）

---

## 项目四：翻译脚本（版本号前缀 `tl-v`）

### CDN 链接

```javascript
// 异步翻译脚本
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@tl-v1.0.0/dist/翻译脚本/index.js'
```

### 更新流程

```bash
# 1. 打包
cd C:\Users\三明月\Desktop\三明月 && pnpm build

# 2. 复制产物
xcopy /Y "dist\翻译脚本\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\翻译脚本\"

# 3. 推送（版本号替换为新版本）
cd C:\Users\三明月\Desktop\tavern_dist
git add .
git commit -m "翻译脚本更新"
git tag tl-v1.0.X
git push && git push origin tl-v1.0.X
```

### 一键命令

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && xcopy /Y "dist\翻译脚本\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\翻译脚本\" && cd C:\Users\三明月\Desktop\tavern_dist && git add . && git commit -m "翻译脚本更新" && git tag tl-v1.0.X && git push && git push origin tl-v1.0.X
```

### 版本历史

| 版本号 | 日期 | 更新内容 |
|--------|------|----------|
| tl-v1.0.0 | 2026-04-22 | 初始发布：多API提供商支持、独立预设系统、虚假替换、译文缓存 |

---

## 项目五：预设JSON文件（版本号前缀 `preset-v`）

### 说明

预设JSON文件放在 `tavern_dist/dist/presets/` 目录下，通过预设仓库页面供用户下载导入。

CDN路径使用 `@latest` 自动获取最新版本（预设文件不需要精确版本控制）。

### 更新流程

```powershell
# 1. 复制所有预设文件（使用PowerShell，避免中文编码问题）
Copy-Item 'C:\Users\三明月\Desktop\三明月\我的预设\*' 'C:\Users\三明月\Desktop\tavern_dist\dist\presets\' -Force

# 2. 推送
cd C:\Users\三明月\Desktop\tavern_dist
git add .
git commit -m "更新预设文件"
git tag preset-v1.0.X
git push && git push origin preset-v1.0.X
```

### 新增预设的完整流程

当你新增了一个预设（不是更新现有预设），需要执行以下步骤：

**第一步：把新预设JSON放到源文件夹**

把新的 `.json` 文件放到 `C:\Users\三明月\Desktop\三明月\我的预设\` 文件夹。

**第二步：编辑预设目录数据**

编辑 `src/潮汐预设脚本/presetCatalog.ts`，在 `PRESET_CATALOG` 数组中添加新预设的元数据：

```typescript
{
  name: '新预设显示名',        // 用户看到的名称
  filename: '新预设文件名.json', // 必须和我的预设文件夹里的文件名一致
  description: '简介描述',      // 一两句话说明用途和特点
  tags: ['标签1', '标签2'],     // 分类标签
  author: '三明月',             // 作者
},
```

**第三步：打包脚本**

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build
```

**第四步：复制产物到发布仓库**

```powershell
# 复制所有预设JSON（PowerShell，避免中文编码问题）
Copy-Item 'C:\Users\三明月\Desktop\三明月\我的预设\*' 'C:\Users\三明月\Desktop\tavern_dist\dist\presets\' -Force

# 复制打包后的脚本
xcopy /Y "C:\Users\三明月\Desktop\三明月\dist\潮汐预设脚本\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\潮汐预设脚本\"
```

**第五步：推送**

需要同时打两个标签（脚本+预设都更新了）：

```bash
cd C:\Users\三明月\Desktop\tavern_dist
git add .
git commit -m "新增预设：新预设名"
git tag cp-v1.X.X    # 潮汐预设脚本版本号+1
git tag preset-v1.X.X # 预设文件版本号+1
git push && git push origin cp-v1.X.X && git push origin preset-v1.X.X
```

### 仅更新现有预设的流程（不新增）

如果只是更新了已有预设的内容（不新增预设），不需要改代码，只需要：

```powershell
# 1. 复制更新后的预设文件
Copy-Item 'C:\Users\三明月\Desktop\三明月\我的预设\*' 'C:\Users\三明月\Desktop\tavern_dist\dist\presets\' -Force

# 2. 推送
cd C:\Users\三明月\Desktop\tavern_dist
git add .
git commit -m "更新预设文件"
git tag preset-v1.0.X
git push && git push origin preset-v1.0.X
```

### 版本历史

| 版本号 | 日期 | 更新内容 |
|--------|------|----------|
| preset-v1.0.1 | 2026-04-24 | 新增浮生Soul.json预设 |
| preset-v1.0.0 | 2026-04-22 | 7个预设初始上传 |

---

## 项目六：机娘PC同层（版本号前缀 `mg-pc-v`）

### CDN 链接

```javascript
// PC同层前端（流式楼层界面）
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@mg-pc-v1.0.0/dist/我的机娘是世界级的/脚本/PC同层/index.js'
```

### 更新流程

```bash
# 1. 打包
cd C:\Users\三明月\Desktop\三明月 && pnpm build

# 2. 复制产物
xcopy /Y "dist\我的机娘是世界级的\脚本\PC同层\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\我的机娘是世界级的\脚本\PC同层\"

# 3. 推送
cd C:\Users\三明月\Desktop\tavern_dist
git add .
git commit -m "机娘PC同层更新"
git tag mg-pc-v1.0.X
git push && git push origin mg-pc-v1.0.X
```

### 一键命令

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && xcopy /Y "dist\我的机娘是世界级的\脚本\PC同层\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\我的机娘是世界级的\脚本\PC同层\" && cd C:\Users\三明月\Desktop\tavern_dist && git add . && git commit -m "机娘PC同层更新" && git tag mg-pc-v1.0.X && git push && git push origin mg-pc-v1.0.X
```

### 版本历史

| 版本号 | 日期 | 更新内容 |
|--------|------|----------|
| mg-pc-v1.0.0 | 2026-04-23 | 初始发布：流式楼层界面，双视图切换（剧情↔操作），侧栏5面板（总览/机库/商店/改装/比赛），全SVG图标 |

---

## 项目七：机娘手机同层（版本号前缀 `mg-mb-v`）

### CDN 链接

```javascript
// 手机同层前端（流式楼层界面）
import 'https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@mg-mb-v1.0.0/dist/我的机娘是世界级的/脚本/手机同层/index.js'
```

### 更新流程

```bash
# 1. 打包
cd C:\Users\三明月\Desktop\三明月 && pnpm build

# 2. 复制产物
xcopy /Y "dist\我的机娘是世界级的\脚本\手机同层\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\我的机娘是世界级的\脚本\手机同层\"

# 3. 推送
cd C:\Users\三明月\Desktop\tavern_dist
git add .
git commit -m "机娘手机同层更新"
git tag mg-mb-v1.0.X
git push && git push origin mg-mb-v1.0.X
```

### 一键命令

```bash
cd C:\Users\三明月\Desktop\三明月 && pnpm build && xcopy /Y "dist\我的机娘是世界级的\脚本\手机同层\index.js" "C:\Users\三明月\Desktop\tavern_dist\dist\我的机娘是世界级的\脚本\手机同层\" && cd C:\Users\三明月\Desktop\tavern_dist && git add . && git commit -m "机娘手机同层更新" && git tag mg-mb-v1.0.X && git push && git push origin mg-mb-v1.0.X
```

### 版本历史

| 版本号 | 日期 | 更新内容 |
|--------|------|----------|
| mg-mb-v1.0.0 | 2026-04-23 | 初始发布：流式楼层界面，双视图切换，底部5Tab导航，全SVG图标 |

---

## 查看当前版本号

```bash
# 查看所有标签（按时间倒序）
cd C:\Users\三明月\Desktop\tavern_dist && git tag --sort=-creatordate

# 只看修仙世界的标签
git tag -l "xw-v*" --sort=-creatordate

# 只看潮汐预设的标签
git tag -l "cp-v*" --sort=-creatordate

# 只看翻译脚本的标签
git tag -l "tl-v*" --sort=-creatordate

# 只看预设文件的标签
git tag -l "preset-v*" --sort=-creatordate

# 只看机娘PC同层的标签
git tag -l "mg-pc-v*" --sort=-creatordate

# 只看机娘手机同层的标签
git tag -l "mg-mb-v*" --sort=-creatordate
```

---

## 重要链接

| 项目 | 链接 |
|------|------|
| GitHub 仓库 | https://github.com/sanmingyue/tavern_dist |
| 修仙世界状态栏 CDN | `@xw-v1.1.3/dist/修仙世界状态栏/index.js` |
| 修仙世界CE脚本 CDN | `@xw-v1.1.3/dist/修仙世界重置版/脚本/CE脚本/index.js` |
| 潮汐预设脚本 CDN | `@cp-v1.3.7/dist/潮汐预设脚本/index.js` |
| 翻译脚本 CDN | `@tl-v1.0.0/dist/翻译脚本/index.js` |
| 机娘PC同层 CDN | `@mg-pc-v1.0.0/dist/我的机娘是世界级的/脚本/PC同层/index.js` |
| 机娘手机同层 CDN | `@mg-mb-v1.0.0/dist/我的机娘是世界级的/脚本/手机同层/index.js` |
| 预设JSON CDN 目录 | `@latest/dist/presets/` |
| jsdelivr 官网 | https://www.jsdelivr.com/ |
