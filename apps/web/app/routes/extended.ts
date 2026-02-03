import type { RouteConfigEntry } from "@react-router/dev/routes";
import { layout, route } from "@react-router/dev/routes";

export const extendedRoutes: RouteConfigEntry[] = [
  layout("./(admin)/layout.tsx", [
    route("/admin", "./(admin)/index.tsx"),
    // 用户管理（相对于 /admin，所以路径是 users）
    route("/admin/users", "./(admin)/users/page.tsx"),
    route("/admin/users/new", "./(admin)/users/new/page.tsx"),
    route("/admin/users/:id", "./(admin)/users/[id]/page.tsx"),
    // 角色管理
    route("/admin/roles", "./(admin)/roles/page.tsx"),
    route("/admin/roles/new", "./(admin)/roles/new/page.tsx"),
    route("/admin/roles/:id", "./(admin)/roles/[id]/page.tsx"),
    // 权限管理
    route("/admin/permissions", "./(admin)/permissions/page.tsx"),
  ]),
];
