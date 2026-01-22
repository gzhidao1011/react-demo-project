import { z } from "zod";

/**
 * 密码验证规则
 */
export const passwordSchema = z
  .string()
  .min(1, "密码不能为空")
  .min(6, "密码至少需要 6 个字符")
  .max(50, "密码不能超过 50 个字符");
