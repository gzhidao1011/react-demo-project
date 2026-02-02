import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { LocaleSwitcher, useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import type { ResetPasswordFormData } from "@repo/schemas";
import { resetPasswordSchema } from "@repo/schemas";
import { authForgotPassword, authResetPassword } from "@repo/services";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@repo/ui";
import { getSystemErrorToastMessage, isSystemError } from "@repo/utils";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router";

/**
 * 重置密码页
 * 不自动调用 API，用户点击提交后才调用（防邮件预取消耗 token）
 */
export default function ResetPasswordPage() {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const emailFromLink = searchParams.get("email");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    setIsResetting(true);
    setError(null);
    try {
      await authResetPassword(token, data.newPassword);
      setIsSuccess(true);
      toast.success(t("auth.resetPasswordSuccess"), { duration: 2000 });
      setTimeout(() => {
        window.location.href = "/sign-in";
      }, 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("auth.resetPasswordFailed");
      setError(msg);
      if (err instanceof Error && isSystemError(err)) {
        toast.error(getSystemErrorToastMessage(err) ?? msg);
      }
    } finally {
      setIsResetting(false);
    }
  };

  const handleResendResetEmail = async () => {
    const emailToUse = emailFromLink?.trim();
    if (!emailToUse) {
      toast.error(t("auth.resendEnterEmail"));
      return;
    }
    setIsResending(true);
    setError(null);
    try {
      await authForgotPassword(emailToUse);
      toast.success(t("auth.resendResetEmailSuccess"), { duration: 2000 });
    } catch (err) {
      if (err instanceof Error) {
        const msg = isSystemError(err)
          ? (getSystemErrorToastMessage(err) ?? t("auth.resendResetEmailFailed"))
          : err.message;
        toast.error(msg);
      } else {
        toast.error(t("auth.resendResetEmailFailed"));
      }
    } finally {
      setIsResending(false);
    }
  };

  // 无 token：显示链接无效
  if (!token) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <LocaleSwitcher className="fixed right-4 top-4 z-10" />
        <div className="w-[400px]">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>{t("auth.resetLinkInvalid")}</CardTitle>
              <CardDescription>{t("auth.resetLinkInvalidDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/sign-in">{t("auth.backToSignIn")}</Link>
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link to="/forgot-password">{t("auth.forgotPassword")}</Link>
              </Button>
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
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("auth.resetPasswordTitle")}</CardTitle>
            <CardDescription>{t("auth.resetPasswordDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20" role="alert">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* 新密码 */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  {t("auth.setNewPassword")}
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("newPassword")}
                    aria-invalid={errors.newPassword ? "true" : "false"}
                    aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
                    className={errors.newPassword ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
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
                {errors.newPassword && (
                  <p id="newPassword-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                    {errors.newPassword.message}
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

              <Button type="submit" disabled={isResetting || isSuccess} className="w-full">
                {isSuccess
                  ? t("auth.resetPasswordSuccess")
                  : isResetting
                    ? t("auth.resetting")
                    : t("auth.resetPasswordSubmit")}
              </Button>

              {error && emailFromLink && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResendResetEmail}
                  disabled={isResending}
                >
                  {isResending ? t("auth.sending") : t("auth.resendResetEmail")}
                </Button>
              )}
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <Button type="button" variant="link" asChild className="p-0 h-auto">
                <Link to="/sign-in">{t("auth.backToSignIn")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
