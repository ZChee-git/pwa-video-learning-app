@echo off
title 增强版移动服务器 - VPN检测版
color 0B
echo 🚀 增强版移动服务器启动中...
echo ====================================
echo.

REM 检查dist文件夹
if not exist "dist" (
    echo ❌ 缺少dist文件夹，先构建应用...
    echo 运行: npm run build
    echo.
    npm run build
    if not exist "dist" (
        echo ❌ 构建失败，请检查应用!
        pause
        exit /b 1
    )
) else (
    echo ⚠️  检测到dist文件夹，如果显示旧版本请运行rebuild-and-start.bat
)

echo ✅ 找到dist文件夹
echo.

REM 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 需要Python环境!
    echo 请先安装Python
    pause
    exit /b 1
)

echo ✅ Python环境正常
echo.

REM 运行IP检测
echo 🔍 检测网络环境...
python test-ip.py
echo.

REM 启动增强服务器
echo 🚀 启动增强版移动服务器...
echo.
echo 💡 提示:
echo   - 服务器将自动检测并排除VPN地址
echo   - 优先使用192.168.x.x家庭网络
echo   - 如果显示26.26.26.1请关闭VPN后重启
echo.
echo 🔄 正在启动服务器...
python enhanced-mobile-server.py

echo.
echo 按任意键退出...
pause
