// 视频修复工具组件
import React, { useState } from 'react';
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface VideoFixerProps {
  onFixed?: () => void;
  onClose?: () => void;
}

interface FixResult {
  success: boolean;
  message: string;
  details?: {
    urlsFixed: number;
    playlistsFixed: number;
    issuesRemaining: number;
  };
}

export const VideoFixer: React.FC<VideoFixerProps> = ({ onFixed, onClose }) => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [showBlobFixer, setShowBlobFixer] = useState(false);

  const fixBlobUrls = async () => {
    setIsFixing(true);
    setFixResult(null);

    try {
      const { VideoPersistenceManager } = await import('../utils/videoPersistence');
      const result = await VideoPersistenceManager.fixAllBlobUrls();

      if (result.success) {
        setFixResult({
          success: true,
          message: `成功修复 ${result.fixedCount || 0} 个视频链接`,
          details: {
            videosFixed: result.fixedCount || 0,
            urlsFixed: result.fixedCount || 0,
            playlistsFixed: 0,
            issuesRemaining: 0
          }
        });

        if (result.fixedCount && result.fixedCount > 0) {
          // 通知父组件修复完成
          onFixed?.();
          
          // 延迟后刷新页面
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } else {
        setFixResult({
          success: false,
          message: result.error || '修复失败',
          details: {
            videosFixed: 0,
            urlsFixed: 0,
            playlistsFixed: 0,
            issuesRemaining: 1
          }
        });
      }
    } catch (error) {
      console.error('Blob URL修复失败:', error);
      setFixResult({
        success: false,
        message: '修复过程中发生错误',
        details: {
          videosFixed: 0,
          urlsFixed: 0,
          playlistsFixed: 0,
          issuesRemaining: 1
        }
      });
    } finally {
      setIsFixing(false);
    }
  };

  const diagnoseIssues = () => {
    console.log('开始诊断视频问题...');
    
    const videos = JSON.parse(localStorage.getItem('videos') || '[]');
    const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
    
    const issues = [];
    
    // 检查视频数据完整性
    const videosWithoutFile = videos.filter(v => !v.file || !v.file.size);
    const videosWithoutUrl = videos.filter(v => !v.fileUrl);
    const videosWithBlobUrl = videos.filter(v => v.fileUrl && v.fileUrl.startsWith('blob:'));
    
    if (videosWithoutFile.length > 0) {
      issues.push(`${videosWithoutFile.length} 个视频缺少文件对象`);
    }
    
    if (videosWithoutUrl.length > 0) {
      issues.push(`${videosWithoutUrl.length} 个视频缺少文件URL`);
    }
    
    // 检查播放列表匹配
    let unmatchedItems = 0;
    playlists.forEach(playlist => {
      playlist.items.forEach(item => {
        const matchingVideo = videos.find(v => v.id === item.videoId);
        if (!matchingVideo) {
          unmatchedItems++;
        }
      });
    });
    
    if (unmatchedItems > 0) {
      issues.push(`${unmatchedItems} 个播放列表项目找不到对应视频`);
    }
    
    const diagnosisResult = {
      totalVideos: videos.length,
      totalPlaylists: playlists.length,
      videosWithFile: videos.filter(v => v.file && v.file.size > 0).length,
      videosWithUrl: videos.filter(v => v.fileUrl).length,
      videosWithBlobUrl: videosWithBlobUrl.length,
      unmatchedItems,
      issues,
      canAutoFix: issues.length > 0 && videos.length > 0
    };
    
    setDiagnosis(diagnosisResult);
    return diagnosisResult;
  };

  const performFix = async () => {
    setIsFixing(true);
    setFixResult(null);
    
    try {
      console.log('开始修复视频问题...');
      
      const videos = JSON.parse(localStorage.getItem('videos') || '[]');
      const playlists = JSON.parse(localStorage.getItem('playlists') || '[]');
      
      let urlsFixed = 0;
      let playlistsFixed = 0;
      
      // 修复视频URL
      videos.forEach((video, index) => {
        if (video.file && video.file.size > 0) {
          if (!video.fileUrl || video.fileUrl.startsWith('blob:')) {
            try {
              // 清除旧的blob URL
              if (video.fileUrl && video.fileUrl.startsWith('blob:')) {
                URL.revokeObjectURL(video.fileUrl);
              }
              
              // 创建新的blob URL
              const newFileUrl = URL.createObjectURL(video.file);
              video.fileUrl = newFileUrl;
              urlsFixed++;
              console.log(`修复视频 ${index + 1}: ${video.name}`);
            } catch (error) {
              console.error(`修复视频 ${index + 1} 失败:`, error);
            }
          }
        }
      });
      
      // 修复播放列表ID匹配
      playlists.forEach((playlist, pIndex) => {
        playlist.items.forEach((item, iIndex) => {
          const matchingVideo = videos.find(v => v.id === item.videoId);
          
          if (!matchingVideo) {
            console.log(`修复播放列表 ${pIndex + 1} 项目 ${iIndex + 1}`);
            
            // 尝试按索引匹配
            const videoIndex = parseInt(item.videoId);
            if (!isNaN(videoIndex) && videoIndex >= 0 && videoIndex < videos.length) {
              item.videoId = videos[videoIndex].id;
              playlistsFixed++;
            } else if (videos.length > 0) {
              // 使用第一个可用视频
              item.videoId = videos[0].id;
              playlistsFixed++;
            }
          }
        });
      });
      
      // 保存修复后的数据
      localStorage.setItem('videos', JSON.stringify(videos));
      localStorage.setItem('playlists', JSON.stringify(playlists));
      
      // 再次检查是否还有问题
      const finalCheck = diagnoseIssues();
      const issuesRemaining = finalCheck.issues.length;
      
      setFixResult({
        success: true,
        message: `修复完成！修复了 ${urlsFixed} 个视频URL，${playlistsFixed} 个播放列表项目`,
        details: {
          urlsFixed,
          playlistsFixed,
          issuesRemaining
        }
      });
      
      if (issuesRemaining === 0 && onFixed) {
        setTimeout(() => {
          onFixed();
        }, 2000);
      }
      
    } catch (error) {
      console.error('修复过程中出错:', error);
      setFixResult({
        success: false,
        message: '修复过程中出现错误，请重试或手动处理'
      });
    } finally {
      setIsFixing(false);
    }
  };

  React.useEffect(() => {
    diagnoseIssues();
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <div className="text-center mb-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">视频加载问题修复</h2>
        </div>
        
        {diagnosis && (
          <div className="mb-6 text-sm">
            <h3 className="font-semibold mb-2">诊断结果：</h3>
            <div className="bg-gray-100 p-3 rounded">
              <p>总视频数: {diagnosis.totalVideos}</p>
              <p>总播放列表数: {diagnosis.totalPlaylists}</p>
              <p>有文件的视频: {diagnosis.videosWithFile}/{diagnosis.totalVideos}</p>
              <p>有URL的视频: {diagnosis.videosWithUrl}/{diagnosis.totalVideos}</p>
              {diagnosis.unmatchedItems > 0 && (
                <p className="text-red-600">未匹配的播放列表项目: {diagnosis.unmatchedItems}</p>
              )}
            </div>
            
            {diagnosis.issues.length > 0 && (
              <div className="mt-3">
                <h4 className="font-semibold text-red-600 mb-2">发现的问题：</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {diagnosis.issues.map((issue, index) => (
                    <li key={index}>• {issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        
        {fixResult && (
          <div className={`mb-6 p-3 rounded ${fixResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <div className="flex items-center mb-2">
              {fixResult.success ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <XCircle className="w-5 h-5 mr-2" />
              )}
              <span className="font-semibold">{fixResult.success ? '修复成功' : '修复失败'}</span>
            </div>
            <p className="text-sm">{fixResult.message}</p>
            {fixResult.details && (
              <div className="mt-2 text-xs">
                <p>URL修复: {fixResult.details.urlsFixed}</p>
                <p>播放列表修复: {fixResult.details.playlistsFixed}</p>
                <p>剩余问题: {fixResult.details.issuesRemaining}</p>
              </div>
            )}
          </div>
        )}
        
        <div className="space-y-3">
          {diagnosis?.canAutoFix && !fixResult && (
            <button
              onClick={performFix}
              disabled={isFixing}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg w-full flex items-center justify-center"
            >
              {isFixing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  修复中...
                </>
              ) : (
                '开始修复'
              )}
            </button>
          )}
          
          <button
            onClick={fixBlobUrls}
            disabled={isFixing}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg w-full flex items-center justify-center"
          >
            {isFixing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                修复视频链接中...
              </>
            ) : (
              '修复视频链接'
            )}
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg w-full"
          >
            重新加载页面
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg w-full"
            >
              关闭
            </button>
          )}
        </div>
        
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>如果自动修复无效，请在控制台运行：</p>
          <code className="bg-gray-100 px-2 py-1 rounded">fixAllIssues()</code>
        </div>
      </div>
    </div>
  );
};

export default VideoFixer;
