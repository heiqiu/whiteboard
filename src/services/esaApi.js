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
    version: 0,
    lastUpdated: new Date().toISOString()
  };
}

// ========== 调用独立边缘函数 wbkv 的 API ==========

// 保存白板数据（全量保存，带版本号）
export async function saveWhiteboard(data, boardId = 'default') {
  const key = getWhiteboardKey(boardId);
  const newVersion = (data.version || 0) + 1;
  const dataToSave = {
    ...data,
    version: newVersion,
    timestamp: new Date().toISOString()
  };
  const value = JSON.stringify(dataToSave);
  
  console.log('      [API] 准备保存 - Key:', key, ', 当前版本:', data.version, ', 新版本:', newVersion);
  
  try {
    const response = await fetch(`${EDGE_FUNCTION_URL}/put?key=${encodeURIComponent(key)}&value=${encodeURIComponent(value)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to save: ${response.statusText}`);
    }
    
    console.log('      [API] 保存成功 - 新版本已写入云端:', newVersion);
    return { success: true, message: 'Saved successfully', version: newVersion };
  } catch (error) {
    console.error('      [API] 保存失败:', error);
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
      console.log('      [API] 云端数据不存在，返回默认数据 v0');
      return getDefaultData();
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load: ${response.statusText}`);
    }
    
    const value = await response.text();
    const data = JSON.parse(value);
    // 确保有版本号
    if (!data.version) {
      data.version = 0;
    }
    console.log('      [API] 从云端加载数据 - 版本:', data.version, ', notes:', data.notes?.length || 0, ', sections:', data.sections?.length || 0);
    return data;
  } catch (error) {
    console.error('      [API] 加载失败:', error);
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

// 检查远程版本是否有更新
export async function checkVersion(localVersion, boardId = 'default') {
  try {
    console.log('      [API] 检查版本 - 本地:', localVersion, ', boardId:', boardId);
    const remoteData = await loadWhiteboard(boardId);
    console.log('      [API] 远程数据加载完成 - 远程版本:', remoteData.version);
    
    const hasUpdate = remoteData.version > localVersion;
    console.log('      [API] 比较结果:', remoteData.version, '>', localVersion, '=', hasUpdate);
    
    return {
      hasUpdate,
      remoteVersion: remoteData.version,
      remoteData
    };
  } catch (error) {
    console.error('      [API] 检查版本失败:', error);
    return { hasUpdate: false, remoteVersion: localVersion };
  }
}