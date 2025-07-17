#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import http.server
import socketserver
import socket
import os
import sys
import threading
import time
from urllib.parse import urlparse

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # 处理SPA路由
        if self.path != '/' and not os.path.exists(self.translate_path(self.path)):
            self.path = '/'
        return super().do_GET()

def get_local_ip():
    """获取本机局域网IP地址"""
    try:
        # 方法1：创建UDP socket连接
        sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        sock.connect(("8.8.8.8", 80))
        ip = sock.getsockname()[0]
        sock.close()
        return ip
    except Exception:
        try:
            # 方法2：获取所有网络接口
            hostname = socket.gethostname()
            ip = socket.gethostbyname(hostname)
            if not ip.startswith("127."):
                return ip
        except Exception:
            pass
        
        try:
            # 方法3：遍历网络接口
            import subprocess
            result = subprocess.run(['ipconfig'], capture_output=True, text=True, encoding='gb2312')
            lines = result.stdout.split('\n')
            for line in lines:
                if 'IPv4' in line and ('192.168' in line or '10.' in line or '172.' in line):
                    ip = line.split(':')[1].strip()
                    return ip
        except Exception:
            pass
        
        return "127.0.0.1"

def check_firewall():
    """检查防火墙状态"""
    try:
        import subprocess
        result = subprocess.run(['netsh', 'advfirewall', 'show', 'allprofiles'], 
                              capture_output=True, text=True, encoding='gb2312')
        return 'OFF' not in result.stdout
    except Exception:
        return False

def check_port_available(port):
    """检查端口是否可用"""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.bind(('', port))
            return True
    except Exception:
        return False

def main():
    port = 8080
    
    # 切换到dist目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dist_dir = os.path.join(script_dir, 'dist')
    
    if not os.path.exists(dist_dir):
        print("❌ 错误：dist目录不存在")
        print("请先运行 'npm run build' 构建项目")
        input("按回车键退出...")
        sys.exit(1)
    
    os.chdir(dist_dir)
    
    # 获取本机IP
    local_ip = get_local_ip()
    
    print("\n" + "="*50)
    print("    🌐 局域网视频学习服务器")
    print("="*50)
    print(f"📍 服务器目录: {dist_dir}")
    print(f"🌐 局域网地址: http://{local_ip}:{port}")
    print(f"💻 本机地址: http://localhost:{port}")
    print(f"📱 手机访问: http://{local_ip}:{port}")
    print("="*50)
    print("\n📝 使用说明:")
    print("1. 确保手机和电脑在同一WiFi网络")
    print(f"2. 在手机浏览器中输入: http://{local_ip}:{port}")
    print("3. 如果无法访问，请检查防火墙设置")
    print("\n⚠️  按 Ctrl+C 停止服务器")
    print("-" * 50)
    
    try:
        # 创建服务器
        with socketserver.TCPServer(("0.0.0.0", port), CustomHTTPRequestHandler) as httpd:
            print(f"\n🚀 服务器启动成功，监听端口 {port}")
            print(f"📡 服务器绑定到所有网络接口 (0.0.0.0:{port})")
            print("\n📋 访问日志:")
            print("-" * 30)
            
            # 启动服务器
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n⏹️  服务器已停止")
    except Exception as e:
        print(f"\n❌ 服务器启动失败: {e}")
        input("按回车键退出...")

if __name__ == "__main__":
    main()
