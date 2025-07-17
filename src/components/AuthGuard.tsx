import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

// 验证码配置
const AUTH_CODES = {
  '20250001': 10, // 10天
  '20250002': 10, // 10天
  '20250003': 10, // 10天
  '20251017': 10, // 10天
  '198510160174': -1, // 无限制
  'FREE3M2025': 90, // 3个月免密使用（90天）
};

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 检查预设的验证码
    if (AUTH_CODES.hasOwnProperty(password)) {
      const validDays = AUTH_CODES[password as keyof typeof AUTH_CODES];
      setIsAuthenticated(true);
      localStorage.setItem('app_authenticated', 'true');
      localStorage.setItem('app_auth_code', password);
      
      if (validDays === -1) {
        // 无限制使用
        localStorage.setItem('app_auth_expiry', 'unlimited');
      } else {
        // 设置过期时间
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + validDays);
        localStorage.setItem('app_auth_expiry', expiryDate.toISOString());
      }
      
      setIsLoading(false);
      return;
    }
    
    // 检查19位数字验证码（180天使用权）
    if (password.length === 19 && /^\d{19}$/.test(password)) {
      setIsAuthenticated(true);
      localStorage.setItem('app_authenticated', 'true');
      localStorage.setItem('app_auth_code', password);
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 180);
      localStorage.setItem('app_auth_expiry', expiryDate.toISOString());
      
      setIsLoading(false);
      return;
    }
    
    // 检查28位数字验证码（180天使用权）
    if (password.length === 28 && /^\d{28}$/.test(password)) {
      setIsAuthenticated(true);
      localStorage.setItem('app_authenticated', 'true');
      localStorage.setItem('app_auth_code', password);
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 180);
      localStorage.setItem('app_auth_expiry', expiryDate.toISOString());
      
      setIsLoading(false);
      return;
    }
    
    alert('验证码错误，请重试');
    setPassword('');
    setIsLoading(false);
  };

  // Check if user was previously authenticated and not expired
  React.useEffect(() => {
    // 检查是否在3个月免密使用期间（2025年7月17日到2025年10月17日）
    const now = new Date();
    const freeStartDate = new Date('2025-07-17T00:00:00');
    const freeEndDate = new Date('2025-10-17T23:59:59');
    
    if (now >= freeStartDate && now <= freeEndDate) {
      // 在3个月免密使用期间，所有用户都自动通过验证
      setIsAuthenticated(true);
      localStorage.setItem('app_authenticated', 'true');
      localStorage.setItem('app_auth_code', 'FREE3M2025');
      localStorage.setItem('app_auth_expiry', freeEndDate.toISOString());
      localStorage.setItem('app_free_period_active', 'true');
      localStorage.setItem('app_free_period_start', freeStartDate.toISOString());
      localStorage.setItem('app_free_period_end', freeEndDate.toISOString());
      setIsCheckingAuth(false);
      return;
    }
    
    // 3个月免密期间已过，检查正常的验证状态
    const authStatus = localStorage.getItem('app_authenticated');
    const authExpiry = localStorage.getItem('app_auth_expiry');
    
    if (authStatus === 'true') {
      if (authExpiry === 'unlimited') {
        setIsAuthenticated(true);
      } else if (authExpiry) {
        const expiryDate = new Date(authExpiry);
        if (now < expiryDate) {
          setIsAuthenticated(true);
        } else {
          // 认证已过期，清除本地存储
          localStorage.removeItem('app_authenticated');
          localStorage.removeItem('app_auth_expiry');
          localStorage.removeItem('app_auth_code');
          localStorage.removeItem('app_free_period_active');
          localStorage.removeItem('app_free_period_start');
          localStorage.removeItem('app_free_period_end');
        }
      }
    }
    
    setIsCheckingAuth(false);
  }, []);

  // 显示加载状态
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="text-purple-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              智能播放系统
            </h1>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-2"></div>
              <span className="text-gray-600">正在检查认证状态...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-purple-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            智能播放系统
          </h1>
          <p className="text-gray-600">
            请输入验证码以获得使用权限
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              验证码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-12"
                placeholder="输入验证码"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                验证中...
              </div>
            ) : (
              '验证并进入'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🎉 即日起3个月内免密使用（7月17日-10月17日）</p>
          <p className="mt-2">基于艾宾浩斯遗忘曲线理论安排90天内的复习时间点，助力高效掌握学习内容。</p>
        </div>
      </div>
    </div>
  );
};
