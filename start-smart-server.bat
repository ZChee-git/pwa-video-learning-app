@echo off
echo ===========================================
echo         智能静态服务器启动工具
echo ===========================================

echo 正在构建生产版本...
call npm run build

if %errorlevel% neq 0 (
    echo 构建失败，请检查错误信息
    pause
    exit /b 1
)

echo 构建完成！

echo.
echo 正在检测网络信息...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        set "IP=%%b"
        goto :found
    )
)
:found

echo.
echo ========================================
echo           服务器信息
echo ========================================
echo 本地地址: http://localhost:8080
echo 局域网地址: http://%IP%:8080
echo ========================================
echo.

echo 📱 iOS 用户操作步骤：
echo 1. 删除当前主屏幕上的应用图标
echo 2. 在Safari中打开: http://localhost:8080
echo 3. 点击分享按钮 → 添加到主屏幕
echo 4. 从主屏幕启动新的PWA
echo.
echo 💡 提示：视频数据会自动恢复，无需重新上传
echo.
echo 按 Ctrl+C 停止服务器
echo.

cd dist
python -m http.server 8080
