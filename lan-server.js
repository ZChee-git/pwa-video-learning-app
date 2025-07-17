const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const PORT = 8080;

// 获取本机IP地址
function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (let devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '127.0.0.1';
}

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist')));

// SPA路由处理
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const localIP = getLocalIP();

app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('    🌐 局域网视频学习服务器已启动');
    console.log('========================================');
    console.log(`💻 本机访问: http://localhost:${PORT}`);
    console.log(`📱 手机访问: http://${localIP}:${PORT}`);
    console.log('========================================');
    console.log('\n📝 使用说明:');
    console.log('1. 确保手机和电脑在同一WiFi网络');
    console.log(`2. 在手机浏览器中输入: http://${localIP}:${PORT}`);
    console.log('3. 如果无法访问，请检查防火墙设置');
    console.log('\n按 Ctrl+C 停止服务器\n');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n⏹️  服务器已停止');
    process.exit(0);
});
