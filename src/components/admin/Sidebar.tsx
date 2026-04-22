import {
  ChevronDown,
  Database,
  Gamepad2,
  Github,
  HelpCircle,
  LayoutDashboard,
  LayoutGrid,
  LifeBuoy,
  Lock,
  Rocket,
  Settings,
  ShoppingBag,
  SquareStack,
} from "lucide-react";

type NavItem = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  hasChildren?: boolean;
};

const mainNav: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Layouts", icon: LayoutGrid, hasChildren: true },
  { label: "CRUD", icon: Database, hasChildren: true },
  { label: "Settings", icon: Settings, hasChildren: true },
  { label: "Pages", icon: SquareStack, hasChildren: true },
  { label: "Authentication", icon: Lock, hasChildren: true },
  { label: "Playground", icon: Gamepad2, hasChildren: true },
];

const secondaryNav: NavItem[] = [
  { label: "Quickstart", icon: Rocket },
  { label: "GitHub Repository", icon: Github },
  { label: "Flowbite Svelte", icon: ShoppingBag },
  { label: "Components", icon: LayoutGrid },
  { label: "Support", icon: LifeBuoy },
];

const NavRow = ({ item }: { item: NavItem }) => {
  const Icon = item.icon;
  return (
    <button
      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        item.active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 text-left">{item.label}</span>
      {item.hasChildren && <ChevronDown className="h-4 w-4 opacity-60" />}
    </button>
  );
};

const Sidebar = () => {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
      <nav className="flex h-[calc(100vh-4rem)] flex-col gap-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {mainNav.map((item) => (
            <NavRow key={item.label} item={item} />
          ))}
        </div>

        <div className="my-3 border-t border-sidebar-border" />

        <div className="space-y-1">
          {secondaryNav.map((item) => (
            <NavRow key={item.label} item={item} />
          ))}
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