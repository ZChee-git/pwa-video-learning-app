// Android视频兼容性工具函数
export const AndroidVideoUtils = {
  // 检查是否为Android设备
  isAndroid: () => /Android/i.test(navigator.userAgent),
  
  // 检查Android Chrome版本
  getChromeVersion: () => {
    const match = navigator.userAgent.match(/Chrome\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  },
  
  // 检查视频格式支持
  checkVideoSupport: (videoElement: HTMLVideoElement) => {
    return {
      mp4: videoElement.canPlayType('video/mp4'),
      webm: videoElement.canPlayType('video/webm'),
      ogg: videoElement.canPlayType('video/ogg'),
      h264: videoElement.canPlayType('video/mp4; codecs="avc1.42E01E"'),
      hevc: videoElement.canPlayType('video/mp4; codecs="hvc1"')
    };
  },
  
  // 处理Android特定的blob URL问题
  handleAndroidBlobUrl: async (file: File): Promise<string> => {
    try {
      // 对于Android设备，尝试创建更稳定的blob URL
      const blob = new Blob([file], { type: file.type });
      const url = URL.createObjectURL(blob);
      
      // 验证URL是否有效
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Blob URL validation failed: ${response.status}`);
      }
      
      return url;
    } catch (error) {
      console.error('Android blob URL creation failed:', error);
      throw error;
    }
  },
  
  // 获取推荐的视频设置
  getRecommendedVideoSettings: () => {
    const chromeVersion = AndroidVideoUtils.getChromeVersion();
    
    return {
      preload: 'metadata' as const, // Android设备推荐使用metadata预加载
      crossOrigin: 'anonymous' as const,
      playsInline: true,
      // 老版本Chrome可能需要特殊处理
      requiresUserGesture: chromeVersion && chromeVersion < 66
    };
  },
  
  // 重试加载视频的策略
  retryVideoLoad: async (videoElement: HTMLVideoElement, src: string, maxRetries: number = 3): Promise<boolean> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        videoElement.src = '';
        videoElement.load();
        
        // 等待一小段时间
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
        
        videoElement.src = src;
        
        // 等待视频加载
        await new Promise((resolve, reject) => {
          const onCanPlay = () => {
            videoElement.removeEventListener('canplay', onCanPlay);
            videoElement.removeEventListener('error', onError);
            resolve(true);
          };
          
          const onError = (error: any) => {
            videoElement.removeEventListener('canplay', onCanPlay);
            videoElement.removeEventListener('error', onError);
            reject(error);
          };
          
          videoElement.addEventListener('canplay', onCanPlay);
          videoElement.addEventListener('error', onError);
          
          videoElement.load();
        });
        
        return true;
      } catch (error) {
        console.error(`Android video load attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) {
          throw error;
        }
      }
    }
    
    return false;
  }
};
