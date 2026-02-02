import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { LocaleSwitcher, useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import type { ChangePasswordFormData } from "@repo/schemas";
import { changePasswordSchema } from "@repo/schemas";
import { authChangePassword } from "@repo/services";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@repo/ui";
import { handleServerError } from "@repo/utils";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";

/**
 * 账户设置页
 * 功能：修改密码（需当前密码验证）
 */
export default function SettingsPage() {
  const { t } = useLocale();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    clearErrors();
    try {
      await authChangePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success(t("settings.changePasswordSuccess"), { duration: 2000 });
    } catch (error) {
      const result = handleServerError(error, setError, t("settings.changePasswordFailed"));
      if (result.shouldShowToast && result.toastMessage) {
        toast.error(result.toastMessage);
      }
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <LocaleSwitcher className="fixed right-4 top-4 z-10" />
      <div className="w-full max-w-md px-4">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("settings.title")}</CardTitle>
            <CardDescription>{t("settings.changePasswordDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {errors.root && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20" role="alert">
                <p className="text-sm text-red-800 dark:text-red-400">{errors.root.message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {/* 当前密码 */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium">
                  {t("settings.currentPassword")}
                </Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("currentPassword")}
                    aria-invalid={errors.currentPassword ? "true" : "false"}
                    aria-describedby={errors.currentPassword ? "currentPassword-error" : undefined}
                    className={errors.currentPassword ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                    placeholder={t("auth.placeholder.password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showCurrentPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    {showCurrentPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p id="currentPassword-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                    {errors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* 新密码 */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  {t("settings.newPassword")}
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    {...register("newPassword")}
                    aria-invalid={errors.newPassword ? "true" : "false"}
                    aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
                    className={errors.newPassword ? "border-red-500 focus-visible:ring-red-500 pr-10" : "pr-10"}
                    placeholder={t("auth.placeholder.passwordHint")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showNewPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  >
                    {showNewPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p id="newPassword-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                    {errors.newPassword.message}
                  </p>
                )}
              </div>

              {/* 确认新密码 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  {t("settings.confirmNewPassword")}
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

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? t("settings.saving") : t("settings.changePassword")}
              </Button>
            </form>

            <div className="text-center text-sm text-muted-foreground">
              <Button type="button" variant="link" asChild className="p-0 h-auto">
                <Link to="/chat">{t("settings.backToChat")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
