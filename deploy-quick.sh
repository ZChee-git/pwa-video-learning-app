#!/bin/bash

echo "================================================"
echo "         PWA 一键部署解决方案"
echo "================================================"

# 检查是否有网络连接
echo "检查网络连接..."
if ! ping -c 1 google.com > /dev/null 2>&1; then
    echo "❌ 网络连接失败，请检查网络设置"
    exit 1
fi

echo "✅ 网络连接正常"

# 构建项目
echo "正在构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi

echo "✅ 构建成功"

# 检查是否安装了 netlify-cli
if ! command -v netlify &> /dev/null; then
    echo "正在安装 Netlify CLI..."
    npm install -g netlify-cli
fi

# 部署到 Netlify
echo "正在部署到 Netlify..."
netlify deploy --prod --dir dist

if [ $? -eq 0 ]; then
    echo "================================================"
    echo "✅ 部署成功！"
    echo "================================================"
    echo "请按照以下步骤完成设置："
    echo "1. 复制上方显示的部署网址"
    echo "2. 在iOS Safari中打开该网址"
    echo "3. 点击分享按钮 → 添加到主屏幕"
    echo "4. 从主屏幕启动应用"
    echo "5. 您的视频数据将自动恢复"
    echo "================================================"
else
    echo "❌ 部署失败，请尝试手动部署"
    echo "手动部署步骤："
    echo "1. 访问 https://netlify.com"
    echo "2. 登录账户"
    echo "3. 拖拽 dist 文件夹到部署区域"
    echo "4. 等待部署完成"
fi
