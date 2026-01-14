// ESA 边缘函数 - 白板 API
// EdgeKV 必须在 fetch 函数内部直接创建和使用

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

// ========== 内部 API 函数（供 Vue 应用调用） ==========

// 保存白板数据
export async function saveWhiteboard(data, boardId = 'default') {
  // ✅ 在函数内部直接创建 EdgeKV（确保在 fetch 调用链中）
  const edgeKV = new EdgeKV({ namespace: 'whiteboard' });
  const key = getWhiteboardKey(boardId);
  
  const dataToSave = {
    ...data,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  
  await edgeKV.put(key, JSON.stringify(dataToSave));
  console.log('EdgeKV put success');
  return { success: true, message: 'Saved successfully' };
}

// 加载白板数据
export async function loadWhiteboard(boardId = 'default') {
  // ✅ 在函数内部直接创建 EdgeKV（确保在 fetch 调用链中）
  const edgeKV = new EdgeKV({ namespace: 'whiteboard' });
  const key = getWhiteboardKey(boardId);
  
  const result = await edgeKV.get(key, { type: "text" });
  
  if (result === undefined) {
    console.log('EdgeKV 中没有数据，返回默认值');
    return getDefaultData();
  }
  
  console.log('EdgeKV get success');
  return JSON.parse(result);
}

// 删除白板数据
export async function deleteWhiteboard(boardId = 'default') {
  // ✅ 在函数内部直接创建 EdgeKV（确保在 fetch 调用链中）
  const edgeKV = new EdgeKV({ namespace: 'whiteboard' });
  const key = getWhiteboardKey(boardId);
  
  const result = await edgeKV.delete(key);
  console.log('EdgeKV delete', result === true ? 'success' : 'failed');
  return { 
    success: result === true, 
    message: result === true ? 'Deleted successfully' : 'Delete failed' 
  };
}

// ========== 边缘函数标准入口（用于 HTTP 路由） ==========
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
        const data = await loadWhiteboard(boardId);
        return new Response(JSON.stringify(data), {
          status: 200,
          headers: corsHeaders
        });
      }
      
      // POST/PUT - 保存数据
      if (request.method === 'POST' || request.method === 'PUT') {
        const data = await request.json();
        const result = await saveWhiteboard(data, boardId);
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: corsHeaders
        });
      }
      
      // DELETE - 删除数据
      if (request.method === 'DELETE') {
        const result = await deleteWhiteboard(boardId);
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