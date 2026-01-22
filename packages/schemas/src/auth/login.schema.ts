import { z } from "zod";
import { passwordSchema, usernameSchema } from "../common";

/**
 * 登录表单 schema
 */
export const loginSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  rememberMe: z.boolean().optional().default(false),
});

/**
 * 登录表单数据类型
 */
export type LoginFormData = z.infer<typeof loginSchema>;
