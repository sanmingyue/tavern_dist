# 小手机独立版 0.0.1 发布包

## Windows 一键安装包

文件：

```text
小手机独立版-0.0.1-windows.zip
```

使用：

1. 解压 zip。
2. 双击 `install.cmd`。
3. 安装器会复制文件到 `%LOCALAPPDATA%\XiaoshoujiStandalone`。
4. 安装器会自动安装运行依赖 `socket.io`。
5. 桌面会生成“小手机独立版”快捷方式。

要求：

- Windows
- Node.js LTS
- 首次安装时需要联网安装 `socket.io`

## Android APK

文件：

```text
小手机独立版-0.0.1-debug.apk
```

这是 debug 签名 APK，可直接侧载安装测试。手机可能会提示“未知来源应用”，允许后即可安装。

## Android 工程包

文件：

```text
小手机独立版-0.0.1-android-project.zip
```

构建 APK：

1. 安装 Android Studio。
2. 解压工程包。
3. 用 Android Studio 打开解压后的目录。
4. 等 Gradle Sync 完成。
5. 菜单选择 `Build > Build APK(s)`，或运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\build-apk.ps1
```

6. APK 输出在：

```text
app/build/outputs/apk/debug/app-debug.apk
```

安卓 APK 用法：

1. 电脑启动小手机 Windows 服务。
2. 手机与电脑连接同一个 Wi-Fi。
3. 打开 APK。
4. 输入电脑局域网地址，例如 `http://192.168.1.23:39231`。
5. 输入服务配对码。
