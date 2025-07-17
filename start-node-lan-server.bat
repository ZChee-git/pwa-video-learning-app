@echo off
chcp 65001
cls

echo.
echo ===================================================
echo     📱 Node.js 局域网服务器启动器
echo ===================================================
echo.

:: 进入项目目录
cd /d "C:\Users\Administrator\Downloads\project-bolt-sb1-raf4VSCODE_2\project"

:: 检查dist目录
if not exist "dist" (
    echo ⚠️  dist目录不存在，正在构建...
    call npm run build
    if errorlevel 1 (
        echo ❌ 构建失败
        pause
        exit /b 1
    )
)

echo 🔍 正在检测局域网IP地址...
echo.

:: 获取局域网IP
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "IPv4" ^| findstr "192.168"') do (
    set "ip=%%i"
    set "ip=!ip: =!"
    if not "!ip!"=="" (
        echo 📍 检测到局域网IP: !ip!
        echo.
        echo ========================================
        echo     📱 手机访问地址
        echo ========================================
        echo.
        echo 🌐 局域网地址: http://!ip!:8080
        echo 💻 本机地址: http://localhost:8080
        echo.
        echo ⚠️  请确保手机和电脑在同一WiFi网络
        echo.
        goto :start_server
    )
)

echo ❌ 未找到局域网IP，将使用localhost
echo 💻 本机地址: http://localhost:8080
echo.

:start_server
echo 🚀 正在启动Node.js服务器...
echo.

:: 检查serve是否已安装
where serve >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 使用已安装的serve
    cd dist
    serve -s . -l 8080 --host 0.0.0.0
) else (
    echo 🔄 正在安装serve...
    npm install -g serve
    cd dist
    serve -s . -l 8080 --host 0.0.0.0
)

pause
