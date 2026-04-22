import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { codeToPath } from "@/lib/dynamic-pages";
import type { ResourceInfo } from "@/types/auth";

function firstMenuCode(list: ResourceInfo[]): string | null {
  const menus = list
    .filter((r) => r.type !== 2)
    .sort((a, b) => (a.sort ?? 9999) - (b.sort ?? 9999));
  for (const m of menus) {
    const kids = (m.kidResource ?? []).filter((k) => k.type !== 2);
    if (kids.length === 0 && m.resourceCode) return m.resourceCode;
    const childCode = firstMenuCode(m.kidResource ?? []);
    if (childCode) return childCode;
    if (m.resourceCode) return m.resourceCode;
  }
  return null;
}

const Index = () => {
  const { menus } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Mitrade Admin";
    const desc =
      "Mitrade 管理后台,基于角色权限的动态菜单与页面控制。";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  useEffect(() => {
    const code = firstMenuCode(menus);
    if (code) navigate(codeToPath(code), { replace: true });
  }, [menus, navigate]);

  return (
    <AdminLayout>
      <h1 className="sr-only">Mitrade Admin</h1>
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          {menus.length === 0
            ? "暂无可用菜单,请联系管理员分配权限。"
            : "正在跳转到您的默认页面…"}
        </p>
      </div>
    </AdminLayout>
  );
};

export default Index;
