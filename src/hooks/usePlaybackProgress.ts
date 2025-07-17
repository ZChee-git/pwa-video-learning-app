import { useCallback } from 'react';

interface PlaybackProgress {
  videoId: string;
  playlistId: string;
  currentTime: number;
  duration: number;
  lastWatched: number;
  completed: boolean;
}

export const usePlaybackProgress = () => {
  // 保存播放进度
  const saveProgress = useCallback((
    videoId: string,
    playlistId: string,
    currentTime: number,
    duration: number,
    completed: boolean = false
  ) => {
    try {
      const progressKey = `progress_${playlistId}_${videoId}`;
      const progress: PlaybackProgress = {
        videoId,
        playlistId,
        currentTime,
        duration,
        lastWatched: Date.now(),
        completed
      };
      
      localStorage.setItem(progressKey, JSON.stringify(progress));
      
      // 同时更新全局进度记录
      const globalProgressKey = 'video_progress_list';
      const existingProgress = JSON.parse(localStorage.getItem(globalProgressKey) || '[]');
      
      const existingIndex = existingProgress.findIndex(
        (p: PlaybackProgress) => p.videoId === videoId && p.playlistId === playlistId
      );
      
      if (existingIndex >= 0) {
        existingProgress[existingIndex] = progress;
      } else {
        existingProgress.push(progress);
      }
      
      localStorage.setItem(globalProgressKey, JSON.stringify(existingProgress));
      
      console.log('播放进度已保存:', {
        videoId,
        playlistId,
        currentTime,
        duration,
        percentage: duration > 0 ? (currentTime / duration * 100).toFixed(1) + '%' : '0%',
        completed
      });
      
    } catch (error) {
      console.error('保存播放进度失败:', error);
    }
  }, []);

  // 获取播放进度
  const getProgress = useCallback((videoId: string, playlistId: string): PlaybackProgress | null => {
    try {
      const progressKey = `progress_${playlistId}_${videoId}`;
      const stored = localStorage.getItem(progressKey);
      
      if (stored) {
        const progress = JSON.parse(stored) as PlaybackProgress;
        console.log('获取播放进度:', {
          videoId,
          playlistId,
          currentTime: progress.currentTime,
          duration: progress.duration,
          percentage: progress.duration > 0 ? (progress.currentTime / progress.duration * 100).toFixed(1) + '%' : '0%',
          completed: progress.completed
        });
        return progress;
      }
      
      return null;
    } catch (error) {
      console.error('获取播放进度失败:', error);
      return null;
    }
  }, []);

  // 删除播放进度
  const removeProgress = useCallback((videoId: string, playlistId: string) => {
    try {
      const progressKey = `progress_${playlistId}_${videoId}`;
      localStorage.removeItem(progressKey);
      
      // 同时从全局进度记录中删除
      const globalProgressKey = 'video_progress_list';
      const existingProgress = JSON.parse(localStorage.getItem(globalProgressKey) || '[]');
      
      const filteredProgress = existingProgress.filter(
        (p: PlaybackProgress) => !(p.videoId === videoId && p.playlistId === playlistId)
      );
      
      localStorage.setItem(globalProgressKey, JSON.stringify(filteredProgress));
      
      console.log('播放进度已删除:', { videoId, playlistId });
    } catch (error) {
      console.error('删除播放进度失败:', error);
    }
  }, []);

  // 获取所有播放进度
  const getAllProgress = useCallback((): PlaybackProgress[] => {
    try {
      const globalProgressKey = 'video_progress_list';
      const stored = localStorage.getItem(globalProgressKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('获取所有播放进度失败:', error);
      return [];
    }
  }, []);

  // 清除过期的播放进度（超过30天）
  const cleanupOldProgress = useCallback(() => {
    try {
      const globalProgressKey = 'video_progress_list';
      const existingProgress = JSON.parse(localStorage.getItem(globalProgressKey) || '[]');
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      const recentProgress = existingProgress.filter(
        (p: PlaybackProgress) => p.lastWatched > thirtyDaysAgo
      );
      
      localStorage.setItem(globalProgressKey, JSON.stringify(recentProgress));
      
      // 同时清理单个进度记录
      const allKeys = Object.keys(localStorage);
      const progressKeys = allKeys.filter(key => key.startsWith('progress_'));
      
      progressKeys.forEach(key => {
        try {
          const progress = JSON.parse(localStorage.getItem(key) || '{}');
          if (progress.lastWatched && progress.lastWatched < thirtyDaysAgo) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // 如果解析失败，删除这个键
          localStorage.removeItem(key);
        }
      });
      
      console.log('已清理过期播放进度');
    } catch (error) {
      console.error('清理过期播放进度失败:', error);
    }
  }, []);

  // 判断是否应该显示继续播放提示
  const shouldShowContinuePrompt = useCallback((progress: PlaybackProgress | null): boolean => {
    if (!progress) return false;
    
    // 如果已完成，不显示继续播放提示
    if (progress.completed) return false;
    
    // 如果播放时间小于30秒，不显示继续播放提示
    if (progress.currentTime < 30) return false;
    
    // 如果播放进度超过90%，不显示继续播放提示
    if (progress.duration > 0 && progress.currentTime / progress.duration > 0.9) return false;
    
    return true;
  }, []);

  return {
    saveProgress,
    getProgress,
    removeProgress,
    getAllProgress,
    cleanupOldProgress,
    shouldShowContinuePrompt
  };
};
