import React, { useRef, useState } from 'react';
import { Upload, Video, Plus, FolderOpen, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { Collection } from '../types';

interface VideoUploadProps {
  collections: Collection[];
  onVideoAdd: (files: File[], collectionId: string) => Promise<void>;
}

export const VideoUpload: React.FC<VideoUploadProps> = ({ 
  collections, 
  onVideoAdd 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const activeCollections = collections.filter(c => c.isActive);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && selectedCollection) {
      await processFiles(Array.from(files));
      // 重置输入
      if (event.target) {
        event.target.value = '';
      }
    } else if (!selectedCollection) {
      alert('请先选择一个合辑');
    }
  };

  const handleFolderSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && selectedCollection) {
      await processFiles(Array.from(files));
      // 重置输入
      if (event.target) {
        event.target.value = '';
      }
    } else if (!selectedCollection) {
      alert('请先选择一个合辑');
    }
  };

  const processFiles = async (files: File[]) => {
    setIsUploading(true);
    setUploadSuccess(false);
    setCurrentFileIndex(0);
    setTotalFiles(0);
    
    try {
      setUploadProgress('正在检查文件...');
      
      // 过滤视频文件
      const videoFiles = files.filter(file => {
        // 检查 MIME 类型
        if (file.type.startsWith('video/')) {
          return true;
        }
        
        // 检查文件扩展名
        const supportedFormats = [
          'mp4', 'avi', 'mov', 'wmv', 'mkv', 'webm', 
          'flv', 'm4v', '3gp', 'ogv', 'ts', 'mts'
        ];
        const extension = file.name.split('.').pop()?.toLowerCase();
        
        if (extension && supportedFormats.includes(extension)) {
          return true;
        }
        
        return false;
      });
      
      if (videoFiles.length === 0) {
        setUploadProgress('');
        setIsUploading(false);
        alert(`没有找到支持的视频文件\n\n支持的格式：\n${[
          'MP4', 'AVI', 'MOV', 'WMV', 'MKV', 'WebM',
          'FLV', 'M4V', '3GP', 'OGV', 'TS', 'MTS'
        ].join(', ')}`);
        return;
      }
      
      if (videoFiles.length !== files.length) {
        const skippedCount = files.length - videoFiles.length;
        setUploadProgress(`发现 ${videoFiles.length} 个视频文件，跳过 ${skippedCount} 个非视频文件`);
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
      
      setTotalFiles(videoFiles.length);
      setUploadProgress(`准备添加 ${videoFiles.length} 个视频文件...`);
      
      // 直接调用 onVideoAdd，不再分批处理
      console.log('开始添加文件到合辑:', selectedCollection);
      await onVideoAdd(videoFiles, selectedCollection);
      
      setUploadProgress('添加完成！');
      setUploadSuccess(true);
      
      // 成功后清理状态
      setTimeout(() => {
        setUploadProgress('');
        setIsUploading(false);
        setUploadSuccess(false);
        setCurrentFileIndex(0);
        setTotalFiles(0);
      }, 2000);
      
    } catch (error) {
      console.error('File upload error:', error);
      setUploadProgress('');
      setIsUploading(false);
      setUploadSuccess(false);
      setCurrentFileIndex(0);
      setTotalFiles(0);
      
      // 更详细的错误信息
      let errorMessage = '文件添加失败';
      if (error instanceof Error) {
        if (error.message.includes('storage') || error.message.includes('quota')) {
          errorMessage = '存储空间不足，请清理设备存储后重试';
        } else if (error.message.includes('network')) {
          errorMessage = '网络连接问题，请检查网络后重试';
        } else {
          errorMessage = `文件处理失败：${error.message}`;
        }
      }
      
      alert(errorMessage);
    }
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    if (!selectedCollection) {
      alert('请先选择一个合辑');
      return;
    }

    const files = Array.from(event.dataTransfer.files);
    await processFiles(files);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Video className="mr-3 text-blue-600" size={28} />
        添加学习视频
      </h2>

      {/* 合辑选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择目标合辑 *
        </label>
        <select
          value={selectedCollection}
          onChange={(e) => setSelectedCollection(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isUploading}
        >
          <option value="">请选择合辑...</option>
          {activeCollections.map(collection => (
            <option key={collection.id} value={collection.id}>
              {collection.name}
            </option>
          ))}
        </select>
      </div>

      {/* 上传进度 */}
      {(isUploading || uploadSuccess) && (
        <div className={`border rounded-lg p-4 mb-6 ${
          uploadSuccess 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center">
            {uploadSuccess ? (
              <CheckCircle className="text-green-600 mr-3" size={20} />
            ) : (
              <Loader className="animate-spin text-blue-600 mr-3" size={20} />
            )}
            <span className={`font-medium ${
              uploadSuccess ? 'text-green-800' : 'text-blue-800'
            }`}>
              {uploadProgress}
            </span>
          </div>
          {uploadSuccess && (
            <p className="text-green-700 text-sm mt-2">
              视频已成功添加到合辑中，可以开始学习了！
            </p>
          )}
          {isUploading && totalFiles > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-sm text-blue-700 mb-1">
                <span>处理进度</span>
                <span>{Math.min(currentFileIndex + 1, totalFiles)}/{totalFiles}</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${totalFiles > 0 ? (Math.min(currentFileIndex + 1, totalFiles) / totalFiles) * 100 : 0}%` }}
                />
              </div>
              <p className="text-blue-700 text-xs mt-1">
                请耐心等待，正在处理文件...
              </p>
            </div>
          )}
        </div>
      )}

      {/* 上传区域 */}
      {selectedCollection ? (
        <div
          className={`border-2 border-dashed rounded-lg p-8 md:p-12 text-center transition-colors cursor-pointer ${
            isUploading 
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
              : 'border-blue-300 bg-blue-50 hover:border-blue-500 hover:bg-blue-100'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <Upload size={48} className={`mx-auto mb-4 ${isUploading ? 'text-gray-400' : 'text-blue-500'}`} />
          <p className={`text-lg md:text-xl mb-2 ${isUploading ? 'text-gray-500' : 'text-gray-600'}`}>
            {isUploading ? '正在处理文件...' : '拖拽视频文件到这里或点击浏览'}
          </p>
          <p className="text-sm text-gray-500 mb-4">
            支持 MP4, AVI, MOV, WMV, MKV, WebM 等格式
          </p>
          <p className="text-sm text-blue-600 font-medium">
            将添加到：{activeCollections.find(c => c.id === selectedCollection)?.name}
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mp4,.avi,.mov,.wmv,.mkv,.webm,.flv,.m4v,.3gp,.ogv,.ts,.mts"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            disabled={isUploading}
          />
          
          <input
            ref={folderInputRef}
            type="file"
            accept="video/*,.mp4,.avi,.mov,.wmv,.mkv,.webm,.flv,.m4v,.3gp,.ogv,.ts,.mts"
            multiple
            webkitdirectory=""
            onChange={handleFolderSelect}
            className="hidden"
            disabled={isUploading}
          />
        </div>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 md:p-12 text-center bg-gray-50">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-xl text-gray-500 mb-2">
            请先选择一个合辑
          </p>
          <p className="text-sm text-gray-400">
            选择合辑后即可上传视频文件
          </p>
        </div>
      )}

      {/* 操作按钮 */}
      {selectedCollection && !isUploading && (
        <div className="mt-6 flex flex-col md:flex-row justify-center space-y-3 md:space-y-0 md:space-x-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
          >
            <Plus size={20} className="mr-2" />
            选择视频文件
          </button>
          
          <button
            onClick={() => folderInputRef.current?.click()}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
          >
            <FolderOpen size={20} className="mr-2" />
            选择文件夹
          </button>
        </div>
      )}


    </div>
  );
};