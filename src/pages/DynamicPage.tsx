import { Suspense, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { loadDynamicPage } from "@/lib/dynamic-pages";
import { useAuth } from "@/contexts/AuthContext";
import type { ResourceInfo } from "@/types/auth";

function findResource(
  list: ResourceInfo[],
  code: string,
): ResourceInfo | undefined {
  for (const r of list) {
    if (r.resourceCode === code) return r;
    if (r.kidResource?.length) {
      const hit = findResource(r.kidResource, code);
      if (hit) return hit;
    }
  }
  return undefined;
}

const DynamicPage = () => {
  const { code = "" } = useParams<{ code: string }>();
  const { menus, permissions } = useAuth();

  const resource = useMemo(() => findResource(menus, code), [menus, code]);
  const Comp = useMemo(() => loadDynamicPage(code), [code]);

  useEffect(() => {
    document.title = resource?.resourceName
      ? `${resource.resourceName} · Mitrade Admin`
      : "Mitrade Admin";
  }, [resource]);

  // Permission check: code must be present in user's resource tree.
  if (!permissions.has(code)) {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold">无权限访问</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            您的角色未被授予访问 <code className="font-mono">{code}</code> 的权限。
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            加载页面…
          </div>
        }
      >
        {Comp ? (
          <Comp />
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-card p-8">
            <h1 className="text-lg font-semibold">
              {resource?.resourceName ?? code}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              此菜单尚未实现页面组件。请在
              <code className="mx-1 font-mono">
                src/pages/dynamic/{code}.tsx
              </code>
              中添加组件即可自动生效。
            </p>
            {resource?.actions?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {resource.actions.map((a) => (
                  <span
                    key={a}
                    className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {a}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </Suspense>
    </AdminLayout>
  );
};

export default DynamicPage;