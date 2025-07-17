// 数据一致性检查和修复工具
export const DataConsistencyUtils = {
  // 检查播放列表与视频数据的一致性
  checkPlaylistVideoConsistency: (playlist: any[], videos: any[]) => {
    const issues: string[] = [];
    const videoIds = new Set(videos.map(v => v.id));
    
    console.log('DataConsistencyUtils - Checking consistency...');
    console.log('Available video IDs:', Array.from(videoIds));
    
    playlist.forEach((item, index) => {
      if (!videoIds.has(item.videoId)) {
        issues.push(`Playlist item ${index}: videoId "${item.videoId}" not found in videos`);
      }
    });
    
    console.log('DataConsistencyUtils - Issues found:', issues);
    return issues;
  },
  
  // 修复播放列表数据
  repairPlaylistData: (playlist: any[], videos: any[]) => {
    console.log('DataConsistencyUtils - Repairing playlist data...');
    
    const repairedPlaylist = playlist.map((item, index) => {
      const matchingVideo = videos.find(v => v.id === item.videoId);
      
      if (!matchingVideo) {
        console.log(`Repairing item ${index}: videoId "${item.videoId}" -> using video at index ${index}`);
        // 如果找不到匹配的视频，使用索引匹配
        const fallbackVideo = videos[index % videos.length];
        return {
          ...item,
          videoId: fallbackVideo?.id || item.videoId
        };
      }
      
      return item;
    });
    
    console.log('DataConsistencyUtils - Repaired playlist:', repairedPlaylist);
    return repairedPlaylist;
  },
  
  // 验证视频文件完整性
  validateVideoFiles: (videos: any[]) => {
    const issues: string[] = [];
    
    videos.forEach((video, index) => {
      if (!video.id) {
        issues.push(`Video ${index}: Missing ID`);
      }
      if (!video.name) {
        issues.push(`Video ${index}: Missing name`);
      }
      if (!video.fileUrl) {
        issues.push(`Video ${index}: Missing file URL`);
      }
      if (video.fileUrl && !video.fileUrl.startsWith('blob:')) {
        issues.push(`Video ${index}: Invalid file URL format`);
      }
    });
    
    return issues;
  }
};
