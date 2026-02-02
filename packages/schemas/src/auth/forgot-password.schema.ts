import { z } from "zod";
import { emailSchema } from "../common";

/**
 * 忘记密码表单 schema
 */
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * 忘记密码表单数据类型
 */
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
