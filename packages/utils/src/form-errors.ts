import type { AxiosError } from "axios";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/**
 * 服务器错误 接口
 * 包含字段级错误数组
 */
export interface ServerError extends Error {
  errors?: Array<{ field: string; message: string }>;
}

/**
 * 错误类型
 */
export type ErrorType = "field" | "form" | "system";

/**
 * 错误处理结果
 */
export interface ErrorHandleResult {
  type: ErrorType;
  shouldShowToast: boolean;
  toastMessage?: string;
}

/**
 * 成功消息选项
 */
export interface SuccessMessageOptions {
  message: string;
  delay?: number; // 延迟时间（毫秒），默认 1500ms
  onComplete?: () => void; // 完成回调
}

/**
 * 判断是否为系统级错误（网络错误、服务器错误 5xx）
 *
 * @param error - 错误对象（可能是 AxiosError、ServerError 或普通 Error）
 * @returns 如果是系统级错误返回 true，否则返回 false
 */
export function isSystemError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  // 将错误转换为 AxiosError 类型进行检查（如果不是 AxiosError，属性会是 undefined）
  const axiosError = error as AxiosError;

  // 1. 检查 HTTP 状态码：5xx 服务器错误
  if (axiosError.response?.status) {
    const status = axiosError.response.status;
    if (status >= 500 && status < 600) {
      return true;
    }
  }

  // 2. 检查网络错误：AxiosError 且没有 response 表示网络错误
  // 通过检查是否有 request 属性来判断是否为 AxiosError
  if (("request" in error || "isAxiosError" in error) && !axiosError.response) {
    return true;
  }

  // 3. 检查错误代码：超时、连接错误等
  if (axiosError.code) {
    const errorCodes = [
      "ECONNABORTED", // 超时
      "ETIMEDOUT", // 超时
      "ENOTFOUND", // DNS 错误
      "ECONNREFUSED", // 连接被拒绝
      "ERR_NETWORK", // 网络错误
      "ERR_INTERNET_DISCONNECTED", // 网络断开
    ];
    if (errorCodes.includes(axiosError.code)) {
      return true;
    }
  }

  // 4. 检查错误消息中的关键词
  const errorMessage = error.message.toLowerCase();
  const systemErrorKeywords = [
    "网络",
    "network",
    "fetch",
    "500",
    "503",
    "502",
    "504",
    "timeout",
    "超时",
    "连接",
    "connection",
    "服务器",
    "server",
    "econnaborted",
    "etimedout",
    "enotfound",
    "econnrefused",
  ];

  return systemErrorKeywords.some((keyword) => errorMessage.includes(keyword));
}

/**
 * 获取系统级错误的 Toast 消息
 *
 * @param error - 错误对象（可能是 AxiosError、ServerError 或普通 Error）
 * @returns Toast 消息，如果不是系统级错误返回 undefined
 */
export function getSystemErrorToastMessage(error: unknown): string | undefined {
  if (!isSystemError(error)) {
    return undefined;
  }

  if (!(error instanceof Error)) {
    return "服务器暂时无法响应，请稍后重试";
  }

  const axiosError = error as AxiosError;

  // 1. 检查 HTTP 状态码
  if (axiosError.response?.status) {
    const status = axiosError.response.status;
    if (status >= 500 && status < 600) {
      if (status === 503) {
        return "服务暂时不可用，请稍后重试";
      }
      if (status === 504) {
        return "请求超时，请检查网络连接后重试";
      }
      return "服务器暂时无法响应，请稍后重试";
    }
  }

  // 2. 检查错误代码
  if (axiosError.code) {
    if (axiosError.code === "ECONNABORTED" || axiosError.code === "ETIMEDOUT") {
      return "请求超时，请检查网络连接后重试";
    }
    if (axiosError.code === "ENOTFOUND" || axiosError.code === "ECONNREFUSED") {
      return "无法连接到服务器，请检查网络设置";
    }
    if (axiosError.code === "ERR_NETWORK" || axiosError.code === "ERR_INTERNET_DISCONNECTED") {
      return "网络连接失败，请检查网络设置";
    }
  }

  // 3. 检查错误消息中的关键词
  const errorMessage = error.message.toLowerCase();
  if (errorMessage.includes("timeout") || errorMessage.includes("超时")) {
    return "请求超时，请检查网络连接后重试";
  }
  if (errorMessage.includes("500") || errorMessage.includes("503") || errorMessage.includes("502")) {
    return "服务器暂时无法响应，请稍后重试";
  }
  if (errorMessage.includes("网络") || errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return "网络连接失败，请检查网络设置";
  }

  // 4. 默认消息
  return "服务器暂时无法响应，请稍后重试";
}

/**
 * 处理服务器端错误并设置到 React Hook Form
 *
 * @param error - 错误对象（可能是 ServerError 或普通 Error）
 * @param setError - React Hook Form 的 setError 函数
 * @param defaultMessage - 默认错误消息（当无法从错误中提取消息时使用）
 * @returns 错误处理结果，包含错误类型和是否应显示 Toast
 *
 * @example
 * ```typescript
 * import { handleServerError } from "@repo/utils";
 * import toast from "react-hot-toast";
 *
 * try {
 *   await authService.register(data);
 * } catch (error) {
 *   // 统一处理：内联错误显示 + 系统级错误 Toast
 *   const result = handleServerError(error, setError, "注册失败，请重试");
 *   if (result.shouldShowToast && result.toastMessage) {
 *     toast.error(result.toastMessage);
 *   }
 * }
 * ```
 */
export function handleServerError<TFieldValues extends FieldValues = FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>,
  defaultMessage = "操作失败，请检查网络连接",
): ErrorHandleResult {
  // 类型守卫：检查是否为 ServerError（包含 errors 数组）
  const serverError = error as ServerError;

  // 处理字段级错误
  if (error instanceof Error && serverError.errors && Array.isArray(serverError.errors)) {
    serverError.errors.forEach((err) => {
      setError(err.field as Path<TFieldValues>, {
        type: "server",
        message: err.message,
      });
    });
    return {
      type: "field",
      shouldShowToast: false, // 字段级错误不显示 Toast
    };
  }
  // 处理通用错误
  let errorMessage = defaultMessage;
  if (error instanceof Error) {
    const axiosError = error as AxiosError;
    // 安全地访问 response.data.message
    if (axiosError.response?.data && typeof axiosError.response.data === "object" && "message" in axiosError.response.data) {
      const data = axiosError.response.data as { message?: string };
      if (typeof data.message === "string") {
        errorMessage = data.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
  }
  setError("root" as Path<TFieldValues>, {
    type: "server",
    message: errorMessage,
  });

  // 判断是否为系统级错误
  const isSystem = isSystemError(error);
  return {
    type: isSystem ? "system" : "form",
    shouldShowToast: isSystem,
    toastMessage: isSystem ? getSystemErrorToastMessage(error) : undefined,
  };
}
