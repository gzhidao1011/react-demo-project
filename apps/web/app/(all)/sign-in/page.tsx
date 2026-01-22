import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { toast, toastError } from "@repo/propel";
import { type LoginFormData, loginSchema } from "@repo/schemas";
import type { LoginRequest } from "@repo/services";
import { authLogin } from "@repo/services";
import { saveTokens } from "@repo/utils";
import { Button, Card, CardContent, Input, Label, Switch } from "@repo/ui";
import { useState } from "react";
import type { FieldValues, UseFormSetError } from "react-hook-form";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

export default function SignInPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur", // 在失去焦点时验证
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  // 处理表单提交
  const onSubmit = async (data: LoginFormData) => {
    // 清除之前的错误
    clearErrors();

    try {
      // 准备登录请求数据
      const loginData: LoginRequest = {
        username: data.username.trim(),
        password: data.password,
      };

      // 调用登录 API
      const response = await authLogin(loginData);

      // 保存 token（根据"记住我"选项）
      // 尝试从响应中提取 token 信息
      // 支持多种响应格式：
      // 1. response.data.data 中包含 token 信息
      // 2. response.data 直接包含 token 信息
      // 3. response.headers 中包含 token（如 Set-Cookie 或自定义 header）
      const responseData = response.data?.data || response.data;
      if (responseData) {
        const tokenData: {
          accessToken?: string;
          refreshToken?: string;
          expiresIn?: number;
          token?: string;
        } = {};

        // 尝试从响应数据中提取 token
        if (typeof responseData === "object" && responseData !== null) {
          tokenData.accessToken =
            (responseData as any).accessToken || (responseData as any).token || (responseData as any).access_token;
          tokenData.refreshToken =
            (responseData as any).refreshToken || (responseData as any).refresh_token;
          tokenData.expiresIn =
            (responseData as any).expiresIn || (responseData as any).expires_in || 3600; // 默认 1 小时
        }

        // 如果有 token，则保存
        if (tokenData.accessToken || tokenData.token) {
          saveTokens(tokenData, data.rememberMe || false);
        }
      }

      toast.success("登录成功！正在跳转到首页...", {
        duration: 2000,
      });
      // 延迟跳转，让用户看到成功提示
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (error) {
      toastError(error, setError as UseFormSetError<FieldValues>, "登录失败，请检查网络连接");
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
                登录账户
              </h1>
              <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">
                输入您的凭据以访问您的账户
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
                  placeholder="请输入用户名"
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

              {/* 密码 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    密码
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    {...register("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={errors.password ? "password-error" : undefined}
                    className={
                      errors.password
                        ? "border-[var(--color-error)] focus-visible:ring-[var(--color-error)] pr-10"
                        : "pr-10"
                    }
                    placeholder="请输入密码"
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

              {/* 记住我 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="rememberMe"
                    checked={watch("rememberMe")}
                    onCheckedChange={(checked) => setValue("rememberMe", checked)}
                  />
                  <Label
                    htmlFor="rememberMe"
                    className="text-sm font-normal cursor-pointer text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]"
                  >
                    记住我
                  </Label>
                </div>
              </div>

              {/* 提交按钮 */}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "登录中..." : "登录"}
              </Button>
            </form>

            {/* 注册链接 */}
            <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary-dark)]">
              还没有账户？{" "}
              <Button
                type="button"
                variant="link"
                onClick={() => navigate("/sign-up")}
                className="p-0 h-auto font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-light)]"
              >
                立即注册
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
