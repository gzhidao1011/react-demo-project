import { z } from "zod";
import { emailSchema, passwordSchema } from "../common";

/**
 * 注册表单基础 schema
 */
const baseRegisterSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "请确认密码"),
  /** 是否已同意服务条款和隐私政策（必选，符合 GDPR/CCPA） */
  acceptedTerms: z.boolean().refine((v) => v === true, {
    message: "请阅读并同意服务条款和隐私政策",
  }),
});

/**
 * 注册表单完整 schema（包含跨字段验证）
 */
export const registerSchema = baseRegisterSchema.refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"], // 指定错误字段
});

/**
 * 注册表单数据类型
 */
export type RegisterFormData = z.infer<typeof registerSchema>;
