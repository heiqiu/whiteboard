<template>
  <div id="whiteboard-container">
    <!-- 工具栏 -->
    <WhiteboardToolbar
      :saving="saving"
      :lastSaved="lastSaved"
      :checkingConflict="checkingConflict"
      :localVersion="localVersion"
      :hasConflict="hasConflict"
      :conflictCount="conflictCount"
      @create-note="handleCreateNote"
      @create-section="handleCreateSection"
      @save="handleManualSave"
    />
    
    <!-- 白板画布 -->
    <div id="whiteboard" class="whiteboard">
      <!-- 区域 -->
      <WhiteboardSection
        v-for="section in sections"
        :key="section.id"
        :section="section"
        @delete="handleDeleteSection"
        @edit-title="handleEditSectionTitle"
        @drag-start="(e) => startDragSection(e, section, getNotesInSection(section.id))"
        @resize-start="(e) => startResize(e, section)"
      >
        <!-- 区域内的便签 -->
        <StickyNote
          v-for="note in getNotesInSection(section.id)"
          :key="note.id"
          :note="note"
          @delete="handleDeleteNote"
          @edit="handleEditNote"
          @drag-start="(e) => startDragNote(e, note, notes)"
        />
      </WhiteboardSection>
      
      <!-- 独立便签 -->
      <StickyNote
        v-for="note in standaloneNotes"
        :key="note.id"
        :note="note"
        @delete="handleDeleteNote"
        @edit="handleEditNote"
        @drag-start="(e) => startDragNote(e, note, notes)"
      />
    </div>

    <!-- 自定义颜色选择器对话框 -->
    <ColorPickerDialog
      v-model:visible="colorPickerDialog.visible"
      :title="colorPickerDialog.title"
      :message="colorPickerDialog.message"
      :default-color="colorPickerDialog.defaultColor"
      :confirm-text="colorPickerDialog.confirmText"
      :cancel-text="colorPickerDialog.cancelText"
      @confirm="colorPickerDialog.onConfirm"
      @cancel="colorPickerDialog.onCancel"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { ElMessageBox } from 'element-plus';
import WhiteboardToolbar from './components/WhiteboardToolbar.vue';
import StickyNote from './components/StickyNote.vue';
import WhiteboardSection from './components/WhiteboardSection.vue';
import ColorPickerDialog from './components/ColorPickerDialog.vue';
import { saveWhiteboard, loadWhiteboard, checkVersion } from './services/esaApi.js';
import { useWhiteboardData } from './composables/useWhiteboardData.js';
import { useDrag } from './composables/useDrag.js';
import { useResize } from './composables/useResize.js';
import { useDialog } from './composables/useDialog.js';
import { useCollaboration } from './composables/useCollaboration.js';

export default {
  name: 'App',
  components: {
    WhiteboardToolbar,
    StickyNote,
    WhiteboardSection,
    ColorPickerDialog
  },
  setup() {
    // 常量
    const DEFAULT_BOARD_ID = 'default';
    const STORAGE_KEY = `whiteboard_${DEFAULT_BOARD_ID}`;

    // 使用对话框
    const { 
      colorPickerDialog,
      showConfirm, 
      showPrompt,
      showColorPicker,
      showTextArea,
      showSuccess,
      showError
    } = useDialog();

    // 使用白板数据管理
    const {
      notes,
      sections,
      standaloneNotes,
      version: dataVersion, // 数据版本号
      getNotesInSection,
      createNote,
      createSection,
      deleteNote,
      deleteSection,
      updateNote,
      updateSection,
      loadData,
      initializeDefaultData,
      getDataSnapshot
    } = useWhiteboardData();

    // 使用协作功能（不再管理版本号，只负责冲突检测）
    const {
      hasConflict,
      conflictData,
      checkForConflicts,
      resolveConflicts,
      clearConflict
    } = useCollaboration(DEFAULT_BOARD_ID);

    // 手动保存状态
    const saving = ref(false);
    const lastSaved = ref('');
    const checkingConflict = ref(false);
    const conflictCount = ref(0);

    // 保存前检查冲突（类似 git push）
    const saveWithConflictCheck = async () => {
      if (saving.value || checkingConflict.value) return;
      
      try {
        // 步骤1：检查冲突（使用数据版本号）
        checkingConflict.value = true;
        console.log('========== 开始保存流程 ==========');
        console.log('1. 准备检查冲突，本地版本:', dataVersion.value);
        const conflictResult = await checkForConflicts(dataVersion.value);
        console.log('2. 冲突检查完成，结果:', conflictResult);
        checkingConflict.value = false;
        
        if (conflictResult.hasConflict) {
          // 有冲突，显示冲突对话框
          const localData = getDataSnapshot();
          const result = resolveConflicts(localData, conflictResult.remoteData, 'merge');
          
          conflictCount.value = result.conflictCount;
          
          // 提示用户选择处理方式
          const choice = await showConflictDialog(result);
          
          if (choice === 'cancel') {
            showError('已取消保存');
            return;
          }
          
          let finalData;
          if (choice === 'use_remote') {
            // 使用远程数据（放弃本地更改）
            finalData = conflictResult.remoteData;
            loadData(finalData);
            showSuccess('已使用远程数据，本地更改已放弃');
          } else if (choice === 'use_local') {
            // 强制使用本地数据
            finalData = {
              ...localData,
              version: conflictResult.remoteVersion
            };
            showSuccess('将强制使用本地数据覆盖远程');
          } else {
            // 智能合并
            finalData = result.merged;
            loadData(finalData);
            showSuccess(`已自动合并 ${result.conflictCount} 个冲突`);
          }
          
          // 步骤2：保存合并后的数据
          await saveToCloud(finalData);
          clearConflict();
          conflictCount.value = 0;
        } else {
          // 无冲突，直接保存
          const dataToSave = getDataSnapshot();
          await saveToCloud(dataToSave);
        }
      } catch (error) {
        console.error('保存失败:', error);
        showError(`保存失败: ${error.message}`);
      }
    };
    
    // 显示冲突对话框
    const showConflictDialog = async (conflictResult) => {
      const conflictMessages = conflictResult.conflicts
        .slice(0, 5) // 最多显示5个
        .map(c => `• ${c.message}`)
        .join('\n');
      
      const moreMsg = conflictResult.conflicts.length > 5 
        ? `\n... 还有 ${conflictResult.conflicts.length - 5} 个冲突` 
        : '';
      
      const message = `检测到 ${conflictResult.conflictCount} 个冲突：

${conflictMessages}${moreMsg}

请选择处理方式：`;
      
      // 使用自定义对话框显示选项
      return new Promise((resolve) => {
        ElMessageBox({
          title: '冲突检测',
          message,
          showCancelButton: true,
          confirmButtonText: '自动合并',
          cancelButtonText: '取消',
          distinguishCancelAndClose: true,
          customClass: 'conflict-dialog',
          showClose: true,
          beforeClose: (action, instance, done) => {
            if (action === 'confirm') {
              resolve('merge');
              done();
            } else if (action === 'cancel') {
              resolve('cancel');
              done();
            } else {
              resolve('cancel');
              done();
            }
          }
        }).then(() => {
          resolve('merge');
        }).catch(() => {
          // 点击额外按钮
          ElMessageBox({
            title: '更多选项',
            message: '选择冲突处理策略：',
            showCancelButton: true,
            confirmButtonText: '使用远程数据',
            cancelButtonText: '强制使用本地',
            distinguishCancelAndClose: true
          }).then(() => {
            resolve('use_remote');
          }).catch((action) => {
            if (action === 'cancel') {
              resolve('use_local');
            } else {
              resolve('cancel');
            }
          });
        });
      });
    };
    
    // 保存到云端（带二次版本检查）
    const saveToCloud = async (dataToSave) => {
      saving.value = true;
      try {
        // 保存前二次检查版本（防止竞态条件）
        console.log('3. 保存前二次检查版本...');
        const finalCheck = await checkVersion(dataToSave.version || 0, DEFAULT_BOARD_ID);
        
        if (finalCheck.hasUpdate) {
          // 在检查和保存之间，远程数据又被更新了！
          console.log('   ⚠️ 检测到竞态条件！远程版本已更新为 v' + finalCheck.remoteVersion);
          saving.value = false;
          throw new Error(`保存失败：远程数据已被其他用户更新为 v${finalCheck.remoteVersion}，请重新检查冲突`);
        }
        
        console.log('3. 二次检查通过，开始保存...');
        const result = await saveWhiteboard(dataToSave, DEFAULT_BOARD_ID);
        console.log('4. 保存成功！新版本:', result.version);
        
        // 更新本地版本号
        if (result.version) {
          dataVersion.value = result.version; // 只更新 dataVersion
        }
        lastSaved.value = new Date().toLocaleString('zh-CN', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      } catch (error) {
        console.error('保存失败:', error);
        saving.value = false;
        // 降级到 localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...dataToSave,
          timestamp: new Date().toISOString(),
          version: dataVersion.value
        }));
        throw error;
      } finally {
        saving.value = false;
      }
    };

    // 使用拖拽功能
    const { startDragNote, startDragSection } = useDrag();

    // 使用调整大小功能
    const { startResize } = useResize();

    // 加载数据（调用独立边缘函数 wbkv）
    const loadWhiteboardData = async () => {
      try {
        const data = await loadWhiteboard(DEFAULT_BOARD_ID);
        
        if (data.notes?.length > 0 || data.sections?.length > 0) {
          loadData(data); // loadData 会同时加载 version
        } else {
          initializeDefaultData();
          // 初始化时直接保存，无需检查冲突
          const initialData = getDataSnapshot();
          await saveToCloud(initialData);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        // 降级到 localStorage
        const localData = localStorage.getItem(STORAGE_KEY);
        if (localData) {
          loadData(JSON.parse(localData));
        } else {
          initializeDefaultData();
        }
      }
    };

    // 事件处理函数
    const handleCreateNote = async () => {
      // 首先选择颜色
      const color = await showColorPicker({
        title: '选择便签颜色',
        message: '请选择便签颜色:',
        defaultColor: '#ffeb3b'
      });
      
      if (color !== null) {
        createNote({ color });
      }
    };

    const handleCreateSection = () => {
      createSection();
    };

    const handleDeleteNote = async (noteId) => {
      const confirmed = await showConfirm({
        title: '确认删除',
        message: '确定要删除这个便签吗?',
        confirmText: '删除',
        cancelText: '取消'
      });
      
      if (confirmed) {
        deleteNote(noteId);
      }
    };

    const handleDeleteSection = async (sectionId) => {
      const confirmed = await showConfirm({
        title: '确认删除',
        message: '确定要删除这个区域吗?',
        confirmText: '删除',
        cancelText: '取消'
      });
      
      if (confirmed) {
        deleteSection(sectionId);
      }
    };

    const handleEditNote = async (noteId, currentContent) => {
      const newContent = await showTextArea({
        title: '编辑便签',
        message: '请输入便签内容:',
        defaultValue: currentContent,
        placeholder: '请输入便签内容...',
        rows: 8
      });
      
      if (newContent !== null) {
        updateNote(noteId, { content: newContent });
      }
    };

    const handleEditSectionTitle = async (sectionId, currentTitle) => {
      const newTitle = await showPrompt({
        title: '编辑区域标题',
        message: '请输入区域标题:',
        defaultValue: currentTitle,
        placeholder: '请输入区域标题...'
      });
      
      if (newTitle !== null && newTitle.trim() !== '') {
        updateSection(sectionId, { title: newTitle.trim() });
      }
    };

    const handleManualSave = async () => {
      try {
        await saveWithConflictCheck();
        if (!hasConflict.value) {
          showSuccess('保存成功！');
        }
      } catch (error) {
        showError(`保存失败: ${error.message}`);
      }
    };

    // 挂载时加载数据
    onMounted(async () => {
      await loadWhiteboardData();
    });

    return {
      // 状态
      notes,
      sections,
      standaloneNotes,
      saving,
      lastSaved,
      checkingConflict,
      colorPickerDialog,
      // 协作状态
      localVersion: dataVersion, // 将 dataVersion 暴露为 localVersion 供模板使用
      hasConflict,
      conflictCount,
      
      // 方法
      getNotesInSection,
      startDragNote,
      startDragSection,
      startResize,
      handleCreateNote,
      handleCreateSection,
      handleDeleteNote,
      handleDeleteSection,
      handleEditNote,
      handleEditSectionTitle,
      handleManualSave
    };
  }
}
</script>

<style>
#whiteboard-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 10px;
  box-sizing: border-box;
}

.whiteboard {
  position: relative;
  flex: 1;
  background-color: #f5f5f5;
  border: 2px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background-image: 
    radial-gradient(circle, #e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
}
</style>