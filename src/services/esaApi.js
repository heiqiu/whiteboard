// ESA 边缘存储 API 服务
// 调用已部署的独立边缘函数 wbkv

// 边缘函数 URL
const EDGE_FUNCTION_URL = 'https://wbkv.25fa773a.er.aliyun-esa.net';

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

// ========== 调用独立边缘函数 wbkv 的 API ==========

// 保存白板数据
export async function saveWhiteboard(data, boardId = 'default') {
  const key = getWhiteboardKey(boardId);
  const value = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
    version: '1.0'
  });
  
  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}/put?key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to save: ${response.statusText}`);
    }
    
    return { success: true, message: 'Saved successfully' };
  } catch (error) {
    console.error('保存失败:', error);
    throw error;
  }
}

// 加载白板数据
export async function loadWhiteboard(boardId = 'default') {
  const key = getWhiteboardKey(boardId);
  
  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}/get?key=${encodeURIComponent(key)}`);
    
    if (response.status === 404) {
      // Key 不存在，返回默认数据
      return getDefaultData();
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load: ${response.statusText}`);
    }
    
    const value = await response.text();
    return JSON.parse(value);
  } catch (error) {
    console.error('加载失败:', error);
    throw error;
  }
}

// 删除白板数据
export async function deleteWhiteboard(boardId = 'default') {
  const key = getWhiteboardKey(boardId);
  
  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}/delete?key=${encodeURIComponent(key)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to delete: ${response.statusText}`);
    }
    
    return { success: true, message: 'Deleted successfully' };
  } catch (error) {
    console.error('删除失败:', error);
    throw error;
  }
}