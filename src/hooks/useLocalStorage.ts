import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // 获取存储的值
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 设置值的函数
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}

// 数据序列化辅助函数 - 修复文件URL保存问题
export const serializeVideoFile = (video: any) => ({
  ...video,
  dateAdded: video.dateAdded.toISOString(),
  firstPlayDate: video.firstPlayDate?.toISOString(),
  nextReviewDate: video.nextReviewDate?.toISOString(),
  // 不保存 File 对象，但保留文件信息用于重建
  fileName: video.file?.name,
  fileType: video.file?.type,
  fileSize: video.file?.size,
  file: null,
  // fileUrl 将通过 IndexedDB 单独保存
});

export const deserializeVideoFile = (video: any) => ({
  ...video,
  dateAdded: new Date(video.dateAdded),
  firstPlayDate: video.firstPlayDate ? new Date(video.firstPlayDate) : undefined,
  nextReviewDate: video.nextReviewDate ? new Date(video.nextReviewDate) : undefined,
});

export const serializeCollection = (collection: any) => ({
  ...collection,
  dateCreated: collection.dateCreated.toISOString(),
});

export const deserializeCollection = (collection: any) => ({
  ...collection,
  dateCreated: new Date(collection.dateCreated),
});

export const serializePlaylist = (playlist: any) => ({
  ...playlist,
  date: playlist.date.toISOString(),
});

export const deserializePlaylist = (playlist: any) => ({
  ...playlist,
  date: new Date(playlist.date),
});

// IndexedDB 文件存储管理
class FileStorageManager {
  private dbName = 'VideoLearningApp';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'id' });
        }
      };
    });
  }

  async saveFile(id: string, file: File): Promise<string> {
    console.log('saveFile called with:', { id, fileName: file.name, fileSize: file.size, fileType: file.type });
    
    if (!this.db) {
      console.log('Database not initialized, initializing...');
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      // 检查文件是否有效
      if (!file || file.size === 0) {
        console.error('Invalid file:', file);
        reject(new Error('Invalid file'));
        return;
      }
      
      // 将文件转换为 ArrayBuffer 存储
      const reader = new FileReader();
      reader.onload = () => {
        const arrayBuffer = reader.result as ArrayBuffer;
        console.log('FileReader onload, data length:', arrayBuffer.byteLength);
        
        if (arrayBuffer.byteLength === 0) {
          console.error('Empty file content');
          reject(new Error('Empty file content'));
          return;
        }
        
        try {
          // Move transaction creation inside the callback to ensure it's active
          const transaction = this.db!.transaction(['files'], 'readwrite');
          const store = transaction.objectStore('files');
          
          const fileData = {
            id,
            name: file.name,
            type: file.type,
            size: file.size,
            data: arrayBuffer,
            timestamp: Date.now()
          };
          
          console.log('Storing file data:', { id, name: fileData.name, size: fileData.size, type: fileData.type });
          
          const request = store.put(fileData);
          
          request.onsuccess = () => {
            console.log('File stored successfully in IndexedDB');
            try {
              // 创建临时 URL
              const blob = new Blob([arrayBuffer], { type: file.type });
              const url = URL.createObjectURL(blob);
              console.log('Created blob URL:', url);
              
              // Android设备特殊处理：验证URL是否有效
              if (/Android/i.test(navigator.userAgent)) {
                console.log('Android device detected, validating blob URL...');
                // 通过创建临时video元素验证URL
                const testVideo = document.createElement('video');
                testVideo.src = url;
                testVideo.onloadedmetadata = () => {
                  console.log('Android: Blob URL validated successfully');
                  resolve(url);
                };
                testVideo.onerror = () => {
                  console.error('Android: Blob URL validation failed');
                  URL.revokeObjectURL(url);
                  reject(new Error('Android: Blob URL validation failed'));
                };
                // 设置超时，防止无限等待
                setTimeout(() => {
                  testVideo.onerror = null;
                  testVideo.onloadedmetadata = null;
                  if (testVideo.readyState === 0) {
                    console.warn('Android: Blob URL validation timeout, proceeding anyway');
                    resolve(url);
                  }
                }, 3000);
              } else {
                resolve(url);
              }
            } catch (error) {
              console.error('Error creating blob URL:', error);
              reject(error);
            }
          };
          
          request.onerror = () => {
            console.error('IndexedDB put error:', request.error);
            reject(request.error);
          };
          
          transaction.onerror = () => {
            console.error('IndexedDB transaction error:', transaction.error);
            reject(transaction.error);
          };
        } catch (error) {
          console.error('Transaction error:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        console.error('FileReader error:', reader.error);
        reject(reader.error);
      };
      
      console.log('Starting FileReader.readAsArrayBuffer');
      reader.readAsArrayBuffer(file);
    });
  }

  async getFile(id: string): Promise<string | null> {
    console.log('getFile called with id:', id);
    
    if (!this.db) {
      console.log('Database not initialized, initializing...');
      await this.init();
    }
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readonly');
      const store = transaction.objectStore('files');
      const request = store.get(id);
      
      request.onsuccess = () => {
        if (request.result) {
          console.log('File found in IndexedDB:', { id, name: request.result.name, size: request.result.size });
          try {
            const blob = new Blob([request.result.data], { type: request.result.type });
            const url = URL.createObjectURL(blob);
            console.log('Created blob URL:', url);
            resolve(url);
          } catch (error) {
            console.error('Error creating blob URL:', error);
            resolve(null);
          }
        } else {
          console.warn('File not found in IndexedDB:', id);
          resolve(null);
        }
      };
      
      request.onerror = () => {
        console.error('IndexedDB get error:', request.error);
        reject(request.error);
      };
      
      transaction.onerror = () => {
        console.error('IndexedDB transaction error:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['files'], 'readwrite');
      const store = transaction.objectStore('files');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const fileStorage = new FileStorageManager();