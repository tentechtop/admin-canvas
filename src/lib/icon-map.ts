import {
  Database,
  FileText,
  Gamepad2,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  Lock,
  LucideIcon,
  Settings,
  ShoppingBag,
  SquareStack,
  Users,
} from "lucide-react";

/**
 * Map backend icon string -> lucide component. Backend may send arbitrary
 * strings; unknown icons fall back to a sensible default.
 */
const map: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  home: Home,
  layout: LayoutGrid,
  layouts: LayoutGrid,
  database: Database,
  crud: Database,
  settings: Settings,
  pages: SquareStack,
  page: FileText,
  auth: Lock,
  authentication: Lock,
  lock: Lock,
  user: Users,
  users: Users,
  shop: ShoppingBag,
  shopping: ShoppingBag,
  playground: Gamepad2,
  support: LifeBuoy,
};

export function resolveIcon(name?: string): LucideIcon {
  if (!name) return SquareStack;
  const key = name.toLowerCase();
  return map[key] ?? SquareStack;
}