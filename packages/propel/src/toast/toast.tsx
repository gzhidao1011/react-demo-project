import { handleServerError } from "@repo/utils";
import type { FieldValues, UseFormSetError } from "react-hook-form";
import toastModule, { Toaster } from "react-hot-toast";

export const toast = toastModule;

export function toastError(error: unknown, setError: UseFormSetError<FieldValues>) {
  console.error("注册失败:", error);
  // 统一处理错误：内联错误显示 + 系统级错误 Toast
  const result = handleServerError(error, setError, "注册失败，请检查网络连接");
  // 统一处理 Toast：仅对系统级错误显示
  if (result.shouldShowToast && result.toastMessage) {
    toast.error(result.toastMessage);
  }
}

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: "var(--color-bg-card)",
          color: "var(--color-text-primary)",
          border: "1px solid var(--color-border)",
        },
        success: {
          iconTheme: {
            primary: "var(--color-success)",
            secondary: "white",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--color-error)",
            secondary: "white",
          },
        },
      }}
    />
  );
}
