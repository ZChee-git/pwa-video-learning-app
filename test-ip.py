#!/usr/bin/env python3
"""
IP地址检测测试
"""
import socket
import ipaddress

def test_ip_detection():
    print("🔍 IP地址检测测试")
    print("=" * 50)
    
    # 获取所有网络接口
    hostname = socket.gethostname()
    print(f"主机名: {hostname}")
    
    all_ips = []
    for info in socket.getaddrinfo(hostname, None):
        ip = info[4][0]
        if ':' not in ip:  # 排除IPv6
            all_ips.append(ip)
    
    print("\n📋 检测到的IP地址:")
    real_ips = []
    
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
                real_ips.append(ip)
            elif ip_obj.is_private:
                print(f"  🏠 私有网络: {ip}")
                real_ips.append(ip)
            else:
                print(f"  🌐 公网地址: {ip}")
        except:
            print(f"  ❓ 未知: {ip}")
    
    print("\n🎯 推荐使用的IP:")
    if real_ips:
        for ip in real_ips:
            if ip.startswith('192.168.'):
                print(f"  ✅ 最佳选择: {ip}")
                return ip
        print(f"  ✅ 可用选择: {real_ips[0]}")
        return real_ips[0]
    else:
        print("  ❌ 未找到合适的IP，使用localhost")
        return "127.0.0.1"

if __name__ == "__main__":
    recommended_ip = test_ip_detection()
    print(f"\n🚀 服务器应该使用: http://{recommended_ip}:8080")
    print("\n💡 建议:")
    if recommended_ip.startswith('26.'):
        print("  - 检测到VPN地址，建议关闭VPN后重试")
    elif recommended_ip.startswith('192.168.'):
        print("  - 检测到家庭网络IP，应该可以正常访问")
    elif recommended_ip == "127.0.0.1":
        print("  - 仅本地访问，手机无法访问")
        print("  - 建议检查网络连接或关闭VPN")
    else:
        print("  - 检测到私有网络IP，请测试手机是否能访问")
