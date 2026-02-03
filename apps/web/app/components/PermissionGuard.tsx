import type { UserInfo } from "@repo/services";
import { usePermissions } from "@repo/utils";

interface PermissionGuardProps {
  children: React.ReactNode;
  /** 需要单个角色 */
  requiredRole?: string;
  /** 需要单个权限 */
  requiredPermission?: string;
  /** 需要任意一个角色（满足其中一个即可） */
  requiredRoles?: string[];
  /** 需要所有角色（必须全部满足） */
  requiredAllRoles?: string[];
  /** 无权限时显示的内容 */
  fallback?: React.ReactNode;
  /** 用户信息（可选，用于权限检查） */
  userInfo?: UserInfo | null;
}

/**
 * 权限守卫组件
 * 根据权限条件决定是否渲染子组件
 */
export function PermissionGuard({
  children,
  requiredRole,
  requiredPermission,
  requiredRoles,
  requiredAllRoles,
  fallback = null,
  userInfo,
}: PermissionGuardProps) {
  const { hasRole, hasPermission, hasAnyRole, hasAllRoles } = usePermissions(userInfo);

  // 检查单个角色
  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  // 检查单个权限
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  // 检查任意一个角色
  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  // 检查所有角色
  if (requiredAllRoles && requiredAllRoles.length > 0 && !hasAllRoles(requiredAllRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
