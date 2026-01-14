// ESA 边缘存储 API 服务
// 前端通过 HTTP API 调用边缘函数来访问 EdgeKV
// EdgeKV 只能在边缘函数 (functions/_middleware.js) 中使用
class ESAStorageAPI {
  constructor(config) {
    this.namespace = config.namespace || 'whiteboard';
    // API 基础路径（部署后使用相对路径调用边缘函数）
    this.apiBase = config.apiBase || '/api/whiteboard';
  }

  // 生成白板数据的 Key
  getWhiteboardKey(boardId = 'default') {
    return `whiteboard_${boardId}`;
  }

  // 保存白板数据 (通过 HTTP API 调用边缘函数)
  async saveWhiteboard(data, boardId = 'default') {
    try {
      const response = await fetch(`${this.apiBase}/${boardId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('白板数据保存成功到 EdgeKV');
      return result;
    } catch (error) {
      console.error('保存白板数据失败，降级到 localStorage:', error);
      // 降级到 localStorage (网络失败或开发环境)
      return this.saveToLocalStorage(data, boardId);
    }
  }

  // 加载白板数据 (通过 HTTP API 调用边缘函数)
  async loadWhiteboard(boardId = 'default') {
    try {
      const response = await fetch(`${this.apiBase}/${boardId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('从 EdgeKV 加载白板数据成功');
      return data;
    } catch (error) {
      console.error('加载白板数据失败，降级到 localStorage:', error);
      // 降级到 localStorage (网络失败或开发环境)
      return this.loadFromLocalStorage(boardId);
    }
  }

  // 删除白板数据 (通过 HTTP API 调用边缘函数)
  async deleteWhiteboard(boardId = 'default') {
    try {
      const response = await fetch(`${this.apiBase}/${boardId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('白板数据删除成功');
      return result;
    } catch (error) {
      console.error('删除白板数据失败，降级到 localStorage:', error);
      // 降级到 localStorage (网络失败或开发环境)
      return this.deleteFromLocalStorage(boardId);
    }
  }

  // 获取默认数据结构
  getDefaultData() {
    return {
      notes: [],
      sections: [],
      nextNoteId: 1,
      nextSectionId: 1,
      lastUpdated: new Date().toISOString()
    };
  }

  // ========== 本地存储降级方案 (网络失败或开发环境) ==========
  
  // 保存到 localStorage
  saveToLocalStorage(data, boardId = 'default') {
    try {
      const key = this.getWhiteboardKey(boardId);
      const dataToSave = {
        ...data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(key, JSON.stringify(dataToSave));
      console.log('白板数据已保存到 localStorage (降级模式)');
      return { success: true, message: 'Saved to localStorage' };
    } catch (error) {
      console.error('保存到 localStorage 失败:', error);
      throw error;
    }
  }

  // 从 localStorage 加载
  loadFromLocalStorage(boardId = 'default') {
    try {
      const key = this.getWhiteboardKey(boardId);
      const data = localStorage.getItem(key);
      
      if (data) {
        console.log('从 localStorage 加载白板数据成功 (降级模式)');
        return JSON.parse(data);
      } else {
        console.log('localStorage 中没有数据，返回默认值');
        return this.getDefaultData();
      }
    } catch (error) {
      console.error('从 localStorage 加载失败:', error);
      return this.getDefaultData();
    }
  }

  // 从 localStorage 删除
  deleteFromLocalStorage(boardId = 'default') {
    try {
      const key = this.getWhiteboardKey(boardId);
      localStorage.removeItem(key);
      console.log('白板数据已从 localStorage 删除 (降级模式)');
      return { success: true, message: 'Deleted from localStorage' };
    } catch (error) {
      console.error('从 localStorage 删除失败:', error);
      throw error;
    }
  }
}

export default ESAStorageAPI;