// 版本检查脚本 - 用于验证部署状态
console.log('🔍 版本检查脚本启动 - v2.0.2');
console.log('📅 部署时间: 2025-07-18 09:00');

// 检查关键功能
function checkDeploymentStatus() {
  const checks = {
    indexedDBFixer: typeof window.fixIndexedDB === 'function',
    userInterface: document.querySelector('.text-4xl') !== null,
    userAvatar: document.querySelector('.w-6.h-6.bg-blue-100') !== null,
    reactApp: document.getElementById('root') !== null,
    netlifyDeploy: window.location.hostname.includes('netlify.app')
  };
  
  console.log('📊 部署状态检查:', checks);
  
  // 检查版本一致性
  const expectedFeatures = [
    'IndexedDB修复脚本',
    '用户头像显示',
    '智能复习系统标题',
    '蓝色梯度背景'
  ];
  
  console.log('✨ 预期功能:', expectedFeatures);
  
  // 返回检查结果
  return {
    success: Object.values(checks).every(check => check),
    details: checks,
    timestamp: new Date().toISOString()
  };
}

// 立即执行检查
const result = checkDeploymentStatus();
console.log('✅ 检查结果:', result);

// 导出到全局作用域
window.checkDeploymentStatus = checkDeploymentStatus;
window.deploymentVersion = '2.0.2';
window.deploymentTimestamp = '2025-07-18T09:00:00Z';

// 显示部署信息
if (result.success) {
  console.log('🎉 部署验证成功！所有功能正常。');
} else {
  console.warn('⚠️ 部署可能存在问题，请检查缺失的功能。');
}

console.log('💡 可用命令: checkDeploymentStatus()');
