// 测试文件：验证横屏视频全屏功能
import { VideoPlayer } from './VideoPlayer';

// 测试数据
const testPlaylist = [
  {
    id: 'test-1',
    videoId: 'video-1',
    reviewType: 'initial' as const,
    difficulty: 'easy' as const,
    nextReviewTime: new Date()
  }
];

const testVideos = [
  {
    id: 'video-1',
    name: '测试横屏视频',
    url: 'test-video.mp4',
    createdAt: new Date(),
    size: 1024 * 1024,
    duration: 60
  }
];

// 使用说明：
// 1. 当视频加载完成后，系统会自动检测视频的宽高比
// 2. 如果视频宽度 > 高度（横屏视频），在移动设备上会自动进入全屏模式
// 3. 全屏后会尝试锁定屏幕方向为横屏
// 4. 播放开始2秒后，控制栏会自动隐藏
// 5. 用户触摸屏幕时，控制栏会重新显示，并在3秒后再次隐藏

export default function TestVideoPlayer() {
  return (
    <VideoPlayer
      playlist={testPlaylist}
      videos={testVideos}
      onClose={() => console.log('Player closed')}
      onPlaylistComplete={() => console.log('Playlist completed')}
      initialIndex={0}
      isAudioMode={false}
    />
  );
}
