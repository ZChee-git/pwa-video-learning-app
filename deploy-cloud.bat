@echo off
title 云端部署工具 - PWA Builder
color 0B
echo.
echo ☁️ 云端部署工具
echo =================
echo.

echo 🎯 为了确保PWA Builder能够访问，推荐部署到云端

echo.
echo 🚀 选择部署方式：
echo   [1] Netlify (推荐)
echo   [2] Vercel
echo   [3] GitHub Pages
echo   [4] 仅构建，手动上传
echo.

set /p choice=请选择 (1-4): 

if "%choice%"=="1" (
    echo.
    echo 🌐 Netlify 部署
    echo ===============
    echo.
    echo 📦 构建应用...
    call npm run build
    echo.
    echo 💡 部署步骤：
    echo   1. 访问 https://app.netlify.com/
    echo   2. 注册/登录账号
    echo   3. 点击 "Add new site" → "Deploy manually"
    echo   4. 拖拽整个 dist 文件夹到页面
    echo   5. 等待部署完成
    echo   6. 复制生成的网址 (如: https://abc123.netlify.app)
    echo   7. 在PWA Builder中使用这个网址
    echo.
    
) else if "%choice%"=="2" (
    echo.
    echo ⚡ Vercel 部署
    echo ==============
    echo.
    echo 📦 构建应用...
    call npm run build
    echo.
    echo 📦 安装Vercel CLI...
    call npm install -g vercel
    echo.
    echo 🚀 部署到Vercel...
    cd dist
    call vercel --prod
    cd ..
    echo.
    echo ✅ 部署完成！使用显示的网址
    
) else if "%choice%"=="3" (
    echo.
    echo 📖 GitHub Pages 部署
    echo ====================
    echo.
    echo 📦 构建应用...
    call npm run build
    echo.
    echo 💡 部署步骤：
    echo   1. 创建GitHub仓库
    echo   2. 上传dist文件夹内容到仓库
    echo   3. 在仓库设置中启用GitHub Pages
    echo   4. 选择main分支作为来源
    echo   5. 等待部署完成
    echo   6. 使用生成的网址
    echo.
    
) else (
    echo.
    echo 📦 仅构建应用
    echo =============
    echo.
    call npm run build
    echo.
    echo ✅ 构建完成！
    echo.
    echo 💡 手动上传选项：
    echo   • 将dist文件夹内容上传到任何静态托管服务
    echo   • 推荐服务：Netlify、Vercel、GitHub Pages
    echo   • 或使用任何Web服务器
    echo.
)

echo.
echo 🎯 下一步：
echo   1. 获取云端网址
echo   2. 访问 https://www.pwabuilder.com/
echo   3. 输入您的云端网址
echo   4. 生成APK
echo.

pause
