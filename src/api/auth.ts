import { http, PLATFORM_CODE, unwrap } from "@/lib/http";
import type {
  AdminUserDetailReply,
  AdminUserLoginReply,
  AdminUserLoginReq,
  GetUserMenuReply,
} from "@/types/auth";

export const authApi = {
  login: (req: AdminUserLoginReq) =>
    unwrap<AdminUserLoginReply>(
      http.post("/api/v1/sso/admin/login", req),
    ),

  detail: (token: string) =>
    unwrap<AdminUserDetailReply>(
      http.post("/api/v1/sso/admin/detail", { token }),
    ),

  logout: () =>
    unwrap<unknown>(http.post("/api/v1/sso/admin/logout", {})),

  userMenu: (platformCode: string = PLATFORM_CODE) =>
    unwrap<GetUserMenuReply>(
      http.post("/api/v1/admin/user/menu", { platformCode }),
    ),
};