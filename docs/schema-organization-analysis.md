# Zod Schema 组织方式分析

## 📊 当前实现分析

### 现状

**当前方式**：Schema 直接定义在组件文件中

```typescript
// apps/web/app/(all)/sign-up/page.tsx
const baseRegisterSchema = z.object({
  username: z.string()...
  email: z.string()...
  // ...
});

const registerSchema = baseRegisterSchema.refine(...);
type RegisterFormData = z.infer<typeof registerSchema>;
```

### 优缺点分析

#### ✅ 优点
1. **简单直接**：schema 和组件在同一文件，易于理解
2. **无需额外导入**：减少文件跳转
3. **适合小型项目**：表单数量少时，管理简单

#### ❌ 缺点
1. **代码重复**：如果多个表单需要相同的验证规则（如邮箱、密码），会重复定义
2. **难以复用**：无法在其他组件中复用验证规则
3. **维护困难**：修改验证规则需要在多个地方更新
4. **测试不便**：难以单独测试 schema
5. **类型共享困难**：类型定义分散，难以在服务层复用

## 🌍 国外主流做法

### 方案 1：按功能模块组织（推荐，主流做法）

**采用项目**：Vercel、Stripe、GitHub、Linear

**组织方式**：
```
packages/
├── schemas/              # 或 validations/
│   ├── index.ts          # 统一导出
│   ├── auth/             # 认证相关
│   │   ├── register.schema.ts
│   │   ├── login.schema.ts
│   │   └── index.ts
│   ├── user/             # 用户相关
│   │   ├── profile.schema.ts
│   │   └── index.ts
│   └── common/           # 通用验证规则
│       ├── email.schema.ts
│       ├── password.schema.ts
│       ├── phone.schema.ts
│       └── index.ts
```

**优点**：
- ✅ 按功能模块组织，结构清晰
- ✅ 易于复用通用验证规则
- ✅ 便于维护和测试
- ✅ 支持类型共享

**示例**：

```typescript
// packages/schemas/common/email.schema.ts
import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "邮箱不能为空")
  .email("请输入有效的邮箱地址");

// packages/schemas/common/password.schema.ts
export const passwordSchema = z
  .string()
  .min(1, "密码不能为空")
  .min(6, "密码至少需要 6 个字符")
  .max(50, "密码不能超过 50 个字符");

// packages/schemas/auth/register.schema.ts
import { z } from "zod";
import { emailSchema, passwordSchema } from "../common";

const baseRegisterSchema = z.object({
  username: z
    .string()
    .min(1, "用户名不能为空")
    .min(3, "用户名至少需要 3 个字符")
    .max(20, "用户名不能超过 20 个字符")
    .regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线"),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "请确认密码"),
  phone: z.string().optional(),
});

export const registerSchema = baseRegisterSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  }
);

export type RegisterFormData = z.infer<typeof registerSchema>;
```

### 方案 2：共享包中统一管理（大型项目）

**采用项目**：企业级应用、Monorepo 项目

**组织方式**：
```
packages/
├── schemas/              # 独立包
│   ├── src/
│   │   ├── auth/
│   │   ├── user/
│   │   └── common/
│   └── package.json
```

**优点**：
- ✅ 可在多个应用间共享
- ✅ 版本管理独立
- ✅ 类型可在服务层复用

### 方案 3：组件内定义（小型项目）

**采用项目**：快速原型、小型应用

**组织方式**：直接在组件文件中定义

**适用场景**：
- 表单数量少（< 5 个）
- 验证规则简单
- 不需要复用

## 💡 推荐方案

### 对于当前项目（Monorepo）

**推荐**：方案 1 - 按功能模块组织

**理由**：
1. 项目是 Monorepo 结构，已有 `packages/` 目录
2. 未来可能有多个表单（登录、注册、编辑等）
3. 验证规则可以复用（邮箱、密码等）
4. 符合项目现有的包组织方式

### 实施建议

#### 阶段 1：创建 schemas 包（推荐）

```
packages/
├── schemas/              # 新增
│   ├── src/
│   │   ├── index.ts      # 统一导出
│   │   ├── auth/
│   │   │   ├── register.schema.ts
│   │   │   ├── login.schema.ts
│   │   │   └── index.ts
│   │   └── common/
│   │       ├── email.schema.ts
│   │       ├── password.schema.ts
│   │       ├── phone.schema.ts
│   │       └── index.ts
│   └── package.json
```

#### 阶段 2：提取通用验证规则

```typescript
// packages/schemas/src/common/email.schema.ts
import { z } from "zod";

export const emailSchema = z
  .string()
  .min(1, "邮箱不能为空")
  .email("请输入有效的邮箱地址");

// packages/schemas/src/common/password.schema.ts
export const passwordSchema = z
  .string()
  .min(1, "密码不能为空")
  .min(6, "密码至少需要 6 个字符")
  .max(50, "密码不能超过 50 个字符");

// packages/schemas/src/common/username.schema.ts
export const usernameSchema = z
  .string()
  .min(1, "用户名不能为空")
  .min(3, "用户名至少需要 3 个字符")
  .max(20, "用户名不能超过 20 个字符")
  .regex(/^[a-zA-Z0-9_]+$/, "用户名只能包含字母、数字和下划线");
```

#### 阶段 3：重构注册表单 schema

```typescript
// packages/schemas/src/auth/register.schema.ts
import { z } from "zod";
import { usernameSchema, emailSchema, passwordSchema } from "../common";

const baseRegisterSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "请确认密码"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        const phoneRegex = /^(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$|^1[3-9]\d{9}$/;
        return phoneRegex.test(val.replace(/[\s-()]/g, ""));
      },
      {
        message: "请输入有效的手机号码",
      }
    ),
});

export const registerSchema = baseRegisterSchema.refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "两次输入的密码不一致",
    path: ["confirmPassword"],
  }
);

export type RegisterFormData = z.infer<typeof registerSchema>;
```

#### 阶段 4：在组件中使用

```typescript
// apps/web/app/(all)/sign-up/page.tsx
import { registerSchema, type RegisterFormData } from "@repo/schemas";

export default function SignUpPage() {
  const { ... } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    // ...
  });
}
```

## 📋 实施步骤

### 1. 创建 schemas 包

```bash
# 在 packages/ 目录下创建 schemas 包
mkdir -p packages/schemas/src/{auth,common}
```

### 2. 配置 package.json

```json
{
  "name": "@repo/schemas",
  "version": "1.0.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.24.1"
  }
}
```

### 3. 提取通用规则

先提取可复用的验证规则（email、password、username 等）

### 4. 重构现有 schema

将注册表单的 schema 迁移到新包中

### 5. 更新导入

更新组件中的导入路径

## 🎯 最佳实践总结

### ✅ 推荐做法

1. **按功能模块组织**：`schemas/auth/`, `schemas/user/` 等
2. **提取通用规则**：`schemas/common/` 存放可复用的验证规则
3. **统一导出**：通过 `index.ts` 提供清晰的公共 API
4. **类型导出**：同时导出 schema 和类型，方便使用

### ❌ 避免做法

1. ❌ **避免过度抽象**：不要为了复用而过度抽象
2. ❌ **避免深层嵌套**：保持目录结构扁平（不超过 3 层）
3. ❌ **避免循环依赖**：注意 schema 之间的依赖关系

## 📊 决策矩阵

| 项目规模 | 表单数量 | 推荐方案 | 理由 |
|---------|---------|---------|------|
| 小型 | < 5 | 组件内定义 | 简单直接，无需额外管理 |
| 中型 | 5-15 | 按功能模块组织 | 平衡复杂度和可维护性 |
| 大型 | > 15 | 独立 schemas 包 | 更好的组织和复用 |

## 🔍 当前项目建议

**当前状态**：
- Monorepo 结构
- 已有 1 个表单（注册）
- 未来可能有登录、编辑等表单

**建议**：
- ✅ **现在**：可以保持组件内定义（表单数量少）
- ✅ **未来**：当有 3+ 个表单时，迁移到 `packages/schemas/`
- ✅ **提前准备**：如果确定会有多个表单，现在就可以创建 schemas 包

## 📚 参考资源

- [Zod 官方文档 - Schema 组织](https://zod.dev/)
- [React Hook Form + Zod 最佳实践](https://react-hook-form.com/get-started#SchemaValidation)
- [Vercel 项目结构](https://github.com/vercel/vercel)
- [Stripe Dashboard 代码组织](https://github.com/stripe/stripe-dashboard)
