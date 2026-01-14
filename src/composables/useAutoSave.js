/**
 * 自动保存功能 Composable
 * 处理数据的自动保存逻辑
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { AUTO_SAVE_CONFIG } from '../config';

export function useAutoSave(saveCallback) {
  const saving = ref(false);
  const lastSaved = ref('');
  const autoSaveTimer = ref(null);
  const intervalTimer = ref(null);

  /**
   * 触发自动保存(防抖)
   */
  const triggerAutoSave = () => {
    // 清除之前的定时器
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value);
    }

    // 设置新的定时器
    autoSaveTimer.value = setTimeout(async () => {
      await executeSave();
    }, AUTO_SAVE_CONFIG.debounceDelay);
  };

  /**
   * 执行保存
   */
  const executeSave = async () => {
    if (saving.value) return;

    saving.value = true;
    try {
      await saveCallback();
      lastSaved.value = new Date().toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('保存失败:', error);
      throw error;
    } finally {
      saving.value = false;
    }
  };

  /**
   * 手动保存
   */
  const manualSave = async () => {
    // 清除防抖定时器
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value);
      autoSaveTimer.value = null;
    }
    await executeSave();
  };

  /**
   * 启动定期自动保存
   */
  const startPeriodicSave = () => {
    intervalTimer.value = setInterval(() => {
      triggerAutoSave();
    }, AUTO_SAVE_CONFIG.intervalDelay);
  };

  /**
   * 停止定期自动保存
   */
  const stopPeriodicSave = () => {
    if (intervalTimer.value) {
      clearInterval(intervalTimer.value);
      intervalTimer.value = null;
    }
  };

  // 挂载时启动定期保存
  onMounted(() => {
    startPeriodicSave();
  });

  // 卸载时清理定时器
  onUnmounted(() => {
    if (autoSaveTimer.value) {
      clearTimeout(autoSaveTimer.value);
    }
    stopPeriodicSave();
  });

  return {
    saving,
    lastSaved,
    triggerAutoSave,
    manualSave,
    startPeriodicSave,
    stopPeriodicSave
  };
}
