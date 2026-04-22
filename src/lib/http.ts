import axios, { AxiosError, AxiosInstance } from "axios";
import { toast } from "sonner";
import type { ApiResponse } from "@/types/auth";

const TOKEN_KEY = "mt_admin_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY) ?? "",
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const baseURL =
  import.meta.env.VITE_API_BASE_URL ??
  "https://demo-admin.mitrade.com/admin-auth-service";

export const PLATFORM_CODE: string =
  (import.meta.env.VITE_PLATFORM_CODE as string) ?? "admin";

export const http: AxiosInstance = axios.create({
  baseURL,
  timeout: 20_000,
});

http.interceptors.request.use((cfg) => {
  const t = tokenStore.get();
  if (t) {
    cfg.headers.set("Authorization", `Bearer ${t}`);
    cfg.headers.set("token", t);
  }
  return cfg;
});

http.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiResponse>) => {
    const status = err.response?.status;
    const msg =
      err.response?.data?.message ?? err.message ?? "请求失败,请稍后再试";
    if (status === 401) {
      tokenStore.clear();
      if (!location.pathname.startsWith("/login")) {
        location.href = `/login?redirect=${encodeURIComponent(
          location.pathname,
        )}`;
      }
    } else {
      toast.error(msg);
    }
    return Promise.reject(err);
  },
);

/** Unwraps the standard ApiResponse envelope and throws on success=false. */
export async function unwrap<T>(p: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await p;
  if (!data.success) {
    toast.error(data.message || "操作失败");
    throw new Error(data.message || "Request not successful");
  }
  return data.value;
}