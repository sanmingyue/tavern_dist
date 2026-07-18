# tavern_dist

这是 `sanmingyue` 的酒馆脚本与角色卡资源 CDN 发布仓库。

## 仓库边界

- `main` 只保存 `dist/**` 发布物与发布说明。
- 源码、世界书、角色卡创作文件、图片素材和本地工具不进入本仓库。
- 历史 tag 和已经发布的 `dist` 路径保持不变，供旧角色卡继续使用。
- 本仓库不再自动运行 `pnpm build`，也不会自动删除或重建整个 `dist`。

## 发布方式

发布只能从本地创作工作区执行单项目构建，再把明确的增量复制到本仓库。详细步骤见 [PUBLISHING.md](./PUBLISHING.md)。

禁止：

- `git add .`
- 上传整个本地创作目录
- 删除旧的 `dist` 文件
- 删除、移动或强制覆盖旧 tag

## CDN 链接

```text
https://testingcf.jsdelivr.net/gh/sanmingyue/tavern_dist@<tag>/dist/<项目路径>/index.js
```
