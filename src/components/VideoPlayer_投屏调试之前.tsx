// 备份于 2025-07-15，投屏调试之前
// 原始文件：VideoPlayer.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize, X, List, Cast, AlertCircle, Wifi, ArrowLeft, Video as VideoIcon } from 'lucide-react';
import { PlaylistItem, VideoFile } from '../types';

interface VideoPlayerProps {
  playlist: PlaylistItem[];
  videos: VideoFile[];
  onClose: () => void;
  onPlaylistComplete: () => void;
  initialIndex?: number;
  isAudioMode?: boolean; // 新增：是否为音频模式
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playlist,
  videos,
  onClose,
  onPlaylistComplete,
  initialIndex = 0,
  isAudioMode = false,
}) => {
  // ...existing code...
  // 详见 VideoPlayer.tsx 当前内容
}
