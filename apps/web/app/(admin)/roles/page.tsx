import { ArrowPathIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import { deleteRole, getRolePage, type RoleDetailDto, restoreRole } from "@repo/services";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from "@repo/ui";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

/**
 * 角色列表页
 */
export default function RolesPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const size = parseInt(searchParams.get("size") || "20", 10);
  const deleted = searchParams.get("deleted") === "true";

  const [roles, setRoles] = useState<RoleDetailDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleDetailDto | null>(null);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按 N 键新建角色（不在输入框中时）
      if (
        e.key === "n" &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        navigate("/admin/roles/new");
      }
      // 按 Esc 键关闭对话框
      if (e.key === "Escape") {
        if (deleteDialogOpen) {
          setDeleteDialogOpen(false);
        }
        if (restoreDialogOpen) {
          setRestoreDialogOpen(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate, deleteDialogOpen, restoreDialogOpen]);

  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getRolePage({ page, size, deleted });
      setRoles(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error("加载角色列表失败:", error);
      toast.error(t("admin.errors.loadRolesFailed"));
    } finally {
      setLoading(false);
    }
  }, [page, size, deleted]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const handleDelete = async (role: RoleDetailDto) => {
    try {
      await deleteRole(role.id);
      toast.success(t("admin.roles.delete.success"));
      loadRoles();
    } catch (error) {
      console.error("删除角色失败:", error);
      toast.error(t("admin.errors.deleteRoleFailed"));
    } finally {
      setDeleteDialogOpen(false);
      setSelectedRole(null);
    }
  };

  const handleRestore = async (role: RoleDetailDto) => {
    try {
      await restoreRole(role.id);
      toast.success(t("admin.roles.restore.success"));
      loadRoles();
    } catch (error) {
      console.error("恢复角色失败:", error);
      toast.error(t("admin.errors.restoreRoleFailed"));
    } finally {
      setRestoreDialogOpen(false);
      setSelectedRole(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", newPage.toString());
    setSearchParams(params, { replace: true });
  };

  // 格式化日期
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return "-";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.roles.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("admin.roles.list.total", { total })}</p>
        </div>
        <Button asChild>
          <Link to="/admin/roles/new">
            <PlusIcon />
            <span>{t("admin.roles.new.title")}</span>
            <kbd className="ml-2 hidden rounded border bg-muted px-1.5 py-0.5 text-xs font-mono md:inline-block">N</kbd>
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("deleted", deleted ? "false" : "true");
                setSearchParams(params, { replace: true });
              }}
            >
              {deleted ? t("admin.roles.list.showNormal") : t("admin.roles.list.showDeleted")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("admin.roles.list.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : roles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {deleted ? t("admin.roles.list.emptyDeleted") : t("admin.roles.list.empty")}
              </p>
              {!deleted && (
                <Button asChild>
                  <Link to="/admin/roles/new">
                    <PlusIcon />
                    <span>{t("admin.roles.list.createFirst")}</span>
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 text-sm font-medium">{t("admin.roles.list.columns.id")}</th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.roles.list.columns.code")}</th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.roles.list.columns.name")}</th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.roles.list.columns.description")}</th>
                      <th className="text-left p-3 text-sm font-medium">
                        {t("admin.roles.list.columns.permissionCount")}
                      </th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.roles.list.columns.createdAt")}</th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.roles.list.columns.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role) => (
                      <tr key={role.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">{role.id}</td>
                        <td className="p-3 text-sm font-mono">{role.code}</td>
                        <td className="p-3 text-sm">{role.name}</td>
                        <td className="p-3 text-sm text-muted-foreground">{role.description || "-"}</td>
                        <td className="p-3">
                          <Badge variant="secondary">{role.permissions?.length || 0}</Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDate(role.createdAt)}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {role.deletedAt ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRole(role);
                                  setRestoreDialogOpen(true);
                                }}
                              >
                                <ArrowPathIcon />
                                <span>{t("admin.roles.list.actions.restore")}</span>
                              </Button>
                            ) : (
                              <>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={`/admin/roles/${role.id}`}>
                                    <PencilSquareIcon />
                                    <span>{t("admin.roles.list.actions.edit")}</span>
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRole(role);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <TrashIcon />
                                  <span>{t("admin.roles.list.actions.delete")}</span>
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {total > size && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t("admin.roles.list.pagination.showing", {
                      start: (page - 1) * size + 1,
                      end: Math.min(page * size, total),
                      total,
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => handlePageChange(page - 1)}
                    >
                      {t("admin.roles.list.pagination.previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * size >= total}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      {t("admin.roles.list.pagination.next")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.roles.delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.roles.delete.description", {
                name: selectedRole?.name || "",
                code: selectedRole?.code || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRole && handleDelete(selectedRole)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.roles.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.roles.restore.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.roles.restore.description", {
                name: selectedRole?.name || "",
                code: selectedRole?.code || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedRole && handleRestore(selectedRole)}>
              {t("admin.roles.restore.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
