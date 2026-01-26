/**
 * 验证邮箱地址是否有效
 *
 * @param email - 待验证的邮箱地址
 * @returns 如果邮箱有效返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * import { validateEmail } from "@repo/utils";
 *
 * validateEmail("user@example.com"); // true
 * validateEmail("invalid-email"); // false
 * ```
 */
export function validateEmail(email: string): boolean {
  // 检查输入是否为字符串
  if (typeof email !== "string") {
    return false;
  }

  // 去除首尾空格
  const trimmedEmail = email.trim();

  // 检查是否为空
  if (!trimmedEmail) {
    return false;
  }

  // 检查长度（RFC 5321 规定邮箱地址最大长度为 320 字符）
  if (trimmedEmail.length > 320) {
    return false;
  }

  // 检查是否包含 @ 符号
  const atIndex = trimmedEmail.indexOf("@");
  if (atIndex === -1 || atIndex === 0 || atIndex === trimmedEmail.length - 1) {
    return false;
  }

  // 分离本地部分和域名部分
  const localPart = trimmedEmail.substring(0, atIndex);
  const domainPart = trimmedEmail.substring(atIndex + 1);

  // 验证本地部分
  // 本地部分不能为空，不能以点开头或结尾，不能包含连续的点
  if (
    !localPart ||
    localPart.length > 64 ||
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return false;
  }

  // 验证本地部分的字符（允许字母、数字、点、下划线、连字符、加号）
  const localPartRegex = /^[a-zA-Z0-9._+-]+$/;
  if (!localPartRegex.test(localPart)) {
    return false;
  }

  // 验证域名部分
  // 域名必须存在且不能为空
  if (!domainPart) {
    return false;
  }

  // 检查域名是否包含点（必须有顶级域名，如 .com）
  if (!domainPart.includes(".")) {
    return false;
  }

  // 域名不能以点开头或结尾，不能包含连续的点
  if (domainPart.startsWith(".") || domainPart.endsWith(".") || domainPart.includes("..")) {
    return false;
  }

  // 验证域名的每个部分
  const domainParts = domainPart.split(".");
  if (domainParts.length < 2) {
    return false;
  }

  // 验证每个域名部分
  for (const part of domainParts) {
    // 每个部分不能为空
    if (!part || part.length === 0) {
      return false;
    }

    // 每个部分不能以连字符开头或结尾（DNS 规范）
    if (part.startsWith("-") || part.endsWith("-")) {
      return false;
    }

    // 每个部分只能包含字母、数字和连字符
    const domainPartRegex = /^[a-zA-Z0-9-]+$/;
    if (!domainPartRegex.test(part)) {
      return false;
    }
  }

  // 验证顶级域名（最后一个部分）必须至少包含一个字母
  const tld = domainParts[domainParts.length - 1];
  if (!/[a-zA-Z]/.test(tld)) {
    return false;
  }

  // 使用正则表达式进行最终验证
  // 这个正则表达式匹配标准的邮箱格式
  const emailRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

  return emailRegex.test(trimmedEmail);
}
