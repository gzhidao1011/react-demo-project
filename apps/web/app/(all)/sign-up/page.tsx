import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { LocaleSwitcher, useLocale } from "@repo/i18n";
import { toast, toastError } from "@repo/propel";
import { type RegisterFormData, registerSchema } from "@repo/schemas";
import type { RegisterRequest } from "@repo/services";
import { authRegister } from "@repo/services";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@repo/ui";
import { useState } from "react";
import type { FieldValues, UseFormSetError } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
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
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // 处理表单提交
  const onSubmit = async (data: RegisterFormData) => {
    // 清除之前的错误
    clearErrors();

    try {
      // 准备注册请求数据
      const registerData: RegisterRequest = {
        email: data.email.trim(),
        password: data.password,
      };

      // 调用注册 API
      await authRegister(registerData);

      toast.success(t("auth.signUpSuccess"), {
        duration: 2000,
      });
      // 延迟跳转，让用户看到成功提示（Token 已由 API 拦截器自动保存，直接进入首页）
      setTimeout(() => {
        navigate("/chat", { replace: true });
      }, 2000);
    } catch (error) {
      toastError(error, setError as UseFormSetError<FieldValues>, "注册失败，请检查网络连接");
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <LocaleSwitcher className="fixed right-4 top-4 z-10" />
      <div className="w-[400px]">
        {/* 卡片容器 */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("auth.signUpTitle")}</CardTitle>
            <CardDescription>{t("auth.signUpDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* 表单级错误提示（仅显示错误，成功消息使用 Toast） */}
              {errors.root && errors.root.type !== "success" && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20" role="alert">
                  <p className="text-sm text-red-800 dark:text-red-400">{errors.root.message}</p>
                </div>
              )}

              {/* 邮箱 */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("auth.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email")}
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                  placeholder={t("auth.placeholder.email")}
                />
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* 密码 */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("auth.password")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={errors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                    placeholder={t("auth.placeholder.passwordHint")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* 确认密码 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  {t("auth.confirmPassword")}
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                    className={errors.confirmPassword ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                    placeholder={t("auth.placeholder.confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirmPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* 按钮组 */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {t("auth.cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
                </Button>
              </div>
            </form>

            {/* 登录链接 */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.hasAccount")}{" "}
              <Button type="button" variant="link" onClick={() => navigate("/sign-in")} className="p-0 h-auto">
                {t("auth.signInNow")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
