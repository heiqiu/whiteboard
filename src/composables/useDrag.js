/**
 * 拖拽功能 Composable
 * 处理便签和区域的拖拽逻辑
 */
import { ref, onMounted, onUnmounted } from 'vue';
import { calculatePosition, clamp } from '../utils/whiteboard';
import { WHITEBOARD_CONFIG } from '../config';

export function useDrag(onDragEnd) {
  // 拖拽状态
  const draggingElement = ref(null);
  const dragType = ref(null); // 'note' or 'section'
  const dragOffset = ref({ x: 0, y: 0 });
  const sectionNotes = ref([]);

  /**
   * 开始拖拽便签
   */
  const startDragNote = (event, note, notes) => {
    event.preventDefault();
    draggingElement.value = note;
    dragType.value = 'note';
    sectionNotes.value = [];

    const noteRect = event.target.getBoundingClientRect();
    dragOffset.value = {
      x: event.clientX - noteRect.left,
      y: event.clientY - noteRect.top
    };
  };

  /**
   * 开始拖拽区域
   */
  const startDragSection = (event, section, notesInSection) => {
    event.preventDefault();
    draggingElement.value = section;
    dragType.value = 'section';
    sectionNotes.value = notesInSection;

    const sectionRect = event.target.getBoundingClientRect();
    dragOffset.value = {
      x: event.clientX - sectionRect.left,
      y: event.clientY - sectionRect.top
    };
  };

  /**
   * 处理鼠标移动
   */
  const handleMouseMove = (event) => {
    if (!dragType.value || !draggingElement.value) return;

    const whiteboardElement = document.getElementById('whiteboard');
    if (!whiteboardElement) return;

    const position = calculatePosition(event, whiteboardElement, dragOffset.value);

    if (dragType.value === 'note') {
      handleNoteMove(position);
    } else if (dragType.value === 'section') {
      handleSectionMove(position);
    }
  };

  /**
   * 处理便签移动
   */
  const handleNoteMove = (position) => {
    const note = draggingElement.value;
    
    if (note.sectionId) {
      // 便签在区域内
      const parentSection = document.querySelector(`[data-section-id="${note.sectionId}"]`);
      if (parentSection) {
        const section = JSON.parse(parentSection.dataset.section);
        note.left = clamp(
          position.x - section.left,
          0,
          section.width - WHITEBOARD_CONFIG.noteSize.width
        );
        note.top = clamp(
          position.y - section.top,
          0,
          section.height - WHITEBOARD_CONFIG.noteSize.height
        );
      }
    } else {
      // 独立便签
      note.left = Math.max(0, position.x);
      note.top = Math.max(0, position.y);
    }
  };

  /**
   * 处理区域移动
   */
  const handleSectionMove = (position) => {
    const section = draggingElement.value;
    const newLeft = Math.max(0, position.x);
    const newTop = Math.max(25, position.y); // 保证标题栏可见

    // 计算移动偏移量
    const deltaX = newLeft - section.left;
    const deltaY = newTop - section.top;

    // 更新区域位置
    section.left = newLeft;
    section.top = newTop;

    // 同步移动区域内的所有便签
    sectionNotes.value.forEach(note => {
      note.left = clamp(
        note.left + deltaX,
        0,
        section.width - WHITEBOARD_CONFIG.noteSize.width
      );
      note.top = clamp(
        note.top + deltaY,
        0,
        section.height - WHITEBOARD_CONFIG.noteSize.height
      );
    });
  };

  /**
   * 处理鼠标释放
   */
  const handleMouseUp = () => {
    if (draggingElement.value) {
      draggingElement.value = null;
      dragType.value = null;
      sectionNotes.value = [];
      
      // 触发拖拽结束回调
      if (onDragEnd) {
        onDragEnd();
      }
    }
  };

  // 挂载和卸载事件监听
  onMounted(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });

  onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  });

  return {
    draggingElement,
    dragType,
    startDragNote,
    startDragSection
  };
}
