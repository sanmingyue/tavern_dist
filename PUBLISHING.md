# CDN 发布边界

本仓库只接收由 `C:\Users\三明月\Desktop\三明月` 生成的单项目构建产物。

```powershell
cd C:\Users\三明月\Desktop\三明月
pnpm build <项目名>
pnpm cdn:prepare <项目名>
pnpm cdn:status

cd C:\Users\三明月\Desktop\三明月-cdn
git add -- "dist/<明确项目路径>"
git diff --cached --stat
git commit -m "项目：更新说明"
git push origin main
```

创建 tag 前必须确认它不存在：

```powershell
git ls-remote --tags origin <新tag>
git tag -a <新tag> -m "版本说明"
git push origin <新tag>
```

默认发布脚本拒绝图片、音视频与压缩包，并且不会自动复制 source map。大型素材必须使用单独的、人工核验过的增量发布流程。
