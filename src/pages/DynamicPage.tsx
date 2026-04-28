import { Suspense, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { codeToPath, loadDynamicPage } from "@/lib/dynamic-pages";
import { useAuth } from "@/contexts/AuthContext";
import type { ResourceInfo } from "@/types/auth";

function normalizePath(path?: string) {
  if (!path) {
    return "/";
  }

  const normalized = path.replace(/^\/+|\/+$/g, "");
  return normalized ? `/${normalized}` : "/";
}

function findResource(
  list: ResourceInfo[],
  code: string,
  pathname: string,
): ResourceInfo | undefined {
  const normalizedPathname = normalizePath(pathname);

  for (const resource of list) {
    const resourcePath = normalizePath(
      resource.path || codeToPath(resource.resourceCode ?? ""),
    );

    if (
      resource.resourceCode === code ||
      resourcePath === normalizedPathname
    ) {
      return resource;
    }

    if (resource.kidResource?.length) {
      const hit = findResource(resource.kidResource, code, pathname);
      if (hit) {
        return hit;
      }
    }
  }

  return undefined;
}

const DynamicPage = () => {
  const location = useLocation();
  const code = location.pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .join(".");
  const { menus, permissions } = useAuth();

  const resource = useMemo(
    () => findResource(menus, code, location.pathname),
    [menus, code, location.pathname],
  );

  const permissionKey = resource?.resourceCode || code;
  const canAccess =
    Boolean(resource) ||
    permissions.has(permissionKey) ||
    permissions.has(code);

  const Comp = useMemo(() => {
    const candidates = [resource?.resourceCode, code].filter(
      (value): value is string => Boolean(value),
    );

    for (const candidate of candidates) {
      const page = loadDynamicPage(candidate);
      if (page) {
        return page;
      }
    }

    return null;
  }, [resource?.resourceCode, code]);

  useEffect(() => {
    document.title = resource?.resourceName
      ? `${resource.resourceName} | Mitrade Admin`
      : "Mitrade Admin";
  }, [resource]);

  if (!canAccess) {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <h1 className="text-lg font-semibold">No Access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your current role is not allowed to access{" "}
            <code className="font-mono">{permissionKey}</code>.
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
            Loading page...
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
              This menu is available, but the page component is not implemented
              yet. Add a component at
              <code className="mx-1 font-mono">
                src/pages/dynamic/{resource?.resourceCode ?? code}.tsx
              </code>
              and it will be picked up automatically.
            </p>
            {resource?.actions?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {resource.actions.map((action) => (
                  <span
                    key={action}
                    className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {action}
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
