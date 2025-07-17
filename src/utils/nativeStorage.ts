// 条件导入Capacitor模块
let Capacitor: any;
let Filesystem: any;
let Directory: any;
let Storage: any;

try {
  Capacitor = require('@capacitor/core').Capacitor;
  const fsModule = require('@capacitor/filesystem');
  Filesystem = fsModule.Filesystem;
  Directory = fsModule.Directory;
  Storage = require('@capacitor/storage').Storage;
} catch (error) {
  console.log('Capacitor模块未找到，使用Web回退方案');
  // Web回退方案
  Capacitor = {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
    isPluginAvailable: () => false
  };
}

/**
 * 原生存储管理器 - 替换IndexedDB和localStorage
 */
class NativeStorageManager {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    console.log('🔧 原生存储管理器初始化，平台:', this.isNative ? '原生' : 'Web');
  }

  /**
   * 保存视频文件到原生存储
   */
  async saveVideoFile(videoId: string, file: File): Promise<string> {
    if (!this.isNative) {
      // Web平台回退到原有方案
      return this.saveVideoFileWeb(videoId, file);
    }

    try {
      // 读取文件为base64
      const base64Data = await this.fileToBase64(file);
      
      // 保存到原生文件系统
      const fileName = `video_${videoId}.${this.getFileExtension(file.name)}`;
      const result = await Filesystem.writeFile({
        path: `videos/${fileName}`,
        data: base64Data,
        directory: Directory.Data
      });

      console.log('✅ 视频文件保存成功:', result.uri);
      
      // 保存文件信息到Storage
      await this.saveVideoMetadata(videoId, {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        filePath: result.uri,
        savedAt: new Date().toISOString()
      });

      return result.uri;
    } catch (error) {
      console.error('❌ 保存视频文件失败:', error);
      throw error;
    }
  }

  /**
   * 获取视频文件URL
   */
  async getVideoFileUrl(videoId: string): Promise<string | null> {
    if (!this.isNative) {
      return this.getVideoFileUrlWeb(videoId);
    }

    try {
      const metadata = await this.getVideoMetadata(videoId);
      if (!metadata) {
        console.log('⚠️ 视频元数据不存在:', videoId);
        return null;
      }

      // 检查文件是否存在
      const fileName = `video_${videoId}.${this.getFileExtension(metadata.fileName)}`;
      const fileExists = await this.checkFileExists(`videos/${fileName}`);
      
      if (!fileExists) {
        console.log('⚠️ 视频文件不存在:', fileName);
        return null;
      }

      // 返回文件URI（Capacitor会自动处理）
      return `capacitor://localhost/_capacitor_file_${metadata.filePath}`;
    } catch (error) {
      console.error('❌ 获取视频文件URL失败:', error);
      return null;
    }
  }

  /**
   * 删除视频文件
   */
  async deleteVideoFile(videoId: string): Promise<void> {
    if (!this.isNative) {
      return this.deleteVideoFileWeb(videoId);
    }

    try {
      const metadata = await this.getVideoMetadata(videoId);
      if (metadata) {
        const fileName = `video_${videoId}.${this.getFileExtension(metadata.fileName)}`;
        await Filesystem.deleteFile({
          path: `videos/${fileName}`,
          directory: Directory.Data
        });
        console.log('✅ 视频文件删除成功:', fileName);
      }

      // 删除元数据
      await Storage.remove({ key: `video_metadata_${videoId}` });
    } catch (error) {
      console.error('❌ 删除视频文件失败:', error);
      throw error;
    }
  }

  /**
   * 保存应用数据（替换localStorage）
   */
  async setAppData(key: string, data: any): Promise<void> {
    try {
      const jsonData = JSON.stringify(data);
      await Storage.set({ key, value: jsonData });
      console.log('✅ 应用数据保存成功:', key);
    } catch (error) {
      console.error('❌ 保存应用数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取应用数据
   */
  async getAppData(key: string): Promise<any> {
    try {
      const result = await Storage.get({ key });
      return result.value ? JSON.parse(result.value) : null;
    } catch (error) {
      console.error('❌ 获取应用数据失败:', error);
      return null;
    }
  }

  /**
   * 删除应用数据
   */
  async removeAppData(key: string): Promise<void> {
    try {
      await Storage.remove({ key });
      console.log('✅ 应用数据删除成功:', key);
    } catch (error) {
      console.error('❌ 删除应用数据失败:', error);
      throw error;
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStorageStats(): Promise<any> {
    try {
      const keys = await Storage.keys();
      const stats = {
        totalKeys: keys.keys.length,
        videoCount: 0,
        dataKeys: [] as string[]
      };

      for (const key of keys.keys) {
        if (key.startsWith('video_metadata_')) {
          stats.videoCount++;
        }
        stats.dataKeys.push(key);
      }

      return stats;
    } catch (error) {
      console.error('❌ 获取存储统计失败:', error);
      return { totalKeys: 0, videoCount: 0, dataKeys: [] };
    }
  }

  // 私有方法
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || 'mp4';
  }

  private async saveVideoMetadata(videoId: string, metadata: any): Promise<void> {
    await Storage.set({
      key: `video_metadata_${videoId}`,
      value: JSON.stringify(metadata)
    });
  }

  private async getVideoMetadata(videoId: string): Promise<any> {
    const result = await Storage.get({ key: `video_metadata_${videoId}` });
    return result.value ? JSON.parse(result.value) : null;
  }

  private async checkFileExists(path: string): Promise<boolean> {
    try {
      await Filesystem.stat({
        path,
        directory: Directory.Data
      });
      return true;
    } catch {
      return false;
    }
  }

  // Web平台回退方案（原有的IndexedDB逻辑）
  private async saveVideoFileWeb(videoId: string, file: File): Promise<string> {
    // 这里可以保留原有的IndexedDB逻辑作为Web平台回退
    const url = URL.createObjectURL(file);
    console.log('🌐 Web平台视频文件保存:', url);
    return url;
  }

  private async getVideoFileUrlWeb(videoId: string): Promise<string | null> {
    // Web平台的文件获取逻辑
    console.log('🌐 Web平台获取视频文件URL:', videoId);
    return null;
  }

  private async deleteVideoFileWeb(videoId: string): Promise<void> {
    // Web平台的文件删除逻辑
    console.log('🌐 Web平台删除视频文件:', videoId);
  }
}

// 创建全局实例
export const nativeStorage = new NativeStorageManager();

// 兼容性检查
export const checkNativeSupport = () => {
  return {
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
    hasFilesystem: Capacitor.isPluginAvailable('Filesystem'),
    hasStorage: Capacitor.isPluginAvailable('Storage')
  };
};

export default NativeStorageManager;
