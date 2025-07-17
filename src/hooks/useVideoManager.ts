import { useState, useEffect } from 'react';
import { VideoFile, ReviewSchedule, LearningStats } from '../types';
import { generateUUID } from '../utils/uuid';
import { VideoPersistenceManager, VideoUrlManager } from '../utils/videoPersistence';

export const useVideoManager = () => {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [todayReviews, setTodayReviews] = useState<ReviewSchedule[]>([]);

  // Ebbinghaus forgetting curve: review after 2, 4, 15, 30 days
  const REVIEW_INTERVALS = [2, 4, 15, 30];

  const generateReviewDates = (startDate: Date): Date[] => {
    return REVIEW_INTERVALS.map(days => {
      const reviewDate = new Date(startDate);
      reviewDate.setDate(reviewDate.getDate() + days);
      return reviewDate;
    });
  };

  const addVideo = async (file: File) => {
    const videoId = generateUUID();
    
    try {
      // 检测iOS设备并使用优化的存储策略
      let persistentBlobUrl: string;
      
      if (VideoPersistenceManager.isIOS()) {
        // iOS设备使用优化存储
        persistentBlobUrl = await VideoPersistenceManager.storeVideoWithIOSOptimization(videoId, file);
      } else {
        // 其他设备使用标准存储
        persistentBlobUrl = await VideoPersistenceManager.createPersistentBlobUrl(videoId, file);
      }
      
      const newVideo: VideoFile = {
        id: videoId,
        name: file.name.replace(/\.[^/.]+$/, ""),
        file,
        fileUrl: persistentBlobUrl,
        dateAdded: new Date(),
        status: 'new',
        reviewCount: 0,
        collectionId: '',
      };

      setVideos(prev => [...prev, newVideo]);
      return videoId;
    } catch (error) {
      console.error('Error adding video with persistent storage:', error);
      
      // 回退到传统方式
      const newVideo: VideoFile = {
        id: videoId,
        name: file.name.replace(/\.[^/.]+$/, ""),
        file,
        fileUrl: URL.createObjectURL(file),
        dateAdded: new Date(),
        status: 'new',
        reviewCount: 0,
        collectionId: '',
      };

      setVideos(prev => [...prev, newVideo]);
      return videoId;
    }
  };

  const startLearning = (videoId: string) => {
    setVideos(prev => prev.map(video => {
      if (video.id === videoId) {
        const reviewDates = generateReviewDates(new Date());
        return {
          ...video,
          status: 'learning' as const,
          reviewDates,
        };
      }
      return video;
    }));
  };

  const completeReview = (videoId: string) => {
    setVideos(prev => prev.map(video => {
      if (video.id === videoId) {
        const newCompletedReviews = [...video.completedReviews, new Date()];
        const newReviewIndex = video.currentReviewIndex + 1;
        const isCompleted = newReviewIndex >= REVIEW_INTERVALS.length;
        
        return {
          ...video,
          completedReviews: newCompletedReviews,
          currentReviewIndex: newReviewIndex,
          status: isCompleted ? 'completed' as const : 'reviewing' as const,
        };
      }
      return video;
    }));
  };

  const getTodayReviews = (): ReviewSchedule[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const reviews: ReviewSchedule[] = [];
    
    videos.forEach(video => {
      if (video.status === 'learning' || video.status === 'reviewing') {
        const nextReviewDate = video.reviewDates[video.currentReviewIndex];
        if (nextReviewDate) {
          const reviewDate = new Date(nextReviewDate);
          reviewDate.setHours(0, 0, 0, 0);
          
          if (reviewDate.getTime() <= today.getTime()) {
            reviews.push({
              videoId: video.id,
              reviewDate: nextReviewDate,
              reviewNumber: video.currentReviewIndex + 1,
              completed: false,
            });
          }
        }
      }
    });
    
    return reviews;
  };

  const getStats = (): LearningStats => {
    const totalVideos = videos.length;
    const completedVideos = videos.filter(v => v.status === 'completed').length;
    const reviewsToday = getTodayReviews().length;
    
    return {
      totalVideos,
      completedVideos,
      reviewsToday,
      streak: 0, // Simple implementation
    };
  };

  const deleteVideo = (videoId: string) => {
    setVideos(prev => {
      const updated = prev.filter(video => video.id !== videoId);
      // Clean up object URLs to prevent memory leaks
      const deletedVideo = prev.find(video => video.id !== videoId);
      if (deletedVideo) {
        URL.revokeObjectURL(deletedVideo.fileUrl);
      }
      return updated;
    });
  };

  useEffect(() => {
    setTodayReviews(getTodayReviews());
  }, [videos]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      videos.forEach(video => {
        URL.revokeObjectURL(video.fileUrl);
      });
    };
  }, []);

  return {
    videos,
    todayReviews,
    addVideo,
    startLearning,
    completeReview,
    getTodayReviews,
    getStats,
    deleteVideo,
  };
};