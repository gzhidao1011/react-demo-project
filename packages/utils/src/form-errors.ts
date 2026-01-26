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
 * @param error - 错误对象
 * @returns 如果是系统级错误返回 true，否则返回 false
 */
export function isSystemError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

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
  ];

  return systemErrorKeywords.some((keyword) => errorMessage.includes(keyword));
}

/**
 * 获取系统级错误的 Toast 消息
 *
 * @param error - 错误对象
 * @returns Toast 消息，如果不是系统级错误返回 undefined
 */
export function getSystemErrorToastMessage(error: unknown): string | undefined {
  if (!isSystemError(error)) {
    return undefined;
  }

  if (error instanceof Error) {
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
  }

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
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
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
