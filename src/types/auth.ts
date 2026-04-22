// Generated from OpenAPI: mt-admin-auth-service.yaml

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  value: T;
}

export type UserStatus = "USER_UNKNOWN" | "USER_NORMAL" | "USER_DISABLE";

export interface AdminUserInfo {
  username?: string;
  userId?: string;
  createdAt?: number;
  status?: UserStatus;
  email?: string;
}

export interface AdminUserLoginInfo {
  lastLoginTime?: string;
  lastLoginIp?: string;
}

export interface AdminUserRoleInfo {
  roleCode?: string;
  roleName?: string;
  platformId?: number;
}

export interface AdminUserDetail {
  userInfo?: AdminUserInfo;
  loginInfo?: AdminUserLoginInfo;
  roleInfo?: AdminUserRoleInfo[];
}

export interface AdminUserLoginReq {
  email: string;
  password: string;
}

export interface AdminUserLoginReply {
  userDetail?: AdminUserDetail;
  token?: string;
}

export interface AdminUserDetailReq {
  token: string;
}

export interface AdminUserDetailReply {
  userDetail?: AdminUserDetail;
  message?: string;
  code?: number;
}

/** Type 1=menu, 2=function */
export type ResourceType = 1 | 2;

export interface ResourceInfo {
  resourceCode?: string;
  resourceName?: string;
  remark?: string;
  parentId?: number;
  path?: string;
  sort?: number;
  depth?: number;
  icon?: string;
  appName?: string;
  kidResource?: ResourceInfo[];
  actions?: string[];
  type?: ResourceType;
}

export interface GetUserMenuReq {
  platformCode: string;
}

export interface GetUserMenuReply {
  resourceList?: ResourceInfo[];
}