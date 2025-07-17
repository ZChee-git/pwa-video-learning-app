import { useState, useEffect } from 'react';
import { Brain, Play, RotateCcw, History, BookOpen, Plus, Loader, Headphones, Video, Settings } from 'lucide-react';
import { usePlaylistManager } from './hooks/usePlaylistManager';
import { VideoUpload } from './components/VideoUpload';
import { StatsCard } from './components/StatsCard';
import { PlaylistPreview } from './components/PlaylistPreview';
import { PlaylistHistory } from './components/PlaylistHistory';
import { VideoLibrary } from './components/VideoLibrary';
import { VideoPlayer } from './components/VideoPlayer';
import { InstallPrompt } from './components/InstallPrompt';
import { CollectionManager } from './components/CollectionManager';
import { VideoPlayerDebug } from './components/VideoPlayerDebug';

function App() {
  const {
    videos,
    playlists,
    collections,
    isLoading,
    addVideos,
    createCollection,
    updateCollection,
    deleteCollection,
    toggleCollection,
    generateTodayPlaylist,
    createTodayPlaylist,
    getStats,
    deleteVideo,
    updatePlaylistProgress,
    getTodayNewVideos,
    getTodayAudioReviews,
    getTodayVideoReviews,
  } = usePlaylistManager();

  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showDebugTool, setShowDebugTool] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(generateTodayPlaylist());
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null);
  const [previewType, setPreviewType] = useState<'new' | 'audio' | 'video'>('new');

  // 初始化视频持久化系统
  useEffect(() => {
    const initializePersistence = async () => {
      try {
        const { initializeVideoPersistence, showIOSPWAInstallTip } = await import('./utils/videoPersistence');
        initializeVideoPersistence();
        
        // 显示iOS PWA安装提示
        showIOSPWAInstallTip();
        
        console.log('视频持久化系统初始化完成');
      } catch (error) {
        console.error('视频持久化系统初始化失败:', error);
      }
    };

    initializePersistence();

    // 监听视频数据更新事件
    const handleVideoDataUpdate = (event: CustomEvent) => {
      console.log('收到视频数据更新事件:', event.detail);
      // 这里可以添加更新UI的逻辑
    };

    window.addEventListener('videoDataUpdated', handleVideoDataUpdate as EventListener);

    return () => {
      window.removeEventListener('videoDataUpdated', handleVideoDataUpdate as EventListener);
    };
  }, []);

  const handleVideoAdd = async (files: File[], collectionId: string) => {
    console.log('handleVideoAdd called with:', { files: files.map(f => f.name), collectionId });
    
    try {
      const result = await addVideos(files, collectionId);
      console.log('addVideos result:', result);
      
      // 重新生成预览
      setCurrentPreview(generateTodayPlaylist());
      console.log('Video addition successful');
    } catch (error) {
      console.error('Error adding videos:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'UnknownError'
      });
      alert('添加视频失败，请重试');
    }
  };

  const handleShowPreview = (type: 'new' | 'audio' | 'video', isExtraSession: boolean = false) => {
    setPreviewType(type);
    const preview = generateTodayPlaylist(isExtraSession);
    setCurrentPreview(preview);
    setShowPreview(true);
  };

  const handleStartPlaylist = () => {
    const playlist = createTodayPlaylist(previewType, currentPreview.isExtraSession);
    setCurrentPlaylist(playlist);
    setShowPreview(false);
    setShowPlayer(true);
  };

  const handleNewLearning = () => {
    // 检查是否有未完成的新学习播放列表
    const lastNewPlaylist = playlists.find(p => 
      !p.isCompleted && 
      p.playlistType === 'new' && 
      p.lastPlayedIndex < p.items.length
    );

    if (lastNewPlaylist) {
      // 继续上次的新学习
      setCurrentPlaylist(lastNewPlaylist);
      setShowPlayer(true);
    } else {
      // 开始新的学习
      const stats = getStats();
      handleShowPreview('new', stats.canAddExtra);
    }
  };

  const handlePlayerClose = () => {
    setShowPlayer(false);
    setCurrentPlaylist(null);
  };

  const handlePlaylistComplete = () => {
    if (currentPlaylist) {
      updatePlaylistProgress(currentPlaylist.id, currentPlaylist.items.length, true);
      const message = currentPlaylist.isExtraSession 
        ? '恭喜！加餐学习任务已完成！' 
        : '恭喜！学习任务已完成！';
      alert(message);
    }
    setShowPlayer(false);
    setCurrentPlaylist(null);
  };

  // 如果正在加载，显示加载界面
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-blue-600 mx-auto mb-4" size={48} />
          <p className="text-xl text-gray-600">正在加载应用数据...</p>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const newVideos = getTodayNewVideos();
  const audioReviews = getTodayAudioReviews();
  const videoReviews = getTodayVideoReviews();

  // 检查是否有未完成的新学习
  const hasIncompleteNewLearning = playlists.some(p => 
    !p.isCompleted && 
    p.playlistType === 'new' && 
    p.lastPlayedIndex < p.items.length
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4 relative">
            <Brain className="text-blue-600 mr-4" size={48} />
            <h1 
              className="text-4xl font-bold text-gray-800 cursor-pointer select-none"
              onDoubleClick={() => setShowDebugTool(true)}
              title="双击打开调试工具"
            >
              智能复习学习系统
            </h1>
            {/* 调试工具入口 - 在数据为空或者按住Ctrl点击标题时显示 */}
            {(videos.length === 0 && playlists.length === 0) && (
              <button
                onClick={() => setShowDebugTool(true)}
                className="absolute right-0 top-0 bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition-colors"
                title="播放器调试工具"
              >
                <Settings size={20} />
              </button>
            )}
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            基于科学的间隔重复算法，在第2、4、7、15、30、90天进行复习，帮助您高效掌握视频内容。
          </p>
        </div>

        {/* Statistics */}
        <StatsCard stats={stats} />

        {/* Main Control Panel */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Play className="mr-3 text-green-600" size={28} />
            学习控制
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 新学习 */}
            <button
              onClick={handleNewLearning}
              className={`${
                hasIncompleteNewLearning
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : stats.canAddExtra 
                  ? 'bg-orange-600 hover:bg-orange-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white p-6 rounded-xl font-semibold text-lg flex flex-col items-center transition-colors shadow-md hover:shadow-lg`}
            >
              {hasIncompleteNewLearning ? (
                <RotateCcw size={32} className="mb-3" />
              ) : stats.canAddExtra ? (
                <Plus size={32} className="mb-3" />
              ) : (
                <Play size={32} className="mb-3" />
              )}
              新学习
              <span className={`text-sm mt-2 ${
                hasIncompleteNewLearning
                  ? 'text-blue-100'
                  : stats.canAddExtra 
                  ? 'text-orange-100' 
                  : 'text-green-100'
              }`}>
                {hasIncompleteNewLearning 
                  ? '继续上次未完成的学习'
                  : stats.canAddExtra 
                  ? '今日任务已完成，可以加餐学习' 
                  : `新学 ${newVideos.length} 个视频`
                }
              </span>
            </button>

            {/* 音频复习 */}
            <button
              onClick={() => handleShowPreview('audio')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white p-6 rounded-xl font-semibold text-lg flex flex-col items-center transition-colors shadow-md hover:shadow-lg"
            >
              <Headphones size={32} className="mb-3" />
              音频复习
              <span className="text-sm text-yellow-100 mt-2">
                复习 {audioReviews.length} 个视频（支持后台播放）
              </span>
            </button>

            {/* 视频复习 */}
            <button
              onClick={() => handleShowPreview('video')}
              className="bg-purple-600 hover:bg-purple-700 text-white p-6 rounded-xl font-semibold text-lg flex flex-col items-center transition-colors shadow-md hover:shadow-lg"
            >
              <Video size={32} className="mb-3" />
              视频复习
              <span className="text-sm text-purple-100 mt-2">
                {videoReviews.length} 个视频建议观看
              </span>
            </button>
          </div>

          {/* 播放历史 */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowHistory(true)}
              className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg font-medium flex items-center mx-auto transition-colors"
            >
              <History size={18} className="mr-2" />
              查看播放历史
            </button>
          </div>
        </div>

        {/* Collection Manager */}
        <CollectionManager
          collections={collections}
          videos={videos}
          onCreateCollection={createCollection}
          onToggleCollection={toggleCollection}
          onDeleteCollection={deleteCollection}
          onUpdateCollection={updateCollection}
        />

        {/* Video Upload */}
        <VideoUpload 
          collections={collections}
          onVideoAdd={handleVideoAdd}
        />

        {/* Video Library */}
        <VideoLibrary 
          videos={videos} 
          collections={collections}
          onDelete={deleteVideo} 
        />

        {/* Empty State */}
        {videos.length === 0 && (
          <div className="text-center py-16">
            <BookOpen size={80} className="mx-auto text-gray-400 mb-6" />
            <h3 className="text-2xl font-semibold text-gray-600 mb-4">
              开始您的学习之旅
            </h3>
            <p className="text-gray-500 text-lg">
              创建合辑并上传您的第一个视频文件，开始使用艾宾浩斯遗忘曲线进行高效学习。
            </p>
          </div>
        )}
      </div>

      {/* Playlist Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
              <h3 className="text-white font-semibold text-xl">
                {previewType === 'new' && (currentPreview.isExtraSession ? '加餐学习预览' : '新学习预览')}
                {previewType === 'audio' && '音频复习预览'}
                {previewType === 'video' && '视频复习预览'}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-white hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <PlaylistPreview
                preview={currentPreview}
                videos={videos}
                onStartPlaylist={handleStartPlaylist}
                previewType={previewType}
              />
            </div>
          </div>
        </div>
      )}

      {/* Playlist History Modal */}
      {showHistory && (
        <PlaylistHistory
          playlists={playlists}
          videos={videos}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Video Player */}
      {showPlayer && currentPlaylist && (
        <VideoPlayer
          playlist={currentPlaylist.items}
          videos={videos}
          onClose={handlePlayerClose}
          onPlaylistComplete={handlePlaylistComplete}
          initialIndex={currentPlaylist.lastPlayedIndex}
          isAudioMode={currentPlaylist.playlistType === 'audio'}
        />
      )}

      {/* Debug Tool */}
      {showDebugTool && (
        <VideoPlayerDebug
          onClose={() => setShowDebugTool(false)}
        />
      )}

      {/* Install Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default App;