// 视频加载失败修复脚本
// 这个脚本会尝试多种方法来修复视频加载问题

class VideoLoadingFixer {
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
      
      console.log('加载数据完成:', {
        videos: this.videos.length,
        playlists: this.playlists.length,
        collections: this.collections.length
      });
    } catch (error) {
      console.error('加载数据失败:', error);
    }
  }

  // 保存数据到本地存储
  saveData() {
    try {
      localStorage.setItem('videos', JSON.stringify(this.videos));
      localStorage.setItem('playlists', JSON.stringify(this.playlists));
      localStorage.setItem('collections', JSON.stringify(this.collections));
      console.log('数据保存成功');
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }

  // 诊断问题
  diagnose() {
    console.log('=== 开始诊断视频加载问题 ===');
    
    const issues = [];
    
    // 检查视频数据完整性
    this.videos.forEach((video, index) => {
      const videoIssues = [];
      
      if (!video.id) videoIssues.push('缺少ID');
      if (!video.name) videoIssues.push('缺少名称');
      if (!video.fileUrl) videoIssues.push('缺少文件URL');
      if (!video.file || !video.file.size) videoIssues.push('缺少文件对象');
      
      if (videoIssues.length > 0) {
        issues.push(`视频 ${index + 1} (${video.name || '未知'}): ${videoIssues.join(', ')}`);
      }
    });
    
    // 检查播放列表ID匹配
    this.playlists.forEach((playlist, pIndex) => {
      playlist.items.forEach((item, iIndex) => {
        const matchingVideo = this.videos.find(v => v.id === item.videoId);
        if (!matchingVideo) {
          issues.push(`播放列表 ${pIndex + 1} 项目 ${iIndex + 1}: 找不到视频ID ${item.videoId}`);
        }
      });
    });
    
    // 检查blob URL有效性
    this.videos.forEach((video, index) => {
      if (video.fileUrl && video.fileUrl.startsWith('blob:')) {
        // 这里无法直接检查blob URL有效性，因为它们可能在页面刷新后失效
        issues.push(`视频 ${index + 1} (${video.name}): 使用可能失效的blob URL`);
      }
    });
    
    if (issues.length === 0) {
      console.log('✅ 未发现明显问题');
    } else {
      console.log('❌ 发现以下问题:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    return issues;
  }

  // 修复视频文件URL
  fixVideoUrls() {
    console.log('=== 开始修复视频文件URL ===');
    
    let fixedCount = 0;
    
    this.videos.forEach((video, index) => {
      if (video.file && video.file.size > 0) {
        try {
          // 如果现有URL是blob且可能失效，重新生成
          if (!video.fileUrl || video.fileUrl.startsWith('blob:')) {
            const newFileUrl = URL.createObjectURL(video.file);
            video.fileUrl = newFileUrl;
            fixedCount++;
            console.log(`✅ 修复视频 ${index + 1} (${video.name}): ${newFileUrl}`);
          }
        } catch (error) {
          console.error(`❌ 修复视频 ${index + 1} (${video.name}) 失败:`, error);
        }
      }
    });
    
    console.log(`修复完成，共修复 ${fixedCount} 个视频URL`);
    return fixedCount;
  }

  // 修复播放列表ID匹配
  fixPlaylistMatching() {
    console.log('=== 开始修复播放列表ID匹配 ===');
    
    let fixedCount = 0;
    
    this.playlists.forEach((playlist, pIndex) => {
      playlist.items.forEach((item, iIndex) => {
        const matchingVideo = this.videos.find(v => v.id === item.videoId);
        
        if (!matchingVideo) {
          console.log(`尝试修复播放列表 ${pIndex + 1} 项目 ${iIndex + 1}: videoId=${item.videoId}`);
          
          // 策略1: 数字索引匹配
          const videoIndex = parseInt(item.videoId);
          if (!isNaN(videoIndex) && videoIndex >= 0 && videoIndex < this.videos.length) {
            const newVideoId = this.videos[videoIndex].id;
            item.videoId = newVideoId;
            fixedCount++;
            console.log(`  ✅ 按索引修复: ${item.videoId} -> ${newVideoId}`);
            return;
          }
          
          // 策略2: 部分字符串匹配
          const partialMatch = this.videos.find(v => 
            v.id.includes(item.videoId) || item.videoId.includes(v.id)
          );
          if (partialMatch) {
            item.videoId = partialMatch.id;
            fixedCount++;
            console.log(`  ✅ 部分匹配修复: ${item.videoId} -> ${partialMatch.id}`);
            return;
          }
          
          // 策略3: 名称匹配（如果有类似名称）
          const nameMatch = this.videos.find(v => 
            v.name && item.videoId.includes(v.name.substring(0, 10))
          );
          if (nameMatch) {
            item.videoId = nameMatch.id;
            fixedCount++;
            console.log(`  ✅ 名称匹配修复: ${item.videoId} -> ${nameMatch.id}`);
            return;
          }
          
          // 策略4: 使用第一个可用视频
          if (this.videos.length > 0) {
            const firstVideo = this.videos[0];
            item.videoId = firstVideo.id;
            fixedCount++;
            console.log(`  ⚠️ 使用第一个视频作为备用: ${item.videoId} -> ${firstVideo.id}`);
          }
        }
      });
    });
    
    console.log(`修复完成，共修复 ${fixedCount} 个播放列表项目`);
    return fixedCount;
  }

  // 清理无效数据
  cleanupInvalidData() {
    console.log('=== 开始清理无效数据 ===');
    
    // 清理没有文件的视频
    const originalVideoCount = this.videos.length;
    this.videos = this.videos.filter(video => {
      if (!video.file || !video.file.size) {
        console.log(`清理无效视频: ${video.name || '未知'}`);
        return false;
      }
      return true;
    });
    
    const removedVideoCount = originalVideoCount - this.videos.length;
    console.log(`清理完成，移除 ${removedVideoCount} 个无效视频`);
    
    return removedVideoCount;
  }

  // 生成新的UUID
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // 重新生成所有ID
  regenerateAllIds() {
    console.log('=== 开始重新生成所有ID ===');
    
    // 为每个视频生成新ID，并保持映射关系
    const idMapping = new Map();
    
    this.videos.forEach(video => {
      const oldId = video.id;
      const newId = this.generateUUID();
      video.id = newId;
      idMapping.set(oldId, newId);
      console.log(`视频ID更新: ${oldId} -> ${newId}`);
    });
    
    // 更新播放列表中的videoId
    this.playlists.forEach(playlist => {
      playlist.items.forEach(item => {
        const newId = idMapping.get(item.videoId);
        if (newId) {
          item.videoId = newId;
        }
      });
    });
    
    console.log('ID重新生成完成');
    return idMapping.size;
  }

  // 执行完整修复
  fixAll() {
    console.log('=== 开始执行完整修复 ===');
    
    // 1. 诊断问题
    this.diagnose();
    
    // 2. 清理无效数据
    this.cleanupInvalidData();
    
    // 3. 修复视频URL
    this.fixVideoUrls();
    
    // 4. 修复播放列表匹配
    this.fixPlaylistMatching();
    
    // 5. 保存数据
    this.saveData();
    
    console.log('=== 修复完成 ===');
    console.log('建议刷新页面以应用修复');
    
    return {
      success: true,
      message: '修复完成，请刷新页面'
    };
  }

  // 重置所有数据
  resetAll() {
    console.log('=== 重置所有数据 ===');
    
    if (confirm('确定要清除所有数据吗？这将删除所有视频、播放列表和合辑。')) {
      localStorage.removeItem('videos');
      localStorage.removeItem('playlists');
      localStorage.removeItem('collections');
      
      console.log('所有数据已清除');
      window.location.reload();
    }
  }
}

// 创建修复器实例
const fixer = new VideoLoadingFixer();

// 导出到全局作用域
window.videoFixer = fixer;
window.fixVideoLoading = () => fixer.fixAll();
window.diagnoseVideoLoading = () => fixer.diagnose();
window.resetVideoData = () => fixer.resetAll();

// 提供使用说明
console.log(`
=== 视频加载修复工具 ===

可用命令：
- fixVideoLoading()     : 执行完整修复
- diagnoseVideoLoading(): 诊断问题
- resetVideoData()      : 重置所有数据

或者使用：
- window.videoFixer.fixAll()
- window.videoFixer.diagnose()
- window.videoFixer.fixVideoUrls()
- window.videoFixer.fixPlaylistMatching()
- window.videoFixer.cleanupInvalidData()
- window.videoFixer.regenerateAllIds()
`);

// 自动诊断
fixer.diagnose();
