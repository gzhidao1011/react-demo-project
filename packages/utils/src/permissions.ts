import type { UserInfo } from "@repo/types";
import { useMemo } from "react";
import { getAccessToken } from "./auth";

/**
 * 权限管理 Hook
 * 从 Token 或用户信息中获取角色和权限
 */
export function usePermissions(userInfo?: UserInfo | null) {
  const permissions = useMemo(() => {
    // 优先使用传入的 userInfo
    if (userInfo?.roles) {
      return {
        roles: userInfo.roles || [],
        permissions: [], // 权限信息通常需要从后端获取，这里先返回空数组
      };
    }

    // 否则从 Token 中解析
    const token = getAccessToken();
    if (!token) {
      return { roles: [], permissions: [] };
    }

    try {
      // JWT Token 格式: header.payload.signature
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        roles: payload.roles || [],
        permissions: payload.permissions || [],
      };
    } catch {
      return { roles: [], permissions: [] };
    }
  }, [userInfo]);

  /**
   * 检查是否拥有指定角色
   */
  const hasRole = (role: string): boolean => {
    return permissions.roles.includes(role);
  };

  /**
   * 检查是否拥有指定权限
   */
  const hasPermission = (permission: string): boolean => {
    return permissions.permissions.includes(permission);
  };

  /**
   * 检查是否拥有任意一个指定角色
   */
  const hasAnyRole = (roles: string[]): boolean => {
    return roles.some((role) => hasRole(role));
  };

  /**
   * 检查是否拥有所有指定角色
   */
  const hasAllRoles = (roles: string[]): boolean => {
    return roles.every((role) => hasRole(role));
  };

  /**
   * 检查是否为管理员（拥有 ADMIN 角色）
   */
  const isAdmin = (): boolean => {
    return hasRole("ADMIN") || hasRole("admin");
  };

  return {
    ...permissions,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
    isAdmin,
  };
}
