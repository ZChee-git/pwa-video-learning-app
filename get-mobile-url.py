#!/usr/bin/env python3
"""
快速获取手机访问地址
"""
import socket
import ipaddress

def get_mobile_access_url():
    """获取手机访问地址"""
    print("🔍 正在检测网络地址...")
    
    try:
        # 获取所有网络接口
        hostname = socket.gethostname()
        all_ips = []
        
        for info in socket.getaddrinfo(hostname, None):
            ip = info[4][0]
            if ':' not in ip:  # 排除IPv6
                all_ips.append(ip)
        
        # 过滤出真实的局域网IP
        real_ips = []
        for ip in set(all_ips):
            try:
                ip_obj = ipaddress.IPv4Address(ip)
                # 排除环回地址、VPN常用地址段
                if (ip_obj.is_private and 
                    not ip_obj.is_loopback and 
                    not ip.startswith('10.') and  # 常见VPN地址段
                    not ip.startswith('26.') and  # VPN地址段
                    not ip.startswith('172.16.') and  # VPN常用地址段
                    not ip.startswith('169.254.')):  # 链路本地地址
                    real_ips.append(ip)
            except:
                continue
        
        # 优先选择192.168.x.x网段
        best_ip = None
        for ip in real_ips:
            if ip.startswith('192.168.'):
                best_ip = ip
                break
        
        if not best_ip and real_ips:
            best_ip = real_ips[0]
        
        if not best_ip:
            best_ip = "127.0.0.1"
            
        port = 8080
        mobile_url = f"http://{best_ip}:{port}"
        
        print("=" * 50)
        print("📱 手机访问地址:")
        print(f"🌐 {mobile_url}")
        print("=" * 50)
        print("📋 使用说明:")
        print("1. 确保手机和电脑在同一WiFi网络")
        print("2. 在手机浏览器中输入上述地址")
        print("3. 如果无法访问，请先启动服务器")
        print("=" * 50)
        
        if best_ip.startswith('26.'):
            print("⚠️  警告: 检测到VPN地址")
            print("建议关闭VPN后重新运行")
        elif best_ip.startswith('192.168.'):
            print("✅ 检测到家庭网络地址，应该可以正常访问")
        elif best_ip == "127.0.0.1":
            print("❌ 仅本地地址，手机无法访问")
            print("请检查网络连接")
        
        return mobile_url
        
    except Exception as e:
        print(f"❌ 获取IP地址失败: {e}")
        return "http://127.0.0.1:8080"

if __name__ == "__main__":
    get_mobile_access_url()
