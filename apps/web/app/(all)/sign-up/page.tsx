import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { toast, toastError } from "@repo/propel";
import { type RegisterFormData, registerSchema } from "@repo/schemas";
import type { RegisterRequest } from "@repo/services";
import { authRegister } from "@repo/services";
import { Button, Card, CardContent, Input, Label } from "@repo/ui";
import { useState } from "react";
import type { FieldValues, UseFormSetError } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

export default function SignUpPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur", // 在失去焦点时验证
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      phone: "",
    },
  });

  // 处理表单提交
  const onSubmit = async (data: RegisterFormData) => {
    // 清除之前的错误
    clearErrors();

    try {
      // 准备注册请求数据
      const registerData: RegisterRequest = {
        username: data.username.trim(),
        email: data.email.trim(),
        password: data.password,
        phone: data.phone?.trim() || undefined,
      };

      // 调用注册 API
      await authRegister(registerData);

      toast.success("注册成功！正在跳转到登录页...", {
        duration: 2000,
      });
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        navigate("/sign-in", { replace: true });
      }, 2000);
    } catch (error) {
      toastError(error, setError as UseFormSetError<FieldValues>, "注册失败，请检查网络连接");
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        {/* 卡片容器 */}
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <CardContent className="p-6">
            {/* 标题区域 */}
            <div className="mb-6 space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]">
                创建账户
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">
                输入您的信息以创建新账户
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* 表单级错误提示（仅显示错误，成功消息使用 Toast） */}
              {errors.root && errors.root.type !== "success" && (
                <div
                  className="rounded-md bg-[var(--color-error-50)] p-4 dark:bg-[var(--color-error-900)]/20"
                  role="alert"
                >
                  <p className="text-sm text-[var(--color-error-800)] dark:text-[var(--color-error-light)]">
                    {errors.root.message}
                  </p>
                </div>
              )}

              {/* 用户名 */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  用户名
                </Label>
                <Input
                  id="username"
                  type="text"
                  autoComplete="username"
                  {...register("username")}
                  aria-invalid={errors.username ? "true" : "false"}
                  aria-describedby={errors.username ? "username-error" : undefined}
                  className={
                    errors.username ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)]" : ""
                  }
                  placeholder="请输入用户名（3-20个字符）"
                />
                {errors.username && (
                  <p
                    id="username-error"
                    className="text-sm text-[var(--color-error)] dark:text-[var(--color-error-light)]"
                    role="alert"
                  >
                    {errors.username.message}
                  </p>
                )}
              </div>

              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  邮箱地址
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={
                    errors.email ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)]" : ""
                  }
                  placeholder="example@email.com"
                />
                {errors.email && (
                  <p
                    id="email-error"
                    className="text-sm text-[var(--color-error)] dark:text-[var(--color-error-light)]"
                    role="alert"
                  >
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  密码
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={
                      errors.password
                        ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)] pr-10"
                        : "pr-10"
                    }
                    placeholder="至少 6 个字符"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                    aria-label={showPassword ? "隐藏密码" : "显示密码"}
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p
                    id="password-error"
                    className="text-sm text-[var(--color-error)] dark:text-[var(--color-error-light)]"
                    role="alert"
                  >
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* 确认密码 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  确认密码
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                    className={
                      errors.confirmPassword
                        ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)] pr-10"
                        : "pr-10"
                    }
                    placeholder="请再次输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                    aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p
                    id="confirmPassword-error"
                    className="text-sm text-[var(--color-error)] dark:text-[var(--color-error-light)]"
                    role="alert"
                  >
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* 手机号（可选） */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  手机号{" "}
                  <span className="text-xs font-normal text-[var(--color-text-tertiary)] dark:text-[var(--color-text-tertiary-dark)]">
                    (可选)
                  </span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  {...register("phone")}
                  aria-invalid={errors.phone ? "true" : "false"}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  className={
                    errors.phone ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)]" : ""
                  }
                  placeholder="13800138000 或 +1-555-123-4567"
                />
                {errors.phone && (
                  <p
                    id="phone-error"
                    className="text-sm text-[var(--color-error)] dark:text-[var(--color-error-light)]"
                    role="alert"
                  >
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {/* 提交按钮 */}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "注册中..." : "创建账户"}
              </Button>
            </form>

            {/* 登录链接 */}
            <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">
              已有账户？{" "}
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/sign-in")}
                className="p-0 h-auto font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-light)]"
              >
                立即登录
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
