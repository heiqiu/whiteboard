<template>
  <div id="whiteboard-container">
    <!-- 工具栏 -->
    <WhiteboardToolbar
      :saving="saving"
      :lastSaved="lastSaved"
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
import { onMounted } from 'vue';
import WhiteboardToolbar from './components/WhiteboardToolbar.vue';
import StickyNote from './components/StickyNote.vue';
import WhiteboardSection from './components/WhiteboardSection.vue';
import ColorPickerDialog from './components/ColorPickerDialog.vue';
import ESAStorageAPI from './services/esaApi.js';
import { useWhiteboardData } from './composables/useWhiteboardData.js';
import { useDrag } from './composables/useDrag.js';
import { useResize } from './composables/useResize.js';
import { useAutoSave } from './composables/useAutoSave.js';
import { useDialog } from './composables/useDialog.js';
import { ESA_CONFIG } from './config';

export default {
  name: 'App',
  components: {
    WhiteboardToolbar,
    StickyNote,
    WhiteboardSection,
    ColorPickerDialog
  },
  setup() {
    // 初始化 ESA API
    const esaAPI = new ESAStorageAPI(ESA_CONFIG);

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

    // 保存回调函数
    const saveCallback = async () => {
      const dataToSave = getDataSnapshot();
      await esaAPI.saveWhiteboard(dataToSave, ESA_CONFIG.defaultBoardId);
      console.log('白板数据已保存');
    };

    // 使用自动保存
    const { saving, lastSaved, triggerAutoSave, manualSave } = useAutoSave(saveCallback);

    // 使用拖拽功能
    const { startDragNote, startDragSection } = useDrag(triggerAutoSave);

    // 使用调整大小功能
    const { startResize } = useResize(triggerAutoSave);

    // 加载数据
    const loadWhiteboardData = async () => {
      try {
        const data = await esaAPI.loadWhiteboard(ESA_CONFIG.defaultBoardId);
        
        if (data.notes && data.notes.length > 0 || data.sections && data.sections.length > 0) {
          loadData(data);
        } else {
          // 初始化默认数据
          initializeDefaultData();
          await saveCallback();
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        initializeDefaultData();
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
        triggerAutoSave();
      }
    };

    const handleCreateSection = () => {
      createSection();
      triggerAutoSave();
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
        triggerAutoSave();
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
        triggerAutoSave();
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
        triggerAutoSave();
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
        triggerAutoSave();
      }
    };

    const handleManualSave = async () => {
      try {
        await manualSave();
        showSuccess('保存成功！');
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
      colorPickerDialog,
      
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