/**
 * 应用配置文件
 * 统一管理应用的配置项和常量
 */

// 白板默认配置
export const WHITEBOARD_CONFIG = {
  defaultNotes: [
    { id: 1, content: '双击编辑内容', top: 50, left: 50, sectionId: null },
    { id: 2, content: '拖拽移动位置', top: 150, left: 150, sectionId: null }
  ],
  defaultSections: [
    { id: 1, title: '待办事项', top: 300, left: 100, width: 300, height: 200 },
    { id: 2, title: '重要事项', top: 300, left: 500, width: 300, height: 200 }
  ],
  minSectionSize: {
    width: 100,
    height: 100
  },
  noteSize: {
    width: 120,
    height: 100
  }
};

// 初始 ID 值
export const INITIAL_IDS = {
  note: 1,
  section: 1
};
