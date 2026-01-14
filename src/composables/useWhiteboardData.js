/**
 * 白板数据管理 Composable
 * 管理便签和区域的状态
 */
import { ref, computed } from 'vue';
import { WHITEBOARD_CONFIG, INITIAL_IDS } from '../config';
import { getMaxId } from '../utils/whiteboard';

export function useWhiteboardData() {
  // 状态
  const notes = ref([]);
  const sections = ref([]);
  const nextNoteId = ref(INITIAL_IDS.note);
  const nextSectionId = ref(INITIAL_IDS.section);

  // 计算属性 - 独立便签(不在任何区域内的)
  const standaloneNotes = computed(() => {
    return notes.value.filter(note => !note.sectionId);
  });

  /**
   * 获取区域内的便签
   */
  const getNotesInSection = (sectionId) => {
    return notes.value.filter(note => note.sectionId === sectionId);
  };

  /**
   * 创建新便签
   */
  const createNote = (options = {}) => {
    const newNote = {
      id: nextNoteId.value++,
      content: options.content || '新便签',
      color: options.color || '#ffeb3b',
      top: options.top || Math.floor(Math.random() * 400) + 50,
      left: options.left || Math.floor(Math.random() * 400) + 50,
      sectionId: options.sectionId || null
    };
    notes.value.push(newNote);
    return newNote;
  };

  /**
   * 创建新区域
   */
  const createSection = (options = {}) => {
    const newSection = {
      id: nextSectionId.value++,
      title: options.title || `区域 ${nextSectionId.value - 1}`,
      top: options.top || Math.floor(Math.random() * 300) + 50,
      left: options.left || Math.floor(Math.random() * 500) + 50,
      width: options.width || 250,
      height: options.height || 180
    };
    sections.value.push(newSection);
    return newSection;
  };

  /**
   * 删除便签
   */
  const deleteNote = (noteId) => {
    const index = notes.value.findIndex(note => note.id === noteId);
    if (index !== -1) {
      notes.value.splice(index, 1);
      return true;
    }
    return false;
  };

  /**
   * 删除区域及其内部的所有便签
   */
  const deleteSection = (sectionId) => {
    const sectionIndex = sections.value.findIndex(s => s.id === sectionId);
    if (sectionIndex !== -1) {
      sections.value.splice(sectionIndex, 1);
      // 删除区域内的所有便签
      notes.value = notes.value.filter(note => note.sectionId !== sectionId);
      return true;
    }
    return false;
  };

  /**
   * 更新便签内容
   */
  const updateNote = (noteId, updates) => {
    const note = notes.value.find(n => n.id === noteId);
    if (note) {
      Object.assign(note, updates);
      return true;
    }
    return false;
  };

  /**
   * 更新区域
   */
  const updateSection = (sectionId, updates) => {
    const section = sections.value.find(s => s.id === sectionId);
    if (section) {
      Object.assign(section, updates);
      return true;
    }
    return false;
  };

  /**
   * 加载数据
   */
  const loadData = (data) => {
    notes.value = data.notes || [];
    sections.value = data.sections || [];
    nextNoteId.value = data.nextNoteId || getMaxId(notes.value) + 1;
    nextSectionId.value = data.nextSectionId || getMaxId(sections.value) + 1;
  };

  /**
   * 初始化默认数据
   */
  const initializeDefaultData = () => {
    notes.value = [...WHITEBOARD_CONFIG.defaultNotes];
    sections.value = [...WHITEBOARD_CONFIG.defaultSections];
    nextNoteId.value = getMaxId(notes.value) + 1;
    nextSectionId.value = getMaxId(sections.value) + 1;
  };

  /**
   * 获取当前数据快照
   */
  const getDataSnapshot = () => {
    return {
      notes: [...notes.value],
      sections: [...sections.value],
      nextNoteId: nextNoteId.value,
      nextSectionId: nextSectionId.value,
      lastUpdated: new Date().toISOString()
    };
  };

  /**
   * 清空所有数据
   */
  const clearAll = () => {
    notes.value = [];
    sections.value = [];
    nextNoteId.value = INITIAL_IDS.note;
    nextSectionId.value = INITIAL_IDS.section;
  };

  return {
    // 状态
    notes,
    sections,
    nextNoteId,
    nextSectionId,
    standaloneNotes,
    
    // 方法
    getNotesInSection,
    createNote,
    createSection,
    deleteNote,
    deleteSection,
    updateNote,
    updateSection,
    loadData,
    initializeDefaultData,
    getDataSnapshot,
    clearAll
  };
}
