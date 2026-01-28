/**
 * Token 管理工具
 * 提供 token 的存储、获取、清除等功能
 */

// Token  存储 Key
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const TOKEN_EXPIRES_KEY = "token_expires";

// 内存中的 Access Token（更安全）
let accessTokenInMemory: string | null = null;

/**
 * 获取 Access Token
 * 优先从内存获取，内存没有则从 sessionStorage 获取
 */
export function getAccessToken(): string | null {
  if (accessTokenInMemory) {
    return accessTokenInMemory;
  }
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * 设置 Access Token
 */
export function setAccessToken(token: string): void {
  accessTokenInMemory = token;
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
}

/**
 * 获取 Refresh Token
 */
export function getRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * 设置 Refresh Token
 */
export function setRefreshToken(token: string): void {
  sessionStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * 设置 Token 过期时间
 */
export function setTokenExpires(expiresIn: number): void {
  const expiresAt = Date.now() + expiresIn * 1000;
  sessionStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toString());
}

/**
 * 检查 Token 是否过期
 */
export function isTokenExpired(): boolean {
  const expiresAt = sessionStorage.getItem(TOKEN_EXPIRES_KEY);
  if (!expiresAt) return true;
  // 提前 60 秒判断为过期，预留刷新时间
  return Date.now() > parseInt(expiresAt) - 60000;
}

/**
 * 登录响应数据接口
 * 支持 OAuth 2.0 格式（snake_case 和 camelCase）
 */
export interface LoginResponse {
  accessToken?: string;
  access_token?: string; // OAuth 2.0 格式（snake_case）
  refreshToken?: string;
  refresh_token?: string; // OAuth 2.0 格式（snake_case）
  expiresIn?: number; // 秒
  expires_in?: number; // OAuth 2.0 格式（snake_case）
  tokenType?: string;
  token_type?: string; // OAuth 2.0 格式（snake_case）
  token?: string; // 兼容不同的 API 响应格式
}

/**
 * 保存登录响应的 Token
 * 支持 OAuth 2.0 格式（snake_case 和 camelCase）
 */
export function saveTokens(response: LoginResponse): void {
  // 兼容不同的 API 响应格式（优先使用 camelCase，其次使用 snake_case）
  const accessToken = response.accessToken || response.access_token || response.token;
  const refreshToken = response.refreshToken || response.refresh_token;
  const expiresIn = response.expiresIn || response.expires_in || 3600; // 默认 1 小时

  if (accessToken) {
    setAccessToken(accessToken);
  }
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
  if (expiresIn) {
    setTokenExpires(expiresIn);
  }
}

/**
 * 清除所有 Token（登出时使用）
 */
export function clearTokens(): void {
  accessTokenInMemory = null;
  // 清除 sessionStorage 中的 token
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRES_KEY);
}

/**
 * 检查是否已登录
 */
export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;
  // 如果 token 未过期，则认为已登录
  return !isTokenExpired();
}
