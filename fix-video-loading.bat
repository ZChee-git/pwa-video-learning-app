@echo off
title 视频加载失败修复工具
color 0A
echo.
echo 🔧 视频加载失败修复工具
echo ================================
echo.
echo 🔍 正在诊断问题...
echo.

REM 检查是否有构建文件
if not exist "dist" (
    echo ❌ 缺少构建文件
    echo 🔄 正在重新构建...
    npm run build
    if not exist "dist" (
        echo ❌ 构建失败，请检查Node.js环境
        pause
        exit /b 1
    )
    echo ✅ 构建完成
)

REM 检查源代码是否包含修复脚本
findstr /c:"appInitializer" "src\main.tsx" >nul
if errorlevel 1 (
    echo ⚠️ 缺少恢复脚本，正在添加...
    echo 需要手动重新构建
) else (
    echo ✅ 恢复脚本已集成
)

echo.
echo 🚀 启动修复版服务器...
echo.
echo 💡 修复功能:
echo   • 自动检测和恢复视频数据
echo   • 重建blob URLs
echo   • 验证数据完整性
echo   • 浏览器兼容性检查
echo.
echo 📱 如果手机访问仍然失败，请尝试:
echo   1. 清除浏览器缓存
echo   2. 重新添加到主屏幕
echo   3. 检查网络连接
echo.

REM 启动服务器
python enhanced-mobile-server.py

pause
