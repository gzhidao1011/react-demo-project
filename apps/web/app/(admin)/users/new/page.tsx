import { XMarkIcon } from "@heroicons/react/16/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import { type CreateUserFormData, createUserSchema } from "@repo/schemas";
import { createUser, getRolePage, type RoleDetailDto } from "@repo/services";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Skeleton } from "@repo/ui";
import { handleServerError } from "@repo/utils";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

/**
 * 新建用户页
 */
export default function NewUserPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [roles, setRoles] = useState<RoleDetailDto[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      roleIds: [],
    },
  });

  // 加载角色列表
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const result = await getRolePage({ page: 1, size: 100 });
        setRoles(result.items);
      } catch (error) {
        console.error("加载角色列表失败:", error);
        toast.error(t("admin.errors.loadRolesFailed"));
      } finally {
        setLoadingRoles(false);
      }
    };
    loadRoles();
  }, []);

  // 处理角色选择
  const toggleRole = (roleId: number) => {
    setSelectedRoleIds((prev) => (prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]));
  };

  // 处理表单提交
  const onSubmit = async (data: CreateUserFormData) => {
    clearErrors();

    try {
      await createUser({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || undefined,
        password: data.password,
        roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
      });

      toast.success(t("admin.users.new.success"), { duration: 2000 });
      setTimeout(() => {
        navigate("/admin/users", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("创建用户失败:", error);
      const result = handleServerError(error, setError, t("admin.errors.createUserFailed"));
      if (result.shouldShowToast && result.toastMessage) {
        toast.error(result.toastMessage);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.users.new.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.users.new.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.new.form.name")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {/* 表单级错误提示 */}
            {errors.root && errors.root.type !== "success" && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20" role="alert">
                <p className="text-sm text-red-800 dark:text-red-400">{errors.root.message}</p>
              </div>
            )}

            {/* 姓名 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                {t("admin.users.new.form.name")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder={t("admin.users.new.form.namePlaceholder")}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* 邮箱 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t("admin.users.new.form.email")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email")}
                aria-invalid={errors.email ? "true" : "false"}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder={t("admin.users.new.form.emailPlaceholder")}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* 手机 */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                {t("admin.users.new.form.phone")}
              </Label>
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                {...register("phone")}
                aria-invalid={errors.phone ? "true" : "false"}
                aria-describedby={errors.phone ? "phone-error" : undefined}
                className={errors.phone ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder={t("admin.users.new.form.phonePlaceholder")}
              />
              {errors.phone && (
                <p id="phone-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* 密码 */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                {t("admin.users.new.form.password")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password")}
                aria-invalid={errors.password ? "true" : "false"}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder={t("admin.users.new.form.passwordPlaceholder")}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* 角色选择 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("admin.users.new.form.roles")}</Label>
              {loadingRoles ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : roles.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.users.new.form.noRoles")}</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => {
                      const isSelected = selectedRoleIds.includes(role.id);
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => toggleRole(role.id)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          {role.name}
                        </button>
                      );
                    })}
                  </div>
                  {selectedRoleIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedRoleIds.map((roleId) => {
                        const role = roles.find((r) => r.id === roleId);
                        if (!role) return null;
                        return (
                          <Badge key={roleId} variant="secondary" className="gap-1">
                            {role.name}
                            <button
                              type="button"
                              onClick={() => toggleRole(roleId)}
                              className="ml-1 hover:text-destructive"
                              aria-label={`移除角色 ${role.name}`}
                            >
                              <XMarkIcon className="h-3 w-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate("/admin/users")} disabled={isSubmitting}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("admin.users.new.form.creating") : t("admin.users.new.form.create")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
