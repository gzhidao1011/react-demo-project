import { z } from "zod";

/**
 * 用户名验证规则
 */
export const usernameSchema = z
  .string()
  .min(1, "用户名不能为空")
  .min(3, "用户名至少需要 3 个字符")
  .max(20, "用户名不能超过 20 个字符")
  .regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线");
