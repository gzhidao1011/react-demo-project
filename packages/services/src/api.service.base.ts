import type { AxiosInstance, AxiosRequestConfig } from "axios";
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
 * Abstract base class for making HTTP requests using axios
 * @abstract
 */
export abstract class APIServiceBase {
  protected baseURL: string;
  private axiosInstance: AxiosInstance;

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
