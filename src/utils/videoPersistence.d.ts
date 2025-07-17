// TypeScript声明文件
export interface VideoData {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  fileType: string;
  lastModified: number;
  storedAt: number;
}

export interface BlobMapping {
  blobUrl: string;
  createdAt: number;
  fileName: string;
  fileSize: number;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  totalSizeMB: string;
  files: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    storedAt: Date;
  }>;
}

export interface FixResult {
  success: boolean;
  fixedCount?: number;
  error?: string;
}

export declare const VideoPersistenceManager: {
  isIOS(): boolean;
  isSafari(): boolean;
  isPWA(): boolean;
  storeVideoWithIOSOptimization(videoId: string, file: File): Promise<string>;
  storeVideoFile(videoId: string, file: File): Promise<string>;
  getVideoFile(videoId: string): Promise<VideoData | null>;
  createPersistentBlobUrl(videoId: string, file: File): Promise<string>;
  restoreBlobUrl(videoId: string): Promise<string | null>;
  validateBlobUrl(blobUrl: string): Promise<boolean>;
  fixAllBlobUrls(): Promise<FixResult>;
  cleanupExpiredBlobs(): void;
  getStorageStats(): Promise<StorageStats>;
};

export declare const VideoUrlManager: {
  createVideoUrl(video: { id: string; fileUrl?: string; file?: File }): Promise<string>;
  fixAllVideoUrls(): Promise<FixResult>;
  preloadVideoUrls(): Promise<void>;
};

export declare const initializeVideoPersistence: () => void;
export declare const showIOSPWAInstallTip: () => void;
