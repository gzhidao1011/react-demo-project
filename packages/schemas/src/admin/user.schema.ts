import { z } from "zod";
import { emailSchema, passwordSchema, phoneSchema } from "../common";

/**
 * 创建用户表单 schema
 */
export const createUserSchema = z.object({
  name: z.string().min(1, "姓名不能为空").min(2, "姓名至少需要 2 个字符").max(50, "姓名不能超过 50 个字符"),
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
  roleIds: z.array(z.number()).optional(),
});

/**
 * 更新用户表单 schema（不包含密码）
 */
export const updateUserSchema = z.object({
  name: z.string().min(1, "姓名不能为空").min(2, "姓名至少需要 2 个字符").max(50, "姓名不能超过 50 个字符"),
  email: emailSchema,
  phone: phoneSchema,
  roleIds: z.array(z.number()).optional(),
});

/**
 * 创建用户表单数据类型
 */
export type CreateUserFormData = z.infer<typeof createUserSchema>;

/**
 * 更新用户表单数据类型
 */
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;
