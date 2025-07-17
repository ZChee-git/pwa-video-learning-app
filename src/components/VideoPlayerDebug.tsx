import React, { useState } from 'react';
import { Play, Settings, Download, Trash2, RefreshCw } from 'lucide-react';
import { VideoPlayer } from './VideoPlayer';

interface VideoPlayerDebugProps {
  onClose: () => void;
}

export const VideoPlayerDebug: React.FC<VideoPlayerDebugProps> = ({ onClose }) => {
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [debugVideos, setDebugVideos] = useState<any[]>([]);
  const [debugPlaylist, setDebugPlaylist] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // 生成测试视频数据
  const generateTestVideos = () => {
    const testVideos = [
      {
        id: 'debug-video-1',
        name: '测试视频1 - 风景.mp4',
        file: null, // 实际测试时需要真实文件
        fileUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        dateAdded: new Date(),
        reviewCount: 0,
        status: 'new',
        collectionId: 'debug-collection-1'
      },
      {
        id: 'debug-video-2',
        name: '测试视频2 - 动物.mp4',
        file: null,
        fileUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        dateAdded: new Date(),
        reviewCount: 1,
        status: 'learning',
        collectionId: 'debug-collection-1'
      },
      {
        id: 'debug-video-3',
        name: '测试视频3 - 科技.mp4',
        file: null,
        fileUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
        dateAdded: new Date(),
        reviewCount: 3,
        status: 'learning',
        collectionId: 'debug-collection-2'
      }
    ];

    const testPlaylist = [
      {
        videoId: 'debug-video-1',
        reviewType: 'new',
        reviewNumber: 1,
        daysSinceFirstPlay: 0
      },
      {
        videoId: 'debug-video-2',
        reviewType: 'audio',
        reviewNumber: 2,
        daysSinceFirstPlay: 1
      },
      {
        videoId: 'debug-video-3',
        reviewType: 'video',
        reviewNumber: 4,
        daysSinceFirstPlay: 7
      }
    ];

    setDebugVideos(testVideos);
    setDebugPlaylist(testPlaylist);
    
    console.log('🎬 调试数据生成完成');
    console.log('调试视频:', testVideos);
    console.log('调试播放列表:', testPlaylist);
  };

  // 从用户设备获取真实文件进行测试
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsGenerating(true);
    
    const newDebugVideos: any[] = [];
    const newDebugPlaylist: any[] = [];

    Array.from(files).forEach((file, index) => {
      const videoId = `debug-video-real-${index + 1}`;
      const fileUrl = URL.createObjectURL(file);
      
      const video = {
        id: videoId,
        name: file.name,
        file: file,
        fileUrl: fileUrl,
        dateAdded: new Date(),
        reviewCount: index,
        status: index === 0 ? 'new' : 'learning',
        collectionId: 'debug-collection-real'
      };

      const playlistItem = {
        videoId: videoId,
        reviewType: index === 0 ? 'new' : index === 1 ? 'audio' : 'video',
        reviewNumber: index + 1,
        daysSinceFirstPlay: index
      };

      newDebugVideos.push(video);
      newDebugPlaylist.push(playlistItem);
    });

    setDebugVideos(newDebugVideos);
    setDebugPlaylist(newDebugPlaylist);
    setIsGenerating(false);
    
    console.log('📁 真实文件调试数据生成完成');
    console.log('调试视频:', newDebugVideos);
    console.log('调试播放列表:', newDebugPlaylist);
  };

  // 保存调试数据到localStorage（可选）
  const saveDebugDataToStorage = () => {
    try {
      localStorage.setItem('debug_videos', JSON.stringify(debugVideos));
      localStorage.setItem('debug_playlists', JSON.stringify([{
        id: 'debug-playlist-1',
        name: '调试播放列表',
        items: debugPlaylist,
        dateCreated: new Date(),
        isActive: true
      }]));
      alert('调试数据已保存到localStorage');
    } catch (error) {
      console.error('保存调试数据失败:', error);
      alert('保存调试数据失败');
    }
  };

  // 清除调试数据
  const clearDebugData = () => {
    setDebugVideos([]);
    setDebugPlaylist([]);
    
    // 清理blob URLs
    debugVideos.forEach(video => {
      if (video.fileUrl && video.fileUrl.startsWith('blob:')) {
        URL.revokeObjectURL(video.fileUrl);
      }
    });
    
    console.log('🗑️ 调试数据已清除');
  };

  // 启动播放器测试
  const startVideoPlayerTest = () => {
    if (debugVideos.length === 0 || debugPlaylist.length === 0) {
      alert('请先生成调试数据');
      return;
    }
    
    console.log('🚀 启动播放器调试测试');
    console.log('使用的视频数据:', debugVideos);
    console.log('使用的播放列表:', debugPlaylist);
    
    setShowVideoPlayer(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Settings className="mr-2 text-blue-600" size={24} />
            视频播放器调试工具
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* 调试数据状态 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">当前调试数据状态</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• 调试视频数量: {debugVideos.length}</p>
              <p>• 调试播放列表项目: {debugPlaylist.length}</p>
              <p>• 数据类型: {debugVideos.length > 0 ? (debugVideos[0].fileUrl.startsWith('blob:') ? '真实文件' : '测试URL') : '无'}</p>
            </div>
          </div>

          {/* 生成测试数据 */}
          <div className="space-y-4">
            <h3 className="font-semibold">生成测试数据</h3>
            
            {/* 方式1：使用在线测试视频 */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">方式1：使用在线测试视频</h4>
              <p className="text-sm text-gray-600 mb-3">
                生成使用在线示例视频的测试数据（需要网络连接）
              </p>
              <button
                onClick={generateTestVideos}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <RefreshCw className="mr-2" size={16} />
                生成在线测试数据
              </button>
            </div>

            {/* 方式2：上传真实文件 */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2">方式2：上传真实文件测试</h4>
              <p className="text-sm text-gray-600 mb-3">
                上传你的视频文件进行真实测试（推荐）
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="debug-file-upload"
                  disabled={isGenerating}
                />
                <label
                  htmlFor="debug-file-upload"
                  className={`${
                    isGenerating ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                  } text-white px-4 py-2 rounded-lg cursor-pointer flex items-center`}
                >
                  <Download className="mr-2" size={16} />
                  {isGenerating ? '处理中...' : '选择视频文件'}
                </label>
              </div>
            </div>
          </div>

          {/* 调试数据预览 */}
          {debugVideos.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold">调试数据预览</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                <div className="space-y-2">
                  {debugVideos.map((video, index) => (
                    <div key={video.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{video.name}</span>
                      <span className="text-gray-600">
                        {debugPlaylist[index]?.reviewType} - 第{debugPlaylist[index]?.reviewNumber}次
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex space-x-4">
            <button
              onClick={startVideoPlayerTest}
              disabled={debugVideos.length === 0}
              className={`flex-1 px-4 py-3 rounded-lg text-white font-medium flex items-center justify-center ${
                debugVideos.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <Play className="mr-2" size={20} />
              启动播放器测试
            </button>
            
            <button
              onClick={saveDebugDataToStorage}
              disabled={debugVideos.length === 0}
              className={`px-4 py-3 rounded-lg font-medium ${
                debugVideos.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              保存到存储
            </button>
            
            <button
              onClick={clearDebugData}
              disabled={debugVideos.length === 0}
              className={`px-4 py-3 rounded-lg font-medium ${
                debugVideos.length === 0
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* 使用说明 */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">使用说明</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 清除PWA缓存后，直接使用此工具生成测试数据</li>
              <li>• 推荐使用"上传真实文件"方式进行测试</li>
              <li>• 可以保存调试数据到localStorage供后续使用</li>
              <li>• 调试完成后记得清理数据释放内存</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 播放器调试界面 */}
      {showVideoPlayer && (
        <VideoPlayer
          playlist={debugPlaylist}
          videos={debugVideos}
          onClose={() => setShowVideoPlayer(false)}
          onPlaylistComplete={() => {
            console.log('🎉 播放列表播放完成');
            setShowVideoPlayer(false);
          }}
          initialIndex={0}
        />
      )}
    </div>
  );
};
