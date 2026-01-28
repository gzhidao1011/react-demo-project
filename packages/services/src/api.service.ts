import { APIServiceBase } from "./api.service.base";

export class APIService extends APIServiceBase {
  constructor(baseURL: string) {
    super(baseURL);
  }
}

/**
 * 获取 API 基础 URL
 * 优先级：
 * 1. 环境变量 VITE_API_BASE_URL（如果设置了）
 * 2. 默认使用相对路径 /api（开发环境通过 Vite 代理）
 */
const getApiBaseURL = (): string => {
  // 在浏览器环境中，使用 import.meta.env
  if (typeof window !== "undefined" && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // 默认使用相对路径，通过 Vite 代理转发
  return "/api";
};

export const apiService = new APIService(getApiBaseURL());
