/**
 * MVU 变量安全写入工具库
 *
 * 解决的核心问题：
 * MVU 内部在 MvuData 中维护了 initialized_lorebooks 等内部字段，
 * 如果直接用 { stat_data: ... } 覆盖写入，会丢失这些内部字段，
 * 导致 MVU 在下一轮消息处理时重新初始化变量。
 *
 * 所有函数都遵循"读取-修改-写回"模式，确保内部字段不会丢失。
 *
 * 使用前提：
 * - 必须先执行 await waitGlobalInitialized('Mvu') 确保 MVU 就绪
 * - Mvu、createChatMessages 等接口已在全局可用
 */

/**
 * 安全地写入 MVU 变量到指定楼层
 * 先读取该楼层已有的完整 MVU 数据（保留 initialized_lorebooks 等内部字段），
 * 再只替换 stat_data 部分后写回
 *
 * @param {Record<string, any>} statData - 要写入的 stat_data 对象
 * @param {object} option - 变量选项，如 { type: 'message', message_id: 0 }
 * @returns {Promise<object>} 写入后的完整 MVU 数据
 *
 * @example
 * await mvuSafeWrite(
 *   { 好感度: 80, 场景: '花园' },
 *   { type: 'message', message_id: 0 }
 * );
 */
async function mvuSafeWrite(statData, option) {
  var existingData = Mvu.getMvuData(option) || {};
  existingData.stat_data = statData;
  await Mvu.replaceMvuData(existingData, option);
  console.info('[MVU安全写入] 已写入变量到', JSON.stringify(option));
  return existingData;
}

/**
 * 安全地更新 MVU 变量的部分字段（合并而非覆盖）
 * 先读取完整 MVU 数据，再用 Object.assign 将 partialStatData 合并到现有 stat_data 中，
 * 不会影响 stat_data 中未提及的字段
 *
 * @param {Record<string, any>} partialStatData - 要更新的字段
 * @param {object} option - 变量选项，如 { type: 'message', message_id: 0 }
 * @returns {Promise<object>} 写入后的完整 MVU 数据
 *
 * @example
 * // 只更新好感度，不影响 stat_data 中的其他字段
 * await mvuSafeMerge(
 *   { 好感度: 90 },
 *   { type: 'message', message_id: 0 }
 * );
 */
async function mvuSafeMerge(partialStatData, option) {
  var existingData = Mvu.getMvuData(option) || {};
  if (!existingData.stat_data) {
    existingData.stat_data = {};
  }
  Object.assign(existingData.stat_data, partialStatData);
  await Mvu.replaceMvuData(existingData, option);
  console.info('[MVU安全合并] 已合并变量到', JSON.stringify(option));
  return existingData;
}

/**
 * 获取指定楼层的完整 MVU 数据（包含 initialized_lorebooks 等内部字段）
 * 用于传递给 createChatMessages 的 data 参数
 *
 * @param {object} option - 变量选项，如 { type: 'message', message_id: 0 }
 * @param {Record<string, any>} [statData] - 可选，如果提供则替换 stat_data
 * @returns {object} 完整的 MVU 数据
 *
 * @example
 * // 获取完整数据并替换 stat_data
 * var fullData = mvuGetFullData(
 *   { type: 'message', message_id: 0 },
 *   { 好感度: 60, 场景: '酒馆' }
 * );
 *
 * // 仅获取完整数据，不修改
 * var fullData = mvuGetFullData({ type: 'message', message_id: 0 });
 */
function mvuGetFullData(option, statData) {
  var data = Mvu.getMvuData(option) || {};
  if (statData) {
    data.stat_data = statData;
  }
  return data;
}

/**
 * 创建带有 MVU 变量的新楼层（安全方式）
 * 会自动从第 0 楼读取完整 MVU 数据结构，替换 stat_data 后传入 createChatMessages，
 * 确保新楼层拥有完整的 MVU 内部字段
 *
 * @param {string} role - 消息角色：'user' | 'assistant' | 'system'
 * @param {string} message - 消息内容
 * @param {Record<string, any>} statData - stat_data 对象
 * @param {object} [createOption] - createChatMessages 的额外选项
 * @returns {Promise<void>}
 *
 * @example
 * await mvuCreateMessage('assistant', '欢迎来到酒馆！', {
 *   好感度: 50,
 *   场景: '酒馆入口'
 * });
 */
async function mvuCreateMessage(role, message, statData, createOption) {
  var fullData = mvuGetFullData({ type: 'message', message_id: 0 }, statData);
  await createChatMessages([{
    role: role,
    message: message,
    data: fullData
  }], createOption || {});
  console.info('[MVU安全创建] 已创建', role, '楼层');
}
