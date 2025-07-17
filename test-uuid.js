// 测试 UUID 生成函数
import { generateUUID } from './src/utils/uuid';

// 测试生成 UUID
console.log('测试 UUID 生成:');
for (let i = 0; i < 5; i++) {
  const uuid = generateUUID();
  console.log(`UUID ${i + 1}: ${uuid}`);
  
  // 验证 UUID 格式 (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  console.log(`格式正确: ${uuidRegex.test(uuid)}`);
}

// 测试 crypto.randomUUID 支持检测
console.log('\n浏览器支持情况:');
console.log('typeof crypto:', typeof crypto);
console.log('crypto.randomUUID 支持:', typeof crypto !== 'undefined' && crypto.randomUUID);
