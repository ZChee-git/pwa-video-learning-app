// APK 数据持久化增强
class APKDataManager {
  constructor() {
    this.isAPK = this.detectAPKEnvironment();
    this.init();
  }

  detectAPKEnvironment() {
    // 检测是否在 APK 环境中运行
    return window.location.protocol === 'file:' || 
           navigator.userAgent.includes('wv') ||
           window.chrome?.webstore === undefined;
  }

  async init() {
    if (this.isAPK) {
      console.log('APK 环境检测到，启用增强数据持久化');
      this.enableDataBackup();
      this.enablePeriodicSync();
    }
  }

  enableDataBackup() {
    // 定期备份数据到 localStorage
    setInterval(() => {
      this.backupIndexedDBToLocalStorage();
    }, 30000); // 每30秒备份一次
  }

  async backupIndexedDBToLocalStorage() {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const allFiles = await this.getAllFromStore(store);
      
      // 将文件列表备份到 localStorage
      const fileList = allFiles.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        timestamp: file.timestamp
      }));
      
      localStorage.setItem('indexeddb_backup', JSON.stringify(fileList));
      console.log('数据备份完成:', fileList.length, '个文件');
    } catch (error) {
      console.error('备份失败:', error);
    }
  }

  async restoreFromBackup() {
    try {
      const backup = localStorage.getItem('indexeddb_backup');
      if (!backup) return false;
      
      const fileList = JSON.parse(backup);
      const db = await this.openIndexedDB();
      
      // 检查 IndexedDB 中是否还有这些文件
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      
      const missingFiles = [];
      for (const file of fileList) {
        const exists = await this.getFromStore(store, file.id);
        if (!exists) {
          missingFiles.push(file.id);
        }
      }
      
      if (missingFiles.length > 0) {
        console.warn('检测到丢失的文件:', missingFiles);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('恢复检查失败:', error);
      return false;
    }
  }

  enablePeriodicSync() {
    // 应用启动时检查数据完整性
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.checkDataIntegrity();
      }
    });
  }

  async checkDataIntegrity() {
    const videos = JSON.parse(localStorage.getItem('videos') || '[]');
    const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
    
    if (videos.length > 0 || playlists.length > 0) {
      const hasBackup = await this.restoreFromBackup();
      if (!hasBackup) {
        console.warn('数据完整性检查失败，可能需要重新上传文件');
        this.showDataWarning();
      }
    }
  }

  showDataWarning() {
    // 显示数据丢失警告
    if (confirm('检测到部分视频文件可能丢失，是否清除所有数据重新开始？')) {
      this.clearAllData();
      window.location.reload();
    }
  }

  clearAllData() {
    // 清除所有数据
    localStorage.clear();
    indexedDB.deleteDatabase('VideoLearningApp');
  }

  // 辅助方法
  openIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VideoLearningApp', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getAllFromStore(store) {
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  getFromStore(store, key) {
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// 初始化 APK 数据管理器
const apkDataManager = new APKDataManager();

export default apkDataManager;
