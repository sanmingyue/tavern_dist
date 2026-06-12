# 小手机独立版 Android APK 工程

这是 0.0.1 的安卓 WebView 壳。它不会在手机本机运行酒馆或 Node 服务，而是让手机连接电脑上的小手机本地服务。

## 构建要求

- Android Studio
- JDK 17+
- Android SDK 35
- Gradle 或 Android Studio 自带 Gradle

## 构建 APK

如果使用本仓库附带的 Windows 构建脚本：

```powershell
powershell -ExecutionPolicy Bypass -File .\build-apk.ps1
```

也可以用 Android Studio 打开本目录，然后执行：

```bash
gradle assembleDebug
```

生成位置：

```text
app/build/outputs/apk/debug/app-debug.apk
```

## 使用

1. 电脑运行小手机独立版服务。
2. 手机与电脑连接同一个 Wi-Fi。
3. 打开 APK。
4. 输入电脑服务地址，例如 `http://192.168.1.23:39231`。
5. 输入配对码连接。
