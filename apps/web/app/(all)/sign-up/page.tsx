import { zodResolver } from "@hookform/resolvers/zod";
import { toast, toastError } from "@repo/propel";
import { type RegisterFormData, registerSchema } from "@repo/schemas";
import type { RegisterRequest } from "@repo/services";
import { authRegister } from "@repo/services";
import { FieldValues, UseFormSetError, useForm } from "react-hook-form";
import { useNavigate } from "react-router";

export default function SignUpPage() {
  const navigate = useNavigate();

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
      toastError(error, setError as UseFormSetError<FieldValues>);
    }
  };

  // 输入框样式类
  const inputBaseClasses =
    "block w-full rounded-lg bg-[var(--color-bg-input)] dark:bg-[var(--color-bg-input-dark)]/50 px-3 py-2.5 text-base text-[var(--color-text-primary)] outline-1 -outline-offset-1 outline-[var(--color-border)] placeholder:text-[var(--color-text-tertiary)] focus:outline-2 focus:-outline-offset-2 focus:outline-[var(--color-border-focus)] focus:bg-[var(--color-bg-input-focus)] dark:focus:bg-[var(--color-bg-input-focus-dark)] sm:text-sm/6 dark:text-[var(--color-text-primary-dark)] dark:outline-[var(--color-border-dark)] dark:placeholder:text-[var(--color-text-tertiary-dark)] dark:focus:outline-[var(--color-primary-light)] transition-colors";

  const inputErrorClasses =
    "outline-[var(--color-error)] focus:outline-[var(--color-error)] dark:outline-[var(--color-error)]";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* 卡片容器 */}
        <div className="bg-[var(--color-bg-card)] dark:bg-[var(--color-bg-card-dark)] rounded-2xl shadow-2xl p-8 sm:p-10 backdrop-blur-sm border border-[var(--color-white)]/20 dark:border-[var(--color-gray-700)]/50">
          {/* 标题区域 */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]">
              创建账户
            </h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">
              已有账户？{" "}
              <button
                type="button"
                onClick={() => navigate("/sign-in")}
                className="font-semibold cursor-pointer text-[var(--color-primary)] hover:text-[var(--color-primary-light)] dark:text-[var(--color-primary-lighter)] dark:hover:text-[var(--color-primary-lightest)] transition-colors"
              >
                立即登录
              </button>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
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
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]"
              >
                用户名 <span className="text-[var(--color-error)]">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  {...register("username")}
                  aria-invalid={errors.username ? "true" : "false"}
                  aria-describedby={errors.username ? "username-error" : undefined}
                  className={`${inputBaseClasses} ${errors.username ? inputErrorClasses : ""}`}
                  placeholder="请输入用户名（3-20个字符）"
                />
              </div>
              {errors.username && (
                <p
                  id="username-error"
                  className="mt-1 text-sm text-[var(--color-error-dark)] dark:text-[var(--color-error-light)]"
                  role="alert"
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* 邮箱 */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]"
              >
                邮箱地址 <span className="text-[var(--color-error)]">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`${inputBaseClasses} ${errors.email ? inputErrorClasses : ""}`}
                  placeholder="example@email.com"
                />
              </div>
              {errors.email && (
                <p
                  id="email-error"
                  className="mt-1 text-sm text-[var(--color-error-dark)] dark:text-[var(--color-error-light)]"
                  role="alert"
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* 密码 */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]"
              >
                密码 <span className="text-[var(--color-error)]">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  {...register("password")}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className={`${inputBaseClasses} ${errors.password ? inputErrorClasses : ""}`}
                  placeholder="至少 6 个字符"
                />
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-1 text-sm text-[var(--color-error-dark)] dark:text-[var(--color-error-light)]"
                  role="alert"
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* 确认密码 */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]"
              >
                确认密码 <span className="text-[var(--color-error)]">*</span>
              </label>
              <div className="mt-2">
                <input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  className={`${inputBaseClasses} ${errors.confirmPassword ? inputErrorClasses : ""}`}
                  placeholder="请再次输入密码"
                />
              </div>
              {errors.confirmPassword && (
                <p
                  id="confirmPassword-error"
                  className="mt-1 text-sm text-[var(--color-error-dark)] dark:text-[var(--color-error-light)]"
                  role="alert"
                >
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* 手机号（可选） */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)]"
              >
                手机号{" "}
                <span className="text-sm text-[var(--color-text-disabled)] dark:text-[var(--color-text-tertiary-dark)]">
                  (可选)
                </span>
              </label>
              <div className="mt-2">
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  {...register("phone")}
                  aria-invalid={errors.phone ? "true" : "false"}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  className={`${inputBaseClasses} ${errors.phone ? inputErrorClasses : ""}`}
                  placeholder="13800138000 或 +1-555-123-4567"
                />
              </div>
              {errors.phone && (
                <p
                  id="phone-error"
                  className="mt-1 text-sm text-[var(--color-error-dark)] dark:text-[var(--color-error-light)]"
                  role="alert"
                >
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* 提交按钮 */}
            <div className="flex items-center justify-end gap-x-6 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-sm cursor-pointer font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-text-primary-dark)] hover:text-[var(--color-text-secondary)] dark:hover:text-[var(--color-text-tertiary-dark)]"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg cursor-pointer bg-[var(--color-primary)] px-6 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-[var(--color-primary-light)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[var(--color-primary-light)] dark:shadow-[var(--color-primary)]/50 dark:hover:bg-[var(--color-primary-lighter)] dark:focus-visible:outline-[var(--color-primary-light)] transition-all hover:shadow-xl"
              >
                {isSubmitting ? "注册中..." : "注册"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
