@echo off
chcp 65001
title 局域网视频学习服务器

echo.
echo ========================================
echo    🌐 局域网视频学习服务器启动器
echo ========================================
echo.

:: 检查是否已构建
if not exist "dist" (
    echo ⚠️  检测到未构建的项目，正在构建...
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

:: 获取本机局域网IP
echo 🔍 正在检测局域网IP地址...
echo.

:: 使用PowerShell获取局域网IP
for /f "tokens=2 delims=:" %%a in ('powershell -command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like '192.168.*' -or $_.IPAddress -like '10.*' -or $_.IPAddress -like '172.*'} | Select-Object -First 1 -ExpandProperty IPAddress"') do (
    set "LOCAL_IP=%%a"
)

:: 去除空格
set LOCAL_IP=%LOCAL_IP: =%

if "%LOCAL_IP%"=="" (
    echo ❌ 未找到局域网IP，尝试使用其他方法...
    
    :: 备用方法：使用ipconfig
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr "IPv4"') do (
        set "temp_ip=%%a"
        set "temp_ip=!temp_ip: =!"
        if "!temp_ip:~0,3!"=="192" set "LOCAL_IP=!temp_ip!"
        if "!temp_ip:~0,2!"=="10" set "LOCAL_IP=!temp_ip!"
        if "!temp_ip:~0,3!"=="172" set "LOCAL_IP=!temp_ip!"
    )
)

if "%LOCAL_IP%"=="" (
    echo ❌ 无法获取局域网IP，将使用 localhost
    set "LOCAL_IP=localhost"
)

echo 📍 检测到的局域网IP: %LOCAL_IP%
echo.

:: 设置端口
set "PORT=8080"

echo ========================================
echo    🚀 启动信息
echo ========================================
echo.
echo 📁 服务目录: %CD%\dist
echo 🌐 局域网地址: http://%LOCAL_IP%:%PORT%
echo 💻 本机地址: http://localhost:%PORT%
echo 📱 手机访问: http://%LOCAL_IP%:%PORT%
echo.
echo ========================================
echo    📱 手机访问步骤
echo ========================================
echo.
echo 1. 确保手机和电脑在同一WiFi网络
echo 2. 在手机浏览器中输入: http://%LOCAL_IP%:%PORT%
echo 3. 如果无法访问，请检查防火墙设置
echo.
echo ⚠️  注意：首次访问可能需要等待几秒钟
echo.

:: 启动HTTP服务器
echo 🔄 正在启动HTTP服务器...
cd /d "%~dp0\dist"

:: 检查Python版本并启动服务器
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 使用Python启动服务器
    echo.
    echo 📝 服务器日志：
    echo ----------------------------------------
    python -m http.server %PORT% --bind 0.0.0.0
) else (
    echo ❌ Python未安装，尝试使用Node.js...
    
    node --version >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✅ 使用Node.js启动服务器
        echo.
        
        :: 检查serve是否已安装
        npx serve --version >nul 2>&1
        if %errorlevel% equ 0 (
            echo 📝 服务器日志：
            echo ----------------------------------------
            npx serve -s . -l %PORT% --host 0.0.0.0
        ) else (
            echo 🔄 正在安装serve...
            npm install -g serve
            echo 📝 服务器日志：
            echo ----------------------------------------
            npx serve -s . -l %PORT% --host 0.0.0.0
        )
    ) else (
        echo ❌ 未找到Python或Node.js，无法启动服务器
        echo.
        echo 💡 请安装以下之一：
        echo   • Python 3.x
        echo   • Node.js
        echo.
        pause
        exit /b 1
    )
)

:: 如果到达这里，说明服务器已停止
echo.
echo ⏹️  服务器已停止
pause
