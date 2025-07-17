// Android兼容性测试文件
import { generateUUID } from './utils/uuid';

// 测试UUID生成
console.log('Testing UUID generation...');
for (let i = 0; i < 5; i++) {
  const uuid = generateUUID();
  console.log(`UUID ${i + 1}:`, uuid);
}

// 测试crypto.randomUUID支持
console.log('crypto.randomUUID support:', typeof crypto !== 'undefined' && crypto.randomUUID);

// 测试IndexedDB支持
console.log('IndexedDB support:', typeof indexedDB !== 'undefined');

// 测试FileReader支持
console.log('FileReader support:', typeof FileReader !== 'undefined');

// 测试URL.createObjectURL支持
console.log('URL.createObjectURL support:', typeof URL !== 'undefined' && URL.createObjectURL);

// 测试平台检测
console.log('Platform info:', {
  userAgent: navigator.userAgent,
  isAndroid: /Android/i.test(navigator.userAgent),
  isChrome: /Chrome/i.test(navigator.userAgent),
  chromeVersion: navigator.userAgent.match(/Chrome\/(\d+)/) ? parseInt((navigator.userAgent.match(/Chrome\/(\d+)/) || [])[1]) : null
});
