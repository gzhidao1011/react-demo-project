/**
 * Token 管理工具
 * 提供 token 的存储、获取、清除等功能
 */

// Token 存储 Key
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const TOKEN_EXPIRES_KEY = "token_expires";
const REMEMBER_ME_KEY = "remember_me";

// 内存中的 Access Token（更安全）
let accessTokenInMemory: string | null = null;

/**
 * 获取存储方式（根据"记住我"选项）
 */
function getStorage(): Storage {
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === "true";
  return rememberMe ? localStorage : sessionStorage;
}

/**
 * 获取 Access Token
 * 优先从内存获取，内存没有则从存储中获取
 */
export function getAccessToken(): string | null {
  if (accessTokenInMemory) {
    return accessTokenInMemory;
  }
  const storage = getStorage();
  return storage.getItem(ACCESS_TOKEN_KEY);
}

/**
 * 设置 Access Token
 */
export function setAccessToken(token: string, rememberMe = false): void {
  accessTokenInMemory = token;
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, token);
  // 保存"记住我"选项
  if (rememberMe) {
    localStorage.setItem(REMEMBER_ME_KEY, "true");
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
  }
}

/**
 * 获取 Refresh Token
 */
export function getRefreshToken(): string | null {
  const storage = getStorage();
  return storage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * 设置 Refresh Token
 */
export function setRefreshToken(token: string, rememberMe = false): void {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * 设置 Token 过期时间
 */
export function setTokenExpires(expiresIn: number, rememberMe = false): void {
  const expiresAt = Date.now() + expiresIn * 1000;
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toString());
}

/**
 * 检查 Token 是否过期
 */
export function isTokenExpired(): boolean {
  const storage = getStorage();
  const expiresAt = storage.getItem(TOKEN_EXPIRES_KEY);
  if (!expiresAt) return true;
  // 提前 60 秒判断为过期，预留刷新时间
  return Date.now() > parseInt(expiresAt) - 60000;
}

/**
 * 登录响应数据接口
 */
export interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number; // 秒
  tokenType?: string;
  token?: string; // 兼容不同的 API 响应格式
}

/**
 * 保存登录响应的 Token
 */
export function saveTokens(response: LoginResponse, rememberMe = false): void {
  // 兼容不同的 API 响应格式
  const accessToken = response.accessToken || response.token;
  const refreshToken = response.refreshToken;
  const expiresIn = response.expiresIn || 3600; // 默认 1 小时

  if (accessToken) {
    setAccessToken(accessToken, rememberMe);
  }
  if (refreshToken) {
    setRefreshToken(refreshToken, rememberMe);
  }
  if (expiresIn) {
    setTokenExpires(expiresIn, rememberMe);
  }
}

/**
 * 清除所有 Token（登出时使用）
 */
export function clearTokens(): void {
  accessTokenInMemory = null;
  // 清除 localStorage 和 sessionStorage 中的 token
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
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

/**
 * 获取"记住我"选项
 */
export function getRememberMe(): boolean {
  return localStorage.getItem(REMEMBER_ME_KEY) === "true";
}
