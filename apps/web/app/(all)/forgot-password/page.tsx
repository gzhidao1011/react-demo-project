import { zodResolver } from "@hookform/resolvers/zod";
import { LocaleSwitcher, useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import type { ForgotPasswordFormData } from "@repo/schemas";
import { forgotPasswordSchema } from "@repo/schemas";
import { authForgotPassword } from "@repo/services";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@repo/ui";
import { handleServerError } from "@repo/utils";
import type { FieldValues, UseFormSetError } from "react-hook-form";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { t } = useLocale();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    clearErrors();

    try {
      const email = data.email.trim().toLowerCase();
      await authForgotPassword(email);

      toast.success(t("auth.checkEmailForReset"), {
        duration: 2000,
      });

      setTimeout(() => {
        navigate("/sign-in", { replace: true });
      }, 2000);
    } catch (error) {
      const result = handleServerError(
        error,
        setError as UseFormSetError<FieldValues>,
        "忘记密码请求失败，请检查网络连接",
      );

      if (result.shouldShowToast && result.toastMessage) {
        toast.error(result.toastMessage);
      }
    }
  };

  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <LocaleSwitcher className="fixed right-4 top-4 z-10" />
      <div className="w-[400px]">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("auth.forgotPasswordTitle")}</CardTitle>
            <CardDescription>{t("auth.forgotPasswordDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              {errors.root && errors.root.type !== "success" && (
                <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20" role="alert">
                  <p className="text-sm text-red-800 dark:text-red-400">{errors.root.message}</p>
                </div>
              )}

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

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? t("auth.sending") : t("auth.forgotPasswordSubmit")}
              </Button>

              {/* 人工恢复入口（OWASP）：无法收到邮件时联系支持 */}
              <p className="text-center text-sm text-muted-foreground">
                {t("auth.cannotReceiveEmail")}{" "}
                <a
                  href="mailto:support@example.com"
                  className="underline hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("auth.contactSupport")}
                </a>
              </p>

              <div className="text-center text-sm text-muted-foreground">
                <Button type="button" variant="link" asChild className="p-0 h-auto">
                  <Link to="/sign-in">{t("auth.backToSignIn")}</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
