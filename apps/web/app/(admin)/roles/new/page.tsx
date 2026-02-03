import { XMarkIcon } from "@heroicons/react/16/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import { type CreateRoleFormData, createRoleSchema } from "@repo/schemas";
import { createRole, getPermissions, type PermissionDto } from "@repo/services";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Skeleton } from "@repo/ui";
import { handleServerError } from "@repo/utils";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

/**
 * 新建角色页
 */
export default function NewRolePage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<CreateRoleFormData>({
    resolver: zodResolver(createRoleSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      code: "",
      description: "",
      permissionIds: [],
    },
  });

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const result = await getPermissions();
        setPermissions(result);
      } catch (error) {
        console.error("加载权限列表失败:", error);
        toast.error(t("admin.errors.loadPermissionsFailed"));
      } finally {
        setLoadingPermissions(false);
      }
    };
    loadPermissions();
  }, []);

  const togglePermission = (permissionId: number) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId) ? prev.filter((id) => id !== permissionId) : [...prev, permissionId],
    );
  };

  const onSubmit = async (data: CreateRoleFormData) => {
    clearErrors();

    try {
      await createRole({
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim() || undefined,
        permissionIds: selectedPermissionIds.length > 0 ? selectedPermissionIds : undefined,
      });

      toast.success(t("admin.roles.new.success"), { duration: 2000 });
      setTimeout(() => {
        navigate("/admin/roles", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("创建角色失败:", error);
      const result = handleServerError(error, setError, t("admin.errors.createRoleFailed"));
      if (result.shouldShowToast && result.toastMessage) {
        toast.error(result.toastMessage);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.roles.new.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.roles.new.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.roles.new.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            {errors.root && errors.root.type !== "success" && (
              <div className="rounded-md bg-red-50 p-4 dark:bg-red-900/20" role="alert">
                <p className="text-sm text-red-800 dark:text-red-400">{errors.root.message}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                {t("admin.roles.new.form.name")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                aria-invalid={errors.name ? "true" : "false"}
                aria-describedby={errors.name ? "name-error" : undefined}
                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder={t("admin.roles.new.form.namePlaceholder")}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">
                {t("admin.roles.new.form.code")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                {...register("code")}
                aria-invalid={errors.code ? "true" : "false"}
                aria-describedby={errors.code ? "code-error" : undefined}
                className={errors.code ? "border-red-500 focus-visible:ring-red-500" : ""}
                placeholder={t("admin.roles.new.form.codePlaceholder")}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  register("code").onChange(e);
                }}
              />
              {errors.code && (
                <p id="code-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
                  {errors.code.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("admin.roles.new.form.description")}</Label>
              <Input
                id="description"
                {...register("description")}
                aria-invalid={errors.description ? "true" : "false"}
                placeholder={t("admin.roles.new.form.descriptionPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.roles.new.form.permissions")}</Label>
              {loadingPermissions ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : permissions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.roles.new.form.noPermissions")}</p>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {permissions.map((permission) => {
                      const isSelected = selectedPermissionIds.includes(permission.id);
                      return (
                        <button
                          key={permission.id}
                          type="button"
                          onClick={() => togglePermission(permission.id)}
                          className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-background hover:bg-muted"
                          }`}
                        >
                          {permission.resource}:{permission.action}
                        </button>
                      );
                    })}
                  </div>
                  {selectedPermissionIds.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedPermissionIds.map((permissionId) => {
                        const permission = permissions.find((p) => p.id === permissionId);
                        if (!permission) return null;
                        return (
                          <Badge key={permissionId} variant="secondary" className="gap-1">
                            {permission.resource}:{permission.action}
                            <button
                              type="button"
                              onClick={() => togglePermission(permissionId)}
                              className="ml-1 hover:text-destructive"
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

            <div className="flex gap-3 justify-end pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => navigate("/admin/roles")} disabled={isSubmitting}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("admin.roles.new.form.creating") : t("admin.roles.new.form.create")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
