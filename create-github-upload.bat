@echo off
chcp 65001 > nul
echo ========================================
echo 📦 创建GitHub上传包
echo ========================================
echo.

cd /d "%~dp0"

:: 创建上传目录
if exist "github-upload" rmdir /s /q "github-upload"
mkdir "github-upload"

:: 复制必要文件
echo 📁 复制项目文件...
copy "package.json" "github-upload\" > nul
copy "index.html" "github-upload\" > nul
copy "vite.config.ts" "github-upload\" > nul
copy "tsconfig.json" "github-upload\" > nul
copy "tsconfig.app.json" "github-upload\" > nul
copy "tsconfig.node.json" "github-upload\" > nul
copy "tailwind.config.js" "github-upload\" > nul
copy "postcss.config.js" "github-upload\" > nul
copy "eslint.config.js" "github-upload\" > nul
copy ".gitignore" "github-upload\" > nul

:: 复制文件夹
echo 📁 复制src文件夹...
xcopy "src" "github-upload\src" /E /I /H /Y > nul

echo 📁 复制public文件夹...
xcopy "public" "github-upload\public" /E /I /H /Y > nul

:: 如果dist存在，也复制
if exist "dist" (
    echo 📁 复制dist文件夹...
    xcopy "dist" "github-upload\dist" /E /I /H /Y > nul
)

echo.
echo ========================================
echo ✅ GitHub上传包已创建
echo ========================================
echo 📂 文件位置: %cd%\github-upload
echo.
echo 📋 接下来的步骤：
echo 1. 打开文件夹: %cd%\github-upload
echo 2. 全选所有文件和文件夹 (Ctrl+A)
echo 3. 访问您的GitHub仓库: https://github.com/ZChee-git/pwa-video-learning-app
echo 4. 点击 "uploading an existing file"
echo 5. 将选中的文件拖拽到GitHub页面
echo 6. 输入提交消息: "Add PWA video learning app"
echo 7. 点击 "Commit changes"
echo ========================================
echo.

:: 打开文件夹
start explorer "%cd%\github-upload"

pause
