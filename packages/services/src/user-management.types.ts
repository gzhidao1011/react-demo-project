/**
 * 用户与权限管理相关类型定义
 * 与后端 DTO 字段对齐（camelCase）
 */

/**
 * 分页请求参数
 */
export interface PageRequest {
  /** 页码（从 1 开始） */
  page: number;
  /** 每页大小 */
  size: number;
  /** 排序字段（可选，格式：field,asc 或 field,desc） */
  sort?: string;
}

/**
 * 分页响应结果
 */
export interface PagedResult<T> {
  /** 数据列表 */
  items: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页大小 */
  size: number;
}

/**
 * 角色摘要 DTO
 */
export interface RoleSummaryDto {
  id: number;
  code: string;
  name: string;
}

/**
 * 用户详情 DTO
 */
export interface UserDetailDto {
  id: number;
  name: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt?: string | null; // ISO 8601
  roles: RoleSummaryDto[];
}

/**
 * 权限 DTO
 */
export interface PermissionDto {
  id: number;
  resource: string;
  action: string;
  description?: string;
}

/**
 * 角色详情 DTO
 */
export interface RoleDetailDto {
  id: number;
  name: string;
  code: string;
  description?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  deletedAt?: string | null; // ISO 8601
  permissions: PermissionDto[];
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  roleIds?: number[];
}

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
  name: string;
  email: string;
  phone?: string;
  roleIds?: number[];
}

/**
 * 创建角色请求
 */
export interface CreateRoleRequest {
  name: string;
  code: string;
  description?: string;
  permissionIds?: number[];
}

/**
 * 更新角色请求
 */
export interface UpdateRoleRequest {
  name: string;
  code: string;
  description?: string;
}

/**
 * 更新角色权限请求
 */
export interface UpdateRolePermissionsRequest {
  permissionIds: number[];
}

/**
 * 用户列表查询参数（扩展 PageRequest）
 */
export interface GetUserPageParams extends PageRequest {
  /** 邮箱筛选 */
  email?: string;
  /** 姓名筛选 */
  name?: string;
  /** 角色筛选 */
  role?: string;
  /** 是否包含已删除用户 */
  deleted?: boolean;
}

/**
 * 角色列表查询参数（扩展 PageRequest）
 */
export interface GetRolePageParams extends PageRequest {
  /** 是否包含已删除角色 */
  deleted?: boolean;
}
