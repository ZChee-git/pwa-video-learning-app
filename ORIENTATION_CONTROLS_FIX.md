# 屏幕旋转控制栏隐藏修复

## 问题描述
竖屏时播放工具栏能正常自动消失，但旋转手机到横屏后，工具栏出现后没有自动消失。

## 问题分析
1. **原因**: 屏幕方向改变时，原有的控制栏隐藏计时器没有重新启动
2. **触发条件**: 
   - 视频在全屏模式下播放
   - 设备从竖屏旋转到横屏（或反之）
   - 控制栏显示但不自动隐藏

## 解决方案

### 1. 增强屏幕方向变化处理
```typescript
const handleOrientationChange = () => {
  const orientation = screen.orientation?.angle;
  console.log('Screen orientation changed:', orientation);
  
  // 屏幕方向改变时，如果在全屏模式下播放视频，重新启动控制栏隐藏计时器
  if (isFullscreen && !audioOnlyMode && isPlaying && videoRef.current && !videoRef.current.paused) {
    // 先显示控制栏
    setShowControls(true);
    
    // 清除现有计时器
    if (controlsTimer) {
      clearTimeout(controlsTimer);
    }
    
    // 启动新的隐藏计时器
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 2000);
    setControlsTimer(timer);
  }
};
```

### 2. 添加窗口大小变化处理
```typescript
const handleResize = () => {
  // 窗口大小改变时也处理控制栏
  if (isFullscreen && !audioOnlyMode && isPlaying && videoRef.current && !videoRef.current.paused) {
    setShowControls(true);
    
    if (controlsTimer) {
      clearTimeout(controlsTimer);
    }
    
    const timer = setTimeout(() => {
      setShowControls(false);
    }, 2000);
    setControlsTimer(timer);
  }
};
```

### 3. 监听多种屏幕变化事件
```typescript
// 监听屏幕方向和尺寸变化
window.addEventListener('orientationchange', handleOrientationChange);
window.addEventListener('resize', handleResize);
screen.orientation?.addEventListener('change', handleOrientationChange);
```

### 4. 更新useEffect依赖项
```typescript
}, [isFullscreen, audioOnlyMode, isPlaying, controlsTimer]);
```

## 技术细节

### 事件监听策略
- **orientationchange**: 监听设备方向变化
- **resize**: 监听窗口大小变化
- **screen.orientation.change**: 监听屏幕方向API变化

### 触发条件检查
1. `isFullscreen`: 必须在全屏模式下
2. `!audioOnlyMode`: 非音频模式
3. `isPlaying`: 视频正在播放
4. `!videoRef.current.paused`: 视频未暂停

### 控制栏处理逻辑
1. **立即显示**: 屏幕变化时先显示控制栏
2. **清除旧计时器**: 避免多个计时器冲突
3. **启动新计时器**: 2秒后隐藏控制栏

## 测试场景

### 测试步骤
1. 在竖屏状态下开始播放视频
2. 验证控制栏2秒后自动隐藏
3. 旋转设备到横屏
4. 观察控制栏是否在显示后2秒自动隐藏

### 预期结果
- ✅ 竖屏播放时控制栏正常隐藏
- ✅ 旋转到横屏后控制栏显示
- ✅ 横屏状态下控制栏2秒后自动隐藏
- ✅ 反向旋转（横屏→竖屏）也正常工作

### 边界情况测试
- 快速连续旋转设备
- 旋转过程中暂停/播放视频
- 不同设备的方向变化
- 浏览器窗口大小变化

## 用户体验改进

### 优化前
1. 竖屏播放 → 控制栏自动隐藏 ✅
2. 旋转到横屏 → 控制栏出现 ✅
3. 横屏状态 → 控制栏不自动隐藏 ❌

### 优化后
1. 竖屏播放 → 控制栏自动隐藏 ✅
2. 旋转到横屏 → 控制栏出现 ✅
3. 横屏状态 → 控制栏2秒后自动隐藏 ✅
4. 任何方向变化 → 控制栏行为一致 ✅

## 性能考虑

### 事件监听优化
- 使用useCallback避免函数重复创建
- 正确清理事件监听器
- 依赖项优化，避免不必要的重新绑定

### 计时器管理
- 清除旧计时器防止内存泄漏
- 条件检查避免不必要的计时器创建
- 状态更新优化

## 兼容性

### 支持的事件
- **orientationchange**: iOS/Android广泛支持
- **resize**: 所有现代浏览器支持
- **screen.orientation.change**: 现代浏览器支持

### 降级处理
- 如果screen.orientation不可用，仍可通过orientationchange和resize处理
- 多事件监听确保兼容性

这个修复确保了视频播放器在所有屏幕方向变化情况下都能提供一致的控制栏自动隐藏体验。
