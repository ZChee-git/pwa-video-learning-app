// 视频加载修复工具
import { VideoFile, DailyPlaylist } from '../types';

export class VideoLoadFixer {
  private static instance: VideoLoadFixer;
  
  public static getInstance(): VideoLoadFixer {
    if (!VideoLoadFixer.instance) {
      VideoLoadFixer.instance = new VideoLoadFixer();
    }
    return VideoLoadFixer.instance;
  }

  // 诊断视频加载问题
  public diagnoseIssues(): {
    videos: VideoFile[];
    playlists: DailyPlaylist[];
    issues: string[];
    canAutoFix: boolean;
  } {
    console.log('🔍 开始诊断视频加载问题...');
    
    const videos = this.getVideosFromStorage();
    const playlists = this.getPlaylistsFromStorage();
    const issues: string[] = [];
    
    // 检查视频数据完整性
    const videosWithoutFile = videos.filter(v => !v.file || !v.file.size);
    const videosWithoutUrl = videos.filter(v => !v.fileUrl);
    
    if (videosWithoutFile.length > 0) {
      issues.push(`${videosWithoutFile.length} 个视频缺少文件对象`);
    }
    
    if (videosWithoutUrl.length > 0) {
      issues.push(`${videosWithoutUrl.length} 个视频缺少文件URL`);
    }
    
    // 检查播放列表匹配
    let unmatchedItems = 0;
    playlists.forEach(playlist => {
      playlist.items.forEach(item => {
        const matchingVideo = videos.find(v => v.id === item.videoId);
        if (!matchingVideo) {
          unmatchedItems++;
        }
      });
    });
    
    if (unmatchedItems > 0) {
      issues.push(`${unmatchedItems} 个播放列表项目找不到对应视频`);
    }
    
    console.log('诊断完成，发现问题:', issues);
    
    return {
      videos,
      playlists,
      issues,
      canAutoFix: issues.length > 0 && videos.length > 0
    };
  }

  // 修复视频URL
  public fixVideoUrls(): number {
    console.log('🔧 开始修复视频URL...');
    
    const videos = this.getVideosFromStorage();
    let fixedCount = 0;
    
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
            fixedCount++;
            console.log(`✅ 修复视频 ${index + 1}: ${video.name}`);
          } catch (error) {
            console.error(`❌ 修复视频 ${index + 1} 失败:`, error);
          }
        }
      }
    });
    
    this.saveVideosToStorage(videos);
    console.log(`修复完成，共修复 ${fixedCount} 个视频URL`);
    
    return fixedCount;
  }

  // 修复播放列表ID匹配
  public fixPlaylistMatching(): number {
    console.log('🔧 开始修复播放列表ID匹配...');
    
    const videos = this.getVideosFromStorage();
    const playlists = this.getPlaylistsFromStorage();
    let fixedCount = 0;
    
    playlists.forEach((playlist, pIndex) => {
      playlist.items.forEach((item, iIndex) => {
        const matchingVideo = videos.find(v => v.id === item.videoId);
        
        if (!matchingVideo) {
          console.log(`修复播放列表 ${pIndex + 1} 项目 ${iIndex + 1}: ${item.videoId}`);
          
          // 策略1: 数字索引匹配
          const videoIndex = parseInt(item.videoId);
          if (!isNaN(videoIndex) && videoIndex >= 0 && videoIndex < videos.length) {
            item.videoId = videos[videoIndex].id;
            fixedCount++;
            console.log(`  ✅ 按索引修复: ${videoIndex} -> ${videos[videoIndex].id}`);
            return;
          }
          
          // 策略2: 部分字符串匹配
          const partialMatch = videos.find(v => 
            v.id.includes(item.videoId) || item.videoId.includes(v.id)
          );
          if (partialMatch) {
            item.videoId = partialMatch.id;
            fixedCount++;
            console.log(`  ✅ 部分匹配修复: ${item.videoId} -> ${partialMatch.id}`);
            return;
          }
          
          // 策略3: 使用第一个可用视频
          if (videos.length > 0) {
            item.videoId = videos[0].id;
            fixedCount++;
            console.log(`  ⚠️ 使用第一个视频作为备用: ${videos[0].id}`);
          }
        }
      });
    });
    
    this.savePlaylistsToStorage(playlists);
    console.log(`修复完成，共修复 ${fixedCount} 个播放列表项目`);
    
    return fixedCount;
  }

  // 一键修复所有问题
  public async fixAllIssues(): Promise<{
    success: boolean;
    message: string;
    details: {
      urlsFixed: number;
      playlistsFixed: number;
      issuesRemaining: number;
    };
  }> {
    console.log('🛠️ 开始一键修复所有问题...');
    
    try {
      // 1. 修复视频URL
      const urlsFixed = this.fixVideoUrls();
      
      // 2. 修复播放列表匹配
      const playlistsFixed = this.fixPlaylistMatching();
      
      // 3. 再次检查问题
      const finalDiagnosis = this.diagnoseIssues();
      const issuesRemaining = finalDiagnosis.issues.length;
      
      const result = {
        success: true,
        message: `修复完成！修复了 ${urlsFixed} 个视频URL，${playlistsFixed} 个播放列表项目`,
        details: {
          urlsFixed,
          playlistsFixed,
          issuesRemaining
        }
      };
      
      console.log('🎉 修复完成！', result);
      
      return result;
      
    } catch (error) {
      console.error('修复过程中出错:', error);
      return {
        success: false,
        message: '修复过程中出现错误，请重试',
        details: {
          urlsFixed: 0,
          playlistsFixed: 0,
          issuesRemaining: 0
        }
      };
    }
  }

  // 获取本地存储中的视频数据
  private getVideosFromStorage(): VideoFile[] {
    try {
      const stored = localStorage.getItem('videos');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取视频数据失败:', error);
      return [];
    }
  }

  // 获取本地存储中的播放列表数据
  private getPlaylistsFromStorage(): DailyPlaylist[] {
    try {
      const stored = localStorage.getItem('playlists');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取播放列表数据失败:', error);
      return [];
    }
  }

  // 保存视频数据到本地存储
  private saveVideosToStorage(videos: VideoFile[]): void {
    try {
      localStorage.setItem('videos', JSON.stringify(videos));
    } catch (error) {
      console.error('保存视频数据失败:', error);
    }
  }

  // 保存播放列表数据到本地存储
  private savePlaylistsToStorage(playlists: DailyPlaylist[]): void {
    try {
      localStorage.setItem('playlists', JSON.stringify(playlists));
    } catch (error) {
      console.error('保存播放列表数据失败:', error);
    }
  }

  // 清理无效数据
  public cleanupInvalidData(): number {
    console.log('🧹 开始清理无效数据...');
    
    const videos = this.getVideosFromStorage();
    const originalCount = videos.length;
    
    const validVideos = videos.filter(video => {
      if (!video.file || !video.file.size) {
        console.log(`清理无效视频: ${video.name || '未知'}`);
        return false;
      }
      return true;
    });
    
    this.saveVideosToStorage(validVideos);
    
    const removedCount = originalCount - validVideos.length;
    console.log(`清理完成，移除 ${removedCount} 个无效视频`);
    
    return removedCount;
  }
}

// 导出单例实例
export const videoLoadFixer = VideoLoadFixer.getInstance();
