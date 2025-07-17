// 测试Android视频播放修复的脚本
console.log('=== Android Video Playback Test ===');

// 测试1: UUID生成
console.log('\n1. Testing UUID generation...');
import { generateUUID } from './utils/uuid';

for (let i = 0; i < 3; i++) {
  console.log(`UUID ${i + 1}:`, generateUUID());
}

// 测试2: 数据一致性检查
console.log('\n2. Testing data consistency...');
import { DataConsistencyUtils } from './utils/dataConsistencyUtils';

const testPlaylist = [
  { videoId: 'video-1', reviewType: 'new', reviewNumber: 1 },
  { videoId: 'video-2', reviewType: 'new', reviewNumber: 1 },
  { videoId: 'missing-id', reviewType: 'new', reviewNumber: 1 }
];

const testVideos = [
  { id: 'video-1', name: 'Video 1', fileUrl: 'blob:test1' },
  { id: 'video-2', name: 'Video 2', fileUrl: 'blob:test2' }
];

const issues = DataConsistencyUtils.checkPlaylistVideoConsistency(testPlaylist, testVideos);
console.log('Consistency issues:', issues);

const repairedPlaylist = DataConsistencyUtils.repairPlaylistData(testPlaylist, testVideos);
console.log('Repaired playlist:', repairedPlaylist);

// 测试3: Android兼容性
console.log('\n3. Testing Android compatibility...');
import { AndroidVideoUtils } from './utils/androidVideoUtils';

console.log('Is Android:', AndroidVideoUtils.isAndroid());
console.log('Chrome version:', AndroidVideoUtils.getChromeVersion());

// 测试4: 文件URL创建
console.log('\n4. Testing file URL creation...');
try {
  const testBlob = new Blob(['test'], { type: 'text/plain' });
  const testUrl = URL.createObjectURL(testBlob);
  console.log('Test blob URL created:', testUrl);
  URL.revokeObjectURL(testUrl);
  console.log('Test blob URL revoked');
} catch (error) {
  console.error('File URL creation failed:', error);
}

console.log('\n=== Test Complete ===');
