import React, { useState } from 'react';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';

interface DebugInfoProps {
  debugData: any;
  isVisible: boolean;
  onClose: () => void;
}

export const DebugInfo: React.FC<DebugInfoProps> = ({ debugData, isVisible, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 left-4 right-4 bg-red-900 text-white p-4 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center">
          <AlertTriangle className="text-yellow-400 mr-2" size={20} />
          <h3 className="font-bold text-lg">调试信息</h3>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="bg-red-800 p-3 rounded">
          <p className="font-semibold mb-2">问题：视频文件未找到</p>
          <p>currentVideo: {debugData.currentVideo ? '找到' : '未找到'}</p>
          <p>videoId: {debugData.videoId || '无'}</p>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-red-700 hover:bg-red-600 p-2 rounded flex items-center justify-between"
        >
          <span>查看详细信息</span>
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        
        {isExpanded && (
          <div className="bg-red-800 p-3 rounded space-y-2">
            <div>
              <p className="font-semibold text-yellow-300">播放列表信息：</p>
              <p>playlist长度: {debugData.playlist?.length || 0}</p>
              <p>currentIndex: {debugData.currentIndex}</p>
              <p>currentItem: {debugData.currentItem ? 'OK' : '无'}</p>
            </div>
            
            <div>
              <p className="font-semibold text-yellow-300">视频库信息：</p>
              <p>videos总数: {debugData.videos?.length || 0}</p>
              <p>活跃合辑数: {debugData.activeCollections || 0}</p>
              <p>新状态视频数: {debugData.newVideos || 0}</p>
            </div>
            
            <div>
              <p className="font-semibold text-yellow-300">匹配详情：</p>
              <p>查找的videoId: {debugData.videoId}</p>
              <p>找到的视频: {debugData.currentVideo ? debugData.currentVideo.name : '未找到'}</p>
            </div>
            
            {debugData.videos && debugData.videos.length > 0 && (
              <div>
                <p className="font-semibold text-yellow-300">视频列表前3个：</p>
                {debugData.videos.slice(0, 3).map((video: any, index: number) => (
                  <p key={index} className="text-xs">
                    {index + 1}. {video.name} (ID: {video.id?.substring(0, 8)}...)
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-300">
        <p>请截图发送给开发者以协助调试</p>
      </div>
    </div>
  );
};
