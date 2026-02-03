import type { UserInfo } from "@repo/types";
import { getRefreshToken } from "@repo/utils";
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
  /** 用户同意服务条款和隐私政策的时间戳（可选，符合 GDPR/CCPA）ISO 8601 格式 */
  acceptedTermsAt?: string;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 注册响应（邮箱验证模式）
 * 注册后不返回 token，仅提示用户查收验证邮件
 */
export interface RegisterResponse {
  message: string;
  email: string;
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

// UserInfo 类型已移至 @repo/types，此处重新导出以保持向后兼容
export type { UserInfo } from "@repo/types";

export async function authRegister(data: RegisterRequest): Promise<RegisterResponse> {
  const response: AxiosResponse<ApiResponseBase<RegisterResponse>> = await apiService.post<
    ApiResponseBase<RegisterResponse>
  >("/auth/register", data);
  const body = handleApiResponse(response, "注册失败");
  return body.data!;
}

export async function authVerifyEmail(token: string): Promise<LoginResponse> {
  const response: AxiosResponse<ApiResponseBase<LoginResponse>> = await apiService.post<ApiResponseBase<LoginResponse>>(
    "/auth/verify-email",
    { token },
  );
  const body = handleApiResponse(response, "验证失败");
  return body.data!;
}

export async function authResendVerification(email: string): Promise<void> {
  const response: AxiosResponse<ApiResponseBase<void>> = await apiService.post<ApiResponseBase<void>>(
    "/auth/resend-verification",
    { email },
  );
  handleApiResponse(response, "重新发送失败");
}

/**
 * 忘记密码：请求发送重置邮件
 * 调用前对 email 做 trim().toLowerCase() 标准化
 */
export async function authForgotPassword(email: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  const response: AxiosResponse<ApiResponseBase<{ message?: string }>> = await apiService.post<
    ApiResponseBase<{ message?: string }>
  >("/auth/forgot-password", { email: normalizedEmail });
  handleApiResponse(response, "忘记密码请求失败");
}

/**
 * 重置密码：使用 token 设置新密码
 * 不传 email，后端仅依赖 token
 */
export async function authResetPassword(token: string, newPassword: string): Promise<void> {
  const response: AxiosResponse<ApiResponseBase<void>> = await apiService.post<ApiResponseBase<void>>(
    "/auth/reset-password",
    { token, newPassword },
  );
  handleApiResponse(response, "重置密码失败");
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
    { refresh_token: refreshToken },
  );
  return handleApiResponse(response, "刷新 Token 失败");
}

/**
 * 登出：撤销服务端 refresh token（若有），调用方需自行清除本地 token 并跳转
 * 后端要求请求体带 refresh_token，无 refresh token 时跳过服务端调用
 */
export async function authLogout(): Promise<void> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return;
  }
  const response: AxiosResponse<ApiResponseBase<void>> = await apiService.post<ApiResponseBase<void>>("/auth/logout", {
    refresh_token: refreshToken,
  });
  handleApiResponse(response, "登出失败");
}

/**
 * 获取当前用户信息
 * 需 JWT 认证，用于个人中心、设置页、导航栏用户信息
 */
export async function authGetCurrentUser() {
  const response: AxiosResponse<ApiResponseBase<UserInfo>> =
    await apiService.get<ApiResponseBase<UserInfo>>("/auth/me");
  return handleApiResponse(response, "获取用户信息失败");
}

/**
 * 修改密码请求参数
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * 修改密码：需当前密码验证
 */
export async function authChangePassword(data: ChangePasswordRequest): Promise<void> {
  const response: AxiosResponse<ApiResponseBase<void>> = await apiService.post<ApiResponseBase<void>>(
    "/auth/change-password",
    data,
  );
  handleApiResponse(response, "修改密码失败");
}
