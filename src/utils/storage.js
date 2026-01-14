/**
 * 存储工具函数
 * 提供数据序列化和反序列化的辅助函数
 */

/**
 * 序列化数据为 JSON 字符串
 * @param {*} data - 要序列化的数据
 * @returns {string|null} JSON 字符串或 null
 */
export function serialize(data) {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('序列化失败:', error);
    return null;
  }
}

/**
 * 反序列化 JSON 字符串为数据
 * @param {string} jsonString - JSON 字符串
 * @param {*} defaultValue - 默认值
 * @returns {*} 反序列化后的数据或默认值
 */
export function deserialize(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('反序列化失败:', error);
    return defaultValue;
  }
}

/**
 * 创建数据快照
 * @param {Object} data - 原始数据
 * @returns {Object} 数据的深拷贝
 */
export function createSnapshot(data) {
  return deserialize(serialize(data), {});
}

/**
 * 验证数据结构
 * @param {Object} data - 要验证的数据
 * @param {Array} requiredFields - 必需字段数组
 * @returns {boolean} 是否有效
 */
export function validateDataStructure(data, requiredFields = []) {
  if (!data || typeof data !== 'object') return false;
  return requiredFields.every(field => field in data);
}
