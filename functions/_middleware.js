/**
 * ESA 边缘函数
 * 处理白板数据的 API 请求
 * 
 * 使用标准 Edge Function 入口格式
 * EdgeKV 必须在 fetch 函数或其调用的函数中使用
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 只处理 /api/whiteboard 路径
    if (!url.pathname.startsWith('/api/whiteboard')) {
      // 返回 404 或者传递给其他处理器
      return new Response('Not Found', { status: 404 });
    }

    return handleWhiteboardAPI(request, env);
  }
};

/**
 * 处理白板 API 请求
 */
async function handleWhiteboardAPI(request, env) {
  // CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // 处理 OPTIONS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    // 初始化 EdgeKV
    const edgeKV = new EdgeKV({ namespace: env.ESA_NAMESPACE || "whiteboard" });
    
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 解析路径: /api/whiteboard/:boardId
    const boardIdMatch = pathname.match(/\/api\/whiteboard\/([^\/]+)/);
    const boardId = boardIdMatch ? boardIdMatch[1] : 'default';
    const key = `whiteboard_${boardId}`;
    
    // GET - 读取白板数据
    if (request.method === 'GET') {
      return await getWhiteboard(edgeKV, key, corsHeaders);
    }
    
    // POST/PUT - 保存白板数据
    if (request.method === 'POST' || request.method === 'PUT') {
      return await saveWhiteboard(request, edgeKV, key, corsHeaders);
    }
    
    // DELETE - 删除白板数据
    if (request.method === 'DELETE') {
      return await deleteWhiteboard(edgeKV, key, corsHeaders);
    }
    
    // 不支持的方法
    return new Response(JSON.stringify({ 
      error: 'Method not allowed' 
    }), {
      status: 405,
      headers: corsHeaders
    });
    
  } catch (error) {
    console.error('EdgeKV operation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message 
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * 读取白板数据
 */
async function getWhiteboard(edgeKV, key, corsHeaders) {
  // 使用 text 类型读取数据
  const data = await edgeKV.get(key, { type: "text" });
  
  if (data === undefined) {
    // key 不存在,返回默认空数据
    const defaultData = {
      notes: [],
      sections: [],
      nextNoteId: 1,
      nextSectionId: 1,
      lastUpdated: new Date().toISOString()
    };
    return new Response(JSON.stringify(defaultData), {
      status: 200,
      headers: corsHeaders
    });
  } else {
    // 返回已存在的数据
    return new Response(data, {
      status: 200,
      headers: corsHeaders
    });
  }
}

/**
 * 保存白板数据
 */
async function saveWhiteboard(request, edgeKV, key, corsHeaders) {
  const data = await request.json();
  
  // 添加时间戳和版本信息
  const dataToSave = {
    ...data,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  
  // 保存到 EdgeKV (put 成功时返回 undefined)
  await edgeKV.put(key, JSON.stringify(dataToSave));
  
  // put 成功(没有异常)
  return new Response(JSON.stringify({ 
    success: true, 
    message: 'Whiteboard saved successfully' 
  }), {
    status: 200,
    headers: corsHeaders
  });
}

/**
 * 删除白板数据
 */
async function deleteWhiteboard(edgeKV, key, corsHeaders) {
  // delete 成功返回 true, 失败返回 false
  const result = await edgeKV.delete(key);
  
  if (result === true) {
    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Whiteboard deleted successfully' 
    }), {
      status: 200,
      headers: corsHeaders
    });
  } else {
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Whiteboard delete failed or key not found' 
    }), {
      status: 404,
      headers: corsHeaders
    });
  }
}
