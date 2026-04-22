import { useMemo, useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { codeToPath } from "@/lib/dynamic-pages";
import { resolveIcon } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import type { ResourceInfo } from "@/types/auth";

/** Sort by `sort` ascending, missing values last. */
const bySort = (a: ResourceInfo, b: ResourceInfo) =>
  (a.sort ?? 9999) - (b.sort ?? 9999);

/** Only render type=1 (menu) items; type=2 (function/action) is permission-only. */
const menusOnly = (list: ResourceInfo[]) =>
  list.filter((r) => r.type !== 2).sort(bySort);

const MenuLink = ({ item }: { item: ResourceInfo }) => {
  const Icon = resolveIcon(item.icon);
  return (
    <NavLink
      to={codeToPath(item.resourceCode ?? "")}
      className={({ isActive }) =>
        cn(
          "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )
      }
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-left">{item.resourceName}</span>
    </NavLink>
  );
};

const MenuGroup = ({ item }: { item: ResourceInfo }) => {
  const Icon = resolveIcon(item.icon);
  const location = useLocation();
  const children = menusOnly(item.kidResource ?? []);
  const childPaths = children.map((c) => codeToPath(c.resourceCode ?? ""));
  const containsActive = childPaths.some((p) => location.pathname.startsWith(p));
  const [open, setOpen] = useState(containsActive);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{item.resourceName}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="ml-4 mt-1 space-y-1 border-l border-sidebar-border pl-3">
          {children.map((c) =>
            (c.kidResource ?? []).some((k) => k.type !== 2) ? (
              <MenuGroup key={c.resourceCode} item={c} />
            ) : (
              <MenuLink key={c.resourceCode} item={c} />
            ),
          )}
        </div>
      )}
    </div>
  );
};

const Sidebar = () => {
  const { menus } = useAuth();
  const top = useMemo(() => menusOnly(menus), [menus]);

  return (
    <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
      <nav className="flex h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {top.length === 0 && (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              暂无可用菜单
            </div>
          )}
          {top.map((item) =>
            (item.kidResource ?? []).some((k) => k.type !== 2) ? (
              <MenuGroup key={item.resourceCode} item={item} />
            ) : (
              <MenuLink key={item.resourceCode} item={item} />
            ),
          )}
        </div>

        <div className="mt-auto flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" /> v2.4
          </span>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;