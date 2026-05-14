import type {
  AdminUserDetail,
  AdminUserLoginReply,
  AdminUserDetailReply,
  GetUserMenuReply,
  ResourceInfo,
} from "@/types/auth";

/* ---------- mock user database ---------- */

export const MOCK_EMAIL = "admin@mitrade.com";
export const MOCK_PASSWORD = "admin123";

const MOCK_TOKEN = "mock-token-admin-2026";

const mockUserDetail: AdminUserDetail = {
  userInfo: {
    username: "Admin",
    userId: "mock-user-001",
    createdAt: Date.now(),
    status: "USER_NORMAL",
    email: MOCK_EMAIL,
  },
  loginInfo: {
    lastLoginTime: new Date().toISOString(),
    lastLoginIp: "127.0.0.1",
  },
  roleInfo: [
    {
      roleCode: "super_admin",
      roleName: "超级管理员",
      platformId: 1,
    },
  ],
};

/* ---------- mock menu tree ---------- */

const mockMenus: ResourceInfo[] = [
  {
    resourceCode: "dashboard",
    resourceName: "仪表盘",
    path: "/dashboard",
    icon: "LayoutDashboard",
    sort: 1,
    type: 1,
  },
  {
    resourceCode: "system",
    resourceName: "系统管理",
    icon: "Settings",
    sort: 2,
    type: 1,
    kidResource: [
      {
        resourceCode: "system.user",
        resourceName: "用户管理",
        path: "/system/user",
        icon: "Users",
        sort: 1,
        type: 1,
        actions: ["add", "edit", "delete", "export"],
      },
      {
        resourceCode: "system.role",
        resourceName: "角色管理",
        path: "/system/role",
        icon: "Shield",
        sort: 2,
        type: 1,
        actions: ["add", "edit", "delete"],
      },
      {
        resourceCode: "system.menu",
        resourceName: "菜单管理",
        path: "/system/menu",
        icon: "Menu",
        sort: 3,
        type: 1,
        actions: ["add", "edit", "delete"],
      },
    ],
  },
  {
    resourceCode: "content",
    resourceName: "内容管理",
    icon: "FileText",
    sort: 3,
    type: 1,
    kidResource: [
      {
        resourceCode: "content.article",
        resourceName: "文章管理",
        path: "/content/article",
        icon: "Newspaper",
        sort: 1,
        type: 1,
        actions: ["add", "edit", "delete", "publish"],
      },
      {
        resourceCode: "content.category",
        resourceName: "分类管理",
        path: "/content/category",
        icon: "FolderTree",
        sort: 2,
        type: 1,
        actions: ["add", "edit", "delete"],
      },
    ],
  },
  {
    resourceCode: "monitor",
    resourceName: "监控中心",
    icon: "Activity",
    sort: 4,
    type: 1,
    kidResource: [
      {
        resourceCode: "monitor.log",
        resourceName: "操作日志",
        path: "/monitor/log",
        icon: "ScrollText",
        sort: 1,
        type: 1,
        actions: ["view", "export"],
      },
      {
        resourceCode: "monitor.online",
        resourceName: "在线用户",
        path: "/monitor/online",
        icon: "Wifi",
        sort: 2,
        type: 1,
        actions: ["view", "kick"],
      },
    ],
  },
  {
    resourceCode: "KOL_SETTLEMENT_CENTER",
    resourceName: "Settlement Center",
    path: "/settlement-center",
    icon: "Wallet",
    sort: 5,
    type: 1,
    kidResource: [
      {
        resourceCode: "KOL_SETTLEMENT_DASHBOARD",
        resourceName: "Settlement Dashboard",
        path: "/settlement-center/dashboard",
        icon: "LayoutDashboard",
        sort: 1,
        type: 1,
      },
      {
        resourceCode: "KOL_SETTLEMENT_TRANSACTION_RECORDS",
        resourceName: "Transaction Records",
        path: "/settlement-center/transaction-records",
        icon: "ScrollText",
        sort: 2,
        type: 1,
      },
      {
        resourceCode: "KOL_SETTLEMENT_KOL_COMMISSION",
        resourceName: "KOL Commission",
        path: "/settlement-center/kol-commission",
        icon: "Banknote",
        sort: 3,
        type: 1,
      },
      {
        resourceCode: "KOL_SETTLEMENT_STATEMENT",
        resourceName: "Settlement Statement",
        path: "/settlement-center/statement",
        icon: "FileText",
        sort: 4,
        type: 1,
      },
      {
        resourceCode: "KOL_SETTLEMENT_WITHDRAWAL_REVIEW",
        resourceName: "Withdrawal Review",
        path: "/settlement-center/withdrawal-review",
        icon: "ClipboardCheck",
        sort: 5,
        type: 1,
      },
      {
        resourceCode: "KOL_SETTLEMENT_PAYMENT_SUMMARY",
        resourceName: "Payment Summary",
        path: "/settlement-center/payment-summary",
        icon: "Files",
        sort: 6,
        type: 1,
      },
      {
        resourceCode: "KOL_SETTLEMENT_PAYMENT_EXECUTION",
        resourceName: "Payment Execution",
        path: "/settlement-center/payment-execution",
        icon: "Banknote",
        sort: 7,
        type: 1,
      },
      {
        resourceCode: "KOL_SETTLEMENT_HISTORY",
        resourceName: "Settlement History",
        path: "/settlement-center/history",
        icon: "History",
        sort: 8,
        type: 1,
      },
      {
        resourceCode: "KOL_SETTLEMENT_EXCEPTION",
        resourceName: "Settlement Exception",
        path: "/settlement-center/exception",
        icon: "TriangleAlert",
        sort: 9,
        type: 1,
      },
      {
        resourceCode: "KOL_SETTLEMENT_CONFIG",
        resourceName: "Settlement Config",
        path: "/settlement-center/config",
        icon: "SlidersHorizontal",
        sort: 10,
        type: 1,
      },
    ],
  },
  {
    resourceCode: "log",
    resourceName: "Logs",
    icon: "ScrollText",
    sort: 6,
    type: 1,
    kidResource: [
      {
        resourceCode: "log.kol-log",
        resourceName: "KOL Logs",
        path: "/log/kol-log",
        icon: "ScrollText",
        sort: 1,
        type: 1,
      },
    ],
  },
];

/* ---------- mock route handlers ---------- */

type MockResponse = { status: number; data: { success: boolean; message: string; value: unknown } };

function handleMock(url: string, body: unknown): MockResponse | null {
  const handlers: Record<string, (b: unknown) => MockResponse> = {
    "/api/v1/sso/admin/login": (b) => {
      const { email, password } = b as { email: string; password: string };
      if (email === MOCK_EMAIL && password === MOCK_PASSWORD) {
        const reply: AdminUserLoginReply = {
          token: MOCK_TOKEN,
          userDetail: mockUserDetail,
        };
        return { status: 200, data: { success: true, message: "ok", value: reply } };
      }
      return { status: 200, data: { success: false, message: "邮箱或密码错误", value: null } };
    },

    "/api/v1/sso/admin/detail": (b) => {
      const { token } = b as { token: string };
      if (token === MOCK_TOKEN) {
        const reply: AdminUserDetailReply = { userDetail: mockUserDetail };
        return { status: 200, data: { success: true, message: "ok", value: reply } };
      }
      return { status: 401, data: { success: false, message: "token 无效", value: null } };
    },

    "/api/v1/sso/admin/logout": () => {
      return { status: 200, data: { success: true, message: "ok", value: null } };
    },

    "/api/v1/admin/user/menu": () => {
      const reply: GetUserMenuReply = { resourceList: mockMenus };
      return { status: 200, data: { success: true, message: "ok", value: reply } };
    },
  };

  const handler = handlers[url];
  if (!handler) return null;
  return handler(body);
}

/**
 * Axios adapter that intercepts mock routes.
 * Returns null if the URL is not a mock route (falls through to real network).
 */
export function mockAdapter(config: import("axios").InternalAxiosRequestConfig): Promise<import("axios").AxiosResponse> | null {
  const url = config.url ?? "";

  let body: unknown;
  if (typeof config.data === "string") {
    try {
      body = JSON.parse(config.data);
    } catch {
      body = config.data;
    }
  } else {
    body = config.data;
  }

  const result = handleMock(url, body);
  if (!result) return null; // not a mock route

  return Promise.resolve({
    data: result.data,
    status: result.status,
    statusText: result.status === 200 ? "OK" : "Error",
    headers: {} as Record<string, string>,
    config,
  });
}

export const isMockEnabled = import.meta.env.VITE_MOCK === "true";
