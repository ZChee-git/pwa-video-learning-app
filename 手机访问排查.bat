@echo off
chcp 65001
cls

echo.
echo ===================================================
echo     📱 手机访问问题排查工具
echo ===================================================
echo.

:: 步骤1：检查网络连接
echo 🔍 步骤1：检查网络连接
echo ===================================================
echo.
echo 当前网络配置：
ipconfig | findstr /C:"IPv4" /C:"适配器" /C:"以太网" /C:"无线"
echo.

:: 步骤2：提取局域网IP
echo 🌐 步骤2：提取局域网IP地址
echo ===================================================
setlocal enabledelayedexpansion
set "found_ip="
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr "IPv4"') do (
    set "ip=%%i"
    set "ip=!ip: =!"
    if "!ip:~0,3!"=="192" (
        set "found_ip=!ip!"
        echo ✅ 找到局域网IP: !ip!
    )
    if "!ip:~0,2!"=="10" (
        set "found_ip=!ip!"
        echo ✅ 找到局域网IP: !ip!
    )
    if "!ip:~0,3!"=="172" (
        set "found_ip=!ip!"
        echo ✅ 找到局域网IP: !ip!
    )
)

if "!found_ip!"=="" (
    echo ❌ 未找到局域网IP地址
    echo 💡 可能原因：未连接到WiFi或以太网
    echo.
    goto :troubleshoot
)

:: 步骤3：检查端口
echo.
echo 🔌 步骤3：检查端口8080占用情况
echo ===================================================
netstat -an | findstr ":8080" >nul 2>&1
if %errorlevel% equ 0 (
    echo ⚠️ 端口8080已被占用
    echo 占用详情：
    netstat -ano | findstr ":8080"
    echo.
    echo 💡 解决方案：
    echo    1. 关闭占用端口的程序
    echo    2. 使用其他端口
    echo    3. 重启电脑
) else (
    echo ✅ 端口8080可用
)
echo.

:: 步骤4：防火墙检查
echo 🛡️ 步骤4：检查防火墙状态
echo ===================================================
netsh advfirewall show allprofiles | findstr "State"
echo.
echo 💡 如果防火墙状态为ON，可能阻止手机访问
echo    临时关闭命令：netsh advfirewall set allprofiles state off
echo    重新开启命令：netsh advfirewall set allprofiles state on
echo.

:: 步骤5：生成访问地址
echo 📱 步骤5：生成手机访问地址
echo ===================================================
if not "!found_ip!"=="" (
    echo 🎯 手机访问地址：http://!found_ip!:8080
    echo 💻 本机访问地址：http://localhost:8080
    echo.
    echo 📋 访问测试清单：
    echo    1. 确保手机和电脑在同一WiFi网络
    echo    2. 在手机浏览器输入上面的手机访问地址
    echo    3. 如果无法访问，尝试关闭防火墙
    echo    4. 检查路由器是否启用了AP隔离
)
echo.

:troubleshoot
echo ===================================================
echo     🔧 常见问题及解决方案
echo ===================================================
echo.
echo 问题1：找不到局域网IP
echo 解决：检查网络连接，重新连接WiFi
echo.
echo 问题2：端口被占用
echo 解决：关闭其他程序，或重启电脑
echo.
echo 问题3：防火墙阻止
echo 解决：临时关闭防火墙测试
echo.
echo 问题4：路由器设置
echo 解决：检查路由器是否启用了AP隔离功能
echo.
echo 问题5：手机无法访问
echo 解决：确保手机和电脑在同一WiFi，尝试重启路由器
echo.

pause
