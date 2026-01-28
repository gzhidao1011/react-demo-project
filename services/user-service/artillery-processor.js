/**
 * Artillery 处理器函数
 * 用于生成随机数据和处理响应
 */

/**
 * 生成随机字符串
 */
function randomString() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * 生成随机邮箱
 */
function randomEmail() {
  return `${randomString()}@example.com`;
}

/**
 * 生成随机用户名
 */
function randomUsername() {
  return `user_${randomString().substring(0, 10)}`;
}

module.exports = {
  randomString,
  randomEmail,
  randomUsername,
};
