@echo off
echo ===========================================
echo         启动本地静态服务器
echo ===========================================

echo 正在构建生产版本...
call npm run build

if %errorlevel% neq 0 (
    echo 构建失败，请检查错误信息
    pause
    exit /b 1
)

echo 构建完成，启动静态服务器...

cd dist

echo.
echo 正在启动服务器...
echo 服务器地址: http://localhost:8080
echo 局域网地址: http://[您的IP]:8080
echo.
echo 接下来的步骤：
echo 1. 复制上面的服务器地址
echo 2. 在iOS Safari中打开该地址
echo 3. 删除旧的PWA（如果有）
echo 4. 点击分享按钮 → 添加到主屏幕
echo 5. 从主屏幕启动新的PWA
echo.
echo 按 Ctrl+C 停止服务器
echo.

python -m http.server 8080
