import { useState, useEffect } from 'react';
import { nativeStorage } from '../utils/nativeStorage';

/**
 * 增强的存储Hook - 支持原生存储
 */
export function useNativeStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时从原生存储读取
  useEffect(() => {
    async function loadStoredValue() {
      try {
        const item = await nativeStorage.getAppData(key);
        if (item !== null) {
          setStoredValue(item);
        }
      } catch (error) {
        console.error(`读取存储数据失败 "${key}":`, error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadStoredValue();
  }, [key]);

  // 设置值的函数
  const setValue = async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      await nativeStorage.setAppData(key, valueToStore);
    } catch (error) {
      console.error(`保存存储数据失败 "${key}":`, error);
    }
  };

  return [storedValue, setValue, isLoading] as const;
}

// 兼容原有的useLocalStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 在APK中使用原生存储，在Web中使用localStorage
  return useNativeStorage(key, initialValue);
}

// 视频文件管理Hook
export function useVideoFileManager() {
  const saveVideoFile = async (videoId: string, file: File): Promise<string> => {
    try {
      const fileUrl = await nativeStorage.saveVideoFile(videoId, file);
      console.log('✅ 视频文件保存成功:', fileUrl);
      return fileUrl;
    } catch (error) {
      console.error('❌ 视频文件保存失败:', error);
      throw error;
    }
  };

  const getVideoFileUrl = async (videoId: string): Promise<string | null> => {
    try {
      const fileUrl = await nativeStorage.getVideoFileUrl(videoId);
      console.log('✅ 视频文件获取成功:', fileUrl);
      return fileUrl;
    } catch (error) {
      console.error('❌ 视频文件获取失败:', error);
      return null;
    }
  };

  const deleteVideoFile = async (videoId: string): Promise<void> => {
    try {
      await nativeStorage.deleteVideoFile(videoId);
      console.log('✅ 视频文件删除成功:', videoId);
    } catch (error) {
      console.error('❌ 视频文件删除失败:', error);
      throw error;
    }
  };

  const getStorageStats = async () => {
    try {
      const stats = await nativeStorage.getStorageStats();
      console.log('📊 存储统计:', stats);
      return stats;
    } catch (error) {
      console.error('❌ 获取存储统计失败:', error);
      return { totalKeys: 0, videoCount: 0, dataKeys: [] };
    }
  };

  return {
    saveVideoFile,
    getVideoFileUrl,
    deleteVideoFile,
    getStorageStats
  };
}

// 数据序列化函数（保持兼容性）
export const serializeVideoFile = (video: any) => ({
  ...video,
  dateAdded: video.dateAdded.toISOString(),
  firstPlayDate: video.firstPlayDate?.toISOString(),
  nextReviewDate: video.nextReviewDate?.toISOString(),
  fileName: video.file?.name,
  fileType: video.file?.type,
  fileSize: video.file?.size,
  file: null, // 不序列化File对象
});

export const deserializeVideoFile = (video: any) => ({
  ...video,
  dateAdded: new Date(video.dateAdded),
  firstPlayDate: video.firstPlayDate ? new Date(video.firstPlayDate) : undefined,
  nextReviewDate: video.nextReviewDate ? new Date(video.nextReviewDate) : undefined,
});

export const serializeCollection = (collection: any) => ({
  ...collection,
  dateCreated: collection.dateCreated.toISOString(),
});

export const deserializeCollection = (collection: any) => ({
  ...collection,
  dateCreated: new Date(collection.dateCreated),
});

export const serializePlaylist = (playlist: any) => ({
  ...playlist,
  date: playlist.date.toISOString(),
});

export const deserializePlaylist = (playlist: any) => ({
  ...playlist,
  date: new Date(playlist.date),
});

// 原生存储工具函数
export const nativeStorageUtils = {
  async clearAllData() {
    try {
      // 获取所有存储的键
      const stats = await nativeStorage.getStorageStats();
      
      // 删除所有数据
      for (const key of stats.dataKeys) {
        await nativeStorage.removeAppData(key);
      }
      
      console.log('✅ 所有数据已清除');
    } catch (error) {
      console.error('❌ 清除数据失败:', error);
      throw error;
    }
  },

  async exportData() {
    try {
      const stats = await nativeStorage.getStorageStats();
      const exportData: any = {};
      
      for (const key of stats.dataKeys) {
        if (!key.startsWith('video_metadata_')) {
          const data = await nativeStorage.getAppData(key);
          exportData[key] = data;
        }
      }
      
      return exportData;
    } catch (error) {
      console.error('❌ 导出数据失败:', error);
      throw error;
    }
  },

  async importData(data: any) {
    try {
      for (const [key, value] of Object.entries(data)) {
        await nativeStorage.setAppData(key, value);
      }
      console.log('✅ 数据导入成功');
    } catch (error) {
      console.error('❌ 导入数据失败:', error);
      throw error;
    }
  }
};
