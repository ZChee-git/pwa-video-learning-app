@echo off
title PWA Builder 准备工具
color 0A
echo.
echo 🔧 PWA Builder 准备工具
echo =========================
echo.

echo 📦 第1步: 构建最新版本...
call npm run build
if errorlevel 1 (
    echo ❌ 构建失败，请检查错误
    pause
    exit /b 1
)

echo ✅ 构建完成！
echo.

echo 🌐 第2步: 启动本地服务器...
echo.
echo 💡 将会启动服务器，请保持运行状态
echo    稍后需要使用显示的网络地址
echo.

start /min python enhanced-mobile-server.py

echo.
echo 🎯 下一步操作：
echo   1. 等待服务器启动完成
echo   2. 记住显示的网络地址 (如: http://192.168.1.100:8080)
echo   3. 访问 https://www.pwabuilder.com/
echo   4. 输入您的网络地址
echo.

pause
