import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { LocaleSwitcher, useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import type { LoginFormData } from "@repo/schemas";
import { loginSchema } from "@repo/schemas";
import type { LoginRequest } from "@repo/services";
import { authLogin, authResendVerification } from "@repo/services";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@repo/ui";
import { ERROR_CODE_EMAIL_NOT_VERIFIED, handleServerError, saveTokens } from "@repo/utils";
import { useState } from "react";
import type { FieldValues, UseFormSetError } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

export default function SignInPage({
  className,
  loaderData,
  actionData,
  ...props
}: React.ComponentProps<"div"> & {
  loaderData?: unknown;
  actionData?: unknown;
}) {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  /** 邮箱未验证时显示重新发送按钮 */
  const [showResendForEmail, setShowResendForEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur", // 在失去焦点时验证
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // 重新发送验证邮件（邮箱未验证时）
  const handleResendVerification = async () => {
    if (!showResendForEmail) return;
    setIsResending(true);
    try {
      await authResendVerification(showResendForEmail);
      toast.success(t("auth.resendVerificationSuccess"), { duration: 2000 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.resendVerificationFailed"));
    } finally {
      setIsResending(false);
    }
  };

  // 处理表单提交
  const onSubmit = async (data: LoginFormData) => {
    // 清除之前的错误和 resend 状态
    clearErrors();
    setShowResendForEmail(null);

    try {
      // 准备登录请求数据
      const loginData: LoginRequest = {
        email: data.email.trim(),
        password: data.password,
      };

      // 调用登录 API
      const response = await authLogin(loginData);

      // 保存 Token（从响应中提取）
      // saveTokens 函数已经支持 OAuth 2.0 格式（snake_case 和 camelCase）
      if (response.data) {
        saveTokens(response.data);
      }

      // 显示成功消息
      toast.success(t("auth.signInSuccess"), {
        duration: 2000,
      });

      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        navigate("/chat", { replace: true });
      }, 2000);
    } catch (error) {
      // 统一处理错误：内联错误显示 + 系统级错误 Toast
      const result = handleServerError(error, setError as UseFormSetError<FieldValues>, "登录失败，请检查网络连接");

      // 邮箱未验证时，显示重新发送按钮
      const serverError = error as { code?: number };
      if (serverError.code === ERROR_CODE_EMAIL_NOT_VERIFIED) {
        setShowResendForEmail(data.email.trim());
      } else {
        setShowResendForEmail(null);
      }

      // 统一处理 Toast：仅对系统级错误显示
      if (result.shouldShowToast && result.toastMessage) {
        toast.error(result.toastMessage);
      }
    }
  };

  return (
    <div className={`flex min-h-svh overflow-hidden w-full items-center justify-center`} {...props}>
      <LocaleSwitcher className="fixed right-4 top-4 z-10" />
      <div className="w-[400px]">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("auth.loginTitle")}</CardTitle>
            <CardDescription>{t("auth.loginDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* 表单级错误提示（仅显示错误，成功消息使用 Toast） */}
              {errors.root && errors.root.type !== "success" && (
                <div className="space-y-2">
                  <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20" role="alert">
                    <p className="text-sm text-red-800 dark:text-red-400">{errors.root.message}</p>
                  </div>
                  {showResendForEmail && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleResendVerification}
                      disabled={isResending}
                    >
                      {isResending ? t("auth.sending") : t("auth.resendVerification")}
                    </Button>
                  )}
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
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-sm font-medium">
                    {t("auth.password")}
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={errors.password ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                    placeholder={t("auth.placeholder.password")}
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
                  {isSubmitting ? t("auth.loggingIn") : t("auth.loginButton")}
                </Button>
              </div>
            </form>

            {/* 注册链接 */}
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Button type="button" variant="link" onClick={() => navigate("/sign-up")} className="p-0 h-auto">
                {t("auth.signUpNow")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
