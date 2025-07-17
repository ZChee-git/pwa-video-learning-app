// 视频加载问题诊断脚本
// 在浏览器控制台中运行这个脚本来诊断视频加载问题

console.log('开始诊断视频加载问题...');

// 1. 检查本地存储中的数据
const checkLocalStorage = () => {
  console.log('=== 检查本地存储数据 ===');
  
  const videos = JSON.parse(localStorage.getItem('videos') || '[]');
  const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
  const collections = JSON.parse(localStorage.getItem('collections') || '[]');
  
  console.log('存储的视频数量:', videos.length);
  console.log('存储的播放列表数量:', playlists.length);
  console.log('存储的合辑数量:', collections.length);
  
  // 检查视频ID和URL
  videos.forEach((video, index) => {
    console.log(`视频 ${index + 1}:`, {
      id: video.id,
      name: video.name,
      hasFile: !!video.file,
      fileUrl: video.fileUrl,
      collectionId: video.collectionId,
      status: video.status
    });
  });
  
  return { videos, playlists, collections };
};

// 2. 检查播放列表与视频的ID匹配
const checkPlaylistVideoMatching = (videos, playlists) => {
  console.log('=== 检查播放列表与视频ID匹配 ===');
  
  playlists.forEach((playlist, pIndex) => {
    console.log(`播放列表 ${pIndex + 1} (${playlist.date}):`);
    
    playlist.items.forEach((item, iIndex) => {
      const matchingVideo = videos.find(v => v.id === item.videoId);
      console.log(`  项目 ${iIndex + 1}: videoId=${item.videoId}, 匹配=${!!matchingVideo}`);
      
      if (!matchingVideo) {
        console.warn(`    警告: 未找到匹配的视频! videoId=${item.videoId}`);
        
        // 尝试查找相似的ID
        const similarVideos = videos.filter(v => 
          v.id.includes(item.videoId) || item.videoId.includes(v.id)
        );
        if (similarVideos.length > 0) {
          console.log(`    可能的匹配:`, similarVideos.map(v => ({ id: v.id, name: v.name })));
        }
      }
    });
  });
};

// 3. 检查视频文件URL的有效性
const checkVideoUrls = async (videos) => {
  console.log('=== 检查视频文件URL有效性 ===');
  
  for (const video of videos) {
    try {
      if (video.fileUrl) {
        if (video.fileUrl.startsWith('blob:')) {
          console.log(`视频 ${video.name}: 使用blob URL`, video.fileUrl);
          
          // 检查blob URL是否仍然有效
          const response = await fetch(video.fileUrl);
          console.log(`  blob URL状态: ${response.ok ? '有效' : '无效'}`);
        } else {
          console.log(`视频 ${video.name}: 使用其他URL`, video.fileUrl);
        }
      } else {
        console.warn(`视频 ${video.name}: 缺少fileUrl`);
      }
    } catch (error) {
      console.error(`检查视频 ${video.name} URL时出错:`, error);
    }
  }
};

// 4. 修复播放列表ID匹配问题
const fixPlaylistVideoMatching = (videos, playlists) => {
  console.log('=== 尝试修复播放列表ID匹配 ===');
  
  const fixedPlaylists = playlists.map(playlist => {
    const fixedItems = playlist.items.map(item => {
      const matchingVideo = videos.find(v => v.id === item.videoId);
      
      if (!matchingVideo) {
        console.log(`尝试修复项目: videoId=${item.videoId}`);
        
        // 策略1: 按索引匹配
        const videoIndex = parseInt(item.videoId);
        if (!isNaN(videoIndex) && videoIndex >= 0 && videoIndex < videos.length) {
          const newVideoId = videos[videoIndex].id;
          console.log(`  按索引修复: ${item.videoId} -> ${newVideoId}`);
          return { ...item, videoId: newVideoId };
        }
        
        // 策略2: 部分匹配
        const partialMatch = videos.find(v => 
          v.id.includes(item.videoId) || item.videoId.includes(v.id)
        );
        if (partialMatch) {
          console.log(`  部分匹配修复: ${item.videoId} -> ${partialMatch.id}`);
          return { ...item, videoId: partialMatch.id };
        }
        
        // 策略3: 使用第一个可用视频
        if (videos.length > 0) {
          const firstVideo = videos[0];
          console.log(`  使用第一个视频: ${item.videoId} -> ${firstVideo.id}`);
          return { ...item, videoId: firstVideo.id };
        }
      }
      
      return item;
    });
    
    return { ...playlist, items: fixedItems };
  });
  
  return fixedPlaylists;
};

// 5. 重新生成视频文件URL
const regenerateVideoUrls = (videos) => {
  console.log('=== 重新生成视频文件URL ===');
  
  const updatedVideos = videos.map(video => {
    if (video.file && video.file.size > 0) {
      const newFileUrl = URL.createObjectURL(video.file);
      console.log(`重新生成URL: ${video.name} -> ${newFileUrl}`);
      return { ...video, fileUrl: newFileUrl };
    }
    return video;
  });
  
  return updatedVideos;
};

// 主要诊断函数
const diagnoseVideoLoading = async () => {
  try {
    // 检查本地存储
    const { videos, playlists, collections } = checkLocalStorage();
    
    // 检查ID匹配
    checkPlaylistVideoMatching(videos, playlists);
    
    // 检查URL有效性
    await checkVideoUrls(videos);
    
    // 提供修复建议
    console.log('=== 修复建议 ===');
    console.log('1. 如果发现ID不匹配，运行: fixVideoMatching()');
    console.log('2. 如果URL无效，运行: regenerateUrls()');
    console.log('3. 如果问题持续，运行: clearAndReload()');
    
  } catch (error) {
    console.error('诊断过程中出错:', error);
  }
};

// 修复函数
const fixVideoMatching = () => {
  console.log('开始修复视频ID匹配...');
  
  const videos = JSON.parse(localStorage.getItem('videos') || '[]');
  const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
  
  const fixedPlaylists = fixPlaylistVideoMatching(videos, playlists);
  
  localStorage.setItem('playlists', JSON.stringify(fixedPlaylists));
  console.log('修复完成，请刷新页面');
};

const regenerateUrls = () => {
  console.log('开始重新生成视频URL...');
  
  const videos = JSON.parse(localStorage.getItem('videos') || '[]');
  const updatedVideos = regenerateVideoUrls(videos);
  
  localStorage.setItem('videos', JSON.stringify(updatedVideos));
  console.log('URL重新生成完成，请刷新页面');
};

const clearAndReload = () => {
  console.log('清除所有数据并重新加载...');
  
  localStorage.removeItem('videos');
  localStorage.removeItem('playlists');
  localStorage.removeItem('collections');
  
  window.location.reload();
};

// 导出函数到全局作用域
window.diagnoseVideoLoading = diagnoseVideoLoading;
window.fixVideoMatching = fixVideoMatching;
window.regenerateUrls = regenerateUrls;
window.clearAndReload = clearAndReload;

// 自动运行诊断
diagnoseVideoLoading();
