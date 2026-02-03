import { HomeIcon, KeyIcon, ShieldCheckIcon, UsersIcon } from "@heroicons/react/16/solid";
import { useLocale } from "@repo/i18n";
import { toast } from "@repo/propel";
import type { UserInfo } from "@repo/services";
import { authGetCurrentUser } from "@repo/services";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@repo/ui";
import { clearTokens, isAuthenticated, usePermissions } from "@repo/utils";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { AdminBreadcrumb } from "../components/AdminBreadcrumb";
import { PermissionGuard } from "../components/PermissionGuard";
export const meta = () => [{ title: "管理后台 - Repo" }, { name: "robots", content: "noindex, nofollow" }];

/**
 * Admin 布局组件
 * 包含侧边栏菜单、顶部栏和主内容区
 * 仅对已登录且具备 admin 角色的用户可见
 */
export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLocale();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = usePermissions(userInfo);

  // 检查认证和权限
  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        navigate("/sign-in", { replace: true });
        return;
      }

      try {
        // 获取当前用户信息
        const response = await authGetCurrentUser();
        setUserInfo(response.data!);
      } catch (error) {
        console.error("获取用户信息失败:", error);
        navigate("/sign-in", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // 检查是否为管理员
  useEffect(() => {
    if (!loading && !isAdmin()) {
      navigate("/", { replace: true });
    }
  }, [loading, isAdmin, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-muted-foreground">{t("admin.loading")}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin()) {
    return null;
  }

  const menuItems = [
    {
      title: t("admin.users.title"),
      icon: UsersIcon,
      href: "/admin/users",
      requiredRole: "ADMIN",
    },
    {
      title: t("admin.roles.title"),
      icon: ShieldCheckIcon,
      href: "/admin/roles",
      requiredRole: "ADMIN",
    },
    {
      title: t("admin.permissions.title"),
      icon: KeyIcon,
      href: "/admin/permissions",
      requiredRole: "ADMIN",
    },
  ];

  return (
    <SidebarProvider defaultOpen={true} className="flex h-screen overflow-hidden">
      <Sidebar collapsible="icon" className="w-64">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{t("admin.title")}</span>
              <span className="text-xs text-muted-foreground">{t("admin.subtitle")}</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t("admin.navigation")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/">
                      <HomeIcon />
                      <span>{t("admin.backToHome")}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t("admin.management")}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <PermissionGuard key={item.href} requiredRole={item.requiredRole} userInfo={userInfo}>
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={item.href}>
                            <Icon />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </PermissionGuard>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="flex-1" />
          {userInfo && (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-medium text-foreground">{userInfo.email}</div>
                {userInfo.roles && userInfo.roles.length > 0 && (
                  <div className="text-xs text-muted-foreground">{userInfo.roles.join(", ")}</div>
                )}
              </div>
              <button
                onClick={() => {
                  clearTokens();
                  toast.success(t("chat.logoutSuccess"));
                  navigate("/sign-in", { replace: true });
                }}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title={t("chat.logout")}
              >
                {t("chat.logout")}
              </button>
            </div>
          )}
        </header>
        <main className="flex-1 overflow-auto p-6">
          <AdminBreadcrumb />
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
