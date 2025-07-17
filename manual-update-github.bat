@echo off
chcp 65001 > nul
echo ========================================
echo 🔧 手动更新GitHub仓库
echo ========================================
echo.

cd /d "%~dp0"

echo 📋 需要手动更新的文件：
echo 1. public/manifest.json - 已修复PWA兼容性
echo 2. netlify.toml - 构建配置文件
echo.

echo 📂 文件位置：
echo - %cd%\public\manifest.json
echo - %cd%\netlify.toml
echo.

echo 📋 手动上传步骤：
echo 1. 访问 https://github.com/ZChee-git/pwa-video-learning-app
echo 2. 点击 "public" 文件夹
echo 3. 点击 "manifest.json" 文件
echo 4. 点击右上角的编辑按钮（铅笔图标）
echo 5. 替换文件内容
echo 6. 点击 "Commit changes"
echo 7. 同样方式更新 netlify.toml（在根目录）
echo.

echo 📄 manifest.json 的新内容：
echo {
echo   "name": "PWA Video Learning App",
echo   "short_name": "VideoLearning",
echo   "description": "A Progressive Web App for video learning management based on Ebbinghaus forgetting curve",
echo   "theme_color": "#2563eb",
echo   "background_color": "#ffffff",
echo   "display": "standalone",
echo   "orientation": "portrait",
echo   "scope": "/",
echo   "start_url": "/",
echo   "icons": [
echo     {
echo       "src": "/icon-192.png",
echo       "sizes": "192x192",
echo       "type": "image/png",
echo       "purpose": "maskable any"
echo     },
echo     {
echo       "src": "/icon-512.png",
echo       "sizes": "512x512",
echo       "type": "image/png",
echo       "purpose": "maskable any"
echo     }
echo   ],
echo   "categories": ["education", "productivity"],
echo   "lang": "en-US",
echo   "dir": "ltr"
echo }
echo.

echo ========================================
echo 🚀 完成后：
echo 1. 等待 Netlify 自动重新部署（2-3分钟）
echo 2. 访问 https://pwabuilder.com
echo 3. 输入 https://ebb-player.netlify.app
echo 4. 重新分析 PWA
echo ========================================
echo.

pause
