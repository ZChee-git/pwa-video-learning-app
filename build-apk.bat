@echo off
title APK构建工具 - 智能视频复习系统
color 0B
echo.
echo 🚀 APK构建工具启动
echo =============================
echo.

echo 📦 第1步: 安装Capacitor依赖...
echo.
call npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/filesystem @capacitor/storage @capacitor/splash-screen @capacitor/status-bar
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)
echo ✅ 依赖安装完成

echo.
echo 🔨 第2步: 构建Web应用...
echo.
call npm run build
if errorlevel 1 (
    echo ❌ Web应用构建失败
    pause
    exit /b 1
)
echo ✅ Web应用构建完成

echo.
echo 🔧 第3步: 初始化Capacitor项目...
echo.
call npx cap init "智能视频复习系统" "com.smartreview.videolearning" --web-dir=dist
if errorlevel 1 (
    echo ❌ Capacitor初始化失败
    pause
    exit /b 1
)
echo ✅ Capacitor初始化完成

echo.
echo 📱 第4步: 添加Android平台...
echo.
call npx cap add android
if errorlevel 1 (
    echo ❌ Android平台添加失败
    pause
    exit /b 1
)
echo ✅ Android平台添加完成

echo.
echo 🔄 第5步: 同步文件到Android项目...
echo.
call npx cap sync
if errorlevel 1 (
    echo ❌ 文件同步失败
    pause
    exit /b 1
)
echo ✅ 文件同步完成

echo.
echo 🎯 第6步: 打开Android Studio...
echo.
echo 💡 提示：Android Studio将会打开，请按照以下步骤操作：
echo    1. 等待项目加载完成
echo    2. 点击 Build → Build Bundle(s)/APK(s) → Build APK(s)
echo    3. 等待构建完成
echo    4. APK文件位置：android\app\build\outputs\apk\debug\
echo.
echo 🚀 正在启动Android Studio...
call npx cap open android

echo.
echo ✅ APK构建流程完成！
echo.
echo 📋 后续步骤：
echo   1. 在Android Studio中构建APK
echo   2. 测试APK功能
echo   3. 如需发布，创建签名版本
echo.
pause
