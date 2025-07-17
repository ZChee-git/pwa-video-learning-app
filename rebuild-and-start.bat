@echo off
title 更新构建并启动手机服务器
color 0B
echo 🔄 正在更新构建...
echo ============================
echo.

REM 清理旧的构建文件
if exist "dist" (
    echo 🗑️  清理旧构建文件...
    rmdir /s /q dist
)

REM 重新构建
echo 🔨 重新构建最新版本...
npm run build

REM 检查构建结果
if not exist "dist" (
    echo ❌ 构建失败!
    pause
    exit /b 1
)

echo ✅ 构建成功!
echo.

REM 启动手机服务器
echo 🚀 启动手机服务器...
echo.
echo 💡 现在8080端口将显示最新版本
echo.
python enhanced-mobile-server.py

pause
