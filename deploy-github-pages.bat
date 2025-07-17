@echo off
echo 正在构建项目...
npm run build

echo 正在部署到 GitHub Pages...
git add .
git commit -m "自动部署到GitHub Pages"
git push origin main

echo 部署完成！
echo 请访问: https://zchee-git.github.io/pwa-video-learning-app/
pause
