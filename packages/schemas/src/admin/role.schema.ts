import { z } from "zod";

/**
 * 创建角色表单 schema
 */
export const createRoleSchema = z.object({
  name: z.string().min(1, "角色名称不能为空").max(100, "角色名称不能超过 100 个字符"),
  code: z
    .string()
    .min(1, "角色编码不能为空")
    .max(50, "角色编码不能超过 50 个字符")
    .regex(/^[A-Z_]+$/, "角色编码只能包含大写字母和下划线"),
  description: z.string().max(255, "描述不能超过 255 个字符").optional(),
  permissionIds: z.array(z.number()).optional(),
});

/**
 * 更新角色表单 schema
 */
export const updateRoleSchema = z.object({
  name: z.string().min(1, "角色名称不能为空").max(100, "角色名称不能超过 100 个字符"),
  code: z
    .string()
    .min(1, "角色编码不能为空")
    .max(50, "角色编码不能超过 50 个字符")
    .regex(/^[A-Z_]+$/, "角色编码只能包含大写字母和下划线"),
  description: z.string().max(255, "描述不能超过 255 个字符").optional(),
});

/**
 * 创建角色表单数据类型
 */
export type CreateRoleFormData = z.infer<typeof createRoleSchema>;

/**
 * 更新角色表单数据类型
 */
export type UpdateRoleFormData = z.infer<typeof updateRoleSchema>;
