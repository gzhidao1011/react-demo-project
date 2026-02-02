import { z } from "zod";
import { passwordSchema } from "../common";

/**
 * 重置密码表单基础 schema
 */
const baseResetPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "请确认密码"),
});

/**
 * 重置密码表单完整 schema（包含跨字段验证）
 */
export const resetPasswordSchema = baseResetPasswordSchema.refine((data) => data.newPassword === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

/**
 * 重置密码表单数据类型
 */
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
