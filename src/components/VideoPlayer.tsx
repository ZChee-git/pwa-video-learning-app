import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, X, List, AlertCircle, ArrowLeft, Video as VideoIcon, RefreshCw } from 'lucide-react';
import { PlaylistItem, VideoFile } from '../types';
import { AndroidVideoUtils } from '../utils/androidVideoUtils';
import { DataConsistencyUtils } from '../utils/dataConsistencyUtils';
import { videoLoadFixer } from '../utils/videoLoadFixer';
import { usePlaybackProgress } from '../hooks/usePlaybackProgress';

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
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [showCastMenu, setShowCastMenu] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [audioOnlyMode, setAudioOnlyMode] = useState(isAudioMode); // 当前播放模式
  const [castDevices, setCastDevices] = useState<any[]>([]);
  const [isSearchingDevices, setIsSearchingDevices] = useState(false);
  const [castSupported, setCastSupported] = useState(false);
  const [castError, setCastError] = useState<string>('');
  const [userInteracted, setUserInteracted] = useState(false); // 追踪用户是否已交互
  const [showControls, setShowControls] = useState(true); // 控制栏显示状态
  const [isFullscreen, setIsFullscreen] = useState(false); // 全屏状态
  const [controlsTimer, setControlsTimer] = useState<number | null>(null); // 控制栏隐藏定时器
  const [videoOrientation, setVideoOrientation] = useState<'portrait' | 'landscape'>('portrait'); // 视频方向
  const [isFixing, setIsFixing] = useState(false); // 是否正在修复
  const [fixAttempted, setFixAttempted] = useState(false); // 是否已尝试修复
  const [savedProgress, setSavedProgress] = useState<any>(null); // 保存的播放进度
  const [blobUrlFixed, setBlobUrlFixed] = useState(false); // 记录blob URL是否已修复
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const progressSaveTimer = useRef<number | null>(null);

  // 使用播放进度hook
  const { 
    saveProgress, 
    getProgress, 
    shouldShowContinuePrompt,
    cleanupOldProgress
  } = usePlaybackProgress();

  const currentItem = playlist[currentIndex];
  // 添加调试信息
  console.log('VideoPlayer Debug - currentIndex:', currentIndex);
  console.log('VideoPlayer Debug - currentItem:', currentItem);
  console.log('VideoPlayer Debug - playlist:', playlist);
  console.log('VideoPlayer Debug - videos:', videos);
  console.log('VideoPlayer Debug - videoId to find:', currentItem?.videoId);
  
  // 检查数据一致性
  const consistencyIssues = DataConsistencyUtils.checkPlaylistVideoConsistency(playlist, videos);
  if (consistencyIssues.length > 0) {
    console.warn('VideoPlayer Debug - Consistency issues found:', consistencyIssues);
  }
  
  // 详细检查ID匹配问题
  if (currentItem?.videoId) {
    console.log('VideoPlayer Debug - Checking ID matches:');
    videos.forEach((video, index) => {
      console.log(`  Video ${index}: id="${video.id}", name="${video.name}", matches=${video.id === currentItem.videoId}`);
    });
  }
  
  // 查找当前视频，包含备用方案
  let currentVideo = videos.find(v => v.id === currentItem?.videoId);
  console.log('VideoPlayer Debug - found currentVideo:', currentVideo);

  // 如果找不到视频，尝试其他方式匹配
  if (!currentVideo && currentItem?.videoId) {
    console.log('VideoPlayer Debug - Attempting alternative matching...');
    console.log('VideoPlayer Debug - Available video IDs:', videos.map(v => v.id));
    console.log('VideoPlayer Debug - Looking for videoId:', currentItem.videoId);
    
    // 尝试按索引匹配（如果videoId是数字索引）
    const videoIndex = parseInt(currentItem.videoId);
    if (!isNaN(videoIndex) && videoIndex >= 0 && videoIndex < videos.length) {
      currentVideo = videos[videoIndex];
      console.log('VideoPlayer Debug - Index-based match:', currentVideo);
    }
    
    // 尝试部分匹配
    if (!currentVideo) {
      currentVideo = videos.find(v => v.id.includes(currentItem.videoId) || currentItem.videoId.includes(v.id));
      console.log('VideoPlayer Debug - Partial match:', currentVideo);
    }
    
    // 尝试UUID格式匹配（处理UUID格式变化）
    if (!currentVideo) {
      // 如果videoId看起来像UUID的一部分，尝试找到包含它的完整UUID
      const uuidMatch = videos.find(v => {
        const videoIdClean = currentItem.videoId.replace(/[^a-zA-Z0-9]/g, '');
        const videoIdCleanLower = videoIdClean.toLowerCase();
        const vIdClean = v.id.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        return vIdClean.includes(videoIdCleanLower) || videoIdCleanLower.includes(vIdClean);
      });
      if (uuidMatch) {
        currentVideo = uuidMatch;
        console.log('VideoPlayer Debug - UUID-based match:', currentVideo);
      }
    }
    
    // 如果仍然找不到，使用第一个视频作为备用
    if (!currentVideo && videos.length > 0) {
      currentVideo = videos[0];
      console.log('VideoPlayer Debug - Using first video as fallback:', currentVideo);
    }
  }

  // 检查找到的视频是否有有效的文件URL
  if (currentVideo && (!currentVideo.fileUrl || currentVideo.fileUrl === '')) {
    console.warn('VideoPlayer Debug - Current video has no fileUrl:', currentVideo);
    
    // 尝试重新生成fileUrl
    if (currentVideo.file && currentVideo.file.size > 0) {
      try {
        currentVideo.fileUrl = URL.createObjectURL(currentVideo.file);
        console.log('VideoPlayer Debug - Regenerated fileUrl:', currentVideo.fileUrl);
      } catch (error) {
        console.error('VideoPlayer Debug - Failed to regenerate fileUrl:', error);
      }
    }
  }

  // 自动修复功能
  const performAutoFix = async () => {
    console.log('🔧 开始自动修复视频加载问题...');
    setIsFixing(true);
    setFixAttempted(true);
    
    try {
      // 首先尝试修复blob URL
      if (!blobUrlFixed) {
        console.log('🔧 尝试修复blob URL...');
        try {
          // 动态导入视频持久化模块
          const { VideoPersistenceManager } = await import('../utils/videoPersistence');
          const fixResult = await VideoPersistenceManager.fixAllBlobUrls();
          
          if (fixResult.success && (fixResult.fixedCount || 0) > 0) {
            console.log(`✅ 成功修复 ${fixResult.fixedCount || 0} 个blob URL`);
            setBlobUrlFixed(true);
            
            // 重新加载视频数据
            const updatedVideos = JSON.parse(localStorage.getItem('videos') || '[]');
            
            // 通过自定义事件通知父组件更新视频数据
            const event = new CustomEvent('videoDataUpdated', { detail: updatedVideos });
            window.dispatchEvent(event);
            
            // 延迟后重新加载页面
            setTimeout(() => {
              window.location.reload();
            }, 1000);
            
            return true;
          }
        } catch (error) {
          console.error('Blob URL修复失败:', error);
        }
      }
      
      // 如果blob URL修复失败，尝试传统修复方法
      const result = await videoLoadFixer.fixAllIssues();
      
      if (result.success) {
        console.log('✅ 自动修复成功:', result.message);
        
        // 修复成功后重新加载页面
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        return true;
      } else {
        console.error('❌ 自动修复失败:', result.message);
        alert(`自动修复失败: ${result.message}`);
        return false;
      }
    } catch (error) {
      console.error('自动修复过程中出错:', error);
      alert('自动修复过程中出现错误，请重试');
      return false;
    } finally {
      setIsFixing(false);
    }
  };

  // 检查是否需要自动修复
  useEffect(() => {
    if (!currentVideo && !fixAttempted && videos.length > 0) {
      console.log('检测到视频加载问题，准备自动修复...');
      
      // 延迟执行自动修复，避免过于频繁
      const timer = setTimeout(() => {
        performAutoFix();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [currentVideo, fixAttempted, videos.length]);

  // 初始化播放进度
  useEffect(() => {
    if (currentVideo && currentItem) {
      console.log('初始化播放进度检查...');
      
      // 清理过期的播放进度
      cleanupOldProgress();
      
      // 使用videoId作为播放列表标识
      const playlistId = `${currentItem.videoId}_${currentItem.reviewType}_${currentItem.reviewNumber}`;
      
      // 获取当前视频的播放进度
      const progress = getProgress(currentVideo.id, playlistId);
      
      if (progress && shouldShowContinuePrompt(progress)) {
        console.log('发现之前的播放进度，将自动恢复到:', progress.currentTime);
        setSavedProgress(progress);
        // 不再显示提示，直接在视频加载完成后恢复进度
      } else {
        setSavedProgress(null);
      }
    }
  }, [currentVideo, currentItem, getProgress, shouldShowContinuePrompt, cleanupOldProgress]);

  // 定期保存播放进度
  useEffect(() => {
    if (currentVideo && currentItem && isPlaying && !videoError) {
      // 每5秒保存一次播放进度
      const interval = setInterval(() => {
        if (videoRef.current && !videoError) {
          const video = videoRef.current;
          const currentTime = video.currentTime;
          const duration = video.duration;
          
          if (duration > 0 && currentTime > 0) {
            // 只有播放时间超过10秒才保存进度
            if (currentTime >= 10) {
              const playlistId = `${currentItem.videoId}_${currentItem.reviewType}_${currentItem.reviewNumber}`;
              saveProgress(
                currentVideo.id,
                playlistId,
                currentTime,
                duration,
                false
              );
            }
          }
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [currentVideo, currentItem, isPlaying, videoError, saveProgress]);

  // 检测设备和浏览器
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);
  const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
  const androidVersion = isAndroid ? parseFloat((navigator.userAgent.match(/Android (\d+\.\d+)/) || [])[1]) : 0;
  const chromeVersion = navigator.userAgent.match(/Chrome\/(\d+)/) ? parseInt((navigator.userAgent.match(/Chrome\/(\d+)/) || [])[1]) : 0;

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

  useEffect(() => {
    if (videoRef.current && currentVideo) {
      setVideoError(false);
      setIsLoading(true);
      setRetryCount(0);
      
      // 重置视频元素
      const video = videoRef.current;
      video.src = '';
      video.load();
      
      // 强制禁用AirPlay，避免与屏幕镜像冲突
      if (isIOS) {
        (video as any).webkitAirplay = false;
        (video as any).disableRemotePlayback = true;
        video.setAttribute('x-webkit-airplay', 'deny');
        video.setAttribute('disablePictureInPicture', 'true');
        console.log('iOS AirPlay disabled for screen mirroring compatibility');
      }
      
      // 添加Android特定的调试信息
      console.log('Platform info:', {
        userAgent: navigator.userAgent,
        isAndroid: AndroidVideoUtils.isAndroid(),
        chromeVersion: AndroidVideoUtils.getChromeVersion(),
        supportedTypes: AndroidVideoUtils.checkVideoSupport(video)
      });
      
      // 应用Android推荐设置
      if (AndroidVideoUtils.isAndroid()) {
        const settings = AndroidVideoUtils.getRecommendedVideoSettings();
        video.preload = settings.preload;
        video.crossOrigin = settings.crossOrigin;
        video.playsInline = settings.playsInline;
        console.log('Applied Android video settings:', settings);
      }
      
      // 设置新的视频源
      video.src = currentVideo.fileUrl;
      console.log('Setting video source:', currentVideo.fileUrl);
      console.log('Video file details:', {
        id: currentVideo.id,
        name: currentVideo.name,
        fileUrl: currentVideo.fileUrl,
        file: currentVideo.file
      });
      
      // 检查文件URL是否有效
      if (currentVideo.fileUrl.startsWith('blob:')) {
        console.log('Using blob URL for video');
        // 验证blob URL是否有效
        fetch(currentVideo.fileUrl)
          .then(response => {
            console.log('Blob URL validation:', response.status, response.statusText);
            console.log('Response headers:', response.headers);
            return response.blob();
          })
          .then(blob => {
            console.log('Blob details:', {
              size: blob.size,
              type: blob.type,
              isValid: blob.size > 0
            });
          })
          .catch(error => {
            console.error('Blob URL validation failed:', error);
          });
      } else {
        console.log('Using regular URL for video');
      }
      
      // 音频模式设置
      if (audioOnlyMode) {
        video.style.display = 'none';
      } else {
        video.style.display = 'block';
      }
      
      // iOS Safari 特殊设置
      if (isIOS && isSafari) {
        video.playsInline = true;
        video.muted = false; // iOS Safari 不需要静音来自动播放
        video.preload = 'auto'; // iOS 使用 auto 预加载
      } else {
        video.preload = 'metadata';
      }
      
      // 等待元数据加载
      const handleLoadedMetadata = () => {
        setIsLoading(false);
        setDuration(video.duration);
      };

      const handleCanPlay = () => {
        setIsLoading(false);
        setVideoError(false);
        
        // 恢复播放进度
        if (savedProgress && videoRef.current) {
          console.log('恢复播放进度到:', savedProgress.currentTime);
          videoRef.current.currentTime = savedProgress.currentTime;
          setSavedProgress(null); // 清除保存的进度，避免重复恢复
        }
        
        // 自动播放逻辑
        if (autoPlay && currentIndex >= initialIndex && userInteracted) {
          setTimeout(() => {
            if (!videoError && video.readyState >= 2) {
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log('Auto-play successful');
                  })
                  .catch(error => {
                    console.log('Auto-play failed, user interaction required:', error);
                    // iOS Safari 自动播放失败是正常的，不显示错误
                    if (!isIOS) {
                      setIsLoading(false);
                    }
                  });
              }
            }
          }, isIOS ? 100 : 500); // iOS 使用更短的延迟
        } else {
          setIsLoading(false);
        }
      };

      const handleError = (e: any) => {
        console.error('Video error:', e);
        console.error('Video error details:', {
          error: e.target?.error,
          networkState: e.target?.networkState,
          readyState: e.target?.readyState,
          currentSrc: e.target?.currentSrc,
          videoSrc: video.src
        });
        
        // 检查文件是否存在
        if (currentVideo?.fileUrl) {
          fetch(currentVideo.fileUrl)
            .then(response => {
              console.log('File fetch response:', response);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              return response.blob();
            })
            .then(blob => {
              console.log('File blob:', blob);
              console.log('File size:', blob.size);
              console.log('File type:', blob.type);
              
              // Android特殊处理：如果是blob URL失败，尝试重新创建
              if (currentVideo.fileUrl.startsWith('blob:') && AndroidVideoUtils.isAndroid() && currentVideo.file) {
                console.log('Android blob URL retry attempt');
                
                try {
                  const newBlobUrl = URL.createObjectURL(currentVideo.file);
                  console.log('Creating new blob URL:', newBlobUrl);
                  
                  // 清除旧的blob URL
                  URL.revokeObjectURL(currentVideo.fileUrl);
                  
                  // 尝试使用新的blob URL
                  video.src = newBlobUrl;
                  currentVideo.fileUrl = newBlobUrl;
                  video.load();
                  return;
                } catch (blobError) {
                  console.error('Android blob URL recreation failed:', blobError);
                }
              }
            })
            .catch(fetchError => {
              console.error('File fetch error:', fetchError);
            });
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
  }, [currentIndex, currentVideo, audioOnlyMode, userInteracted]);

  // 视频方向检测和自动全屏
  useEffect(() => {
    const video = videoRef.current;
    if (!video || audioOnlyMode) return;

    const handleLoadedMetadata = () => {
      const { videoWidth, videoHeight } = video;
      const orientation = videoWidth > videoHeight ? 'landscape' : 'portrait';
      setVideoOrientation(orientation);
      
      // 如果是横屏视频且在移动设备上，自动进入全屏
      // 使用改良的全屏方法，避免触发AirPlay
      if (orientation === 'landscape' && isMobile && !isFullscreen) {
        setTimeout(() => {
          enterFullscreen();
        }, 500);
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [currentIndex, currentVideo, audioOnlyMode, isMobile, isFullscreen]);

  // 屏幕方向检测 - 仅用于调试，不控制控制栏
  useEffect(() => {
    const handleOrientationChange = () => {
      // 检测屏幕方向
      const orientation = screen.orientation?.angle;
      const isLandscape = orientation === 90 || orientation === 270 || orientation === -90;
      
      console.log('Screen orientation changed:', orientation, 'isLandscape:', isLandscape);
      
      // 移除控制栏相关逻辑，统一由 handleUserActivity 处理
    };

    handleOrientationChange();
    window.addEventListener('orientationchange', handleOrientationChange);
    screen.orientation?.addEventListener('change', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      screen.orientation?.removeEventListener('change', handleOrientationChange);
    };
  }, [isFullscreen, audioOnlyMode]);

  // 全屏状态监听
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);
    
    // iOS Safari视口变化监听 - 简化版
    const handleViewportChange = () => {
      if (isIOS && isSafari && isFullscreen && playerRef.current && document.fullscreenElement) {
        // 强制重新应用全屏样式
        playerRef.current.style.height = '100vh';
        playerRef.current.style.maxHeight = '100vh';
        playerRef.current.style.minHeight = '100vh';
        playerRef.current.style.position = 'fixed';
        playerRef.current.style.top = '0';
        playerRef.current.style.left = '0';
        playerRef.current.style.width = '100vw';
        playerRef.current.style.zIndex = '9999';
        
        // 确保视频元素也占满容器
        const videoElement = playerRef.current.querySelector('video');
        if (videoElement) {
          videoElement.style.height = '100%';
          videoElement.style.width = '100%';
          videoElement.style.objectFit = 'contain';
        }
        
        console.log('iOS Safari viewport change - styles reapplied');
      }
    };
    
    // 监听视口变化（iOS Safari特有）
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
      
      // 立即执行一次调整
      if (isIOS && isSafari && isFullscreen) {
        handleViewportChange();
      }
    }
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, [isFullscreen, isIOS, isSafari]);

  // 控制栏自动隐藏 - 简化版本
  useEffect(() => {
    // 非全屏时始终显示控制栏
    if (!isFullscreen || audioOnlyMode) {
      setShowControls(true);
      if (controlsTimer) {
        clearTimeout(controlsTimer);
        setControlsTimer(null);
      }
    } else {
      // 全屏时默认隐藏控制栏，用户活动后显示
      setShowControls(false);
    }
    
    return () => {
      if (controlsTimer) {
        clearTimeout(controlsTimer);
      }
    };
  }, [isFullscreen, audioOnlyMode]);

  // 用户活动时显示控制栏 - 简化版本
  const handleUserActivity = useCallback(() => {
    // 非全屏模式下始终显示控制栏
    if (!isFullscreen || audioOnlyMode) {
      setShowControls(true);
      return;
    }
    
    // 全屏模式下：用户活动时显示控制栏，3秒后自动隐藏
    setShowControls(true);
    if (controlsTimer) {
      clearTimeout(controlsTimer);
    }
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 3000); // 3秒后隐藏控制栏
    setControlsTimer(timer);
  }, [isFullscreen, audioOnlyMode, controlsTimer]);

  // 增强的全屏功能 - 修复iOS AirPlay冲突和浏览器界面遮挡
  const enterFullscreen = async () => {
    try {
      // 统一使用容器全屏，避免iOS视频原生全屏触发AirPlay
      if (playerRef.current) {
        await playerRef.current.requestFullscreen();
        
        // iOS Safari全屏时的界面补偿
        if (isIOS && isSafari) {
          // 等待全屏动画完成后调整样式
          setTimeout(() => {
            if (playerRef.current && document.fullscreenElement) {
              // 简化的全屏适配 - 强制使用100%视口高度
              playerRef.current.style.height = '100vh';
              playerRef.current.style.maxHeight = '100vh';
              playerRef.current.style.position = 'fixed';
              playerRef.current.style.top = '0';
              playerRef.current.style.left = '0';
              playerRef.current.style.width = '100vw';
              playerRef.current.style.zIndex = '9999';
              
              // 确保视频容器占满全屏
              const videoElement = playerRef.current.querySelector('video');
              if (videoElement) {
                videoElement.style.height = '100%';
                videoElement.style.width = '100%';
                videoElement.style.objectFit = 'contain';
              }
              
              console.log('iOS Safari fullscreen - simplified adjustment applied');
            }
          }, 100);
        }
        
        // 横屏视频在移动设备上锁定为横屏
        if (videoOrientation === 'landscape' && isMobile) {
          try {
            if (screen.orientation && 'lock' in screen.orientation) {
              await (screen.orientation as any).lock('landscape');
            }
          } catch (error) {
            console.warn('Screen orientation lock failed:', error);
          }
        }
      }
    } catch (error) {
      console.error('Fullscreen failed:', error);
      // 如果容器全屏失败，尝试其他方案
      if (isIOS && videoRef.current) {
        // 对于iOS，如果容器全屏失败，使用CSS全屏模拟
        try {
          document.body.style.overflow = 'hidden';
          if (playerRef.current) {
            // 获取实际可视区域
            const viewportHeight = window.visualViewport?.height || window.innerHeight;
            const viewportWidth = window.visualViewport?.width || window.innerWidth;
            
            playerRef.current.style.position = 'fixed';
            playerRef.current.style.top = '0';
            playerRef.current.style.left = '0';
            playerRef.current.style.width = `${viewportWidth}px`;
            playerRef.current.style.height = `${viewportHeight}px`;
            playerRef.current.style.zIndex = '9999';
            playerRef.current.style.backgroundColor = 'white';
            setIsFullscreen(true);
          }
        } catch (cssError) {
          console.error('CSS fullscreen fallback failed:', cssError);
        }
      }
    }
  };

  const exitFullscreen = async () => {
    try {
      // 检查是否是标准全屏
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        
        // 重置iOS Safari的样式调整
        if (isIOS && isSafari && playerRef.current) {
          playerRef.current.style.height = '';
          playerRef.current.style.maxHeight = '';
          playerRef.current.style.minHeight = '';
          playerRef.current.style.position = '';
          playerRef.current.style.top = '';
          playerRef.current.style.left = '';
          playerRef.current.style.width = '';
          playerRef.current.style.zIndex = '';
          playerRef.current.style.transform = '';
        }
        
        // 退出全屏时解锁屏幕方向
        if (screen.orientation && 'unlock' in screen.orientation) {
          try {
            (screen.orientation as any).unlock();
          } catch (error) {
            console.warn('Screen orientation unlock failed:', error);
          }
        }
      } else {
        // 处理CSS全屏的退出
        if (isFullscreen && playerRef.current) {
          document.body.style.overflow = '';
          playerRef.current.style.position = '';
          playerRef.current.style.top = '';
          playerRef.current.style.left = '';
          playerRef.current.style.width = '';
          playerRef.current.style.height = '';
          playerRef.current.style.maxHeight = '';
          playerRef.current.style.minHeight = '';
          playerRef.current.style.zIndex = '';
          playerRef.current.style.transform = '';
          playerRef.current.style.backgroundColor = '';
          setIsFullscreen(false);
        }
      }
    } catch (error) {
      console.error('Exit fullscreen failed:', error);
    }
  };

  // 检测投屏支持
  useEffect(() => {
    const checkCastSupport = () => {
      let supported = false;
      let errorMsg = '';

      // iOS AirPlay 检测 - 更准确的检测方法
      if (isIOS) {
        // 检查是否为 Safari 浏览器
        if (!isSafari) {
          errorMsg = 'iOS 设备需要使用 Safari 浏览器才能支持 AirPlay 投屏';
        } else {
          // 检查 AirPlay 支持
          const video = document.createElement('video');
          if ('webkitShowPlaybackTargetPicker' in video) {
            supported = true;
          } else {
            errorMsg = '当前 iOS 版本或 Safari 版本不支持 AirPlay';
          }
        }
      }
      // Android Chromecast 检测
      else if (isAndroid) {
        if (androidVersion < 5.0) {
          errorMsg = `Android ${androidVersion} 版本过低，需要 Android 5.0+ 才能支持投屏`;
        } else if (chromeVersion < 66) {
          errorMsg = `Chrome ${chromeVersion} 版本过低，需要 Chrome 66+ 才能支持投屏`;
        } else if ('presentation' in navigator && 'PresentationRequest' in window) {
          supported = true;
        } else {
          errorMsg = '当前浏览器不支持 Chromecast 投屏功能';
        }
      }
      // 桌面浏览器
      else {
        if (videoRef.current && 'remote' in videoRef.current) {
          supported = true;
        } else {
          errorMsg = '当前浏览器不支持远程播放功能';
        }
      }

      setCastSupported(supported);
      setCastError(errorMsg);
    };

    checkCastSupport();
  }, [isIOS, isAndroid, isSafari, androidVersion, chromeVersion]);

  // 检测投屏设备连接状态
  useEffect(() => {
    const detectCastDevices = async () => {
      try {
        // 检测 Remote Playback API (桌面浏览器)
        if (videoRef.current && 'remote' in videoRef.current) {
          const remote = (videoRef.current as any).remote;
          
          remote.addEventListener('connect', () => {
            setIsCasting(true);
            console.log('Connected to remote device');
          });
          
          remote.addEventListener('disconnect', () => {
            setIsCasting(false);
            console.log('Disconnected from remote device');
          });
        }
      } catch (error) {
        console.log('Cast detection not supported:', error);
      }
    };

    if (castSupported) {
      detectCastDevices();
    }
  }, [castSupported]);

  const togglePlay = () => {
    if (videoRef.current && !videoError) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Play failed:', error);
            setVideoError(true);
          });
        }
      }
    }
  };

  const toggleVideoMode = () => {
    setAudioOnlyMode(!audioOnlyMode);
  };

  const goToNext = () => {
    // 保存当前播放进度（如果有的话）
    if (currentVideo && currentItem && videoRef.current && !videoError) {
      const video = videoRef.current;
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      if (duration > 0 && currentTime > 10) {
        const playlistId = `${currentItem.videoId}_${currentItem.reviewType}_${currentItem.reviewNumber}`;
        const isCompleted = currentTime >= duration * 0.9;
        
        saveProgress(
          currentVideo.id,
          playlistId,
          currentTime,
          duration,
          isCompleted
        );
      }
    }
    
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(false);
      setVideoError(false);
      setSavedProgress(null);
    } else {
      onPlaylistComplete();
    }
  };

  const goToPrevious = () => {
    // 保存当前播放进度（如果有的话）
    if (currentVideo && currentItem && videoRef.current && !videoError) {
      const video = videoRef.current;
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      if (duration > 0 && currentTime > 10) {
        const playlistId = `${currentItem.videoId}_${currentItem.reviewType}_${currentItem.reviewNumber}`;
        const isCompleted = currentTime >= duration * 0.9;
        
        saveProgress(
          currentVideo.id,
          playlistId,
          currentTime,
          duration,
          isCompleted
        );
      }
    }
    
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(false);
      setVideoError(false);
      setSavedProgress(null);
    }
  };

  const jumpToItem = (index: number) => {
    // 保存当前播放进度（如果有的话）
    if (currentVideo && currentItem && videoRef.current && !videoError) {
      const video = videoRef.current;
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      if (duration > 0 && currentTime > 10) {
        const playlistId = `${currentItem.videoId}_${currentItem.reviewType}_${currentItem.reviewNumber}`;
        const isCompleted = currentTime >= duration * 0.9;
        
        saveProgress(
          currentVideo.id,
          playlistId,
          currentTime,
          duration,
          isCompleted
        );
      }
    }
    
    setCurrentIndex(index);
    setIsPlaying(false);
    setShowPlaylist(false);
    setVideoError(false);
    setSavedProgress(null);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVideoEnded = () => {
    // 视频结束时标记为完成
    if (currentVideo && currentItem) {
      const playlistId = `${currentItem.videoId}_${currentItem.reviewType}_${currentItem.reviewNumber}`;
      const video = videoRef.current;
      
      if (video) {
        console.log('视频播放完成，标记为已完成');
        saveProgress(
          currentVideo.id,
          playlistId,
          video.duration,
          video.duration,
          true // 标记为已完成
        );
      }
    }
    
    if (autoPlay && currentIndex < playlist.length - 1) {
      goToNext();
    } else if (currentIndex >= playlist.length - 1) {
      onPlaylistComplete();
    }
  };

  const retryVideo = async () => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1);
      setVideoError(false);
      setIsLoading(true);
      
      if (videoRef.current && currentVideo) {
        const video = videoRef.current;
        
        // 使用Android工具函数进行重试
        if (AndroidVideoUtils.isAndroid()) {
          console.log('Using Android video retry strategy');
          
          try {
            const success = await AndroidVideoUtils.retryVideoLoad(
              video, 
              currentVideo.fileUrl, 
              1 // 这里只尝试一次，因为外层已经有重试逻辑
            );
            
            if (success) {
              console.log('Android video retry successful');
              setIsLoading(false);
              return;
            }
          } catch (error) {
            console.error('Android video retry failed:', error);
          }
        }
        
        // 通用重试逻辑
        video.src = '';
        video.load();
        
        // Android特殊处理：重新获取文件URL
        if (AndroidVideoUtils.isAndroid() && currentVideo.fileUrl.startsWith('blob:')) {
          console.log('Android retry: Regenerating blob URL');
          
          try {
            // 如果有原始文件，重新创建blob URL
            if (currentVideo.file) {
              const newBlobUrl = await AndroidVideoUtils.handleAndroidBlobUrl(currentVideo.file);
              console.log('New blob URL generated:', newBlobUrl);
              
              // 清除旧的blob URL
              URL.revokeObjectURL(currentVideo.fileUrl);
              
              // 更新视频源
              currentVideo.fileUrl = newBlobUrl;
              video.src = newBlobUrl;
            } else {
              video.src = currentVideo.fileUrl;
            }
          } catch (error) {
            console.error('Error regenerating blob URL:', error);
            video.src = currentVideo.fileUrl;
          }
        } else {
          video.src = currentVideo.fileUrl;
        }
        
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

  const searchCastDevices = async () => {
    if (!castSupported) {
      return;
    }

    setIsSearchingDevices(true);
    setCastDevices([]);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 增加搜索时间
      
      // iOS AirPlay 检测
      if (isIOS && isSafari) {
        // 检查当前视频元素是否支持 AirPlay
        if (videoRef.current && 'webkitShowPlaybackTargetPicker' in videoRef.current) {
          setCastDevices([{ 
            id: 'airplay', 
            name: 'AirPlay 设备', 
            type: 'airplay',
            available: true 
          }]);
        } else {
          setCastDevices([]);
        }
      }
      // Android Chrome Cast 检测
      else if (isAndroid && 'presentation' in navigator && 'PresentationRequest' in window) {
        try {
          const presentationUrls = [
            'https://www.gstatic.com/cv/receiver.html',
            'https://cast.google.com/publish/chromecast/sku/receiver'
          ];
          const presentationRequest = new (window as any).PresentationRequest(presentationUrls);
          
          // 尝试获取可用性
          const availability = await presentationRequest.getAvailability();
          if (availability && availability.value) {
            setCastDevices([{ 
              id: 'chromecast', 
              name: 'Chromecast 设备', 
              type: 'chromecast',
              available: true,
              presentationRequest 
            }]);
          } else {
            console.log('No Chromecast devices available');
          }
        } catch (error) {
          console.log('Chromecast detection failed:', error);
          // 即使检测失败，也提供一个选项让用户尝试
          setCastDevices([{ 
            id: 'chromecast-fallback', 
            name: 'Chromecast (尝试连接)', 
            type: 'chromecast-fallback',
            available: false 
          }]);
        }
      }
      // 桌面浏览器的 Remote Playback API
      else if (videoRef.current && 'remote' in videoRef.current) {
        const remote = (videoRef.current as any).remote;
        if (remote.state === 'disconnected') {
          setCastDevices([{ 
            id: 'remote', 
            name: '远程播放设备', 
            type: 'remote',
            available: true 
          }]);
        }
      }
    } catch (error) {
      console.error('Error searching for cast devices:', error);
    } finally {
      setIsSearchingDevices(false);
    }
  };

  const handleCast = async (device: any) => {
    try {
      if (device.type === 'airplay' && videoRef.current && 'webkitShowPlaybackTargetPicker' in videoRef.current) {
        // iOS AirPlay - 需要用户手势触发
        try {
          (videoRef.current as any).webkitShowPlaybackTargetPicker();
          // 注意：AirPlay 连接状态无法直接检测，所以不设置 isCasting
          console.log('AirPlay picker shown');
        } catch (error) {
          console.error('AirPlay picker failed:', error);
          alert('AirPlay 启动失败\n\n请确保：\n• 使用 Safari 浏览器\n• AirPlay 设备已开启\n• 设备在同一 WiFi 网络');
        }
      } else if (device.type === 'chromecast' && device.presentationRequest) {
        // Android Chromecast
        try {
          const connection = await device.presentationRequest.start();
          setIsCasting(true);
          
          connection.addEventListener('close', () => {
            setIsCasting(false);
          });
          
          connection.addEventListener('terminate', () => {
            setIsCasting(false);
          });
        } catch (error) {
          console.error('Chromecast connection failed:', error);
          alert('连接 Chromecast 失败，请确保：\n1. Chromecast 设备已开启\n2. 手机和 Chromecast 在同一 WiFi 网络\n3. Chrome 浏览器版本为最新');
        }
      } else if (device.type === 'chromecast-fallback') {
        // 备用 Chromecast 连接方式
        try {
          const presentationUrls = ['https://www.gstatic.com/cv/receiver.html'];
          const presentationRequest = new (window as any).PresentationRequest(presentationUrls);
          const connection = await presentationRequest.start();
          setIsCasting(true);
          
          connection.addEventListener('close', () => {
            setIsCasting(false);
          });
        } catch (error) {
          console.error('Fallback Chromecast failed:', error);
          alert('投屏连接失败\n\n可能的原因：\n• 没有找到 Chromecast 设备\n• 设备不在同一网络\n• 浏览器版本不支持\n\n建议：\n• 确保 Chromecast 已连接到同一 WiFi\n• 更新 Chrome 浏览器到最新版本\n• 重启 Chromecast 设备');
        }
      } else if (device.type === 'remote' && videoRef.current && 'remote' in videoRef.current) {
        // Remote Playback API
        const remote = (videoRef.current as any).remote;
        await remote.prompt();
        setIsCasting(true);
      }
    } catch (error) {
      console.error('Cast error:', error);
      alert('投屏连接失败，请重试');
    }
    setShowCastMenu(false);
  };

  const disconnectCast = async () => {
    try {
      if (videoRef.current && 'remote' in videoRef.current) {
        const remote = (videoRef.current as any).remote;
        if (remote.state === 'connected') {
          await remote.disconnect();
        }
      }
      setIsCasting(false);
    } catch (error) {
      console.error('Disconnect cast error:', error);
    }
    setShowCastMenu(false);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'new': return '新学习';
      case 'audio': return '音频复习';
      case 'video': return '视频复习';
      default: return '未知';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'new': return 'text-green-600';
      case 'audio': return 'text-yellow-600';
      case 'video': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getReviewMessage = () => {
    if (currentItem.reviewType === 'video' && currentItem.reviewNumber >= 4) {
      return `第${currentItem.reviewNumber}/6次复习，建议观看`;
    }
    return null;
  };

  // 处理返回按钮
  const handleClose = () => {
    console.log('VideoPlayer handleClose - starting cleanup...');
    
    // 保存当前播放进度
    if (currentVideo && currentItem && videoRef.current && !videoError) {
      const video = videoRef.current;
      const currentTime = video.currentTime;
      const duration = video.duration;
      
      if (duration > 0 && currentTime > 10) {
        // 只有播放时间超过10秒才保存进度
        const playlistId = `${currentItem.videoId}_${currentItem.reviewType}_${currentItem.reviewNumber}`;
        const isCompleted = currentTime >= duration * 0.9; // 播放超过90%认为是完成
        
        console.log('退出前保存播放进度:', {
          currentTime,
          duration,
          percentage: (currentTime / duration * 100).toFixed(1) + '%',
          isCompleted
        });
        
        saveProgress(
          currentVideo.id,
          playlistId,
          currentTime,
          duration,
          isCompleted
        );
      }
    }
    
    // 清理定时器
    if (progressSaveTimer.current) {
      clearTimeout(progressSaveTimer.current);
    }
    
    // 立即清理样式，确保滚动恢复
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.height = '';
    document.body.style.width = '';
    document.body.style.touchAction = '';
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    (document.body.style as any).webkitOverflowScrolling = '';
    
    document.documentElement.style.overflow = '';
    document.documentElement.style.height = '';
    document.documentElement.style.position = '';
    
    // 清理定时器
    if (controlsTimer) {
      clearTimeout(controlsTimer);
    }
    
    // 重置视口
    if (window.visualViewport) {
      window.scrollTo(0, 0);
    }
    
    // 强制重新计算布局
    try {
      document.body.offsetHeight;
      document.documentElement.offsetHeight;
    } catch (e) {
      // 忽略错误
    }
    
    console.log('VideoPlayer handleClose - cleanup completed');
    
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

  // 组件卸载时的完整清理
  useEffect(() => {
    return () => {
      console.log('VideoPlayer cleanup started...');
      
      // 1. 清理所有定时器
      if (controlsTimer) {
        clearTimeout(controlsTimer);
      }
      
      if (progressSaveTimer.current) {
        clearTimeout(progressSaveTimer.current);
      }
      
      // 2. 重置body样式
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.height = '';
      document.body.style.width = '';
      document.body.style.touchAction = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      (document.body.style as any).webkitOverflowScrolling = '';
      
      // 3. 重置documentElement样式
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
      document.documentElement.style.position = '';
      
      // 4. 清理视口监听器
      if (window.visualViewport) {
        // 创建一个空函数来移除所有可能的监听器
        const dummyHandler = () => {};
        try {
          window.visualViewport.removeEventListener('resize', dummyHandler);
          window.visualViewport.removeEventListener('scroll', dummyHandler);
        } catch (e) {
          // 忽略错误
        }
      }
      
      // 5. 清理全屏相关监听器
      const dummyHandler = () => {};
      try {
        document.removeEventListener('fullscreenchange', dummyHandler);
        document.removeEventListener('keydown', dummyHandler);
        if (screen.orientation) {
          screen.orientation.removeEventListener('change', dummyHandler);
        }
        window.removeEventListener('orientationchange', dummyHandler);
      } catch (e) {
        // 忽略错误
      }
      
      // 6. 清理用户交互监听器
      try {
        document.removeEventListener('touchstart', dummyHandler);
        document.removeEventListener('click', dummyHandler);
      } catch (e) {
        // 忽略错误
      }
      
      // 7. 重置视口
      if (window.visualViewport) {
        window.scrollTo(0, 0);
      }
      
      // 8. 强制重新计算布局
      try {
        document.body.offsetHeight;
        document.documentElement.offsetHeight;
      } catch (e) {
        // 忽略错误
      }
      
      console.log('VideoPlayer cleanup completed');
    };
  }, [controlsTimer]);

  if (!currentVideo) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
          <div className="mb-6">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">视频文件未找到</h2>
            <p className="text-sm text-gray-600 mb-4">
              播放列表中的视频ID与实际视频不匹配
            </p>
            
            {/* 修复状态显示 */}
            {isFixing && (
              <div className="mb-4 p-3 bg-blue-100 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <RefreshCw className="w-5 h-5 text-blue-600 animate-spin mr-2" />
                  <span className="text-blue-800 font-medium">正在自动修复...</span>
                </div>
                <p className="text-xs text-blue-600">
                  正在尝试修复视频ID匹配和文件URL问题
                </p>
              </div>
            )}
            
            {/* 调试信息 */}
            <div className="text-xs text-gray-500 mb-4 bg-gray-50 p-3 rounded">
              <p className="font-medium mb-2">调试信息：</p>
              <p>当前索引: {currentIndex}</p>
              <p>播放列表项目: {playlist.length}</p>
              <p>视频数量: {videos.length}</p>
              <p>查找的视频ID: {currentItem?.videoId}</p>
              <p>修复状态: {fixAttempted ? '已尝试' : '未尝试'}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* 手动修复按钮 */}
            {!isFixing && (
              <button
                onClick={performAutoFix}
                disabled={isFixing}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg w-full flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {fixAttempted ? '重新修复' : '自动修复'}
              </button>
            )}
            
            {/* 简单修复按钮 */}
            <button
              onClick={() => {
                console.log('尝试简单修复...');
                try {
                  const videos = JSON.parse(localStorage.getItem('videos') || '[]');
                  const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
                  
                  // 简单的ID匹配修复
                  let fixed = false;
                  playlists.forEach((playlist: any) => {
                    playlist.items.forEach((item: any) => {
                      if (item.videoId === currentItem?.videoId) {
                        // 尝试使用第一个可用视频
                        if (videos.length > 0) {
                          item.videoId = videos[0].id;
                          fixed = true;
                        }
                      }
                    });
                  });
                  
                  if (fixed) {
                    localStorage.setItem('playlists', JSON.stringify(playlists));
                    window.location.reload();
                  } else {
                    alert('简单修复失败，请尝试自动修复');
                  }
                } catch (error) {
                  console.error('简单修复失败:', error);
                  alert('简单修复失败，请尝试自动修复');
                }
              }}
              className="bg-green-600 text-white px-6 py-2 rounded-lg w-full hover:bg-green-700 transition-colors"
              disabled={isFixing}
            >
              快速修复
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-600 text-white px-6 py-2 rounded-lg w-full hover:bg-orange-700 transition-colors"
            >
              重新加载页面
            </button>
            
            <button
              onClick={handleClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg w-full hover:bg-gray-700 transition-colors"
            >
              关闭
            </button>
          </div>
          
          <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-2">修复说明：</p>
            <p>• 自动修复：全面修复视频URL和ID匹配问题</p>
            <p>• 快速修复：使用第一个可用视频替换</p>
            <p>• 如果问题持续，请重新添加视频文件</p>
          </div>
        </div>
      </div>
    );
  }

  const reviewMessage = getReviewMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-black rounded-lg overflow-hidden shadow-2xl w-full h-full md:max-w-6xl md:w-full md:mx-4 md:max-h-[90vh] md:h-auto">
        {/* Header */}
        <div className="bg-gray-900 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 md:space-x-6 flex-1 min-w-0">
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-300 p-3 rounded md:hidden"
              title="返回"
            >
              <ArrowLeft size={28} />
            </button>
            <h3 className="text-white font-semibold text-sm md:text-base truncate">{currentVideo.name}</h3>
            <span className={`px-2 py-1 rounded text-xs md:text-sm ${getTypeColor(currentItem.reviewType)} bg-gray-800`}>
              {getTypeText(currentItem.reviewType)}
            </span>
            <span className="text-gray-400 text-xs md:text-sm whitespace-nowrap">
              {currentIndex + 1}/{playlist.length}
            </span>
            {/* 音频模式标签已移除 - 避免与音频/视频切换按钮重复 */}
            {reviewMessage && (
              <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium hidden md:inline">
                {reviewMessage}
              </span>
            )}
            {/* 投屏状态标签已隐藏 - 目前不需要应用内投屏功能 */}
            {/* {isCasting && (
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                <Wifi size={12} className="mr-1" />
                投屏中
              </span>
            )} */}
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* 音频/视频切换按钮 */}
            <button
              onClick={toggleVideoMode}
              className={`px-3 md:px-4 py-2 rounded text-sm md:text-base ${
                audioOnlyMode ? 'bg-yellow-600 text-white' : 'bg-purple-600 text-white'
              }`}
              title={audioOnlyMode ? '切换到视频模式' : '切换到音频模式'}
            >
              {audioOnlyMode ? '🎵' : '📺'}
            </button>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-3 md:px-4 py-2 rounded text-sm md:text-base ${
                autoPlay ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
              title="自动连播"
            >
              自动
            </button>
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="text-white hover:text-gray-300 p-3 rounded"
              title="播放列表"
            >
              <List size={24} />
            </button>
            {/* 投屏按钮已隐藏 - 目前不需要应用内投屏功能 */}
            {/* {!audioOnlyMode && (
              <button
                onClick={() => {
                  setShowCastMenu(!showCastMenu);
                  if (!showCastMenu && castSupported) {
                    searchCastDevices();
                  }
                }}
                className={`p-3 rounded ${isCasting ? 'text-green-400' : 'text-white hover:text-gray-300'}`}
                title="投屏"
              >
                <Cast size={24} />
              </button>
            )} */}
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-300 p-3 rounded hidden md:block"
              title="关闭"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* iOS Safari 自动播放提示 */}
        {isIOS && !userInteracted && (
          <div className="bg-blue-600 px-4 md:px-6 py-2 flex items-center">
            <Play className="text-white mr-2" size={16} />
            <span className="text-white text-sm">点击播放按钮开始观看</span>
          </div>
        )}

        {/* 复习提示 */}
        {reviewMessage && (
          <div className="bg-orange-600 px-4 md:px-6 py-2 flex items-center">
            <AlertCircle className="text-white mr-2" size={16} />
            <span className="text-white text-sm">{reviewMessage}</span>
          </div>
        )}
        
        <div 
          ref={playerRef}
          className={`relative flex-1 ${
            isFullscreen && videoOrientation === 'landscape' 
              ? 'flex items-center justify-center' 
              : ''
          } ${
            isFullscreen && isIOS && isSafari 
              ? 'video-player-fullscreen' 
              : ''
          }`}
          style={{
            // iOS Safari全屏时的样式优化
            ...(isFullscreen && isIOS && isSafari && {
              height: '100vh',
              maxHeight: '100vh',
              minHeight: '100vh',
              width: '100vw',
              maxWidth: '100vw',
              position: 'fixed',
              top: '0',
              left: '0',
              overflow: 'hidden',
              zIndex: '9999'
            })
          }}
          onMouseMove={handleUserActivity}
          onTouchStart={handleUserActivity}
          onClick={handleUserActivity}
        >
          {/* Video/Audio Display */}
          {videoError ? (
            <div className="w-full h-full md:aspect-video bg-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-800 p-4">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
                <p className="text-lg mb-2">视频加载失败</p>
                <p className="text-sm text-gray-600 mb-2">
                  重试次数: {retryCount}/3
                </p>
                {AndroidVideoUtils.isAndroid() && (
                  <p className="text-xs text-orange-600 mb-3">
                    Android设备提示：可能需要多次重试才能成功加载
                  </p>
                )}
                <div className="space-y-2">
                  <button
                    onClick={retryVideo}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mr-2"
                    disabled={retryCount >= 3}
                  >
                    {retryCount >= 3 ? '重试次数已用完' : '重试'}
                  </button>
                  <button
                    onClick={goToNext}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                    disabled={currentIndex >= playlist.length - 1}
                  >
                    跳过此视频
                  </button>
                </div>
                {AndroidVideoUtils.isAndroid() && retryCount >= 3 && (
                  <p className="text-xs text-gray-500 mt-3">
                    建议：重新选择文件或尝试其他格式的视频
                  </p>
                )}
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10">
                  <div className="text-gray-800 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p>正在加载视频...</p>
                    {isIOS && (
                      <p className="text-sm text-gray-600 mt-2">iOS 设备可能需要手动点击播放</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* 音频模式显示 */}
              {audioOnlyMode && (
                <div className="w-full h-full md:aspect-video bg-gradient-to-br from-yellow-900 to-yellow-700 flex items-center justify-center">
                  <div className="text-center text-white p-8">
                    <div className="text-6xl mb-6">🎵</div>
                    <h2 className="text-2xl font-bold mb-2">{currentVideo.name}</h2>
                    <p className="text-yellow-200 mb-4">音频复习模式</p>
                    <button
                      onClick={toggleVideoMode}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center mx-auto"
                    >
                      <VideoIcon size={20} className="mr-2" />
                      切换到视频模式
                    </button>
                  </div>
                </div>
              )}
              
              <video
                ref={videoRef}
                className={`w-full h-full md:aspect-video bg-white ${audioOnlyMode ? 'hidden' : 'block'} ${
                  isFullscreen && videoOrientation === 'landscape' 
                    ? 'object-cover' 
                    : 'object-contain'
                }`}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleVideoEnded}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                playsInline={true}
                preload={isIOS && isSafari ? 'auto' : 'metadata'}
                controls={false}
                style={{ 
                  objectFit: isFullscreen && videoOrientation === 'landscape' ? 'cover' : 'contain',
                  transform: isFullscreen && videoOrientation === 'landscape' && isMobile ? 'rotate(0deg)' : 'none',
                  // iOS Safari全屏时确保视频完整显示
                  ...(isFullscreen && isIOS && isSafari && {
                    height: '100%',
                    width: '100%',
                    maxHeight: '100%',
                    maxWidth: '100%'
                  })
                }}
                webkit-playsinline="true"
                x-webkit-airplay="deny"
                disablePictureInPicture={true}
                autoPlay={false}
                muted={false}
              />
            </>
          )}
          
          {/* Controls Overlay */}
          {!videoError && (
            <div className={`absolute left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            } ${
              // 横版视频全屏时的特殊样式 - 移动端
              isFullscreen && videoOrientation === 'landscape' && isMobile
                ? 'bottom-[env(safe-area-inset-bottom,0px)] pb-6 px-8 pt-8'
                : // 横版视频全屏时的特殊样式 - 桌面端
                isFullscreen && videoOrientation === 'landscape' && !isMobile
                ? 'bottom-0 pb-8 px-8 pt-8'
                : 'bottom-0 p-3 md:p-4'
            }`} style={{ 
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              // 横版视频全屏时额外的底部间距，避免被浏览器导航栏遮挡
              ...(isFullscreen && videoOrientation === 'landscape' && isMobile && {
                paddingBottom: 'max(24px, env(safe-area-inset-bottom, 0px))',
                minHeight: '120px'
              }),
              // 桌面版本的特殊样式
              ...(isFullscreen && videoOrientation === 'landscape' && !isMobile && {
                minHeight: '100px'
              })
            }}>
              {/* Progress Bar */}
              <div className={`${
                isFullscreen && videoOrientation === 'landscape'
                  ? 'mb-6'
                  : 'mb-3 md:mb-4'
              }`}>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className={`w-full bg-gray-600 rounded-lg appearance-none cursor-pointer slider ${
                    isFullscreen && videoOrientation === 'landscape'
                      ? 'h-2'
                      : 'h-1'
                  }`}
                />
                <div className={`flex justify-between text-white mt-1 ${
                  isFullscreen && videoOrientation === 'landscape'
                    ? 'text-base'
                    : 'text-xs md:text-sm'
                }`}>
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className={`flex items-center ${
                  isFullscreen && videoOrientation === 'landscape'
                    ? 'space-x-8'
                    : 'space-x-4 md:space-x-6'
                }`}>
                  <button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className={`text-white rounded-full hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFullscreen && videoOrientation === 'landscape'
                        ? 'p-6'
                        : 'p-4'
                    }`}
                  >
                    <SkipBack size={isFullscreen && videoOrientation === 'landscape' ? 40 : 32} />
                  </button>
                  
                  <button
                    onClick={togglePlay}
                    className={`bg-white/20 text-white rounded-full hover:bg-white/30 transition-all ${
                      isFullscreen && videoOrientation === 'landscape'
                        ? 'p-6'
                        : 'p-4 md:p-5'
                    }`}
                    disabled={isLoading}
                  >
                    {isPlaying ? (
                      <Pause size={isFullscreen && videoOrientation === 'landscape' ? 44 : 36} />
                    ) : (
                      <Play size={isFullscreen && videoOrientation === 'landscape' ? 44 : 36} />
                    )}
                  </button>
                  
                  <button
                    onClick={goToNext}
                    disabled={currentIndex === playlist.length - 1}
                    className={`text-white rounded-full hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFullscreen && videoOrientation === 'landscape'
                        ? 'p-6'
                        : 'p-4'
                    }`}
                  >
                    <SkipForward size={isFullscreen && videoOrientation === 'landscape' ? 40 : 32} />
                  </button>
                </div>
                
                <div className={`flex items-center ${
                  isFullscreen && videoOrientation === 'landscape'
                    ? 'space-x-8'
                    : 'space-x-4 md:space-x-6'
                }`}>
                  {!audioOnlyMode && (
                  <button
                    onClick={handleClose}
                    className={`text-white rounded-full hover:bg-white/20 transition-all block ${
                      isFullscreen && videoOrientation === 'landscape'
                        ? 'p-6'
                        : 'p-4'
                    }`}
                  >
                    <X size={isFullscreen && videoOrientation === 'landscape' ? 40 : 32} />
                  </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cast Menu - 已隐藏，目前不需要应用内投屏功能 */}
        {/* {showCastMenu && !audioOnlyMode && (
          <div className="absolute top-16 right-4 bg-gray-800 rounded-lg p-4 shadow-lg z-10 max-w-xs">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-white font-semibold">投屏设备</h4>
              <button
                onClick={() => setShowCastMenu(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            
            {!castSupported ? (
              <div className="text-center py-4">
                <AlertCircle className="text-red-400 mx-auto mb-2" size={24} />
                <p className="text-red-300 text-sm mb-2">投屏不支持</p>
                <p className="text-gray-300 text-xs">{castError}</p>
              </div>
            ) : (
              <>
                {isCasting && (
                  <div className="mb-3">
                    <button
                      onClick={disconnectCast}
                      className="w-full text-left bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
                    >
                      断开投屏连接
                    </button>
                  </div>
                )}
                
                <div className="space-y-2">
                  {isSearchingDevices ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                      <p className="text-gray-300 text-sm">搜索设备中...</p>
                    </div>
                  ) : castDevices.length > 0 ? (
                    castDevices.map((device) => (
                      <button
                        key={device.id}
                        onClick={() => handleCast(device)}
                        className="w-full text-left bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded text-sm flex items-center"
                      >
                        <Cast size={16} className="mr-2" />
                        {device.name}
                        {!device.available && (
                          <span className="ml-auto text-xs text-yellow-400">尝试</span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-300 text-sm mb-2">
                        {isIOS ? '未检测到 AirPlay 设备' : '未找到可用设备'}
                      </p>
                      <button
                        onClick={searchCastDevices}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                      >
                        重新搜索
                      </button>
                      {isIOS && (
                        <p className="text-gray-400 text-xs mt-2">
                          确保 AirPlay 设备已开启并在同一网络
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
            
            <div className="text-gray-300 text-xs mt-3 border-t border-gray-600 pt-3">
              <p className="mb-1">设备要求：</p>
              {isIOS ? (
                <>
                  <p>• iOS Safari 浏览器</p>
                  <p>• AirPlay 兼容设备</p>
                  <p>• 同一 WiFi 网络</p>
                </>
              ) : (
                <>
                  <p>• Android 5.0+ Chrome 66+</p>
                  <p>• 设备需在同一 WiFi 网络</p>
                  {isAndroid && (
                    <p className="text-yellow-300 mt-2">
                      当前：Android {androidVersion} Chrome {chromeVersion}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )} */}

        {/* Playlist Sidebar */}
        {showPlaylist && (
          <div className="absolute top-0 right-0 w-full md:w-80 h-full bg-gray-900 border-l border-gray-700 overflow-y-auto z-20">
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h4 className="text-white font-semibold">播放列表</h4>
              <button
                onClick={() => setShowPlaylist(false)}
                className="text-white hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-2">
              {playlist.map((item, index) => {
                const video = videos.find(v => v.id === item.videoId);
                const isActive = index === currentIndex;
                const isCompleted = index < currentIndex;
                
                return (
                  <button
                    key={index}
                    onClick={() => jumpToItem(index)}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : isCompleted
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {index + 1}. {video?.name || 'Unknown'}
                      </span>
                      {isCompleted && <span className="text-green-400">✓</span>}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {getTypeText(item.reviewType)}
                      {item.reviewNumber >= 4 && (
                        <span className="ml-2 bg-orange-500 px-1 rounded text-white">
                          建议观看
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
        }
        
        /* 横版视频全屏时的滑动条样式 */
        .slider.h-2::-webkit-slider-thumb {
          height: 20px;
          width: 20px;
        }
        
        .slider.h-2::-moz-range-thumb {
          height: 20px;
          width: 20px;
        }
        
        /* 避免浏览器底部导航栏遮挡 */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .landscape-controls {
            padding-bottom: max(24px, env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
};