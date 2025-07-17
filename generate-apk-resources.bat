@echo off
title APK资源生成工具
color 0A
echo.
echo 🎨 APK资源生成工具
echo ====================
echo.

echo 📱 正在创建Android资源文件夹...
mkdir "android\app\src\main\res\drawable" 2>nul
mkdir "android\app\src\main\res\drawable-hdpi" 2>nul
mkdir "android\app\src\main\res\drawable-mdpi" 2>nul
mkdir "android\app\src\main\res\drawable-xhdpi" 2>nul
mkdir "android\app\src\main\res\drawable-xxhdpi" 2>nul
mkdir "android\app\src\main\res\drawable-xxxhdpi" 2>nul
mkdir "android\app\src\main\res\mipmap-hdpi" 2>nul
mkdir "android\app\src\main\res\mipmap-mdpi" 2>nul
mkdir "android\app\src\main\res\mipmap-xhdpi" 2>nul
mkdir "android\app\src\main\res\mipmap-xxhdpi" 2>nul
mkdir "android\app\src\main\res\mipmap-xxxhdpi" 2>nul
mkdir "android\app\src\main\res\values" 2>nul

echo ✅ 资源文件夹创建完成

echo.
echo 💡 接下来需要手动操作:
echo    1. 准备应用图标 (推荐尺寸: 1024x1024)
echo    2. 使用在线工具生成不同尺寸的图标
echo    3. 将图标放入相应的mipmap文件夹
echo    4. 创建启动画面素材
echo.

echo 🌐 推荐的在线工具:
echo    • Android Asset Studio: https://romannurik.github.io/AndroidAssetStudio/
echo    • Icon Generator: https://www.iconsgenerator.com/
echo    • App Icon Generator: https://appicon.co/
echo.

echo 📋 图标尺寸对照表:
echo    • mipmap-mdpi: 48x48
echo    • mipmap-hdpi: 72x72
echo    • mipmap-xhdpi: 96x96
echo    • mipmap-xxhdpi: 144x144
echo    • mipmap-xxxhdpi: 192x192
echo.

pause
