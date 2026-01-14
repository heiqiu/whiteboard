/**
 * ESA 边缘函数示例 - 白板数据 API
 * 
 * 部署此函数到阿里云 ESA 边缘函数,实现白板数据的存储和读取
 * 
 * 前置条件:
 * 1. 在 ESA 控制台创建边缘存储命名空间: whiteboard
 * 2. 创建边缘函数并部署此代码
 * 3. 配置函数的触发路由
 */

export default {
  async fetch(request) {
    return handleRequest(request);
  }
}

/**
 * 处理 HTTP 请求
 */
async function handleRequest(request) {
  // 设置 CORS 头
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
    const edgeKV = new EdgeKV({ namespace: "whiteboard" });
    
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 解析路径: /api/whiteboard/:boardId
    const boardIdMatch = pathname.match(/\/api\/whiteboard\/([^\/]+)/);
    const boardId = boardIdMatch ? boardIdMatch[1] : 'default';
    const key = `whiteboard_${boardId}`;
    
    // GET - 读取白板数据
    if (request.method === 'GET') {
      const data = await edgeKV.get(key);
      
      if (data) {
        return new Response(data, {
          status: 200,
          headers: corsHeaders
        });
      } else {
        // 返回默认空数据
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
      }
    }
    
    // POST/PUT - 保存白板数据
    if (request.method === 'POST' || request.method === 'PUT') {
      const data = await request.json();
      
      // 添加时间戳和版本信息
      const dataToSave = {
        ...data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      // 保存到 EdgeKV
      const result = await edgeKV.put(key, JSON.stringify(dataToSave));
      
      if (result === undefined) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Whiteboard saved successfully' 
        }), {
          status: 200,
          headers: corsHeaders
        });
      } else {
        throw new Error('EdgeKV put failed');
      }
    }
    
    // DELETE - 删除白板数据
    if (request.method === 'DELETE') {
      const result = await edgeKV.delete(key);
      
      if (result === undefined) {
        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Whiteboard deleted successfully' 
        }), {
          status: 200,
          headers: corsHeaders
        });
      } else {
        throw new Error('EdgeKV delete failed');
      }
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
 * 使用示例:
 * 
 * 1. 读取白板数据:
 *    GET https://your-esa-domain.com/api/whiteboard/default
 * 
 * 2. 保存白板数据:
 *    POST https://your-esa-domain.com/api/whiteboard/default
 *    Body: { notes: [...], sections: [...] }
 * 
 * 3. 删除白板数据:
 *    DELETE https://your-esa-domain.com/api/whiteboard/default
 * 
 * 注意:
 * - EdgeKV 只能在 ESA 边缘函数环境中使用
 * - 数据同步到全球边缘节点需要几秒到300秒
 * - Value 大小限制为 1.8 MB
 */
