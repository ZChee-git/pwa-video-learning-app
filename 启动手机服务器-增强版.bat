@echo off
chcp 65001
cls

echo.
echo ===================================================
echo     📱 手机局域网访问 - 终极诊断启动器
echo ===================================================
echo.

:: 切换到项目目录
cd /d "C:\Users\Administrator\Downloads\project-bolt-sb1-raf4VSCODE_2\project"

:: 检查dist目录
if not exist "dist" (
    echo 🔄 检测到项目未构建，正在构建...
    echo.
    call npm run build
    if errorlevel 1 (
        echo ❌ 构建失败，请检查错误信息
        pause
        exit /b 1
    )
    echo ✅ 构建完成
    echo.
)

:: 显示网络信息
echo 🔍 正在检测网络配置...
echo.
echo 📡 当前网络接口信息:
ipconfig | findstr /C:"IPv4" /C:"以太网" /C:"无线"
echo.

:: 检测防火墙状态
echo 🛡️ 检查防火墙状态...
netsh advfirewall show allprofiles | findstr "State"
echo.

:: 启动增强版Python服务器
echo 🚀 正在启动增强版局域网服务器...
echo.
python enhanced-mobile-server.py

pause
