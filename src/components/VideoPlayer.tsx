import React, { useState, useRef, useEffect } from 'react';
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
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentItem = playlist[currentIndex];
  const currentVideo = videos.find(v => v.id === currentItem?.videoId);

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

  // 控制栏自动隐藏逻辑
  useEffect(() => {
    if (!isPlaying || showPlaylist || showCastMenu) {
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
  }, [isPlaying, showPlaylist, showCastMenu, controlsTimeout]);

  // 鼠标移动时显示控制栏
  const handleMouseMove = () => {
    if (isPlaying && !showPlaylist && !showCastMenu) {
      setShowControls(true);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
      }
      const timeout = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      setControlsTimeout(timeout);
    }
  };

  // 视频容器点击时切换控制栏显示
  const handleVideoClick = () => {
    // 防止在播放列表或投屏菜单打开时触发
    if (showPlaylist || showCastMenu) return;
    
    // 切换播放状态
    togglePlay();
    
    // 如果是播放状态，切换控制栏显示
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
    } else {
      // 暂停时始终显示控制栏
      setShowControls(true);
      if (controlsTimeout) {
        clearTimeout(controlsTimeout);
        setControlsTimeout(null);
      }
    }
  };

  useEffect(() => {
    if (videoRef.current && currentVideo) {
      setVideoError(false);
      setIsLoading(true);
      setRetryCount(0);
      
      // 重置视频元素
      const video = videoRef.current;
      video.src = '';
      video.load();
      
      // 设置新的视频源
      video.src = currentVideo.fileUrl;
      
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
        
        // 自动播放逻辑
        if (autoPlay && currentIndex >= initialIndex && userInteracted) {
          setTimeout(() => {
            if (!videoError && video.readyState >= 2) {
              const playPromise = video.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    // Auto-play successful
                  })
                  .catch(() => {
                    // Auto-play failed, user interaction required
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

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current && !audioOnlyMode) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen().catch(error => {
          console.error('Fullscreen failed:', error);
        });
      }
    }
  };

  const toggleVideoMode = () => {
    setAudioOnlyMode(!audioOnlyMode);
  };

  const goToNext = () => {
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(false);
      setVideoError(false);
    } else {
      onPlaylistComplete();
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(false);
      setVideoError(false);
    }
  };

  const jumpToItem = (index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
    setShowPlaylist(false);
    setVideoError(false);
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
      return `第${currentItem.reviewNumber}/5次复习，建议观看`;
    }
    return null;
  };

  // 处理返回按钮
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

  const reviewMessage = getReviewMessage();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50">
      <div className="bg-black rounded-lg overflow-hidden shadow-2xl w-full h-full md:max-w-6xl md:w-full md:mx-4 md:max-h-[90vh] md:h-auto">
        {/* Header */}
        <div className={`bg-gray-900 px-4 md:px-6 py-3 md:py-4 flex justify-between items-center transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
        }`}>
          <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-300 p-2 rounded md:hidden"
              title="返回"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="text-white font-semibold text-sm md:text-base truncate">{currentVideo.name}</h3>
            <span className={`px-2 py-1 rounded text-xs md:text-sm ${getTypeColor(currentItem.reviewType)} bg-gray-800`}>
              {getTypeText(currentItem.reviewType)}
            </span>
            <span className="text-gray-400 text-xs md:text-sm whitespace-nowrap">
              {currentIndex + 1}/{playlist.length}
            </span>
            {audioOnlyMode && (
              <span className="bg-yellow-600 text-white px-2 py-1 rounded text-xs font-medium">
                音频模式
              </span>
            )}
            {reviewMessage && (
              <span className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-medium hidden md:inline">
                {reviewMessage}
              </span>
            )}
            {isCasting && (
              <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-medium flex items-center">
                <Wifi size={12} className="mr-1" />
                投屏中
              </span>
            )}
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            {/* 音频/视频切换按钮 */}
            <button
              onClick={toggleVideoMode}
              className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm ${
                audioOnlyMode ? 'bg-yellow-600 text-white' : 'bg-purple-600 text-white'
              }`}
              title={audioOnlyMode ? '切换到视频模式' : '切换到音频模式'}
            >
              {audioOnlyMode ? '🎵' : '📺'}
            </button>
            <button
              onClick={() => setAutoPlay(!autoPlay)}
              className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm ${
                autoPlay ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
              }`}
              title="自动连播"
            >
              自动
            </button>
            <button
              onClick={() => setShowPlaylist(!showPlaylist)}
              className="text-white hover:text-gray-300 p-2 rounded"
              title="播放列表"
            >
              <List size={18} />
            </button>
            {!audioOnlyMode && (
              <button
                onClick={() => {
                  setShowCastMenu(!showCastMenu);
                  if (!showCastMenu && castSupported) {
                    searchCastDevices();
                  }
                }}
                className={`p-2 rounded ${isCasting ? 'text-green-400' : 'text-white hover:text-gray-300'}`}
                title="投屏"
              >
                <Cast size={18} />
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-300 p-2 rounded hidden md:block"
              title="关闭"
            >
              <X size={18} />
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
        
        <div className="relative flex-1" 
             onMouseMove={handleMouseMove}
             onMouseLeave={() => setShowControls(false)}
             onClick={handleVideoClick}>
          {/* Video/Audio Display */}
          {videoError ? (
            <div className="w-full h-full md:aspect-video bg-gray-800 flex items-center justify-center">
              <div className="text-center text-white p-4">
                <AlertCircle size={48} className="mx-auto mb-4 text-red-400" />
                <p className="text-lg mb-2">视频加载失败</p>
                <p className="text-sm text-gray-300 mb-4">
                  重试次数: {retryCount}/3
                </p>
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
              </div>
            </div>
          ) : (
            <>
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>正在加载视频...</p>
                    {isIOS && (
                      <p className="text-sm text-gray-300 mt-2">iOS 设备可能需要手动点击播放</p>
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
                className={`w-full h-full md:aspect-video bg-black ${audioOnlyMode ? 'hidden' : 'block'}`}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={handleVideoEnded}
                onTimeUpdate={handleTimeUpdate}
                playsInline={true}
                preload={isIOS && isSafari ? 'auto' : 'metadata'}
                controls={false}
                style={{ objectFit: 'contain' }}
                webkit-playsinline="true"
              />
            </>
          )}
          
          {/* Controls Overlay */}
          {!videoError && (
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 md:p-4 transition-all duration-300 ${
              showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full pointer-events-none'
            }`}
            onClick={(e) => e.stopPropagation()}>
              {/* Progress Bar */}
              <div className="mb-3 md:mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-white text-xs md:text-sm mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              
              {/* Control Buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 md:space-x-3">
                  <button
                    onClick={goToPrevious}
                    disabled={currentIndex === 0}
                    className="text-white p-2 rounded-full hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipBack size={18} />
                  </button>
                  
                  <button
                    onClick={togglePlay}
                    className="bg-white/20 text-white p-2 md:p-3 rounded-full hover:bg-white/30 transition-all"
                    disabled={isLoading}
                  >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                  </button>
                  
                  <button
                    onClick={goToNext}
                    disabled={currentIndex === playlist.length - 1}
                    className="text-white p-2 rounded-full hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <SkipForward size={18} />
                  </button>
                </div>
                
                <div className="flex items-center space-x-2 md:space-x-3">
                  <button
                    onClick={toggleMute}
                    className="text-white p-2 rounded-full hover:bg-white/20 transition-all"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  
                  {!audioOnlyMode && (
                    <button
                      onClick={toggleFullscreen}
                      className="text-white p-2 rounded-full hover:bg-white/20 transition-all hidden md:block"
                    >
                      <Maximize size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cast Menu */}
        {showCastMenu && !audioOnlyMode && (
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
        )}

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
      
      <style dangerouslySetInnerHTML={{
        __html: `
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
        `
      }} />
    </div>
  );
};