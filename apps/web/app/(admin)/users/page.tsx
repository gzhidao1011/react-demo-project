import { ArrowPathIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/16/solid";
import { useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import { deleteUser, getUserPage, restoreUser, type UserDetailDto } from "@repo/services";
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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

/**
 * 用户列表页
 * 包含：表格展示、筛选、分页、防抖搜索、空状态、骨架屏
 */
export default function UsersPage() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const [searchParams, setSearchParams] = useSearchParams();

  // 从 URL 读取查询参数
  const page = parseInt(searchParams.get("page") || "1", 10);
  const size = parseInt(searchParams.get("size") || "20", 10);
  const email = searchParams.get("email") || "";
  const name = searchParams.get("name") || "";
  const role = searchParams.get("role") || "";
  const deleted = searchParams.get("deleted") === "true";

  // 本地状态
  const [users, setUsers] = useState<UserDetailDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(email || name || "");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetailDto | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // 防抖搜索
  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (value: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const params = new URLSearchParams(searchParams);
        if (value.trim()) {
          // 简单搜索：同时搜索邮箱和姓名
          params.set("email", value.trim());
          params.delete("name");
        } else {
          params.delete("email");
          params.delete("name");
        }
        params.set("page", "1"); // 搜索时重置到第一页
        setSearchParams(params, { replace: true });
      }, 300);
    };
  }, [searchParams, setSearchParams]);

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        size,
        email: email || undefined,
        name: name || undefined,
        role: role || undefined,
        deleted,
      };
      const result = await getUserPage(params);
      setUsers(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error("加载用户列表失败:", error);
      toast.error(t("admin.errors.loadUsersFailed"));
    } finally {
      setLoading(false);
    }
  }, [page, size, email, name, role, deleted]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 按 N 键新建用户（不在输入框中时）
      if (
        e.key === "n" &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        navigate("/admin/users/new");
      }
      // 按 / 键聚焦搜索框（不在输入框中时）
      if (
        e.key === "/" &&
        !e.ctrlKey &&
        !e.metaKey &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
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
  }, [navigate, searchInputRef, deleteDialogOpen, restoreDialogOpen]);

  // 处理搜索输入
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // 处理删除
  const handleDelete = async (user: UserDetailDto) => {
    try {
      await deleteUser(user.id);
      toast.success(t("admin.users.delete.success"));
      loadUsers();
    } catch (error) {
      console.error("删除用户失败:", error);
      toast.error(t("admin.errors.deleteUserFailed"));
    } finally {
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    }
  };

  // 处理恢复
  const handleRestore = async (user: UserDetailDto) => {
    try {
      await restoreUser(user.id);
      toast.success(t("admin.users.restore.success"));
      loadUsers();
    } catch (error) {
      console.error("恢复用户失败:", error);
      toast.error(t("admin.errors.restoreUserFailed"));
    } finally {
      setRestoreDialogOpen(false);
      setSelectedUser(null);
    }
  };

  // 处理分页
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
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.users.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("admin.users.list.total", { total })}</p>
        </div>
        <Button asChild>
          <Link to="/admin/users/new">
            <PlusIcon />
            <span>{t("admin.users.new.title")}</span>
            <kbd className="ml-2 hidden rounded border bg-muted px-1.5 py-0.5 text-xs font-mono md:inline-block">N</kbd>
          </Link>
        </Button>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t("admin.users.list.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 pr-20"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <kbd className="hidden rounded border bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground md:inline-block">
                    /
                  </kbd>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.set("deleted", deleted ? "false" : "true");
                setSearchParams(params, { replace: true });
              }}
            >
              {deleted ? t("admin.users.list.showNormal") : t("admin.users.list.showDeleted")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 用户列表表格 */}
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.users.list.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                {deleted ? t("admin.users.list.emptyDeleted") : t("admin.users.list.empty")}
              </p>
              {!deleted && (
                <Button asChild>
                  <Link to="/admin/users/new">
                    <PlusIcon />
                    <span>{t("admin.users.list.createFirst")}</span>
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
                      <th className="text-left p-3 text-sm font-medium">{t("admin.users.list.columns.id")}</th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.users.list.columns.email")}</th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.users.list.columns.name")}</th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.users.list.columns.phone")}</th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.users.list.columns.roles")}</th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.users.list.columns.status")}</th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.users.list.columns.createdAt")}</th>
                      <th className="text-left p-3 text-sm font-medium">{t("admin.users.list.columns.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">{user.id}</td>
                        <td className="p-3 text-sm">{user.email}</td>
                        <td className="p-3 text-sm">{user.name}</td>
                        <td className="p-3 text-sm">{user.phone || "-"}</td>
                        <td className="p-3">
                          <div className="flex gap-1 flex-wrap">
                            {user.roles && user.roles.length > 0 ? (
                              user.roles.map((role) => (
                                <Badge key={role.id} variant="secondary">
                                  {role.name}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          {user.deletedAt ? (
                            <Badge variant="destructive">{t("admin.users.list.status.deleted")}</Badge>
                          ) : user.emailVerified ? (
                            <Badge variant="default">{t("admin.users.list.status.verified")}</Badge>
                          ) : (
                            <Badge variant="outline">{t("admin.users.list.status.unverified")}</Badge>
                          )}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            {user.deletedAt ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setRestoreDialogOpen(true);
                                }}
                              >
                                <ArrowPathIcon />
                                <span>{t("admin.users.list.actions.restore")}</span>
                              </Button>
                            ) : (
                              <>
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={`/admin/users/${user.id}`}>
                                    <PencilSquareIcon />
                                    <span>{t("admin.users.list.actions.edit")}</span>
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <TrashIcon />
                                  <span>{t("admin.users.list.actions.delete")}</span>
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

              {/* 分页 */}
              {total > size && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {t("admin.users.list.pagination.showing", {
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
                      {t("admin.users.list.pagination.previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page * size >= total}
                      onClick={() => handlePageChange(page + 1)}
                    >
                      {t("admin.users.list.pagination.next")}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除用户 "{selectedUser?.name}" ({selectedUser?.email}) 吗？此操作将软删除用户，可以恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && handleDelete(selectedUser)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.users.delete.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 恢复确认对话框 */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.users.restore.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.users.restore.description", {
                name: selectedUser?.name || "",
                email: selectedUser?.email || "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => selectedUser && handleRestore(selectedUser)}>
              {t("admin.users.restore.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
