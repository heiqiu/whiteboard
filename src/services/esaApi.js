// ESA 边缘存储 API 服务
// EdgeKV 必须在 fetch 上下文中使用
// Vue 应用直接调用这些函数（非 HTTP）

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

// ========== EdgeKV API 函数（在 fetch 上下文中执行） ==========

// 保存白板数据
export async function saveWhiteboard(data, boardId = 'default') {
  // 在函数内部创建 EdgeKV（确保在 fetch 调用链中）
  const edgeKV = new EdgeKV({ namespace: "whiteboard" });
  const key = getWhiteboardKey(boardId);
  
  const dataToSave = {
    ...data,
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
  
  await edgeKV.put(key, JSON.stringify(dataToSave));
  return { success: true, message: 'Saved successfully' };
}

// 加载白板数据
export async function loadWhiteboard(boardId = 'default') {
  // 在函数内部创建 EdgeKV（确保在 fetch 调用链中）
  const edgeKV = new EdgeKV({ namespace: "whiteboard" });
  const key = getWhiteboardKey(boardId);
  
  let value = await edgeKV.get(key, { type: "text" });
  
  if (value === undefined) {
    return getDefaultData();
  } else {
    return JSON.parse(value);
  }
}

// 删除白板数据
export async function deleteWhiteboard(boardId = 'default') {
  // 在函数内部创建 EdgeKV（确保在 fetch 调用链中）
  const edgeKV = new EdgeKV({ namespace: "whiteboard" });
  const key = getWhiteboardKey(boardId);
  
  const result = await edgeKV.delete(key);
  return { 
    success: result === true, 
    message: result === true ? 'Deleted successfully' : 'Delete failed' 
  };
}