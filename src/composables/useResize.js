/**
 * 调整大小功能 Composable
 * 处理区域大小调整逻辑
 */
import { WHITEBOARD_CONFIG } from '../config';

export function useResize() {
  /**
   * 开始调整大小
   */
  const startResize = (event, section) => {
    event.preventDefault();
    event.stopPropagation();

    const originalWidth = section.width;
    const originalHeight = section.height;
    const startX = event.clientX;
    const startY = event.clientY;

    const handleMouseMove = (moveEvent) => {
      const diffX = moveEvent.clientX - startX;
      const diffY = moveEvent.clientY - startY;

      // 更新区域大小,应用最小尺寸限制
      section.width = Math.max(
        WHITEBOARD_CONFIG.minSectionSize.width,
        originalWidth + diffX
      );
      section.height = Math.max(
        WHITEBOARD_CONFIG.minSectionSize.height,
        originalHeight + diffY
      );
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return {
    startResize
  };
}
