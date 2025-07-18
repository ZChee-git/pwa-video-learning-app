// IndexedDB 数据库修复脚本 - 简化版
console.log('🔧 IndexedDB 修复脚本启动...');

// 立即修复数据库问题
(function() {
  'use strict';
  
  // 删除可能损坏的数据库
  function deleteDatabase(dbName) {
    return new Promise((resolve) => {
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      deleteRequest.onsuccess = () => {
        console.log(`✅ 已删除数据库: ${dbName}`);
        resolve();
      };
      deleteRequest.onerror = () => {
        console.warn(`⚠️ 删除数据库失败: ${dbName}`);
        resolve(); // 继续执行，不要因为删除失败而中断
      };
      deleteRequest.onblocked = () => {
        console.warn(`⚠️ 数据库删除被阻止: ${dbName}`);
        setTimeout(() => resolve(), 1000);
      };
    });
  }
  
  // 创建新的数据库结构
  function createDatabase(dbName, version) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);
      
      request.onerror = () => {
        console.error(`❌ 数据库打开失败: ${dbName}`);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        console.log(`✅ 数据库创建成功: ${dbName}`);
        request.result.close();
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log(`🔄 升级数据库: ${dbName}`);
        
        // 创建 files 存储
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          filesStore.createIndex('name', 'name', { unique: false });
          filesStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✅ 创建 files 存储');
        }
        
        // 创建 videoFiles 存储（兼容旧格式）
        if (!db.objectStoreNames.contains('videoFiles')) {
          const videoFilesStore = db.createObjectStore('videoFiles', { keyPath: 'id' });
          videoFilesStore.createIndex('fileName', 'fileName', { unique: false });
          videoFilesStore.createIndex('storedAt', 'storedAt', { unique: false });
          console.log('✅ 创建 videoFiles 存储');
        }
      };
    });
  }
  
  // 主修复函数
  async function fixIndexedDB() {
    try {
      console.log('🔄 开始修复 IndexedDB...');
      
      // 删除可能损坏的数据库
      await deleteDatabase('SmartReviewDB');
      await deleteDatabase('VideoLearningApp');
      
      // 等待删除完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 重新创建统一的数据库
      await createDatabase('VideoLearningApp', 2);
      
      console.log('✅ IndexedDB 修复完成');
      
      // 清理 localStorage 中的损坏数据
      try {
        const keys = ['videos', 'playlists', 'collections'];
        keys.forEach(key => {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              JSON.parse(data);
            } catch (e) {
              console.warn(`⚠️ 清理损坏的 localStorage 数据: ${key}`);
              localStorage.removeItem(key);
            }
          }
        });
      } catch (e) {
        console.warn('⚠️ localStorage 清理失败:', e);
      }
      
    } catch (error) {
      console.error('❌ IndexedDB 修复失败:', error);
    }
  }
  
  // 提供全局调试函数
  window.fixIndexedDB = fixIndexedDB;
  window.clearAllVideoData = async function() {
    console.log('🧹 清理所有视频数据...');
    
    // 清理 localStorage
    ['videos', 'playlists', 'collections', 'indexeddb_backup'].forEach(key => {
      localStorage.removeItem(key);
    });
    
    // 清理 IndexedDB
    await deleteDatabase('SmartReviewDB');
    await deleteDatabase('VideoLearningApp');
    
    console.log('✅ 所有数据已清理');
    window.location.reload();
  };
  
  // 获取存储信息
  window.getStorageInfo = function() {
    const info = {
      localStorage: {},
      indexedDB: 'checking...'
    };
    
    ['videos', 'playlists', 'collections'].forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          info.localStorage[key] = Array.isArray(parsed) ? `${parsed.length} items` : 'object';
        } else {
          info.localStorage[key] = 'empty';
        }
      } catch (e) {
        info.localStorage[key] = 'corrupted';
      }
    });
    
    console.log('📊 存储信息:', info);
    return info;
  };
  
  // 立即执行修复
  fixIndexedDB();
  
})();

console.log('✅ IndexedDB 修复脚本已就绪');
console.log('💡 可用命令: fixIndexedDB(), clearAllVideoData(), getStorageInfo()');
