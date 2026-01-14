// ESA 边缘存储 API 服务
// 使用阿里云 ESA EdgeKV API 实现白板数据的存储和读取
class ESAStorageAPI {
  constructor(config) {
    this.namespace = config.namespace || 'whiteboard'; // EdgeKV 命名空间
    this.edgeKV = null; // EdgeKV 实例将在边缘函数环境中初始化
  }

  // 初始化 EdgeKV 实例
  // 注意: EdgeKV 只能在边缘函数环境中使用
  initEdgeKV() {
    if (typeof EdgeKV !== 'undefined') {
      this.edgeKV = new EdgeKV({ namespace: this.namespace });
      return true;
    }
    console.warn('EdgeKV 不可用，可能不在边缘函数环境中');
    return false;
  }

  // 生成白板数据的 Key
  getWhiteboardKey(boardId = 'default') {
    return `whiteboard_${boardId}`;
  }

  // 保存白板数据 (使用 EdgeKV put)
  async saveWhiteboard(data, boardId = 'default') {
    try {
      // 如果在边缘函数环境中,使用 EdgeKV
      if (this.edgeKV || this.initEdgeKV()) {
        const key = this.getWhiteboardKey(boardId);
        const dataToSave = {
          ...data,
          timestamp: new Date().toISOString(),
          version: '1.0'
        };
          
        // 保存到 EdgeKV (put 成功时返回 undefined,无异常即成功)
        await this.edgeKV.put(key, JSON.stringify(dataToSave));
          
        console.log('白板数据保存成功到 EdgeKV');
        return { success: true, message: 'EdgeKV put success' };
      } else {
        // 回退到 localStorage (开发环境)
        return this.saveToLocalStorage(data, boardId);
      }
    } catch (error) {
      console.error('保存白板数据到ESA EdgeKV失败:', error);
      // 回退到 localStorage
      return this.saveToLocalStorage(data, boardId);
    }
  }

  // 加载白板数据 (使用 EdgeKV get)
  async loadWhiteboard(boardId = 'default') {
    try {
      // 如果在边缘函数环境中,使用 EdgeKV
      if (this.edgeKV || this.initEdgeKV()) {
        const key = this.getWhiteboardKey(boardId);
        // 使用 text 类型读取数据
        const result = await this.edgeKV.get(key, { type: "text" });
          
        if (result === undefined) {
          // key 不存在,返回默认值
          console.log('EdgeKV 中没有数据,返回默认值');
          return this.getDefaultData();
        } else {
          // 解析 JSON 数据
          const data = JSON.parse(result);
          console.log('从 EdgeKV 加载白板数据成功');
          return data;
        }
      } else {
        // 回退到 localStorage (开发环境)
        return this.loadFromLocalStorage(boardId);
      }
    } catch (error) {
      console.error('从ESA EdgeKV加载白板数据失败:', error);
      // 回退到 localStorage
      return this.loadFromLocalStorage(boardId);
    }
  }

  // 删除白板数据 (使用 EdgeKV delete)
  async deleteWhiteboard(boardId = 'default') {
    try {
      // 如果在边缘函数环境中,使用 EdgeKV
      if (this.edgeKV || this.initEdgeKV()) {
        const key = this.getWhiteboardKey(boardId);
        // delete 成功返回 true, 失败返回 false
        const result = await this.edgeKV.delete(key);
          
        if (result === true) {
          console.log('白板数据从 EdgeKV 删除成功');
          return { success: true, message: 'EdgeKV delete success' };
        } else {
          console.warn('白板数据删除失败或 key 不存在');
          return { success: false, message: 'EdgeKV delete failed or key not found' };
        }
      } else {
        // 回退到 localStorage (开发环境)
        return this.deleteFromLocalStorage(boardId);
      }
    } catch (error) {
      console.error('从ESA EdgeKV删除白板数据失败:', error);
      // 回退到 localStorage
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

  // ========== 本地存储回退方案 (用于开发环境) ==========
  
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
      console.log('白板数据已保存到 localStorage (开发环境)');
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
        console.log('从 localStorage 加载白板数据成功 (开发环境)');
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
      console.log('白板数据已从 localStorage 删除 (开发环境)');
      return { success: true, message: 'Deleted from localStorage' };
    } catch (error) {
      console.error('从 localStorage 删除失败:', error);
      throw error;
    }
  }
}

export default ESAStorageAPI;