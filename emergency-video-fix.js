// 紧急修复脚本：解决"视频加载失败"问题
// 直接在浏览器控制台运行此脚本

console.log('🔧 开始紧急修复视频加载问题...');

// 1. 立即修复当前页面的视频加载问题
function emergencyVideoFix() {
  console.log('执行紧急视频修复...');
  
  // 获取当前数据
  const videos = JSON.parse(localStorage.getItem('videos') || '[]');
  const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
  
  console.log('当前数据状态:', {
    videos: videos.length,
    playlists: playlists.length
  });
  
  // 修复视频文件URL
  let urlFixed = 0;
  videos.forEach((video, index) => {
    if (video.file && video.file.size > 0) {
      if (!video.fileUrl || video.fileUrl.startsWith('blob:')) {
        try {
          // 清除旧的blob URL
          if (video.fileUrl && video.fileUrl.startsWith('blob:')) {
            URL.revokeObjectURL(video.fileUrl);
          }
          
          // 创建新的blob URL
          const newFileUrl = URL.createObjectURL(video.file);
          video.fileUrl = newFileUrl;
          urlFixed++;
          console.log(`✅ 修复视频 ${index + 1}: ${video.name} -> ${newFileUrl}`);
        } catch (error) {
          console.error(`❌ 修复视频 ${index + 1} 失败:`, error);
        }
      }
    } else {
      console.warn(`⚠️ 视频 ${index + 1} 缺少文件对象:`, video.name);
    }
  });
  
  // 修复播放列表ID匹配
  let playlistFixed = 0;
  playlists.forEach((playlist, pIndex) => {
    playlist.items.forEach((item, iIndex) => {
      const matchingVideo = videos.find(v => v.id === item.videoId);
      
      if (!matchingVideo) {
        console.log(`修复播放列表 ${pIndex + 1} 项目 ${iIndex + 1}: ${item.videoId}`);
        
        // 使用索引匹配
        const videoIndex = parseInt(item.videoId);
        if (!isNaN(videoIndex) && videoIndex >= 0 && videoIndex < videos.length) {
          item.videoId = videos[videoIndex].id;
          playlistFixed++;
          console.log(`  ✅ 按索引修复: ${videoIndex} -> ${videos[videoIndex].id}`);
        } else if (videos.length > 0) {
          // 使用第一个视频作为备用
          item.videoId = videos[0].id;
          playlistFixed++;
          console.log(`  ⚠️ 使用备用视频: ${videos[0].id}`);
        }
      }
    });
  });
  
  // 保存修复后的数据
  localStorage.setItem('videos', JSON.stringify(videos));
  localStorage.setItem('playlists', JSON.stringify(playlists));
  
  console.log(`🎉 修复完成！修复了 ${urlFixed} 个视频URL，${playlistFixed} 个播放列表项目`);
  
  return { urlFixed, playlistFixed };
}

// 2. 检查并修复数据一致性
function checkDataConsistency() {
  console.log('🔍 检查数据一致性...');
  
  const videos = JSON.parse(localStorage.getItem('videos') || '[]');
  const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
  
  const issues = [];
  
  // 检查视频数据
  videos.forEach((video, index) => {
    if (!video.id) issues.push(`视频 ${index + 1} 缺少ID`);
    if (!video.name) issues.push(`视频 ${index + 1} 缺少名称`);
    if (!video.fileUrl) issues.push(`视频 ${index + 1} 缺少文件URL`);
    if (!video.file) issues.push(`视频 ${index + 1} 缺少文件对象`);
  });
  
  // 检查播放列表
  playlists.forEach((playlist, pIndex) => {
    playlist.items.forEach((item, iIndex) => {
      const matchingVideo = videos.find(v => v.id === item.videoId);
      if (!matchingVideo) {
        issues.push(`播放列表 ${pIndex + 1} 项目 ${iIndex + 1} 找不到视频 ${item.videoId}`);
      }
    });
  });
  
  if (issues.length === 0) {
    console.log('✅ 数据一致性检查通过');
  } else {
    console.log('❌ 发现问题:');
    issues.forEach(issue => console.log(`  - ${issue}`));
  }
  
  return issues;
}

// 3. 强制重置视频URL
function forceResetVideoUrls() {
  console.log('🔄 强制重置所有视频URL...');
  
  const videos = JSON.parse(localStorage.getItem('videos') || '[]');
  let resetCount = 0;
  
  videos.forEach((video, index) => {
    if (video.file && video.file.size > 0) {
      try {
        // 清除旧URL
        if (video.fileUrl && video.fileUrl.startsWith('blob:')) {
          URL.revokeObjectURL(video.fileUrl);
        }
        
        // 创建新URL
        const newFileUrl = URL.createObjectURL(video.file);
        video.fileUrl = newFileUrl;
        resetCount++;
        console.log(`✅ 重置视频 ${index + 1}: ${video.name}`);
      } catch (error) {
        console.error(`❌ 重置视频 ${index + 1} 失败:`, error);
      }
    }
  });
  
  localStorage.setItem('videos', JSON.stringify(videos));
  console.log(`🎉 重置完成！重置了 ${resetCount} 个视频URL`);
  
  return resetCount;
}

// 4. 快速诊断当前问题
function quickDiagnose() {
  console.log('🩺 快速诊断...');
  
  const videos = JSON.parse(localStorage.getItem('videos') || '[]');
  const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
  
  console.log('数据统计:', {
    '总视频数': videos.length,
    '总播放列表数': playlists.length,
    '有文件的视频数': videos.filter(v => v.file && v.file.size > 0).length,
    '有URL的视频数': videos.filter(v => v.fileUrl).length,
    'blob URL数': videos.filter(v => v.fileUrl && v.fileUrl.startsWith('blob:')).length
  });
  
  // 检查最新的播放列表
  if (playlists.length > 0) {
    const latestPlaylist = playlists[playlists.length - 1];
    console.log('最新播放列表:', {
      日期: latestPlaylist.date,
      项目数: latestPlaylist.items.length,
      项目详情: latestPlaylist.items.map(item => ({
        videoId: item.videoId,
        reviewType: item.reviewType,
        找到匹配视频: !!videos.find(v => v.id === item.videoId)
      }))
    });
  }
  
  return {
    videos: videos.length,
    playlists: playlists.length,
    hasFile: videos.filter(v => v.file && v.file.size > 0).length,
    hasUrl: videos.filter(v => v.fileUrl).length
  };
}

// 5. 一键修复所有问题
function fixAllIssues() {
  console.log('🛠️ 一键修复所有问题...');
  
  // 步骤1：诊断
  console.log('步骤1：诊断问题');
  const diagnosis = quickDiagnose();
  
  // 步骤2：检查一致性
  console.log('步骤2：检查数据一致性');
  const issues = checkDataConsistency();
  
  // 步骤3：执行修复
  console.log('步骤3：执行修复');
  const fixResult = emergencyVideoFix();
  
  // 步骤4：再次检查
  console.log('步骤4：验证修复结果');
  const finalCheck = checkDataConsistency();
  
  const result = {
    diagnosis,
    issues: issues.length,
    fixed: fixResult,
    finalIssues: finalCheck.length
  };
  
  console.log('🎉 修复完成！结果:', result);
  
  if (finalCheck.length === 0) {
    console.log('✅ 所有问题已修复，建议刷新页面');
  } else {
    console.log('⚠️ 仍有问题存在，可能需要手动处理');
  }
  
  return result;
}

// 导出函数到全局作用域
window.emergencyVideoFix = emergencyVideoFix;
window.checkDataConsistency = checkDataConsistency;
window.forceResetVideoUrls = forceResetVideoUrls;
window.quickDiagnose = quickDiagnose;
window.fixAllIssues = fixAllIssues;

// 显示使用说明
console.log(`
🔧 紧急修复工具已就绪！

可用命令：
• fixAllIssues()        - 一键修复所有问题（推荐）
• emergencyVideoFix()   - 紧急修复视频加载
• quickDiagnose()       - 快速诊断当前状态
• checkDataConsistency() - 检查数据一致性
• forceResetVideoUrls() - 强制重置视频URL

建议使用：fixAllIssues()
`);

// 自动执行快速诊断
quickDiagnose();
