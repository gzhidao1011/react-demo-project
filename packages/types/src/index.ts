/**
 * 共享类型定义
 */

/**
 * 用户信息响应（GET /auth/me）
 * 与后端 UserInfo 字段对应，API 返回 snake_case
 */
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  phone?: string;
  roles?: string[];
  /** 邮箱是否已验证（API 返回 email_verified） */
  email_verified?: boolean;
  /** 创建时间 ISO 8601（API 返回 created_at） */
  created_at?: string;
}
