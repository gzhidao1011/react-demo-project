---
name: form-development
description: Create forms following project standards using React Hook Form and Zod. Use when creating forms, implementing form validation, or handling form errors.
---

# Form Development

Create forms following project standards: React Hook Form + Zod validation.

## Quick Start

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { handleServerError } from "@repo/utils";
import toast from "react-hot-toast";

// 1. Define schema
const schema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要 6 个字符"),
});

type FormData = z.infer<typeof schema>;

// 2. Setup form
const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
  resolver: zodResolver(schema),
  mode: "onBlur",
});

// 3. Handle submit
const onSubmit = async (data: FormData) => {
  try {
    await apiCall(data);
    toast.success("操作成功！");
  } catch (error) {
    const result = handleServerError(error, setError);
    if (result.shouldShowToast && result.toastMessage) {
      toast.error(result.toastMessage);
    }
  }
};
```

## Form Structure

### 1. Schema Definition

```typescript
const schema = z.object({
  // Required field
  email: z.string().email("请输入有效的邮箱地址"),
  
  // Optional field
  phone: z.string().optional(),
  
  // With custom validation
  password: z.string()
    .min(6, "密码至少需要 6 个字符")
    .max(50, "密码不能超过 50 个字符"),
  
  // Cross-field validation
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});
```

### 2. Form Setup

```typescript
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
  setError,
  clearErrors,
} = useForm<FormData>({
  resolver: zodResolver(schema),
  mode: "onBlur", // Validate on blur
  defaultValues: {
    email: "",
    password: "",
  },
});
```

### 3. Input Field

```tsx
<div>
  <label htmlFor="email">邮箱</label>
  <input
    id="email"
    type="email"
    {...register("email")}
    aria-invalid={errors.email ? "true" : "false"}
    aria-describedby={errors.email ? "email-error" : undefined}
    className={errors.email ? "border-red-500" : ""}
  />
  {errors.email && (
    <p id="email-error" className="text-red-500" role="alert">
      {errors.email.message}
    </p>
  )}
</div>
```

### 4. Error Handling

```typescript
const onSubmit = async (data: FormData) => {
  clearErrors(); // Clear previous errors
  
  try {
    await apiCall(data);
    // Success: Only use Toast
    toast.success("操作成功！", { duration: 2000 });
  } catch (error) {
    // Error: Use handleServerError
    const result = handleServerError(error, setError, "操作失败，请重试");
    if (result.shouldShowToast && result.toastMessage) {
      toast.error(result.toastMessage);
    }
  }
};
```

## Error Display Strategy

| Error Type | Display Method | Toast? |
|-----------|---------------|--------|
| Field-level | Inline (below field) | No |
| Form-level | Top of form | No |
| System error | Top of form + Toast | Yes |
| Success | Toast only | Yes |

## Common Patterns

### Registration Form

```typescript
const registerSchema = z.object({
  username: z.string().min(3, "用户名至少需要 3 个字符"),
  email: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少需要 6 个字符"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});
```

### Login Form

```typescript
const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(1, "密码不能为空"),
});
```

## Accessibility

Always include:

- `aria-invalid` on input fields
- `aria-describedby` linking to error message
- `role="alert"` on error messages
- Proper `id` and `htmlFor` associations

## Related Rules

- Form Validation: `.cursor/rules/09-表单验证.mdc`
- Form Error Handling: `.cursor/rules/10-表单错误处理.mdc`
