@echo off
chcp 65001 > nul
echo ========================================
echo 🚀 PWA项目一键部署到Netlify
echo ========================================
echo.

:: 检查是否已构建
if not exist "dist" (
    echo 📦 正在构建项目...
    call npm run build
    if errorlevel 1 (
        echo ❌ 构建失败，请检查错误信息
        pause
        exit /b 1
    )
) else (
    echo ✅ 检测到dist目录，跳过构建
)

:: 检查Git状态
if not exist ".git" (
    echo 🔧 初始化Git仓库...
    git init
    git add .
    git commit -m "Initial PWA commit"
    echo.
    echo ⚠️  请手动执行以下步骤：
    echo 1. 在GitHub创建新仓库
    echo 2. 复制仓库URL并执行：
    echo    git remote add origin YOUR_REPO_URL
    echo    git push -u origin main
    echo.
) else (
    echo 📤 提交并推送代码...
    git add .
    git commit -m "Update PWA for APK conversion"
    git push
    if errorlevel 1 (
        echo ⚠️  推送失败，请检查Git配置
    ) else (
        echo ✅ 代码已推送到GitHub
    )
)

echo.
echo ========================================
echo 📋 接下来的步骤：
echo ========================================
echo 1. 访问 https://netlify.com
echo 2. 点击 "New site from Git"
echo 3. 选择您的GitHub仓库
echo 4. 构建设置：
echo    - Build command: npm run build
echo    - Publish directory: dist
echo 5. 点击 "Deploy site"
echo 6. 复制生成的Netlify URL
echo 7. 访问 https://pwabuilder.com
echo 8. 粘贴Netlify URL并生成APK
echo ========================================
echo.
pause
