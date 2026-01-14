// ESA 边缘存储 API 服务
// EdgeKV 只能在边缘函数的 fetch 或其调用的函数中使用
// 不要在构造函数中初始化 EdgeKV，而是在每次请求处理时创建实例

class ESAStorageAPI {
  constructor(config) {
    this.namespace = config?.namespace || 'whiteboard';
    // 注意：不在构造函数中初始化 EdgeKV
  }

  // 每次调用时才创建 EdgeKV 实例（确保在 fetch 上下文中）
  getEdgeKV() {
    try {
      console.log('EdgeKV 创建中...', this.namespace);
      // EdgeKV 是边缘函数运行时的全局对象
      if (typeof EdgeKV !== 'undefined') {
        return new EdgeKV({ namespace: this.namespace });
      }
      return null;
    } catch (e) {
      console.error('EdgeKV 创建失败:', e);
      return null;
    }
  }

  // 生成存储 Key
  getWhiteboardKey(boardId = 'default') {
    return `whiteboard_${boardId}`;
  }

  // 保存白板数据（在 fetch 调用链中使用 EdgeKV）
  async saveWhiteboard(data, boardId = 'default') {
    const edgeKV = this.getEdgeKV(); // 在请求处理中创建 EdgeKV 实例
    
    if (edgeKV) {
      try {
        const key = this.getWhiteboardKey(boardId);
        const dataToSave = {
          ...data,
          timestamp: new Date().toISOString(),
          version: '1.0'
        };
        
        // 参考官方示例：put 成功返回 undefined
        const result = await edgeKV.put(key, JSON.stringify(dataToSave));
        
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

  // 加载白板数据（在 fetch 调用链中使用 EdgeKV）
  async loadWhiteboard(boardId = 'default') {
    const edgeKV = this.getEdgeKV(); // 在请求处理中创建 EdgeKV 实例
    
    if (edgeKV) {
      try {
        const key = this.getWhiteboardKey(boardId);
        
        // 参考官方示例：key 不存在时返回 undefined
        const result = await edgeKV.get(key, { type: "text" });
        
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

  // 删除白板数据（在 fetch 调用链中使用 EdgeKV）
  async deleteWhiteboard(boardId = 'default') {
    const edgeKV = this.getEdgeKV(); // 在请求处理中创建 EdgeKV 实例
    
    if (edgeKV) {
      try {
        const key = this.getWhiteboardKey(boardId);
        
        // 参考官方示例：delete 成功返回 true，失败返回 false
        const result = await edgeKV.delete(key);
        
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

// ========== 边缘函数标准入口 ==========
// 符合 ESA 要求：export default { async fetch(request) { ... } }

export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    // CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }

    try {
      // 创建存储服务实例
      const storage = new ESAStorageAPI({ namespace: 'whiteboard' });
      
      // 解析路径
      const pathname = url.pathname;
      const boardIdMatch = pathname.match(/\/api\/whiteboard\/([^\/]+)/);
      const boardId = boardIdMatch ? boardIdMatch[1] : 'default';
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      };
      
      // GET - 读取数据
      if (request.method === 'GET') {
        const data = await storage.loadWhiteboard(boardId);
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: corsHeaders
        });
      }
      
      // POST/PUT - 保存数据
      if (request.method === 'POST' || request.method === 'PUT') {
        const data = await request.json();
        const result = await storage.saveWhiteboard(data, boardId);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: corsHeaders
        });
      }
      
      // DELETE - 删除数据
      if (request.method === 'DELETE') {
        const result = await storage.deleteWhiteboard(boardId);
        return new Response(JSON.stringify(result), {
          status: result.success ? 200 : 404,
          headers: corsHeaders
        });
      }
      
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders
      });
      
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

// 同时导出类以便在其他地方使用
export { ESAStorageAPI };