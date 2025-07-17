import React from 'react';
import { User, LogOut, X, Shield, Clock, CheckCircle } from 'lucide-react';

interface AccountManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ isOpen, onClose, onLogout }) => {
  if (!isOpen) return null;

  // 获取认证状态信息
  const getAuthInfo = () => {
    const authExpiry = localStorage.getItem('app_auth_expiry');
    const authCode = localStorage.getItem('app_auth_code');
    
    if (authExpiry === 'unlimited') {
      return { status: '无限制使用', type: 'unlimited', code: authCode };
    } else if (authExpiry) {
      const expiryDate = new Date(authExpiry);
      const now = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { status: `剩余 ${daysLeft} 天`, type: 'limited', code: authCode, daysLeft };
    }
    return { status: '未知状态', type: 'unknown', code: authCode };
  };

  const authInfo = getAuthInfo();

  const getCodeType = (code: string) => {
    if (!code) return '未知';
    if (code.length === 8) return '10天验证码';
    if (code.length === 19) return '180天验证码';
    if (code.length === 28) return '180天验证码';
    return '特殊验证码';
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'unlimited': return 'text-green-600';
      case 'limited': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBgColor = (type: string) => {
    switch (type) {
      case 'unlimited': return 'bg-green-50 border-green-200';
      case 'limited': return 'bg-blue-50 border-blue-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="text-blue-600" size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">账户管理</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Account Status */}
        <div className={`rounded-lg p-4 mb-6 border-2 ${getStatusBgColor(authInfo.type)}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Shield className={getStatusColor(authInfo.type)} size={20} />
              <span className="font-medium text-gray-700">认证状态</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className={getStatusColor(authInfo.type)} size={16} />
              <span className={`font-semibold ${getStatusColor(authInfo.type)}`}>
                已认证
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">使用权限</span>
              <span className={`font-medium ${getStatusColor(authInfo.type)}`}>
                {authInfo.status}
              </span>
            </div>
            
            {authInfo.type === 'limited' && authInfo.daysLeft && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">到期时间</span>
                <div className="flex items-center space-x-1">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-sm text-gray-700">
                    {new Date(localStorage.getItem('app_auth_expiry')!).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">验证码类型</span>
              <span className="text-sm font-medium text-gray-700">
                {getCodeType(authInfo.code || '')}
              </span>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-800 mb-2">账户操作</h3>
            <p className="text-sm text-gray-600 mb-3">
              注销后需要重新输入验证码才能使用应用
            </p>
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              <LogOut size={18} />
              <span>注销账户</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            智能播放系统 · 基于艾宾浩斯遗忘曲线理论
          </p>
        </div>
      </div>
    </div>
  );
};
