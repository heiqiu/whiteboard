/**
 * 多人协作管理 Composable
 * 类似 Git 的工作流：保存前检查冲突，解决后再推送
 * 
 * 注意：版本号由 useWhiteboardData 管理，此处只负责冲突检测和合并逻辑
 */
import { ref } from 'vue';
import { checkVersion } from '../services/esaApi.js';

export function useCollaboration(boardId = 'default') {
  const hasConflict = ref(false);
  const conflictData = ref(null);
  
  /**
   * 检查是否有冲突（类似 git pull）
   * @param {Number} currentVersion - 当前本地版本号
   * @returns {Object} { hasConflict, remoteData, localVersion, remoteVersion }
   */
  const checkForConflicts = async (currentVersion) => {
    try {
      console.log('   [冲突检查] 开始检查，本地版本:', currentVersion);
      const result = await checkVersion(currentVersion, boardId);
      console.log('   [冲突检查] API返回 - 远程版本:', result.remoteVersion, ', 是否有更新:', result.hasUpdate);
      
      if (result.hasUpdate) {
        hasConflict.value = true;
        conflictData.value = result.remoteData;
        console.log('   [冲突检测] ⚠️ 发现冲突！本地 v' + currentVersion + ' vs 远程 v' + result.remoteVersion);
        
        return {
          hasConflict: true,
          remoteData: result.remoteData,
          localVersion: currentVersion,
          remoteVersion: result.remoteVersion
        };
      }
      
      hasConflict.value = false;
      conflictData.value = null;
      console.log('   [冲突检测] ✅ 无冲突，可以直接保存');
      
      return {
        hasConflict: false,
        remoteData: null,
        localVersion: currentVersion,
        remoteVersion: result.remoteVersion
      };
    } catch (error) {
      console.error('检查冲突失败:', error);
      return {
        hasConflict: false,
        error: error.message
      };
    }
  };
  
  /**
   * 合并冲突数据（智能合并策略）
   * @param {Object} localData - 本地数据
   * @param {Object} remoteData - 远程数据
   * @param {String} strategy - 合并策略: 'remote' | 'local' | 'merge'
   * @returns {Object} 合并后的数据和冲突详情
   */
  const resolveConflicts = (localData, remoteData, strategy = 'merge') => {
    const conflicts = [];
    
    if (strategy === 'remote') {
      // 策略1：完全使用远程数据（放弃本地更改）
      return {
        merged: {
          ...remoteData,
          version: remoteData.version
        },
        conflicts: [{ type: 'overwrite', message: '本地更改已被远程数据覆盖' }],
        conflictCount: 1
      };
    }
    
    if (strategy === 'local') {
      // 策略2：完全使用本地数据（强制推送）
      return {
        merged: {
          ...localData,
          version: remoteData.version // 使用远程版本号
        },
        conflicts: [{ type: 'force', message: '强制推送本地更改' }],
        conflictCount: 1
      };
    }
    
    // 策略3：智能合并（默认）
    const merged = {
      notes: [],
      sections: [],
      nextNoteId: Math.max(localData.nextNoteId || 1, remoteData.nextNoteId || 1),
      nextSectionId: Math.max(localData.nextSectionId || 1, remoteData.nextSectionId || 1),
      version: remoteData.version
    };
    
    // 合并便签
    const noteMap = new Map();
    const localNoteIds = new Set();
    const remoteNoteIds = new Set();
    
    // 记录本地便签
    (localData.notes || []).forEach(note => {
      noteMap.set(note.id, { local: note, remote: null });
      localNoteIds.add(note.id);
    });
    
    // 记录远程便签
    (remoteData.notes || []).forEach(note => {
      if (noteMap.has(note.id)) {
        noteMap.get(note.id).remote = note;
      } else {
        noteMap.set(note.id, { local: null, remote: note });
      }
      remoteNoteIds.add(note.id);
    });
    
    // 处理便签冲突
    noteMap.forEach((value, id) => {
      const { local, remote } = value;
      
      if (local && remote) {
        // 两边都存在，检查是否有差异
        if (JSON.stringify(local) !== JSON.stringify(remote)) {
          conflicts.push({
            type: 'note_modified',
            id,
            message: `便签 ${id} 在两端都被修改`,
            local,
            remote
          });
          // 远程优先
          merged.notes.push(remote);
        } else {
          // 无差异
          merged.notes.push(local);
        }
      } else if (local && !remote) {
        // 仅本地存在（本地新增或远程删除）
        conflicts.push({
          type: 'note_local_only',
          id,
          message: `便签 ${id} 仅在本地存在（可能远程已删除）`,
          local
        });
        // 保留本地的
        merged.notes.push(local);
      } else if (!local && remote) {
        // 仅远程存在（远程新增或本地删除）
        conflicts.push({
          type: 'note_remote_only',
          id,
          message: `便签 ${id} 仅在远程存在（远程新增）`,
          remote
        });
        // 保留远程的
        merged.notes.push(remote);
      }
    });
    
    // 合并区域（同样的逻辑）
    const sectionMap = new Map();
    
    (localData.sections || []).forEach(section => {
      sectionMap.set(section.id, { local: section, remote: null });
    });
    
    (remoteData.sections || []).forEach(section => {
      if (sectionMap.has(section.id)) {
        sectionMap.get(section.id).remote = section;
      } else {
        sectionMap.set(section.id, { local: null, remote: section });
      }
    });
    
    sectionMap.forEach((value, id) => {
      const { local, remote } = value;
      
      if (local && remote) {
        if (JSON.stringify(local) !== JSON.stringify(remote)) {
          conflicts.push({
            type: 'section_modified',
            id,
            message: `区域 ${id} 在两端都被修改`,
            local,
            remote
          });
          merged.sections.push(remote);
        } else {
          merged.sections.push(local);
        }
      } else if (local && !remote) {
        conflicts.push({
          type: 'section_local_only',
          id,
          message: `区域 ${id} 仅在本地存在`,
          local
        });
        merged.sections.push(local);
      } else if (!local && remote) {
        conflicts.push({
          type: 'section_remote_only',
          id,
          message: `区域 ${id} 仅在远程存在`,
          remote
        });
        merged.sections.push(remote);
      }
    });
    
    return {
      merged,
      conflicts,
      conflictCount: conflicts.length
    };
  };
  
  /**
   * 清除冲突状态
   */
  const clearConflict = () => {
    hasConflict.value = false;
    conflictData.value = null;
  };
  
  return {
    hasConflict,
    conflictData,
    checkForConflicts,
    resolveConflicts,
    clearConflict
  };
}
