@echo off
title PWA临时解决方案
color 0A

echo.
echo ==========================================
echo         PWA 临时解决方案
echo ==========================================
echo.

echo 🔄 检查构建状态...
if not exist "dist" (
    echo ❌ 构建文件不存在，正在构建...
    call npm run build
    if %errorlevel% neq 0 (
        echo ❌ 构建失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 构建文件已存在
)

echo.
echo 🚀 启动临时服务器...
echo.
echo 📱 使用说明：
echo 1. 在手机上访问显示的网络地址
echo 2. 添加到主屏幕
echo 3. 从主屏幕启动应用
echo.
echo ⚠️  按 Ctrl+C 停止服务器
echo.

python test-server.py

pause
