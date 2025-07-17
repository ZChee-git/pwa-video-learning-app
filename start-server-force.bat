@echo off
echo ===========================================
echo 正在强制重启服务器 - 清除所有缓存
echo ===========================================
echo.

cd /d "c:\Users\Administrator\Downloads\project-bolt-sb1-raf4VSCODE_2\project"

echo 1. 停止所有Node进程...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2

echo 2. 清理缓存...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist dist rmdir /s /q dist
if exist .vite rmdir /s /q .vite

echo 3. 启动开发服务器...
echo.
echo 服务器启动后，请在iOS Safari中执行以下操作：
echo 1. 长按刷新按钮
echo 2. 选择"无痕浏览"模式重新访问
echo 3. 或者清除Safari缓存：设置 ^> Safari ^> 清除历史记录和网站数据
echo.
echo 如果还是没有更新，请尝试：
echo - 关闭Safari完全重新打开
echo - 使用不同的端口: http://你的IP:5173/?v=%random%
echo.

npm run dev

pause
