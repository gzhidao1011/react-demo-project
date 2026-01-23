import { apiService } from "./api.service";
import type { ApiResponseBase } from "./api.service.base";
/**
 * 注册请求参数
 */
export interface RegisterRequest {
  username?: string;
  email: string;
  password: string;
  phone?: string;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * 用户信息响应
 */
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  phone?: string;
  roles?: string[];
  createdAt?: string;
}

export function authRegister(data: RegisterRequest) {
  return apiService.post<ApiResponseBase<UserInfo>>("/auth/register", data);
}

export function authLogin(data: LoginRequest) {
  return apiService.post<ApiResponseBase<UserInfo>>("/auth/login", data);
}

export function authRefresh(refreshToken: string) {
  return apiService.post<ApiResponseBase<UserInfo>>("/auth/refresh", { refreshToken });
}

export function authLogout() {
  return apiService.post<ApiResponseBase<void>>("/auth/logout");
}

export function authGetCurrentUser() {
  return apiService.post<ApiResponseBase<UserInfo>>("/auth/me");
}
