import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  type ServerError,
  saveTokens,
} from "@repo/utils";
import type { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import axios from "axios";

/**
 * API 响应结构
 */
export interface ApiResponseBase<T> {
  code: number;
  message: string;
  data: T | null;
  timestamp?: number;
  traceId?: string;
  errors?: Array<{ field: string; message: string; code?: string }>;
}

/**
 * 处理 API 响应，统一检查业务 code 并抛出错误
 *
 * @param response - Axios 响应对象
 * @param defaultErrorMessage - 默认错误消息（当无法从响应中提取消息时使用）
 * @returns 响应数据（当 code 为 0 或 200 时）
 * @throws ServerError - 当 code 不为 0 或 200 时抛出 ServerError
 *
 * @example
 * ```typescript
 * const response = await apiService.post<ApiResponseBase<LoginResponse>>("/auth/register", data);
 * const body = handleApiResponse(response, "注册失败");
 * // body 现在包含成功的数据
 * ```
 */
export function handleApiResponse<T>(
  response: { data: ApiResponseBase<T> },
  defaultErrorMessage = "操作失败",
): ApiResponseBase<T> {
  const body = response.data;

  // 统一按业务 code 判断是否成功，非成功场景抛出 ServerError
  if (body.code !== 0 && body.code !== 200) {
    const error: ServerError = new Error(body.message || defaultErrorMessage);

    // 处理字段级错误
    if (body.errors && Array.isArray(body.errors) && body.errors.length > 0) {
      error.errors = body.errors.map((item) => ({
        field: item.field,
        message: item.message,
      }));
    }

    throw error;
  }

  return body;
}

/**
 * Abstract base class for making HTTP requests using axios
 * @abstract
 */
export abstract class APIServiceBase {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

  // Token 刷新队列
  private isRefreshing = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  /**
   * Creates an instance of APIService
   * @param baseURL - The base URL for all HTTP requests
   */
  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.axiosInstance = axios.create({
      baseURL,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors() {
    // 请求拦截器
    this.axiosInstance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // 白名单路径不需要 Token
        const whiteList = ["/auth/login", "/auth/register", "/auth/refresh"];
        if (config.url && whiteList.some((path) => config.url?.includes(path))) {
          return config;
        }

        // 获取 token
        let token = getAccessToken();

        // 如果 Token 即将过期（剩余时间 < 5 分钟），自动刷新
        // isTokenExpired() 提前 60 秒判断，但我们需要提前 5 分钟刷新
        if (token && this.shouldRefreshToken()) {
          // 如果正在刷新，等待刷新完成
          if (this.isRefreshing) {
            // 将请求加入队列，等待刷新完成
            token = await new Promise<string>((resolve) => {
              this.subscribeTokenRefresh((newToken) => {
                resolve(newToken);
              });
            });
          } else {
            // 开始刷新 Token
            try {
              const newToken = await this.refreshToken();
              token = newToken;
            } catch (error) {
              // 刷新失败，清除 Token 并跳转登录页
              clearTokens();
              // 注意：这里不能直接使用 navigate，因为这是服务类
              // 跳转逻辑应该在响应拦截器中处理
              throw error;
            }
          }
        }

        // 添加 Authorization Header
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // 响应拦截器
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // 自动保存登录响应的 Token
        const url = response.config.url || "";
        if ((url.includes("/auth/login") || url.includes("/auth/register")) && response.data?.data) {
          saveTokens(response.data.data as any);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // 处理 401 错误（Token 过期或无效）
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          // 白名单路径不处理 401
          const whiteList = ["/auth/login", "/auth/register", "/auth/refresh"];
          if (originalRequest.url && whiteList.some((path) => originalRequest.url?.includes(path))) {
            return Promise.reject(error);
          }

          originalRequest._retry = true;

          // 如果正在刷新，等待刷新完成
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.subscribeTokenRefresh((token) => {
                // 使用新 token 重试原请求
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(this.axiosInstance(originalRequest));
              });
            });
          }

          // 开始刷新 Token
          try {
            const newToken = await this.refreshToken();
            // 使用新 token 重试原请求
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.axiosInstance(originalRequest);
          } catch (refreshError) {
            // 刷新失败，清除 Token
            clearTokens();
            // 跳转登录页（需要在应用层面处理，这里只清除 Token）
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * 订阅 Token 刷新（将请求加入队列）
   */
  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  /**
   * 通知刷新队列中的所有请求
   */
  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach((callback) => callback(token));
    this.refreshSubscribers = [];
  }

  /**
   * 检查是否需要刷新 Token（剩余时间 < 5 分钟）
   */
  private shouldRefreshToken(): boolean {
    // 使用 sessionStorage 直接访问，避免循环依赖
    // 在浏览器环境中使用 sessionStorage，在 Node.js 环境中使用全局变量
    const TOKEN_EXPIRES_KEY = "token_expires";
    const storage = typeof window !== "undefined" ? window.sessionStorage : (global as any).sessionStorage;
    if (!storage) return true;
    const expiresAt = storage.getItem(TOKEN_EXPIRES_KEY);
    if (!expiresAt) return true;
    // 提前 5 分钟（300 秒）判断需要刷新
    const fiveMinutesInMs = 5 * 60 * 1000;
    return Date.now() > parseInt(expiresAt) - fiveMinutesInMs;
  }

  /**
   * 刷新 Token
   */
  private async refreshToken(): Promise<string> {
    if (this.isRefreshing) {
      // 如果正在刷新，等待刷新完成
      return new Promise<string>((resolve) => {
        this.subscribeTokenRefresh((token) => {
          resolve(token);
        });
      });
    }

    this.isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error("Refresh token not found");
      }

      // 调用刷新 API（不走拦截器，避免循环）
      const response = await axios.post(`${this.baseURL}/auth/refresh`, { refreshToken }, { withCredentials: true });

      // 保存新 Token
      if (response.data?.data) {
        saveTokens(response.data.data as any);
      }

      // 获取新的 access token
      const newAccessToken = getAccessToken();
      if (!newAccessToken) {
        throw new Error("Failed to get new access token");
      }

      // 通知队列中的所有请求
      this.onTokenRefreshed(newAccessToken);

      return newAccessToken;
    } catch (error) {
      // 刷新失败，清空队列
      this.refreshSubscribers = [];
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Makes a GET request to the specified URL
   * @param url - The endpoint URL
   * @param params - URL parameters
   * @param config - Additional axios configuration
   * @returns Axios response promise
   */
  get<T = unknown>(url: string, params = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.get<T>(url, {
      params,
      ...config,
    });
  }

  /**
   * Makes a POST request to the specified URL
   * @param url - The endpoint URL
   * @param data - Request body data
   * @param config - Additional axios configuration
   * @returns Axios response promise
   */
  post<T = unknown>(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.post<T>(url, data, config);
  }

  /**
   * Makes a PUT request to the specified URL
   * @param url - The endpoint URL
   * @param data - Request body data
   * @param config - Additional axios configuration
   * @returns Axios response promise
   */
  put(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.put(url, data, config);
  }

  /**
   * Makes a PATCH request to the specified URL
   * @param url - The endpoint URL
   * @param data - Request body data
   * @param config - Additional axios configuration
   * @returns Axios response promise
   */
  patch(url: string, data = {}, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.patch(url, data, config);
  }

  /**
   * Makes a DELETE request to the specified URL
   * @param url - The endpoint URL
   * @param data - Request body data
   * @param config - Additional axios configuration
   * @returns Axios response promise
   */
  delete(url: string, data?: unknown, config: AxiosRequestConfig = {}) {
    return this.axiosInstance.delete(url, { data, ...config });
  }

  /**
   * Makes a custom request with the provided configuration
   * @param config - Axios request configuration
   * @returns Axios response promise
   */
  request(config = {}) {
    return this.axiosInstance(config);
  }
}
