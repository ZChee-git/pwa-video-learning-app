@echo off
title PWA临时解决方案 - VPN优化版
color 0A

echo.
echo ==========================================
echo     PWA 临时解决方案 - VPN优化版
echo ==========================================
echo.

echo ⚠️  VPN检测提醒：
echo   如果您开启了VPN，可能会影响IP地址获取
echo   建议临时关闭VPN以获得最佳效果
echo.
echo 按任意键继续...
pause >nul

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
echo 🚀 启动增强版服务器...
echo   - 自动检测并跳过VPN虚拟IP
echo   - 优先使用192.168.x.x网段
echo   - 显示详细网络诊断信息
echo.

python enhanced-mobile-server.py

echo.
echo 🔧 如果仍有问题，请尝试：
echo   1. 完全关闭VPN软件
echo   2. 重启网络适配器
echo   3. 检查防火墙设置
echo   4. 查看 VPN问题解决指南.md
echo.

pause
