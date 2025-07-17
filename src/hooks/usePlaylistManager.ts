import { useState, useEffect } from 'react';
import { VideoFile, DailyPlaylist, PlaylistItem, LearningStats, PlaylistPreview, Collection } from '../types';
import { 
  useLocalStorage, 
  serializeVideoFile, 
  deserializeVideoFile,
  serializeCollection,
  deserializeCollection,
  serializePlaylist,
  deserializePlaylist,
  fileStorage
} from './useLocalStorage';
import { generateUUID } from '../utils/uuid';

export const usePlaylistManager = () => {
  // 使用本地存储
  const [storedVideos, setStoredVideos] = useLocalStorage<any[]>('videos', []);
  const [storedPlaylists, setStoredPlaylists] = useLocalStorage<any[]>('playlists', []);
  const [storedCollections, setStoredCollections] = useLocalStorage<any[]>('collections', []);

  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [playlists, setPlaylists] = useState<DailyPlaylist[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 艾宾浩斯复习间隔：第2、4、7、15、30、90天
  const REVIEW_INTERVALS = [2, 4, 7, 15, 30, 90];
  const MAX_NEW_PER_DAY = 4; // 每日新学习数量改为4集
  const MAX_REVIEW_PER_DAY = 6; // 每日最大复习数量

  // 初始化数据
  useEffect(() => {
    const initializeData = async () => {
      try {
        // 初始化文件存储
        await fileStorage.init();
        
        // 恢复合辑数据
        const restoredCollections = storedCollections.map(deserializeCollection);
        setCollections(restoredCollections);

        // 恢复播放列表数据
        const restoredPlaylists = storedPlaylists.map(deserializePlaylist);
        setPlaylists(restoredPlaylists);

        // 恢复视频数据
        const restoredVideos = await Promise.all(
          storedVideos.map(async (video) => {
            const restored = deserializeVideoFile(video);
            // 从 IndexedDB 恢复文件URL
            try {
              const fileUrl = await fileStorage.getFile(video.id);
              if (fileUrl) {
                restored.fileUrl = fileUrl;
              }
            } catch (error) {
              console.error('Error restoring file for video:', video.id, error);
            }
            return restored;
          })
        );
        setVideos(restoredVideos);
      } catch (error) {
        console.error('Error initializing data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // 保存数据到本地存储
  useEffect(() => {
    if (!isLoading) {
      const serializedVideos = videos.map(serializeVideoFile);
      setStoredVideos(serializedVideos);
    }
  }, [videos, setStoredVideos, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      const serializedPlaylists = playlists.map(serializePlaylist);
      setStoredPlaylists(serializedPlaylists);
    }
  }, [playlists, setStoredPlaylists, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      const serializedCollections = collections.map(serializeCollection);
      setStoredCollections(serializedCollections);
    }
  }, [collections, setStoredCollections, isLoading]);

  // 生成随机颜色
  const generateRandomColor = () => {
    const colors = [
      '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
      '#EF4444', '#06B6D4', '#84CC16', '#F97316'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const createCollection = (name: string, description?: string) => {
    try {
      console.log('usePlaylistManager: Creating collection:', name, description);
      
      const newCollection: Collection = {
        id: generateUUID(),
        name,
        description,
        dateCreated: new Date(),
        isActive: true,
        totalVideos: 0,
        completedVideos: 0,
        color: generateRandomColor(),
      };
      
      console.log('usePlaylistManager: New collection object:', newCollection);
      setCollections(prev => {
        const updated = [...prev, newCollection];
        console.log('usePlaylistManager: Updated collections:', updated);
        return updated;
      });
      
      return newCollection;
    } catch (error) {
      console.error('usePlaylistManager: Error creating collection:', error);
      throw new Error(`创建合辑失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const updateCollection = (collectionId: string, name: string, description?: string) => {
    try {
      console.log('usePlaylistManager: Updating collection:', collectionId, name, description);
      
      setCollections(prev => {
        const updated = prev.map(collection => 
          collection.id === collectionId 
            ? { ...collection, name, description }
            : collection
        );
        console.log('usePlaylistManager: Updated collections:', updated);
        return updated;
      });
    } catch (error) {
      console.error('usePlaylistManager: Error updating collection:', error);
      throw new Error(`更新合辑失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const deleteCollection = async (collectionId: string) => {
    // 删除合辑中的所有视频文件
    const collectionVideos = videos.filter(v => v.collectionId === collectionId);
    
    // 清理文件存储
    await Promise.all(
      collectionVideos.map(async (video) => {
        try {
          if (video.fileUrl) {
            URL.revokeObjectURL(video.fileUrl);
          }
          await fileStorage.deleteFile(video.id);
        } catch (error) {
          console.error('Error deleting file for video:', video.id, error);
        }
      })
    );
    
    setVideos(prev => prev.filter(v => v.collectionId !== collectionId));
    setCollections(prev => prev.filter(c => c.id !== collectionId));
  };

  const toggleCollection = (collectionId: string) => {
    setCollections(prev => prev.map(collection => 
      collection.id === collectionId 
        ? { ...collection, isActive: !collection.isActive }
        : collection
    ));
  };

  const addVideos = async (files: File[], collectionId: string) => {
    const newVideos: VideoFile[] = await Promise.all(
      files.map(async (file, index) => {
        const id = generateUUID();
        
        try {
          // 保存文件到 IndexedDB 并获取 URL
          const fileUrl = await fileStorage.saveFile(id, file);
          
          return {
            id,
            name: file.name.replace(/\.[^/.]+$/, ""),
            file,
            fileUrl,
            dateAdded: new Date(),
            reviewCount: 0,
            status: 'new' as const,
            collectionId,
            episodeNumber: index + 1,
          };
        } catch (error) {
          console.error('Error saving file:', file.name, error);
          // 如果保存失败，使用临时 URL
          return {
            id,
            name: file.name.replace(/\.[^/.]+$/, ""),
            file,
            fileUrl: URL.createObjectURL(file),
            dateAdded: new Date(),
            reviewCount: 0,
            status: 'new' as const,
            collectionId,
            episodeNumber: index + 1,
          };
        }
      })
    );

    setVideos(prev => [...prev, ...newVideos]);
    
    // 更新合辑统计
    setCollections(prev => prev.map(collection => 
      collection.id === collectionId 
        ? { 
            ...collection, 
            totalVideos: collection.totalVideos + newVideos.length 
          }
        : collection
    ));

    return newVideos.map(v => v.id);
  };

  const markVideoAsPlayed = (videoId: string) => {
    setVideos(prev => prev.map(video => {
      if (video.id === videoId) {
        const now = new Date();
        if (!video.firstPlayDate) {
          // 第一次播放
          const nextReviewDate = new Date(now);
          nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS[0]);
          
          return {
            ...video,
            firstPlayDate: now,
            reviewCount: 1,
            nextReviewDate,
            status: 'learning' as const,
          };
        } else {
          // 复习
          const newReviewCount = video.reviewCount + 1;
          let nextReviewDate: Date | undefined;
          let status: VideoFile['status'] = 'learning';

          if (newReviewCount < 5) {
            nextReviewDate = new Date(now);
            nextReviewDate.setDate(nextReviewDate.getDate() + REVIEW_INTERVALS[newReviewCount - 1]);
          } else {
            status = 'completed';
            // 更新合辑完成数
            setCollections(prev => prev.map(collection => 
              collection.id === video.collectionId 
                ? { ...collection, completedVideos: collection.completedVideos + 1 }
                : collection
            ));
          }

          return {
            ...video,
            reviewCount: newReviewCount,
            nextReviewDate,
            status,
          };
        }
      }
      return video;
    }));
  };

  // 计算距离第一次观看的天数
  const getDaysSinceFirstPlay = (firstPlayDate: Date): number => {
    const today = new Date();
    const diffTime = today.getTime() - firstPlayDate.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  // 获取今日新学列表
  const getTodayNewVideos = (isExtraSession: boolean = false): PlaylistItem[] => {
    const activeCollectionIds = collections.filter(c => c.isActive).map(c => c.id);
    const activeVideos = videos.filter(v => activeCollectionIds.includes(v.collectionId));
    
    let newVideos: VideoFile[] = [];
    if (isExtraSession) {
      newVideos = activeVideos.filter(v => v.status === 'new').slice(0, MAX_NEW_PER_DAY + 2);
    } else {
      newVideos = activeVideos.filter(v => v.status === 'new').slice(0, MAX_NEW_PER_DAY);
    }

    return newVideos.map(video => ({
      videoId: video.id,
      reviewType: 'new',
      reviewNumber: 1,
    }));
  };

  // 获取今日音频复习列表（包含所有1-5次复习）
  const getTodayAudioReviews = (): PlaylistItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeCollectionIds = collections.filter(c => c.isActive).map(c => c.id);
    const activeVideos = videos.filter(v => activeCollectionIds.includes(v.collectionId));

    const reviewVideos = activeVideos.filter(video => {
      if (!video.nextReviewDate || video.status === 'completed') return false;
      const reviewDate = new Date(video.nextReviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      return reviewDate.getTime() <= today.getTime();
    });

    // 按复习次数排序，优先处理逾期时间长的
    reviewVideos.sort((a, b) => {
      if (!a.nextReviewDate || !b.nextReviewDate) return 0;
      return a.nextReviewDate.getTime() - b.nextReviewDate.getTime();
    });

    return reviewVideos.map(video => ({
      videoId: video.id,
      reviewType: 'audio',
      reviewNumber: video.reviewCount + 1,
      daysSinceFirstPlay: video.firstPlayDate ? getDaysSinceFirstPlay(video.firstPlayDate) : 0,
      isRecommendedForVideo: video.reviewCount >= 3, // 第4、5次复习建议观看视频
    }));
  };

  // 获取今日视频复习列表（只包含第4、5次复习）
  const getTodayVideoReviews = (): PlaylistItem[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeCollectionIds = collections.filter(c => c.isActive).map(c => c.id);
    const activeVideos = videos.filter(v => activeCollectionIds.includes(v.collectionId));

    const reviewVideos = activeVideos.filter(video => {
      if (!video.nextReviewDate || video.status === 'completed') return false;
      const reviewDate = new Date(video.nextReviewDate);
      reviewDate.setHours(0, 0, 0, 0);
      // 只包含第4、5次复习（reviewCount >= 3）
      return reviewDate.getTime() <= today.getTime() && video.reviewCount >= 3;
    });

    return reviewVideos.map(video => ({
      videoId: video.id,
      reviewType: 'video',
      reviewNumber: video.reviewCount + 1,
      daysSinceFirstPlay: video.firstPlayDate ? getDaysSinceFirstPlay(video.firstPlayDate) : 0,
      isRecommendedForVideo: true,
    }));
  };

  const generateTodayPlaylist = (isExtraSession: boolean = false): PlaylistPreview => {
    const newVideos = getTodayNewVideos(isExtraSession);
    const audioReviews = getTodayAudioReviews();
    const videoReviews = getTodayVideoReviews();

    return {
      newVideos,
      audioReviews,
      videoReviews,
      totalCount: newVideos.length + audioReviews.length + videoReviews.length,
      isExtraSession,
    };
  };

  const createTodayPlaylist = (playlistType: 'new' | 'audio' | 'video', isExtraSession: boolean = false): DailyPlaylist => {
    let items: PlaylistItem[] = [];
    
    switch (playlistType) {
      case 'new':
        items = getTodayNewVideos(isExtraSession);
        break;
      case 'audio':
        items = getTodayAudioReviews();
        break;
      case 'video':
        items = getTodayVideoReviews();
        break;
    }

    const playlist: DailyPlaylist = {
      id: generateUUID(),
      date: new Date(),
      items,
      isCompleted: false,
      lastPlayedIndex: 0,
      isExtraSession,
      playlistType,
    };

    setPlaylists(prev => [playlist, ...prev]);
    return playlist;
  };

  const getLastPlaylist = (): DailyPlaylist | null => {
    return playlists.find(p => !p.isCompleted) || null;
  };

  const updatePlaylistProgress = (playlistId: string, lastPlayedIndex: number, isCompleted: boolean = false) => {
    setPlaylists(prev => prev.map(playlist => {
      if (playlist.id === playlistId) {
        return {
          ...playlist,
          lastPlayedIndex,
          isCompleted,
        };
      }
      return playlist;
    }));

    if (isCompleted) {
      // 标记所有播放的视频为已完成
      const playlist = playlists.find(p => p.id === playlistId);
      if (playlist) {
        playlist.items.forEach(item => {
          markVideoAsPlayed(item.videoId);
        });
      }
    }
  };

  const getStats = (): LearningStats => {
    const activeCollectionIds = collections.filter(c => c.isActive).map(c => c.id);
    const activeVideos = videos.filter(v => activeCollectionIds.includes(v.collectionId));
    
    const totalVideos = activeVideos.length;
    const completedVideos = activeVideos.filter(v => v.status === 'completed').length;
    const newVideos = getTodayNewVideos();
    const audioReviews = getTodayAudioReviews();
    const videoReviews = getTodayVideoReviews();
    
    const overallProgress = totalVideos > 0 
      ? Math.round((completedVideos / totalVideos) * 100) 
      : 0;

    // 检查是否可以加餐（今日任务已完成）
    const canAddExtra = newVideos.length === 0 && activeVideos.some(v => v.status === 'new');

    return {
      totalVideos,
      completedVideos,
      todayNewCount: newVideos.length,
      todayAudioReviewCount: audioReviews.length,
      todayVideoReviewCount: videoReviews.length,
      overallProgress,
      activeCollections: collections.filter(c => c.isActive).length,
      canAddExtra,
    };
  };

  const deleteVideo = async (videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      try {
        // 清理文件URL
        if (video.fileUrl) {
          URL.revokeObjectURL(video.fileUrl);
        }
        
        // 从 IndexedDB 删除文件
        await fileStorage.deleteFile(videoId);
        
        // 更新合辑统计
        setCollections(prevCollections => prevCollections.map(collection => 
          collection.id === video.collectionId 
            ? { 
                ...collection, 
                totalVideos: Math.max(0, collection.totalVideos - 1),
                completedVideos: video.status === 'completed' 
                  ? Math.max(0, collection.completedVideos - 1)
                  : collection.completedVideos
              }
            : collection
        ));
      } catch (error) {
        console.error('Error deleting video file:', error);
      }
    }
    
    setVideos(prev => prev.filter(v => v.id !== videoId));
  };

  const getVideoById = (id: string): VideoFile | undefined => {
    return videos.find(v => v.id === id);
  };

  // 清理对象URLs
  useEffect(() => {
    return () => {
      videos.forEach(video => {
        if (video.fileUrl) {
          URL.revokeObjectURL(video.fileUrl);
        }
      });
    };
  }, []);

  return {
    videos,
    playlists,
    collections,
    isLoading,
    addVideos,
    createCollection,
    updateCollection,
    deleteCollection,
    toggleCollection,
    generateTodayPlaylist,
    createTodayPlaylist,
    getLastPlaylist,
    updatePlaylistProgress,
    getStats,
    deleteVideo,
    getVideoById,
    getTodayNewVideos,
    getTodayAudioReviews,
    getTodayVideoReviews,
  };
};