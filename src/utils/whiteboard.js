/**
 * 白板工具函数
 * 提供白板操作相关的辅助函数
 */

/**
 * 计算元素在容器内的安全位置
 * @param {number} position - 目标位置
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number} 安全的位置值
 */
export function clamp(position, min, max) {
  return Math.max(min, Math.min(position, max));
}

/**
 * 生成随机位置
 * @param {number} max - 最大值
 * @param {number} offset - 偏移量
 * @returns {number} 随机位置
 */
export function randomPosition(max = 400, offset = 50) {
  return Math.floor(Math.random() * max) + offset;
}

/**
 * 检查便签是否在区域内
 * @param {Object} note - 便签对象
 * @param {Object} section - 区域对象
 * @returns {boolean} 是否在区域内
 */
export function isNoteInSection(note, section) {
  return note.sectionId === section.id;
}

/**
 * 计算元素相对于容器的位置
 * @param {MouseEvent} event - 鼠标事件
 * @param {HTMLElement} container - 容器元素
 * @param {Object} offset - 偏移量 {x, y}
 * @returns {Object} 位置对象 {x, y}
 */
export function calculatePosition(event, container, offset) {
  const rect = container.getBoundingClientRect();
  return {
    x: event.clientX - rect.left - offset.x,
    y: event.clientY - rect.top - offset.y
  };
}

/**
 * 生成唯一 ID
 * @param {string} prefix - ID 前缀
 * @param {number} counter - 计数器
 * @returns {string} 唯一 ID
 */
export function generateId(prefix, counter) {
  return `${prefix}_${counter}_${Date.now()}`;
}

/**
 * 计算最大 ID
 * @param {Array} items - 项目数组
 * @param {string} idField - ID 字段名
 * @returns {number} 最大 ID 值
 */
export function getMaxId(items, idField = 'id') {
  if (!items || items.length === 0) return 0;
  return Math.max(...items.map(item => item[idField] || 0));
}
