/**
 * 对话框 Composable
 * 使用 Element Plus 的对话框组件
 */
import { ref } from 'vue';
import { ElMessageBox, ElMessage } from 'element-plus';

export function useDialog() {
  // 颜色选择器对话框状态
  const colorPickerDialog = ref({
    visible: false,
    title: '选择颜色',
    message: '请选择便签颜色:',
    defaultColor: '#ffeb3b',
    confirmText: '确定',
    cancelText: '取消',
    onConfirm: null,
    onCancel: null
  });

  /**
   * 显示确认对话框
   * @param {Object} options - 配置选项
   * @returns {Promise<boolean>} - 用户确认返回 true, 取消返回 false
   */
  const showConfirm = (options) => {
    return ElMessageBox.confirm(
      options.message || '',
      options.title || '确认',
      {
        confirmButtonText: options.confirmText || '确定',
        cancelButtonText: options.cancelText || '取消',
        type: options.type || 'warning',
        center: true,
        draggable: true
      }
    )
      .then(() => {
        if (options.onConfirm) options.onConfirm();
        return true;
      })
      .catch(() => {
        if (options.onCancel) options.onCancel();
        return false;
      });
  };

  /**
   * 显示输入对话框
   * @param {Object} options - 配置选项
   * @returns {Promise<string|null>} - 用户输入的值,取消返回 null
   */
  const showPrompt = (options) => {
    return ElMessageBox.prompt(
      options.message || '',
      options.title || '输入',
      {
        confirmButtonText: options.confirmText || '确定',
        cancelButtonText: options.cancelText || '取消',
        inputPlaceholder: options.placeholder || '请输入...',
        inputValue: options.defaultValue || '',
        center: true,
        draggable: true
      }
    )
      .then(({ value }) => {
        if (options.onConfirm) options.onConfirm(value);
        return value;
      })
      .catch(() => {
        if (options.onCancel) options.onCancel();
        return null;
      });
  };

  /**
   * 显示颜色选择器
   * @param {Object} options - 配置选项
   * @returns {Promise<string|null>} - 用户选择的颜色,取消返回 null
   */
  const showColorPicker = (options) => {
    return new Promise((resolve) => {
      colorPickerDialog.value = {
        visible: true,
        title: options.title || '选择颜色',
        message: options.message || '请选择便签颜色:',
        defaultColor: options.defaultColor || '#ffeb3b',
        confirmText: options.confirmText || '确定',
        cancelText: options.cancelText || '取消',
        onConfirm: (color) => {
          resolve(color);
          if (options.onConfirm) options.onConfirm(color);
        },
        onCancel: () => {
          resolve(null);
          if (options.onCancel) options.onCancel();
        }
      };
    });
  };

  /**
   * 显示文本域对话框 (使用 Element Plus 的大输入框)
   * @param {Object} options - 配置选项
   * @returns {Promise<string|null>} - 用户输入的值,取消返回 null
   */
  const showTextArea = (options) => {
    return ElMessageBox({
      title: options.title || '输入',
      message: options.message || '',
      showInput: true,
      inputType: 'textarea',
      inputPlaceholder: options.placeholder || '请输入...',
      inputValue: options.defaultValue || '',
      confirmButtonText: options.confirmText || '确定',
      cancelButtonText: options.cancelText || '取消',
      center: true,
      draggable: true,
      customClass: 'textarea-message-box'
    })
      .then(({ value }) => {
        if (options.onConfirm) options.onConfirm(value);
        return value;
      })
      .catch(() => {
        if (options.onCancel) options.onCancel();
        return null;
      });
  };

  /**
   * 显示成功消息
   */
  const showSuccess = (message) => {
    ElMessage.success(message);
  };

  /**
   * 显示错误消息
   */
  const showError = (message) => {
    ElMessage.error(message);
  };

  /**
   * 显示警告消息
   */
  const showWarning = (message) => {
    ElMessage.warning(message);
  };

  /**
   * 显示信息消息
   */
  const showInfo = (message) => {
    ElMessage.info(message);
  };

  return {
    colorPickerDialog,
    showConfirm,
    showPrompt,
    showColorPicker,
    showTextArea,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
