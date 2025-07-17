import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, AlertCircle } from 'lucide-react';
import { PlaylistItem, VideoFile } from '../types';

interface VideoPlayerProps {
  playlist: PlaylistItem[];
  videos: VideoFile[];
  onClose: () => void;
  onPlaylistComplete: () => void;
  initialIndex?: number;
  isAudioMode?: boolean;
  validateAndFixVideoUrl?: (videoId: string) => Promise<string | null>;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  playlist,
  videos,
  onClose,
  onPlaylistComplete,
  initialIndex = 0,
  isAudioMode = false,
  validateAndFixVideoUrl,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [audioOnlyMode, setAudioOnlyMode] = useState(isAudioMode);
  const [userInteracted, setUserInteracted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentItem = playlist[currentIndex];
  const currentVideo = videos.find(v => v.id === currentItem?.videoId);

  // 调试信息
  console.log('Debug info:', {
    currentIndex,
    playlistLength: playlist.length,
    currentItem,
    currentVideo,
    videosCount: videos.length,
    userAgent: navigator.userAgent
  });

  // 检测设备
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);

  // 监听用户交互
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };

    document.addEventListener('touchstart', handleUserInteraction);
    document.addEventListener('click', handleUserInteraction);

    return () => {
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('click', handleUserInteraction);
    };
  }, []);

  // 控制栏自动隐藏逻辑
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
        setControlsTimeout(null);
      }
      return;
    }

    const resetHideTimeout = () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      setShowControls(true);
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    };

    resetHideTimeout();

    return () => {
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
    };
  }, [isPlaying, controlsTimeout]);

  // 视频容器点击时切换控制栏显示或启动播放
  const handleVideoClick = () => {
    if (!userInteracted) {
      // 首次点击时设置用户交互并尝试播放
      setUserInteracted(true);
      if (videoRef.current && !isPlaying) {
        videoRef.current.play().catch(error => {
          console.log('手动播放失败:', error);
        });
      }
    }
    
    if (isPlaying) {
      setShowControls(!showControls);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
        setControlsTimeout(null);
      }
      if (!showControls) {
        const timeout = setTimeout(() => {
          setShowControls(false);
        }, 3000);
        setControlsTimeout(timeout);
      }
    }
  };

  // 视频加载和播放效果
  useEffect(() => {
    if (videoRef.current && currentVideo) {
      setVideoError(false);
      setIsLoading(true);
      setRetryCount(0);
      
      const video = videoRef.current;
      video.src = '';
      video.load();
      video.src = currentVideo.fileUrl;
      
      if (audioOnlyMode) {
        video.style.display = 'none';
      } else {
        video.style.display = 'block';
      }
      
      const handleLoadedMetadata = () => {
        setIsLoading(false);
        setDuration(video.duration);
      };

      const handleCanPlay = () => {
        setIsLoading(false);
        setVideoError(false);
        
        // 移除严格的用户交互检测，允许视频准备好后立即播放
        if (autoPlay && currentIndex >= initialIndex) {
          setTimeout(() => {
            if (!videoError && video.readyState >= 2) {
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    setIsPlaying(true);
                    setUserInteracted(true); // 成功播放后设置用户交互
                  })
                  .catch((error) => {
                    console.log('自动播放失败，需要用户交互:', error);
                    setIsLoading(false);
                    // 播放失败时不设置错误，只是等待用户点击
                  });
              }
            }
          }, 200); // 减少延迟时间
        } else {
          setIsLoading(false);
        }
      };

      const handleError = async (e: any) => {
        console.error('Video error:', e);
        
        if (validateAndFixVideoUrl && currentVideo && retryCount < 3) {
          console.log('Attempting to fix video URL for:', currentVideo.id);
          setRetryCount(prev => prev + 1);
          
          try {
            const fixedUrl = await validateAndFixVideoUrl(currentVideo.id);
            if (fixedUrl && fixedUrl !== currentVideo.fileUrl) {
              console.log('Video URL fixed, retrying with:', fixedUrl);
              video.src = fixedUrl;
              video.load();
              return;
            }
          } catch (error) {
            console.error('Error fixing video URL:', error);
          }
        }
        
        setVideoError(true);
        setIsLoading(false);
      };

      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };
    }
  }, [currentIndex, currentVideo, audioOnlyMode, userInteracted, autoPlay, initialIndex, validateAndFixVideoUrl, retryCount]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleVideoEnded = () => {
    if (autoPlay && currentIndex < playlist.length - 1) {
      goToNext();
    } else if (currentIndex >= playlist.length - 1) {
      onPlaylistComplete();
    }
  };

  const retryVideo = () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setVideoError(false);
      setIsLoading(true);
      
      if (videoRef.current && currentVideo) {
        const video = videoRef.current;
        video.src = '';
        video.load();
        video.src = currentVideo.fileUrl;
        
        setTimeout(() => {
          if (video.readyState >= 2) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.error('Retry play failed:', error);
                setVideoError(true);
                setIsLoading(false);
              });
            }
          }
        }, 1000);
      }
    } else {
      alert('视频加载失败次数过多，请检查文件是否损坏');
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      window.history.pushState(null, '', window.location.href);
    }
    onClose();
  };

  // 监听浏览器返回按钮
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      handleClose();
    };

    window.history.pushState({ modal: 'video-player' }, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  if (!currentVideo) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-sm mx-4">
          <p className="text-xl text-gray-800 mb-4">视频文件未找到</p>
          <button
            onClick={handleClose}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      {/* 视频播放器 - 直接全屏显示，无菜单栏 - 更新测试20250718 */}
      <div className="relative w-full h-full">
        {/* 加载指示器 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span className="text-white">加载中...</span>
            </div>
          </div>
        )}

        {/* 视频错误提示 */}
        {videoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <div className="text-center">
              <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
              <p className="text-white mb-4">视频加载失败</p>
              <button
                onClick={retryVideo}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                重试
              </button>
            </div>
          </div>
        )}

        {/* 视频元素 */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onClick={handleVideoClick}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleVideoEnded}
          onLoadStart={() => setIsLoading(true)}
          onCanPlay={() => setIsLoading(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          playsInline
          controls={false}
          preload="metadata"
        />

        {/* 控制栏 - 放大了3倍 */}
        <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-6 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex items-center justify-between">
            {/* 左侧播放控制 */}
            <div className="flex items-center space-x-6">
              <button
                onClick={goToPrevious}
                className="text-white hover:text-gray-300 p-3"
                disabled={currentIndex === 0}
              >
                <SkipBack size={36} />
              </button>
              
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-300 p-3"
              >
                {isPlaying ? <Pause size={48} /> : <Play size={48} />}
              </button>
              
              <button
                onClick={goToNext}
                className="text-white hover:text-gray-300 p-3"
                disabled={currentIndex === playlist.length - 1}
              >
                <SkipForward size={36} />
              </button>
            </div>

            {/* 右侧关闭按钮 */}
            <div className="flex items-center space-x-6">
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-300 p-3"
                title="关闭"
              >
                <X size={36} />
              </button>
            </div>
          </div>

          {/* 进度条 */}
          <div className="mt-4">
            <div className="flex items-center space-x-4">
              <span className="text-white text-sm min-w-0">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 h-2 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-100"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <span className="text-white text-sm min-w-0">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        </div>

        {/* 视频标题信息 - 简化版 */}
        <div className={`absolute top-4 left-4 right-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="text-white font-semibold text-lg truncate max-w-xs">
                {currentVideo.name} (v2)
              </h3>
              <span className="text-gray-400 text-sm whitespace-nowrap">
                {currentIndex + 1}/{playlist.length}
              </span>
            </div>
            
            {audioOnlyMode && (
              <span className="bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium">
                音频模式
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;