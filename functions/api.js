// ESA 边缘函数 - 白板 API
// 操作 EdgeKV 内置 API

// 辅助函数：生成存储 Key
function getWhiteboardKey(boardId = 'default') {
  return `whiteboard_${boardId}`;
}

// 辅助函数：获取默认数据
function getDefaultData() {
  return {
    notes: [],
    sections: [],
    nextNoteId: 1,
    nextSectionId: 1,
    lastUpdated: new Date().toISOString()
  };
}

// 边缘函数标准入口
export default {
  async fetch(request) {
    try {
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

      // 在 fetch 中创建 EdgeKV 实例
      const edgeKV = new EdgeKV({ namespace: "whiteboard" });
      
      // 解析路径获取 boardId
      const pathname = url.pathname;
      const boardIdMatch = pathname.match(/\/api\/whiteboard\/([^\/]+)/);
      const boardId = boardIdMatch ? boardIdMatch[1] : 'default';
      const key = getWhiteboardKey(boardId);
      
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
      };
      
      // GET - 读取数据
      if (request.method === 'GET') {
        let value = await edgeKV.get(key, { type: "text" });
        
        if (value === undefined) {
          // 没有数据，返回默认值
          const defaultData = getDefaultData();
          return new Response(JSON.stringify(defaultData), {
            status: 200,
            headers: corsHeaders
          });
        } else {
          return new Response(value, {
            status: 200,
            headers: corsHeaders
          });
        }
      }
      
      // POST/PUT - 保存数据
      if (request.method === 'POST' || request.method === 'PUT') {
        const data = await request.json();
        const dataToSave = {
          ...data,
          timestamp: new Date().toISOString(),
          version: '1.0'
        };
        
        await edgeKV.put(key, JSON.stringify(dataToSave));
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Saved successfully' 
        }), {
          status: 200,
          headers: corsHeaders
        });
      }
      
      // DELETE - 删除数据
      if (request.method === 'DELETE') {
        const result = await edgeKV.delete(key);
        
        return new Response(JSON.stringify({ 
          success: result === true,
          message: result === true ? 'Deleted successfully' : 'Delete failed'
        }), {
          status: result === true ? 200 : 404,
          headers: corsHeaders
        });
      }
      
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders
      });
      
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: 'EdgeKV error', 
        message: e.message 
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
