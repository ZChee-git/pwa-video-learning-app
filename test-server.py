#!/usr/bin/env python3
"""
快速测试PWA服务器
"""
import os
import sys

print("🎯 PWA临时解决方案测试")
print("=" * 50)

# 检查环境
print("1. 检查Python版本...")
print(f"   Python版本: {sys.version}")

print("\n2. 检查构建目录...")
if os.path.exists('dist'):
    print("   ✅ dist目录存在")
    if os.path.exists('dist/index.html'):
        print("   ✅ index.html存在")
    else:
        print("   ❌ index.html不存在")
        print("   请运行: npm run build")
        sys.exit(1)
else:
    print("   ❌ dist目录不存在")
    print("   请运行: npm run build")
    sys.exit(1)

print("\n3. 检查网络...")
import socket
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(("8.8.8.8", 80))
    local_ip = s.getsockname()[0]
    s.close()
    print(f"   ✅ 本机IP: {local_ip}")
except:
    print("   ⚠️  网络连接问题")
    local_ip = "127.0.0.1"

print("\n4. 启动服务器...")
print(f"   本地地址: http://localhost:8080")
print(f"   网络地址: http://{local_ip}:8080")
print("\n请在手机上访问网络地址，然后添加到主屏幕")
print("按 Ctrl+C 停止服务器")
print("=" * 50)

# 启动服务器
os.chdir('dist')
import http.server
import socketserver

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

try:
    with socketserver.TCPServer(("", 8080), MyHandler) as httpd:
        print("🚀 服务器启动成功！")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n✅ 服务器已停止")
except Exception as e:
    print(f"❌ 启动失败: {e}")
