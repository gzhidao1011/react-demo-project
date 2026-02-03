import { XMarkIcon } from "@heroicons/react/16/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import { type UpdateUserFormData, updateUserSchema } from "@repo/schemas";
import type { UserDetailDto } from "@repo/services";
import { getRolePage, getUserById, type RoleDetailDto, updateUser } from "@repo/services";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Skeleton } from "@repo/ui";
import { handleServerError } from "@repo/utils";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";

/**
 * 编辑用户页
 */
export default function EditUserPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { id } = useParams<{ id: string }>();
  const userId = id ? parseInt(id, 10) : null;

  const [user, setUser] = useState<UserDetailDto | null>(null);
  const [roles, setRoles] = useState<RoleDetailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    reset,
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    mode: "onBlur",
  });

  // 加载用户数据
  useEffect(() => {
    if (!userId) {
      navigate("/admin/users", { replace: true });
      return;
    }

    const loadUser = async () => {
      try {
        const userData = await getUserById(userId);
        setUser(userData);
        setSelectedRoleIds(userData.roles?.map((r) => r.id) || []);
        reset({
          name: userData.name,
          email: userData.email,
          phone: userData.phone || "",
          roleIds: userData.roles?.map((r) => r.id) || [],
        });
      } catch (error) {
        console.error("加载用户数据失败:", error);
        toast.error(t("admin.errors.loadUserFailed"));
        navigate("/admin/users", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [userId, navigate, reset]);

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
  const onSubmit = async (data: UpdateUserFormData) => {
    if (!userId) return;

    clearErrors();

    try {
      await updateUser(userId, {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || undefined,
        roleIds: selectedRoleIds.length > 0 ? selectedRoleIds : undefined,
      });

      toast.success(t("admin.users.edit.success"), { duration: 2000 });
      setTimeout(() => {
        navigate("/admin/users", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("更新用户失败:", error);
      const result = handleServerError(error, setError, t("admin.errors.updateUserFailed"));
      if (result.shouldShowToast && result.toastMessage) {
        toast.error(result.toastMessage);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.users.edit.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.users.edit.subtitle", { email: user.email })}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.edit.title")}</CardTitle>
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
                {isSubmitting ? t("admin.users.edit.form.saving") : t("admin.users.edit.form.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
