#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Enhanced Mobile Server - PWA临时解决方案
支持跨网络访问的静态文件服务器
"""

import http.server
import socketserver
import os
import sys
import socket
import threading
import webbrowser
import json
import time
import ipaddress
from datetime import datetime

class EnhancedHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """增强的HTTP请求处理器"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory='dist', **kwargs)
    
    def end_headers(self):
        # 添加PWA必需的头部
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        """处理GET请求"""
        # 如果请求的是根目录，返回index.html
        if self.path == '/':
            self.path = '/index.html'
        
        # 处理PWA manifest
        if self.path.endswith('.webmanifest') or self.path.endswith('manifest.json'):
            self.send_response(200)
            self.send_header('Content-Type', 'application/manifest+json')
            self.end_headers()
            try:
                with open('dist' + self.path, 'rb') as f:
                    self.wfile.write(f.read())
            except FileNotFoundError:
                self.send_error(404, "Manifest not found")
            return
        
        # 处理Service Worker
        if self.path.endswith('.js') and ('sw' in self.path or 'service-worker' in self.path):
            self.send_response(200)
            self.send_header('Content-Type', 'application/javascript')
            self.send_header('Service-Worker-Allowed', '/')
            self.end_headers()
            try:
                with open('dist' + self.path, 'rb') as f:
                    self.wfile.write(f.read())
            except FileNotFoundError:
                self.send_error(404, "Service Worker not found")
            return
        
        # 默认处理
        super().do_GET()
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {format % args}")

class MobileServer:
    """移动设备优化的服务器"""
    
    def __init__(self, port=8080):
        self.port = port
        self.server = None
        self.running = False
        
    def get_local_ip(self):
        """获取本机IP地址，排除VPN虚拟网卡"""
        try:
            # 获取所有网络接口
            interfaces = []
            
            # 方法1：尝试通过socket获取所有可能的IP
            hostname = socket.gethostname()
            for info in socket.getaddrinfo(hostname, None):
                ip = info[4][0]
                if ':' not in ip:  # 排除IPv6
                    interfaces.append(ip)
            
            # 方法2：尝试连接外部地址获取路由IP
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
                s.connect(("8.8.8.8", 80))
                route_ip = s.getsockname()[0]
                s.close()
                interfaces.append(route_ip)
            except:
                pass
            
            # 过滤出真实的局域网IP
            real_ips = []
            for ip in set(interfaces):
                try:
                    ip_obj = ipaddress.IPv4Address(ip)
                    # 排除环回地址、VPN常用地址段
                    if (ip_obj.is_private and 
                        not ip_obj.is_loopback and 
                        not ip.startswith('10.') and  # 常见VPN地址段
                        not ip.startswith('26.') and  # 您的VPN地址段
                        not ip.startswith('172.16.') and  # VPN常用地址段
                        not ip.startswith('169.254.')):  # 链路本地地址
                        real_ips.append(ip)
                except:
                    continue
            
            # 优先选择192.168.x.x网段（最常见的家庭网络）
            for ip in real_ips:
                if ip.startswith('192.168.'):
                    return ip
            
            # 如果没有192.168.x.x，选择其他私有IP
            if real_ips:
                return real_ips[0]
            
            # 如果都没有，返回localhost
            return "127.0.0.1"
            
        except Exception as e:
            print(f"⚠️  获取IP地址时出错: {e}")
            return "127.0.0.1"
    
    def check_build_directory(self):
        """检查构建目录"""
        if not os.path.exists('dist'):
            print("❌ 错误：dist目录不存在")
            print("请先运行构建命令：npm run build")
            return False
        
        if not os.path.exists('dist/index.html'):
            print("❌ 错误：dist/index.html不存在")
            print("请确保构建完成")
            return False
        
        return True
    
    def create_offline_indicator(self):
        """创建离线指示器"""
        indicator_html = '''
        <div id="offline-indicator" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff4444;
            color: white;
            text-align: center;
            padding: 8px;
            z-index: 10000;
            font-size: 14px;
            display: none;
        ">
            📡 网络连接已断开，应用正在离线模式下运行
        </div>
        <script>
            window.addEventListener('online', function() {
                document.getElementById('offline-indicator').style.display = 'none';
            });
            window.addEventListener('offline', function() {
                document.getElementById('offline-indicator').style.display = 'block';
            });
        </script>
        '''
        return indicator_html
    
    def diagnose_network(self):
        """诊断网络配置"""
        print("🔍 网络诊断信息:")
        print("-" * 40)
        
        try:
            # 获取所有网络接口
            hostname = socket.gethostname()
            print(f"主机名: {hostname}")
            
            all_ips = []
            for info in socket.getaddrinfo(hostname, None):
                ip = info[4][0]
                if ':' not in ip:  # 排除IPv6
                    all_ips.append(ip)
            
            # 分类显示IP地址
            print("\n📋 检测到的IP地址:")
            for ip in set(all_ips):
                try:
                    ip_obj = ipaddress.IPv4Address(ip)
                    if ip_obj.is_loopback:
                        print(f"  🔄 环回地址: {ip}")
                    elif ip.startswith('26.'):
                        print(f"  🔒 VPN地址: {ip} (跳过)")
                    elif ip.startswith('10.'):
                        print(f"  🔒 VPN地址: {ip} (跳过)")
                    elif ip.startswith('172.16.'):
                        print(f"  🔒 VPN地址: {ip} (跳过)")
                    elif ip.startswith('169.254.'):
                        print(f"  ⚠️  链路本地: {ip} (跳过)")
                    elif ip.startswith('192.168.'):
                        print(f"  ✅ 家庭网络: {ip} (推荐)")
                    elif ip_obj.is_private:
                        print(f"  🏠 私有网络: {ip}")
                    else:
                        print(f"  🌐 公网地址: {ip}")
                except:
                    print(f"  ❓ 未知: {ip}")
            
            print("-" * 40)
            
        except Exception as e:
            print(f"⚠️  网络诊断失败: {e}")
    
    def start(self):
        """启动服务器"""
        if not self.check_build_directory():
            return False
        
        # 添加网络诊断
        self.diagnose_network()
        
        try:
            # 创建服务器
            self.server = socketserver.TCPServer(("", self.port), EnhancedHTTPRequestHandler)
            self.server.allow_reuse_address = True
            
            # 获取网络信息
            local_ip = self.get_local_ip()
            
            print("=" * 60)
            print("🚀 Enhanced Mobile Server 启动成功")
            print("=" * 60)
            print(f"📱 本地访问地址: http://localhost:{self.port}")
            print(f"🌐 网络访问地址: http://{local_ip}:{self.port}")
            print(f"📂 服务目录: {os.path.abspath('dist')}")
            print("=" * 60)
            print("📋 PWA使用说明:")
            print("1. 在手机浏览器中打开网络访问地址")
            print("2. 点击浏览器菜单 → '添加到主屏幕'")
            print("3. 从主屏幕启动应用")
            print("4. 应用支持离线使用")
            print("=" * 60)
            print("⚠️  注意事项:")
            print("• 确保手机和电脑在同一WiFi网络")
            print("• 如果仍需要跨网络访问，请部署到云端")
            print("• 按 Ctrl+C 停止服务器")
            print("=" * 60)
            
            self.running = True
            
            # 在新线程中启动服务器
            server_thread = threading.Thread(target=self.server.serve_forever)
            server_thread.daemon = True
            server_thread.start()
            
            # 自动在浏览器中打开
            threading.Timer(1.0, lambda: webbrowser.open(f'http://localhost:{self.port}')).start()
            
            try:
                while self.running:
                    time.sleep(1)
            except KeyboardInterrupt:
                self.stop()
                
        except OSError as e:
            if e.errno == 98:  # Address already in use
                print(f"❌ 端口 {self.port} 已被占用")
                print("请尝试其他端口或停止占用该端口的进程")
                return False
            else:
                print(f"❌ 服务器启动失败: {e}")
                return False
        except Exception as e:
            print(f"❌ 意外错误: {e}")
            return False
        
        return True
    
    def stop(self):
        """停止服务器"""
        if self.server:
            print("\n🛑 正在停止服务器...")
            self.running = False
            self.server.shutdown()
            self.server.server_close()
            print("✅ 服务器已停止")

def main():
    """主函数"""
    print("🎯 PWA临时解决方案")
    print("解决离开WiFi后无法访问的问题")
    print()
    
    # 检查Python版本
    if sys.version_info < (3, 6):
        print("❌ 需要Python 3.6+版本")
        sys.exit(1)
    
    # 解析命令行参数
    port = 8080
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ 端口号必须是数字")
            sys.exit(1)
    
    # 创建并启动服务器
    server = MobileServer(port)
    success = server.start()
    
    if not success:
        print("❌ 服务器启动失败")
        sys.exit(1)

if __name__ == "__main__":
    main()