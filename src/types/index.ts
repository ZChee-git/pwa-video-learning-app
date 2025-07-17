export interface VideoFile {
  id: string;
  name: string;
  file: File;
  fileUrl: string;
  dateAdded: Date;
  firstPlayDate?: Date;
  reviewCount: number;
  nextReviewDate?: Date;
  status: 'new' | 'learning' | 'completed';
  collectionId: string; // 所属合辑ID
  episodeNumber?: number; // 集数
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  dateCreated: Date;
  isActive: boolean; // 是否参与学习计划生成
  totalVideos: number;
  completedVideos: number;
  color: string; // 合辑颜色标识
}

export interface PlaylistItem {
  videoId: string;
  reviewType: 'new' | 'audio' | 'video';
  reviewNumber: number;
  daysSinceFirstPlay?: number; // 距离第一次观看的天数
  isRecommendedForVideo?: boolean; // 是否建议观看视频
}

export interface DailyPlaylist {
  id: string;
  date: Date;
  items: PlaylistItem[];
  isCompleted: boolean;
  lastPlayedIndex: number;
  isExtraSession: boolean; // 是否为加餐模式
  playlistType: 'new' | 'audio' | 'video'; // 播放列表类型
}

export interface LearningStats {
  totalVideos: number;
  completedVideos: number;
  todayNewCount: number;
  todayAudioReviewCount: number; // 音频复习数量
  todayVideoReviewCount: number; // 视频复习数量
  overallProgress: number;
  activeCollections: number;
  canAddExtra: boolean; // 是否可以加餐
}

export interface PlaylistPreview {
  newVideos: PlaylistItem[];
  audioReviews: PlaylistItem[];
  videoReviews: PlaylistItem[];
  totalCount: number;
  isExtraSession: boolean;
}