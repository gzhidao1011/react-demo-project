import { XMarkIcon } from "@heroicons/react/16/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import { type UpdateRoleFormData, updateRoleSchema } from "@repo/schemas";
import {
  getPermissions,
  getRoleById,
  type PermissionDto,
  type RoleDetailDto,
  setRolePermissions,
  updateRole,
} from "@repo/services";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Skeleton } from "@repo/ui";
import { handleServerError } from "@repo/utils";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";

export default function EditRolePage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const { id } = useParams<{ id: string }>();
  const roleId = id ? parseInt(id, 10) : null;

  const [role, setRole] = useState<RoleDetailDto | null>(null);
  const [permissions, setPermissions] = useState<PermissionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    reset,
  } = useForm<UpdateRoleFormData>({
    resolver: zodResolver(updateRoleSchema),
    mode: "onBlur",
  });

  useEffect(() => {
    if (!roleId) {
      navigate("/admin/roles", { replace: true });
      return;
    }

    const loadRole = async () => {
      try {
        const roleData = await getRoleById(roleId);
        setRole(roleData);
        setSelectedPermissionIds(roleData.permissions?.map((p) => p.id) || []);
        reset({
          name: roleData.name,
          code: roleData.code,
          description: roleData.description || "",
        });
      } catch (error) {
        console.error("加载角色数据失败:", error);
        toast.error(t("admin.errors.loadRoleFailed"));
        navigate("/admin/roles", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [roleId, navigate, reset]);

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

  const onSubmit = async (data: UpdateRoleFormData) => {
    if (!roleId) return;

    clearErrors();

    try {
      await updateRole(roleId, {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim() || undefined,
      });

      // 更新权限
      await setRolePermissions(roleId, {
        permissionIds: selectedPermissionIds,
      });

      toast.success(t("admin.roles.edit.success"), { duration: 2000 });
      setTimeout(() => {
        navigate("/admin/roles", { replace: true });
      }, 2000);
    } catch (error) {
      console.error("更新角色失败:", error);
      const result = handleServerError(error, setError, t("admin.errors.updateRoleFailed"));
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

  if (!role) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("admin.roles.edit.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.roles.edit.subtitle", { name: role.name })}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.roles.edit.title")}</CardTitle>
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
              <Input id="description" {...register("description")} />
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
                {isSubmitting ? t("admin.roles.edit.form.saving") : t("admin.roles.edit.form.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
