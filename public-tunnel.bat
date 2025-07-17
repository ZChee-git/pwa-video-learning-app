@echo off
title 内网穿透工具 - 公网访问
color 0C
echo.
echo 🌐 内网穿透工具
echo =================
echo.

echo 💡 如果PWA Builder无法访问您的本地地址，可以使用内网穿透

echo.
echo 🔧 推荐工具：
echo   1. ngrok (https://ngrok.com/)
echo   2. localtunnel (https://localtunnel.github.io/)
echo   3. serveo (https://serveo.net/)
echo.

echo 📋 ngrok使用方法：
echo   1. 下载ngrok: https://ngrok.com/download
echo   2. 解压到当前目录
echo   3. 运行: ngrok http 8080
echo   4. 复制显示的公网地址
echo.

echo 📋 localtunnel使用方法：
echo   1. 安装: npm install -g localtunnel
echo   2. 运行: lt --port 8080
echo   3. 复制显示的公网地址
echo.

echo 🎯 选择使用哪种方式：
echo   [1] 使用ngrok
echo   [2] 使用localtunnel
echo   [3] 跳过，直接使用局域网地址
echo.

set /p choice=请选择 (1-3): 

if "%choice%"=="1" (
    echo.
    echo 🔧 ngrok方式：
    echo   1. 下载ngrok到项目目录
    echo   2. 运行: ngrok http 8080
    echo   3. 使用显示的https地址
    echo.
    echo 💡 示例地址: https://abc123.ngrok.io
) else if "%choice%"=="2" (
    echo.
    echo 📦 安装localtunnel...
    call npm install -g localtunnel
    echo.
    echo 🚀 启动隧道...
    echo 启动服务器...
    start /min python enhanced-mobile-server.py
    timeout /t 3 /nobreak >nul
    echo.
    echo 🌐 创建公网隧道...
    lt --port 8080
) else (
    echo.
    echo ✅ 使用局域网地址
    echo 请确保PWA Builder可以访问您的网络
)

echo.
pause
