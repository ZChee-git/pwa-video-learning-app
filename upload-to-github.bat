@echo off
chcp 65001 > nul
echo ========================================
echo 🚀 PWA项目上传到GitHub
echo ========================================
echo.

:: 切换到项目目录
cd /d "%~dp0"

:: 检查是否已构建
if not exist "dist" (
    echo 📦 正在构建项目...
    call npm run build
    if errorlevel 1 (
        echo ❌ 构建失败，请检查错误信息
        pause
        exit /b 1
    )
    echo ✅ 项目构建完成
) else (
    echo ✅ 检测到dist目录
)

:: 创建.gitignore文件
echo 📝 创建.gitignore文件...
echo node_modules/ > .gitignore
echo .DS_Store >> .gitignore
echo .env >> .gitignore
echo .env.local >> .gitignore
echo .vscode/ >> .gitignore
echo *.log >> .gitignore
echo.

:: 初始化Git仓库
if not exist ".git" (
    echo 🔧 初始化Git仓库...
    git init
    if errorlevel 1 (
        echo ❌ Git初始化失败，请确保已安装Git
        pause
        exit /b 1
    )
    echo ✅ Git仓库初始化完成
) else (
    echo ✅ Git仓库已存在
)

:: 添加所有文件
echo 📁 添加项目文件...
git add .
if errorlevel 1 (
    echo ❌ 添加文件失败
    pause
    exit /b 1
)

:: 提交代码
echo 💾 提交代码...
git commit -m "Initial commit: PWA video learning app"
if errorlevel 1 (
    echo ⚠️  提交失败或没有变更
)

echo.
echo ========================================
echo 📋 接下来请手动完成以下步骤：
echo ========================================
echo 1. 访问 https://github.com
echo 2. 点击右上角的 "+" 按钮
echo 3. 选择 "New repository"
echo 4. 输入仓库名称（建议：pwa-video-learning-app）
echo 5. 设置为 Public（公开）
echo 6. 不要勾选 "Initialize this repository with a README"
echo 7. 点击 "Create repository"
echo.
echo 📝 创建完成后，复制仓库URL并按任意键继续...
pause

:: 提示用户输入仓库URL
echo.
set /p REPO_URL=请粘贴您的GitHub仓库URL（例如：https://github.com/username/repo.git）: 

if "%REPO_URL%"=="" (
    echo ❌ 仓库URL不能为空
    pause
    exit /b 1
)

:: 添加远程仓库
echo 🔗 添加远程仓库...
git remote add origin "%REPO_URL%"
if errorlevel 1 (
    echo ❌ 添加远程仓库失败
    pause
    exit /b 1
)

:: 推送代码
echo 📤 推送代码到GitHub...
git push -u origin main
if errorlevel 1 (
    echo ❌ 推送失败，尝试使用master分支...
    git branch -M main
    git push -u origin main
    if errorlevel 1 (
        echo ❌ 推送仍然失败，请检查网络连接和权限
        pause
        exit /b 1
    )
)

echo.
echo ========================================
echo ✅ 代码上传成功！
echo ========================================
echo 🔗 您的GitHub仓库: %REPO_URL%
echo.
echo 📋 接下来的步骤：
echo 1. 访问 https://netlify.com
echo 2. 点击 "New site from Git"
echo 3. 选择GitHub并授权
echo 4. 选择您刚创建的仓库
echo 5. 构建设置：
echo    - Build command: npm run build
echo    - Publish directory: dist
echo 6. 点击 "Deploy site"
echo 7. 复制生成的Netlify URL
echo 8. 访问 https://pwabuilder.com
echo 9. 粘贴Netlify URL并生成APK
echo ========================================
echo.
pause
