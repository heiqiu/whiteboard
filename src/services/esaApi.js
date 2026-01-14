// ESA 边缘存储 API 服务
// 参考官方示例：直接使用 EdgeKV（部署到 ESA Pages 后自动可用）
// EdgeKV 是平台内置的全局对象，无需 import

class ESAStorageAPI {
  constructor(config) {
    this.namespace = config.namespace || 'whiteboard';
    this.edgeKV = null;
    this.initEdgeKV();
  }

  // 初始化 EdgeKV（参考官方示例）
  initEdgeKV() {
    try {
      if (true) {
        console.info('命名空间', this.namespace);
        // 参考官方示例：const edgeKV = new EdgeKV({ namespace: "ns" });
        this.edgeKV = new EdgeKV({ namespace: this.namespace });
        console.log('EdgeKV 初始化成功');
        return true;
      } else {
        console.warn('EdgeKV 不可用（本地开发环境）');
        return false;
      }
    } catch (e) {
      console.error('EdgeKV 初始化错误:', e);
      return false;
    }
  }

  // 生成存储 Key
  getWhiteboardKey(boardId = 'default') {
    return `whiteboard_${boardId}`;
  }

  // 保存白板数据（参考官方示例）
  async saveWhiteboard(data, boardId = 'default') {
    if (this.edgeKV) {
      try {
        const key = this.getWhiteboardKey(boardId);
        const dataToSave = {
          ...data,
          timestamp: new Date().toISOString(),
          version: '1.0'
        };
        
        // 参考官方示例：let data = await edgeKV.put("put_string", "string_value")
        // if (data === undefined) { return "EdgeKV put success\n"; }
        const result = await this.edgeKV.put(key, JSON.stringify(dataToSave));
        
        if (result === undefined) {
          console.log('EdgeKV put success');
          return { success: true, message: 'EdgeKV put success' };
        } else {
          console.warn('EdgeKV put failed');
          return { success: false, message: 'EdgeKV put failed' };
        }
      } catch (e) {
        console.error('EdgeKV put error:', e);
        return this.saveToLocalStorage(data, boardId);
      }
    } else {
      // 本地开发环境，使用 localStorage
      return this.saveToLocalStorage(data, boardId);
    }
  }

  // 加载白板数据（参考官方示例）
  async loadWhiteboard(boardId = 'default') {
    if (this.edgeKV) {
      try {
        const key = this.getWhiteboardKey(boardId);
        
        // 参考官方示例：使用 get 方法，key 不存在时返回 undefined
        const result = await this.edgeKV.get(key, { type: "text" });
        
        if (result === undefined) {
          console.log('EdgeKV 中没有数据');
          return this.getDefaultData();
        } else {
          const data = JSON.parse(result);
          console.log('EdgeKV get success');
          return data;
        }
      } catch (e) {
        console.error('EdgeKV get error:', e);
        return this.loadFromLocalStorage(boardId);
      }
    } else {
      // 本地开发环境，使用 localStorage
      return this.loadFromLocalStorage(boardId);
    }
  }

  // 删除白板数据（参考官方示例）
  async deleteWhiteboard(boardId = 'default') {
    if (this.edgeKV) {
      try {
        const key = this.getWhiteboardKey(boardId);
        
        // 参考官方示例：delete 成功返回 true，失败返回 false
        const result = await this.edgeKV.delete(key);
        
        if (result === true) {
          console.log('EdgeKV delete success');
          return { success: true, message: 'EdgeKV delete success' };
        } else {
          console.warn('EdgeKV delete failed');
          return { success: false, message: 'EdgeKV delete failed' };
        }
      } catch (e) {
        console.error('EdgeKV delete error:', e);
        return this.deleteFromLocalStorage(boardId);
      }
    } else {
      // 本地开发环境，使用 localStorage
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

  // ========== 本地存储降级方案（本地开发环境） ==========
  
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