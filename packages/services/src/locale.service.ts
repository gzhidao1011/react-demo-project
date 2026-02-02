import type { AxiosResponse } from "axios";
import { apiService } from "./api.service";
import { type ApiResponseBase, handleApiResponse } from "./api.service.base";

/**
 * 用户 Locale 响应
 */
export interface UserLocaleResponse {
  locale: string;
}

/**
 * 更新已登录用户的 locale 偏好
 * 调用后端 PATCH /api/user/locale，后端设置 Cookie
 *
 * @param locale - 语言代码（如 zh、en、ja、ko）
 * @returns API 响应
 * @throws 未登录时 401，locale 非法时 400
 *
 * @see .cursor/plans/多语言功能计划/locale-cookie-backend.md
 */
export async function updateUserLocale(locale: string) {
  const response: AxiosResponse<ApiResponseBase<UserLocaleResponse>> = await apiService.patch<
    ApiResponseBase<UserLocaleResponse>
  >("/api/user/locale", { locale });
  return handleApiResponse(response, "更新语言偏好失败");
}

/**
 * 获取已登录用户的 locale
 * 调用后端 GET /api/user/locale，用于 HttpOnly Cookie 场景
 *
 * @returns API 响应，包含 locale
 * @throws 未登录时 401
 *
 * @see .cursor/plans/多语言功能计划/locale-cookie-backend.md
 */
export async function getUserLocale() {
  const response: AxiosResponse<ApiResponseBase<UserLocaleResponse>> =
    await apiService.get<ApiResponseBase<UserLocaleResponse>>("/api/user/locale");
  return handleApiResponse(response, "获取语言偏好失败");
}
