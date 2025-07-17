@echo off
echo ===========================================
echo         Node.js 静态服务器
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
echo 正在安装 serve 包...
call npm install -g serve

echo.
echo 正在启动服务器...
echo 服务器地址: http://localhost:8080
echo.
echo 📱 iOS 用户操作步骤：
echo 1. 删除当前主屏幕上的应用图标
echo 2. 在Safari中打开: http://localhost:8080
echo 3. 点击分享按钮 → 添加到主屏幕
echo 4. 从主屏幕启动新的PWA
echo.
echo 按 Ctrl+C 停止服务器
echo.

call serve -s dist -p 8080
