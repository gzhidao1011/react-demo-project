import { ChevronRightIcon, HomeIcon } from "@heroicons/react/16/solid";
import { useLocale } from "@repo/i18n";
import { useMemo } from "react";
import { Link, useLocation } from "react-router";

/**
 * Admin 面包屑导航组件
 * 根据当前路径自动生成面包屑
 */
export function AdminBreadcrumb() {
  const location = useLocation();
  const { t } = useLocale();

  // 解析路径生成面包屑项
  const breadcrumbs = useMemo(() => {
    const paths = location.pathname.split("/").filter(Boolean);
    const items: Array<{ label: string; href: string }> = [];

    // 首页
    items.push({ label: t("admin.title"), href: "/admin" });

    // 解析路径
    if (paths[0] === "admin") {
      if (paths[1] === "users") {
        items.push({ label: t("admin.users.title"), href: "/admin/users" });
        if (paths[2] === "new") {
          items.push({ label: t("admin.users.new.title"), href: "/admin/users/new" });
        } else if (paths[2] && paths[2] !== "users") {
          items.push({ label: t("admin.users.edit.title"), href: location.pathname });
        }
      } else if (paths[1] === "roles") {
        items.push({ label: t("admin.roles.title"), href: "/admin/roles" });
        if (paths[2] === "new") {
          items.push({ label: t("admin.roles.new.title"), href: "/admin/roles/new" });
        } else if (paths[2] && paths[2] !== "roles") {
          items.push({ label: t("admin.roles.edit.title"), href: location.pathname });
        }
      } else if (paths[1] === "permissions") {
        items.push({ label: t("admin.permissions.title"), href: "/admin/permissions" });
      }
    }

    return items;
  }, [location.pathname, t]);

  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav aria-label={t("admin.breadcrumb")} className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-2">
              {index === 0 ? (
                <Link
                  to={item.href}
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  aria-label={t("admin.backToHome")}
                >
                  <HomeIcon className="h-4 w-4" />
                </Link>
              ) : (
                <>
                  <ChevronRightIcon className="h-4 w-4" />
                  {isLast ? (
                    <span className="text-foreground font-medium" aria-current="page">
                      {item.label}
                    </span>
                  ) : (
                    <Link to={item.href} className="hover:text-foreground transition-colors">
                      {item.label}
                    </Link>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
