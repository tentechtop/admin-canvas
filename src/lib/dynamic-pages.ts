import { ComponentType, lazy } from "react";

/**
 * Convention-based page loader.
 *
 * Drop a file at `src/pages/dynamic/<resourceCode>.tsx` and it becomes the
 * page rendered when the user navigates to a menu whose `resourceCode`
 * matches. Unknown codes fall back to the placeholder page.
 */
const modules = import.meta.glob<{ default: ComponentType<unknown> }>(
  "../pages/dynamic/*.tsx",
);

const componentCache = new Map<string, ReturnType<typeof lazy>>();

function findLoader(code: string) {
  const wanted = `../pages/dynamic/${code}.tsx`;
  return modules[wanted];
}

export function hasDynamicPage(code: string): boolean {
  return Boolean(findLoader(code));
}

export function loadDynamicPage(code: string) {
  const cached = componentCache.get(code);
  if (cached) return cached;

  const loader = findLoader(code);
  if (!loader) return null;

  const Comp = lazy(loader);
  componentCache.set(code, Comp);
  return Comp;
}

/** Convert a resourceCode into a URL path: `dashboard.users` -> `/dashboard/users`. */
export function codeToPath(code: string): string {
  return "/" + code.replace(/\./g, "/").replace(/^\/+/, "");
}