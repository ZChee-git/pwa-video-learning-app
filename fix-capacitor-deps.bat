@echo off
title 修复Capacitor依赖错误
color 0C
echo.
echo 🔧 修复Capacitor依赖错误
echo =======================
echo.

echo 📦 正在清理node_modules...
if exist "node_modules" rmdir /s /q node_modules
if exist "package-lock.json" del package-lock.json

echo.
echo 📥 重新安装基础依赖...
call npm install

echo.
echo 🔌 安装Capacitor核心依赖...
call npm install @capacitor/core@latest
call npm install @capacitor/cli@latest
call npm install @capacitor/android@latest
call npm install @capacitor/filesystem@latest
call npm install @capacitor/storage@latest
call npm install @capacitor/splash-screen@latest
call npm install @capacitor/status-bar@latest

echo.
echo ✅ 依赖修复完成！
echo.
echo 💡 现在可以尝试重新构建APK
pause
