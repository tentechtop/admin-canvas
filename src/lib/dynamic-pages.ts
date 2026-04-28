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

const pageAliases: Array<{
  file: string;
  test: (code: string) => boolean;
}> = [
  {
    file: "../pages/dynamic/kol-audit.tsx",
    test: (code) =>
      /(kol[._-]?(audit|review|console)|affiliate[._-]?(audit|review)|kyc|traffic[._-]?review)/i.test(
        code,
      ),
  },
  {
    file: "../pages/dynamic/kol-manage.tsx",
    test: (code) =>
      /(kol[._-]?(manage|admin)?[._-]?(list|stat|stats|statistics|performance))/i.test(
        code,
      ) &&
      !/(audit|review|console)/i.test(code),
  },
  {
    file: "../pages/dynamic/role-data-permission.tsx",
    test: (code) =>
      /(role[._-]?data[._-]?permission|data[._-]?permission[._-]?role)/i.test(
        code,
      ),
  },
  {
    file: "../pages/dynamic/role-permission.tsx",
    test: (code) =>
      /(role[._-]?permission|permission[._-]?scenario)/i.test(code) &&
      !/role[._-]?data[._-]?permission/i.test(code),
  },
];

function findLoader(code: string) {
  const wanted = `../pages/dynamic/${code}.tsx`;
  if (modules[wanted]) {
    return modules[wanted];
  }

  const normalized = code.trim().toLowerCase();
  const alias = pageAliases.find((item) => item.test(normalized));
  return alias ? modules[alias.file] : undefined;
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
