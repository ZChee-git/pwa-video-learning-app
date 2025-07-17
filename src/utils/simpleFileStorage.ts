// 简化的Android兼容性修复

// 简化的文件存储管理器
class SimpleFileStorage {
  private files: Map<string, File> = new Map();
  
  async saveFile(id: string, file: File): Promise<string> {
    console.log('SimpleFileStorage.saveFile called:', { id, fileName: file.name });
    
    try {
      // 直接使用Map存储文件引用
      this.files.set(id, file);
      
      // 创建blob URL
      const url = URL.createObjectURL(file);
      console.log('Created blob URL:', url);
      
      return url;
    } catch (error) {
      console.error('SimpleFileStorage.saveFile error:', error);
      throw error;
    }
  }
  
  async getFile(id: string): Promise<string | null> {
    console.log('SimpleFileStorage.getFile called:', id);
    
    const file = this.files.get(id);
    if (!file) {
      console.warn('File not found:', id);
      return null;
    }
    
    try {
      const url = URL.createObjectURL(file);
      console.log('Retrieved file URL:', url);
      return url;
    } catch (error) {
      console.error('SimpleFileStorage.getFile error:', error);
      return null;
    }
  }
  
  async deleteFile(id: string): Promise<void> {
    console.log('SimpleFileStorage.deleteFile called:', id);
    this.files.delete(id);
  }
}

export const simpleFileStorage = new SimpleFileStorage();
