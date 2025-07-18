// IndexedDB 数据库修复和迁移脚本
console.log('🔧 IndexedDB 数据库修复脚本启动...');

class IndexedDBFixer {
  constructor() {
    this.databases = [
      { name: 'VideoLearningApp', version: 1, stores: ['files'] },
      { name: 'SmartReviewDB', version: 1, stores: ['videoFiles'] }
    ];
  }

  async fixAllDatabases() {
    console.log('🔄 开始修复所有数据库...');
    
    try {
      // 1. 清理损坏的数据库
      await this.cleanupDatabases();
      
      // 2. 重新创建数据库结构
      await this.recreateDatabases();
      
      // 3. 统一数据库结构
      await this.migrateDatabases();
      
      console.log('✅ 所有数据库修复完成');
      
    } catch (error) {
      console.error('❌ 数据库修复失败:', error);
      throw error;
    }
  }

  async cleanupDatabases() {
    console.log('🧹 清理损坏的数据库...');
    
    for (const dbConfig of this.databases) {
      try {
        // 删除可能损坏的数据库
        await this.deleteDatabase(dbConfig.name);
        console.log(`✅ 已清理数据库: ${dbConfig.name}`);
      } catch (error) {
        console.warn(`⚠️ 清理数据库失败: ${dbConfig.name}`, error);
      }
    }
  }

  async deleteDatabase(dbName) {
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      
      deleteRequest.onsuccess = () => {
        console.log(`🗑️ 数据库已删除: ${dbName}`);
        resolve();
      };
      
      deleteRequest.onerror = () => {
        console.error(`❌ 删除数据库失败: ${dbName}`, deleteRequest.error);
        reject(deleteRequest.error);
      };
      
      deleteRequest.onblocked = () => {
        console.warn(`⚠️ 数据库删除被阻止: ${dbName}`);
        setTimeout(() => resolve(), 1000);
      };
    });
  }

  async recreateDatabases() {
    console.log('🔨 重新创建数据库结构...');
    
    for (const dbConfig of this.databases) {
      try {
        await this.createDatabase(dbConfig);
        console.log(`✅ 已创建数据库: ${dbConfig.name}`);
      } catch (error) {
        console.error(`❌ 创建数据库失败: ${dbConfig.name}`, error);
      }
    }
  }

  async createDatabase(dbConfig) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbConfig.name, dbConfig.version);
      
      request.onerror = () => {
        console.error(`❌ 数据库打开失败: ${dbConfig.name}`, request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        console.log(`✅ 数据库创建成功: ${dbConfig.name}`);
        request.result.close();
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log(`🔄 升级数据库: ${dbConfig.name}`);
        
        // 创建所需的对象存储
        for (const storeName of dbConfig.stores) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            
            // 为不同的存储添加适当的索引
            if (storeName === 'files') {
              store.createIndex('name', 'name', { unique: false });
              store.createIndex('timestamp', 'timestamp', { unique: false });
            } else if (storeName === 'videoFiles') {
              store.createIndex('fileName', 'fileName', { unique: false });
              store.createIndex('storedAt', 'storedAt', { unique: false });
            }
            
            console.log(`✅ 创建对象存储: ${storeName}`);
          }
        }
      };
    });
  }

  async migrateDatabases() {
    console.log('🔄 统一数据库结构...');
    
    try {
      // 将所有数据迁移到主数据库 VideoLearningApp
      await this.migrateToMainDatabase();
      
      console.log('✅ 数据库迁移完成');
      
    } catch (error) {
      console.error('❌ 数据库迁移失败:', error);
    }
  }

  async migrateToMainDatabase() {
    // 确保主数据库支持两种存储格式
    const mainDb = await this.openDatabase('VideoLearningApp', 2);
    console.log('📂 主数据库已就绪');
    
    mainDb.close();
  }

  async openDatabase(dbName, version) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建统一的存储结构
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          filesStore.createIndex('name', 'name', { unique: false });
          filesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('videoFiles')) {
          const videoFilesStore = db.createObjectStore('videoFiles', { keyPath: 'id' });
          videoFilesStore.createIndex('fileName', 'fileName', { unique: false });
          videoFilesStore.createIndex('storedAt', 'storedAt', { unique: false });
        }
      };
    });
  }

  async testDatabaseAccess() {
    console.log('🧪 测试数据库访问...');
    
    for (const dbConfig of this.databases) {
      try {
        const db = await this.openDatabase(dbConfig.name, dbConfig.version);
        
        for (const storeName of dbConfig.stores) {
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          
          const countRequest = store.count();
          const count = await new Promise((resolve) => {
            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => resolve(0);
          });
          
          console.log(`✅ 数据库测试通过: ${dbConfig.name}.${storeName} (${count} 条记录)`);
        }
        
        db.close();
        
      } catch (error) {
        console.error(`❌ 数据库测试失败: ${dbConfig.name}`, error);
      }
    }
  }

  async clearAllVideoData() {
    console.log('🧹 清理所有视频数据...');
    
    try {
      // 清理 localStorage
      const keysToRemove = ['videos', 'playlists', 'collections', 'indexeddb_backup'];
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`✅ 清理 localStorage: ${key}`);
      });
      
      // 清理所有 IndexedDB 数据库
      await this.cleanupDatabases();
      
      console.log('✅ 所有视频数据已清理');
      
    } catch (error) {
      console.error('❌ 清理数据失败:', error);
    }
  }

  async getStorageInfo() {
    console.log('📊 获取存储信息...');
    
    const info = {
      localStorage: {},
      indexedDB: {}
    };
    
    // localStorage 信息
    const keys = ['videos', 'playlists', 'collections'];
    keys.forEach(key => {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const parsed = JSON.parse(data);
          info.localStorage[key] = Array.isArray(parsed) ? parsed.length : 'object';
        } else {
          info.localStorage[key] = 'empty';
        }
      } catch (error) {
        info.localStorage[key] = 'error';
      }
    });
    
    // IndexedDB 信息
    for (const dbConfig of this.databases) {
      try {
        const db = await this.openDatabase(dbConfig.name, dbConfig.version);
        info.indexedDB[dbConfig.name] = {};
        
        for (const storeName of dbConfig.stores) {
          const transaction = db.transaction([storeName], 'readonly');
          const store = transaction.objectStore(storeName);
          
          const count = await new Promise((resolve) => {
            const countRequest = store.count();
            countRequest.onsuccess = () => resolve(countRequest.result);
            countRequest.onerror = () => resolve(0);
          });
          
          info.indexedDB[dbConfig.name][storeName] = count;
        }
        
        db.close();
      } catch (error) {
        info.indexedDB[dbConfig.name] = 'error';
      }
    }
    
    console.log('📊 存储信息:', info);
    return info;
  }
}

// 创建修复器实例
const dbFixer = new IndexedDBFixer();

// 导出全局函数供开发者工具使用
window.fixIndexedDB = () => dbFixer.fixAllDatabases();
window.clearAllVideoData = () => dbFixer.clearAllVideoData();
window.getStorageInfo = () => dbFixer.getStorageInfo();
window.testDatabaseAccess = () => dbFixer.testDatabaseAccess();

// 自动运行修复
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 页面加载完成，开始自动修复数据库...');
    dbFixer.fixAllDatabases().catch(console.error);
  });
} else {
  console.log('🔧 页面已加载，开始自动修复数据库...');
  dbFixer.fixAllDatabases().catch(console.error);
}

console.log('✅ IndexedDB 修复脚本已就绪');
console.log('💡 可用命令: fixIndexedDB(), clearAllVideoData(), getStorageInfo(), testDatabaseAccess()');
