import { EnvelopeIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { LocaleSwitcher, useLocale } from "@repo/i18n";
import { toast, toastError } from "@repo/propel";
import { type RegisterFormData, registerSchema } from "@repo/schemas";
import type { RegisterRequest } from "@repo/services";
import { authRegister, authResendVerification } from "@repo/services";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@repo/ui";
import { getSystemErrorToastMessage, isSystemError } from "@repo/utils";
import { useState } from "react";
import type { FieldValues, UseFormSetError } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

export default function SignUpPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  /** 注册成功后显示的邮箱（需验证） */
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

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
      acceptedTerms: false,
    },
  });

  // 处理表单提交
  const onSubmit = async (data: RegisterFormData) => {
    // 清除之前的错误
    clearErrors();

    try {
      // 准备注册请求数据（含 acceptedTermsAt 用于合规记录）
      const registerData: RegisterRequest = {
        email: data.email.trim(),
        password: data.password,
        acceptedTermsAt: new Date().toISOString(),
      };

      // 调用注册 API（返回 RegisterResponse，不含 token）
      const res = await authRegister(registerData);

      toast.success(t("auth.checkEmail"), {
        duration: 3000,
      });
      setRegisteredEmail(res.email);
    } catch (error) {
      toastError(error, setError as UseFormSetError<FieldValues>, "注册失败，请检查网络连接");
    }
  };

  // 重新发送验证邮件
  const handleResendVerification = async () => {
    if (!registeredEmail) return;
    setIsResending(true);
    try {
      await authResendVerification(registeredEmail);
      toast.success(t("auth.resendVerificationSuccess"), { duration: 2000 });
    } catch (error) {
      if (error instanceof Error) {
        const msg = isSystemError(error)
          ? (getSystemErrorToastMessage(error) ?? t("auth.resendVerificationFailed"))
          : error.message;
        toast.error(msg);
      } else {
        toast.error(t("auth.resendVerificationFailed"));
      }
    } finally {
      setIsResending(false);
    }
  };

  // 注册成功：显示「请查收验证邮件」状态
  if (registeredEmail) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <LocaleSwitcher className="fixed right-4 top-4 z-10" />
        <div className="w-[400px]">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <EnvelopeIcon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>{t("auth.checkEmailTitle")}</CardTitle>
              <CardDescription>{t("auth.checkEmailDesc", { email: registeredEmail })}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full" onClick={handleResendVerification} disabled={isResending}>
                {isResending ? t("auth.sending") : t("auth.resendVerification")}
              </Button>
              <Button variant="ghost" className="w-full text-muted-foreground" onClick={() => setRegisteredEmail(null)}>
                {t("auth.useDifferentEmail")}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
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

              {/* 条款勾选（必选，符合 GDPR/CCPA） */}
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <input
                    id="acceptedTerms"
                    type="checkbox"
                    {...register("acceptedTerms", {
                      setValueAs: (v) => v === "on" || v === true,
                    })}
                    aria-invalid={errors.acceptedTerms ? "true" : "false"}
                    aria-describedby={errors.acceptedTerms ? "acceptedTerms-error" : undefined}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700"
                  />
                  <Label htmlFor="acceptedTerms" className="text-sm font-normal leading-relaxed cursor-pointer">
                    {t("auth.acceptedTerms")}
                  </Label>
                </div>
                {errors.acceptedTerms && (
                  <p
                    id="acceptedTerms-error"
                    data-testid="acceptedTerms-error"
                    className="text-sm text-red-500 dark:text-red-400"
                    role="alert"
                  >
                    {errors.acceptedTerms.message}
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
