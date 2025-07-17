# 横屏视频自动全屏功能

## 功能概述

新增了智能的横屏视频播放功能，专门优化了移动设备上横屏视频的观看体验。

## 主要特性

### 1. 自动方向检测
- 系统会自动检测视频的宽高比
- 当视频宽度 > 高度时，识别为横屏视频
- 当视频高度 > 宽度时，识别为竖屏视频

### 2. 智能全屏模式
- 横屏视频在移动设备上会自动进入全屏模式
- 全屏后视频会填充整个屏幕空间
- 使用 `object-fit: cover` 确保视频完整覆盖屏幕

### 3. 屏幕方向锁定
- 横屏视频全屏时会自动锁定设备为横屏方向
- 防止用户意外旋转设备影响观看体验
- 退出全屏时自动解锁屏幕方向

### 4. 控制栏自动隐藏
- 播放开始2秒后，控制栏会自动淡出隐藏
- 用户触摸屏幕时，控制栏会重新显示
- 重新显示后3秒内无操作，控制栏再次隐藏
- 暂停或非全屏状态下，控制栏保持显示

### 5. 用户交互优化
- 支持鼠标和触摸操作
- 用户活动会重置隐藏计时器
- 平滑的淡入淡出过渡效果

## 技术实现

### 核心状态管理
```typescript
const [showControls, setShowControls] = useState(true);
const [isLandscape, setIsLandscape] = useState(false);
const [isFullscreen, setIsFullscreen] = useState(false);
const [videoOrientation, setVideoOrientation] = useState<'portrait' | 'landscape'>('portrait');
```

### 视频方向检测
```typescript
useEffect(() => {
  const handleLoadedMetadata = () => {
    const { videoWidth, videoHeight } = video;
    const orientation = videoWidth > videoHeight ? 'landscape' : 'portrait';
    setVideoOrientation(orientation);
    
    // 横屏视频自动全屏
    if (orientation === 'landscape' && isMobile && !isFullscreen) {
      setTimeout(() => {
        enterFullscreen();
      }, 500);
    }
  };
}, [currentIndex, currentVideo, audioOnlyMode, isMobile, isFullscreen]);
```

### 屏幕方向锁定
```typescript
const enterFullscreen = async () => {
  try {
    if (playerRef.current) {
      await playerRef.current.requestFullscreen();
      
      // 横屏视频锁定为横屏
      if (videoOrientation === 'landscape' && isMobile) {
        if (screen.orientation && 'lock' in screen.orientation) {
          await (screen.orientation as any).lock('landscape');
        }
      }
    }
  } catch (error) {
    console.error('Fullscreen failed:', error);
  }
};
```

### 控制栏自动隐藏
```typescript
useEffect(() => {
  if (isPlaying && isFullscreen && !audioOnlyMode) {
    // 播放开始2秒后隐藏控制栏
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 2000);
    
    setControlsTimer(timer);
  } else {
    setShowControls(true);
    if (controlsTimer) {
      clearTimeout(controlsTimer);
      setControlsTimer(null);
    }
  }
}, [isPlaying, isFullscreen, audioOnlyMode, controlsTimer]);
```

## 兼容性

### 支持的设备
- ✅ iOS Safari (iPhone/iPad)
- ✅ Android Chrome
- ✅ Android Firefox
- ✅ 桌面浏览器 (Chrome, Firefox, Safari, Edge)

### 浏览器API支持
- Fullscreen API
- Screen Orientation API (移动设备)
- Media Queries (屏幕方向检测)

## 使用体验

1. **横屏视频加载**：视频加载完成后自动检测为横屏
2. **自动全屏**：在移动设备上自动进入全屏模式
3. **屏幕旋转**：设备屏幕自动旋转为横屏方向
4. **沉浸式观看**：控制栏自动隐藏，提供沉浸式体验
5. **便捷操作**：触摸屏幕可快速调出控制栏

## 开发说明

### 新增的状态变量
- `showControls`: 控制栏显示状态
- `isLandscape`: 设备横屏检测
- `isFullscreen`: 全屏状态
- `videoOrientation`: 视频方向 ('portrait' | 'landscape')
- `controlsTimer`: 控制栏隐藏定时器

### 主要函数
- `enterFullscreen()`: 进入全屏并锁定方向
- `exitFullscreen()`: 退出全屏并解锁方向
- `handleUserActivity()`: 处理用户活动，重置隐藏计时器

### 视频样式优化
- 全屏横屏时使用 `object-fit: cover`
- 普通模式使用 `object-fit: contain`
- 响应式布局适配不同屏幕尺寸

这个功能极大提升了移动设备上横屏视频的观看体验，让用户可以享受电影级的沉浸式播放效果。
