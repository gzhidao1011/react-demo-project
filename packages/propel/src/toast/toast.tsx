import { handleServerError } from "@repo/utils";
import type { FieldValues, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import { Toaster } from "@repo/ui";

// 直接导出 sonner 的 toast
export { toast };

// 导出 Toaster 组件
export { Toaster };

// 处理服务器错误的工具函数
export function toastError(error: unknown, setError: UseFormSetError<FieldValues>) {
  console.error("注册失败:", error);
  // 统一处理错误：内联错误显示 + 系统级错误 Toast
  const result = handleServerError(error, setError, "注册失败，请检查网络连接");
  // 统一处理 Toast：仅对系统级错误显示
  if (result.shouldShowToast && result.toastMessage) {
    toast.error(result.toastMessage);
  }
}
