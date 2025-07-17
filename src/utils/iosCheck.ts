// iOS Safari 兼容性检查
export const isIOSSafari = (): boolean => {
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  const webkit = /WebKit/.test(ua);
  const chrome = /CriOS|Chrome/.test(ua);
  
  return iOS && webkit && !chrome;
};

export const iosCompatibilityCheck = (): void => {
  if (isIOSSafari()) {
    console.log('iOS Safari detected - applying compatibility fixes');
    
    // 修复 iOS Safari 的一些问题
    document.addEventListener('touchstart', () => {}, { passive: true });
    
    // 防止 iOS Safari 的缩放
    document.addEventListener('gesturestart', (e) => {
      e.preventDefault();
    });
    
    // 修复 iOS Safari 的 viewport 问题
    const viewport = document.querySelector('meta[name=viewport]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
  }
};
