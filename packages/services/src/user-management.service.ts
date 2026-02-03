import type { AxiosResponse } from "axios";
import { apiService } from "./api.service";
import { type ApiResponseBase, handleApiResponse } from "./api.service.base";
import type {
  CreateRoleRequest,
  CreateUserRequest,
  GetRolePageParams,
  GetUserPageParams,
  PagedResult,
  PermissionDto,
  RoleDetailDto,
  UpdateRolePermissionsRequest,
  UpdateRoleRequest,
  UpdateUserRequest,
  UserDetailDto,
} from "./user-management.types";

/**
 * 获取用户分页列表
 */
export async function getUserPage(
  params: GetUserPageParams,
): Promise<PagedResult<UserDetailDto>> {
  const response: AxiosResponse<ApiResponseBase<PagedResult<UserDetailDto>>> =
    await apiService.get<ApiResponseBase<PagedResult<UserDetailDto>>>("/users", params);
  const body = handleApiResponse(response, "获取用户列表失败");
  return body.data!;
}

/**
 * 根据 ID 获取用户详情
 */
export async function getUserById(id: number): Promise<UserDetailDto> {
  const response: AxiosResponse<ApiResponseBase<UserDetailDto>> =
    await apiService.get<ApiResponseBase<UserDetailDto>>(`/users/${id}`);
  const body = handleApiResponse(response, "获取用户详情失败");
  return body.data!;
}

/**
 * 创建用户
 */
export async function createUser(data: CreateUserRequest): Promise<UserDetailDto> {
  const response: AxiosResponse<ApiResponseBase<UserDetailDto>> =
    await apiService.post<ApiResponseBase<UserDetailDto>>("/users", data);
  const body = handleApiResponse(response, "创建用户失败");
  return body.data!;
}

/**
 * 更新用户
 */
export async function updateUser(id: number, data: UpdateUserRequest): Promise<void> {
  const response: AxiosResponse<ApiResponseBase<void>> =
    await apiService.put<ApiResponseBase<void>>(`/users/${id}`, data);
  handleApiResponse(response, "更新用户失败");
}

/**
 * 删除用户（软删除）
 */
export async function deleteUser(id: number): Promise<void> {
  const response: AxiosResponse<ApiResponseBase<void>> =
    await apiService.delete<ApiResponseBase<void>>(`/users/${id}`);
  handleApiResponse(response, "删除用户失败");
}

/**
 * 恢复已删除的用户
 */
export async function restoreUser(id: number): Promise<void> {
  const response: AxiosResponse<ApiResponseBase<void>> =
    await apiService.patch<ApiResponseBase<void>>(`/users/${id}/restore`);
  handleApiResponse(response, "恢复用户失败");
}

/**
 * 获取角色分页列表
 */
export async function getRolePage(
  params: GetRolePageParams,
): Promise<PagedResult<RoleDetailDto>> {
  const response: AxiosResponse<ApiResponseBase<PagedResult<RoleDetailDto>>> =
    await apiService.get<ApiResponseBase<PagedResult<RoleDetailDto>>>("/roles", params);
  const body = handleApiResponse(response, "获取角色列表失败");
  return body.data!;
}

/**
 * 根据 ID 获取角色详情
 */
export async function getRoleById(id: number): Promise<RoleDetailDto> {
  const response: AxiosResponse<ApiResponseBase<RoleDetailDto>> =
    await apiService.get<ApiResponseBase<RoleDetailDto>>(`/roles/${id}`);
  const body = handleApiResponse(response, "获取角色详情失败");
  return body.data!;
}

/**
 * 创建角色
 */
export async function createRole(data: CreateRoleRequest): Promise<RoleDetailDto> {
  const response: AxiosResponse<ApiResponseBase<RoleDetailDto>> =
    await apiService.post<ApiResponseBase<RoleDetailDto>>("/roles", data);
  const body = handleApiResponse(response, "创建角色失败");
  return body.data!;
}

/**
 * 更新角色
 */
export async function updateRole(id: number, data: UpdateRoleRequest): Promise<void> {
  const response: AxiosResponse<ApiResponseBase<void>> =
    await apiService.put<ApiResponseBase<void>>(`/roles/${id}`, data);
  handleApiResponse(response, "更新角色失败");
}

/**
 * 删除角色（软删除）
 */
export async function deleteRole(id: number): Promise<void> {
  const response: AxiosResponse<ApiResponseBase<void>> =
    await apiService.delete<ApiResponseBase<void>>(`/roles/${id}`);
  handleApiResponse(response, "删除角色失败");
}

/**
 * 恢复已删除的角色
 */
export async function restoreRole(id: number): Promise<void> {
  const response: AxiosResponse<ApiResponseBase<void>> =
    await apiService.patch<ApiResponseBase<void>>(`/roles/${id}/restore`);
  handleApiResponse(response, "恢复角色失败");
}

/**
 * 设置角色权限（幂等替换）
 */
export async function setRolePermissions(
  id: number,
  data: UpdateRolePermissionsRequest,
): Promise<void> {
  const response: AxiosResponse<ApiResponseBase<void>> =
    await apiService.put<ApiResponseBase<void>>(`/roles/${id}/permissions`, data);
  handleApiResponse(response, "设置角色权限失败");
}

/**
 * 获取所有权限列表
 */
export async function getPermissions(): Promise<PermissionDto[]> {
  const response: AxiosResponse<ApiResponseBase<PermissionDto[]>> =
    await apiService.get<ApiResponseBase<PermissionDto[]>>("/permissions");
  const body = handleApiResponse(response, "获取权限列表失败");
  return body.data!;
}
