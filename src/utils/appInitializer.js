// 应用初始化和数据恢复增强脚本
console.log('🚀 应用初始化脚本启动...');

// 增强的应用初始化
class AppInitializer {
  constructor() {
    this.isInitialized = false;
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  async initialize() {
    console.log('🔄 开始应用初始化...');
    
    try {
      // 1. 检查浏览器兼容性
      await this.checkBrowserCompatibility();
      
      // 2. 初始化IndexedDB
      await this.initializeIndexedDB();
      
      // 3. 恢复视频数据
      await this.recoverVideoData();
      
      // 4. 验证数据完整性
      await this.validateDataIntegrity();
      
      // 5. 初始化Service Worker
      await this.initializeServiceWorker();
      
      console.log('✅ 应用初始化完成');
      this.isInitialized = true;
      
    } catch (error) {
      console.error('❌ 应用初始化失败:', error);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 重试初始化 (${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.initialize(), 1000 * this.retryCount);
      } else {
        this.showInitializationError(error);
      }
    }
  }

  async checkBrowserCompatibility() {
    console.log('🔍 检查浏览器兼容性...');
    
    const required = [
      'indexedDB',
      'localStorage',
      'Blob',
      'URL',
      'FileReader'
    ];
    
    const missing = required.filter(feature => !window[feature]);
    
    if (missing.length > 0) {
      throw new Error(`浏览器不支持: ${missing.join(', ')}`);
    }
    
    console.log('✅ 浏览器兼容性检查通过');
  }

  async initializeIndexedDB() {
    console.log('🗄️ 初始化IndexedDB...');
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VideoLearningApp', 1);
      
      request.onerror = () => {
        reject(new Error('IndexedDB初始化失败'));
      };
      
      request.onsuccess = () => {
        console.log('✅ IndexedDB初始化成功');
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
        console.log('✅ IndexedDB架构更新完成');
      };
    });
  }

  async recoverVideoData() {
    console.log('📹 恢复视频数据...');
    
    try {
      const storedVideos = JSON.parse(localStorage.getItem('videos') || '[]');
      console.log(`发现 ${storedVideos.length} 个视频记录`);
      
      if (storedVideos.length === 0) {
        console.log('ℹ️ 没有视频数据需要恢复');
        return;
      }
      
      // 打开IndexedDB
      const db = await this.initializeIndexedDB();
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      
      // 检查每个视频的文件是否存在
      const recoveredVideos = [];
      
      for (const video of storedVideos) {
        try {
          const fileRequest = store.get(video.id);
          const fileExists = await new Promise((resolve) => {
            fileRequest.onsuccess = () => resolve(fileRequest.result);
            fileRequest.onerror = () => resolve(null);
          });
          
          if (fileExists) {
            // 创建新的blob URL
            const blob = new Blob([fileExists.data], { type: fileExists.type });
            const url = URL.createObjectURL(blob);
            
            recoveredVideos.push({
              ...video,
              fileUrl: url,
              recovered: true
            });
            
            console.log(`✅ 恢复视频: ${video.fileName || video.id}`);
          } else {
            console.log(`⚠️ 文件丢失: ${video.fileName || video.id}`);
            recoveredVideos.push({
              ...video,
              fileUrl: null,
              recovered: false
            });
          }
        } catch (error) {
          console.error(`❌ 恢复视频失败: ${video.fileName || video.id}`, error);
        }
      }
      
      // 更新localStorage
      localStorage.setItem('videos', JSON.stringify(recoveredVideos));
      
      console.log(`✅ 视频数据恢复完成: ${recoveredVideos.filter(v => v.recovered).length}/${recoveredVideos.length}`);
      
    } catch (error) {
      console.error('❌ 视频数据恢复失败:', error);
      throw error;
    }
  }

  async validateDataIntegrity() {
    console.log('🔍 验证数据完整性...');
    
    try {
      const videos = JSON.parse(localStorage.getItem('videos') || '[]');
      const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
      const collections = JSON.parse(localStorage.getItem('collections') || '[]');
      
      console.log(`📊 数据统计: 视频=${videos.length}, 播放列表=${playlists.length}, 收藏=${collections.length}`);
      
      // 检查数据结构
      const corruptedVideos = videos.filter(v => !v.id || !v.fileName);
      if (corruptedVideos.length > 0) {
        console.warn(`⚠️ 发现 ${corruptedVideos.length} 个损坏的视频记录`);
      }
      
      console.log('✅ 数据完整性验证完成');
      
    } catch (error) {
      console.error('❌ 数据完整性验证失败:', error);
      throw error;
    }
  }

  async initializeServiceWorker() {
    console.log('🔧 初始化Service Worker...');
    
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker注册成功:', registration);
      } catch (error) {
        console.warn('⚠️ Service Worker注册失败:', error);
        // Service Worker失败不应该阻止应用启动
      }
    } else {
      console.log('ℹ️ 浏览器不支持Service Worker');
    }
  }

  showInitializationError(error) {
    console.error('❌ 应用初始化最终失败:', error);
    
    // 创建错误提示界面
    const errorDiv = document.createElement('div');
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        color: white;
        font-family: Arial, sans-serif;
      ">
        <div style="
          background: #1f2937;
          padding: 40px;
          border-radius: 10px;
          max-width: 600px;
          text-align: center;
        ">
          <h2 style="color: #ef4444; margin-bottom: 20px;">❌ 应用初始化失败</h2>
          <p style="margin-bottom: 20px;">
            应用无法正常启动。可能的原因：<br>
            • 浏览器存储功能被禁用<br>
            • 网络连接问题<br>
            • 浏览器版本过低<br>
            • 存储空间不足
          </p>
          <div style="margin-bottom: 20px;">
            <button onclick="location.reload()" style="
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
              margin-right: 10px;
            ">🔄 重新加载</button>
            <button onclick="this.clearAppData()" style="
              background: #ef4444;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 5px;
              cursor: pointer;
            ">🗑️ 清除数据</button>
          </div>
          <details style="text-align: left; margin-top: 20px;">
            <summary style="cursor: pointer; color: #9ca3af;">技术详情</summary>
            <pre style="background: #374151; padding: 10px; margin-top: 10px; border-radius: 5px; font-size: 12px; overflow: auto;">
${error.message || error.toString()}
            </pre>
          </details>
        </div>
      </div>
    `;
    
    // 添加清除数据功能
    errorDiv.querySelector('button:last-child').onclick = () => {
      if (confirm('确定要清除所有应用数据吗？这将删除所有视频和播放列表！')) {
        localStorage.clear();
        indexedDB.deleteDatabase('VideoLearningApp');
        location.reload();
      }
    };
    
    document.body.appendChild(errorDiv);
  }
}

// 创建初始化器实例
const appInitializer = new AppInitializer();

// 开始初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => appInitializer.initialize());
} else {
  appInitializer.initialize();
}

console.log('✅ 应用初始化脚本已就绪');
