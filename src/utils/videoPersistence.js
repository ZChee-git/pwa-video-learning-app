// 视频文件持久化管理器
export const VideoPersistenceManager = {
  // 检测iOS设备
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  },

  // 检测Safari浏览器
  isSafari() {
    return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  },

  // 检测PWA模式
  isPWA() {
    return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  },

  // iOS特定的存储策略
  async storeVideoWithIOSOptimization(videoId, file) {
    // iOS设备使用特殊的存储策略
    if (this.isIOS()) {
      console.log('📱 iOS设备检测到，使用优化存储策略');
      
      // 在PWA模式下使用更积极的缓存策略
      if (this.isPWA()) {
        console.log('📱 PWA模式，启用持久化存储');
        // 请求持久化存储
        if ('storage' in navigator && 'persist' in navigator.storage) {
          try {
            const persistent = await navigator.storage.persist();
            console.log('📱 持久化存储请求结果:', persistent);
          } catch (error) {
            console.warn('📱 持久化存储请求失败:', error);
          }
        }
      }
      
      // iOS Safari的blob URL有特殊限制，需要立即存储
      await this.storeVideoFile(videoId, file);
      
      // 立即创建并验证blob URL
      const blobUrl = await this.createPersistentBlobUrl(videoId);
      if (blobUrl) {
        console.log('📱 iOS优化存储完成:', blobUrl);
        return blobUrl;
      }
    }
    
    // 非iOS设备使用标准流程
    return await this.storeVideoFile(videoId, file);
  },

  // 存储视频文件到IndexedDB
  async storeVideoFile(videoId, file) {
    return new Promise((resolve, reject) => {
      const dbName = 'VideoLearningApp';  // 使用统一的数据库名称
      const dbVersion = 2;  // 升级版本以支持两种存储格式
      
      const request = indexedDB.open(dbName, dbVersion);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['videoFiles'], 'readwrite');
        const store = transaction.objectStore('videoFiles');
        
        // 存储文件信息
        const videoData = {
          id: videoId,
          file: file,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          lastModified: file.lastModified,
          storedAt: Date.now()
        };
        
        const storeRequest = store.put(videoData);
        
        storeRequest.onsuccess = () => {
          console.log(`Video file stored in IndexedDB: ${videoId}`);
          resolve(videoId);
        };
        
        storeRequest.onerror = () => reject(storeRequest.error);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建 files 存储（如果不存在）
        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          filesStore.createIndex('name', 'name', { unique: false });
          filesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // 创建 videoFiles 存储（如果不存在）
        if (!db.objectStoreNames.contains('videoFiles')) {
          const store = db.createObjectStore('videoFiles', { keyPath: 'id' });
          store.createIndex('fileName', 'fileName', { unique: false });
          store.createIndex('storedAt', 'storedAt', { unique: false });
        }
      };
    });
  },

  // 从IndexedDB获取视频文件
  async getVideoFile(videoId) {
    return new Promise((resolve, reject) => {
      const dbName = 'VideoLearningApp';  // 使用统一的数据库名称
      const request = indexedDB.open(dbName, 2);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        
        // 首先尝试从 videoFiles 存储获取
        if (db.objectStoreNames.contains('videoFiles')) {
          const transaction = db.transaction(['videoFiles'], 'readonly');
          const store = transaction.objectStore('videoFiles');
          const getRequest = store.get(videoId);
          
          getRequest.onsuccess = () => {
            if (getRequest.result) {
              console.log(`Video file retrieved from videoFiles: ${videoId}`);
              resolve(getRequest.result);
            } else {
              // 如果在 videoFiles 中找不到，尝试从 files 存储获取
              this.getFromFilesStore(db, videoId).then(resolve).catch(reject);
            }
          };
          
          getRequest.onerror = () => {
            // 如果 videoFiles 存储访问失败，尝试 files 存储
            this.getFromFilesStore(db, videoId).then(resolve).catch(reject);
          };
        } else {
          // 如果 videoFiles 存储不存在，尝试 files 存储
          this.getFromFilesStore(db, videoId).then(resolve).catch(reject);
        }
      };
    });
  },
  
  // 从 files 存储获取数据的辅助方法
  getFromFilesStore(db, videoId) {
    return new Promise((resolve, reject) => {
      if (!db.objectStoreNames.contains('files')) {
        console.warn(`Video file not found in any store: ${videoId}`);
        resolve(null);
        return;
      }
      
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const getRequest = store.get(videoId);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          console.log(`Video file retrieved from files: ${videoId}`);
          // 转换数据格式以匹配 videoFiles 格式
          const fileData = getRequest.result;
          const videoData = {
            id: fileData.id,
            file: new File([fileData.data], fileData.name, { type: fileData.type }),
            fileName: fileData.name,
            fileSize: fileData.size,
            fileType: fileData.type,
            lastModified: fileData.timestamp,
            storedAt: fileData.timestamp
          };
          resolve(videoData);
        } else {
          console.warn(`Video file not found in files store: ${videoId}`);
          resolve(null);
        }
      };
      
      getRequest.onerror = () => {
        console.error(`Error retrieving from files store: ${videoId}`, getRequest.error);
        reject(getRequest.error);
      };
    });
  },

  // 创建持久化的blob URL
  async createPersistentBlobUrl(videoId, file) {
    try {
      // 先存储到IndexedDB
      await this.storeVideoFile(videoId, file);
      
      // 创建blob URL
      const blobUrl = URL.createObjectURL(file);
      
      // 在localStorage中记录blob URL映射
      const blobMappings = JSON.parse(localStorage.getItem('blobMappings') || '{}');
      blobMappings[videoId] = {
        blobUrl: blobUrl,
        createdAt: Date.now(),
        fileName: file.name,
        fileSize: file.size
      };
      localStorage.setItem('blobMappings', JSON.stringify(blobMappings));
      
      console.log(`Persistent blob URL created for ${videoId}: ${blobUrl}`);
      return blobUrl;
    } catch (error) {
      console.error('Error creating persistent blob URL:', error);
      throw error;
    }
  },

  // 恢复失效的blob URL
  async restoreBlobUrl(videoId) {
    try {
      console.log(`Attempting to restore blob URL for: ${videoId}`);
      
      // 从IndexedDB获取文件
      const videoData = await this.getVideoFile(videoId);
      if (!videoData || !videoData.file) {
        console.error(`No file data found for video: ${videoId}`);
        return null;
      }
      
      // 重新创建blob URL
      const newBlobUrl = URL.createObjectURL(videoData.file);
      
      // 更新localStorage中的映射
      const blobMappings = JSON.parse(localStorage.getItem('blobMappings') || '{}');
      if (blobMappings[videoId]) {
        // 清理旧的blob URL
        URL.revokeObjectURL(blobMappings[videoId].blobUrl);
      }
      
      blobMappings[videoId] = {
        blobUrl: newBlobUrl,
        createdAt: Date.now(),
        fileName: videoData.fileName,
        fileSize: videoData.fileSize
      };
      localStorage.setItem('blobMappings', JSON.stringify(blobMappings));
      
      console.log(`Blob URL restored for ${videoId}: ${newBlobUrl}`);
      return newBlobUrl;
    } catch (error) {
      console.error('Error restoring blob URL:', error);
      return null;
    }
  },

  // 验证blob URL是否有效
  async validateBlobUrl(blobUrl) {
    try {
      const response = await fetch(blobUrl, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  // 修复所有视频的blob URL
  async fixAllBlobUrls() {
    try {
      const videos = JSON.parse(localStorage.getItem('videos') || '[]');
      let fixedCount = 0;
      
      for (const video of videos) {
        // 检查blob URL是否有效
        if (video.fileUrl && video.fileUrl.startsWith('blob:')) {
          const isValid = await this.validateBlobUrl(video.fileUrl);
          
          if (!isValid) {
            console.log(`Fixing invalid blob URL for video: ${video.id}`);
            
            // 尝试从IndexedDB恢复
            const newBlobUrl = await this.restoreBlobUrl(video.id);
            if (newBlobUrl) {
              video.fileUrl = newBlobUrl;
              fixedCount++;
            } else {
              console.error(`Failed to restore blob URL for video: ${video.id}`);
            }
          }
        }
      }
      
      if (fixedCount > 0) {
        // 更新localStorage中的视频数据
        localStorage.setItem('videos', JSON.stringify(videos));
        console.log(`Fixed ${fixedCount} blob URLs`);
      }
      
      return { success: true, fixedCount };
    } catch (error) {
      console.error('Error fixing blob URLs:', error);
      return { success: false, error: error.message };
    }
  },

  // 清理过期的blob映射
  cleanupExpiredBlobs() {
    try {
      const blobMappings = JSON.parse(localStorage.getItem('blobMappings') || '{}');
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24小时
      
      let cleanedCount = 0;
      Object.keys(blobMappings).forEach(videoId => {
        const mapping = blobMappings[videoId];
        if (now - mapping.createdAt > maxAge) {
          URL.revokeObjectURL(mapping.blobUrl);
          delete blobMappings[videoId];
          cleanedCount++;
        }
      });
      
      if (cleanedCount > 0) {
        localStorage.setItem('blobMappings', JSON.stringify(blobMappings));
        console.log(`Cleaned up ${cleanedCount} expired blob mappings`);
      }
    } catch (error) {
      console.error('Error cleaning up expired blobs:', error);
    }
  },

  // 获取存储统计信息
  async getStorageStats() {
    try {
      const dbName = 'SmartReviewDB';
      const request = indexedDB.open(dbName, 1);
      
      return new Promise((resolve, reject) => {
        request.onerror = () => reject(request.error);
        
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction(['videoFiles'], 'readonly');
          const store = transaction.objectStore('videoFiles');
          const getAllRequest = store.getAll();
          
          getAllRequest.onsuccess = () => {
            const files = getAllRequest.result;
            const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
            const totalCount = files.length;
            
            resolve({
              totalFiles: totalCount,
              totalSize: totalSize,
              totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
              files: files.map(f => ({
                id: f.id,
                fileName: f.fileName,
                fileSize: f.fileSize,
                storedAt: new Date(f.storedAt)
              }))
            });
          };
          
          getAllRequest.onerror = () => reject(getAllRequest.error);
        };
      });
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { totalFiles: 0, totalSize: 0, totalSizeMB: '0.00', files: [] };
    }
  }
};

// 视频URL管理器
export const VideoUrlManager = {
  // 安全地创建视频URL
  async createVideoUrl(video) {
    try {
      // 如果已经有有效的URL，直接返回
      if (video.fileUrl && video.fileUrl.startsWith('blob:')) {
        const isValid = await VideoPersistenceManager.validateBlobUrl(video.fileUrl);
        if (isValid) {
          return video.fileUrl;
        }
      }
      
      // 如果有文件对象，创建新的blob URL
      if (video.file) {
        const blobUrl = await VideoPersistenceManager.createPersistentBlobUrl(video.id, video.file);
        return blobUrl;
      }
      
      // 尝试从IndexedDB恢复
      const restoredUrl = await VideoPersistenceManager.restoreBlobUrl(video.id);
      if (restoredUrl) {
        return restoredUrl;
      }
      
      throw new Error('Unable to create video URL');
    } catch (error) {
      console.error('Error creating video URL:', error);
      throw error;
    }
  },

  // 批量修复视频URL
  async fixAllVideoUrls() {
    return await VideoPersistenceManager.fixAllBlobUrls();
  },

  // 预加载视频URL
  async preloadVideoUrls() {
    try {
      const videos = JSON.parse(localStorage.getItem('videos') || '[]');
      const promises = videos.map(video => this.createVideoUrl(video));
      
      await Promise.all(promises);
      console.log('All video URLs preloaded successfully');
    } catch (error) {
      console.error('Error preloading video URLs:', error);
    }
  }
};

// 应用启动时的初始化
export const initializeVideoPersistence = () => {
  // 清理过期的blob映射
  VideoPersistenceManager.cleanupExpiredBlobs();
  
  // 预加载视频URL
  VideoUrlManager.preloadVideoUrls();
  
  // iOS特定的页面刷新恢复
  if (VideoPersistenceManager.isIOS()) {
    console.log('📱 iOS设备：启用页面刷新恢复功能');
    initializeIOSRefreshRecovery();
  }
  
  // 每30分钟检查一次blob URL有效性
  setInterval(() => {
    VideoPersistenceManager.fixAllBlobUrls();
  }, 30 * 60 * 1000);
  
  console.log('Video persistence system initialized');
};

// iOS页面刷新恢复系统
const initializeIOSRefreshRecovery = () => {
  // 检测页面是否是刷新后的首次加载
  const isPageRefresh = performance.navigation.type === 1 || 
                       performance.getEntriesByType('navigation')[0]?.type === 'reload';
  
  if (isPageRefresh) {
    console.log('📱 检测到iOS页面刷新，启动恢复程序');
    
    // 延迟执行恢复，确保页面完全加载
    setTimeout(async () => {
      await performIOSRefreshRecovery();
    }, 1000);
  }
  
  // 监听页面可见性变化（从后台切换回来）
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && VideoPersistenceManager.isIOS()) {
      console.log('📱 iOS页面重新可见，检查视频URL状态');
      setTimeout(() => {
        VideoPersistenceManager.fixAllBlobUrls();
      }, 500);
    }
  });
  
  // 监听页面焦点变化
  window.addEventListener('focus', () => {
    if (VideoPersistenceManager.isIOS()) {
      console.log('📱 iOS页面获得焦点，验证视频URL');
      setTimeout(() => {
        VideoPersistenceManager.fixAllBlobUrls();
      }, 300);
    }
  });
};

// 执行iOS刷新恢复
const performIOSRefreshRecovery = async () => {
  try {
    console.log('📱 开始iOS刷新恢复程序...');
    
    // 1. 检查所有视频的blob URL状态
    const videos = JSON.parse(localStorage.getItem('videos') || '[]');
    const blobMappings = JSON.parse(localStorage.getItem('blobMappings') || '{}');
    
    let needsRecovery = false;
    const recoveryTasks = [];
    
    for (const video of videos) {
      if (video.fileUrl && video.fileUrl.startsWith('blob:')) {
        const isValid = await VideoPersistenceManager.validateBlobUrl(video.fileUrl);
        if (!isValid) {
          needsRecovery = true;
          console.log(`📱 发现失效的blob URL: ${video.id}`);
          
          // 添加到恢复任务
          recoveryTasks.push(async () => {
            const newBlobUrl = await VideoPersistenceManager.restoreBlobUrl(video.id);
            if (newBlobUrl) {
              video.fileUrl = newBlobUrl;
              console.log(`📱 恢复成功: ${video.id} -> ${newBlobUrl}`);
            }
          });
        }
      }
    }
    
    // 2. 执行恢复任务
    if (needsRecovery) {
      console.log(`📱 需要恢复 ${recoveryTasks.length} 个视频URL`);
      
      // 显示恢复提示
      showIOSRecoveryNotification();
      
      // 并行执行恢复任务
      await Promise.all(recoveryTasks.map(task => task()));
      
      // 更新视频数据
      localStorage.setItem('videos', JSON.stringify(videos));
      
      // 触发页面更新
      window.dispatchEvent(new CustomEvent('videoDataUpdated', { detail: videos }));
      
      console.log('📱 iOS刷新恢复完成');
      
      // 隐藏恢复提示
      hideIOSRecoveryNotification();
    } else {
      console.log('📱 所有视频URL正常，无需恢复');
    }
    
  } catch (error) {
    console.error('📱 iOS刷新恢复失败:', error);
  }
};

// 显示iOS恢复提示
const showIOSRecoveryNotification = () => {
  const notification = document.createElement('div');
  notification.id = 'ios-recovery-notification';
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: #007AFF;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 8px;
  `;
  
  notification.innerHTML = `
    <div style="
      width: 16px;
      height: 16px;
      border: 2px solid white;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    "></div>
    正在恢复视频文件...
  `;
  
  // 添加旋转动画
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
};

// 隐藏iOS恢复提示
const hideIOSRecoveryNotification = () => {
  const notification = document.getElementById('ios-recovery-notification');
  if (notification) {
    notification.remove();
  }
};

// PWA安装提示（针对iOS用户）
export const showIOSPWAInstallTip = () => {
  if (VideoPersistenceManager.isIOS() && VideoPersistenceManager.isSafari() && !VideoPersistenceManager.isPWA()) {
    const tipShown = localStorage.getItem('iosPWATipShown');
    if (!tipShown) {
      setTimeout(() => {
        const shouldShow = confirm(`📱 iOS用户提示：
        
为了获得更好的使用体验和解决视频加载问题，建议您：

1. 点击 Safari 底部的"分享"按钮
2. 选择"添加到主屏幕"
3. 从主屏幕启动应用

这样可以避免页面刷新导致的视频加载失败问题。

是否现在查看详细说明？`);
        
        if (shouldShow) {
          showIOSPWAInstallGuide();
        }
        
        localStorage.setItem('iosPWATipShown', 'true');
      }, 3000);
    }
  }
};

// 显示iOS PWA安装指南
const showIOSPWAInstallGuide = () => {
  const guide = document.createElement('div');
  guide.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;
  
  guide.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      text-align: center;
    ">
      <h3 style="margin: 0 0 16px 0; color: #007AFF; font-size: 18px;">📱 添加到主屏幕</h3>
      <div style="text-align: left; color: #333; line-height: 1.6; margin-bottom: 20px;">
        <p><strong>步骤1:</strong> 点击 Safari 底部的分享按钮 📤</p>
        <p><strong>步骤2:</strong> 在弹出菜单中选择"添加到主屏幕"</p>
        <p><strong>步骤3:</strong> 点击"添加"确认</p>
        <p><strong>步骤4:</strong> 从主屏幕启动应用</p>
      </div>
      <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; color: #666;">
        ✅ 从主屏幕启动可以避免视频加载失败问题<br>
        ✅ 享受更好的全屏体验<br>
        ✅ 更快的启动速度
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: #007AFF;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
      ">知道了</button>
    </div>
  `;
  
  document.body.appendChild(guide);
};
