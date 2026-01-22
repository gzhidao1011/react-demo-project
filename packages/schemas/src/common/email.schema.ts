import { z } from "zod";

/**
 * 邮箱验证规则
 */
export const emailSchema = z.string().min(1, "邮箱不能为空").email("请输入有效的邮箱地址");
