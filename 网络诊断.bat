@echo off
chcp 65001
cls

echo.
echo ===================================================
echo     🔧 网络连接诊断工具
echo ===================================================
echo.

:: 获取详细网络信息
echo 🔍 第一步：检查网络配置
echo ===================================================
echo.
echo 📡 所有网络接口信息：
ipconfig /all | findstr /C:"IPv4" /C:"以太网" /C:"无线" /C:"适配器"
echo.

echo 🌐 局域网IP地址：
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "IPv4"') do (
    set "ip=%%i"
    set "ip=!ip: =!"
    if "!ip:~0,3!"=="192" echo   • 192网段: !ip!
    if "!ip:~0,2!"=="10" echo   • 10网段: !ip!
    if "!ip:~0,3!"=="172" echo   • 172网段: !ip!
)
echo.

:: 检查防火墙
echo 🛡️ 第二步：检查防火墙状态
echo ===================================================
echo.
echo 防火墙配置文件状态：
netsh advfirewall show allprofiles | findstr "State"
echo.

:: 检查端口占用
echo 🔌 第三步：检查端口8080占用情况
echo ===================================================
echo.
netstat -an | findstr ":8080"
if %errorlevel% equ 0 (
    echo ⚠️  端口8080已被占用
    echo.
    echo 占用端口8080的进程：
    netstat -ano | findstr ":8080"
) else (
    echo ✅ 端口8080未被占用，可以使用
)
echo.

:: 网络连通性测试
echo 🌍 第四步：网络连通性测试
echo ===================================================
echo.
echo 测试网络连通性...
ping -n 1 8.8.8.8 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 互联网连接正常
) else (
    echo ❌ 互联网连接异常
)
echo.

:: 检查Python
echo 🐍 第五步：检查Python环境
echo ===================================================
echo.
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Python可用
    python --version
) else (
    echo ❌ Python未安装或不在PATH中
)
echo.

:: 检查Node.js
echo 🟢 第六步：检查Node.js环境
echo ===================================================
echo.
node --version >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Node.js可用
    node --version
) else (
    echo ❌ Node.js未安装或不在PATH中
)
echo.

:: 给出建议
echo 💡 诊断建议
echo ===================================================
echo.
echo 常见问题及解决方案：
echo.
echo 1. 🔴 如果没有显示局域网IP：
echo    • 检查网络连接
echo    • 确保已连接到WiFi或有线网络
echo.
echo 2. 🔴 如果防火墙状态为ON：
echo    • 运行：netsh advfirewall set allprofiles state off
echo    • 或手动在防火墙中添加端口8080例外
echo.
echo 3. 🔴 如果端口8080被占用：
echo    • 关闭占用端口的程序
echo    • 或修改服务器使用其他端口
echo.
echo 4. 🔴 手机无法访问的其他原因：
echo    • 手机和电脑不在同一WiFi网络
echo    • 路由器阻止了设备间通信
echo    • 手机浏览器缓存问题
echo.

echo ===================================================
echo 📱 手机访问测试步骤
echo ===================================================
echo.
echo 1. 确保手机连接到与电脑相同的WiFi网络
echo 2. 在手机浏览器中输入上面显示的局域网IP地址
echo 3. 格式：http://[IP地址]:8080
echo 4. 例如：http://192.168.1.100:8080
echo.

pause
