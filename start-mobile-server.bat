@echo off
chcp 65001
cls

echo.
echo ===================================================
echo     📱 手机局域网访问 - 一键启动
echo ===================================================
echo.

:: 切换到项目目录
cd /d "C:\Users\Administrator\Downloads\project-bolt-sb1-raf4VSCODE_2\project"

:: 检查dist目录是否存在
if not exist "dist" (
    echo 🔄 检测到项目未构建，正在构建...
    call npm run build
    if errorlevel 1 (
        echo ❌ 构建失败，请检查错误信息
        pause
        exit /b 1
    )
    echo ✅ 构建完成
    echo.
)

:: 使用ipconfig快速获取IP
echo 🔍 正在获取局域网IP地址...
echo.

:: 显示网络信息
echo 📡 网络配置信息:
ipconfig | findstr /i "IPv4"
echo.

:: 启动服务器
echo 🚀 正在启动局域网服务器...
echo.
echo ⚠️  重要提醒：
echo   • 确保手机和电脑连接到同一WiFi网络
echo   • 如果无法访问，请检查防火墙设置
echo   • 按 Ctrl+C 可以停止服务器
echo.

:: 尝试使用Node.js启动自定义服务器
node lan-server.js

:: 如果Node.js服务器失败，尝试使用Python
if errorlevel 1 (
    echo.
    echo ⚠️  Node.js服务器启动失败，尝试使用Python...
    echo.
    cd dist
    python -m http.server 8080 --bind 0.0.0.0
)

pause
