import { z } from "zod";
import { passwordSchema } from "../common";

/**
 * 修改密码表单基础 schema
 */
const baseChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "当前密码不能为空"),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, "请确认新密码"),
});

/**
 * 修改密码表单完整 schema（包含跨字段验证）
 */
export const changePasswordSchema = baseChangePasswordSchema.refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "两次输入的新密码不一致",
    path: ["confirmPassword"],
  },
);

/**
 * 修改密码表单数据类型
 */
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
