// UUID 生成工具函数，兼容不支持 crypto.randomUUID 的浏览器
export function generateUUID(): string {
  // 首先尝试使用原生的 crypto.randomUUID
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // 如果不支持，则使用兼容的方式
  // 使用 Math.random() 生成 UUID v4 格式
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
