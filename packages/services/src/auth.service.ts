import type { AxiosResponse } from "axios";
import { apiService } from "./api.service";
import { type ApiResponseBase, handleApiResponse } from "./api.service.base";

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
  email: string;
  password: string;
}

/**
 * 登录响应（OAuth 2.0 格式）
 * 遵循 RFC 6749 Section 5.1
 */
export interface LoginResponse {
  /** Access Token（访问令牌） */
  accessToken: string;
  /** Token 类型，固定为 "Bearer" */
  tokenType?: string;
  /** Access Token 有效期（秒） */
  expiresIn: number;
  /** Refresh Token（刷新令牌） */
  refreshToken: string;
  /** 权限范围（可选） */
  scope?: string;
  /** 用户信息（扩展字段，非 OAuth 2.0 标准） */
  user?: {
    id: string;
    email: string;
    username: string;
    emailVerified?: boolean;
  };
}

/**
 * 刷新 Token 请求参数
 */
export interface RefreshTokenRequest {
  refreshToken: string;
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

export async function authRegister(data: RegisterRequest) {
  const response: AxiosResponse<ApiResponseBase<LoginResponse>> = await apiService.post<ApiResponseBase<LoginResponse>>(
    "/auth/register",
    data,
  );
  return handleApiResponse(response, "注册失败");
}

export async function authLogin(data: LoginRequest) {
  const response: AxiosResponse<ApiResponseBase<LoginResponse>> = await apiService.post<ApiResponseBase<LoginResponse>>(
    "/auth/login",
    data,
  );
  return handleApiResponse(response, "登录失败");
}

export async function authRefresh(refreshToken: string) {
  const response: AxiosResponse<ApiResponseBase<LoginResponse>> = await apiService.post<ApiResponseBase<LoginResponse>>(
    "/auth/refresh",
    {
      refreshToken,
    } as RefreshTokenRequest,
  );
  return handleApiResponse(response, "刷新 Token 失败");
}

export async function authLogout() {
  const response: AxiosResponse<ApiResponseBase<void>> = await apiService.post<ApiResponseBase<void>>("/auth/logout");
  return handleApiResponse(response, "登出失败");
}

export async function authGetCurrentUser() {
  const response: AxiosResponse<ApiResponseBase<UserInfo>> =
    await apiService.post<ApiResponseBase<UserInfo>>("/auth/me");
  return handleApiResponse(response, "获取用户信息失败");
}
