import { z } from "zod";

/**
 * 手机号验证规则
 * 支持多种格式：中国、美国、国际格式
 */
export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val || val.trim() === "") return true; // 手机号是可选的
      // 支持多种手机号格式（中国、美国、国际格式）
      const phoneRegex = /^(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$|^1[3-9]\d{9}$/;
      return phoneRegex.test(val.replace(/[\s-()]/g, ""));
    },
    {
      message: "请输入有效的手机号码",
    },
  );
