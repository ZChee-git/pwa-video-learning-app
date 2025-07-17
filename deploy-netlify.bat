@echo off
echo ===========================================
echo         PWA 自动部署到 Netlify
echo ===========================================

echo 正在构建生产版本...
call npm run build

if %errorlevel% neq 0 (
    echo 构建失败，请检查错误信息
    pause
    exit /b 1
)

echo 构建完成，准备部署到 Netlify...

echo.
echo 请按照以下步骤部署：
echo 1. 访问 https://netlify.com
echo 2. 登录或注册账户
echo 3. 点击 "Add new site" -> "Deploy manually"
echo 4. 将 dist 文件夹拖拽到部署区域
echo 5. 等待部署完成

echo.
echo 或者使用 Netlify CLI：
echo 1. 运行: npm install -g netlify-cli
echo 2. 运行: netlify login
echo 3. 运行: netlify deploy --prod --dir dist

echo.
echo 部署完成后，您将获得一个永久的网址，可以在任何网络环境下访问！
echo.

pause
