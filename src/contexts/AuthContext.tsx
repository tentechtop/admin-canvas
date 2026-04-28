import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "@/api/auth";
import { tokenStore } from "@/lib/http";
import type {
  AdminUserDetail,
  AdminUserLoginReq,
  ResourceInfo,
} from "@/types/auth";

interface AuthContextValue {
  ready: boolean;
  user: AdminUserDetail | null;
  menus: ResourceInfo[];
  /** Flat set of resourceCodes + action codes (e.g. "system.user:add") the user can access. */
  permissions: Set<string>;
  /** Check if current user has a specific button/action permission. */
  hasAction: (resourceCode: string, action: string) => boolean;
  login: (req: AdminUserLoginReq) => Promise<void>;
  logout: () => Promise<void>;
  refreshMenus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function flattenCodes(list: ResourceInfo[] = [], acc = new Set<string>()) {
  for (const r of list) {
    if (r.resourceCode) acc.add(r.resourceCode);
    // Collect button/action permissions as "resourceCode:action"
    if (r.resourceCode && r.actions?.length) {
      for (const a of r.actions) {
        acc.add(`${r.resourceCode}:${a}`);
      }
    }
    if (r.kidResource?.length) flattenCodes(r.kidResource, acc);
  }
  return acc;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [menus, setMenus] = useState<ResourceInfo[]>([]);

  const refreshMenus = useCallback(async () => {
    const reply = await authApi.userMenu();
    setMenus(reply.resourceList ?? []);
  }, []);

  const bootstrap = useCallback(async () => {
    const t = tokenStore.get();
    if (!t) {
      setReady(true);
      return;
    }
    try {
      const detail = await authApi.detail(t);
      setUser(detail.userDetail ?? null);
      await refreshMenus();
    } catch {
      tokenStore.clear();
      setUser(null);
      setMenus([]);
    } finally {
      setReady(true);
    }
  }, [refreshMenus]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (req: AdminUserLoginReq) => {
      const reply = await authApi.login(req);
      if (!reply.token) throw new Error("登录失败:未返回 token");
      tokenStore.set(reply.token);
      setUser(reply.userDetail ?? null);
      await refreshMenus();
    },
    [refreshMenus],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore network errors during logout */
    }
    tokenStore.clear();
    setUser(null);
    setMenus([]);
  }, []);

  const permissions = useMemo(() => flattenCodes(menus), [menus]);

  const hasAction = useCallback(
    (resourceCode: string, action: string) =>
      permissions.has(`${resourceCode}:${action}`),
    [permissions],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      user,
      menus,
      permissions,
      hasAction,
      login,
      logout,
      refreshMenus,
    }),
    [ready, user, menus, permissions, hasAction, login, logout, refreshMenus],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}