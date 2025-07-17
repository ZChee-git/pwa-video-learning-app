@echo off
title 简化版APK构建
color 0B
echo.
echo 🚀 简化版APK构建工具
echo ====================
echo.

echo 📦 第1步: 构建Web应用...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败，请检查错误
    pause
    exit /b 1
)

echo.
echo 🔧 第2步: 创建基础Capacitor项目...
echo.

REM 创建基础package.json添加
echo 📝 更新package.json...
echo.
echo 请手动运行以下命令：
echo.
echo npm install @capacitor/core @capacitor/cli @capacitor/android
echo npx cap init "智能视频复习系统" "com.smartreview.videolearning"
echo npx cap add android
echo npx cap sync
echo npx cap open android
echo.

echo 💡 或者使用在线APK构建服务：
echo   • PWA Builder: https://www.pwabuilder.com/
echo   • PhoneGap Build: https://build.phonegap.com/
echo   • Appgyver: https://www.appgyver.com/
echo.

pause
