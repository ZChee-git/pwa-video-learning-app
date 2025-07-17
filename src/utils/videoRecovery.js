// 应用启动时视频恢复脚本
console.log('🔄 视频恢复脚本启动...');

// 检查和恢复视频数据
async function checkVideoRecovery() {
  console.log('🔍 检查视频数据状态...');
  
  try {
    // 检查localStorage中的视频数据
    const storedVideos = JSON.parse(localStorage.getItem('videos') || '[]');
    console.log(`📊 localStorage中发现 ${storedVideos.length} 个视频记录`);
    
    if (storedVideos.length === 0) {
      console.log('❌ 没有找到视频数据，可能需要重新上传');
      return;
    }
    
    // 检查IndexedDB连接
    const dbRequest = indexedDB.open('VideoLearningApp', 1);
    
    dbRequest.onsuccess = function(event) {
      const db = event.target.result;
      console.log('✅ IndexedDB连接成功');
      
      // 检查文件存储
      const transaction = db.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = function() {
        const files = getAllRequest.result;
        console.log(`📁 IndexedDB中发现 ${files.length} 个文件`);
        
        if (files.length === 0) {
          console.log('❌ IndexedDB中没有视频文件，视频将无法播放');
          showRecoveryMessage();
        } else {
          console.log('✅ 视频文件完整，应用正常');
          // 尝试恢复blob URLs
          recoverBlobUrls(files);
        }
      };
    };
    
    dbRequest.onerror = function() {
      console.error('❌ IndexedDB连接失败');
      showRecoveryMessage();
    };
    
  } catch (error) {
    console.error('❌ 检查视频数据时出错:', error);
    showRecoveryMessage();
  }
}

// 恢复blob URLs
function recoverBlobUrls(files) {
  console.log('🔄 正在恢复视频URLs...');
  
  files.forEach(file => {
    try {
      const blob = new Blob([file.data], { type: file.type });
      const url = URL.createObjectURL(blob);
      console.log(`✅ 恢复视频URL: ${file.name}`);
      
      // 这里可以触发应用的重新渲染
      window.dispatchEvent(new CustomEvent('videoUrlRestored', {
        detail: { id: file.id, url: url }
      }));
      
    } catch (error) {
      console.error(`❌ 恢复视频URL失败: ${file.name}`, error);
    }
  });
}

// 显示恢复提示
function showRecoveryMessage() {
  console.log('⚠️ 需要用户干预恢复视频');
  
  // 创建恢复提示界面
  const recoveryDiv = document.createElement('div');
  recoveryDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      color: white;
      font-family: Arial, sans-serif;
    ">
      <div style="
        background: #1f2937;
        padding: 30px;
        border-radius: 10px;
        max-width: 500px;
        text-align: center;
      ">
        <h2 style="color: #f59e0b; margin-bottom: 20px;">📹 视频恢复提示</h2>
        <p style="margin-bottom: 20px;">
          检测到视频数据丢失。这可能是因为：<br>
          • 浏览器清除了存储数据<br>
          • 应用被重新部署<br>
          • 存储权限发生变化
        </p>
        <div style="margin-bottom: 20px;">
          <button onclick="location.reload()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-right: 10px;
          ">🔄 重新加载</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
          ">❌ 关闭</button>
        </div>
        <p style="font-size: 14px; color: #9ca3af;">
          建议：重新上传视频文件以恢复完整功能
        </p>
      </div>
    </div>
  `;
  
  document.body.appendChild(recoveryDiv);
  
  // 5秒后自动关闭
  setTimeout(() => {
    if (recoveryDiv.parentElement) {
      recoveryDiv.remove();
    }
  }, 10000);
}

// 应用加载完成后运行检查
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkVideoRecovery);
} else {
  checkVideoRecovery();
}

// 监听视频URL恢复事件
window.addEventListener('videoUrlRestored', function(event) {
  console.log('✅ 视频URL已恢复:', event.detail);
});

console.log('✅ 视频恢复脚本已就绪');
