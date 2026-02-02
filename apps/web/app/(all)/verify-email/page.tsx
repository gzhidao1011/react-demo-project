import { LocaleSwitcher, useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import { authResendVerification, authVerifyEmail } from "@repo/services";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "@repo/ui";
import { getSystemErrorToastMessage, isSystemError } from "@repo/utils";
import { useState } from "react";
import { useSearchParams } from "react-router";

/**
 * 邮箱验证页
 * 不自动调用 API，先显示「点击验证」按钮（防止 Gmail/Outlook 等邮件客户端预取链接消耗 token）
 */
export default function VerifyEmailPage() {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  /** 验证链接中的邮箱（用于 resend，由后端在邮件链接中附带） */
  const emailFromLink = searchParams.get("email");

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 无 email 参数时，用户手动输入的邮箱（用于 resend） */
  const [manualEmail, setManualEmail] = useState("");

  const handleVerify = async () => {
    if (!token) return;
    setIsVerifying(true);
    setError(null);
    try {
      await authVerifyEmail(token);
      setIsSuccess(true);
      toast.success(t("auth.verifySuccess"), { duration: 2000 });
      setTimeout(() => {
        window.location.href = "/chat";
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.invalidLink"));
      if (err instanceof Error && isSystemError(err)) {
        toast.error(getSystemErrorToastMessage(err) ?? t("auth.invalidLink"));
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    const emailToUse = emailFromLink ?? manualEmail.trim();
    if (!emailToUse) {
      toast.error(t("auth.resendEnterEmail"));
      return;
    }
    setIsResending(true);
    setError(null);
    try {
      await authResendVerification(emailToUse);
      toast.success(t("auth.resendVerificationSuccess"), { duration: 2000 });
    } catch (err) {
      if (err instanceof Error) {
        const msg = isSystemError(err)
          ? (getSystemErrorToastMessage(err) ?? t("auth.resendVerificationFailed"))
          : err.message;
        toast.error(msg);
      } else {
        toast.error(t("auth.resendVerificationFailed"));
      }
    } finally {
      setIsResending(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <LocaleSwitcher className="fixed right-4 top-4 z-10" />
        <div className="w-[400px]">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>{t("auth.invalidLink")}</CardTitle>
              <CardDescription>{t("auth.invalidLinkDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" onClick={() => (window.location.href = "/sign-up")}>
                {t("auth.signUpNow")}
              </Button>
              <div className="text-center text-sm text-muted-foreground">
                {t("auth.hasAccount")}{" "}
                <Button
                  type="button"
                  variant="link"
                  onClick={() => (window.location.href = "/sign-in")}
                  className="p-0 h-auto"
                >
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
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{t("auth.verifyEmailTitle")}</CardTitle>
            <CardDescription>{t("auth.verifyEmailDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20" role="alert">
                <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
              </div>
            )}
            <Button className="w-full" onClick={handleVerify} disabled={isVerifying || isSuccess}>
              {isSuccess ? t("auth.verifySuccess") : isVerifying ? t("auth.verifying") : t("auth.clickToVerify")}
            </Button>
            {error && (
              <div className="space-y-2">
                {!emailFromLink && (
                  <div className="space-y-2">
                    <Label htmlFor="resend-email" className="text-sm">
                      {t("auth.resendEnterEmail")}
                    </Label>
                    <Input
                      id="resend-email"
                      type="email"
                      autoComplete="email"
                      value={manualEmail}
                      onChange={(e) => setManualEmail(e.target.value)}
                      placeholder={t("auth.placeholder.email")}
                      className="w-full"
                    />
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResend}
                  disabled={isResending || (!emailFromLink && !manualEmail.trim())}
                >
                  {isResending ? t("auth.sending") : t("auth.resendVerification")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
