// 一键修复视频加载问题的控制台脚本
// 在浏览器控制台中粘贴并运行此脚本

(function() {
  'use strict';
  
  console.log('🚀 启动一键视频修复工具...');
  
  // 修复器类
  class VideoFixTool {
    constructor() {
      this.videos = [];
      this.playlists = [];
      this.collections = [];
      this.loadData();
    }
    
    // 加载本地存储数据
    loadData() {
      try {
        this.videos = JSON.parse(localStorage.getItem('videos') || '[]');
        this.playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
        this.collections = JSON.parse(localStorage.getItem('collections') || '[]');
        
        console.log('✅ 数据加载完成:', {
          videos: this.videos.length,
          playlists: this.playlists.length,
          collections: this.collections.length
        });
      } catch (error) {
        console.error('❌ 数据加载失败:', error);
      }
    }
    
    // 保存数据
    saveData() {
      try {
        localStorage.setItem('videos', JSON.stringify(this.videos));
        localStorage.setItem('playlists', JSON.stringify(this.playlists));
        localStorage.setItem('collections', JSON.stringify(this.collections));
        console.log('✅ 数据保存成功');
      } catch (error) {
        console.error('❌ 数据保存失败:', error);
      }
    }
    
    // 诊断问题
    diagnose() {
      console.log('🔍 开始诊断...');
      
      const issues = [];
      
      // 检查视频数据
      const videosWithoutFile = this.videos.filter(v => !v.file || !v.file.size);
      const videosWithoutUrl = this.videos.filter(v => !v.fileUrl);
      const videosWithBlobUrl = this.videos.filter(v => v.fileUrl && v.fileUrl.startsWith('blob:'));
      
      if (videosWithoutFile.length > 0) {
        issues.push(`${videosWithoutFile.length} 个视频缺少文件对象`);
      }
      
      if (videosWithoutUrl.length > 0) {
        issues.push(`${videosWithoutUrl.length} 个视频缺少文件URL`);
      }
      
      // 检查播放列表匹配
      let unmatchedItems = 0;
      this.playlists.forEach(playlist => {
        playlist.items.forEach(item => {
          const matchingVideo = this.videos.find(v => v.id === item.videoId);
          if (!matchingVideo) {
            unmatchedItems++;
          }
        });
      });
      
      if (unmatchedItems > 0) {
        issues.push(`${unmatchedItems} 个播放列表项目找不到对应视频`);
      }
      
      console.log('📊 诊断结果:', {
        totalVideos: this.videos.length,
        totalPlaylists: this.playlists.length,
        videosWithFile: this.videos.filter(v => v.file && v.file.size > 0).length,
        videosWithUrl: this.videos.filter(v => v.fileUrl).length,
        videosWithBlobUrl: videosWithBlobUrl.length,
        unmatchedItems,
        issues
      });
      
      return issues;
    }
    
    // 修复视频URL
    fixVideoUrls() {
      console.log('🔧 修复视频URL...');
      
      let fixed = 0;
      this.videos.forEach((video, index) => {
        if (video.file && video.file.size > 0) {
          if (!video.fileUrl || video.fileUrl.startsWith('blob:')) {
            try {
              // 清除旧URL
              if (video.fileUrl && video.fileUrl.startsWith('blob:')) {
                URL.revokeObjectURL(video.fileUrl);
              }
              
              // 创建新URL
              video.fileUrl = URL.createObjectURL(video.file);
              fixed++;
              console.log(`✅ 修复视频 ${index + 1}: ${video.name}`);
            } catch (error) {
              console.error(`❌ 修复视频 ${index + 1} 失败:`, error);
            }
          }
        }
      });
      
      console.log(`🎉 URL修复完成，共修复 ${fixed} 个视频`);
      return fixed;
    }
    
    // 修复播放列表匹配
    fixPlaylistMatching() {
      console.log('🔧 修复播放列表匹配...');
      
      let fixed = 0;
      this.playlists.forEach((playlist, pIndex) => {
        playlist.items.forEach((item, iIndex) => {
          const matchingVideo = this.videos.find(v => v.id === item.videoId);
          
          if (!matchingVideo) {
            console.log(`尝试修复播放列表 ${pIndex + 1} 项目 ${iIndex + 1}: ${item.videoId}`);
            
            // 策略1: 索引匹配
            const videoIndex = parseInt(item.videoId);
            if (!isNaN(videoIndex) && videoIndex >= 0 && videoIndex < this.videos.length) {
              item.videoId = this.videos[videoIndex].id;
              fixed++;
              console.log(`  ✅ 索引匹配: ${videoIndex} -> ${this.videos[videoIndex].id}`);
              return;
            }
            
            // 策略2: 部分匹配
            const partialMatch = this.videos.find(v => 
              v.id.includes(item.videoId) || item.videoId.includes(v.id)
            );
            if (partialMatch) {
              item.videoId = partialMatch.id;
              fixed++;
              console.log(`  ✅ 部分匹配: ${partialMatch.id}`);
              return;
            }
            
            // 策略3: 使用第一个视频
            if (this.videos.length > 0) {
              item.videoId = this.videos[0].id;
              fixed++;
              console.log(`  ⚠️ 使用第一个视频: ${this.videos[0].id}`);
            }
          }
        });
      });
      
      console.log(`🎉 播放列表修复完成，共修复 ${fixed} 个项目`);
      return fixed;
    }
    
    // 一键修复所有问题
    fixAll() {
      console.log('🛠️ 开始一键修复...');
      
      const startTime = Date.now();
      
      // 1. 诊断问题
      const issues = this.diagnose();
      
      if (issues.length === 0) {
        console.log('✅ 未发现问题，无需修复');
        return { success: true, message: '未发现问题' };
      }
      
      // 2. 修复视频URL
      const urlsFixed = this.fixVideoUrls();
      
      // 3. 修复播放列表
      const playlistsFixed = this.fixPlaylistMatching();
      
      // 4. 保存数据
      this.saveData();
      
      // 5. 再次诊断
      const remainingIssues = this.diagnose();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      const result = {
        success: true,
        message: `修复完成！用时 ${duration}ms`,
        details: {
          urlsFixed,
          playlistsFixed,
          issuesFixed: issues.length - remainingIssues.length,
          remainingIssues: remainingIssues.length
        }
      };
      
      console.log('🎉 修复完成!', result);
      
      if (remainingIssues.length === 0) {
        console.log('✅ 所有问题已修复，建议刷新页面');
        
        // 自动刷新页面
        if (confirm('修复完成！是否立即刷新页面以应用修复？')) {
          window.location.reload();
        }
      } else {
        console.log('⚠️ 仍有问题存在:', remainingIssues);
      }
      
      return result;
    }
    
    // 清除所有数据
    reset() {
      if (confirm('确定要清除所有数据吗？这将删除所有视频、播放列表和合辑。')) {
        localStorage.removeItem('videos');
        localStorage.removeItem('playlists');
        localStorage.removeItem('collections');
        console.log('🗑️ 所有数据已清除');
        window.location.reload();
      }
    }
  }
  
  // 创建修复工具实例
  const fixer = new VideoFixTool();
  
  // 导出到全局
  window.videoFixTool = fixer;
  window.fixVideos = () => fixer.fixAll();
  window.diagnoseVideos = () => fixer.diagnose();
  window.resetVideoData = () => fixer.reset();
  
  // 显示使用说明
  console.log(`
🎯 视频修复工具已就绪！

🚀 快速修复：
   fixVideos()           - 一键修复所有问题（推荐）

📊 诊断工具：
   diagnoseVideos()      - 诊断当前问题
   
🛠️ 高级操作：
   videoFixTool.fixVideoUrls()         - 只修复视频URL
   videoFixTool.fixPlaylistMatching()  - 只修复播放列表匹配
   
⚠️ 危险操作：
   resetVideoData()      - 清除所有数据并重置

💡 建议：直接运行 fixVideos() 进行一键修复
  `);
  
  // 自动开始诊断
  setTimeout(() => {
    console.log('🔍 自动诊断开始...');
    const issues = fixer.diagnose();
    
    if (issues.length > 0) {
      console.log('⚠️ 发现问题，建议运行 fixVideos() 进行修复');
      
      // 询问是否立即修复
      if (confirm(`发现 ${issues.length} 个问题:\n${issues.join('\n')}\n\n是否立即修复？`)) {
        fixer.fixAll();
      }
    } else {
      console.log('✅ 未发现问题，系统正常');
    }
  }, 1000);
  
})();

// 显示加载完成信息
console.log('🎉 视频修复工具加载完成！运行 fixVideos() 开始修复');
