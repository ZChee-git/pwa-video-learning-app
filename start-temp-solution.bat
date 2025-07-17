@echo off
echo ==========================================
echo        PWA 临时解决方案
echo ==========================================

echo 🔄 正在构建生产版本...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ 构建失败，请检查错误信息
    pause
    exit /b 1
)

echo ✅ 构建成功！

echo 🚀 启动临时服务器...
python enhanced-mobile-server.py

pause
